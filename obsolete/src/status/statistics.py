"""
Statistics utilities for Claude Monitor.

Provides helpers to build daemon and component statistics.
"""
from __future__ import annotations

from typing import Any, Dict
from datetime import datetime


def get_daemon_statistics(daemon: Any) -> Dict[str, Any]:
    """Assemble daemon statistics dict, including per-component stats."""
    with daemon._lock:
        stats = daemon._stats.copy()
        stats['uptime_seconds'] = (datetime.now() - daemon._start_time).total_seconds()
        stats['components'] = {}
        for name, component in daemon._components.items():
            if hasattr(component, 'get_statistics'):
                stats['components'][name] = component.get_statistics()
        return stats
