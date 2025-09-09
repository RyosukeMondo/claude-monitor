# Configuration System

Robust configuration management system for the Claude Auto-Recovery System supporting YAML/JSON with validation, following requirements 4.1 and 4.5.

## Features

- **YAML/JSON Support**: Load configuration from YAML or JSON files
- **Environment Variable Overrides**: Override any configuration parameter via environment variables
- **Comprehensive Validation**: Type-safe validation with detailed error messages
- **Default Values**: Sensible defaults for all parameters
- **Graceful Degradation**: Handles missing config files gracefully
- **Error Handling**: Detailed error messages for troubleshooting

## Quick Start

```python
from config import load_config, get_config

# Load from default configuration
config = get_config()

# Load from specific file
config = load_config('config/claude-monitor.yml')

# Access configuration values
timeout = config.monitoring.idle_timeout
log_level = config.logging.level
tcp_port = config.tcp.port
```

## Configuration Structure

### Monitoring Configuration
Controls how the system detects different Claude Code execution states:

- `idle_timeout` (10-300s, default: 30): Time before considering Claude idle
- `input_timeout` (5-60s, default: 5): Time to wait for user input
- `context_pressure_timeout` (5-60s, default: 10): Time before context management
- `task_check_interval` (10-300s, default: 30): Interval for task status queries
- `completion_cooldown` (30-600s, default: 60): Wait before terminating monitoring

### Recovery Configuration
Controls automatic recovery actions and retry behavior:

- `max_retries` (1-10, default: 3): Maximum retry attempts
- `retry_backoff` (1.0-10.0, default: 2.0): Exponential backoff multiplier
- `compact_timeout` (10-120s, default: 30): Timeout for /compact commands

### Logging Configuration
Controls system logging behavior:

- `level` (DEBUG/INFO/WARNING/ERROR/CRITICAL, default: INFO): Log verbosity
- `file` (path, default: /tmp/claude-monitor.log): Log file location
- `console` (bool, default: true): Output to console
- `max_size_mb` (1-1000, default: 100): Max log file size before rotation

### Notifications Configuration
Controls user notification behavior:

- `desktop` (bool, default: true): Enable desktop notifications
- `log_actions` (bool, default: true): Log recovery actions
- `rate_limit_seconds` (10-3600, default: 60): Min time between similar notifications

### TCP Configuration
Controls connection to Claude Code expect bridge:

- `host` (string, default: localhost): TCP server hostname
- `port` (1-65535, default: 9999): TCP server port
- `connection_timeout` (1-60s, default: 5): Connection timeout

## Environment Variable Overrides

All configuration parameters can be overridden using environment variables with the `CLAUDE_MONITOR_` prefix:

```bash
# Override monitoring timeouts
export CLAUDE_MONITOR_IDLE_TIMEOUT=45
export CLAUDE_MONITOR_INPUT_TIMEOUT=8

# Override logging settings
export CLAUDE_MONITOR_LOG_LEVEL=DEBUG
export CLAUDE_MONITOR_LOG_CONSOLE=false

# Override TCP settings
export CLAUDE_MONITOR_TCP_HOST=127.0.0.1
export CLAUDE_MONITOR_TCP_PORT=8888

# Override notification settings
export CLAUDE_MONITOR_DESKTOP_NOTIFICATIONS=false
```

## Configuration Files

### YAML Format (recommended)
```yaml
monitoring:
  idle_timeout: 30
  input_timeout: 5
  context_pressure_timeout: 10
  task_check_interval: 30
  completion_cooldown: 60

recovery:
  max_retries: 3
  retry_backoff: 2.0
  compact_timeout: 30

logging:
  level: INFO
  file: /tmp/claude-monitor.log
  console: true
  max_size_mb: 100

notifications:
  desktop: true
  log_actions: true
  rate_limit_seconds: 60

tcp:
  host: localhost
  port: 9999
  connection_timeout: 5
```

### JSON Format
```json
{
  "monitoring": {
    "idle_timeout": 30,
    "input_timeout": 5,
    "context_pressure_timeout": 10,
    "task_check_interval": 30,
    "completion_cooldown": 60
  },
  "recovery": {
    "max_retries": 3,
    "retry_backoff": 2.0,
    "compact_timeout": 30
  },
  "logging": {
    "level": "INFO",
    "file": "/tmp/claude-monitor.log",
    "console": true,
    "max_size_mb": 100
  },
  "notifications": {
    "desktop": true,
    "log_actions": true,
    "rate_limit_seconds": 60
  },
  "tcp": {
    "host": "localhost",
    "port": 9999,
    "connection_timeout": 5
  }
}
```

## Error Handling

The configuration system provides detailed error messages for common issues:

### Validation Errors
```python
try:
    config = load_config('invalid-config.yml')
except ConfigurationError as e:
    print(f"Configuration validation failed: {e}")
    # Output: Configuration validation failed:
    #   - monitoring.idle_timeout must be between 10 and 300 seconds
    #   - tcp.port must be between 1 and 65535
```

### File Not Found
```python
try:
    config = load_config('nonexistent.yml')
except FileNotFoundError as e:
    print(f"Config file not found: {e}")
```

### Invalid File Format
```python
try:
    config = load_config('malformed.yml')
except ConfigurationError as e:
    print(f"Failed to parse config file: {e}")
```

## Testing

Run the comprehensive test suite:

```bash
python -m pytest tests/unit/test_config.py -v
```

Example test output:
```
38 tests passed - covering:
✅ Default value validation
✅ Configuration loading (YAML/JSON)
✅ Environment variable overrides
✅ Validation error handling
✅ File handling edge cases
✅ Type safety and bounds checking
```

## Usage Examples

See `examples/config_usage.py` for a complete demonstration of all features:

```bash
python examples/config_usage.py
```

## Integration

The configuration system integrates seamlessly with other system components:

```python
from config import get_config

def main():
    config = get_config()
    
    # Use in logging setup
    logging.basicConfig(
        level=getattr(logging, config.logging.level),
        filename=config.logging.file if not config.logging.console else None
    )
    
    # Use in TCP client
    tcp_client = TCPClient(
        host=config.tcp.host,
        port=config.tcp.port,
        timeout=config.tcp.connection_timeout
    )
    
    # Use in monitoring loop
    monitor = Monitor(
        idle_timeout=config.monitoring.idle_timeout,
        task_check_interval=config.monitoring.task_check_interval
    )
```

## Requirements

- Python 3.7+
- PyYAML>=6.0
- No additional dependencies for core functionality
- pytest>=7.0.0 for running tests

## License

Part of the Claude Auto-Recovery System project.