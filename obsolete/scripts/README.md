# Claude Monitor Service Scripts

This directory contains scripts for installing, managing, and uninstalling the Claude Monitor system service.

## Files

- **`claude-monitor.service`** - systemd service unit file
- **`install.sh`** - Installation script for setting up the service
- **`uninstall.sh`** - Uninstallation script for clean removal
- **`README.md`** - This documentation

## Installation

### Prerequisites

- Linux system with systemd
- Python 3.8 or higher
- Root/sudo access
- At least 100MB available disk space

### Quick Install

```bash
sudo ./install.sh
```

The installation script will:
1. Check system requirements
2. Install Python dependencies
3. Create system user and directories
4. Install application files
5. Set up systemd service
6. Configure log rotation
7. Enable and start the service

### Custom Installation Options

The installation script supports various system configurations and handles edge cases automatically.

## Service Management

After installation, use these systemd commands:

```bash
# Start the service
sudo systemctl start claude-monitor

# Stop the service
sudo systemctl stop claude-monitor

# Restart the service
sudo systemctl restart claude-monitor

# Check service status
sudo systemctl status claude-monitor

# View logs
sudo journalctl -u claude-monitor -f

# Reload configuration
sudo systemctl reload claude-monitor
```

## Configuration

The service configuration is located at:
- **Main config**: `/etc/claude-monitor/claude-monitor.yml`
- **Service file**: `/etc/systemd/system/claude-monitor.service`
- **Log directory**: `/var/log/claude-monitor/`
- **Install directory**: `/opt/claude-monitor/`

Edit the configuration file and reload the service to apply changes:

```bash
sudo nano /etc/claude-monitor/claude-monitor.yml
sudo systemctl reload claude-monitor
```

## Uninstallation

### Complete Removal

```bash
sudo ./uninstall.sh
```

### Partial Removal Options

```bash
# Keep configuration and logs
sudo ./uninstall.sh --keep-config --keep-logs

# Remove Python dependencies too
sudo ./uninstall.sh --remove-deps

# Force removal without prompts
sudo ./uninstall.sh --force

# Clean systemd journal entries
sudo ./uninstall.sh --clean-logs
```

### Uninstallation Options

- **`--keep-config`** - Preserve configuration directory
- **`--keep-logs`** - Preserve log directory
- **`--remove-deps`** - Remove installed Python dependencies
- **`--clean-logs`** - Clean systemd journal entries
- **`--force`** - Skip confirmation prompts

## Service Details

### System Integration

- **User**: `claude-monitor` (system user)
- **Group**: `claude-monitor` (system group)
- **Install Path**: `/opt/claude-monitor/`
- **Config Path**: `/etc/claude-monitor/`
- **Log Path**: `/var/log/claude-monitor/`
- **Runtime Path**: `/var/run/claude-monitor/`

### Security Features

The systemd service includes security hardening:
- Runs as unprivileged system user
- Restricted filesystem access
- Limited system calls
- Memory protection
- Network restrictions
- Resource limits

### Process Management

- **Type**: Forking daemon
- **Restart**: Always restart on failure
- **Timeout**: 30 seconds for graceful shutdown
- **Start Limit**: 5 attempts in 5 minutes
- **PID File**: `/var/run/claude-monitor/claude-monitor.pid`

## Troubleshooting

### Check Service Status

```bash
sudo systemctl status claude-monitor
```

### View Recent Logs

```bash
sudo journalctl -u claude-monitor --since "1 hour ago"
```

### Test Configuration

```bash
sudo -u claude-monitor /opt/claude-monitor/bin/claude-monitor --config /etc/claude-monitor/claude-monitor.yml --debug
```

### Common Issues

1. **Service fails to start**
   - Check configuration syntax
   - Verify file permissions
   - Review error logs

2. **Permission denied errors**
   - Ensure correct ownership of files
   - Check directory permissions
   - Verify user/group configuration

3. **Configuration not loading**
   - Validate YAML syntax
   - Check file paths in configuration
   - Ensure readable by service user

### Log Locations

- **Service logs**: `journalctl -u claude-monitor`
- **Application logs**: `/var/log/claude-monitor/claude-monitor.log`
- **System logs**: `/var/log/syslog` or `/var/log/messages`

## Development

### Manual Testing

For development and testing, you can run the service manually:

```bash
# Run in foreground mode
sudo -u claude-monitor /opt/claude-monitor/bin/claude-monitor --debug

# Run with custom config
sudo -u claude-monitor /opt/claude-monitor/bin/claude-monitor --config /path/to/test-config.yml
```

### Service Validation

The installation script includes validation checks. You can also manually verify:

```bash
# Check service is enabled
systemctl is-enabled claude-monitor

# Check service is active
systemctl is-active claude-monitor

# Validate service file syntax
systemd-analyze verify /etc/systemd/system/claude-monitor.service
```

## Support

For issues with the service scripts:
1. Check the logs for error messages
2. Verify system requirements are met
3. Test with debug mode enabled
4. Review file permissions and ownership

The scripts include comprehensive error handling and logging to help diagnose issues.