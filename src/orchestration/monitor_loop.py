"""
Monitor loop helpers.

Provides a single-cycle processor for the daemon main loop to keep
`daemon.py` focused on orchestration.
"""
from __future__ import annotations

import time
from datetime import datetime
from typing import Any

from detection.state_detector import StateDetection, ClaudeState
from decision.decision_engine import process_detection


def process_monitoring_cycle(daemon: Any) -> None:
    """Process one monitoring cycle: health checks and inactivity fallback."""
    # Health: restart components that expose start/stop if monitoring stopped
    for name, component in daemon._components.items():
        if hasattr(component, 'is_monitoring') and not component.is_monitoring():
            daemon.logger.warning(f"Component {name} is not monitoring - attempting restart")
            if hasattr(component, 'start_monitoring'):
                component.start_monitoring()

    # Inactivity-based IDLE fallback
    try:
        log_parser = daemon._components.get('log_parser')
        state_detector = daemon._components.get('state_detector')
        recovery_engine = daemon._components.get('recovery_engine')
        if log_parser and state_detector and recovery_engine and daemon._inactivity_idle_sec > 0:
            stats = log_parser.get_statistics() if hasattr(log_parser, 'get_statistics') else {}
            last_act = stats.get('last_activity')
            now_ts = time.time()
            if last_act and (now_ts - last_act) >= daemon._inactivity_idle_sec:
                detection = StateDetection(
                    state=ClaudeState.IDLE,
                    confidence=0.9,
                    evidence=["inactivity_timeout"],
                    timestamp=datetime.now(),
                    triggering_lines=[],
                    metadata={"reason": "inactivity_idle"}
                )
                process_detection(daemon, detection)
                return
    except Exception as e:
        daemon.logger.debug(f"Inactivity IDLE fallback check failed: {e}")
