"""
State detection engine for Claude Code execution states.

This module implements intelligent state detection following requirements 1.1 and 1.5:
- Pattern-based detection for idle, input-waiting, context-pressure, error states
- Confidence scoring and state prioritization logic
- Fast detection with latency under 1 second
- Accurate state transitions with false positive prevention
"""

import time
import re
from typing import Dict, List, Optional, Tuple, Any
from enum import Enum
from dataclasses import dataclass
from datetime import datetime, timedelta
import threading

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from monitor_logging import get_logger
from parsing.log_parser import LogLine, LogContext


class ClaudeState(Enum):
    """Claude Code execution states."""
    UNKNOWN = "unknown"
    IDLE = "idle"
    INPUT_WAITING = "input-waiting"
    CONTEXT_PRESSURE = "context-pressure"
    ERROR = "error"
    ACTIVE = "active"
    COMPLETED = "completed"


@dataclass
class StateDetection:
    """Represents a state detection result."""
    state: ClaudeState
    confidence: float  # 0.0 to 1.0
    evidence: List[str]  # Supporting evidence
    timestamp: datetime
    triggering_lines: List[LogLine]
    metadata: Dict[str, Any]
    
    def __post_init__(self):
        """Validate detection data."""
        if not 0.0 <= self.confidence <= 1.0:
            raise ValueError(f"Confidence must be between 0.0 and 1.0, got {self.confidence}")
        if not isinstance(self.evidence, list):
            self.evidence = [str(self.evidence)]
        if not isinstance(self.triggering_lines, list):
            self.triggering_lines = []
        if self.metadata is None:
            self.metadata = {}


class StateTransition:
    """Tracks state transitions with timing and confidence."""
    
    def __init__(self, from_state: ClaudeState, to_state: ClaudeState, 
                 detection: StateDetection, duration: Optional[float] = None):
        self.from_state = from_state
        self.to_state = to_state
        self.detection = detection
        self.duration = duration
        self.timestamp = detection.timestamp


class StateDetector:
    """
    Intelligent state detection engine for Claude Code execution states.
    
    Analyzes log context to detect current Claude Code state with confidence scoring
    and proper state transition management.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the state detector.
        
        Args:
            config: Configuration dictionary with detector settings
        """
        self.config = config or self._get_default_config()
        self.logger = get_logger('state_detector')
        
        # State management
        self._current_state = ClaudeState.UNKNOWN
        self._last_detection: Optional[StateDetection] = None
        self._last_state_change = datetime.now()
        self._state_history: List[StateTransition] = []
        self._lock = threading.RLock()
        
        # Pattern compilation for efficient matching
        self._patterns = self._compile_patterns()
        
        # Statistics
        self._stats = {
            'detections': 0,
            'state_changes': 0,
            'false_positives': 0,
            'total_processing_time': 0.0,
            'avg_processing_time': 0.0,
            'state_durations': {},
            'confidence_scores': []
        }
        
        self.logger.info("State detector initialized")
        
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default detector configuration."""
        return {
            'min_confidence': 0.6,  # Minimum confidence for state change
            'idle_timeout': 30.0,  # Seconds of inactivity for idle state
            'input_timeout': 5.0,  # Seconds to wait for input responses
            'context_pressure_threshold': 0.8,  # Threshold for context pressure detection
            'state_history_limit': 100,  # Maximum state transitions to keep
            'debounce_time': 2.0,  # Minimum time between state changes
            'evidence_weight_threshold': 0.5,  # Minimum weighted evidence for detection
            'enable_learning': False,  # Enable adaptive thresholds (future feature)
        }
        
    def _compile_patterns(self) -> Dict[str, Dict[str, Any]]:
        """Compile regex patterns for state detection."""
        return {
            'idle': {
                'patterns': [
                    re.compile(r'^[>\$#]\s*$', re.MULTILINE),  # Command prompt
                    re.compile(r'claude\s*>?\s*$', re.IGNORECASE),  # Claude prompt
                    re.compile(r'ready\s*[>\$#]?\s*$', re.IGNORECASE),  # Ready prompt
                    re.compile(r'waiting\s+for\s+(?:command|input)', re.IGNORECASE),
                ],
                'weight': 1.0,
                'negative_patterns': [
                    re.compile(r'error|exception|failed', re.IGNORECASE),
                    re.compile(r'\[.*%.*\]'),  # Progress indicators
                    re.compile(r'processing|loading|running', re.IGNORECASE),
                ]
            },
            
            'input_waiting': {
                'patterns': [
                    re.compile(r'\[y/n\]|\[Y/N\]|\[yes/no\]', re.IGNORECASE),
                    re.compile(r'press\s+(?:enter|any\s+key|space)', re.IGNORECASE),
                    re.compile(r'continue\s*\?', re.IGNORECASE),
                    re.compile(r'do\s+you\s+want\s+to', re.IGNORECASE),
                    re.compile(r'would\s+you\s+like\s+to', re.IGNORECASE),
                    re.compile(r'choose\s+(?:an?\s+)?option', re.IGNORECASE),
                    re.compile(r'enter\s+(?:your\s+)?(?:choice|selection)', re.IGNORECASE),
                ],
                'weight': 1.2,
                'timeout_indicators': [
                    re.compile(r'waiting\s+for\s+(?:input|response)', re.IGNORECASE),
                    re.compile(r'please\s+(?:enter|select|choose)', re.IGNORECASE),
                ]
            },
            
            'context_pressure': {
                'patterns': [
                    re.compile(r'(?:context|memory|token)\s+(?:limit|full|exceeded)', re.IGNORECASE),
                    re.compile(r'(?:usage|used):\s*(?:8[5-9]|9[0-9]|100)%', re.IGNORECASE),
                    re.compile(r'approaching\s+(?:limit|maximum)', re.IGNORECASE),
                    re.compile(r'consider\s+(?:compacting|reducing)', re.IGNORECASE),
                    re.compile(r'/compact\s+(?:recommended|suggested)', re.IGNORECASE),
                    re.compile(r'running\s+(?:low\s+on\s+)?(?:context|memory)', re.IGNORECASE),
                ],
                'weight': 1.5,  # Higher weight due to importance
                'severity_indicators': [
                    re.compile(r'(?:critical|urgent|immediate)', re.IGNORECASE),
                    re.compile(r'(?:9[5-9]|100)%', re.IGNORECASE),
                ]
            },
            
            'error': {
                'patterns': [
                    re.compile(r'error\s*:|\berror\b', re.IGNORECASE),
                    re.compile(r'exception\s*:|\bexception\b', re.IGNORECASE),
                    re.compile(r'failed\s+to|failure\s*:', re.IGNORECASE),
                    re.compile(r'(?:connection|network)\s+(?:error|failed)', re.IGNORECASE),
                    re.compile(r'timeout|timed\s+out', re.IGNORECASE),
                    re.compile(r'unable\s+to|cannot\s+|can\'t\s+', re.IGNORECASE),
                    re.compile(r'invalid|incorrect|malformed', re.IGNORECASE),
                ],
                'weight': 1.3,
                'severity_patterns': [
                    re.compile(r'(?:fatal|critical|severe)', re.IGNORECASE),
                    re.compile(r'traceback|stack\s+trace', re.IGNORECASE),
                ]
            },
            
            'active': {
                'patterns': [
                    re.compile(r'(?:processing|executing|running)', re.IGNORECASE),
                    re.compile(r'(?:analyzing|parsing|loading)', re.IGNORECASE),
                    re.compile(r'(?:generating|creating|building)', re.IGNORECASE),
                    re.compile(r'\[(?:\d+%|\*+|\.+)\]'),  # Progress indicators
                    re.compile(r'please\s+wait|working', re.IGNORECASE),
                ],
                'weight': 0.8,
                'progress_indicators': [
                    re.compile(r'\d+%|\d+/\d+'),
                    re.compile(r'step\s+\d+|phase\s+\d+', re.IGNORECASE),
                ]
            },
            
            'completed': {
                'patterns': [
                    re.compile(r'(?:completed|finished|done)', re.IGNORECASE),
                    re.compile(r'(?:success|successful)', re.IGNORECASE),
                    re.compile(r'task\s+(?:complete|finished)', re.IGNORECASE),
                    re.compile(r'all\s+(?:tasks|work)\s+(?:complete|done)', re.IGNORECASE),
                    re.compile(r'no\s+(?:pending|remaining)\s+tasks', re.IGNORECASE),
                ],
                'weight': 0.9,
                'confirmation_patterns': [
                    re.compile(r'✓|✅|✔️|[✓✔]', re.UNICODE),
                    re.compile(r'\bOK\b|\bOKAY\b', re.IGNORECASE),
                ]
            }
        }
        
    def detect_state(self, context: LogContext, 
                    recent_lines_count: int = 20) -> StateDetection:
        """
        Detect current Claude Code state from log context.
        
        Args:
            context: LogContext with recent log lines
            recent_lines_count: Number of recent lines to analyze
            
        Returns:
            StateDetection with detected state and confidence
        """
        start_time = time.time()
        
        try:
            with self._lock:
                # Get recent lines for analysis
                recent_lines = context.get_recent_lines(recent_lines_count)
                
                if not recent_lines:
                    detection = StateDetection(
                        state=ClaudeState.UNKNOWN,
                        confidence=0.0,
                        evidence=["No log lines available"],
                        timestamp=datetime.now(),
                        triggering_lines=[],
                        metadata={'reason': 'no_data'}
                    )
                else:
                    detection = self._analyze_lines(recent_lines)
                    
                # Update statistics
                processing_time = time.time() - start_time
                self._update_stats(detection, processing_time)
                
                # Check if state should change
                should_change = self._should_change_state(detection)
                if should_change:
                    self._change_state(detection)
                    
                self._last_detection = detection
                
                return detection
                
        except Exception as e:
            self.logger.error(f"Error in state detection: {e}")
            return StateDetection(
                state=ClaudeState.UNKNOWN,
                confidence=0.0,
                evidence=[f"Detection error: {str(e)}"],
                timestamp=datetime.now(),
                triggering_lines=[],
                metadata={'error': str(e)}
            )
            
    def _analyze_lines(self, lines: List[LogLine]) -> StateDetection:
        """
        Analyze log lines to determine state.
        
        Args:
            lines: List of LogLine objects to analyze
            
        Returns:
            StateDetection result
        """
        # Combine all line content for analysis
        combined_text = '\n'.join(line.content for line in lines)
        recent_text = '\n'.join(line.content for line in lines[-5:])  # Most recent 5 lines
        
        # Score each possible state
        state_scores = {}
        state_evidence = {}
        triggering_lines_map = {}
        
        for state_name, pattern_config in self._patterns.items():
            score, evidence, triggers = self._score_state(
                state_name, combined_text, recent_text, lines, pattern_config
            )
            state_scores[state_name] = score
            state_evidence[state_name] = evidence
            triggering_lines_map[state_name] = triggers
            
        # Apply timeout-based scoring
        self._apply_timeout_scoring(state_scores, lines)
        
        # Find best state
        best_state_name = max(state_scores, key=state_scores.get)
        best_score = state_scores[best_state_name]
        
        # Convert to ClaudeState enum
        state_mapping = {
            'idle': ClaudeState.IDLE,
            'input_waiting': ClaudeState.INPUT_WAITING,
            'context_pressure': ClaudeState.CONTEXT_PRESSURE,
            'error': ClaudeState.ERROR,
            'active': ClaudeState.ACTIVE,
            'completed': ClaudeState.COMPLETED
        }
        best_state = state_mapping.get(best_state_name, ClaudeState.UNKNOWN)
        
        # Check minimum confidence threshold
        min_confidence = self.config.get('min_confidence', 0.6)
        if best_score < min_confidence:
            if self._current_state != ClaudeState.UNKNOWN:
                # If current confidence is low but we have a previous state, 
                # stay in current state with lower confidence
                best_state = self._current_state
                best_score = max(best_score, 0.3)  # Minimum confidence for state retention
            else:
                best_state = ClaudeState.UNKNOWN
                
        return StateDetection(
            state=best_state,
            confidence=min(best_score, 1.0),
            evidence=state_evidence[best_state_name],
            timestamp=datetime.now(),
            triggering_lines=triggering_lines_map[best_state_name],
            metadata={
                'all_scores': state_scores,
                'analysis_method': 'pattern_matching',
                'lines_analyzed': len(lines)
            }
        )
        
    def _score_state(self, state_name: str, combined_text: str, recent_text: str,
                    lines: List[LogLine], pattern_config: Dict[str, Any]) -> Tuple[float, List[str], List[LogLine]]:
        """
        Score a specific state based on pattern matching.
        
        Args:
            state_name: Name of the state to score
            combined_text: All log text combined
            recent_text: Most recent log text
            lines: List of LogLine objects
            pattern_config: Pattern configuration for this state
            
        Returns:
            Tuple of (score, evidence_list, triggering_lines)
        """
        score = 0.0
        evidence = []
        triggering_lines = []
        base_weight = pattern_config.get('weight', 1.0)
        
        # Check main patterns
        patterns = pattern_config.get('patterns', [])
        for pattern in patterns:
            matches = pattern.findall(recent_text)
            if matches:
                match_score = len(matches) * 0.3 * base_weight
                score += match_score
                evidence.append(f"Pattern match: {pattern.pattern}")
                
                # Find triggering lines
                for line in lines[-10:]:  # Check recent lines
                    if pattern.search(line.content):
                        triggering_lines.append(line)
                        
        # Check for negative patterns (reduce score)
        negative_patterns = pattern_config.get('negative_patterns', [])
        for pattern in negative_patterns:
            if pattern.search(recent_text):
                score -= 0.2 * base_weight
                evidence.append(f"Negative pattern: {pattern.pattern}")
                
        # Special scoring for specific states
        if state_name == 'context_pressure':
            score += self._score_context_pressure(combined_text, pattern_config, evidence)
        elif state_name == 'input_waiting':
            score += self._score_input_waiting(recent_text, pattern_config, evidence)
        elif state_name == 'error':
            score += self._score_error_state(combined_text, pattern_config, evidence)
        elif state_name == 'idle':
            score += self._score_idle_state(lines, evidence)
            
        return max(score, 0.0), evidence, triggering_lines
        
    def _score_context_pressure(self, text: str, config: Dict[str, Any], 
                               evidence: List[str]) -> float:
        """Score context pressure state with special logic."""
        score = 0.0
        
        # Look for percentage indicators
        percent_pattern = re.compile(r'(\d+)%')
        percentages = [int(m) for m in percent_pattern.findall(text)]
        
        if percentages:
            max_percent = max(percentages)
            if max_percent >= 90:
                score += 0.6
                evidence.append(f"High usage: {max_percent}%")
            elif max_percent >= 80:
                score += 0.4
                evidence.append(f"Medium usage: {max_percent}%")
                
        # Check severity indicators
        severity_patterns = config.get('severity_indicators', [])
        for pattern in severity_patterns:
            if pattern.search(text):
                score += 0.3
                evidence.append(f"Severity indicator: {pattern.pattern}")
                
        return score
        
    def _score_input_waiting(self, text: str, config: Dict[str, Any], 
                           evidence: List[str]) -> float:
        """Score input waiting state with timeout consideration."""
        score = 0.0
        
        # Check for timeout indicators
        timeout_patterns = config.get('timeout_indicators', [])
        for pattern in timeout_patterns:
            if pattern.search(text):
                score += 0.2
                evidence.append(f"Timeout indicator: {pattern.pattern}")
                
        # Higher score if question patterns are recent
        question_pattern = re.compile(r'\?[^\w]*$', re.MULTILINE)
        if question_pattern.search(text):
            score += 0.3
            evidence.append("Recent question mark")
            
        return score
        
    def _score_error_state(self, text: str, config: Dict[str, Any], 
                         evidence: List[str]) -> float:
        """Score error state with severity weighting."""
        score = 0.0
        
        # Check severity patterns
        severity_patterns = config.get('severity_patterns', [])
        for pattern in severity_patterns:
            if pattern.search(text):
                score += 0.4
                evidence.append(f"Severe error: {pattern.pattern}")
                
        # Count error keywords
        error_count = len(re.findall(r'\b(?:error|exception|failed)\b', text, re.IGNORECASE))
        if error_count > 1:
            score += min(error_count * 0.1, 0.3)
            evidence.append(f"Multiple error indicators: {error_count}")
            
        return score
        
    def _score_idle_state(self, lines: List[LogLine], evidence: List[str]) -> float:
        """Score idle state based on time since last activity."""
        if not lines:
            return 0.0
            
        # Check time since last activity
        last_line = lines[-1]
        time_since_last = (datetime.now() - last_line.timestamp).total_seconds()
        
        idle_timeout = self.config.get('idle_timeout', 30.0)
        
        if time_since_last >= idle_timeout:
            score = min(time_since_last / idle_timeout, 1.0) * 0.5
            evidence.append(f"Idle for {time_since_last:.1f}s")
            return score
            
        return 0.0
        
    def _apply_timeout_scoring(self, state_scores: Dict[str, float], 
                             lines: List[LogLine]):
        """Apply timeout-based adjustments to state scores."""
        if not lines:
            return
            
        last_line = lines[-1]
        time_since_last = (datetime.now() - last_line.timestamp).total_seconds()
        
        # Adjust idle score based on inactivity
        idle_timeout = self.config.get('idle_timeout', 30.0)
        if time_since_last > idle_timeout:
            state_scores['idle'] += 0.3
            
        # Reduce active score for old activity
        if time_since_last > 5.0:  # 5 seconds
            state_scores['active'] *= 0.5
            
        # Input waiting timeout
        input_timeout = self.config.get('input_timeout', 5.0)
        if (self._current_state == ClaudeState.INPUT_WAITING and 
            time_since_last > input_timeout):
            state_scores['input_waiting'] *= 0.7  # Reduce confidence over time
            
    def _should_change_state(self, detection: StateDetection) -> bool:
        """
        Determine if state should change based on detection and current state.
        
        Args:
            detection: New state detection
            
        Returns:
            True if state should change, False otherwise
        """
        # Always change if we're in unknown state
        min_confidence = self.config.get('min_confidence', 0.6)
        if self._current_state == ClaudeState.UNKNOWN:
            return detection.confidence >= min_confidence
            
        # Don't change if confidence is too low
        if detection.confidence < min_confidence:
            return False
            
        # Don't change if it's the same state
        if detection.state == self._current_state:
            return False
            
        # Apply debounce time
        time_since_change = (datetime.now() - self._last_state_change).total_seconds()
        debounce_time = self.config.get('debounce_time', 2.0)
        if time_since_change < debounce_time:
            return False
            
        # State priority logic as per requirements:
        # context-pressure > input-waiting > error > idle
        priority_map = {
            ClaudeState.CONTEXT_PRESSURE: 4,
            ClaudeState.INPUT_WAITING: 3,
            ClaudeState.ERROR: 2,
            ClaudeState.IDLE: 1,
            ClaudeState.ACTIVE: 1,
            ClaudeState.COMPLETED: 1,
            ClaudeState.UNKNOWN: 0
        }
        
        current_priority = priority_map.get(self._current_state, 0)
        new_priority = priority_map.get(detection.state, 0)
        
        # Allow change if new state has higher priority or sufficient confidence
        if new_priority > current_priority:
            return detection.confidence >= 0.5  # Lower threshold for higher priority
        elif new_priority == current_priority:
            return detection.confidence >= 0.7  # Higher threshold for same priority
        else:
            return detection.confidence >= 0.8  # Very high threshold for lower priority
            
    def _change_state(self, detection: StateDetection):
        """
        Change the current state and record the transition.
        
        Args:
            detection: New state detection
        """
        old_state = self._current_state
        new_state = detection.state
        
        # Calculate duration in previous state
        duration = (datetime.now() - self._last_state_change).total_seconds()
        
        # Create transition record
        transition = StateTransition(
            from_state=old_state,
            to_state=new_state,
            detection=detection,
            duration=duration
        )
        
        # Update state
        self._current_state = new_state
        self._last_state_change = datetime.now()
        
        # Record transition
        self._state_history.append(transition)
        state_history_limit = self.config.get('state_history_limit', 100)
        if len(self._state_history) > state_history_limit:
            self._state_history.pop(0)
            
        # Update statistics
        self._stats['state_changes'] += 1
        if old_state.value in self._stats['state_durations']:
            self._stats['state_durations'][old_state.value].append(duration)
        else:
            self._stats['state_durations'][old_state.value] = [duration]
            
        self.logger.info(
            f"State change: {old_state.value} -> {new_state.value} "
            f"(confidence: {detection.confidence:.2f}, duration: {duration:.1f}s)"
        )
        
    def _update_stats(self, detection: StateDetection, processing_time: float):
        """Update detection statistics."""
        self._stats['detections'] += 1
        self._stats['total_processing_time'] += processing_time
        self._stats['avg_processing_time'] = (
            self._stats['total_processing_time'] / self._stats['detections']
        )
        self._stats['confidence_scores'].append(detection.confidence)
        
        # Keep only recent confidence scores
        if len(self._stats['confidence_scores']) > 100:
            self._stats['confidence_scores'] = self._stats['confidence_scores'][-100:]
            
    def get_current_state(self) -> ClaudeState:
        """
        Get the current detected state.
        
        Returns:
            Current ClaudeState
        """
        with self._lock:
            return self._current_state
            
    def get_last_detection(self) -> Optional[StateDetection]:
        """
        Get the last state detection result.
        
        Returns:
            Last StateDetection or None if no detection performed
        """
        with self._lock:
            return self._last_detection
            
    def get_state_history(self, limit: Optional[int] = None) -> List[StateTransition]:
        """
        Get state transition history.
        
        Args:
            limit: Maximum number of transitions to return
            
        Returns:
            List of StateTransition objects
        """
        with self._lock:
            history = self._state_history.copy()
            if limit:
                history = history[-limit:]
            return history
            
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get detection statistics.
        
        Returns:
            Dictionary with detection statistics
        """
        with self._lock:
            stats = self._stats.copy()
            stats['current_state'] = self._current_state.value
            stats['time_in_current_state'] = (
                datetime.now() - self._last_state_change
            ).total_seconds()
            stats['total_transitions'] = len(self._state_history)
            
            # Calculate average confidence
            if self._stats['confidence_scores']:
                stats['avg_confidence'] = sum(self._stats['confidence_scores']) / len(self._stats['confidence_scores'])
            else:
                stats['avg_confidence'] = 0.0
                
            return stats
            
    def reset_statistics(self):
        """Reset detection statistics."""
        with self._lock:
            self._stats = {
                'detections': 0,
                'state_changes': 0,
                'false_positives': 0,
                'total_processing_time': 0.0,
                'avg_processing_time': 0.0,
                'state_durations': {},
                'confidence_scores': []
            }
            
    def reset_state(self):
        """Reset to unknown state."""
        with self._lock:
            self._current_state = ClaudeState.UNKNOWN
            self._last_detection = None
            self._last_state_change = datetime.now()
            
    def set_configuration(self, new_config: Dict[str, Any]):
        """
        Update detector configuration.
        
        Args:
            new_config: New configuration values
        """
        with self._lock:
            self.config.update(new_config)
            self.logger.info("State detector configuration updated")