"""
Centralized pattern definitions for Claude Code state detection.

This module provides comprehensive regex patterns following requirement 1.1:
- Define patterns for detecting different Claude Code states
- Pattern testing and validation functions
- Performance optimization through pattern compilation
- Thorough testing to prevent conflicts
"""

import re
from typing import Dict, List, Tuple, Any, Optional, Set
from dataclasses import dataclass
from enum import Enum
import time

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from monitor_logging import get_logger


class PatternCategory(Enum):
    """Pattern categories for organization."""
    IDLE = "idle"
    INPUT_WAITING = "input_waiting"
    CONTEXT_PRESSURE = "context_pressure"
    ERROR = "error"
    ACTIVE = "active"
    COMPLETED = "completed"
    NEGATIVE = "negative"  # Patterns that contradict other states


@dataclass
class PatternDefinition:
    """Defines a single pattern with metadata."""
    name: str
    pattern: str
    category: PatternCategory
    weight: float = 1.0
    description: str = ""
    examples: List[str] = None
    counter_examples: List[str] = None
    flags: int = 0
    priority: int = 0  # Higher priority patterns are checked first
    
    def __post_init__(self):
        if self.examples is None:
            self.examples = []
        if self.counter_examples is None:
            self.counter_examples = []


class PatternCompiler:
    """Compiles and manages regex patterns for efficient matching."""
    
    def __init__(self):
        self.logger = get_logger('pattern_compiler')
        self._compiled_patterns: Dict[str, re.Pattern] = {}
        self._pattern_stats: Dict[str, Dict[str, Any]] = {}
        
    def compile_pattern(self, definition: PatternDefinition) -> re.Pattern:
        """
        Compile a pattern definition into a regex pattern.
        
        Args:
            definition: Pattern definition to compile
            
        Returns:
            Compiled regex pattern
        """
        try:
            # Add pattern flags
            flags = definition.flags
            if not flags:
                flags = re.IGNORECASE | re.MULTILINE
                
            pattern = re.compile(definition.pattern, flags)
            
            # Store compiled pattern
            self._compiled_patterns[definition.name] = pattern
            
            # Initialize stats
            self._pattern_stats[definition.name] = {
                'matches': 0,
                'total_time': 0.0,
                'avg_time': 0.0,
                'last_match': None
            }
            
            self.logger.debug(f"Compiled pattern: {definition.name}")
            return pattern
            
        except re.error as e:
            self.logger.error(f"Failed to compile pattern {definition.name}: {e}")
            raise ValueError(f"Invalid regex pattern '{definition.pattern}': {e}")
            
    def get_pattern(self, name: str) -> Optional[re.Pattern]:
        """
        Get a compiled pattern by name.
        
        Args:
            name: Pattern name
            
        Returns:
            Compiled pattern or None if not found
        """
        return self._compiled_patterns.get(name)
        
    def match_pattern(self, name: str, text: str) -> Optional[re.Match]:
        """
        Match text against a named pattern with performance tracking.
        
        Args:
            name: Pattern name
            text: Text to match against
            
        Returns:
            Match object or None
        """
        pattern = self._compiled_patterns.get(name)
        if not pattern:
            return None
            
        start_time = time.perf_counter()
        try:
            match = pattern.search(text)
            if match:
                self._pattern_stats[name]['matches'] += 1
                self._pattern_stats[name]['last_match'] = text[:100]
            return match
        finally:
            elapsed = time.perf_counter() - start_time
            stats = self._pattern_stats[name]
            stats['total_time'] += elapsed
            stats['avg_time'] = stats['total_time'] / max(1, stats['matches'])
            
    def get_statistics(self) -> Dict[str, Dict[str, Any]]:
        """
        Get pattern matching statistics.
        
        Returns:
            Dictionary with pattern statistics
        """
        return self._pattern_stats.copy()


class ClaudeCodePatterns:
    """
    Comprehensive pattern definitions for Claude Code state detection.
    
    Contains all patterns needed to detect various Claude Code execution states
    with optimized performance and thorough testing.
    """
    
    def __init__(self):
        self.logger = get_logger('claude_patterns')
        self.compiler = PatternCompiler()
        self._patterns: Dict[str, PatternDefinition] = {}
        self._category_patterns: Dict[PatternCategory, List[str]] = {}
        
        # Initialize patterns
        self._define_patterns()
        self._compile_all_patterns()
        
    def _define_patterns(self):
        """Define all regex patterns for state detection."""
        
        # IDLE STATE PATTERNS
        self._add_pattern(PatternDefinition(
            name="claude_prompt",
            pattern=r'^[>\$#]\s*$',
            category=PatternCategory.IDLE,
            weight=1.2,
            description="Command prompt indicating ready state",
            examples=[">", "$ ", "# ", "> "],
            counter_examples=[">help", "$ ls", "# comment"],
            flags=re.MULTILINE,
            priority=9
        ))
        
        self._add_pattern(PatternDefinition(
            name="claude_ready",
            pattern=r'(?:claude|assistant)[\s>]*(?:ready|waiting)(?:\s+for\s+(?:command|input))?[>\s]*$',
            category=PatternCategory.IDLE,
            weight=1.0,
            description="Claude ready for commands",
            examples=[
                "claude ready",
                "Assistant ready for command",
                "claude > ready",
                "waiting for command"
            ],
            counter_examples=[
                "claude is not ready",
                "ready to process error"
            ],
            priority=8
        ))
        
        self._add_pattern(PatternDefinition(
            name="command_completion",
            pattern=r'(?:command\s+)?(?:completed?|finished|done)(?:\s+successfully)?\s*[>\$#]?\s*$',
            category=PatternCategory.IDLE,
            weight=0.8,
            description="Command completion followed by prompt",
            examples=[
                "Command completed >",
                "finished successfully",
                "done $"
            ],
            priority=7
        ))
        
        # INPUT WAITING PATTERNS
        self._add_pattern(PatternDefinition(
            name="yes_no_prompt",
            pattern=r'\[(?:y/n|Y/N|yes/no|YES/NO)\]',
            category=PatternCategory.INPUT_WAITING,
            weight=1.5,
            description="Yes/No confirmation prompts",
            examples=[
                "Continue? [y/n]",
                "Save changes? [Y/N]",
                "Proceed with operation? [yes/no]"
            ],
            counter_examples=[
                "Result: [yes] or [no]",
                "Options: y/n format"
            ],
            priority=10
        ))
        
        self._add_pattern(PatternDefinition(
            name="press_key_prompt",
            pattern=r'press\s+(?:(?:any\s+)?key|enter|space|return)(?:\s+to\s+\w+)?',
            category=PatternCategory.INPUT_WAITING,
            weight=1.3,
            description="Key press prompts",
            examples=[
                "Press any key to continue",
                "Press ENTER to proceed",
                "Press space to expand"
            ],
            counter_examples=[
                "Don't press any keys",
                "Previously pressed enter"
            ],
            priority=9
        ))
        
        self._add_pattern(PatternDefinition(
            name="choice_prompt",
            pattern=r'(?:choose|select|pick)\s+(?:an?\s+)?(?:option|choice|number)',
            category=PatternCategory.INPUT_WAITING,
            weight=1.2,
            description="Choice selection prompts",
            examples=[
                "Choose an option:",
                "Select a choice from below",
                "Pick a number (1-5)"
            ],
            priority=8
        ))
        
        self._add_pattern(PatternDefinition(
            name="enter_input_prompt",
            pattern=r'(?:enter|provide|type)\s+(?:your\s+)?(?:input|response|answer|choice)',
            category=PatternCategory.INPUT_WAITING,
            weight=1.1,
            description="Input entry prompts",
            examples=[
                "Enter your input:",
                "Provide your response",
                "Type your answer"
            ],
            priority=7
        ))
        
        # CONTEXT PRESSURE PATTERNS
        self._add_pattern(PatternDefinition(
            name="context_percentage",
            pattern=r'(?:context|memory|token)\s*(?:usage|used?)[\s:]*(?:(?:is\s+)?(?:at\s+)?)?(\d+)%',
            category=PatternCategory.CONTEXT_PRESSURE,
            weight=1.8,
            description="Context usage percentage indicators",
            examples=[
                "Context usage: 85%",
                "Memory used at 90%",
                "Token usage is 95%"
            ],
            counter_examples=[
                "85% complete",
                "Memory 50% available"
            ],
            priority=10
        ))
        
        self._add_pattern(PatternDefinition(
            name="context_limit_warning",
            pattern=r'(?:context|memory|token)\s+(?:limit|maximum|capacity)\s+(?:reached|exceeded|approaching|near)',
            category=PatternCategory.CONTEXT_PRESSURE,
            weight=1.6,
            description="Context limit warnings",
            examples=[
                "Context limit approaching",
                "Memory capacity reached",
                "Token maximum exceeded"
            ],
            priority=9
        ))
        
        self._add_pattern(PatternDefinition(
            name="compact_suggestion",
            pattern=r'(?:consider|try|run|execute)?\s*/?compact(?:\s+(?:recommended|suggested|advised))?',
            category=PatternCategory.CONTEXT_PRESSURE,
            weight=1.4,
            description="Compact command suggestions",
            examples=[
                "Consider /compact",
                "Try running /compact",
                "/compact recommended"
            ],
            counter_examples=[
                "Compact file format",
                "More compact solution"
            ],
            priority=8
        ))
        
        self._add_pattern(PatternDefinition(
            name="context_full",
            pattern=r'(?:context|memory)\s+(?:(?:is\s+)?(?:nearly\s+)?full|running\s+(?:low|out))',
            category=PatternCategory.CONTEXT_PRESSURE,
            weight=1.5,
            description="Context full indicators",
            examples=[
                "Context is nearly full",
                "Memory running low",
                "Context full"
            ],
            priority=7
        ))
        
        # ERROR PATTERNS
        self._add_pattern(PatternDefinition(
            name="error_prefix",
            pattern=r'\b(?:error|ERROR)[\s:]+',
            category=PatternCategory.ERROR,
            weight=1.4,
            description="Error message prefixes",
            examples=[
                "Error: Connection failed",
                "ERROR: Invalid input",
                "Error - File not found"
            ],
            counter_examples=[
                "No error occurred",
                "Error-free operation"
            ],
            priority=9
        ))
        
        self._add_pattern(PatternDefinition(
            name="exception_pattern",
            pattern=r'\b(?:exception|Exception|EXCEPTION)(?:\s+(?:occurred|raised|thrown))?[\s:]*',
            category=PatternCategory.ERROR,
            weight=1.3,
            description="Exception indicators",
            examples=[
                "Exception occurred",
                "Exception: ValueError",
                "Unhandled exception"
            ],
            priority=8
        ))
        
        self._add_pattern(PatternDefinition(
            name="failure_pattern",
            pattern=r'(?:failed\s+to|failure|unable\s+to|cannot|can\'t)\s+\w+',
            category=PatternCategory.ERROR,
            weight=1.2,
            description="Failure and inability indicators",
            examples=[
                "Failed to connect",
                "Unable to process",
                "Cannot access file"
            ],
            counter_examples=[
                "Will not fail",
                "Success, not failure"
            ],
            priority=7
        ))
        
        self._add_pattern(PatternDefinition(
            name="timeout_pattern",
            pattern=r'(?:timeout|timed?\s+out|time\s+limit\s+exceeded)',
            category=PatternCategory.ERROR,
            weight=1.1,
            description="Timeout error indicators",
            examples=[
                "Connection timeout",
                "Request timed out",
                "Time limit exceeded"
            ],
            priority=6
        ))
        
        # ACTIVE STATE PATTERNS
        self._add_pattern(PatternDefinition(
            name="processing_indicator",
            pattern=r'(?:processing|analyzing|parsing|executing|running|working)',
            category=PatternCategory.ACTIVE,
            weight=1.0,
            description="Active processing indicators",
            examples=[
                "Processing your request",
                "Analyzing data",
                "Executing command"
            ],
            counter_examples=[
                "Processing complete",
                "Finished processing"
            ],
            priority=6
        ))
        
        self._add_pattern(PatternDefinition(
            name="progress_indicator",
            pattern=r'(?:\[[\d%\*\.]+\]|\d+%|\d+/\d+|\.{3,})',
            category=PatternCategory.ACTIVE,
            weight=0.9,
            description="Progress indicators",
            examples=[
                "[45%]",
                "[***]",
                "15/100",
                "Loading..."
            ],
            counter_examples=[
                "[INFO]",
                "[ERROR]"
            ],
            priority=5
        ))
        
        self._add_pattern(PatternDefinition(
            name="please_wait",
            pattern=r'(?:please\s+)?(?:wait|hold\s+on|standby)',
            category=PatternCategory.ACTIVE,
            weight=0.8,
            description="Wait request indicators",
            examples=[
                "Please wait",
                "Hold on",
                "Standby for results"
            ],
            priority=4
        ))
        
        # COMPLETED STATE PATTERNS
        self._add_pattern(PatternDefinition(
            name="task_completed",
            pattern=r'(?:task|work|job|operation)s?\s+(?:completed?|finished|done)(?:\s+successfully)?',
            category=PatternCategory.COMPLETED,
            weight=1.2,
            description="Task completion indicators",
            examples=[
                "Task completed successfully",
                "All work finished",
                "Operation done"
            ],
            counter_examples=[
                "Task not completed",
                "Work in progress"
            ],
            priority=8
        ))
        
        self._add_pattern(PatternDefinition(
            name="success_indicator",
            pattern=r'(?:success|successful|succeeded)(?:\s*[✓✅✔️])?',
            category=PatternCategory.COMPLETED,
            weight=1.1,
            description="Success indicators",
            examples=[
                "Operation successful ✓",
                "Command succeeded",
                "Success!"
            ],
            counter_examples=[
                "Not successful",
                "Success is unlikely"
            ],
            priority=7
        ))
        
        self._add_pattern(PatternDefinition(
            name="checkmark_indicator",
            pattern=r'[✓✅✔️]',
            category=PatternCategory.COMPLETED,
            weight=0.8,
            description="Visual success checkmarks",
            examples=["✓", "✅", "✔️"],
            priority=6
        ))
        
        self._add_pattern(PatternDefinition(
            name="no_pending_tasks",
            pattern=r'no\s+(?:pending|remaining|outstanding)\s+(?:tasks?|work|jobs?)',
            category=PatternCategory.COMPLETED,
            weight=1.0,
            description="No remaining work indicators",
            examples=[
                "No pending tasks",
                "No remaining work",
                "No outstanding jobs"
            ],
            priority=5
        ))
        
        # NEGATIVE PATTERNS (patterns that contradict other states)
        self._add_pattern(PatternDefinition(
            name="not_ready",
            pattern=r'(?:not\s+ready|busy|unavailable|occupied)',
            category=PatternCategory.NEGATIVE,
            weight=-0.5,
            description="Patterns that contradict idle state",
            examples=[
                "System not ready",
                "Claude is busy",
                "Service unavailable"
            ],
            priority=3
        ))
        
        self._add_pattern(PatternDefinition(
            name="continuing",
            pattern=r'(?:continuing|proceeding|ongoing|in\s+progress)',
            category=PatternCategory.NEGATIVE,
            weight=-0.3,
            description="Patterns that contradict completed state",
            examples=[
                "Continuing process",
                "Work in progress",
                "Operation ongoing"
            ],
            priority=2
        ))
        
    def _add_pattern(self, definition: PatternDefinition):
        """Add a pattern definition to the collection."""
        self._patterns[definition.name] = definition
        
        # Organize by category
        if definition.category not in self._category_patterns:
            self._category_patterns[definition.category] = []
        self._category_patterns[definition.category].append(definition.name)
        
    def _compile_all_patterns(self):
        """Compile all defined patterns."""
        self.logger.info(f"Compiling {len(self._patterns)} patterns")
        
        for name, definition in self._patterns.items():
            try:
                self.compiler.compile_pattern(definition)
            except ValueError as e:
                self.logger.error(f"Failed to compile pattern {name}: {e}")
                
        self.logger.info("Pattern compilation completed")
        
    def get_patterns_by_category(self, category: PatternCategory) -> Dict[str, PatternDefinition]:
        """
        Get all patterns for a specific category.
        
        Args:
            category: Pattern category
            
        Returns:
            Dictionary of pattern name -> definition
        """
        pattern_names = self._category_patterns.get(category, [])
        return {name: self._patterns[name] for name in pattern_names if name in self._patterns}
        
    def get_pattern_definition(self, name: str) -> Optional[PatternDefinition]:
        """
        Get pattern definition by name.
        
        Args:
            name: Pattern name
            
        Returns:
            Pattern definition or None
        """
        return self._patterns.get(name)
        
    def test_pattern(self, pattern_name: str, text: str) -> Tuple[bool, Optional[str]]:
        """
        Test a pattern against text.
        
        Args:
            pattern_name: Name of pattern to test
            text: Text to test against
            
        Returns:
            Tuple of (matches, matched_text)
        """
        match = self.compiler.match_pattern(pattern_name, text)
        if match:
            return True, match.group(0)
        return False, None
        
    def validate_patterns(self) -> Dict[str, List[str]]:
        """
        Validate all patterns against their examples and counter-examples.
        
        Returns:
            Dictionary of validation results with any failures
        """
        validation_results = {}
        
        for name, definition in self._patterns.items():
            failures = []
            
            # Test positive examples (should match)
            for example in definition.examples:
                matches, _ = self.test_pattern(name, example)
                if not matches:
                    failures.append(f"Example should match but doesn't: '{example}'")
                    
            # Test negative examples (should not match)
            for counter_example in definition.counter_examples:
                matches, matched = self.test_pattern(name, counter_example)
                if matches:
                    failures.append(f"Counter-example matches but shouldn't: '{counter_example}' -> '{matched}'")
                    
            if failures:
                validation_results[name] = failures
                
        return validation_results
        
    def get_compiled_patterns(self) -> Dict[str, re.Pattern]:
        """
        Get all compiled patterns.
        
        Returns:
            Dictionary of pattern name -> compiled regex
        """
        return self.compiler._compiled_patterns.copy()
        
    def get_pattern_statistics(self) -> Dict[str, Dict[str, Any]]:
        """
        Get pattern matching statistics.
        
        Returns:
            Pattern performance statistics
        """
        return self.compiler.get_statistics()
        
    def find_conflicting_patterns(self, test_strings: List[str]) -> Dict[str, List[str]]:
        """
        Find patterns that might conflict with each other.
        
        Args:
            test_strings: List of test strings to check for conflicts
            
        Returns:
            Dictionary of conflicts found
        """
        conflicts = {}
        
        for test_string in test_strings:
            matching_patterns = []
            
            for name in self._patterns:
                matches, _ = self.test_pattern(name, test_string)
                if matches:
                    matching_patterns.append(name)
                    
            # If multiple patterns match the same string, it might be a conflict
            if len(matching_patterns) > 1:
                conflicts[test_string] = matching_patterns
                
        return conflicts


# Global pattern instance
_claude_patterns: Optional[ClaudeCodePatterns] = None


def get_claude_patterns() -> ClaudeCodePatterns:
    """
    Get the global Claude Code patterns instance.
    
    Returns:
        ClaudeCodePatterns instance
    """
    global _claude_patterns
    if _claude_patterns is None:
        _claude_patterns = ClaudeCodePatterns()
    return _claude_patterns


def validate_all_patterns() -> bool:
    """
    Validate all patterns and return success status.
    
    Returns:
        True if all patterns validate successfully, False otherwise
    """
    patterns = get_claude_patterns()
    failures = patterns.validate_patterns()
    
    if failures:
        logger = get_logger('pattern_validator')
        for pattern_name, pattern_failures in failures.items():
            logger.error(f"Pattern {pattern_name} validation failures:")
            for failure in pattern_failures:
                logger.error(f"  - {failure}")
        return False
        
    return True


def get_pattern_performance_report() -> Dict[str, Any]:
    """
    Get a comprehensive performance report for all patterns.
    
    Returns:
        Performance report dictionary
    """
    patterns = get_claude_patterns()
    stats = patterns.get_pattern_statistics()
    
    total_matches = sum(s.get('matches', 0) for s in stats.values())
    total_time = sum(s.get('total_time', 0) for s in stats.values())
    
    # Find slowest patterns
    slowest_patterns = sorted(
        [(name, s.get('avg_time', 0)) for name, s in stats.items()],
        key=lambda x: x[1],
        reverse=True
    )[:5]
    
    # Find most active patterns
    most_active = sorted(
        [(name, s.get('matches', 0)) for name, s in stats.items()],
        key=lambda x: x[1],
        reverse=True
    )[:5]
    
    return {
        'total_patterns': len(stats),
        'total_matches': total_matches,
        'total_time': total_time,
        'avg_time_per_match': total_time / max(total_matches, 1),
        'slowest_patterns': slowest_patterns,
        'most_active_patterns': most_active
    }