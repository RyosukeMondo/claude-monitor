"""
Lightweight config loader that returns a plain dict compatible with existing code.
"""
from __future__ import annotations

from typing import Dict, Any, Optional
import yaml


def load_config_dict(config_path: Optional[str]) -> Dict[str, Any]:
    if not config_path:
        return {}
    with open(config_path, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f) or {}
