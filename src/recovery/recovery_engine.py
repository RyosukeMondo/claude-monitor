"""
Recovery engine for automated Claude Code recovery actions.

This module implements automated recovery action execution following requirements 2.1, 2.4, 3.1, and 3.6:
- Recovery action execution with retry logic and timeout handling
- Context-aware recovery strategy selection
- Graceful handling of partial failures
- Ensuring recovery actions don't interfere with user activity
"""

import time
import threading
from typing import Dict, List, Optional, Any, Callable
from enum import Enum
from dataclasses import dataclass
from datetime import datetime, timedelta
import asyncio
import json
import uuid

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from monitor_logging import get_logger
from communication.tcp_client import TCPClient
from detection.state_detector import ClaudeState, StateDetection


class RecoveryActionType(Enum):
    """Types of recovery actions."""
    COMPACT = "compact"
    RESUME_INPUT = "resume_input"
    PROVIDE_INPUT = "provide_input"
    CLEAR_ERROR = "clear_error"
    RESTART_SESSION = "restart_session"
    NOTIFY_USER = "notify_user"
    WAIT_AND_RETRY = "wait_and_retry"
    FORCE_EXIT = "force_exit"


class RecoveryResult(Enum):
    """Recovery action execution results."""
    SUCCESS = "success"
    PARTIAL_SUCCESS = "partial_success"
    FAILURE = "failure"
    TIMEOUT = "timeout"
    CANCELLED = "cancelled"
    USER_INTERVENTION_REQUIRED = "user_intervention_required"


@dataclass
class RecoveryAction:
    """Represents a recovery action to execute."""
    action_type: RecoveryActionType
    target_state: ClaudeState
    priority: int  # 1-10, higher is more urgent
    command: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    timeout: float = 30.0
    max_retries: int = 3
    requires_confirmation: bool = False
    description: str = ""
    
    def __post_init__(self):
        if not 1 <= self.priority <= 10:
            raise ValueError(f"Priority must be between 1-10, got {self.priority}")
        if self.data is None:
            self.data = {}


@dataclass
class RecoveryExecution:
    """Tracks recovery action execution."""
    action: RecoveryAction
    start_time: datetime
    end_time: Optional[datetime] = None
    result: Optional[RecoveryResult] = None
    attempts: int = 0
    error_message: Optional[str] = None
    output: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    exec_id: str = ""
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}
        if not self.exec_id:
            # short correlation id
            self.exec_id = uuid.uuid4().hex[:8]
    
    @property
    def duration(self) -> Optional[float]:
        """Get execution duration in seconds."""
        if self.end_time:
            return (self.end_time - self.start_time).total_seconds()
        return None
    
    @property
    def is_complete(self) -> bool:
        """Check if execution is complete."""
        return self.result is not None


class RecoveryStrategy:
    """Defines a recovery strategy for specific states and contexts."""
    
    def __init__(self, name: str, target_states: List[ClaudeState], 
                 actions: List[RecoveryAction], conditions: Optional[Dict[str, Any]] = None):
        self.name = name
        self.target_states = target_states
        self.actions = sorted(actions, key=lambda x: x.priority, reverse=True)
        self.conditions = conditions or {}
        
    def matches_context(self, state: ClaudeState, context: Dict[str, Any]) -> bool:
        """
        Check if this strategy applies to the given state and context.
        
        Args:
            state: Current Claude state
            context: Context information
            
        Returns:
            True if strategy applies, False otherwise
        """
        if state not in self.target_states:
            return False
            
        # Check additional conditions
        for key, expected_value in self.conditions.items():
            if key not in context:
                return False
            if isinstance(expected_value, (list, tuple)):
                if context[key] not in expected_value:
                    return False
            elif context[key] != expected_value:
                return False
                
        return True


class RecoveryEngine:
    """
    Automated recovery engine for Claude Code states.
    
    Executes recovery actions based on detected states with retry logic,
    timeout handling, and context-aware strategy selection.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the recovery engine.
        
        Args:
            config: Configuration dictionary with engine settings
        """
        self.config = config or self._get_default_config()
        self.logger = get_logger('recovery_engine')
        
        # TCP client for command execution
        self.tcp_client = TCPClient(self.config.get('tcp_client', {}))
        
        # Engine state
        self._enabled = True
        self._executing = False
        self._current_execution: Optional[RecoveryExecution] = None
        self._execution_history: List[RecoveryExecution] = []
        self._lock = threading.RLock()
        self._executor_thread: Optional[threading.Thread] = None
        
        # Recovery strategies
        self._strategies: List[RecoveryStrategy] = []
        self._init_default_strategies()
        
        # Statistics
        self._stats = {
            'total_executions': 0,
            'successful_executions': 0,
            'failed_executions': 0,
            'timeout_executions': 0,
            'cancelled_executions': 0,
            'total_execution_time': 0.0,
            'avg_execution_time': 0.0,
            'last_execution_time': None
        }
        
        # Callbacks
        self._on_execution_start: Optional[Callable] = None
        self._on_execution_complete: Optional[Callable] = None
        self._on_execution_failure: Optional[Callable] = None
        
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default recovery engine configuration."""
        return {
            'enabled': True,
            'max_concurrent_executions': 1,
            'default_timeout': 30.0,
            'max_retries': 3,
            'retry_backoff': 2.0,
            'execution_history_limit': 100,
            'require_confirmation_for_destructive_actions': True,
            'user_activity_check_interval': 5.0,
            'cooldown_period': 10.0,  # Seconds between recovery attempts for same state
            'tcp_client': {
                'host': 'localhost',
                'port': 9999,
                'connection_timeout': 5.0,
                'auto_reconnect': True
            }
        }
        
    def _init_default_strategies(self):
        """Initialize default recovery strategies."""
        
        # Context pressure recovery strategy
        context_pressure_actions = [
            RecoveryAction(
                action_type=RecoveryActionType.COMPACT,
                target_state=ClaudeState.IDLE,
                priority=8,
                command="/compact",
                timeout=15.0,
                description="Execute /compact to reduce context usage"
            ),
            RecoveryAction(
                action_type=RecoveryActionType.NOTIFY_USER,
                target_state=ClaudeState.CONTEXT_PRESSURE,
                priority=5,
                data={'message': 'Context pressure detected - compacting context'},
                description="Notify user about context pressure and compaction"
            )
        ]
        
        self._strategies.append(RecoveryStrategy(
            name="context_pressure_recovery",
            target_states=[ClaudeState.CONTEXT_PRESSURE],
            actions=context_pressure_actions
        ))
        
        # Input waiting recovery strategy
        input_waiting_actions = [
            RecoveryAction(
                action_type=RecoveryActionType.PROVIDE_INPUT,
                target_state=ClaudeState.INPUT_WAITING,
                priority=7,
                command="y",  # Default to 'yes' for prompts
                timeout=5.0,
                description="Provide default 'yes' response to prompts"
            ),
            RecoveryAction(
                action_type=RecoveryActionType.RESUME_INPUT,
                target_state=ClaudeState.INPUT_WAITING,
                priority=6,
                command="\n",  # Send Enter key
                timeout=5.0,
                description="Send Enter key to resume input"
            ),
            RecoveryAction(
                action_type=RecoveryActionType.NOTIFY_USER,
                target_state=ClaudeState.INPUT_WAITING,
                priority=4,
                data={'message': 'Claude is waiting for input - attempting automatic response'},
                description="Notify user about input requirement"
            )
        ]
        
        self._strategies.append(RecoveryStrategy(
            name="input_waiting_recovery",
            target_states=[ClaudeState.INPUT_WAITING],
            actions=input_waiting_actions
        ))
        
        # Error recovery strategy
        error_actions = [
            RecoveryAction(
                action_type=RecoveryActionType.CLEAR_ERROR,
                target_state=ClaudeState.IDLE,
                priority=6,
                command="exit",  # Exit error state
                timeout=10.0,
                description="Exit error state"
            ),
            RecoveryAction(
                action_type=RecoveryActionType.RESTART_SESSION,
                target_state=ClaudeState.IDLE,
                priority=4,
                requires_confirmation=True,
                timeout=20.0,
                description="Restart Claude session"
            ),
            RecoveryAction(
                action_type=RecoveryActionType.NOTIFY_USER,
                target_state=ClaudeState.ERROR,
                priority=8,
                data={'message': 'Error detected in Claude Code - attempting recovery'},
                description="Notify user about error state"
            )
        ]
        
        self._strategies.append(RecoveryStrategy(
            name="error_recovery",
            target_states=[ClaudeState.ERROR],
            actions=error_actions
        ))
        
        # Idle maintenance strategy (for long idle periods)
        idle_actions = [
            RecoveryAction(
                action_type=RecoveryActionType.NOTIFY_USER,
                target_state=ClaudeState.IDLE,
                priority=2,
                data={'message': 'Claude Code has been idle - monitoring continues'},
                description="Notify about extended idle period"
            )
        ]
        
        self._strategies.append(RecoveryStrategy(
            name="idle_maintenance",
            target_states=[ClaudeState.IDLE],
            actions=idle_actions,
            conditions={'idle_duration_minutes': 30}  # Only after 30+ minutes idle
        ))

        # Idle prompt strategy: proactively send a work instruction when idle
        idle_prompt_actions = [
            RecoveryAction(
                action_type=RecoveryActionType.PROVIDE_INPUT,
                target_state=ClaudeState.IDLE,
                priority=9,
                # The actual prompt text will be composed in _execute_input_action using context
                command=None,
                timeout=10.0,
                description="Send idle work prompt to Claude Code"
            )
        ]

        self._strategies.append(RecoveryStrategy(
            name="idle_prompt",
            target_states=[ClaudeState.IDLE],
            actions=idle_prompt_actions,
            # Trigger when caller provides 'should_send_idle_prompt': True in context
            conditions={'should_send_idle_prompt': True}
        ))

        # Idle clear strategy: proactively run /clear on idle to save tokens
        idle_clear_actions = [
            RecoveryAction(
                action_type=RecoveryActionType.CLEAR_ERROR,  # Reuse generic command executor
                target_state=ClaudeState.IDLE,
                priority=10,
                command="/clear",
                timeout=10.0,
                description="Send /clear to reduce token usage"
            )
        ]

        self._strategies.append(RecoveryStrategy(
            name="idle_clear",
            target_states=[ClaudeState.IDLE],
            actions=idle_clear_actions,
            conditions={'should_send_idle_clear': True}
        ))
        
    def set_callbacks(self, on_execution_start: Optional[Callable] = None,
                     on_execution_complete: Optional[Callable] = None,
                     on_execution_failure: Optional[Callable] = None):
        """
        Set callback functions for recovery execution events.
        
        Args:
            on_execution_start: Called when execution starts
            on_execution_complete: Called when execution completes successfully
            on_execution_failure: Called when execution fails
        """
        self._on_execution_start = on_execution_start
        self._on_execution_complete = on_execution_complete
        self._on_execution_failure = on_execution_failure
        
    def enable(self):
        """Enable recovery engine."""
        with self._lock:
            self._enabled = True
            self.logger.info("Recovery engine enabled")
            
    def disable(self):
        """Disable recovery engine."""
        with self._lock:
            self._enabled = False
            self.logger.info("Recovery engine disabled")
            
    def is_enabled(self) -> bool:
        """Check if recovery engine is enabled."""
        with self._lock:
            return self._enabled
            
    def is_executing(self) -> bool:
        """Check if recovery engine is currently executing an action."""
        with self._lock:
            return self._executing
            
    def add_strategy(self, strategy: RecoveryStrategy):
        """
        Add a custom recovery strategy.
        
        Args:
            strategy: Recovery strategy to add
        """
        with self._lock:
            self._strategies.append(strategy)
            self.logger.info(f"Added recovery strategy: {strategy.name}")
            
    def remove_strategy(self, name: str) -> bool:
        """
        Remove a recovery strategy by name.
        
        Args:
            name: Strategy name to remove
            
        Returns:
            True if strategy was found and removed, False otherwise
        """
        with self._lock:
            for i, strategy in enumerate(self._strategies):
                if strategy.name == name:
                    del self._strategies[i]
                    self.logger.info(f"Removed recovery strategy: {name}")
                    return True
            return False
            
    def execute_recovery(self, detection: StateDetection, context: Optional[Dict[str, Any]] = None) -> Optional[RecoveryExecution]:
        """
        Execute recovery actions for a detected state.
        
        Args:
            detection: State detection result
            context: Additional context information
            
        Returns:
            RecoveryExecution if action was initiated, None if no action taken
        """
        if not self._enabled:
            self.logger.debug("Recovery engine disabled, skipping recovery")
            return None
            
        if self._executing:
            self.logger.debug("Recovery already in progress, skipping")
            return None
            
        # Build context
        recovery_context = context or {}
        recovery_context.update({
            'detection_confidence': detection.confidence,
            'detection_timestamp': detection.timestamp,
            'detection_evidence': detection.evidence
        })
        
        # Find matching strategy
        strategy = self._find_best_strategy(detection.state, recovery_context)
        if not strategy:
            self.logger.debug(f"No recovery strategy found for state: {detection.state}")
            return None
            
        # Select best action from strategy
        action = self._select_best_action(strategy, recovery_context)
        if not action:
            self.logger.debug(f"No suitable action found in strategy: {strategy.name}")
            return None
            
        # Check cooldown period, but do NOT block explicit idle prompt dispatches
        bypass_cooldown = False
        try:
            if recovery_context.get('should_send_idle_prompt'):
                bypass_cooldown = True
            elif action.action_type == RecoveryActionType.PROVIDE_INPUT:
                # Idle prompt path uses PROVIDE_INPUT; allow it to bypass cooldown
                bypass_cooldown = True
        except Exception:
            pass

        if not bypass_cooldown:
            if self._is_in_cooldown(detection.state):
                self.logger.debug(f"Recovery cooldown active for state: {detection.state}")
                return None
        else:
            self.logger.debug("Bypassing cooldown for idle prompt dispatch")
        
        # Execute action
        return self._execute_action(action, recovery_context)
        
    def _find_best_strategy(self, state: ClaudeState, context: Dict[str, Any]) -> Optional[RecoveryStrategy]:
        """
        Find the best recovery strategy for the given state and context.
        
        Args:
            state: Current Claude state
            context: Context information
            
        Returns:
            Best matching strategy or None
        """
        matching_strategies = []
        
        for strategy in self._strategies:
            if strategy.matches_context(state, context):
                matching_strategies.append(strategy)
                
        if not matching_strategies:
            return None
            
        # For now, return the first matching strategy
        # Future enhancement: score strategies based on context
        return matching_strategies[0]
        
    def _select_best_action(self, strategy: RecoveryStrategy, context: Dict[str, Any]) -> Optional[RecoveryAction]:
        """
        Select the best action from a strategy based on context.
        
        Args:
            strategy: Recovery strategy
            context: Context information
            
        Returns:
            Best action to execute or None
        """
        for action in strategy.actions:  # Already sorted by priority
            # Skip actions that require confirmation if not available
            if action.requires_confirmation and not self._can_confirm_action(action, context):
                continue
            
            # For PROVIDE_INPUT, ensure it's actually an input prompt scenario unless explicitly allowed
            if action.action_type == RecoveryActionType.PROVIDE_INPUT:
                # If caller explicitly requests idle prompt, bypass yes/no gating
                if context.get('should_send_idle_prompt'):
                    self.logger.debug("Bypassing PROVIDE_INPUT yes/no gating due to should_send_idle_prompt=True")
                else:
                    ev_list = context.get('detection_evidence') or []
                    ev_text = ' '.join(ev_list).lower() if isinstance(ev_list, list) else str(ev_list).lower()
                    # Look for common yes/no indicators
                    yesno_indicators = [
                        '[y/n]', '[yes/no]', 'yes/no', 'do you want to', 'would you like to', 'continue?'
                    ]
                    if not any(tok in ev_text for tok in yesno_indicators):
                        # Not a yes/no prompt - skip PROVIDE_INPUT and try next action (likely RESUME_INPUT/Enter)
                        continue

            return action
            
        return None
        
# ... (rest of the code remains the same)
    def _can_confirm_action(self, action: RecoveryAction, context: Dict[str, Any]) -> bool:
        """
        Check if a destructive action can be confirmed.
        
        Args:
            action: Recovery action to check
            context: Context information
            
        Returns:
            True if action can be confirmed, False otherwise
        """
        # For now, require explicit approval for destructive actions
        if self.config.get('require_confirmation_for_destructive_actions', True):
            return False
            
        return True
        
    def _is_in_cooldown(self, state: ClaudeState) -> bool:
        """
        Check if recovery is in cooldown period for the given state.
        
        Args:
            state: Claude state to check
            
        Returns:
            True if in cooldown, False otherwise
        """
        cooldown_period = self.config.get('cooldown_period', 10.0)
        now = datetime.now()
        
        for execution in reversed(self._execution_history):
            if execution.action.target_state == state:
                if execution.end_time:
                    time_since = (now - execution.end_time).total_seconds()
                    if time_since < cooldown_period:
                        return True
                break
                
        return False
        
    def _execute_action(self, action: RecoveryAction, context: Dict[str, Any]) -> RecoveryExecution:
        """
        Execute a recovery action.
        
        Args:
            action: Recovery action to execute
            context: Context information
            
        Returns:
            RecoveryExecution tracking the execution
        """
        execution = RecoveryExecution(
            action=action,
            start_time=datetime.now(),
        )
        # Attach context so worker methods can access additional data
        try:
            execution.metadata = dict(context) if context else {}
        except Exception:
            execution.metadata = {}
        
        with self._lock:
            self._executing = True
            self._current_execution = execution
            
        # Start execution in separate thread
        self._executor_thread = threading.Thread(
            target=self._execute_action_worker, 
            args=(execution, context),
            daemon=True
        )
        self._executor_thread.start()
        
        return execution
        
    def _execute_action_worker(self, execution: RecoveryExecution, context: Dict[str, Any]):
        """
        Worker thread for action execution.
        
        Args:
            execution: RecoveryExecution to process
            context: Context information
        """
        try:
            # Call start callback
            if self._on_execution_start:
                try:
                    self._on_execution_start(execution)
                except Exception as e:
                    self.logger.error(f"Error in execution start callback: {e}")
                    
            self.logger.info(f"Starting recovery action exec_id={execution.exec_id}: {execution.action.action_type} - {execution.action.description}")
            
            # Execute with retry logic
            result = self._execute_with_retry(execution)
            
            # Update execution result
            execution.result = result
            execution.end_time = datetime.now()
            
            # Update statistics
            self._update_statistics(execution)
            
            # Call completion callback
            if result == RecoveryResult.SUCCESS and self._on_execution_complete:
                try:
                    self._on_execution_complete(execution)
                except Exception as e:
                    self.logger.error(f"Error in execution complete callback: {e}")
            elif result != RecoveryResult.SUCCESS and self._on_execution_failure:
                try:
                    self._on_execution_failure(execution)
                except Exception as e:
                    self.logger.error(f"Error in execution failure callback: {e}")
                    
            self.logger.info(f"Recovery action completed exec_id={execution.exec_id}: {result} in {execution.duration:.2f}s")
            
        except Exception as e:
            execution.result = RecoveryResult.FAILURE
            execution.error_message = str(e)
            execution.end_time = datetime.now()
            self.logger.error(f"Unexpected error during recovery action execution: {e}")
            
        finally:
            with self._lock:
                self._executing = False
                self._current_execution = None
                
                # Add to history
                self._execution_history.append(execution)
                
                # Trim history if needed
                history_limit = self.config.get('execution_history_limit', 100)
                if len(self._execution_history) > history_limit:
                    self._execution_history = self._execution_history[-history_limit:]
                    
    def _execute_with_retry(self, execution: RecoveryExecution) -> RecoveryResult:
        """
        Execute action with retry logic.
        
        Args:
            execution: RecoveryExecution to process
            
        Returns:
            Final execution result
        """
        action = execution.action
        max_retries = action.max_retries
        backoff = 1.0
        
        for attempt in range(max_retries + 1):
            execution.attempts = attempt + 1
            
            try:
                # Execute single attempt
                success = self._execute_single_attempt(action, execution)
                
                if success:
                    return RecoveryResult.SUCCESS
                    
            except TimeoutError:
                execution.error_message = f"Timeout after {action.timeout}s"
                if attempt == max_retries:
                    return RecoveryResult.TIMEOUT
                    
            except Exception as e:
                execution.error_message = str(e)
                if attempt == max_retries:
                    return RecoveryResult.FAILURE
                    
            # Backoff before retry
            if attempt < max_retries:
                retry_delay = backoff * self.config.get('retry_backoff', 2.0)
                self.logger.warning(f"Recovery attempt {attempt + 1} failed, retrying in {retry_delay}s")
                time.sleep(retry_delay)
                backoff *= self.config.get('retry_backoff', 2.0)
                
        return RecoveryResult.FAILURE
        
    def _execute_single_attempt(self, action: RecoveryAction, execution: RecoveryExecution) -> bool:
        """
        Execute a single recovery action attempt.
        
        Args:
            action: Recovery action to execute
            execution: RecoveryExecution for tracking
            
        Returns:
            True if attempt succeeded, False otherwise
        """
        if action.action_type == RecoveryActionType.COMPACT:
            return self._execute_compact_action(action, execution)
        elif action.action_type == RecoveryActionType.PROVIDE_INPUT:
            return self._execute_input_action(action, execution)
        elif action.action_type == RecoveryActionType.RESUME_INPUT:
            return self._execute_input_action(action, execution)
        elif action.action_type == RecoveryActionType.CLEAR_ERROR:
            return self._execute_command_action(action, execution)
        elif action.action_type == RecoveryActionType.RESTART_SESSION:
            return self._execute_restart_action(action, execution)
        elif action.action_type == RecoveryActionType.NOTIFY_USER:
            return self._execute_notification_action(action, execution)
        elif action.action_type == RecoveryActionType.WAIT_AND_RETRY:
            return self._execute_wait_action(action, execution)
        elif action.action_type == RecoveryActionType.FORCE_EXIT:
            return self._execute_exit_action(action, execution)
        else:
            self.logger.error(f"Unknown recovery action type: {action.action_type}")
            return False
            
    def _execute_compact_action(self, action: RecoveryAction, execution: RecoveryExecution) -> bool:
        """Execute /compact command."""
        if not self.tcp_client.is_connected():
            if not self.tcp_client.connect():
                return False
        # Use expect bridge plain command protocol: "send <text>"
        cmd_text = action.command or '/compact'
        # Wait for bridge ACK so we know it accepted the command
        success = self.tcp_client.send_command(
            f"send {cmd_text}", wait_for_response=True, timeout=2.0, context_tag=f"exec:{execution.exec_id}"
        )
        if success:
            execution.output = "Compact command sent successfully"
            time.sleep(2.0)
        return success
        
    def _execute_input_action(self, action: RecoveryAction, execution: RecoveryExecution) -> bool:
        """Execute input providing action."""
        if not self.tcp_client.is_connected():
            if not self.tcp_client.connect():
                return False
                
        # Compose input text. If a custom idle prompt is requested, prefer context-provided text
        # Fallback to action.command or default 'y'
        context_spec = execution.metadata.get('context_spec') if execution.metadata else None
        idle_prompt_text = execution.metadata.get('idle_prompt_text') if execution.metadata else None
        if idle_prompt_text:
            input_text = idle_prompt_text
        else:
            input_text = action.command or (action.data.get('input') if action.data else None) or 'y'

        # Map newline-only command to Enter key
        if input_text == "\n":
            success = self.tcp_client.send_command("enter", wait_for_response=True, timeout=2.0, context_tag=f"exec:{execution.exec_id}")
            if success:
                execution.output = "Enter key sent successfully"
            return success
        else:
            # Use expect bridge plain command protocol: type text then press Enter to submit
            typed = self.tcp_client.send_command(
                f"send {input_text}", wait_for_response=True, timeout=2.0, context_tag=f"exec:{execution.exec_id}"
            )
            if not typed:
                return False
            # Brief pause to ensure text lands before Enter
            time.sleep(0.1)
            submitted = self.tcp_client.send_command("enter", wait_for_response=True, timeout=2.0, context_tag=f"exec:{execution.exec_id}")
            if submitted:
                execution.output = "Input sent and submitted (Enter) successfully"
            return submitted
        
    def _execute_command_action(self, action: RecoveryAction, execution: RecoveryExecution) -> bool:
        """Execute generic command action."""
        if not self.tcp_client.is_connected():
            if not self.tcp_client.connect():
                return False
                
        command = action.command or action.data.get('command', '')
        if not command:
            return False
        
        # Map to expect bridge protocol
        if command == "\n":
            success = self.tcp_client.send_command("enter", wait_for_response=True, timeout=2.0, context_tag=f"exec:{execution.exec_id}")
        else:
            success = self.tcp_client.send_command(
                f"send {command}", wait_for_response=True, timeout=2.0, context_tag=f"exec:{execution.exec_id}"
            )
        
        if success:
            execution.output = f"Command '{command}' sent successfully"
            
        return success
        
    def _execute_restart_action(self, action: RecoveryAction, execution: RecoveryExecution) -> bool:
        """Execute session restart action."""
        if not self.tcp_client.is_connected():
            if not self.tcp_client.connect():
                return False
        # Best-effort: send Ctrl+C to stop current action, then an empty Enter
        ok1 = self.tcp_client.send_command("ctrl-c", wait_for_response=True, timeout=2.0, context_tag=f"exec:{execution.exec_id}")
        time.sleep(0.2)
        ok2 = self.tcp_client.send_command("enter", wait_for_response=True, timeout=2.0, context_tag=f"exec:{execution.exec_id}")
        success = ok1 and ok2
        if success:
            execution.output = "Session restart sequence sent (Ctrl+C, Enter)"
        return success
        
    def _execute_notification_action(self, action: RecoveryAction, execution: RecoveryExecution) -> bool:
        """Execute user notification action."""
        message = action.data.get('message', 'Recovery action executed')
        
        # For now, just log the notification
        # Future enhancement: integrate with actual notification system
        self.logger.info(f"USER NOTIFICATION: {message}")
        execution.output = f"Notification sent: {message}"
        
        return True
        
    def _execute_wait_action(self, action: RecoveryAction, execution: RecoveryExecution) -> bool:
        """Execute wait/delay action."""
        wait_time = action.data.get('wait_time', 5.0)
        self.logger.debug(f"Waiting {wait_time}s as recovery action")
        time.sleep(wait_time)
        execution.output = f"Waited {wait_time}s"
        return True
        
    def _execute_exit_action(self, action: RecoveryAction, execution: RecoveryExecution) -> bool:
        """Execute force exit action."""
        if not self.tcp_client.is_connected():
            if not self.tcp_client.connect():
                return False
        # Send Ctrl+C as a non-destructive force-exit signal
        success = self.tcp_client.send_command("ctrl-c", wait_for_response=True, timeout=2.0, context_tag=f"exec:{execution.exec_id}")
        if success:
            execution.output = "Force exit (Ctrl+C) command sent successfully"
        return success
        
    def _update_statistics(self, execution: RecoveryExecution):
        """Update execution statistics."""
        with self._lock:
            self._stats['total_executions'] += 1
            self._stats['last_execution_time'] = execution.start_time
            
            if execution.duration:
                self._stats['total_execution_time'] += execution.duration
                self._stats['avg_execution_time'] = (
                    self._stats['total_execution_time'] / self._stats['total_executions']
                )
                
            if execution.result == RecoveryResult.SUCCESS:
                self._stats['successful_executions'] += 1
            elif execution.result == RecoveryResult.FAILURE:
                self._stats['failed_executions'] += 1
            elif execution.result == RecoveryResult.TIMEOUT:
                self._stats['timeout_executions'] += 1
            elif execution.result == RecoveryResult.CANCELLED:
                self._stats['cancelled_executions'] += 1
                
    def get_current_execution(self) -> Optional[RecoveryExecution]:
        """
        Get currently executing recovery action.
        
        Returns:
            Current RecoveryExecution or None if not executing
        """
        with self._lock:
            return self._current_execution
            
    def get_execution_history(self, limit: Optional[int] = None) -> List[RecoveryExecution]:
        """
        Get execution history.
        
        Args:
            limit: Maximum number of executions to return
            
        Returns:
            List of RecoveryExecutions
        """
        with self._lock:
            history = self._execution_history.copy()
            if limit:
                history = history[-limit:]
            return history
            
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get recovery engine statistics.
        
        Returns:
            Dictionary with statistics
        """
        with self._lock:
            return self._stats.copy()
            
    def cancel_current_execution(self) -> bool:
        """
        Cancel currently executing recovery action.
        
        Returns:
            True if cancellation successful, False otherwise
        """
        with self._lock:
            if not self._executing or not self._current_execution:
                return False
                
            self._current_execution.result = RecoveryResult.CANCELLED
            self._current_execution.end_time = datetime.now()
            
            # Note: Actual thread cancellation is complex in Python
            # This marks the execution as cancelled but doesn't forcibly stop the thread
            self.logger.warning("Recovery execution marked for cancellation")
            return True
            
    def shutdown(self):
        """Shutdown the recovery engine."""
        self.logger.info("Shutting down recovery engine")
        
        # Disable engine
        self.disable()
        
        # Wait for current execution to complete (with timeout)
        if self._executor_thread and self._executor_thread.is_alive():
            self._executor_thread.join(timeout=5.0)
            
        # Disconnect TCP client
        self.tcp_client.disconnect()
        
        self.logger.info("Recovery engine shutdown complete")


# Global recovery engine instance
_recovery_engine: Optional[RecoveryEngine] = None


def get_recovery_engine() -> RecoveryEngine:
    """
    Get the global recovery engine instance.
    
    Returns:
        RecoveryEngine instance
    """
    global _recovery_engine
    if _recovery_engine is None:
        _recovery_engine = RecoveryEngine()
    return _recovery_engine


def shutdown_recovery_engine():
    """Shutdown the global recovery engine."""
    global _recovery_engine
    if _recovery_engine:
        _recovery_engine.shutdown()
        _recovery_engine = None