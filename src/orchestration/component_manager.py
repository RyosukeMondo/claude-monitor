"""
Component lifecycle orchestration for Claude Monitor.

Provides functions to start and stop components, delegating heavy logic
out of the daemon for SRP and KISS.
"""
from __future__ import annotations

import os
import time
from typing import Any


def start_components(daemon: Any) -> None:
    """Start all monitoring components."""
    try:
        daemon.logger.info("Starting monitoring components...")

        # Start components that need background threads
        if 'log_parser' in daemon._components:
            log_parser = daemon._components['log_parser']

            # Set the log file path from configuration
            log_parser_config = daemon.config.get('components', {}).get('log_parser', {})
            log_file_path = log_parser_config.get('log_file', '~/.local/share/claude_code/terminal_output.log')
            expanded_path = os.path.expanduser(log_file_path)

            if log_parser.set_log_file(expanded_path):
                daemon.logger.info(f"Log parser set to monitor: {expanded_path}")
            else:
                daemon.logger.warning(f"Failed to set log file: {expanded_path}")

            if hasattr(log_parser, 'start_monitoring'):
                log_parser.start_monitoring()
                daemon.logger.debug("Log parser monitoring started")

        if 'task_monitor' in daemon._components:
            task_monitor = daemon._components['task_monitor']
            if hasattr(task_monitor, 'start_monitoring'):
                task_monitor.start_monitoring()
                daemon.logger.debug("Task monitor started")

                # Add current spec to monitoring
                current_project = os.environ.get('CLAUDE_MONITOR_PROJECT_PATH') or \
                                 daemon.config.get('monitoring', {}).get('project_path', '/mnt/d/repos/claude-monitor')
                current_spec = os.environ.get('CLAUDE_MONITOR_SPEC_NAME') or \
                              daemon.config.get('monitoring', {}).get('spec_name', 'claude-auto-recovery')

                daemon.logger.info(f"Monitoring project: {current_project}")
                daemon.logger.info(f"Monitoring spec: {current_spec}")
                task_monitor.add_spec_to_monitor(current_project, current_spec)

        daemon.logger.info("All components started successfully")

    except Exception as e:
        daemon.logger.error(f"Failed to start components: {e}")
        raise


def stop_components(daemon: Any) -> None:
    """Stop all monitoring components gracefully."""
    try:
        daemon.logger.info("Stopping monitoring components...")

        # Stop components in reverse order
        for name, component in reversed(list(daemon._components.items())):
            try:
                if hasattr(component, 'stop_monitoring'):
                    component.stop_monitoring()
                elif hasattr(component, 'shutdown'):
                    component.shutdown()
                daemon.logger.debug(f"Component {name} stopped")
            except Exception as e:
                daemon.logger.error(f"Error stopping component {name}: {e}")

        # Wait for component threads to finish
        for name, thread in daemon._component_threads.items():
            if thread.is_alive():
                daemon.logger.debug(f"Waiting for {name} thread to finish...")
                thread.join(timeout=5.0)
                if thread.is_alive():
                    daemon.logger.warning(f"Component thread {name} did not finish cleanly")

        daemon.logger.info("All components stopped")

    except Exception as e:
        daemon.logger.error(f"Error stopping components: {e}")
