"""
Bootstrap/session management for Claude Monitor.

Encapsulates logic for handling fresh sessions, /clear completion/inference,
preflight bootstrap scheduling, and delayed clear/prompt flows.
"""
from __future__ import annotations

import os
import time
import threading
from datetime import datetime
from typing import Any, Dict

from detection.state_detector import ClaudeState, StateDetection


def handle_log_metadata(daemon: Any, meta: Dict[str, Any]) -> None:
    """Process log metadata to manage bootstrap/clear/prompt flows.

    This function mirrors the daemon's previous side effects but centralizes
    the behavior for SRP/SSOT.
    """
    try:
        # Mark clear completion when the bridge/Claude acknowledges it
        if meta.get('clear_completed'):
            daemon._clear_completed_at = time.time()
            daemon._bootstrap_cleared = True
            daemon.logger.info("Detected /clear completion in logs; enabling prompt phase")
            # If we are in bootstrap flow, schedule delayed prompt
            if daemon._pending_bootstrap and 'recovery_engine' in daemon._components:
                recovery_engine = daemon._components['recovery_engine']
                fake_detection = StateDetection(
                    state=ClaudeState.IDLE,
                    confidence=1.0,
                    evidence=["bootstrap_clear_completed"],
                    timestamp=datetime.now(),
                    triggering_lines=[],
                    metadata={}
                )
                try:
                    post_delay = float(os.environ.get('CLAUDE_MONITOR_POST_CLEAR_PROMPT_DELAY_SEC') or \
                                      daemon.config.get('monitoring', {}).get('post_clear_prompt_min_delay_sec', 5.0))
                except Exception:
                    post_delay = 5.0
                daemon.logger.info(f"Scheduling bootstrap idle prompt in {post_delay:.1f}s after clear completion")

                def _delayed_prompt_after_clear():
                    try:
                        time.sleep(post_delay)
                        if not daemon._pending_bootstrap:
                            return
                        prompt_spec = os.environ.get('CLAUDE_MONITOR_SPEC_NAME') or \
                                      daemon.config.get('monitoring', {}).get('spec_name', '')
                        idle_prompt = (
                            f"Please work on one remaining task for spec \"{prompt_spec or 'unknown'}\", "
                            f"make commit after task completion and stop."
                        )
                        prompt_ctx = {
                            'should_send_idle_prompt': True,
                            'idle_prompt_text': idle_prompt,
                            'bootstrap': True,
                            'reason': 'clear_completed_delayed'
                        }
                        daemon.logger.info("Dispatching bootstrap idle prompt after post-clear delay")
                        execn = recovery_engine.execute_recovery(fake_detection, prompt_ctx)
                        if execn:
                            daemon._stats['total_recoveries'] += 1
                            daemon._last_idle_prompt_at = time.time()
                            daemon._pending_bootstrap = False
                            daemon._bootstrap_cleared = False
                            daemon.logger.info("Bootstrap idle prompt dispatched (delayed)")
                    except Exception as e:
                        daemon.logger.error(f"Delayed bootstrap prompt failed to dispatch: {e}")

                threading.Thread(target=_delayed_prompt_after_clear, name="BootstrapPromptAfterClear", daemon=True).start()
            return

        # Infer clear completion by welcome/prompt/echo/no_content shortly after clear
        if daemon._pending_bootstrap and (
            meta.get('welcome_banner') or meta.get('claude_prompt') or
            meta.get('clear_no_content') or meta.get('clear_command_echo')
        ):
            now_ts = time.time()
            if daemon._last_idle_clear_at and (now_ts - daemon._last_idle_clear_at) < 5.0:
                daemon._clear_completed_at = now_ts
                daemon._bootstrap_cleared = True
                daemon.logger.info("Inferred /clear completion from banner/prompt after dispatch; enabling prompt phase")
                if 'recovery_engine' in daemon._components:
                    recovery_engine = daemon._components['recovery_engine']
                    fake_detection = StateDetection(
                        state=ClaudeState.IDLE,
                        confidence=1.0,
                        evidence=["bootstrap_clear_inferred"],
                        timestamp=datetime.now(),
                        triggering_lines=[],
                        metadata={}
                    )
                    try:
                        post_delay = float(os.environ.get('CLAUDE_MONITOR_POST_CLEAR_PROMPT_DELAY_SEC') or \
                                          daemon.config.get('monitoring', {}).get('post_clear_prompt_min_delay_sec', 5.0))
                    except Exception:
                        post_delay = 5.0
                    daemon.logger.info(f"Scheduling bootstrap idle prompt in {post_delay:.1f}s after inferred clear completion")

                    def _delayed_prompt_after_inferred():
                        try:
                            time.sleep(post_delay)
                            if not daemon._pending_bootstrap:
                                return
                            prompt_spec = os.environ.get('CLAUDE_MONITOR_SPEC_NAME') or \
                                          daemon.config.get('monitoring', {}).get('spec_name', '')
                            idle_prompt = (
                                f"Please work on one remaining task for spec \"{prompt_spec or 'unknown'}\", "
                                f"make commit after task completion and stop."
                            )
                            prompt_ctx = {
                                'should_send_idle_prompt': True,
                                'idle_prompt_text': idle_prompt,
                                'bootstrap': True,
                                'reason': 'clear_inferred_delayed'
                            }
                            daemon.logger.info("Dispatching bootstrap idle prompt after inferred clear delay")
                            execn = recovery_engine.execute_recovery(fake_detection, prompt_ctx)
                            if execn:
                                daemon._stats['total_recoveries'] += 1
                                daemon._last_idle_prompt_at = time.time()
                                daemon._pending_bootstrap = False
                                daemon._bootstrap_cleared = False
                                daemon.logger.info("Bootstrap idle prompt dispatched (delayed, inferred)")
                        except Exception as e:
                            daemon.logger.error(f"Delayed bootstrap prompt (inferred) failed to dispatch: {e}")

                    threading.Thread(target=_delayed_prompt_after_inferred, name="BootstrapPromptAfterClearInferred", daemon=True).start()
            return

        # Fresh session markers trigger bootstrap sequence
        if any(meta.get(k) for k in (
            'session_start_marker', 'welcome_banner', 'tcp_server_started', 'tcp_bridge_active'
        )) and not daemon._pending_bootstrap:
            daemon._pending_bootstrap = True
            daemon._last_detected_state = ClaudeState.UNKNOWN
            daemon._last_idle_clear_at = None
            daemon._last_idle_prompt_at = None
            daemon._clear_completed_at = None
            daemon._bootstrap_cleared = False
            daemon.logger.info("Fresh Claude session detected via logs; bootstrap scheduled (clear then prompt)")

            if 'recovery_engine' in daemon._components:
                try:
                    recovery_engine = daemon._components['recovery_engine']
                    fake_detection = StateDetection(
                        state=ClaudeState.IDLE,
                        confidence=1.0,
                        evidence=["bootstrap_session_start"],
                        timestamp=datetime.now(),
                        triggering_lines=[],
                        metadata={}
                    )
                    try:
                        delay_sec = float(os.environ.get('CLAUDE_MONITOR_BOOTSTRAP_CLEAR_DELAY_SEC') or \
                                          daemon.config.get('monitoring', {}).get('bootstrap_clear_delay_sec', 5.0))
                    except Exception:
                        delay_sec = 5.0
                    daemon.logger.info(f"Scheduling bootstrap clear (/clear) in {delay_sec:.1f}s")

                    def _delayed_clear():
                        try:
                            time.sleep(delay_sec)
                            if not daemon._pending_bootstrap or daemon._bootstrap_cleared:
                                daemon.logger.info("Skipping delayed clear: bootstrap no longer pending or already cleared")
                                return
                            immediate_ctx = {
                                'should_send_idle_clear': True,
                                'bootstrap': True,
                                'reason': 'fresh_session_start_delayed'
                            }
                            t0 = time.time()
                            daemon.logger.info("Dispatching delayed bootstrap clear (/clear) now")
                            execn_inner = recovery_engine.execute_recovery(fake_detection, immediate_ctx)
                            if execn_inner:
                                daemon._stats['total_recoveries'] += 1
                                daemon._last_idle_clear_at = t0
                                daemon.logger.info("Delayed bootstrap clear dispatched")
                                try:
                                    prompt_delay = float(daemon.config.get('monitoring', {}).get('bootstrap_prompt_delay_sec', 2.0))
                                except Exception:
                                    prompt_delay = 2.0

                                def _fallback_prompt():
                                    try:
                                        time.sleep(prompt_delay)
                                        if not daemon._pending_bootstrap or daemon._bootstrap_cleared:
                                            return
                                        prompt_spec = os.environ.get('CLAUDE_MONITOR_SPEC_NAME') or \
                                                      daemon.config.get('monitoring', {}).get('spec_name', '')
                                        idle_prompt = (
                                            f"Please work on one remaining task for spec \"{prompt_spec or 'unknown'}\", "
                                            f"make commit after task completion and stop."
                                        )
                                        prompt_ctx = {
                                            'should_send_idle_prompt': True,
                                            'idle_prompt_text': idle_prompt,
                                            'bootstrap': True,
                                            'reason': 'fallback_after_clear'
                                        }
                                        daemon.logger.info("Fallback dispatching idle prompt after clear delay")
                                        execn_prompt = recovery_engine.execute_recovery(fake_detection, prompt_ctx)
                                        if execn_prompt:
                                            daemon._stats['total_recoveries'] += 1
                                            daemon._last_idle_prompt_at = time.time()
                                            daemon._pending_bootstrap = False
                                            daemon._bootstrap_cleared = False
                                            daemon.logger.info("Fallback idle prompt dispatched")
                                    except Exception as e:
                                        daemon.logger.error(f"Fallback prompt dispatch error: {e}")

                                threading.Thread(target=_fallback_prompt, name="BootstrapPromptFallback", daemon=True).start()
                        except Exception as e:
                            daemon.logger.error(f"Delayed bootstrap clear failed to dispatch: {e}")

                    threading.Thread(target=_delayed_clear, name="BootstrapClearDelay", daemon=True).start()
                except Exception as e:
                    daemon.logger.error(f"Scheduling delayed bootstrap clear failed: {e}")
    except Exception as e:
        daemon.logger.debug(f"Session marker check error: {e}")


def schedule_preflight_bootstrap_if_needed(daemon: Any) -> None:
    """Schedule preflight bootstrap on initial TCP connect when tailing from end."""
    try:
        read_from_end = True
        try:
            read_from_end = bool(
                daemon.config.get('components', {}).get('log_parser', {}).get('monitoring', {}).get('read_from_end', True)
            )
        except Exception:
            read_from_end = True

        if read_from_end and not daemon._pending_bootstrap and not daemon._last_idle_clear_at:
            daemon._pending_bootstrap = True
            daemon._bootstrap_cleared = False
            daemon._clear_completed_at = None
            daemon._last_idle_prompt_at = None

            recovery_engine = daemon._components['recovery_engine']
            fake_detection = StateDetection(
                state=ClaudeState.IDLE,
                confidence=1.0,
                evidence=["bootstrap_preflight_connect"],
                timestamp=datetime.now(),
                triggering_lines=[],
                metadata={}
            )
            try:
                delay_sec = float(os.environ.get('CLAUDE_MONITOR_BOOTSTRAP_CLEAR_DELAY_SEC') or \
                                  daemon.config.get('monitoring', {}).get('bootstrap_clear_delay_sec', 5.0))
            except Exception:
                delay_sec = 5.0
            daemon.logger.info(f"Preflight: scheduling bootstrap clear (/clear) in {delay_sec:.1f}s")

            def _delayed_clear_preflight():
                try:
                    import time as _t
                    _t.sleep(delay_sec)
                    if not daemon._pending_bootstrap or daemon._bootstrap_cleared:
                        daemon.logger.info("Preflight: skipping delayed clear (bootstrap no longer pending or already cleared)")
                        return
                    ctx = {
                        'should_send_idle_clear': True,
                        'bootstrap': True,
                        'reason': 'preflight_connect_delayed'
                    }
                    t0 = time.time()
                    daemon.logger.info("Preflight: dispatching delayed bootstrap clear (/clear) now")
                    execn_inner = recovery_engine.execute_recovery(fake_detection, ctx)
                    if execn_inner:
                        daemon._stats['total_recoveries'] += 1
                        daemon._last_idle_clear_at = t0
                        daemon.logger.info("Preflight: delayed bootstrap clear dispatched")
                        try:
                            prompt_delay = float(daemon.config.get('monitoring', {}).get('bootstrap_prompt_delay_sec', 2.0))
                        except Exception:
                            prompt_delay = 2.0

                        def _fallback_prompt_preflight():
                            try:
                                _t.sleep(prompt_delay)
                                if not daemon._pending_bootstrap or daemon._bootstrap_cleared:
                                    return
                                prompt_spec = os.environ.get('CLAUDE_MONITOR_SPEC_NAME') or \
                                              daemon.config.get('monitoring', {}).get('spec_name', '')
                                idle_prompt = (
                                    f"Please work on one remaining task for spec \"{prompt_spec or 'unknown'}\", "
                                    f"make commit after task completion and stop."
                                )
                                prompt_ctx = {
                                    'should_send_idle_prompt': True,
                                    'idle_prompt_text': idle_prompt,
                                    'bootstrap': True,
                                    'reason': 'fallback_after_clear_preflight'
                                }
                                daemon.logger.info("Preflight: fallback dispatching idle prompt after clear delay")
                                execn_prompt = recovery_engine.execute_recovery(fake_detection, prompt_ctx)
                                if execn_prompt:
                                    daemon._stats['total_recoveries'] += 1
                                    daemon._last_idle_prompt_at = time.time()
                                    daemon._pending_bootstrap = False
                                    daemon._bootstrap_cleared = False
                                    daemon.logger.info("Preflight: fallback idle prompt dispatched")
                            except Exception as e:
                                daemon.logger.error(f"Preflight: fallback prompt dispatch error: {e}")

                        threading.Thread(target=_fallback_prompt_preflight, name="BootstrapPromptFallbackPreflight", daemon=True).start()
                except Exception as e:
                    daemon.logger.error(f"Preflight: delayed bootstrap clear failed to dispatch: {e}")

            threading.Thread(target=_delayed_clear_preflight, name="BootstrapClearPreflightDelay", daemon=True).start()
    except Exception as e:
        daemon.logger.error(f"Preflight: failed to schedule delayed bootstrap clear: {e}")
