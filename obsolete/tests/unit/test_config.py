"""
Unit tests for configuration management system.

Tests configuration loading, validation, environment overrides,
and error handling for the Claude Auto-Recovery System.
"""

import os
import json
import yaml
import tempfile
import pytest
from pathlib import Path
from unittest.mock import patch, mock_open

import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent / 'src'))

from config.config import (
    Config, ConfigManager, ConfigurationError,
    MonitoringConfig, RecoveryConfig, LoggingConfig, 
    NotificationsConfig, TcpConfig,
    get_config_manager, get_config, load_config, reload_config
)


class TestMonitoringConfig:
    """Test MonitoringConfig validation and defaults."""
    
    def test_default_values(self):
        """Test that default values are set correctly."""
        config = MonitoringConfig()
        assert config.idle_timeout == 30
        assert config.input_timeout == 5
        assert config.context_pressure_timeout == 10
        assert config.task_check_interval == 30
        assert config.completion_cooldown == 60
        
    def test_custom_values(self):
        """Test that custom values can be set."""
        config = MonitoringConfig(
            idle_timeout=60,
            input_timeout=10,
            context_pressure_timeout=15,
            task_check_interval=45,
            completion_cooldown=120
        )
        assert config.idle_timeout == 60
        assert config.input_timeout == 10
        assert config.context_pressure_timeout == 15
        assert config.task_check_interval == 45
        assert config.completion_cooldown == 120
        
    def test_validation_success(self):
        """Test that valid configuration passes validation."""
        config = MonitoringConfig()
        errors = config.validate()
        assert errors == []
        
    def test_validation_idle_timeout_bounds(self):
        """Test idle_timeout validation bounds."""
        config = MonitoringConfig(idle_timeout=5)  # Too low
        errors = config.validate()
        assert any("idle_timeout must be between 10 and 300" in error for error in errors)
        
        config = MonitoringConfig(idle_timeout=400)  # Too high
        errors = config.validate()
        assert any("idle_timeout must be between 10 and 300" in error for error in errors)
        
    def test_validation_input_timeout_bounds(self):
        """Test input_timeout validation bounds."""
        config = MonitoringConfig(input_timeout=2)  # Too low
        errors = config.validate()
        assert any("input_timeout must be between 5 and 60" in error for error in errors)
        
        config = MonitoringConfig(input_timeout=70)  # Too high
        errors = config.validate()
        assert any("input_timeout must be between 5 and 60" in error for error in errors)


class TestRecoveryConfig:
    """Test RecoveryConfig validation and defaults."""
    
    def test_default_values(self):
        """Test that default values are set correctly."""
        config = RecoveryConfig()
        assert config.max_retries == 3
        assert config.retry_backoff == 2.0
        assert config.compact_timeout == 30
        
    def test_validation_success(self):
        """Test that valid configuration passes validation."""
        config = RecoveryConfig()
        errors = config.validate()
        assert errors == []
        
    def test_validation_max_retries_bounds(self):
        """Test max_retries validation bounds."""
        config = RecoveryConfig(max_retries=0)  # Too low
        errors = config.validate()
        assert any("max_retries must be between 1 and 10" in error for error in errors)
        
        config = RecoveryConfig(max_retries=15)  # Too high
        errors = config.validate()
        assert any("max_retries must be between 1 and 10" in error for error in errors)


class TestLoggingConfig:
    """Test LoggingConfig validation and defaults."""
    
    def test_default_values(self):
        """Test that default values are set correctly."""
        config = LoggingConfig()
        assert config.level == "INFO"
        assert config.file == "/tmp/claude-monitor.log"
        assert config.console is True
        assert config.max_size_mb == 100
        
    def test_validation_success(self):
        """Test that valid configuration passes validation."""
        config = LoggingConfig()
        errors = config.validate()
        assert errors == []
        
    def test_validation_invalid_level(self):
        """Test validation of invalid log level."""
        config = LoggingConfig(level="INVALID")
        errors = config.validate()
        assert any("level must be one of" in error for error in errors)
        
    def test_validation_max_size_bounds(self):
        """Test max_size_mb validation bounds."""
        config = LoggingConfig(max_size_mb=0)  # Too low
        errors = config.validate()
        assert any("max_size_mb must be between 1 and 1000" in error for error in errors)
        
        config = LoggingConfig(max_size_mb=2000)  # Too high
        errors = config.validate()
        assert any("max_size_mb must be between 1 and 1000" in error for error in errors)


class TestTcpConfig:
    """Test TcpConfig validation and defaults."""
    
    def test_default_values(self):
        """Test that default values are set correctly."""
        config = TcpConfig()
        assert config.host == "localhost"
        assert config.port == 9999
        assert config.connection_timeout == 5
        
    def test_validation_success(self):
        """Test that valid configuration passes validation."""
        config = TcpConfig()
        errors = config.validate()
        assert errors == []
        
    def test_validation_port_bounds(self):
        """Test port validation bounds."""
        config = TcpConfig(port=0)  # Too low
        errors = config.validate()
        assert any("port must be between 1 and 65535" in error for error in errors)
        
        config = TcpConfig(port=70000)  # Too high
        errors = config.validate()
        assert any("port must be between 1 and 65535" in error for error in errors)
        
    def test_validation_empty_host(self):
        """Test validation of empty host."""
        config = TcpConfig(host="")
        errors = config.validate()
        assert any("host cannot be empty" in error for error in errors)
        
        config = TcpConfig(host="   ")  # Whitespace only
        errors = config.validate()
        assert any("host cannot be empty" in error for error in errors)


class TestConfig:
    """Test main Config class."""
    
    def test_default_initialization(self):
        """Test that Config initializes with defaults when no dict provided."""
        config = Config()
        assert isinstance(config.monitoring, MonitoringConfig)
        assert isinstance(config.recovery, RecoveryConfig)
        assert isinstance(config.logging, LoggingConfig)
        assert isinstance(config.notifications, NotificationsConfig)
        assert isinstance(config.tcp, TcpConfig)
        
    def test_dict_initialization(self):
        """Test that Config can be initialized with a dictionary."""
        config_dict = {
            'monitoring': {'idle_timeout': 60},
            'recovery': {'max_retries': 5},
            'logging': {'level': 'DEBUG'},
            'notifications': {'desktop': False},
            'tcp': {'port': 8888}
        }
        config = Config(config_dict)
        
        assert config.monitoring.idle_timeout == 60
        assert config.recovery.max_retries == 5
        assert config.logging.level == 'DEBUG'
        assert config.notifications.desktop is False
        assert config.tcp.port == 8888
        
    def test_validation_all_sections(self):
        """Test that validation checks all sections."""
        config_dict = {
            'monitoring': {'idle_timeout': 5},  # Invalid
            'recovery': {'max_retries': 0},     # Invalid
            'logging': {'level': 'INVALID'},    # Invalid
            'tcp': {'port': 0}                  # Invalid
        }
        config = Config(config_dict)
        errors = config.validate()
        
        # Should have errors from multiple sections
        assert len(errors) >= 4
        assert any("monitoring." in error for error in errors)
        assert any("recovery." in error for error in errors)
        assert any("logging." in error for error in errors)
        assert any("tcp." in error for error in errors)
        
    def test_to_dict(self):
        """Test that configuration can be converted back to dictionary."""
        config = Config()
        config_dict = config.to_dict()
        
        assert 'monitoring' in config_dict
        assert 'recovery' in config_dict
        assert 'logging' in config_dict
        assert 'notifications' in config_dict
        assert 'tcp' in config_dict
        
        # Check that values are preserved
        assert config_dict['monitoring']['idle_timeout'] == 30
        assert config_dict['tcp']['port'] == 9999


class TestConfigManager:
    """Test ConfigManager functionality."""
    
    def test_initialization(self):
        """Test ConfigManager initialization."""
        manager = ConfigManager()
        assert manager.config_path is None
        assert manager._config is None
        
        manager = ConfigManager("/path/to/config.yml")
        assert manager.config_path == Path("/path/to/config.yml")
        
    def test_load_default_config(self):
        """Test loading default configuration when no file specified."""
        manager = ConfigManager()
        config = manager.load_config()
        
        assert isinstance(config, Config)
        assert config.monitoring.idle_timeout == 30  # Default value
        
    def test_load_yaml_config(self):
        """Test loading YAML configuration file."""
        yaml_content = """
monitoring:
  idle_timeout: 45
  input_timeout: 8
recovery:
  max_retries: 5
logging:
  level: DEBUG
  console: false
tcp:
  port: 8888
"""
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yml', delete=False) as f:
            f.write(yaml_content)
            temp_path = f.name
            
        try:
            manager = ConfigManager()
            config = manager.load_config(temp_path)
            
            assert config.monitoring.idle_timeout == 45
            assert config.monitoring.input_timeout == 8
            assert config.recovery.max_retries == 5
            assert config.logging.level == "DEBUG"
            assert config.logging.console is False
            assert config.tcp.port == 8888
            
        finally:
            os.unlink(temp_path)
            
    def test_load_json_config(self):
        """Test loading JSON configuration file."""
        json_content = {
            "monitoring": {
                "idle_timeout": 50,
                "task_check_interval": 45
            },
            "recovery": {
                "retry_backoff": 3.0
            },
            "tcp": {
                "host": "127.0.0.1",
                "port": 7777
            }
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(json_content, f)
            temp_path = f.name
            
        try:
            manager = ConfigManager()
            config = manager.load_config(temp_path)
            
            assert config.monitoring.idle_timeout == 50
            assert config.monitoring.task_check_interval == 45
            assert config.recovery.retry_backoff == 3.0
            assert config.tcp.host == "127.0.0.1"
            assert config.tcp.port == 7777
            
        finally:
            os.unlink(temp_path)
            
    def test_file_not_found(self):
        """Test handling of non-existent configuration file."""
        manager = ConfigManager()
        
        with pytest.raises(FileNotFoundError):
            manager.load_config("/nonexistent/config.yml")
            
    def test_invalid_yaml(self):
        """Test handling of invalid YAML file."""
        invalid_yaml = """
monitoring:
  idle_timeout: 30
    invalid_indent: value
"""
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yml', delete=False) as f:
            f.write(invalid_yaml)
            temp_path = f.name
            
        try:
            manager = ConfigManager()
            
            with pytest.raises(ConfigurationError) as exc_info:
                manager.load_config(temp_path)
            assert "Failed to parse configuration file" in str(exc_info.value)
            
        finally:
            os.unlink(temp_path)
            
    def test_invalid_json(self):
        """Test handling of invalid JSON file."""
        invalid_json = '{"monitoring": {"idle_timeout": 30,}}'  # Trailing comma
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write(invalid_json)
            temp_path = f.name
            
        try:
            manager = ConfigManager()
            
            with pytest.raises(ConfigurationError) as exc_info:
                manager.load_config(temp_path)
            assert "Failed to parse configuration file" in str(exc_info.value)
            
        finally:
            os.unlink(temp_path)
            
    def test_validation_errors(self):
        """Test handling of configuration validation errors."""
        invalid_config = {
            "monitoring": {
                "idle_timeout": 5  # Too low, should trigger validation error
            },
            "tcp": {
                "port": 0  # Invalid port
            }
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(invalid_config, f)
            temp_path = f.name
            
        try:
            manager = ConfigManager()
            
            with pytest.raises(ConfigurationError) as exc_info:
                manager.load_config(temp_path)
            assert "Configuration validation failed" in str(exc_info.value)
            
        finally:
            os.unlink(temp_path)
            
    @patch.dict(os.environ, {
        'CLAUDE_MONITOR_IDLE_TIMEOUT': '60',
        'CLAUDE_MONITOR_LOG_LEVEL': 'DEBUG',
        'CLAUDE_MONITOR_TCP_PORT': '8888',
        'CLAUDE_MONITOR_LOG_CONSOLE': 'false'
    })
    def test_environment_overrides(self):
        """Test environment variable overrides."""
        manager = ConfigManager()
        config = manager.load_config()
        
        assert config.monitoring.idle_timeout == 60
        assert config.logging.level == 'DEBUG'
        assert config.tcp.port == 8888
        assert config.logging.console is False
        
    @patch.dict(os.environ, {
        'CLAUDE_MONITOR_INVALID_VAR': 'invalid_value'
    })
    def test_invalid_environment_variables_ignored(self):
        """Test that invalid environment variables are ignored."""
        manager = ConfigManager()
        config = manager.load_config()
        
        # Should load successfully with defaults despite invalid env var
        assert config.monitoring.idle_timeout == 30  # Default value
        
    def test_get_config(self):
        """Test get_config method."""
        manager = ConfigManager()
        
        # First call should load config
        config1 = manager.get_config()
        assert isinstance(config1, Config)
        
        # Second call should return same instance
        config2 = manager.get_config()
        assert config2 is config1
        
    def test_reload_config(self):
        """Test reload_config method."""
        manager = ConfigManager()
        
        # Load initial config
        config1 = manager.get_config()
        
        # Reload should create new instance
        config2 = manager.reload_config()
        assert config2 is not config1
        assert isinstance(config2, Config)
        
    def test_save_config_yaml(self):
        """Test saving configuration to YAML file."""
        manager = ConfigManager()
        config = manager.load_config()
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yml', delete=False) as f:
            temp_path = f.name
            
        try:
            manager.save_config(temp_path, "yaml")
            
            # Verify file was created and is valid YAML
            with open(temp_path, 'r') as f:
                saved_data = yaml.safe_load(f)
                
            assert 'monitoring' in saved_data
            assert saved_data['monitoring']['idle_timeout'] == 30
            
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
                
    def test_save_config_json(self):
        """Test saving configuration to JSON file."""
        manager = ConfigManager()
        config = manager.load_config()
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            temp_path = f.name
            
        try:
            manager.save_config(temp_path, "json")
            
            # Verify file was created and is valid JSON
            with open(temp_path, 'r') as f:
                saved_data = json.load(f)
                
            assert 'monitoring' in saved_data
            assert saved_data['monitoring']['idle_timeout'] == 30
            
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)


class TestGlobalFunctions:
    """Test global configuration functions."""
    
    def test_get_config_manager(self):
        """Test get_config_manager function."""
        manager = get_config_manager()
        assert isinstance(manager, ConfigManager)
        
        # Should return same instance on subsequent calls
        manager2 = get_config_manager()
        assert manager2 is manager
        
    def test_get_config(self):
        """Test get_config function."""
        config = get_config()
        assert isinstance(config, Config)
        
    def test_load_config(self):
        """Test load_config function."""
        config = load_config()
        assert isinstance(config, Config)
        
    def test_reload_config(self):
        """Test reload_config function."""
        config = reload_config()
        assert isinstance(config, Config)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])