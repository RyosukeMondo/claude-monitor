"""
Configuration package for Claude Auto-Recovery System.

This package provides comprehensive configuration management with:
- YAML/JSON file support
- Environment variable overrides  
- Comprehensive validation
- Type safety
- Default values

Example usage:
    from config import load_config, get_config
    
    # Load from file with env overrides
    config = load_config('config/claude-monitor.yml')
    
    # Or get current config (loads defaults if not already loaded)
    config = get_config()
    
    # Access configuration values
    timeout = config.monitoring.idle_timeout
    log_level = config.logging.level
"""

from .config import (
    Config, ConfigManager, ConfigurationError,
    MonitoringConfig, RecoveryConfig, LoggingConfig,
    NotificationsConfig, TcpConfig,
    get_config_manager, get_config, load_config, reload_config
)

__all__ = [
    'Config', 'ConfigManager', 'ConfigurationError',
    'MonitoringConfig', 'RecoveryConfig', 'LoggingConfig',
    'NotificationsConfig', 'TcpConfig',
    'get_config_manager', 'get_config', 'load_config', 'reload_config'
]