"""
Config reloader utilities for Claude Monitor.

Provides a delegated implementation of the daemon's config reload routine
to reduce responsibilities in daemon.py.
"""
from __future__ import annotations

from typing import Any, Dict
import yaml


def reload_config_internal(daemon: Any) -> None:
    """Reload configuration and update components that support update_config()."""
    try:
        daemon.logger.info("Reloading configuration...")

        old_config = daemon.config.copy()
        if daemon.config_path:
            with open(daemon.config_path, 'r', encoding='utf-8') as f:
                new_config = yaml.safe_load(f) or {}
        else:
            new_config = {}

        if new_config != old_config:
            daemon.config = new_config

            # Update component configurations
            component_configs = daemon.config.get('components', {})
            for name, component in daemon._components.items():
                if hasattr(component, 'update_config'):
                    try:
                        component.update_config(component_configs.get(name, {}))
                    except Exception as e:
                        daemon.logger.error(f"Component {name} update_config error: {e}")

            daemon._stats['config_reloads'] += 1
            daemon.logger.info("Configuration reloaded successfully")
        else:
            daemon.logger.info("Configuration unchanged")

    except Exception as e:
        daemon.logger.error(f"Failed to reload configuration: {e}")
