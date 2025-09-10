"""
Cross-platform signal handler utilities for Claude Monitor.

Encapsulates registration logic and maps OS signals to provided callbacks.
"""
from __future__ import annotations

import signal
from typing import Callable, Optional


def register_signal_handlers(
    *,
    on_stop: Callable[[], None],
    on_reload: Optional[Callable[[], None]] = None,
    on_status: Optional[Callable[[], None]] = None,
    logger=None,
) -> None:
    """Register signal handlers mapping to the given callbacks.

    - on_stop: called for SIGTERM/SIGINT (where available)
    - on_reload: called for SIGHUP (where available)
    - on_status: called for SIGUSR1 (where available)
    """
    def _handler(signum, frame):
        try:
            name = None
            try:
                name = signal.Signals(signum).name
            except Exception:
                name = str(signum)
            if logger:
                logger.info(f"Received signal {name}")

            if signum in (getattr(signal, 'SIGTERM', None), getattr(signal, 'SIGINT', None)):
                on_stop()
            elif getattr(signal, 'SIGHUP', None) is not None and signum == signal.SIGHUP:
                if on_reload:
                    on_reload()
            elif getattr(signal, 'SIGUSR1', None) is not None and signum == signal.SIGUSR1:
                if on_status:
                    on_status()
        except Exception as e:
            if logger:
                logger.error(f"Signal handler error: {e}")

    # Register handlers conditionally for cross-platform support
    if hasattr(signal, 'SIGTERM'):
        signal.signal(signal.SIGTERM, _handler)
    if hasattr(signal, 'SIGINT'):
        signal.signal(signal.SIGINT, _handler)
    if hasattr(signal, 'SIGHUP'):
        try:
            signal.signal(signal.SIGHUP, _handler)
        except Exception:
            pass
    if hasattr(signal, 'SIGUSR1'):
        try:
            signal.signal(signal.SIGUSR1, _handler)
        except Exception:
            pass
