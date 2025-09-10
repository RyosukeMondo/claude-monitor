#!/usr/bin/env python3
"""
Claude Monitor - Main monitoring daemon.

This is the main entry point that orchestrates all monitoring components and integrates
all requirements for the Claude Code auto-recovery system.

Features:
- Component orchestration and lifecycle management
- Signal handling for graceful shutdown and configuration reload
- Main monitoring loop with proper error handling
- Resource management and cleanup
"""

import sys
import os
import signal
import argparse
import subprocess
from pathlib import Path
import traceback

# Add src directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import all monitoring components
import yaml
from daemon import ClaudeMonitorDaemon


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(description='Claude Monitor - Automated Claude Code recovery system')
    parser.add_argument('--config', '-c', help='Configuration file path')
    parser.add_argument('--debug', '-d', action='store_true', help='Enable debug mode')
    parser.add_argument('--daemon', action='store_true', help='Run as daemon (detach from terminal)')
    parser.add_argument('--stop', action='store_true', help='Stop running daemon')
    parser.add_argument('--status', action='store_true', help='Show daemon status')
    parser.add_argument('--reload', action='store_true', help='Reload daemon configuration')
    
    args = parser.parse_args()
    
    # Resolve PID file path in project logs directory (cross-platform)
    project_root = Path(__file__).parent.parent.resolve()
    pid_dir = project_root / 'logs'
    pid_dir.mkdir(parents=True, exist_ok=True)
    pid_file = pid_dir / 'claude-monitor.pid'

    # Handle daemon control commands
    if args.stop:
        # Send SIGTERM to running daemon (if supported)
        try:
            with open(pid_file, 'r') as f:
                pid = int(f.read().strip())
            if hasattr(signal, 'SIGTERM'):
                os.kill(pid, signal.SIGTERM)
            else:
                # Best-effort termination on platforms without SIGTERM
                os.kill(pid, 9)
            print(f"Stop signal sent to daemon (PID: {pid})")
            return 0
        except FileNotFoundError:
            print("No running daemon found")
            return 1
        except Exception as e:
            print(f"Error stopping daemon: {e}")
            return 1
            
    if args.status:
        # Send SIGUSR1 to running daemon for status report (if supported)
        try:
            with open(pid_file, 'r') as f:
                pid = int(f.read().strip())
            if hasattr(signal, 'SIGUSR1'):
                os.kill(pid, signal.SIGUSR1)
            else:
                print("Status signal not supported on this platform; start monitor in foreground to view status.")
                return 0
            print(f"Status request sent to daemon (PID: {pid})")
            return 0
        except FileNotFoundError:
            print("No running daemon found")
            return 1
        except Exception as e:
            print(f"Error requesting status: {e}")
            return 1
            
    if args.reload:
        # Send SIGHUP to running daemon for config reload (if supported)
        try:
            with open(pid_file, 'r') as f:
                pid = int(f.read().strip())
            if hasattr(signal, 'SIGHUP'):
                os.kill(pid, signal.SIGHUP)
            else:
                print("Reload signal not supported on this platform.")
                return 0
            print(f"Reload signal sent to daemon (PID: {pid})")
            return 0
        except FileNotFoundError:
            print("No running daemon found")
            return 1
        except Exception as e:
            print(f"Error reloading config: {e}")
            return 1
    
    # Start daemon
    daemon = ClaudeMonitorDaemon(config_path=args.config, debug=args.debug)
    
    try:
        if args.daemon:
            if os.name == 'posix':
                # POSIX double-fork daemonization
                if os.fork() > 0:
                    sys.exit(0)
                os.setsid()
                if os.fork() > 0:
                    sys.exit(0)
                # Write PID file
                with open(pid_file, 'w') as f:
                    f.write(str(os.getpid()))
                # Redirect streams to null
                try:
                    devnull = open(os.devnull, 'w')
                    sys.stdin.close(); sys.stdout = devnull; sys.stderr = devnull
                except Exception:
                    pass
                # Start daemon in this process
                daemon.start()
                daemon.wait()
                return 0
            else:
                # Windows and other platforms: spawn detached subprocess running in foreground mode
                args_list = [sys.executable, __file__]
                if args.config:
                    args_list += ['--config', args.config]
                if args.debug:
                    args_list += ['--debug']
                creationflags = 0
                if os.name == 'nt':
                    creationflags = getattr(subprocess, 'DETACHED_PROCESS', 0) | getattr(subprocess, 'CREATE_NEW_PROCESS_GROUP', 0)
                proc = subprocess.Popen(args_list, creationflags=creationflags, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, stdin=subprocess.DEVNULL)
                with open(pid_file, 'w') as f:
                    f.write(str(proc.pid))
                print(f"Started Claude Monitor as background process (PID: {proc.pid}). PID file: {pid_file}")
                return 0

        # Foreground mode
        daemon.start()
        print("Claude Monitor started. Press Ctrl+C to stop.")
        daemon.wait()
        return 0
        
    except KeyboardInterrupt:
        print("\nShutdown requested")
        daemon.stop()
        return 0
    except Exception as e:
        print(f"Fatal error: {e}")
        if args.debug:
            traceback.print_exc()
        return 1
    finally:
        # Clean up PID file
        try:
            if pid_file.exists():
                os.unlink(pid_file)
        except:
            pass


if __name__ == '__main__':
    sys.exit(main())