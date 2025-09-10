"""
Communication module for Claude Monitor.

Provides TCP client functionality for communicating with Claude Code expect bridge.
"""

from .tcp_client import TCPClient, ConnectionState

__all__ = [
    'TCPClient',
    'ConnectionState'
]