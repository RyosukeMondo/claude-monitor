"""
Decision engine module centralizing state decision logic for Claude Monitor.

Single Source of Truth for:
- Global decision throttling
- Consecutive detection handling
- IDLE two-phase clear/prompt behavior
- Per-state recovery throttling
- Bootstrap gating and transitions

This module operates on the daemon instance to avoid large interface changes.
"""
from __future__ import annotations

import os
import time
from datetime import datetime
from typing import Any

# Types imported for readability
from detection.state_detector import ClaudeState


def process_detection(daemon: Any, detection) -> None:
    """Centralized state decision and recovery execution.

    Args:
        daemon: Instance of ClaudeMonitorDaemon (holds state and components)
        detection: StateDetection instance
    """
    try:
        if 'recovery_engine' not in daemon._components:
            return
        recovery_engine = daemon._components['recovery_engine']

        # Common recovery context
        recovery_context = {
            'detection_confidence': detection.confidence,
            'detection_evidence': detection.evidence,
            'timestamp': detection.timestamp,
        }

        # Global decision throttling when state unchanged
        try:
            now_ts_dec = time.time()
            if (
                daemon._last_detected_state == detection.state
                and daemon._decision_min_interval_sec > 0
                and daemon._last_decision_ts
                and (now_ts_dec - daemon._last_decision_ts) < daemon._decision_min_interval_sec
            ):
                daemon.logger.debug(
                    f"Throttling decisions for state {detection.state} (last {now_ts_dec - daemon._last_decision_ts:.2f}s ago < {daemon._decision_min_interval_sec}s)"
                )
                return
        except Exception:
            pass

        # Update consecutive counters and idle gating
        try:
            if detection.state == ClaudeState.IDLE:
                daemon._consec_idle_count += 1
                daemon._consec_active_count = 0
            elif detection.state == ClaudeState.ACTIVE:
                daemon._consec_active_count += 1
                daemon._consec_idle_count = 0
                daemon._idle_period_cleared = False
            else:
                daemon._consec_idle_count = 0
                daemon._consec_active_count = 0
                daemon._idle_period_cleared = False
        except Exception:
            pass

        # Per-state recovery throttling
        state_key = detection.state.value
        now = time.time()
        last_ts = daemon._last_recovery_by_state.get(state_key, 0)
        if (now - last_ts) < daemon._min_recovery_interval_sec:
            daemon.logger.debug(
                f"Throttling recovery for state {detection.state}: last {now - last_ts:.2f}s ago"
            )
            return

        # Problematic states that trigger recovery immediately
        recovery_states = {
            ClaudeState.CONTEXT_PRESSURE,
            ClaudeState.INPUT_WAITING,
            ClaudeState.ERROR,
        }

        if detection.state == ClaudeState.IDLE:
            # Require multiple consecutive IDLE confirmations
            if daemon._consec_idle_count < max(1, daemon._consec_idle_required):
                daemon.logger.info(
                    f"Decision: waiting for consecutive idle confirmations ({daemon._consec_idle_count}/{daemon._consec_idle_required})"
                )
                daemon._last_detected_state = detection.state
                daemon._last_decision_ts = time.time()
                return

            current_project = os.environ.get('CLAUDE_MONITOR_PROJECT_PATH') or \
                             daemon.config.get('monitoring', {}).get('project_path', '')
            current_spec = os.environ.get('CLAUDE_MONITOR_SPEC_NAME') or \
                          daemon.config.get('monitoring', {}).get('spec_name', '')

            now_ts = time.time()
            # Phase 1: send /clear once per idle period (and during bootstrap)
            if (not daemon._idle_period_cleared or daemon._pending_bootstrap) and not daemon._bootstrap_cleared:
                clear_context = dict(recovery_context)
                clear_context.update({'should_send_idle_clear': True})
                daemon.logger.info("Decision: sending idle clear (/clear)")
                execution = recovery_engine.execute_recovery(detection, clear_context)
                if execution:
                    daemon._stats['total_recoveries'] += 1
                    daemon._last_idle_clear_at = now_ts
                    daemon._idle_period_cleared = True
                    if daemon._pending_bootstrap:
                        daemon._bootstrap_cleared = True
                    daemon.logger.info("Idle clear sent via recovery engine (/clear)")
                else:
                    daemon.logger.info("Decision: not sending clear yet")
            else:
                # Phase 2: prompt when appropriate
                should_send_prompt = True
                if daemon._last_idle_prompt_at and (now_ts - daemon._last_idle_prompt_at) < recovery_engine.config.get('cooldown_period', 10.0):
                    should_send_prompt = False
                if daemon._last_idle_clear_at and (now_ts - daemon._last_idle_clear_at) < 1.0:
                    should_send_prompt = False
                if daemon._last_idle_clear_at and (not daemon._clear_completed_at or daemon._clear_completed_at < daemon._last_idle_clear_at):
                    age = now_ts - daemon._last_idle_clear_at
                    if age >= daemon._clear_completion_fallback_sec:
                        daemon.logger.info(
                            f"Bypassing /clear completion wait after {age:.1f}s (fallback {daemon._clear_completion_fallback_sec:.1f}s)"
                        )
                    else:
                        should_send_prompt = False
                        daemon.logger.info("Decision: not sending prompt yet (awaiting /clear completion)")
                if daemon._pending_bootstrap and not daemon._bootstrap_cleared:
                    should_send_prompt = False

                if should_send_prompt:
                    prompt_spec = current_spec or 'unknown'
                    idle_prompt = (
                        f"Please work on one remaining task for spec \"{prompt_spec}\", "
                        f"make commit after task completion and stop."
                    )
                    prompt_context = dict(recovery_context)
                    prompt_context.update({
                        'should_send_idle_prompt': True,
                        'idle_prompt_text': idle_prompt,
                        'context_spec': current_spec,
                        'context_project': current_project,
                    })
                    daemon.logger.info("Decision: sending idle prompt")
                    execution = recovery_engine.execute_recovery(detection, prompt_context)
                    if execution:
                        daemon._stats['total_recoveries'] += 1
                        daemon._last_idle_prompt_at = now_ts
                        daemon.logger.info("Idle prompt sent via recovery engine")
                        if daemon._pending_bootstrap:
                            daemon._pending_bootstrap = False
                            daemon._bootstrap_cleared = False
                else:
                    daemon.logger.info("Decision: not sending prompt yet (cooldown or just cleared)")

        elif detection.state in recovery_states:
            execution = recovery_engine.execute_recovery(detection, recovery_context)
            if execution:
                daemon._stats['total_recoveries'] += 1
                daemon._last_recovery_by_state[state_key] = now
                daemon.logger.info(f"Recovery initiated for state: {detection.state}")

        # Record last state and decision timestamp
        daemon._last_detected_state = detection.state
        try:
            daemon._last_decision_ts = time.time()
        except Exception:
            pass
    except Exception as e:
        daemon.logger.error(f"Detection processing failed: {e}")
