"""
Callback wiring for components.

Configures interactions between log_parser, state_detector, recovery_engine,
notifier, and task_monitor.
"""
from __future__ import annotations

from typing import Any
from decision.decision_engine import process_detection
from session.bootstrap_manager import handle_log_metadata
from detection.state_detector import ClaudeState


def configure_callbacks(daemon: Any) -> None:
    try:
        # Log parser to state detector integration
        if 'log_parser' in daemon._components and 'state_detector' in daemon._components:
            def on_new_log_line(log_line):
                try:
                    # Bootstrap/session metadata handling
                    try:
                        meta = getattr(log_line, 'metadata', {}) or {}
                        handle_log_metadata(daemon, meta)
                    except Exception as marker_err:
                        daemon.logger.debug(f"Session marker check error: {marker_err}")

                    # State detection
                    context = daemon._components['log_parser'].get_context()
                    detection = daemon._components['state_detector'].detect_state(context)

                    if detection and detection.confidence >= daemon._components['state_detector'].config.get('min_confidence', 0.6):
                        daemon.logger.info(
                            f"State detected: {detection.state} (confidence: {detection.confidence:.2f}) | "
                            f"last_state={daemon._last_detected_state}, pending_bootstrap={daemon._pending_bootstrap}, "
                            f"last_clear_at={daemon._last_idle_clear_at}, last_prompt_at={daemon._last_idle_prompt_at}"
                        )
                        process_detection(daemon, detection)
                except Exception as e:
                    daemon.logger.error(f"Error processing log line in state detector: {e}")

            daemon._components['log_parser'].add_line_callback(on_new_log_line)
            daemon.logger.info("Log parser connected to state detector")

        # State detector to recovery engine (placeholder: if detector exposes callbacks in future)
        daemon.logger.info("State detector callback integration configured")

        # Recovery engine to notifier integration
        if 'recovery_engine' in daemon._components and 'notifier' in daemon._components:
            def on_recovery_start(execution):
                try:
                    daemon._components['notifier'].notify_recovery(
                        "Recovery Action Started",
                        f"Executing {execution.action.action_type.value}: {execution.action.description}"
                    )
                except Exception as e:
                    daemon.logger.error(f"Error in recovery start notification: {e}")

            def on_recovery_complete(execution):
                try:
                    daemon._components['notifier'].notify_success(
                        "Recovery Action Completed",
                        f"Successfully completed {execution.action.action_type.value} in {execution.duration:.2f}s"
                    )
                except Exception as e:
                    daemon.logger.error(f"Error in recovery complete notification: {e}")

            def on_recovery_failure(execution):
                try:
                    daemon._components['notifier'].notify_error(
                        "Recovery Action Failed",
                        f"Failed to execute {execution.action.action_type.value}: {execution.error_message}"
                    )
                except Exception as e:
                    daemon.logger.error(f"Error in recovery failure notification: {e}")

            daemon._components['recovery_engine'].set_callbacks(
                on_execution_start=on_recovery_start,
                on_execution_complete=on_recovery_complete,
                on_execution_failure=on_recovery_failure
            )

        # Task monitor to notifier integration
        if 'task_monitor' in daemon._components and 'notifier' in daemon._components:
            def on_spec_complete(spec_info):
                try:
                    daemon._components['notifier'].notify_completion(
                        "Spec Completed",
                        f"Spec '{spec_info.spec_name}' completed with {spec_info.completed_tasks}/{spec_info.total_tasks} tasks"
                    )
                except Exception as e:
                    daemon.logger.error(f"Error in spec complete notification: {e}")

            def on_task_complete(task_info):
                try:
                    if hasattr(task_info, 'priority') and task_info.priority >= 8:
                        daemon._components['notifier'].notify_info(
                            "Task Completed",
                            f"Task '{task_info.description}' completed"
                        )
                except Exception as e:
                    daemon.logger.error(f"Error in task complete notification: {e}")

            daemon._components['task_monitor'].set_callbacks(
                on_spec_complete=on_spec_complete,
                on_task_complete=on_task_complete
            )

        daemon.logger.info("Component callbacks configured")
    except Exception as e:
        daemon.logger.error(f"Failed to setup component callbacks: {e}")
        raise
