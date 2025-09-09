#!/usr/bin/env python3
"""
Claude Monitor Runner

This script provides a convenient way to start the Claude Monitor daemon with
proper environment setup, configuration validation, and status reporting.

Usage:
    python run_monitor.py
    python run_monitor.py --config custom-config.yml
    python run_monitor.py --debug --dry-run
"""

import os
import sys
import argparse
import subprocess
import signal
from pathlib import Path
import time
import yaml


def find_script_directory():
    """Find the directory where this script is located."""
    return Path(__file__).parent.resolve()


def check_virtual_environment():
    """Check if virtual environment is available and activated."""
    script_dir = find_script_directory()
    venv_path = script_dir / 'venv'
    
    if not venv_path.exists():
        print("❌ Virtual environment not found")
        print(f"   Expected: {venv_path}")
        print("   Run: python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt")
        return None
    
    # Find Python executable in venv
    python_exe = venv_path / 'bin' / 'python'
    if not python_exe.exists():
        # Try Windows path
        python_exe = venv_path / 'Scripts' / 'python.exe'
        if not python_exe.exists():
            print("❌ Python executable not found in virtual environment")
            return None
    
    return str(python_exe)


def check_dependencies(python_exe):
    """Check if required dependencies are installed."""
    try:
        # Check for PyYAML
        result = subprocess.run([python_exe, '-c', 'import yaml'], 
                              capture_output=True, timeout=5)
        if result.returncode != 0:
            print("❌ PyYAML not installed in virtual environment")
            print("   Run: pip install -r requirements.txt")
            return False
            
        return True
        
    except subprocess.TimeoutExpired:
        print("❌ Dependency check timed out")
        return False
    except Exception as e:
        print(f"❌ Error checking dependencies: {e}")
        return False


def validate_config_file(config_path):
    """Validate that the configuration file exists and is readable."""
    if not config_path.exists():
        print(f"❌ Configuration file not found: {config_path}")
        return False
    
    try:
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        
        if not isinstance(config, dict):
            print(f"❌ Invalid configuration format in: {config_path}")
            return False
            
        # Basic structure validation
        required_sections = ['daemon', 'logging', 'components']
        missing_sections = [s for s in required_sections if s not in config]
        
        if missing_sections:
            print(f"❌ Missing configuration sections: {', '.join(missing_sections)}")
            return False
            
        print(f"✅ Configuration file validated: {config_path}")
        return True
        
    except yaml.YAMLError as e:
        print(f"❌ YAML parsing error in config file: {e}")
        return False
    except Exception as e:
        print(f"❌ Error reading config file: {e}")
        return False


def setup_log_directories():
    """Ensure log directories exist."""
    script_dir = find_script_directory()
    
    # Monitor logs
    monitor_log_dir = script_dir / 'logs'
    monitor_log_dir.mkdir(exist_ok=True)
    
    # Claude Code logs
    claude_log_dir = Path.home() / '.local' / 'share' / 'claude_code'
    claude_log_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"📁 Log directories ready:")
    print(f"   - Monitor logs: {monitor_log_dir}")
    print(f"   - Claude Code logs: {claude_log_dir}")
    
    return monitor_log_dir, claude_log_dir


def check_claude_log_file():
    """Check if Claude Code log file exists and provide guidance."""
    claude_log_file = Path.home() / '.local' / 'share' / 'claude_code' / 'terminal_output.log'
    
    if claude_log_file.exists():
        # Check if file has recent content
        stat = claude_log_file.stat()
        size_mb = stat.st_size / (1024 * 1024)
        mod_time = time.ctime(stat.st_mtime)
        
        print(f"✅ Claude Code log file found:")
        print(f"   - Path: {claude_log_file}")
        print(f"   - Size: {size_mb:.2f} MB")
        print(f"   - Last modified: {mod_time}")
        
        if size_mb == 0:
            print("   ⚠️  Log file is empty - start Claude Code to begin logging")
        
        return True
    else:
        print(f"⚠️  Claude Code log file not found: {claude_log_file}")
        print("   This is normal if Claude Code hasn't been run with logging yet")
        print("   Start Claude Code with: python run_claude.py /path/to/project")
        return False


def start_monitor(python_exe, config_path, debug=False, dry_run=False, daemon=False, project_path=None, spec_name=None):
    """Start the Claude Monitor daemon."""
    script_dir = find_script_directory()
    main_py = script_dir / 'src' / 'main.py'
    
    if not main_py.exists():
        print(f"❌ Main script not found: {main_py}")
        return False
    
    # Build command
    cmd = [python_exe, str(main_py), '--config', str(config_path)]
    
    if debug:
        cmd.append('--debug')
    
    if daemon:
        cmd.append('--daemon')
    
    # Set environment variables for configuration overrides
    env = os.environ.copy()
    if dry_run:
        env['CLAUDE_MONITOR_DRY_RUN'] = 'true'
        print("🧪 Running in DRY RUN mode - no actual recovery actions will be executed")
    
    if project_path:
        env['CLAUDE_MONITOR_PROJECT_PATH'] = project_path
        print(f"📁 Overriding project path: {project_path}")
    
    if spec_name:
        env['CLAUDE_MONITOR_SPEC_NAME'] = spec_name
        print(f"📝 Overriding spec name: {spec_name}")
    
    print("🚀 Starting Claude Monitor...")
    print(f"   Command: {' '.join(cmd)}")
    print(f"   Working directory: {script_dir}")
    print("-" * 60)
    
    try:
        # Change to script directory
        os.chdir(script_dir)
        
        if daemon:
            # Run as daemon
            process = subprocess.Popen(cmd, env=env)
            print(f"✅ Claude Monitor started as daemon (PID: {process.pid})")
            return True
        else:
            # Run in foreground
            process = subprocess.Popen(cmd, env=env)
            process.wait()
            return True
            
    except KeyboardInterrupt:
        print("\n🛑 Interrupted by user")
        if process:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
        return True
    except Exception as e:
        print(f"❌ Error starting monitor: {e}")
        return False


def show_status():
    """Show current monitoring status."""
    print("📊 Claude Monitor Status:")
    
    # Check if daemon is running
    try:
        pid_file = Path('/var/run/claude-monitor.pid')
        if pid_file.exists():
            with open(pid_file, 'r') as f:
                pid = f.read().strip()
            print(f"   ✅ Daemon running (PID: {pid})")
        else:
            print("   ❌ Daemon not running")
    except:
        print("   ❓ Daemon status unknown")
    
    # Check log files
    monitor_log = Path('logs/claude-monitor.log')
    if monitor_log.exists():
        stat = monitor_log.stat()
        size_kb = stat.st_size / 1024
        mod_time = time.ctime(stat.st_mtime)
        print(f"   📝 Monitor log: {size_kb:.1f} KB (modified: {mod_time})")
    
    claude_log = Path.home() / '.local' / 'share' / 'claude_code' / 'terminal_output.log'
    if claude_log.exists():
        stat = claude_log.stat()
        size_kb = stat.st_size / 1024
        mod_time = time.ctime(stat.st_mtime)
        print(f"   📝 Claude log: {size_kb:.1f} KB (modified: {mod_time})")


def signal_handler(signum, frame):
    """Handle shutdown signals gracefully."""
    print("\n🛑 Received shutdown signal")
    sys.exit(0)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='Start the Claude Monitor daemon',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
    python run_monitor.py                    # Start with default config
    python run_monitor.py --debug            # Start with debug logging
    python run_monitor.py --dry-run          # Test mode - no actual recovery
    python run_monitor.py --daemon           # Run as background daemon
    python run_monitor.py --status           # Show current status
        '''
    )
    
    parser.add_argument('--config', '-c',
                       help='Path to configuration file')
    parser.add_argument('--debug', '-d',
                       action='store_true',
                       help='Enable debug logging')
    parser.add_argument('--dry-run',
                       action='store_true',
                       help='Run in test mode without executing recovery actions')
    parser.add_argument('--daemon',
                       action='store_true',
                       help='Run as background daemon')
    parser.add_argument('--status',
                       action='store_true',
                       help='Show current monitoring status')
    parser.add_argument('--project-path',
                       help='Override project path to monitor')
    parser.add_argument('--spec-name',
                       help='Override spec name to monitor')
    parser.add_argument('--check-setup',
                       action='store_true',
                       help='Check setup and exit')
    
    args = parser.parse_args()
    
    # Setup signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    script_dir = find_script_directory()
    
    # Handle status request
    if args.status:
        show_status()
        return
    
    # Validate setup
    print("🔍 Checking Claude Monitor setup...")
    
    python_exe = check_virtual_environment()
    if not python_exe:
        sys.exit(1)
    
    if not check_dependencies(python_exe):
        sys.exit(1)
    
    # Setup directories
    monitor_log_dir, claude_log_dir = setup_log_directories()
    
    # Validate configuration
    if args.config:
        config_path = Path(args.config).resolve()
    else:
        config_path = script_dir / 'config' / 'claude-monitor.yml'
    
    if not validate_config_file(config_path):
        sys.exit(1)
    
    # Check Claude Code log file
    claude_log_exists = check_claude_log_file()
    
    print("✅ Setup validation complete:")
    print(f"   - Virtual environment: {Path(python_exe).parent.parent}")
    print(f"   - Dependencies: Installed")
    print(f"   - Configuration: {config_path}")
    print(f"   - Log directories: Ready")
    print(f"   - Claude Code log: {'Found' if claude_log_exists else 'Not found (start Claude Code first)'}")
    
    if args.check_setup:
        print("✅ Setup check complete")
        return
    
    if not claude_log_exists:
        print("\n💡 To start monitoring:")
        print("   1. Run this monitor: python run_monitor.py")
        print("   2. In another terminal, run: python run_claude.py /path/to/project")
        print("   3. Watch the monitor detect and respond to Claude Code activity")
        print()
    
    # Start the monitor
    try:
        success = start_monitor(
            python_exe=python_exe,
            config_path=config_path,
            debug=args.debug,
            dry_run=args.dry_run,
            daemon=args.daemon,
            project_path=args.project_path,
            spec_name=args.spec_name
        )
        
        if not success:
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Error running monitor: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()