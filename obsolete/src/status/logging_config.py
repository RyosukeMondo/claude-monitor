"""
Logging config utilities.

Transforms YAML logging config into the format expected by monitor_logging.initialize_logging.
"""
from __future__ import annotations

from typing import Dict, Any


def transform_logging_config(logging_config: Dict[str, Any]) -> Dict[str, Any]:
    """Transform YAML logging config to MonitorLogger format."""
    transformed = {
        'level': logging_config.get('level', 'INFO'),
        'file': logging_config.get('file', '/tmp/claude-monitor.log'),
        'console': logging_config.get('console', {}).get('enabled', True),
        'max_size_mb': 10,  # Default from YAML rotation.max_size
        'backup_count': 5,  # Default from YAML rotation.backup_count
        'json_format': False,
        'structured_format': True,
    }

    rotation_config = logging_config.get('rotation', {})
    if rotation_config.get('max_size'):
        max_size_str = rotation_config['max_size']
        if isinstance(max_size_str, str) and max_size_str.endswith('MB'):
            try:
                transformed['max_size_mb'] = int(max_size_str.replace('MB', ''))
            except Exception:
                pass

    if rotation_config.get('backup_count') is not None:
        transformed['backup_count'] = rotation_config['backup_count']

    return transformed
