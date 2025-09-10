#!/usr/bin/env python3
"""
Claude Monitor - Main monitoring daemon.

This is the main entry point that orchestrates all monitoring components and integrates
all requirements for the Claude Code auto-recovery system.

Features:
- Component orchestration and lifecycle management
- Signal handling for graceful shutdown and configuration reload
- Main monitoring loop with proper error handling
- Resource management and cleanup
"""

import sys
import os
import signal
import time
import threading
import argparse
from typing import Dict, Any, Optional
from datetime import datetime
import json
import traceback

# Add src directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import all monitoring components
import yaml
from monitor_logging import get_logger, initialize_logging
from parsing.log_parser import LogParser
from detection.state_detector import StateDetector, ClaudeState, StateDetection
from recovery.recovery_engine import RecoveryEngine
from tasks.task_monitor import TaskMonitor
from notifications.notifier import Notifier
from communication.tcp_client import TCPClient


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
        
        # Load configuration
        if config_path:
            with open(config_path, 'r') as f:
                self.config = yaml.safe_load(f) or {}
        else:
            self.config = {}
        
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
        """Transform YAML logging config to MonitorLogger format."""
        transformed = {
            'level': logging_config.get('level', 'INFO'),
            'file': logging_config.get('file', '/tmp/claude-monitor.log'),
            'console': logging_config.get('console', {}).get('enabled', True),
            'max_size_mb': 10,  # Default from YAML rotation.max_size
            'backup_count': 5,  # Default from YAML rotation.backup_count
            'json_format': False,
            'structured_format': True
        }
        
        # Extract max_size from rotation config if present
        rotation_config = logging_config.get('rotation', {})
        if rotation_config.get('max_size'):
            max_size_str = rotation_config['max_size']
            if isinstance(max_size_str, str) and max_size_str.endswith('MB'):
                transformed['max_size_mb'] = int(max_size_str.replace('MB', ''))
        
        if rotation_config.get('backup_count'):
            transformed['backup_count'] = rotation_config['backup_count']
            
        return transformed
        
    def _init_components(self):
        """Initialize all monitoring components."""
        try:
            self.logger.info("Initializing monitoring components...")
            
            # Initialize components in dependency order
            component_configs = self.config.get('components', {})
            
            # 1. Log parser - monitors Claude Code output
            if component_configs.get('log_parser', {}).get('enabled', True):
                self._components['log_parser'] = LogParser(
                    component_configs.get('log_parser', {})
                )
                self.logger.info("Log parser initialized")
            
            # 2. State detector - analyzes log context for states
            if component_configs.get('state_detector', {}).get('enabled', True):
                self._components['state_detector'] = StateDetector(
                    component_configs.get('state_detector', {})
                )
                self.logger.info("State detector initialized")
            
            # 3. Recovery engine - executes recovery actions
            if component_configs.get('recovery_engine', {}).get('enabled', True):
                self._components['recovery_engine'] = RecoveryEngine(
                    component_configs.get('recovery_engine', {})
                )
                self.logger.info("Recovery engine initialized")
                # Optionally attempt to connect to TCP bridge at startup for early detection of connectivity issues
                try:
                    connect_on_start = bool(
                        self.config.get('monitoring', {}).get('connect_bridge_on_start', True)
                    )
                except Exception:
                    connect_on_start = True
                if connect_on_start:
                    try:
                        ok = self._components['recovery_engine'].tcp_client.connect()
                        if ok:
                            self.logger.info("TCP bridge preflight connection successful")
                            # If we start tailing from end, we might miss prior session markers.
                            # Proactively schedule a delayed /clear once on preflight success if not already pending.
                            try:
                                read_from_end = bool(
                                    self.config.get('components', {}).get('log_parser', {}).get('monitoring', {}).get('read_from_end', True)
                                )
                            except Exception:
                                read_from_end = True
                            if read_from_end and not self._pending_bootstrap and not self._last_idle_clear_at:
                                self._pending_bootstrap = True
                                self._bootstrap_cleared = False
                                self._clear_completed_at = None
                                self._last_idle_prompt_at = None
                                # Schedule delayed clear just like session marker path
                                recovery_engine = self._components['recovery_engine']
                                from detection.state_detector import StateDetection
                                fake_detection = StateDetection(
                                    state=ClaudeState.IDLE,
                                    confidence=1.0,
                                    evidence=["bootstrap_preflight_connect"],
                                    timestamp=datetime.now(),
                                    triggering_lines=[],
                                    metadata={}
                                )
                                try:
                                    try:
                                        delay_sec = float(os.environ.get('CLAUDE_MONITOR_BOOTSTRAP_CLEAR_DELAY_SEC') or \
                                                          self.config.get('monitoring', {}).get('bootstrap_clear_delay_sec', 5.0))
                                    except Exception:
                                        delay_sec = 5.0
                                    self.logger.info(f"Preflight: scheduling bootstrap clear (/clear) in {delay_sec:.1f}s")
                                    def _delayed_clear_preflight():
                                        try:
                                            time.sleep(delay_sec)
                                            if not self._pending_bootstrap or self._bootstrap_cleared:
                                                self.logger.info("Preflight: skipping delayed clear (bootstrap no longer pending or already cleared)")
                                                return
                                            ctx = {
                                                'should_send_idle_clear': True,
                                                'bootstrap': True,
                                                'reason': 'preflight_connect_delayed'
                                            }
                                            t0 = time.time()
                                            self.logger.info("Preflight: dispatching delayed bootstrap clear (/clear) now")
                                            execn_inner = recovery_engine.execute_recovery(fake_detection, ctx)
                                            if execn_inner:
                                                self._stats['total_recoveries'] += 1
                                                self._last_idle_clear_at = t0
                                                self.logger.info("Preflight: delayed bootstrap clear dispatched")
                                                # Schedule fallback prompt if completion inference isn't observed soon
                                                try:
                                                    try:
                                                        prompt_delay = float(self.config.get('monitoring', {}).get('bootstrap_prompt_delay_sec', 2.0))
                                                    except Exception:
                                                        prompt_delay = 2.0
                                                    def _fallback_prompt_preflight():
                                                        try:
                                                            time.sleep(prompt_delay)
                                                            if not self._pending_bootstrap or self._bootstrap_cleared:
                                                                return
                                                            prompt_spec = os.environ.get('CLAUDE_MONITOR_SPEC_NAME') or \
                                                                          self.config.get('monitoring', {}).get('spec_name', '')
                                                            idle_prompt = (
                                                                f"Please work on one remaining task for spec \"{prompt_spec or 'unknown'}\", "
                                                                f"make commit after task completion and stop."
                                                            )
                                                            prompt_ctx = {
                                                                'should_send_idle_prompt': True,
                                                                'idle_prompt_text': idle_prompt,
                                                                'bootstrap': True,
                                                                'reason': 'fallback_after_clear_preflight'
                                                            }
                                                            self.logger.info("Preflight: fallback dispatching idle prompt after clear delay")
                                                            execn_prompt = recovery_engine.execute_recovery(fake_detection, prompt_ctx)
                                                            if execn_prompt:
                                                                self._stats['total_recoveries'] += 1
                                                                self._last_idle_prompt_at = time.time()
                                                                self._pending_bootstrap = False
                                                                self._bootstrap_cleared = False
                                                                self.logger.info("Preflight: fallback idle prompt dispatched")
                                                        except Exception as e:
                                                            self.logger.error(f"Preflight: fallback prompt dispatch error: {e}")
                                                    threading.Thread(target=_fallback_prompt_preflight, name="BootstrapPromptFallbackPreflight", daemon=True).start()
                                                except Exception as e:
                                                    self.logger.error(f"Preflight: failed to schedule fallback prompt: {e}")
                                            else:
                                                self.logger.warning("Preflight: delayed bootstrap clear not dispatched (engine returned None)")
                                        except Exception as e:
                                            self.logger.error(f"Preflight: delayed bootstrap clear failed to dispatch: {e}")
                                    threading.Thread(target=_delayed_clear_preflight, name="BootstrapClearPreflightDelay", daemon=True).start()
                                except Exception as e:
                                    self.logger.error(f"Preflight: failed to schedule delayed bootstrap clear: {e}")
                        else:
                            self.logger.warning("TCP bridge preflight connection failed; will retry on demand")
                    except Exception as e:
                        self.logger.warning(f"TCP bridge preflight connection error: {e}")
            
            # 4. Task monitor - integrates with spec-workflow
            if component_configs.get('task_monitor', {}).get('enabled', True):
                self._components['task_monitor'] = TaskMonitor(
                    component_configs.get('task_monitor', {})
                )
                self.logger.info("Task monitor initialized")
            
            # 5. Notifier - handles user notifications
            if component_configs.get('notifier', {}).get('enabled', True):
                self._components['notifier'] = Notifier(
                    component_configs.get('notifier', {})
                )
                self.logger.info("Notifier initialized")
            
            # Setup component interconnections
            self._setup_component_callbacks()
            
            self.logger.info(f"Initialized {len(self._components)} components")
            
        except Exception as e:
            self.logger.error(f"Failed to initialize components: {e}")
            raise
            
    def _setup_component_callbacks(self):
        """Setup callbacks between components for proper integration."""
        try:
            # Log parser to state detector integration
            if 'log_parser' in self._components and 'state_detector' in self._components:
                def on_new_log_line(log_line):
                    try:
                        # Detect fresh session start markers from the Claude bridge / banner
                        try:
                            meta = getattr(log_line, 'metadata', {}) or {}
                            # Mark clear completion when the bridge/Claude acknowledges it
                            if meta.get('clear_completed'):
                                self._clear_completed_at = time.time()
                                self._bootstrap_cleared = True
                                self.logger.info("Detected /clear completion in logs; enabling prompt phase")
                                # If we are in bootstrap flow, trigger prompt immediately
                                if self._pending_bootstrap and 'recovery_engine' in self._components:
                                    try:
                                        recovery_engine = self._components['recovery_engine']
                                        from detection.state_detector import StateDetection
                                        fake_detection = StateDetection(
                                            state=ClaudeState.IDLE,
                                            confidence=1.0,
                                            evidence=["bootstrap_clear_completed"],
                                            timestamp=datetime.now(),
                                            triggering_lines=[],
                                            metadata={}
                                        )
                                        # Determine post-clear prompt delay
                                        try:
                                            post_delay = float(os.environ.get('CLAUDE_MONITOR_POST_CLEAR_PROMPT_DELAY_SEC') or \
                                                              self.config.get('monitoring', {}).get('post_clear_prompt_min_delay_sec', 5.0))
                                        except Exception:
                                            post_delay = 5.0
                                        self.logger.info(f"Scheduling bootstrap idle prompt in {post_delay:.1f}s after clear completion")
                                        def _delayed_prompt_after_clear():
                                            try:
                                                time.sleep(post_delay)
                                                if not self._pending_bootstrap:
                                                    return
                                                prompt_spec = os.environ.get('CLAUDE_MONITOR_SPEC_NAME') or \
                                                              self.config.get('monitoring', {}).get('spec_name', '')
                                                idle_prompt = (
                                                    f"Please work on one remaining task for spec \"{prompt_spec or 'unknown'}\", "
                                                    f"make commit after task completion and stop."
                                                )
                                                prompt_ctx = {
                                                    'should_send_idle_prompt': True,
                                                    'idle_prompt_text': idle_prompt,
                                                    'bootstrap': True,
                                                    'reason': 'clear_completed_delayed'
                                                }
                                                self.logger.info("Dispatching bootstrap idle prompt after post-clear delay")
                                                execn = recovery_engine.execute_recovery(fake_detection, prompt_ctx)
                                                if execn:
                                                    self._stats['total_recoveries'] += 1
                                                    self._last_idle_prompt_at = time.time()
                                                    self._pending_bootstrap = False
                                                    self._bootstrap_cleared = False
                                                    self.logger.info("Bootstrap idle prompt dispatched (delayed)")
                                            except Exception as e:
                                                self.logger.error(f"Delayed bootstrap prompt failed to dispatch: {e}")
                                        threading.Thread(target=_delayed_prompt_after_clear, name="BootstrapPromptAfterClear", daemon=True).start()
                                    except Exception as e:
                                        self.logger.error(f"Scheduling delayed bootstrap prompt failed: {e}")
                            # Some Claude builds do not emit an explicit clear-completed message; infer completion
                            # if we see the welcome banner, a clean prompt, a '/clear' echo, or '(no content)'
                            # shortly after we sent /clear.
                            elif self._pending_bootstrap and (
                                meta.get('welcome_banner') or meta.get('claude_prompt') or
                                meta.get('clear_no_content') or meta.get('clear_command_echo')
                            ):
                                try:
                                    now_ts = time.time()
                                    # Consider it completion if observed within a short window after clear
                                    if self._last_idle_clear_at and (now_ts - self._last_idle_clear_at) < 5.0:
                                        self._clear_completed_at = now_ts
                                        self._bootstrap_cleared = True
                                        self.logger.info("Inferred /clear completion from banner/prompt after dispatch; enabling prompt phase")
                                        # Schedule delayed prompt after inference as well
                                        if 'recovery_engine' in self._components:
                                            recovery_engine = self._components['recovery_engine']
                                            from detection.state_detector import StateDetection
                                            fake_detection = StateDetection(
                                                state=ClaudeState.IDLE,
                                                confidence=1.0,
                                                evidence=["bootstrap_clear_inferred"],
                                                timestamp=datetime.now(),
                                                triggering_lines=[],
                                                metadata={}
                                            )
                                            try:
                                                try:
                                                    post_delay = float(os.environ.get('CLAUDE_MONITOR_POST_CLEAR_PROMPT_DELAY_SEC') or \
                                                                      self.config.get('monitoring', {}).get('post_clear_prompt_min_delay_sec', 5.0))
                                                except Exception:
                                                    post_delay = 5.0
                                                self.logger.info(f"Scheduling bootstrap idle prompt in {post_delay:.1f}s after inferred clear completion")
                                                def _delayed_prompt_after_inferred():
                                                    try:
                                                        time.sleep(post_delay)
                                                        if not self._pending_bootstrap:
                                                            return
                                                        prompt_spec = os.environ.get('CLAUDE_MONITOR_SPEC_NAME') or \
                                                                      self.config.get('monitoring', {}).get('spec_name', '')
                                                        idle_prompt = (
                                                            f"Please work on one remaining task for spec \"{prompt_spec or 'unknown'}\", "
                                                            f"make commit after task completion and stop."
                                                        )
                                                        prompt_ctx = {
                                                            'should_send_idle_prompt': True,
                                                            'idle_prompt_text': idle_prompt,
                                                            'bootstrap': True,
                                                            'reason': 'clear_inferred_delayed'
                                                        }
                                                        self.logger.info("Dispatching bootstrap idle prompt after inferred clear delay")
                                                        execn = recovery_engine.execute_recovery(fake_detection, prompt_ctx)
                                                        if execn:
                                                            self._stats['total_recoveries'] += 1
                                                            self._last_idle_prompt_at = time.time()
                                                            self._pending_bootstrap = False
                                                            self._bootstrap_cleared = False
                                                            self.logger.info("Bootstrap idle prompt dispatched (delayed, inferred)")
                                                    except Exception as e:
                                                        self.logger.error(f"Delayed bootstrap prompt (inferred) failed to dispatch: {e}")
                                                threading.Thread(target=_delayed_prompt_after_inferred, name="BootstrapPromptAfterClearInferred", daemon=True).start()
                                            except Exception as e:
                                                self.logger.error(f"Scheduling delayed bootstrap prompt (inferred) failed: {e}")
                                except Exception as e:
                                    self.logger.error(f"Inferred bootstrap prompt failed to dispatch: {e}")
                            if any(meta.get(k) for k in (
                                'session_start_marker',
                                'welcome_banner',
                                'tcp_server_started',
                                'tcp_bridge_active'
                            )) and not self._pending_bootstrap:
                                # Schedule a bootstrap: clear on first IDLE, then prompt on next IDLE
                                self._pending_bootstrap = True
                                # Reset idle phase tracking so we ensure clear runs on the very next IDLE
                                self._last_detected_state = ClaudeState.UNKNOWN
                                self._last_idle_clear_at = None
                                self._last_idle_prompt_at = None
                                self._clear_completed_at = None
                                self._bootstrap_cleared = False
                                self.logger.info("Fresh Claude session detected via logs; bootstrap scheduled (clear then prompt)")
                                # Schedule delayed /clear to avoid racing welcome banner initialization
                                if 'recovery_engine' in self._components:
                                    try:
                                        recovery_engine = self._components['recovery_engine']
                                        from detection.state_detector import StateDetection
                                        fake_detection = StateDetection(
                                            state=ClaudeState.IDLE,
                                            confidence=1.0,
                                            evidence=["bootstrap_session_start"],
                                            timestamp=datetime.now(),
                                            triggering_lines=[],
                                            metadata={}
                                        )
                                        # Determine delay from env or config (default 5s)
                                        try:
                                            delay_sec = float(os.environ.get('CLAUDE_MONITOR_BOOTSTRAP_CLEAR_DELAY_SEC') or \
                                                              self.config.get('monitoring', {}).get('bootstrap_clear_delay_sec', 5.0))
                                        except Exception:
                                            delay_sec = 5.0
                                        self.logger.info(f"Scheduling bootstrap clear (/clear) in {delay_sec:.1f}s")
                                        def _delayed_clear():
                                            try:
                                                time.sleep(delay_sec)
                                                # Skip if bootstrap was already completed or cancelled
                                                if not self._pending_bootstrap or self._bootstrap_cleared:
                                                    self.logger.info("Skipping delayed clear: bootstrap no longer pending or already cleared")
                                                    return
                                                immediate_ctx = {
                                                    'should_send_idle_clear': True,
                                                    'bootstrap': True,
                                                    'reason': 'fresh_session_start_delayed'
                                                }
                                                t0 = time.time()
                                                self.logger.info("Dispatching delayed bootstrap clear (/clear) now")
                                                execn_inner = recovery_engine.execute_recovery(fake_detection, immediate_ctx)
                                                if execn_inner:
                                                    self._stats['total_recoveries'] += 1
                                                    self._last_idle_clear_at = t0
                                                    self.logger.info("Delayed bootstrap clear dispatched")
                                                    # Schedule fallback prompt if completion inference isn't observed soon
                                                    try:
                                                        try:
                                                            prompt_delay = float(self.config.get('monitoring', {}).get('bootstrap_prompt_delay_sec', 2.0))
                                                        except Exception:
                                                            prompt_delay = 2.0
                                                        def _fallback_prompt():
                                                            try:
                                                                time.sleep(prompt_delay)
                                                                if not self._pending_bootstrap or self._bootstrap_cleared:
                                                                    # Either already prompted or not pending
                                                                    return
                                                                prompt_spec = os.environ.get('CLAUDE_MONITOR_SPEC_NAME') or \
                                                                              self.config.get('monitoring', {}).get('spec_name', '')
                                                                idle_prompt = (
                                                                    f"Please work on one remaining task for spec \"{prompt_spec or 'unknown'}\", "
                                                                    f"make commit after task completion and stop."
                                                                )
                                                                prompt_ctx = {
                                                                    'should_send_idle_prompt': True,
                                                                    'idle_prompt_text': idle_prompt,
                                                                    'bootstrap': True,
                                                                    'reason': 'fallback_after_clear'
                                                                }
                                                                self.logger.info("Fallback: dispatching idle prompt after clear delay")
                                                                execn_prompt = recovery_engine.execute_recovery(fake_detection, prompt_ctx)
                                                                if execn_prompt:
                                                                    self._stats['total_recoveries'] += 1
                                                                    self._last_idle_prompt_at = time.time()
                                                                    self._pending_bootstrap = False
                                                                    self._bootstrap_cleared = False
                                                                    self.logger.info("Fallback: idle prompt dispatched")
                                                            except Exception as e:
                                                                self.logger.error(f"Fallback prompt dispatch error: {e}")
                                                        threading.Thread(target=_fallback_prompt, name="BootstrapPromptFallback", daemon=True).start()
                                                    except Exception as e:
                                                        self.logger.error(f"Failed to schedule fallback prompt: {e}")
                                                else:
                                                    self.logger.warning("Delayed bootstrap clear not dispatched (engine returned None)")
                                            except Exception as e:
                                                self.logger.error(f"Delayed bootstrap clear failed to dispatch: {e}")
                                        th = threading.Thread(target=_delayed_clear, name="BootstrapClearDelay", daemon=True)
                                        th.start()
                                    except Exception as e:
                                        self.logger.error(f"Failed to schedule delayed bootstrap clear: {e}")
                        except Exception as marker_err:
                            self.logger.debug(f"Session marker check error: {marker_err}")

                        # Get context from log parser and run state detection
                        context = self._components['log_parser'].get_context()
                        detection = self._components['state_detector'].detect_state(context)
                        
                        if detection and detection.confidence >= self._components['state_detector'].config.get('min_confidence', 0.6):
                            self.logger.info(
                                f"State detected: {detection.state} (confidence: {detection.confidence:.2f}) | "
                                f"last_state={self._last_detected_state}, pending_bootstrap={self._pending_bootstrap}, "
                                f"last_clear_at={self._last_idle_clear_at}, last_prompt_at={self._last_idle_prompt_at}"
                            )

                            # Trigger recovery decisions here (since StateDetector doesn't expose callbacks)
                            if 'recovery_engine' in self._components:
                                recovery_engine = self._components['recovery_engine']

                                # Prepare common recovery context
                                recovery_context = {
                                    'detection_confidence': detection.confidence,
                                    'detection_evidence': detection.evidence,
                                    'timestamp': detection.timestamp,
                                }

                                # Throttle overall decision frequency to avoid spamming identical outcomes
                                try:
                                    now_ts_dec = time.time()
                                    if (self._last_detected_state == detection.state and
                                        self._decision_min_interval_sec > 0 and
                                        self._last_decision_ts and
                                        (now_ts_dec - self._last_decision_ts) < self._decision_min_interval_sec):
                                        self.logger.debug(
                                            f"Throttling decisions for state {detection.state} (last {now_ts_dec - self._last_decision_ts:.2f}s ago < {self._decision_min_interval_sec}s)"
                                        )
                                        return
                                except Exception:
                                    pass

                                # Track consecutive detections to avoid rapid INACTIVE<->ACTIVE flicker
                                try:
                                    if detection.state == ClaudeState.IDLE:
                                        self._consec_idle_count += 1
                                        self._consec_active_count = 0
                                    elif detection.state == ClaudeState.ACTIVE:
                                        self._consec_active_count += 1
                                        self._consec_idle_count = 0
                                        # Reset idle-period clear gating on any non-IDLE state
                                        self._idle_period_cleared = False
                                    else:
                                        # Reset on other non-IDLE states as well
                                        self._consec_idle_count = 0
                                        self._consec_active_count = 0
                                        self._idle_period_cleared = False
                                except Exception:
                                    pass

                                # Only trigger recovery for problematic states or for idle prompt
                                recovery_states = {
                                    ClaudeState.CONTEXT_PRESSURE,
                                    ClaudeState.INPUT_WAITING,
                                    ClaudeState.ERROR,
                                }

                                # Throttle recoveries per state to avoid redundant rapid actions
                                state_key = detection.state.value
                                now = time.time()
                                last_ts = self._last_recovery_by_state.get(state_key, 0)
                                if (now - last_ts) < self._min_recovery_interval_sec:
                                    self.logger.debug(f"Throttling recovery for state {detection.state}: last {now - last_ts:.2f}s ago")
                                    return

                                # Handle IDLE in two phases within an idle period: first /clear once, then prompt
                                if detection.state == ClaudeState.IDLE:
                                    # Wait for multiple consecutive IDLE detections to consider it truly inactive
                                    if self._consec_idle_count < max(1, self._consec_idle_required):
                                        self.logger.info(
                                            f"Decision: waiting for consecutive idle confirmations ({self._consec_idle_count}/{self._consec_idle_required})"
                                        )
                                        # Update last state and decision timestamp then return early
                                        self._last_detected_state = detection.state
                                        try:
                                            self._last_decision_ts = time.time()
                                        except Exception:
                                            pass
                                        return
                                    # Read overrides from env or config
                                    current_project = os.environ.get('CLAUDE_MONITOR_PROJECT_PATH') or \
                                                     self.config.get('monitoring', {}).get('project_path', '')
                                    current_spec = os.environ.get('CLAUDE_MONITOR_SPEC_NAME') or \
                                                  self.config.get('monitoring', {}).get('spec_name', '')

                                    now_ts = time.time()
                                    # Phase 1: ensure we send /clear once per idle period after confirmations
                                    if (not self._idle_period_cleared or self._pending_bootstrap) and not self._bootstrap_cleared:
                                        clear_context = dict(recovery_context)
                                        clear_context.update({
                                            'should_send_idle_clear': True
                                        })
                                        self.logger.info("Decision: sending idle clear (/clear)")
                                        execution = recovery_engine.execute_recovery(detection, clear_context)
                                        if execution:
                                            self._stats['total_recoveries'] += 1
                                            self._last_idle_clear_at = now_ts
                                            self._idle_period_cleared = True
                                            self.logger.info("Idle clear sent via recovery engine (/clear)")
                                            # Mark bootstrap clear phase completed if we are bootstrapping
                                            if self._pending_bootstrap:
                                                self._bootstrap_cleared = True
                                        else:
                                            self.logger.info("Decision: not sending clear yet")
                                    else:
                                        # Phase 2: subsequent IDLE detections after clear -> send prompt
                                        should_send_prompt = True
                                        # Avoid spamming: send only if no prompt recently and clear was sent
                                        if self._last_idle_prompt_at and (now_ts - self._last_idle_prompt_at) < recovery_engine.config.get('cooldown_period', 10.0):
                                            should_send_prompt = False
                                        # Give a brief moment after clear; alternatively, require clear completion marker
                                        if self._last_idle_clear_at and (now_ts - self._last_idle_clear_at) < 1.0:
                                            # give a brief moment after clear
                                            should_send_prompt = False
                                        # If we sent a clear recently, require explicit or inferred clear completion before prompting
                                        if self._last_idle_clear_at and (not self._clear_completed_at or self._clear_completed_at < self._last_idle_clear_at):
                                            # Allow bypass after fallback timeout
                                            age = now_ts - self._last_idle_clear_at
                                            if age >= self._clear_completion_fallback_sec:
                                                self.logger.info(
                                                    f"Bypassing /clear completion wait after {age:.1f}s (fallback {self._clear_completion_fallback_sec:.1f}s)"
                                                )
                                            else:
                                                should_send_prompt = False
                                                self.logger.info("Decision: not sending prompt yet (awaiting /clear completion)")
                                        # If we are in bootstrap flow, require that we observed clear completion before prompting
                                        if self._pending_bootstrap and not self._bootstrap_cleared:
                                            should_send_prompt = False

                                        if should_send_prompt:
                                            prompt_spec = current_spec or 'unknown'
                                            idle_prompt = (
                                                f"Please work on one remaining task for spec \"{prompt_spec}\", "
                                                f"make commit after task completion and stop."
                                            )
                                            prompt_context = dict(recovery_context)
                                            prompt_context.update({
                                                'should_send_idle_prompt': True,
                                                'idle_prompt_text': idle_prompt,
                                                'context_spec': current_spec,
                                                'context_project': current_project,
                                            })
                                            self.logger.info("Decision: sending idle prompt")
                                            execution = recovery_engine.execute_recovery(detection, prompt_context)
                                            if execution:
                                                self._stats['total_recoveries'] += 1
                                                self._last_idle_prompt_at = now_ts
                                                self.logger.info("Idle prompt sent via recovery engine")
                                                # Bootstrap complete once prompt is sent
                                                if self._pending_bootstrap:
                                                    self._pending_bootstrap = False
                                                    self._bootstrap_cleared = False
                                        else:
                                            self.logger.info("Decision: not sending prompt yet (cooldown or just cleared)")

                                elif detection.state in recovery_states:
                                    execution = recovery_engine.execute_recovery(detection, recovery_context)
                                    if execution:
                                        self._stats['total_recoveries'] += 1
                                        self._last_recovery_by_state[state_key] = now
                                        self.logger.info(f"Recovery initiated for state: {detection.state}")

                            # Update last detected state for next cycle decisions
                            self._last_detected_state = detection.state
                            # Update last decision timestamp at the end of processing this detection block
                            try:
                                self._last_decision_ts = time.time()
                            except Exception:
                                pass
                        
                    except Exception as e:
                        self.logger.error(f"Error processing log line in state detector: {e}")
                
                self._components['log_parser'].add_line_callback(on_new_log_line)
                self.logger.info("Log parser connected to state detector")
            
            # State detector to recovery engine integration
            if 'state_detector' in self._components and 'recovery_engine' in self._components:
                def on_state_detection(detection):
                    try:
                        self._stats['total_detections'] += 1
                        
                        # Only trigger recovery for problematic states
                        recovery_states = {
                            ClaudeState.CONTEXT_PRESSURE,
                            ClaudeState.INPUT_WAITING,
                            ClaudeState.ERROR
                        }
                        
                        if detection.state in recovery_states:
                            recovery_context = {
                                'detection_confidence': detection.confidence,
                                'detection_evidence': detection.evidence,
                                'timestamp': detection.timestamp
                            }
                            
                            execution = self._components['recovery_engine'].execute_recovery(
                                detection, recovery_context
                            )
                            
                            if execution:
                                self._stats['total_recoveries'] += 1
                                self.logger.info(f"Recovery initiated for state: {detection.state}")
                            
                    except Exception as e:
                        self.logger.error(f"Error in state detection callback: {e}")
                        self._stats['errors'] += 1
                
                # Note: Would set up state detector callback here if the method existed
                # self._components['state_detector'].set_detection_callback(on_state_detection)
                self.logger.info("State detector callback integration configured")
                
            # Recovery engine to notifier integration
            if 'recovery_engine' in self._components and 'notifier' in self._components:
                def on_recovery_start(execution):
                    try:
                        self._components['notifier'].notify_recovery(
                            "Recovery Action Started",
                            f"Executing {execution.action.action_type.value}: {execution.action.description}"
                        )
                    except Exception as e:
                        self.logger.error(f"Error in recovery start notification: {e}")
                
                def on_recovery_complete(execution):
                    try:
                        self._components['notifier'].notify_success(
                            "Recovery Action Completed",
                            f"Successfully completed {execution.action.action_type.value} in {execution.duration:.2f}s"
                        )
                    except Exception as e:
                        self.logger.error(f"Error in recovery complete notification: {e}")
                
                def on_recovery_failure(execution):
                    try:
                        self._components['notifier'].notify_error(
                            "Recovery Action Failed",
                            f"Failed to execute {execution.action.action_type.value}: {execution.error_message}"
                        )
                    except Exception as e:
                        self.logger.error(f"Error in recovery failure notification: {e}")
                
                self._components['recovery_engine'].set_callbacks(
                    on_execution_start=on_recovery_start,
                    on_execution_complete=on_recovery_complete,
                    on_execution_failure=on_recovery_failure
                )
                
            # Task monitor to notifier integration
            if 'task_monitor' in self._components and 'notifier' in self._components:
                def on_spec_complete(spec_info):
                    try:
                        self._components['notifier'].notify_completion(
                            "Spec Completed",
                            f"Spec '{spec_info.spec_name}' completed with {spec_info.completed_tasks}/{spec_info.total_tasks} tasks"
                        )
                    except Exception as e:
                        self.logger.error(f"Error in spec complete notification: {e}")
                
                def on_task_complete(task_info):
                    try:
                        # Only notify for important tasks to avoid spam
                        if hasattr(task_info, 'priority') and task_info.priority >= 8:
                            self._components['notifier'].notify_info(
                                "Task Completed",
                                f"Task '{task_info.description}' completed"
                            )
                    except Exception as e:
                        self.logger.error(f"Error in task complete notification: {e}")
                
                self._components['task_monitor'].set_callbacks(
                    on_spec_complete=on_spec_complete,
                    on_task_complete=on_task_complete
                )
                
            self.logger.info("Component callbacks configured")
            
        except Exception as e:
            self.logger.error(f"Failed to setup component callbacks: {e}")
            raise
            
    def _setup_signal_handlers(self):
        """Setup signal handlers for graceful shutdown and reload."""
        def signal_handler(signum, frame):
            signal_name = signal.Signals(signum).name
            self.logger.info(f"Received signal {signal_name}")
            
            if signum in (signal.SIGTERM, signal.SIGINT):
                self.logger.info("Shutdown requested via signal")
                self.stop()
            elif signum == signal.SIGHUP:
                self.logger.info("Configuration reload requested via signal")
                self.reload_config()
            elif signum == signal.SIGUSR1:
                self.logger.info("Status report requested via signal")
                self._log_status_report()
                
        # Register signal handlers
        signal.signal(signal.SIGTERM, signal_handler)
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGHUP, signal_handler)
        signal.signal(signal.SIGUSR1, signal_handler)
        
        self.logger.info("Signal handlers registered")
        
    def _start_components(self):
        """Start all monitoring components."""
        try:
            self.logger.info("Starting monitoring components...")
            
            # Start components that need background threads
            if 'log_parser' in self._components:
                log_parser = self._components['log_parser']
                
                # Set the log file path from configuration
                log_parser_config = self.config.get('components', {}).get('log_parser', {})
                log_file_path = log_parser_config.get('log_file', '~/.local/share/claude_code/terminal_output.log')
                expanded_path = os.path.expanduser(log_file_path)
                
                if log_parser.set_log_file(expanded_path):
                    self.logger.info(f"Log parser set to monitor: {expanded_path}")
                else:
                    self.logger.warning(f"Failed to set log file: {expanded_path}")
                
                if hasattr(log_parser, 'start_monitoring'):
                    log_parser.start_monitoring()
                    self.logger.debug("Log parser monitoring started")
            
            if 'task_monitor' in self._components:
                task_monitor = self._components['task_monitor']
                if hasattr(task_monitor, 'start_monitoring'):
                    task_monitor.start_monitoring()
                    self.logger.debug("Task monitor started")
                    
                    # Add current spec to monitoring
                    # Check for environment variable overrides first
                    current_project = os.environ.get('CLAUDE_MONITOR_PROJECT_PATH') or \
                                    self.config.get('monitoring', {}).get('project_path', '/mnt/d/repos/claude-monitor')
                    current_spec = os.environ.get('CLAUDE_MONITOR_SPEC_NAME') or \
                                 self.config.get('monitoring', {}).get('spec_name', 'claude-auto-recovery')
                    
                    self.logger.info(f"Monitoring project: {current_project}")
                    self.logger.info(f"Monitoring spec: {current_spec}")
                    task_monitor.add_spec_to_monitor(current_project, current_spec)
            
            self.logger.info("All components started successfully")
            
        except Exception as e:
            self.logger.error(f"Failed to start components: {e}")
            raise
            
    def _stop_components(self):
        """Stop all monitoring components gracefully."""
        try:
            self.logger.info("Stopping monitoring components...")
            
            # Stop components in reverse order
            for name, component in reversed(list(self._components.items())):
                try:
                    if hasattr(component, 'stop_monitoring'):
                        component.stop_monitoring()
                    elif hasattr(component, 'shutdown'):
                        component.shutdown()
                    self.logger.debug(f"Component {name} stopped")
                except Exception as e:
                    self.logger.error(f"Error stopping component {name}: {e}")
                    
            # Wait for component threads to finish
            for name, thread in self._component_threads.items():
                if thread.is_alive():
                    self.logger.debug(f"Waiting for {name} thread to finish...")
                    thread.join(timeout=5.0)
                    if thread.is_alive():
                        self.logger.warning(f"Component thread {name} did not finish cleanly")
                        
            self.logger.info("All components stopped")
            
        except Exception as e:
            self.logger.error(f"Error stopping components: {e}")
            
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
                    self._process_monitoring_cycle()
                    
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
            
    def _process_monitoring_cycle(self):
        """Process one monitoring cycle."""
        try:
            # In a real implementation, this would coordinate the monitoring workflow:
            # 1. Log parser provides new log lines
            # 2. State detector analyzes context and detects states
            # 3. Recovery engine executes actions based on detected states
            # 4. Task monitor checks for completion
            # 5. Notifier sends alerts as needed
            
            # For now, just check component health
            for name, component in self._components.items():
                if hasattr(component, 'is_monitoring') and not component.is_monitoring():
                    self.logger.warning(f"Component {name} is not monitoring - attempting restart")
                    if hasattr(component, 'start_monitoring'):
                        component.start_monitoring()

            # Inactivity-based IDLE fallback: if the log file has no new lines for N seconds,
            # synthesize an IDLE detection to drive clear/prompt decisions.
            try:
                log_parser = self._components.get('log_parser')
                state_detector = self._components.get('state_detector')
                recovery_engine = self._components.get('recovery_engine')
                if log_parser and state_detector and recovery_engine and self._inactivity_idle_sec > 0:
                    stats = log_parser.get_statistics() if hasattr(log_parser, 'get_statistics') else {}
                    last_act = stats.get('last_activity')
                    now_ts = time.time()
                    if last_act and (now_ts - last_act) >= self._inactivity_idle_sec:
                        # Throttle decisions as usual if state hasn't changed
                        if (self._last_detected_state == ClaudeState.IDLE and
                            self._decision_min_interval_sec > 0 and
                            self._last_decision_ts and
                            (now_ts - self._last_decision_ts) < self._decision_min_interval_sec):
                            return

                        # Update consecutive counters
                        self._consec_idle_count = min(self._consec_idle_count + 1, 1000)
                        self._consec_active_count = 0

                        # Build a synthetic detection object
                        detection = StateDetection(
                            state=ClaudeState.IDLE,
                            confidence=0.9,
                            evidence=["inactivity_timeout"],
                            timestamp=datetime.now(),
                            triggering_lines=[],
                            metadata={"reason": "inactivity_idle"}
                        )

                        # Mirror the IDLE decision branch (respecting consecutive confirmations and clear/prompt rules)
                        # Read overrides
                        current_project = os.environ.get('CLAUDE_MONITOR_PROJECT_PATH') or \
                                         self.config.get('monitoring', {}).get('project_path', '')
                        current_spec = os.environ.get('CLAUDE_MONITOR_SPEC_NAME') or \
                                      self.config.get('monitoring', {}).get('spec_name', '')

                        # Require multiple consecutive IDLE detections
                        if self._consec_idle_count < max(1, self._consec_idle_required):
                            self.logger.info(
                                f"Decision: waiting for consecutive idle confirmations ({self._consec_idle_count}/{self._consec_idle_required}) [inactivity]"
                            )
                            self._last_detected_state = ClaudeState.IDLE
                            self._last_decision_ts = time.time()
                            return

                        now_ts2 = time.time()
                        # Phase 1: ensure /clear has been sent once for this idle period (or during bootstrap)
                        if (not self._idle_period_cleared or self._pending_bootstrap) and not self._bootstrap_cleared:
                            clear_context = {
                                'detection_confidence': detection.confidence,
                                'detection_evidence': detection.evidence,
                                'timestamp': detection.timestamp,
                                'should_send_idle_clear': True
                            }
                            self.logger.info("Decision: sending idle clear (/clear) [inactivity]")
                            execution = recovery_engine.execute_recovery(detection, clear_context)
                            if execution:
                                self._stats['total_recoveries'] += 1
                                self._last_idle_clear_at = now_ts2
                                self._idle_period_cleared = True
                                if self._pending_bootstrap:
                                    self._bootstrap_cleared = True
                            self._last_detected_state = ClaudeState.IDLE
                            self._last_decision_ts = time.time()
                            return
                        else:
                            # Phase 2: prompt (subject to cooldowns and clear completion)
                            should_send_prompt = True
                            if self._last_idle_prompt_at and (now_ts2 - self._last_idle_prompt_at) < recovery_engine.config.get('cooldown_period', 10.0):
                                should_send_prompt = False
                            if self._last_idle_clear_at and (now_ts2 - self._last_idle_clear_at) < 1.0:
                                should_send_prompt = False
                            if self._last_idle_clear_at and (not self._clear_completed_at or self._clear_completed_at < self._last_idle_clear_at):
                                # Allow bypass after fallback timeout
                                age = now_ts2 - self._last_idle_clear_at
                                if age >= self._clear_completion_fallback_sec:
                                    self.logger.info(
                                        f"Bypassing /clear completion wait after {age:.1f}s (fallback {self._clear_completion_fallback_sec:.1f}s) [inactivity]"
                                    )
                                else:
                                    should_send_prompt = False
                                    self.logger.info("Decision: not sending prompt yet (awaiting /clear completion) [inactivity]")
                            if self._pending_bootstrap and not self._bootstrap_cleared:
                                should_send_prompt = False

                            if should_send_prompt:
                                idle_prompt = (
                                    f"Please work on one remaining task for spec \"{current_spec or 'unknown'}\", "
                                    f"make commit after task completion and stop."
                                )
                                prompt_context = {
                                    'detection_confidence': detection.confidence,
                                    'detection_evidence': detection.evidence,
                                    'timestamp': detection.timestamp,
                                    'should_send_idle_prompt': True,
                                    'idle_prompt_text': idle_prompt,
                                    'context_spec': current_spec,
                                    'context_project': current_project,
                                }
                                self.logger.info("Decision: sending idle prompt [inactivity]")
                                execution = recovery_engine.execute_recovery(detection, prompt_context)
                                if execution:
                                    self._stats['total_recoveries'] += 1
                                    self._last_idle_prompt_at = now_ts2
                                    if self._pending_bootstrap:
                                        self._pending_bootstrap = False
                                        self._bootstrap_cleared = False
                            else:
                                self.logger.info("Decision: not sending prompt yet (cooldown or just cleared) [inactivity]")
                            self._last_detected_state = ClaudeState.IDLE
                            self._last_decision_ts = time.time()
                            return
            except Exception as e:
                self.logger.debug(f"Inactivity IDLE fallback check failed: {e}")
                        
        except Exception as e:
            self.logger.error(f"Error in monitoring cycle: {e}")
            self._stats['errors'] += 1
            
    def _log_status_report(self):
        """Log a status report of all components."""
        try:
            report = {
                'daemon': self._stats.copy(),
                'components': {}
            }
            
            for name, component in self._components.items():
                component_stats = {}
                if hasattr(component, 'get_statistics'):
                    component_stats = component.get_statistics()
                elif hasattr(component, 'get_stats'):
                    component_stats = component.get_stats()
                    
                report['components'][name] = component_stats
                
            self.logger.info(f"STATUS REPORT: {json.dumps(report, indent=2, default=str)}")
            
        except Exception as e:
            self.logger.error(f"Error generating status report: {e}")
            
    def _reload_config_internal(self):
        """Internal configuration reload implementation."""
        try:
            self.logger.info("Reloading configuration...")
            
            old_config = self.config.copy()
            if self.config_path:
                with open(self.config_path, 'r') as f:
                    new_config = yaml.safe_load(f) or {}
            else:
                new_config = {}
            
            if new_config != old_config:
                self.config = new_config
                
                # Update component configurations
                component_configs = self.config.get('components', {})
                for name, component in self._components.items():
                    if hasattr(component, 'update_config'):
                        component.update_config(component_configs.get(name, {}))
                        
                self._stats['config_reloads'] += 1
                self.logger.info("Configuration reloaded successfully")
            else:
                self.logger.info("Configuration unchanged")
                
        except Exception as e:
            self.logger.error(f"Failed to reload configuration: {e}")
            
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
        """Get daemon statistics."""
        with self._lock:
            stats = self._stats.copy()
            stats['uptime_seconds'] = (datetime.now() - self._start_time).total_seconds()
            stats['components'] = {}
            
            for name, component in self._components.items():
                if hasattr(component, 'get_statistics'):
                    stats['components'][name] = component.get_statistics()
                    
            return stats


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Claude Monitor - Automated Claude Code recovery system')
    parser.add_argument('--config', '-c', help='Configuration file path')
    parser.add_argument('--debug', '-d', action='store_true', help='Enable debug mode')
    parser.add_argument('--daemon', action='store_true', help='Run as daemon (detach from terminal)')
    parser.add_argument('--stop', action='store_true', help='Stop running daemon')
    parser.add_argument('--status', action='store_true', help='Show daemon status')
    parser.add_argument('--reload', action='store_true', help='Reload daemon configuration')
    
    args = parser.parse_args()
    
    # Handle daemon control commands
    if args.stop:
        # Send SIGTERM to running daemon
        try:
            with open('/var/run/claude-monitor.pid', 'r') as f:
                pid = int(f.read().strip())
            os.kill(pid, signal.SIGTERM)
            print(f"Stop signal sent to daemon (PID: {pid})")
            return 0
        except FileNotFoundError:
            print("No running daemon found")
            return 1
        except Exception as e:
            print(f"Error stopping daemon: {e}")
            return 1
            
    if args.status:
        # Send SIGUSR1 to running daemon for status report
        try:
            with open('/var/run/claude-monitor.pid', 'r') as f:
                pid = int(f.read().strip())
            os.kill(pid, signal.SIGUSR1)
            print(f"Status request sent to daemon (PID: {pid})")
            return 0
        except FileNotFoundError:
            print("No running daemon found")
            return 1
        except Exception as e:
            print(f"Error requesting status: {e}")
            return 1
            
    if args.reload:
        # Send SIGHUP to running daemon for config reload
        try:
            with open('/var/run/claude-monitor.pid', 'r') as f:
                pid = int(f.read().strip())
            os.kill(pid, signal.SIGHUP)
            print(f"Reload signal sent to daemon (PID: {pid})")
            return 0
        except FileNotFoundError:
            print("No running daemon found")
            return 1
        except Exception as e:
            print(f"Error reloading config: {e}")
            return 1
    
    # Start daemon
    daemon = ClaudeMonitorDaemon(config_path=args.config, debug=args.debug)
    
    try:
        if args.daemon:
            # Daemonize process
            if os.fork() > 0:
                sys.exit(0)  # Parent exits
                
            os.setsid()  # Create new session
            
            if os.fork() > 0:
                sys.exit(0)  # Parent exits again
                
            # Write PID file
            with open('/var/run/claude-monitor.pid', 'w') as f:
                f.write(str(os.getpid()))
                
            # Redirect streams
            sys.stdin.close()
            sys.stdout.close()
            sys.stderr.close()
            
        # Start daemon
        daemon.start()
        
        if not args.daemon:
            print("Claude Monitor started. Press Ctrl+C to stop.")
            
        # Wait for daemon to finish
        daemon.wait()
        
        return 0
        
    except KeyboardInterrupt:
        print("\nShutdown requested")
        daemon.stop()
        return 0
    except Exception as e:
        print(f"Fatal error: {e}")
        if args.debug:
            traceback.print_exc()
        return 1
    finally:
        # Clean up PID file
        try:
            os.unlink('/var/run/claude-monitor.pid')
        except:
            pass


if __name__ == '__main__':
    sys.exit(main())