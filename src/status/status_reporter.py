"""
Status reporter for Claude Monitor.

Provides a Single Source of Truth to build and log the status report
for the daemon and all components.
"""
from __future__ import annotations

import json
from typing import Any, Dict


def build_status_report(daemon: Any) -> Dict[str, Any]:
    """Build a structured status report from the daemon and its components."""
    report = {
        'daemon': daemon._stats.copy(),
        'components': {}
    }
    # Add computed uptime for convenience
    report['daemon']['uptime_seconds'] = (daemon._stats.get('start_time') and (daemon._stats.get('start_time')))
    # Populate component stats where available
    for name, component in daemon._components.items():
        component_stats = {}
        if hasattr(component, 'get_statistics'):
            component_stats = component.get_statistics()
        elif hasattr(component, 'get_stats'):
            component_stats = component.get_stats()
        report['components'][name] = component_stats
    return report


def log_status_report(daemon: Any) -> None:
    """Log the status report via the daemon logger."""
    try:
        report = build_status_report(daemon)
        daemon.logger.info(f"STATUS REPORT: {json.dumps(report, indent=2, default=str)}")
    except Exception as e:
        daemon.logger.error(f"Error generating status report: {e}")
