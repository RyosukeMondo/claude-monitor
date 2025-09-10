#!/bin/bash
#
# Claude Monitor Launcher Script
#
# Simple wrapper that handles python/python3 detection and provides
# easy commands for starting the monitoring system.
#
# Usage:
#     ./start_monitoring.sh                    # Start monitor
#     ./start_monitoring.sh claude /path/to/project  # Start Claude Code
#     ./start_monitoring.sh status             # Show status

# Detect Python command
if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
else
    echo "❌ Error: Neither 'python' nor 'python3' found in PATH"
    exit 1
fi

echo "🐍 Using Python command: $PYTHON_CMD"

# Handle different commands
case "${1:-monitor}" in
    "monitor"|"")
        echo "🔍 Starting Claude Monitor..."
        shift
        $PYTHON_CMD run_monitor.py "$@"
        ;;
    "claude")
        if [ -z "$2" ]; then
            echo "❌ Error: Project path required"
            echo "Usage: $0 claude /path/to/project"
            exit 1
        fi
        echo "🚀 Starting Claude Code with monitoring..."
        shift
        $PYTHON_CMD run_claude.py "$@"
        ;;
    "status")
        echo "📊 Checking monitoring status..."
        $PYTHON_CMD run_monitor.py --status
        ;;
    "setup")
        echo "🔧 Checking setup..."
        $PYTHON_CMD run_monitor.py --check-setup
        ;;
    "help"|"-h"|"--help")
        cat << EOF
Claude Monitor Launcher

Commands:
    $0                          # Start Claude Monitor
    $0 monitor [options]        # Start Claude Monitor with options
    $0 claude /path/to/project  # Start Claude Code with monitoring
    $0 status                   # Show current status
    $0 setup                    # Check setup

Examples:
    $0                                    # Start monitor
    $0 claude ~/my-project                # Start Claude Code in project
    $0 monitor --debug                    # Start monitor with debug logging
    $0 monitor --project-path ~/project   # Monitor specific project
    $0 status                             # Check if running

For more options:
    $PYTHON_CMD run_monitor.py --help
    $PYTHON_CMD run_claude.py --help
EOF
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac