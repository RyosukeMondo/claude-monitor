#!/usr/bin/env python3
"""
Claude Code Runner with Monitoring Support

This script starts Claude Code in a specified directory with automatic logging
enabled for the Claude Monitor system. It handles directory changes, log file
setup, and provides a clean interface for starting monitored Claude sessions.

Usage:
    python run_claude.py /path/to/project
    python run_claude.py /path/to/project --log-level DEBUG
    python run_claude.py /path/to/project --no-tee
"""

import os
import sys
import argparse
import subprocess
import signal
from pathlib import Path
from datetime import datetime


def setup_logging_directory():
    """Ensure the Claude Code logging directory exists."""
    log_dir = Path.home() / '.local' / 'share' / 'claude_code'
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir


def get_log_file_path():
    """Get the path to the Claude Code log file."""
    log_dir = setup_logging_directory()
    return log_dir / 'terminal_output.log'


def validate_project_path(project_path):
    """Validate that the project path exists and is accessible."""
    path = Path(project_path).resolve()
    
    if not path.exists():
        print(f"❌ Error: Project path does not exist: {path}")
        return None
        
    if not path.is_dir():
        print(f"❌ Error: Project path is not a directory: {path}")
        return None
        
    try:
        # Test if we can access the directory
        list(path.iterdir())
    except PermissionError:
        print(f"❌ Error: Permission denied accessing: {path}")
        return None
        
    return str(path)


def check_claude_command():
    """Check if Claude Code CLI is available."""
    try:
        result = subprocess.run(['claude', '--version'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return True
        else:
            print("❌ Error: Claude Code CLI not responding properly")
            return False
    except FileNotFoundError:
        print("❌ Error: Claude Code CLI not found in PATH")
        print("   Install Claude Code CLI first: https://docs.anthropic.com/en/docs/claude-code")
        return False
    except subprocess.TimeoutExpired:
        print("❌ Error: Claude Code CLI not responding (timeout)")
        return False
    except Exception as e:
        print(f"❌ Error checking Claude Code CLI: {e}")
        return False


def check_expect_command():
    """Check if expect is available."""
    try:
        result = subprocess.run(['expect', '-v'], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            return True
        else:
            print("❌ Error: expect not responding properly")
            return False
    except FileNotFoundError:
        print("❌ Error: expect not found in PATH")
        print("   Install expect: sudo apt install expect (Ubuntu/Debian)")
        print("                 : brew install expect (macOS)")
        return False
    except subprocess.TimeoutExpired:
        print("❌ Error: expect not responding (timeout)")
        return False
    except Exception as e:
        print(f"❌ Error checking expect: {e}")
        return False


def start_claude_with_monitoring(project_path, use_expect=True, tcp_port=9999, log_level=None):
    """Start Claude Code with monitoring enabled using expect bridge."""
    
    print("🚀 Starting Claude Code with TCP Bridge Monitoring")
    print(f"📁 Project Directory: {project_path}")
    
    # Setup log file
    log_file = get_log_file_path()
    print(f"📝 Log File: {log_file}")
    print(f"🌐 TCP Port: {tcp_port}")
    
    if use_expect:
        # Use expect bridge for proper TTY support
        script_dir = Path(__file__).parent
        expect_script = script_dir / 'scripts' / 'claude-code-bridge.exp'
        
        if not expect_script.exists():
            print(f"❌ Error: Expect script not found: {expect_script}")
            return False
        
        print("🔄 Starting Claude Code with expect TCP bridge...")
        print("   Features:")
        print("   - Full TTY support with interactive input")
        print("   - TCP control interface for automation")
        print("   - Real-time logging for monitoring")
        print(f"   - Send commands: echo 'send hello' > /dev/tcp/localhost/{tcp_port}")
        print("   Press Ctrl+C to stop")
        print("-" * 60)
        
        try:
            # Run expect script with parameters
            cmd = [
                'expect', 
                str(expect_script), 
                str(tcp_port), 
                str(log_file), 
                project_path
            ]
            
            print(f"Executing: {' '.join(cmd)}")
            process = subprocess.Popen(cmd)
            process.wait()
            
        except KeyboardInterrupt:
            print("\n🛑 Interrupted by user")
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
        except Exception as e:
            print(f"❌ Error running expect bridge: {e}")
            return False
    
    else:
        # Fallback to simple approach (may have TTY issues)
        print("⚠️  Using fallback mode - some interactive features may not work")
        print("   Consider installing 'expect' for full functionality")
        
        os.chdir(project_path)
        
        # Create a timestamp entry in the log
        with open(log_file, 'a') as f:
            timestamp = datetime.now().isoformat()
            f.write(f"\n=== Claude Code Session Started: {timestamp} ===\n")
            f.write(f"Project: {project_path}\n")
            f.write(f"Working Directory: {os.getcwd()}\n")
            f.write("=" * 50 + "\n\n")
        
        try:
            cmd = ['claude', '--dangerously-skip-permissions']
            if log_level:
                cmd.extend(['--log-level', log_level])
            
            # Simple tee approach
            tee_cmd = f"{' '.join(cmd)} | tee {log_file}"
            process = subprocess.Popen(tee_cmd, shell=True)
            process.wait()
            
        except KeyboardInterrupt:
            print("\n🛑 Interrupted by user")
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
        
        # Add session end marker
        with open(log_file, 'a') as f:
            timestamp = datetime.now().isoformat()
            f.write(f"\n=== Claude Code Session Ended: {timestamp} ===\n\n")
    
    print("✅ Claude Code session ended")
    return True


def signal_handler(signum, frame):
    """Handle shutdown signals gracefully."""
    print("\n🛑 Received shutdown signal")
    sys.exit(0)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Start Claude Code with monitoring support',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
    python3 run_claude.py /home/user/my-project
    python3 run_claude.py ~/code/app --log-level DEBUG
    python3 run_claude.py . --tcp-port 8888
    python3 run_claude.py /path/to/project --no-expect  # Fallback mode
        '''
    )
    
    parser.add_argument('project_path', 
                       help='Path to the project directory to monitor')
    parser.add_argument('--log-level', 
                       choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
                       help='Set Claude Code log level')
    parser.add_argument('--no-expect', 
                       action='store_true',
                       help='Use fallback mode instead of expect TCP bridge')
    parser.add_argument('--tcp-port',
                       type=int,
                       default=9999,
                       help='TCP port for expect bridge (default: 9999)')
    parser.add_argument('--check-setup', 
                       action='store_true',
                       help='Check setup and exit')
    
    args = parser.parse_args()
    
    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Validate setup
    print("🔍 Checking setup...")
    
    if not check_claude_command():
        sys.exit(1)
    
    # Check expect availability
    expect_available = check_expect_command()
    if not expect_available and not args.no_expect:
        print("⚠️  expect not available, will use fallback mode")
        args.no_expect = True
    
    project_path = validate_project_path(args.project_path)
    if not project_path:
        sys.exit(1)
    
    log_dir = setup_logging_directory()
    log_file = get_log_file_path()
    
    print("✅ Setup validation complete:")
    print(f"   - Claude Code CLI: Available")
    print(f"   - Expect: {'Available' if expect_available else 'Not available (using fallback)'}")
    print(f"   - Project Path: {project_path}")
    print(f"   - Log Directory: {log_dir}")
    print(f"   - Log File: {log_file}")
    if not args.no_expect:
        print(f"   - TCP Port: {args.tcp_port}")
    
    if args.check_setup:
        print("✅ Setup check complete")
        return
    
    print("\n💡 Tips:")
    print("   - Start the Claude Monitor in another terminal: python3 run_monitor.py")
    print("   - Monitor logs in real-time: tail -f ~/.local/share/claude_code/terminal_output.log")
    if not args.no_expect:
        print(f"   - Send commands via TCP: echo 'send hello' > /dev/tcp/localhost/{args.tcp_port}")
        print("   - Available TCP commands: send <text>, enter, up, down, ctrl-c, tab")
    print("   - Use Ctrl+C to stop gracefully")
    print()
    
    # Start Claude Code
    try:
        success = start_claude_with_monitoring(
            project_path,
            use_expect=not args.no_expect,
            tcp_port=args.tcp_port,
            log_level=args.log_level
        )
        if not success:
            sys.exit(1)
    except Exception as e:
        print(f"❌ Error starting Claude Code: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()