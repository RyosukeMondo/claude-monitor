#!/usr/bin/env python3
"""
Claude Monitor Daemon module

This module defines the `ClaudeMonitorDaemon` class that orchestrates all monitoring components
for the Claude Code auto-recovery system.
"""

import sys
import os
import time
import threading
from typing import Dict, Any, Optional
from datetime import datetime
import traceback

# Ensure local src directory is on path when imported directly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from monitor_logging import get_logger, initialize_logging
from status.status_reporter import log_status_report
from system.signal_handler import register_signal_handlers
from orchestration.component_manager import start_components as cm_start_components, stop_components as cm_stop_components
from orchestration.component_factory import init_components as cf_init_components
from status.logging_config import transform_logging_config as lg_transform_logging_config
from orchestration.callbacks import configure_callbacks as oc_configure_callbacks
from orchestration.monitor_loop import process_monitoring_cycle as ml_process_cycle
from config.loader import load_config_dict
from config.reloader import reload_config_internal as cfg_reload_internal
from status.statistics import get_daemon_statistics as st_get_daemon_statistics


 

class ClaudeMonitorDaemon:
    """
    Main monitoring daemon that orchestrates all components.
    
    Provides centralized management of all monitoring components with proper
    lifecycle management, signal handling, and error propagation.
    """
    
    def __init__(self, config_path: Optional[str] = None, debug: bool = False):
        """
        Initialize the monitoring daemon.
        
        Args:
            config_path: Path to configuration file
            debug: Enable debug mode
        """
        self.config_path = config_path
        self.debug = debug
        
        # Load configuration (delegated to config.loader)
        self.config = load_config_dict(config_path)
        
        # Setup logging - transform config to expected format
        logging_config = self._transform_logging_config(self.config.get('logging', {}))
        initialize_logging(logging_config)
        self.logger = get_logger('claude_monitor_daemon')
        
        # Daemon state
        self._running = False
        self._shutdown_requested = False
        self._reload_requested = False
        self._start_time = datetime.now()
        self._main_thread: Optional[threading.Thread] = None
        self._lock = threading.RLock()
        # Track last detected state and idle phases
        self._last_detected_state: ClaudeState = ClaudeState.UNKNOWN
        self._last_idle_clear_at: Optional[float] = None
        self._last_idle_prompt_at: Optional[float] = None
        # Bootstrap flag for fresh Claude sessions
        self._pending_bootstrap: bool = False
        # Track when /clear completion was observed in logs
        self._clear_completed_at: Optional[float] = None
        # Track bootstrap clear phase to avoid repeated /clear
        self._bootstrap_cleared: bool = False
        # Track last time ACTIVE was seen to implement KISS post-run behavior
        self._last_active_seen_at: Optional[float] = None
        # Track last time we ran automatic post-run clear/prompt to avoid duplicates
        self._last_postrun_action_at: Optional[float] = None
        # Throttle decision execution frequency (seconds). Bypass on state change.
        try:
            self._decision_min_interval_sec: float = float(os.environ.get('CLAUDE_MONITOR_DECISION_MIN_INTERVAL_SEC') or \
                self.config.get('monitoring', {}).get('decisions_min_interval_sec', 5.0))
        except Exception:
            self._decision_min_interval_sec = 5.0
        self._last_decision_ts: Optional[float] = None
        # Track whether we've sent an idle-period /clear since the last non-IDLE state
        self._idle_period_cleared: bool = False
        # Fallback window to bypass waiting for explicit /clear completion before prompting
        try:
            self._clear_completion_fallback_sec: float = float(os.environ.get('CLAUDE_MONITOR_CLEAR_COMPLETION_FALLBACK_SEC') or \
                self.config.get('monitoring', {}).get('clear_completion_fallback_sec', 30.0))
        except Exception:
            self._clear_completion_fallback_sec = 30.0
        # Require several consecutive detections before acting to avoid flapping
        try:
            self._consec_idle_required: int = int(os.environ.get('CLAUDE_MONITOR_CONSEC_IDLE_REQUIRED') or \
                self.config.get('monitoring', {}).get('consecutive_idle_required', 3))
        except Exception:
            self._consec_idle_required = 3
        self._consec_idle_count: int = 0
        self._consec_active_count: int = 0
        # Consider as IDLE if no new log output for this duration (seconds)
        try:
            self._inactivity_idle_sec: float = float(os.environ.get('CLAUDE_MONITOR_INACTIVITY_IDLE_SEC') or \
                self.config.get('monitoring', {}).get('inactivity_idle_sec', 5.0))
        except Exception:
            self._inactivity_idle_sec = 5.0
        # Per-state recovery throttling (seconds)
        self._last_recovery_by_state: Dict[str, float] = {}
        self._min_recovery_interval_sec: float = 2.0
        
        # Components
        self._components: Dict[str, Any] = {}
        self._component_threads: Dict[str, threading.Thread] = {}
        
        # Statistics
        self._stats = {
            'start_time': self._start_time,
            'uptime_seconds': 0,
            'restarts': 0,
            'config_reloads': 0,
            'total_detections': 0,
            'total_recoveries': 0,
            'errors': 0
        }
        
        self.logger.info("Claude Monitor daemon initialized")
        
    def _transform_logging_config(self, logging_config: Dict[str, Any]) -> Dict[str, Any]:
        """Transform YAML logging config to MonitorLogger format (delegated)."""
        return lg_transform_logging_config(logging_config)
        
    def _init_components(self):
        """Initialize all monitoring components (delegated)."""
        cf_init_components(self)
            
    def _setup_component_callbacks(self):
        """Setup callbacks between components for proper integration (delegated)."""
        oc_configure_callbacks(self)
            
    def _setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown and reload (delegated)."""
        register_signal_handlers(
            on_stop=lambda: (self.logger.info("Shutdown requested via signal"), self.stop()),
            on_reload=lambda: (self.logger.info("Configuration reload requested via signal"), self.reload_config()),
            on_status=lambda: (self.logger.info("Status report requested via signal"), self._log_status_report()),
            logger=self.logger,
        )
        self.logger.info("Signal handlers registered")
        
    def _start_components(self):
        """Start all monitoring components (delegated)."""
        cm_start_components(self)
            
    def _stop_components(self):
        """Stop all monitoring components gracefully (delegated)."""
        cm_stop_components(self)
            
    def _main_loop(self):
        """Main monitoring loop."""
        self.logger.info("Starting main monitoring loop")
        
        loop_interval = self.config.get('daemon', {}).get('loop_interval', 5.0)
        status_report_interval = self.config.get('daemon', {}).get('status_report_interval', 300.0)
        last_status_report = time.time()
        
        try:
            while not self._shutdown_requested:
                try:
                    # Update uptime
                    self._stats['uptime_seconds'] = (datetime.now() - self._start_time).total_seconds()
                    
                    # Handle configuration reload
                    if self._reload_requested:
                        self._reload_config_internal()
                        self._reload_requested = False
                    
                    # Periodic status report
                    now = time.time()
                    if now - last_status_report >= status_report_interval:
                        self._log_status_report()
                        last_status_report = now
                    
                    # Main monitoring logic
                    ml_process_cycle(self)
                    
                    # Sleep until next cycle
                    time.sleep(loop_interval)
                    
                except KeyboardInterrupt:
                    self.logger.info("Keyboard interrupt received")
                    break
                except Exception as e:
                    self.logger.error(f"Error in main loop: {e}")
                    self._stats['errors'] += 1
                    if self.debug:
                        self.logger.error(f"Traceback: {traceback.format_exc()}")
                    time.sleep(1.0)  # Brief pause before retrying
                    
        except Exception as e:
            self.logger.critical(f"Fatal error in main loop: {e}")
            if self.debug:
                self.logger.critical(f"Traceback: {traceback.format_exc()}")
        finally:
            self.logger.info("Main monitoring loop finished")
            
    def _log_status_report(self):
        """Log a status report of all components (delegated)."""
        log_status_report(self)
            
    def _reload_config_internal(self):
        """Internal configuration reload implementation (delegated)."""
        cfg_reload_internal(self)
            
    def start(self):
        """Start the monitoring daemon."""
        with self._lock:
            if self._running:
                self.logger.warning("Daemon is already running")
                return False
                
            try:
                self.logger.info("Starting Claude Monitor daemon...")
                
                # Setup signal handlers
                self._setup_signal_handlers()
                
                # Initialize components
                self._init_components()
                
                # Start components
                self._start_components()
                
                # Start main loop in separate thread
                self._running = True
                self._main_thread = threading.Thread(target=self._main_loop, daemon=False)
                self._main_thread.start()
                
                # Send startup notification
                if 'notifier' in self._components:
                    self._components['notifier'].notify_info(
                        "Claude Monitor Started",
                        f"Monitoring daemon started with {len(self._components)} components"
                    )
                
                self.logger.info("Claude Monitor daemon started successfully")
                return True
                
            except Exception as e:
                self.logger.critical(f"Failed to start daemon: {e}")
                self._running = False
                raise
                
    def stop(self):
        """Stop the monitoring daemon gracefully."""
        with self._lock:
            if not self._running:
                self.logger.warning("Daemon is not running")
                return
                
            try:
                self.logger.info("Stopping Claude Monitor daemon...")
                
                # Request shutdown
                self._shutdown_requested = True
                
                # Send shutdown notification
                if 'notifier' in self._components:
                    try:
                        self._components['notifier'].notify_info(
                            "Claude Monitor Stopping",
                            "Monitoring daemon is shutting down"
                        )
                    except:
                        pass  # Don't fail shutdown on notification error
                
                # Wait for main thread to finish
                if self._main_thread and self._main_thread.is_alive():
                    self.logger.info("Waiting for main thread to finish...")
                    self._main_thread.join(timeout=10.0)
                    if self._main_thread.is_alive():
                        self.logger.warning("Main thread did not finish cleanly")
                
                # Stop components
                self._stop_components()
                
                self._running = False
                uptime = (datetime.now() - self._start_time).total_seconds()
                self.logger.info(f"Claude Monitor daemon stopped (uptime: {uptime:.2f}s)")
                
            except Exception as e:
                self.logger.error(f"Error stopping daemon: {e}")
                
    def reload_config(self):
        """Request configuration reload."""
        with self._lock:
            if not self._running:
                self.logger.warning("Cannot reload config - daemon not running")
                return
                
            self._reload_requested = True
            self.logger.info("Configuration reload requested")
            
    def is_running(self) -> bool:
        """Check if daemon is running."""
        with self._lock:
            return self._running
            
    def wait(self):
        """Wait for daemon to finish."""
        if self._main_thread:
            self._main_thread.join()
            
    def get_statistics(self) -> Dict[str, Any]:
        """Get daemon statistics (delegated)."""
        return st_get_daemon_statistics(self)

