"""
Component factory: initialize monitoring components in dependency order.

Moves component construction out of the daemon for SRP. It fills daemon._components
and leaves callback wiring to the daemon._setup_component_callbacks().
"""
from __future__ import annotations

import os
from datetime import datetime
from typing import Any

from parsing.log_parser import LogParser
from detection.state_detector import StateDetector
from recovery.recovery_engine import RecoveryEngine
from tasks.task_monitor import TaskMonitor
from notifications.notifier import Notifier
from session.bootstrap_manager import schedule_preflight_bootstrap_if_needed


def init_components(daemon: Any) -> None:
    """Initialize all monitoring components on the daemon."""
    try:
        daemon.logger.info("Initializing monitoring components...")
        component_configs = daemon.config.get('components', {})

        # 1. Log parser
        if component_configs.get('log_parser', {}).get('enabled', True):
            daemon._components['log_parser'] = LogParser(
                component_configs.get('log_parser', {})
            )
            daemon.logger.info("Log parser initialized")

        # 2. State detector
        if component_configs.get('state_detector', {}).get('enabled', True):
            daemon._components['state_detector'] = StateDetector(
                component_configs.get('state_detector', {})
            )
            daemon.logger.info("State detector initialized")

        # 3. Recovery engine
        if component_configs.get('recovery_engine', {}).get('enabled', True):
            daemon._components['recovery_engine'] = RecoveryEngine(
                component_configs.get('recovery_engine', {})
            )
            daemon.logger.info("Recovery engine initialized")

            # Optionally attempt to connect to TCP bridge at startup
            try:
                connect_on_start = bool(
                    daemon.config.get('monitoring', {}).get('connect_bridge_on_start', True)
                )
            except Exception:
                connect_on_start = True
            if connect_on_start:
                try:
                    ok = daemon._components['recovery_engine'].tcp_client.connect()
                    if ok:
                        daemon.logger.info("TCP bridge preflight connection successful")
                        schedule_preflight_bootstrap_if_needed(daemon)
                    else:
                        daemon.logger.warning("TCP bridge preflight connection failed; will retry on demand")
                except Exception as e:
                    daemon.logger.warning(f"TCP bridge preflight connection error: {e}")

        # 4. Task monitor
        if component_configs.get('task_monitor', {}).get('enabled', True):
            daemon._components['task_monitor'] = TaskMonitor(
                component_configs.get('task_monitor', {})
            )
            daemon.logger.info("Task monitor initialized")

        # 5. Notifier
        if component_configs.get('notifier', {}).get('enabled', True):
            daemon._components['notifier'] = Notifier(
                component_configs.get('notifier', {})
            )
            daemon.logger.info("Notifier initialized")

        # Callback wiring stays in daemon
        daemon._setup_component_callbacks()
        daemon.logger.info(f"Initialized {len(daemon._components)} components")

    except Exception as e:
        daemon.logger.error(f"Failed to initialize components: {e}")
        raise
