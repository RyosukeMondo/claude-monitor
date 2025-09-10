#!/usr/bin/env python3
"""
Example usage of the Claude Auto-Recovery System configuration system.

This script demonstrates how to:
- Load configuration from files
- Use environment variable overrides
- Handle validation errors
- Access configuration values
"""

import os
import sys
from pathlib import Path

# Add src to path for importing config module
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from config import load_config, get_config, ConfigurationError


def main():
    """Demonstrate configuration system usage."""
    
    print("=== Claude Auto-Recovery Configuration System Demo ===\n")
    
    # Example 1: Load default configuration
    print("1. Loading default configuration...")
    try:
        config = get_config()
        print(f"   ✅ Default config loaded successfully")
        print(f"   - Idle timeout: {config.monitoring.idle_timeout}s")
        print(f"   - Log level: {config.logging.level}")
        print(f"   - TCP port: {config.tcp.port}")
        print()
    except Exception as e:
        print(f"   ❌ Failed to load default config: {e}")
        return
        
    # Example 2: Load from YAML file
    print("2. Loading from YAML configuration file...")
    yaml_path = Path(__file__).parent.parent / 'config' / 'claude-monitor.yml'
    if yaml_path.exists():
        try:
            config = load_config(yaml_path)
            print(f"   ✅ YAML config loaded from {yaml_path}")
            print(f"   - Monitoring cooldown: {config.monitoring.completion_cooldown}s")
            print(f"   - Max retries: {config.recovery.max_retries}")
            print(f"   - Console logging: {config.logging.console}")
            print()
        except Exception as e:
            print(f"   ❌ Failed to load YAML config: {e}")
    else:
        print(f"   ⚠️  YAML config file not found at {yaml_path}")
        
    # Example 3: Load from JSON file
    print("3. Loading from JSON configuration file...")
    json_path = Path(__file__).parent.parent / 'config' / 'claude-monitor.json'
    if json_path.exists():
        try:
            config = load_config(json_path)
            print(f"   ✅ JSON config loaded from {json_path}")
            print(f"   - Desktop notifications: {config.notifications.desktop}")
            print(f"   - Rate limit: {config.notifications.rate_limit_seconds}s")
            print(f"   - TCP host: {config.tcp.host}")
            print()
        except Exception as e:
            print(f"   ❌ Failed to load JSON config: {e}")
    else:
        print(f"   ⚠️  JSON config file not found at {json_path}")
        
    # Example 4: Environment variable overrides
    print("4. Demonstrating environment variable overrides...")
    
    # Set some environment variables
    os.environ['CLAUDE_MONITOR_IDLE_TIMEOUT'] = '60'
    os.environ['CLAUDE_MONITOR_LOG_LEVEL'] = 'DEBUG'
    os.environ['CLAUDE_MONITOR_TCP_PORT'] = '8888'
    os.environ['CLAUDE_MONITOR_DESKTOP_NOTIFICATIONS'] = 'false'
    
    try:
        config = load_config(yaml_path if yaml_path.exists() else None)
        print("   ✅ Environment overrides applied:")
        print(f"   - Idle timeout: {config.monitoring.idle_timeout}s (env: 60)")
        print(f"   - Log level: {config.logging.level} (env: DEBUG)")
        print(f"   - TCP port: {config.tcp.port} (env: 8888)")
        print(f"   - Desktop notifications: {config.notifications.desktop} (env: false)")
        print()
    except Exception as e:
        print(f"   ❌ Failed to apply environment overrides: {e}")
        
    # Clean up environment variables
    for key in ['CLAUDE_MONITOR_IDLE_TIMEOUT', 'CLAUDE_MONITOR_LOG_LEVEL', 
                'CLAUDE_MONITOR_TCP_PORT', 'CLAUDE_MONITOR_DESKTOP_NOTIFICATIONS']:
        os.environ.pop(key, None)
        
    # Example 5: Configuration validation
    print("5. Demonstrating configuration validation...")
    try:
        # Set an invalid environment variable
        os.environ['CLAUDE_MONITOR_IDLE_TIMEOUT'] = '5'  # Too low, should be >= 10
        os.environ['CLAUDE_MONITOR_TCP_PORT'] = '99999'  # Too high, should be <= 65535
        
        config = load_config()
        print("   ❌ Validation should have failed!")
        
    except ConfigurationError as e:
        print("   ✅ Validation correctly caught configuration errors:")
        for line in str(e).split('\n'):
            if line.strip() and 'Configuration validation failed' not in line:
                print(f"      {line.strip()}")
        print()
        
    except Exception as e:
        print(f"   ❌ Unexpected error during validation: {e}")
        
    # Clean up
    os.environ.pop('CLAUDE_MONITOR_IDLE_TIMEOUT', None)
    os.environ.pop('CLAUDE_MONITOR_TCP_PORT', None)
    
    # Example 6: Accessing all configuration sections
    print("6. Complete configuration structure:")
    config = get_config()
    
    print("   Monitoring:")
    print(f"      - idle_timeout: {config.monitoring.idle_timeout}s")
    print(f"      - input_timeout: {config.monitoring.input_timeout}s")
    print(f"      - context_pressure_timeout: {config.monitoring.context_pressure_timeout}s")
    print(f"      - task_check_interval: {config.monitoring.task_check_interval}s")
    print(f"      - completion_cooldown: {config.monitoring.completion_cooldown}s")
    
    print("   Recovery:")
    print(f"      - max_retries: {config.recovery.max_retries}")
    print(f"      - retry_backoff: {config.recovery.retry_backoff}")
    print(f"      - compact_timeout: {config.recovery.compact_timeout}s")
    
    print("   Logging:")
    print(f"      - level: {config.logging.level}")
    print(f"      - file: {config.logging.file}")
    print(f"      - console: {config.logging.console}")
    print(f"      - max_size_mb: {config.logging.max_size_mb}")
    
    print("   Notifications:")
    print(f"      - desktop: {config.notifications.desktop}")
    print(f"      - log_actions: {config.notifications.log_actions}")
    print(f"      - rate_limit_seconds: {config.notifications.rate_limit_seconds}")
    
    print("   TCP:")
    print(f"      - host: {config.tcp.host}")
    print(f"      - port: {config.tcp.port}")
    print(f"      - connection_timeout: {config.tcp.connection_timeout}s")
    
    print("\n✅ Configuration system demo completed successfully!")


if __name__ == "__main__":
    main()