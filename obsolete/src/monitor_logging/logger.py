"""
Structured logging system with rotation and multiple outputs for Claude Monitor.

This module implements comprehensive logging functionality following requirements 5.1 and 5.4:
- Structured logging with timestamps, state, and context
- Automatic log rotation when file size limits are exceeded
- Multiple output targets (file and console, configurable)
- Configurable log levels and formatting
- Thread-safe operation for concurrent access
"""

import logging
import logging.handlers
import json
import sys
import os
from datetime import datetime
from typing import Dict, Any, Optional, List
from pathlib import Path


class StructuredFormatter(logging.Formatter):
    """Custom formatter for structured log messages with JSON output capability."""
    
    def __init__(self, include_json: bool = True):
        super().__init__()
        self.include_json = include_json
        
    def format(self, record: logging.LogRecord) -> str:
        # Create base structured data
        log_data = {
            'timestamp': datetime.fromtimestamp(record.created).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage()
        }
        
        # Add extra fields if present
        if hasattr(record, 'state'):
            log_data['state'] = record.state
        if hasattr(record, 'context'):
            log_data['context'] = record.context
        if hasattr(record, 'action'):
            log_data['action'] = record.action
        if hasattr(record, 'component'):
            log_data['component'] = record.component
        if hasattr(record, 'recovery_attempt'):
            log_data['recovery_attempt'] = record.recovery_attempt
        if hasattr(record, 'error_details'):
            log_data['error_details'] = record.error_details
            
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
            
        if self.include_json:
            return json.dumps(log_data, ensure_ascii=False)
        else:
            # Human-readable format
            base_msg = f"{log_data['timestamp']} [{log_data['level']}] {log_data['logger']}: {log_data['message']}"
            
            # Add structured fields
            extras = []
            for key, value in log_data.items():
                if key not in ['timestamp', 'level', 'logger', 'message']:
                    if isinstance(value, (dict, list)):
                        extras.append(f"{key}={json.dumps(value)}")
                    else:
                        extras.append(f"{key}={value}")
                        
            if extras:
                base_msg += f" [{', '.join(extras)}]"
                
            return base_msg


class MonitorLogger:
    """Main logging system for Claude Monitor with structured logging and rotation."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the logging system.
        
        Args:
            config: Configuration dictionary with logging settings
        """
        self.config = config or self._get_default_config()
        self._loggers: Dict[str, logging.Logger] = {}
        self._setup_logging()
        
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default logging configuration."""
        return {
            'level': 'INFO',
            'file': '/tmp/claude-monitor.log',
            'console': True,
            'max_size_mb': 100,
            'backup_count': 5,
            'json_format': False,  # Human-readable by default
            'structured_format': True
        }
        
    def _setup_logging(self):
        """Set up the root logging configuration."""
        # Create log directory if it doesn't exist
        log_file = Path(self.config['file'])
        log_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Configure root logger
        root_logger = logging.getLogger('claude_monitor')
        root_logger.setLevel(getattr(logging, self.config['level'].upper()))
        
        # Clear any existing handlers
        root_logger.handlers.clear()
        
        # Set up file handler with rotation
        if self.config['file']:
            max_bytes = self.config['max_size_mb'] * 1024 * 1024
            file_handler = logging.handlers.RotatingFileHandler(
                self.config['file'],
                maxBytes=max_bytes,
                backupCount=self.config.get('backup_count', 5)
            )
            file_formatter = StructuredFormatter(include_json=self.config.get('json_format', False))
            file_handler.setFormatter(file_formatter)
            root_logger.addHandler(file_handler)
            
        # Set up console handler
        if self.config['console']:
            console_handler = logging.StreamHandler(sys.stdout)
            console_formatter = StructuredFormatter(include_json=False)  # Always human-readable on console
            console_handler.setFormatter(console_formatter)
            root_logger.addHandler(console_handler)
            
        # Store reference to root logger
        self._loggers['root'] = root_logger
        
    def get_logger(self, name: str) -> logging.Logger:
        """
        Get a logger instance for a specific component.
        
        Args:
            name: Logger name (component name)
            
        Returns:
            Logger instance
        """
        full_name = f'claude_monitor.{name}'
        if full_name not in self._loggers:
            logger = logging.getLogger(full_name)
            self._loggers[full_name] = logger
        return self._loggers[full_name]
        
    def log_state_change(self, logger_name: str, old_state: str, new_state: str, 
                        context: Optional[List[str]] = None, confidence: float = 0.0):
        """
        Log a state change event with structured data.
        
        Args:
            logger_name: Component logger name
            old_state: Previous state
            new_state: New state
            context: Context lines that triggered the change
            confidence: Confidence score for the state detection
        """
        logger = self.get_logger(logger_name)
        logger.info(
            f"State change: {old_state} -> {new_state}",
            extra={
                'state': new_state,
                'context': context or [],
                'action': 'state_change',
                'component': logger_name,
                'confidence': confidence,
                'previous_state': old_state
            }
        )
        
    def log_recovery_action(self, logger_name: str, action_type: str, command: str,
                           success: bool, attempt_number: int = 1, error_details: str = None):
        """
        Log a recovery action with execution details.
        
        Args:
            logger_name: Component logger name
            action_type: Type of recovery action (compact, resume, input, notify)
            command: Command or action executed
            success: Whether the action succeeded
            attempt_number: Current attempt number
            error_details: Error details if action failed
        """
        logger = self.get_logger(logger_name)
        level = logging.INFO if success else logging.ERROR
        message = f"Recovery action {action_type}: {command} {'succeeded' if success else 'failed'}"
        
        extra_data = {
            'action': 'recovery',
            'component': logger_name,
            'recovery_attempt': attempt_number,
            'action_type': action_type,
            'command': command,
            'success': success
        }
        
        if error_details:
            extra_data['error_details'] = error_details
            
        logger.log(level, message, extra=extra_data)
        
    def log_task_status(self, logger_name: str, total_tasks: int, completed_tasks: int,
                       pending_tasks: int, in_progress_tasks: int, work_complete: bool):
        """
        Log task status information.
        
        Args:
            logger_name: Component logger name
            total_tasks: Total number of tasks
            completed_tasks: Number of completed tasks
            pending_tasks: Number of pending tasks
            in_progress_tasks: Number of in-progress tasks
            work_complete: Whether all work is complete
        """
        logger = self.get_logger(logger_name)
        logger.info(
            f"Task status: {completed_tasks}/{total_tasks} complete, "
            f"{pending_tasks} pending, {in_progress_tasks} in-progress",
            extra={
                'action': 'task_status',
                'component': logger_name,
                'context': {
                    'total': total_tasks,
                    'completed': completed_tasks,
                    'pending': pending_tasks,
                    'in_progress': in_progress_tasks,
                    'work_complete': work_complete
                }
            }
        )
        
    def log_error(self, logger_name: str, error_message: str, error_details: Dict[str, Any] = None,
                  exc_info: bool = False):
        """
        Log an error with structured details.
        
        Args:
            logger_name: Component logger name
            error_message: Error message
            error_details: Additional error context
            exc_info: Whether to include exception traceback
        """
        logger = self.get_logger(logger_name)
        extra_data = {
            'action': 'error',
            'component': logger_name
        }
        
        if error_details:
            extra_data['error_details'] = error_details
            
        logger.error(error_message, extra=extra_data, exc_info=exc_info)
        
    def log_performance_metric(self, logger_name: str, metric_name: str, value: float,
                             unit: str = None, context: Dict[str, Any] = None):
        """
        Log a performance metric.
        
        Args:
            logger_name: Component logger name
            metric_name: Name of the metric
            value: Metric value
            unit: Unit of measurement
            context: Additional metric context
        """
        logger = self.get_logger(logger_name)
        message = f"Performance metric {metric_name}: {value}"
        if unit:
            message += f" {unit}"
            
        extra_data = {
            'action': 'performance',
            'component': logger_name,
            'context': {
                'metric_name': metric_name,
                'value': value,
                'unit': unit,
            }
        }
        
        if context:
            extra_data['context'].update(context)
        
        logger.info(message, extra=extra_data)
        
    def log_system_event(self, logger_name: str, event_type: str, description: str,
                        context: Dict[str, Any] = None):
        """
        Log a system event (startup, shutdown, config reload, etc.).
        
        Args:
            logger_name: Component logger name
            event_type: Type of system event
            description: Event description
            context: Additional event context
        """
        logger = self.get_logger(logger_name)
        logger.info(
            f"System event {event_type}: {description}",
            extra={
                'action': 'system_event',
                'component': logger_name,
                'context': context or {},
                'event_type': event_type
            }
        )
        
    def reload_config(self, new_config: Dict[str, Any]):
        """
        Reload logging configuration.
        
        Args:
            new_config: New configuration dictionary
        """
        old_config = self.config.copy()
        self.config.update(new_config)
        
        # Re-setup logging if critical parameters changed
        if (old_config.get('file') != self.config.get('file') or
            old_config.get('level') != self.config.get('level') or
            old_config.get('console') != self.config.get('console')):
            self._setup_logging()
            
        self.log_system_event('logger', 'config_reload', 'Logging configuration reloaded')
        
    def close(self):
        """Close all log handlers and clean up resources."""
        for logger in self._loggers.values():
            for handler in logger.handlers[:]:
                handler.close()
                logger.removeHandler(handler)
        self.log_system_event('logger', 'shutdown', 'Logging system shut down')


# Global logger instance
_global_logger: Optional[MonitorLogger] = None


def initialize_logging(config: Optional[Dict[str, Any]] = None) -> MonitorLogger:
    """
    Initialize the global logging system.
    
    Args:
        config: Configuration dictionary
        
    Returns:
        MonitorLogger instance
    """
    global _global_logger
    _global_logger = MonitorLogger(config)
    return _global_logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for a component.
    
    Args:
        name: Component name
        
    Returns:
        Logger instance
    """
    if _global_logger is None:
        initialize_logging()
    return _global_logger.get_logger(name)


def get_monitor_logger() -> MonitorLogger:
    """
    Get the global MonitorLogger instance.
    
    Returns:
        MonitorLogger instance
    """
    if _global_logger is None:
        initialize_logging()
    return _global_logger