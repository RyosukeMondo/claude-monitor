"""
Configuration management system for Claude Auto-Recovery System.

Supports YAML/JSON configuration loading with validation, default values,
and environment variable overrides following requirements 4.1 and 4.5.
"""

import os
import json
import yaml
from pathlib import Path
from typing import Dict, Any, Optional, Union, List
from dataclasses import dataclass, asdict
import logging


@dataclass
class MonitoringConfig:
    """Configuration for monitoring parameters."""
    idle_timeout: int = 30  # seconds
    input_timeout: int = 5  # seconds
    context_pressure_timeout: int = 10  # seconds
    task_check_interval: int = 30  # seconds
    completion_cooldown: int = 60  # seconds
    
    def validate(self) -> List[str]:
        """Validate monitoring configuration parameters."""
        errors = []
        
        if not (10 <= self.idle_timeout <= 300):
            errors.append("idle_timeout must be between 10 and 300 seconds")
        
        if not (5 <= self.input_timeout <= 60):
            errors.append("input_timeout must be between 5 and 60 seconds")
            
        if not (5 <= self.context_pressure_timeout <= 60):
            errors.append("context_pressure_timeout must be between 5 and 60 seconds")
            
        if not (10 <= self.task_check_interval <= 300):
            errors.append("task_check_interval must be between 10 and 300 seconds")
            
        if not (30 <= self.completion_cooldown <= 600):
            errors.append("completion_cooldown must be between 30 and 600 seconds")
            
        return errors


@dataclass
class RecoveryConfig:
    """Configuration for recovery actions."""
    max_retries: int = 3
    retry_backoff: float = 2.0  # multiplier for exponential backoff
    compact_timeout: int = 30  # seconds
    
    def validate(self) -> List[str]:
        """Validate recovery configuration parameters."""
        errors = []
        
        if not (1 <= self.max_retries <= 10):
            errors.append("max_retries must be between 1 and 10")
            
        if not (1.0 <= self.retry_backoff <= 10.0):
            errors.append("retry_backoff must be between 1.0 and 10.0")
            
        if not (10 <= self.compact_timeout <= 120):
            errors.append("compact_timeout must be between 10 and 120 seconds")
            
        return errors


@dataclass
class LoggingConfig:
    """Configuration for logging system."""
    level: str = "INFO"
    file: str = "/tmp/claude-monitor.log"
    console: bool = True
    max_size_mb: int = 100
    
    def validate(self) -> List[str]:
        """Validate logging configuration parameters."""
        errors = []
        
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if self.level not in valid_levels:
            errors.append(f"level must be one of {valid_levels}")
            
        if not (1 <= self.max_size_mb <= 1000):
            errors.append("max_size_mb must be between 1 and 1000")
            
        # Validate log file path is writable
        log_dir = Path(self.file).parent
        if not log_dir.exists():
            try:
                log_dir.mkdir(parents=True, exist_ok=True)
            except (PermissionError, OSError):
                errors.append(f"log directory {log_dir} is not writable")
                
        return errors


@dataclass
class NotificationsConfig:
    """Configuration for notification system."""
    desktop: bool = True
    log_actions: bool = True
    rate_limit_seconds: int = 60  # minimum seconds between similar notifications
    
    def validate(self) -> List[str]:
        """Validate notifications configuration parameters."""
        errors = []
        
        if not (10 <= self.rate_limit_seconds <= 3600):
            errors.append("rate_limit_seconds must be between 10 and 3600")
            
        return errors


@dataclass
class TcpConfig:
    """Configuration for TCP communication."""
    host: str = "localhost"
    port: int = 9999
    connection_timeout: int = 5  # seconds
    
    def validate(self) -> List[str]:
        """Validate TCP configuration parameters."""
        errors = []
        
        if not (1 <= self.port <= 65535):
            errors.append("port must be between 1 and 65535")
            
        if not (1 <= self.connection_timeout <= 60):
            errors.append("connection_timeout must be between 1 and 60 seconds")
            
        # Basic host validation
        if not self.host or len(self.host.strip()) == 0:
            errors.append("host cannot be empty")
            
        return errors


@dataclass
class Config:
    """Main configuration class containing all subsystem configurations."""
    monitoring: MonitoringConfig
    recovery: RecoveryConfig
    logging: LoggingConfig
    notifications: NotificationsConfig
    tcp: TcpConfig
    
    def __init__(self, config_dict: Optional[Dict[str, Any]] = None):
        """Initialize configuration with optional dictionary override."""
        if config_dict is None:
            config_dict = {}
            
        # Initialize with defaults and apply overrides
        self.monitoring = MonitoringConfig(**config_dict.get('monitoring', {}))
        self.recovery = RecoveryConfig(**config_dict.get('recovery', {}))
        self.logging = LoggingConfig(**config_dict.get('logging', {}))
        self.notifications = NotificationsConfig(**config_dict.get('notifications', {}))
        self.tcp = TcpConfig(**config_dict.get('tcp', {}))
    
    def validate(self) -> List[str]:
        """Validate all configuration sections."""
        errors = []
        
        # Validate each section
        errors.extend([f"monitoring.{e}" for e in self.monitoring.validate()])
        errors.extend([f"recovery.{e}" for e in self.recovery.validate()])
        errors.extend([f"logging.{e}" for e in self.logging.validate()])
        errors.extend([f"notifications.{e}" for e in self.notifications.validate()])
        errors.extend([f"tcp.{e}" for e in self.tcp.validate()])
        
        return errors
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert configuration to dictionary."""
        return {
            'monitoring': asdict(self.monitoring),
            'recovery': asdict(self.recovery),
            'logging': asdict(self.logging),
            'notifications': asdict(self.notifications),
            'tcp': asdict(self.tcp)
        }


class ConfigManager:
    """Configuration management system with YAML/JSON support and environment overrides."""
    
    def __init__(self, config_path: Optional[Union[str, Path]] = None):
        """Initialize configuration manager with optional config file path."""
        self.config_path = Path(config_path) if config_path else None
        self._config: Optional[Config] = None
        self._logger = logging.getLogger(__name__)
        
        # Environment variable prefix
        self.env_prefix = "CLAUDE_MONITOR_"
        
    def load_config(self, config_path: Optional[Union[str, Path]] = None) -> Config:
        """
        Load configuration from file with environment variable overrides.
        
        Args:
            config_path: Optional path to configuration file
            
        Returns:
            Config: Loaded and validated configuration
            
        Raises:
            ConfigurationError: If configuration is invalid
            FileNotFoundError: If config file specified but not found
        """
        if config_path:
            self.config_path = Path(config_path)
            
        config_dict = {}
        
        # Load from file if specified and exists
        if self.config_path and self.config_path.exists():
            config_dict = self._load_config_file(self.config_path)
            self._logger.info(f"Loaded configuration from {self.config_path}")
        elif self.config_path:
            raise FileNotFoundError(f"Configuration file not found: {self.config_path}")
        else:
            self._logger.info("Using default configuration (no config file specified)")
            
        # Apply environment variable overrides
        env_overrides = self._load_env_overrides()
        if env_overrides:
            config_dict = self._merge_configs(config_dict, env_overrides)
            self._logger.info(f"Applied {len(env_overrides)} environment variable overrides")
            
        # Create and validate configuration
        config = Config(config_dict)
        validation_errors = config.validate()
        
        if validation_errors:
            error_msg = "Configuration validation failed:\n" + "\n".join(f"  - {error}" for error in validation_errors)
            raise ConfigurationError(error_msg)
            
        self._config = config
        self._logger.info("Configuration loaded and validated successfully")
        return config
        
    def get_config(self) -> Config:
        """Get current configuration, loading defaults if not already loaded."""
        if self._config is None:
            return self.load_config()
        return self._config
        
    def reload_config(self) -> Config:
        """Reload configuration from file."""
        self._config = None
        return self.load_config()
        
    def _load_config_file(self, config_path: Path) -> Dict[str, Any]:
        """Load configuration from YAML or JSON file."""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Determine file type and parse accordingly
            if config_path.suffix.lower() in ['.yaml', '.yml']:
                return yaml.safe_load(content) or {}
            elif config_path.suffix.lower() == '.json':
                return json.loads(content)
            else:
                # Try YAML first, then JSON
                try:
                    return yaml.safe_load(content) or {}
                except yaml.YAMLError:
                    return json.loads(content)
                    
        except (yaml.YAMLError, json.JSONDecodeError) as e:
            raise ConfigurationError(f"Failed to parse configuration file {config_path}: {e}")
        except (IOError, OSError) as e:
            raise ConfigurationError(f"Failed to read configuration file {config_path}: {e}")
            
    def _load_env_overrides(self) -> Dict[str, Any]:
        """Load configuration overrides from environment variables."""
        overrides = {}
        
        # Define mapping of environment variables to config paths
        env_mappings = {
            # Monitoring
            f"{self.env_prefix}IDLE_TIMEOUT": ("monitoring", "idle_timeout", int),
            f"{self.env_prefix}INPUT_TIMEOUT": ("monitoring", "input_timeout", int),
            f"{self.env_prefix}CONTEXT_PRESSURE_TIMEOUT": ("monitoring", "context_pressure_timeout", int),
            f"{self.env_prefix}TASK_CHECK_INTERVAL": ("monitoring", "task_check_interval", int),
            f"{self.env_prefix}COMPLETION_COOLDOWN": ("monitoring", "completion_cooldown", int),
            
            # Recovery
            f"{self.env_prefix}MAX_RETRIES": ("recovery", "max_retries", int),
            f"{self.env_prefix}RETRY_BACKOFF": ("recovery", "retry_backoff", float),
            f"{self.env_prefix}COMPACT_TIMEOUT": ("recovery", "compact_timeout", int),
            
            # Logging
            f"{self.env_prefix}LOG_LEVEL": ("logging", "level", str),
            f"{self.env_prefix}LOG_FILE": ("logging", "file", str),
            f"{self.env_prefix}LOG_CONSOLE": ("logging", "console", self._parse_bool),
            f"{self.env_prefix}LOG_MAX_SIZE_MB": ("logging", "max_size_mb", int),
            
            # Notifications
            f"{self.env_prefix}DESKTOP_NOTIFICATIONS": ("notifications", "desktop", self._parse_bool),
            f"{self.env_prefix}LOG_ACTIONS": ("notifications", "log_actions", self._parse_bool),
            f"{self.env_prefix}NOTIFICATION_RATE_LIMIT": ("notifications", "rate_limit_seconds", int),
            
            # TCP
            f"{self.env_prefix}TCP_HOST": ("tcp", "host", str),
            f"{self.env_prefix}TCP_PORT": ("tcp", "port", int),
            f"{self.env_prefix}TCP_TIMEOUT": ("tcp", "connection_timeout", int),
        }
        
        for env_var, (section, key, type_converter) in env_mappings.items():
            value = os.getenv(env_var)
            if value is not None:
                try:
                    converted_value = type_converter(value)
                    if section not in overrides:
                        overrides[section] = {}
                    overrides[section][key] = converted_value
                except (ValueError, TypeError) as e:
                    self._logger.warning(f"Invalid value for {env_var}: {value} ({e})")
                    
        return overrides
        
    def _parse_bool(self, value: str) -> bool:
        """Parse boolean value from string."""
        return value.lower() in ('true', '1', 'yes', 'on', 'enabled')
        
    def _merge_configs(self, base_config: Dict[str, Any], override_config: Dict[str, Any]) -> Dict[str, Any]:
        """Deep merge two configuration dictionaries."""
        result = base_config.copy()
        
        for key, value in override_config.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._merge_configs(result[key], value)
            else:
                result[key] = value
                
        return result
        
    def save_config(self, config_path: Optional[Union[str, Path]] = None, format_type: str = "yaml") -> None:
        """
        Save current configuration to file.
        
        Args:
            config_path: Optional path to save configuration
            format_type: Format to save ('yaml' or 'json')
        """
        if config_path:
            save_path = Path(config_path)
        elif self.config_path:
            save_path = self.config_path
        else:
            raise ValueError("No config path specified for saving")
            
        if self._config is None:
            raise ValueError("No configuration loaded to save")
            
        config_dict = self._config.to_dict()
        
        try:
            with open(save_path, 'w', encoding='utf-8') as f:
                if format_type.lower() == "json":
                    json.dump(config_dict, f, indent=2, sort_keys=True)
                else:
                    yaml.safe_dump(config_dict, f, indent=2, sort_keys=True, default_flow_style=False)
                    
            self._logger.info(f"Configuration saved to {save_path}")
            
        except (IOError, OSError) as e:
            raise ConfigurationError(f"Failed to save configuration to {save_path}: {e}")


class ConfigurationError(Exception):
    """Custom exception for configuration-related errors."""
    pass


# Global configuration instance
_config_manager: Optional[ConfigManager] = None


def get_config_manager() -> ConfigManager:
    """Get global configuration manager instance."""
    global _config_manager
    if _config_manager is None:
        _config_manager = ConfigManager()
    return _config_manager


def get_config() -> Config:
    """Get current configuration."""
    return get_config_manager().get_config()


def load_config(config_path: Optional[Union[str, Path]] = None) -> Config:
    """Load configuration from file."""
    return get_config_manager().load_config(config_path)


def reload_config() -> Config:
    """Reload configuration from file."""
    return get_config_manager().reload_config()