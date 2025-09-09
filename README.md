# Claude Monitor

**Automated Claude Code Recovery System**

Claude Monitor is an intelligent monitoring and recovery system that watches your Claude Code sessions in real-time, automatically detecting states like context pressure, input waiting, and errors, then executing appropriate recovery actions to keep your development workflow smooth.

## 🚀 Quick Start

### Option 1: Using Expect TCP Bridge (Recommended)

**Prerequisites:** Install `expect` if not already available
```bash
# Ubuntu/Debian
sudo apt install expect

# macOS
brew install expect
```

**Terminal 1: Start Claude Monitor**
```bash
# Using Python directly
python3 run_monitor.py

# Or using the launcher script
./start_monitoring.sh monitor
```

**Terminal 2: Start Claude Code with TCP Bridge**
```bash
# Using Python directly (with full TTY support and TCP control)
python3 run_claude.py /path/to/your/project

# Or using the launcher script
./start_monitoring.sh claude /path/to/your/project

# Advanced usage
python3 run_claude.py /path/to/project --tcp-port 8888
python3 run_claude.py /path/to/project --no-expect  # Fallback mode
```

### Option 2: Using the All-in-One Launcher Script

```bash
# Check setup first
./start_monitoring.sh setup

# Start monitor in Terminal 1
./start_monitoring.sh

# Start Claude Code in Terminal 2  
./start_monitoring.sh claude ~/my-project

# Check status anytime
./start_monitoring.sh status
```

### Option 3: Manual Setup

**Terminal 1: Claude Code**
```bash
mkdir -p ~/.local/share/claude_code
claude --dangerously-skip-permissions | tee ~/.local/share/claude_code/terminal_output.log
```

**Terminal 2: Claude Monitor**
```bash
source venv/bin/activate
cd src
python main.py --config ../config/claude-monitor.yml --debug
```

## 📋 Prerequisites

- Python 3.8+
- Claude Code CLI installed and configured
- Linux/macOS/WSL environment

## 🛠️ Installation

1. **Clone and setup the repository:**
```bash
git clone <repository-url>
cd claude-monitor
```

2. **Create virtual environment and install dependencies:**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. **Create necessary directories:**
```bash
mkdir -p ~/.local/share/claude_code
mkdir -p logs
```

## 🎯 Features

### Real-time Monitoring
- **Log Parser**: Monitors Claude Code terminal output in real-time
- **State Detection**: Identifies Claude Code states (idle, active, context pressure, input waiting, errors)  
- **Context Analysis**: Maintains sliding window of recent activity for intelligent decision making
- **TCP Bridge**: Full TTY support with remote control capabilities via expect

### Automated Recovery
- **Context Pressure Relief**: Automatically compacts conversation when context limits are reached
- **Input Recovery**: Detects and handles input prompts that may be stuck
- **Error Recovery**: Identifies error patterns and suggests or executes recovery actions
- **Task Continuation**: Integrates with spec-workflow to track and continue tasks

### Notifications
- **Desktop Notifications**: Native notifications for important events
- **Priority Filtering**: Configurable notification levels to avoid spam
- **Multiple Platforms**: Linux (notify-send), macOS (osascript), Windows (toast)

### TCP Control Interface
- **Remote Commands**: Send commands via TCP for automation
- **Interactive Control**: Full keyboard input support (arrows, Ctrl+C, Enter, etc.)
- **External Integration**: Control Claude Code from other scripts or applications
- **Recovery Actions**: Automated input when Claude Code gets stuck

## 📁 Project Structure

```
claude-monitor/
├── config/
│   └── claude-monitor.yml     # Main configuration file
├── src/
│   ├── main.py               # Main daemon entry point
│   ├── config/               # Configuration management
│   ├── monitor_logging/      # Structured logging system
│   ├── parsing/              # Log parsing and monitoring
│   ├── detection/            # State detection and pattern matching
│   ├── recovery/             # Recovery action execution
│   ├── tasks/                # Task monitoring integration
│   ├── notifications/        # Desktop notification system
│   └── communication/        # TCP communication for recovery
├── logs/                     # Log files (created automatically)
├── venv/                     # Python virtual environment
├── run_claude.py            # Python script for Claude Code with monitoring
├── run_monitor.py           # Python script for Monitor daemon
├── start_monitoring.sh      # All-in-one launcher script
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## ⚙️ Configuration

The main configuration is in `config/claude-monitor.yml`. Key sections:

### Daemon Settings
```yaml
daemon:
  enabled: true
  loop_interval: 5.0          # How often to check for changes
  status_report_interval: 300.0
```

### Log Parser
```yaml
components:
  log_parser:
    enabled: true
    log_file: ~/.local/share/claude_code/terminal_output.log
    monitoring:
      poll_interval: 1.0      # File check frequency
      buffer_size: 8192
```

### State Detection
```yaml
  state_detector:
    enabled: true
    sensitivity: 0.7          # Detection sensitivity (0.0-1.0)
    min_confidence: 0.6       # Minimum confidence threshold
```

### Recovery Actions
```yaml
  recovery_engine:
    enabled: true
    max_retries: 3
    cooldown_period: 10.0     # Prevent excessive recovery attempts
```

## 🚨 Monitoring States

Claude Monitor detects and responds to these Claude Code states:

### 🟢 ACTIVE
- **Description**: Claude Code is actively processing
- **Indicators**: Tool calls, code generation, file operations
- **Actions**: Monitor and log activity

### 🟡 IDLE  
- **Description**: No recent activity
- **Indicators**: No new log entries for extended period
- **Actions**: Check for stalled processes, gentle nudge if needed

### 🟠 INPUT_WAITING
- **Description**: Waiting for user input
- **Indicators**: Prompt patterns, cursor waiting
- **Actions**: Notify user, detect stuck input scenarios

### 🔴 CONTEXT_PRESSURE
- **Description**: Approaching context limits
- **Indicators**: Large conversations, memory warnings
- **Actions**: Automatic conversation compaction, context cleanup

### ❌ ERROR
- **Description**: Error states detected
- **Indicators**: Exception traces, failure patterns
- **Actions**: Error recovery, restart suggestions, debugging aid

### ✅ COMPLETED
- **Description**: Task or operation completed
- **Indicators**: Success messages, completion patterns
- **Actions**: Log completion, update task status

## 📊 Usage Examples

### Basic Monitoring
```bash
# Using launcher script (easiest)
./start_monitoring.sh                    # Terminal 1: Start monitor
./start_monitoring.sh claude ~/my-project # Terminal 2: Start Claude

# Using Python scripts directly
python3 run_monitor.py                   # Terminal 1: Start monitor  
python3 run_claude.py ~/my-project       # Terminal 2: Start Claude
```

### Advanced Usage
```bash
# Custom configuration
python3 run_monitor.py --config custom-config.yml

# Specific project monitoring with debug logging
python3 run_claude.py /path/to/specific/project --log-level DEBUG

# Debug mode monitoring
python3 run_monitor.py --debug

# Dry run mode (no actual recovery actions)
python3 run_monitor.py --dry-run

# Check setup and status
./start_monitoring.sh setup
./start_monitoring.sh status
```

### Script Options

**run_claude.py options:**
- `--log-level DEBUG|INFO|WARNING|ERROR` - Set Claude Code log level
- `--no-expect` - Use fallback mode instead of expect TCP bridge
- `--tcp-port PORT` - TCP port for expect bridge (default: 9999)
- `--check-setup` - Validate setup and exit

**run_monitor.py options:**
- `--config PATH` - Custom configuration file path
- `--debug` - Enable debug logging
- `--dry-run` - Test mode without executing recovery actions
- `--daemon` - Run as background daemon
- `--status` - Show current monitoring status
- `--check-setup` - Validate setup and exit

### TCP Commands Reference

When using the expect bridge, you can send commands via TCP:

```bash
# Send text input followed by Enter
echo "send hello world" > /dev/tcp/localhost/9999

# Send just Enter key
echo "enter" > /dev/tcp/localhost/9999

# Navigation keys
echo "up" > /dev/tcp/localhost/9999      # Up arrow
echo "down" > /dev/tcp/localhost/9999    # Down arrow
echo "left" > /dev/tcp/localhost/9999    # Left arrow
echo "right" > /dev/tcp/localhost/9999   # Right arrow

# Control keys
echo "ctrl-c" > /dev/tcp/localhost/9999  # Ctrl+C
echo "ctrl-d" > /dev/tcp/localhost/9999  # Ctrl+D
echo "tab" > /dev/tcp/localhost/9999     # Tab key
echo "escape" > /dev/tcp/localhost/9999  # Escape key

# Raw character sequences
echo "raw \033[H" > /dev/tcp/localhost/9999  # Send raw escape sequence
```

**Integration Example:**
```bash
# Monitor for input prompts and auto-respond
tail -f ~/.local/share/claude_code/terminal_output.log | while read line; do
  if [[ "$line" =~ "Do you want to continue" ]]; then
    echo "send y" > /dev/tcp/localhost/9999
  fi
done
```

## 📈 Statistics and Reporting

Claude Monitor provides detailed statistics:

- **Detection Metrics**: State detection counts and confidence scores
- **Recovery Metrics**: Success rates, retry counts, action timings  
- **Performance Metrics**: Processing rates, memory usage, uptime
- **Task Metrics**: Completion rates, progress tracking

View statistics by sending `SIGUSR1` to the daemon process or checking the logs.

## 🔧 Troubleshooting

### Common Issues

**Monitor can't find Claude Code log file:**
```bash
# Check if directory exists
ls -la ~/.local/share/claude_code/

# Verify log file is being created
python run_claude.py /tmp/test
ls -la ~/.local/share/claude_code/terminal_output.log
```

**Permission errors:**
```bash
# Fix permissions
chmod 755 ~/.local/share/claude_code/
touch ~/.local/share/claude_code/terminal_output.log
```

**Desktop notifications not working:**
```bash
# Linux: Install notify-send
sudo apt install libnotify-bin

# macOS: Should work with built-in osascript
# Windows: Should work with built-in PowerShell
```

### Debug Mode
Run with `--debug` flag for detailed logging:
```bash
python run_monitor.py --debug
```

### Log Files
Check these locations for troubleshooting:
- `./logs/claude-monitor.log` - Main monitor log
- `~/.local/share/claude_code/terminal_output.log` - Claude Code output

## 🧪 Development

### Running Tests
```bash
source venv/bin/activate
pytest tests/ -v
```

### Code Structure
- **Modular Design**: Each component is independently testable
- **Configuration-Driven**: Behavior controlled via YAML configuration
- **Thread-Safe**: Concurrent processing with proper synchronization
- **Resource Efficient**: Bounded memory usage, automatic cleanup

## 📝 Configuration Reference

### Environment Variables
Override configuration with environment variables:
```bash
export CLAUDE_MONITOR_LOG_LEVEL=DEBUG
export CLAUDE_MONITOR_IDLE_TIMEOUT=60
export CLAUDE_MONITOR_MAX_RETRIES=5
```

### Component Configuration
Each component can be individually configured:

```yaml
components:
  log_parser:
    enabled: true
    # Component-specific settings
  
  state_detector:
    enabled: true
    # Detection thresholds
  
  recovery_engine:
    enabled: true
    # Recovery behavior
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the configuration documentation
3. Check existing issues in the repository
4. Create a new issue with detailed information

## 🔮 Roadmap

- [ ] Web dashboard for monitoring multiple Claude sessions
- [ ] Integration with more development tools
- [ ] Machine learning-based state prediction
- [ ] Cloud deployment options
- [ ] Plugin system for custom recovery actions