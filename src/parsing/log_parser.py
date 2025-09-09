"""
Real-time log parser for Claude Code terminal output monitoring.

This module implements efficient log file monitoring following requirements 1.1 and 1.5:
- Real-time log file monitoring with tail-like functionality
- Line parsing and context extraction for state detection
- Efficient handling of large log files without memory leaks
- Low latency processing with bounded memory usage
- File rotation detection and handling
"""

import os
import time
import threading
from typing import Optional, Dict, Any, List, Callable, Deque
from collections import deque
from pathlib import Path
import re
from datetime import datetime
import mmap
import stat

import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from monitor_logging import get_logger


class LogLine:
    """Represents a parsed log line with metadata."""
    
    def __init__(self, content: str, timestamp: datetime, line_number: int, file_path: str):
        self.content = content.rstrip('\n\r')
        self.timestamp = timestamp
        self.line_number = line_number
        self.file_path = file_path
        self.metadata: Dict[str, Any] = {}
        
    def __str__(self) -> str:
        return f"LogLine({self.line_number}: {self.content[:50]}...)"
        
    def __repr__(self) -> str:
        return self.__str__()


class LogContext:
    """Maintains context for log analysis with bounded memory usage."""
    
    def __init__(self, max_lines: int = 1000):
        self.max_lines = max_lines
        self._lines: Deque[LogLine] = deque(maxlen=max_lines)
        self._lock = threading.Lock()
        
    def add_line(self, line: LogLine):
        """Add a new log line to the context."""
        with self._lock:
            self._lines.append(line)
            
    def get_recent_lines(self, count: Optional[int] = None) -> List[LogLine]:
        """Get recent log lines."""
        with self._lock:
            if count is None:
                return list(self._lines)
            else:
                return list(self._lines)[-count:]
                
    def get_lines_since(self, timestamp: datetime) -> List[LogLine]:
        """Get all lines since a specific timestamp."""
        with self._lock:
            return [line for line in self._lines if line.timestamp >= timestamp]
            
    def get_context_around_line(self, line_number: int, before: int = 5, after: int = 5) -> List[LogLine]:
        """Get context lines around a specific line number."""
        with self._lock:
            result = []
            for line in self._lines:
                if line.line_number >= line_number - before and line.line_number <= line_number + after:
                    result.append(line)
            return result
            
    def search_content(self, pattern: str, use_regex: bool = False) -> List[LogLine]:
        """Search for content in recent lines."""
        with self._lock:
            if use_regex:
                regex = re.compile(pattern, re.IGNORECASE)
                return [line for line in self._lines if regex.search(line.content)]
            else:
                return [line for line in self._lines if pattern.lower() in line.content.lower()]
                
    def clear(self):
        """Clear the context."""
        with self._lock:
            self._lines.clear()
            
    def get_memory_usage(self) -> Dict[str, Any]:
        """Get memory usage statistics."""
        with self._lock:
            total_chars = sum(len(line.content) for line in self._lines)
            return {
                'lines_count': len(self._lines),
                'max_lines': self.max_lines,
                'estimated_bytes': total_chars * 4,  # Rough estimate for Unicode
                'memory_utilization': len(self._lines) / self.max_lines
            }


class LogParser:
    """
    Real-time log parser with file monitoring and context extraction.
    
    Provides efficient monitoring of Claude Code terminal output with
    real-time processing and bounded memory usage.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the log parser.
        
        Args:
            config: Configuration dictionary with parser settings
        """
        self.config = config or self._get_default_config()
        self.logger = get_logger('log_parser')
        
        # File monitoring state
        self._log_file_path: Optional[Path] = None
        self._file_handle: Optional[object] = None
        self._file_stat: Optional[os.stat_result] = None
        self._current_position = 0
        self._current_line_number = 0
        
        # Threading and monitoring
        self._monitor_thread: Optional[threading.Thread] = None
        self._stop_monitoring = threading.Event()
        self._lock = threading.RLock()
        
        # Context and callbacks
        self._context = LogContext(max_lines=self.config.get('max_context_lines', 1000))
        self._line_callbacks: List[Callable[[LogLine], None]] = []
        self._error_callbacks: List[Callable[[Exception], None]] = []
        
        # Statistics
        self._stats = {
            'lines_processed': 0,
            'bytes_processed': 0,
            'file_rotations': 0,
            'errors': 0,
            'start_time': None,
            'last_activity': None,
            'processing_rate': 0.0
        }
        
        # Pattern matching for common Claude Code output
        self._compile_patterns()
        
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default parser configuration."""
        return {
            'poll_interval': 0.1,  # 100ms polling
            'max_context_lines': 1000,
            'file_check_interval': 1.0,  # Check for file changes every second
            'rotation_detection': True,
            'encoding': 'utf-8',
            'buffer_size': 8192,
            'max_line_length': 32768,  # 32KB max line length
            'performance_monitoring': True
        }
        
    def _compile_patterns(self):
        """Compile common patterns for efficient matching."""
        self._patterns = {
            'claude_prompt': re.compile(r'^[>\$#]\s*$'),
            'error_message': re.compile(r'(error|Error|ERROR|exception|Exception)', re.IGNORECASE),
            'warning_message': re.compile(r'(warning|Warning|WARNING|warn)', re.IGNORECASE),
            'context_pressure': re.compile(r'(context|memory|limit|full|usage)', re.IGNORECASE),
            'input_prompt': re.compile(r'(\[Y/n\]|\[y/N\]|Press\s+|Enter\s+)', re.IGNORECASE),
            'command_execution': re.compile(r'^[>\$#]\s+(.+)$'),
            'file_path': re.compile(r'(/[^\s]+\.(py|js|ts|md|json|yaml|yml|txt))'),
            'timestamp': re.compile(r'\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}')
        }
        
    def set_log_file(self, file_path: str) -> bool:
        """
        Set the log file to monitor.
        
        Args:
            file_path: Path to the log file
            
        Returns:
            True if file is accessible, False otherwise
        """
        try:
            path = Path(file_path)
            if not path.exists():
                self.logger.warning(f"Log file does not exist: {file_path}")
                return False
                
            if not path.is_file():
                self.logger.error(f"Path is not a file: {file_path}")
                return False
                
            with self._lock:
                self._log_file_path = path
                self._current_position = 0
                self._current_line_number = 0
                
            self.logger.info(f"Set log file to monitor: {file_path}")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to set log file: {e}")
            return False
            
    def add_line_callback(self, callback: Callable[[LogLine], None]):
        """
        Add a callback for new log lines.
        
        Args:
            callback: Function to call for each new line
        """
        self._line_callbacks.append(callback)
        
    def add_error_callback(self, callback: Callable[[Exception], None]):
        """
        Add a callback for parsing errors.
        
        Args:
            callback: Function to call when errors occur
        """
        self._error_callbacks.append(callback)
        
    def start_monitoring(self) -> bool:
        """
        Start real-time log file monitoring.
        
        Returns:
            True if monitoring started successfully, False otherwise
        """
        with self._lock:
            if self._monitor_thread and self._monitor_thread.is_alive():
                self.logger.warning("Monitoring is already active")
                return False
                
            if not self._log_file_path:
                self.logger.error("No log file set for monitoring")
                return False
                
            self._stop_monitoring.clear()
            self._monitor_thread = threading.Thread(
                target=self._monitoring_worker,
                name="LogParser-Monitor",
                daemon=True
            )
            self._monitor_thread.start()
            
            self._stats['start_time'] = time.time()
            self.logger.info("Started log file monitoring")
            return True
            
    def stop_monitoring(self):
        """Stop log file monitoring."""
        with self._lock:
            self._stop_monitoring.set()
            
            if self._monitor_thread and self._monitor_thread.is_alive():
                self._monitor_thread.join(timeout=5.0)
                if self._monitor_thread.is_alive():
                    self.logger.warning("Monitor thread did not stop cleanly")
                    
            if self._file_handle:
                try:
                    self._file_handle.close()
                except:
                    pass
                self._file_handle = None
                
            self.logger.info("Stopped log file monitoring")
            
    def is_monitoring(self) -> bool:
        """
        Check if monitoring is active.
        
        Returns:
            True if monitoring is active, False otherwise
        """
        with self._lock:
            return (self._monitor_thread is not None and 
                    self._monitor_thread.is_alive() and 
                    not self._stop_monitoring.is_set())
                    
    def _monitoring_worker(self):
        """Main monitoring loop worker."""
        self.logger.debug("Log monitoring worker started")
        last_check_time = time.time()
        
        try:
            while not self._stop_monitoring.is_set():
                current_time = time.time()
                
                # Check for file changes periodically
                file_check_interval = self.config.get('file_check_interval', 1.0)
                if current_time - last_check_time >= file_check_interval:
                    self._check_file_changes()
                    last_check_time = current_time
                    
                # Process new lines
                lines_processed = self._process_new_lines()
                
                if lines_processed > 0:
                    self._stats['last_activity'] = current_time
                    if self.config.get('performance_monitoring', True):
                        self._update_performance_stats()
                        
                # Sleep to avoid excessive CPU usage
                time.sleep(self.config.get('poll_interval', 0.1))
                
        except Exception as e:
            self.logger.error(f"Monitoring worker error: {e}")
            self._handle_error(e)
        finally:
            self.logger.debug("Log monitoring worker stopped")
            
    def _check_file_changes(self):
        """Check for file rotation or recreation."""
        if not self._log_file_path or not self._log_file_path.exists():
            return
            
        try:
            current_stat = self._log_file_path.stat()
            
            # Check if file was rotated (inode changed)
            if self._file_stat and current_stat.st_ino != self._file_stat.st_ino:
                self.logger.info("File rotation detected, reopening file")
                self._handle_file_rotation()
                self._stats['file_rotations'] += 1
                
            # Check if file was truncated
            elif self._file_stat and current_stat.st_size < self._current_position:
                self.logger.info("File truncation detected, resetting position")
                self._current_position = 0
                self._current_line_number = 0
                
            self._file_stat = current_stat
            
        except Exception as e:
            self.logger.error(f"Error checking file changes: {e}")
            
    def _handle_file_rotation(self):
        """Handle file rotation by reopening the file."""
        if self._file_handle:
            try:
                self._file_handle.close()
            except:
                pass
            self._file_handle = None
            
        self._current_position = 0
        self._current_line_number = 0
        
    def _process_new_lines(self) -> int:
        """
        Process new lines from the log file.
        
        Returns:
            Number of lines processed
        """
        if not self._log_file_path:
            return 0
            
        try:
            # Open file if not already open
            if not self._file_handle:
                encoding = self.config.get('encoding', 'utf-8')
                self._file_handle = open(self._log_file_path, 'r', encoding=encoding)
                self._file_handle.seek(self._current_position)
                
            lines_processed = 0
            buffer = ""
            
            while not self._stop_monitoring.is_set():
                # Read data in chunks
                buffer_size = self.config.get('buffer_size', 8192)
                chunk = self._file_handle.read(buffer_size)
                if not chunk:
                    break
                    
                buffer += chunk
                self._current_position = self._file_handle.tell()
                
                # Process complete lines
                while '\n' in buffer:
                    line, buffer = buffer.split('\n', 1)
                    
                    # Check line length limit
                    max_line_length = self.config.get('max_line_length', 32768)
                    if len(line) > max_line_length:
                        line = line[:max_line_length] + "... [truncated]"
                        
                    self._current_line_number += 1
                    log_line = self._create_log_line(line)
                    
                    # Add to context
                    self._context.add_line(log_line)
                    
                    # Call line callbacks
                    self._call_line_callbacks(log_line)
                    
                    lines_processed += 1
                    self._stats['lines_processed'] += 1
                    encoding = self.config.get('encoding', 'utf-8')
                    self._stats['bytes_processed'] += len(line.encode(encoding))
                    
            return lines_processed
            
        except Exception as e:
            self.logger.error(f"Error processing new lines: {e}")
            self._handle_error(e)
            return 0
            
    def _create_log_line(self, content: str) -> LogLine:
        """
        Create a LogLine object with metadata extraction.
        
        Args:
            content: Raw line content
            
        Returns:
            LogLine object
        """
        log_line = LogLine(
            content=content,
            timestamp=datetime.now(),
            line_number=self._current_line_number,
            file_path=str(self._log_file_path)
        )
        
        # Extract metadata using patterns
        for pattern_name, pattern in self._patterns.items():
            if pattern.search(content):
                log_line.metadata[pattern_name] = True
                
        # Extract specific data
        timestamp_match = self._patterns['timestamp'].search(content)
        if timestamp_match:
            try:
                # Try to parse the timestamp
                ts_str = timestamp_match.group(0)
                if 'T' in ts_str:
                    log_line.timestamp = datetime.fromisoformat(ts_str)
                else:
                    log_line.timestamp = datetime.strptime(ts_str, '%Y-%m-%d %H:%M:%S')
            except:
                pass  # Keep the current timestamp if parsing fails
                
        file_match = self._patterns['file_path'].search(content)
        if file_match:
            log_line.metadata['mentioned_file'] = file_match.group(1)
            
        return log_line
        
    def _call_line_callbacks(self, log_line: LogLine):
        """Call all registered line callbacks."""
        for callback in self._line_callbacks:
            try:
                callback(log_line)
            except Exception as e:
                self.logger.error(f"Error in line callback: {e}")
                
    def _handle_error(self, error: Exception):
        """Handle parsing errors."""
        self._stats['errors'] += 1
        for callback in self._error_callbacks:
            try:
                callback(error)
            except Exception as e:
                self.logger.error(f"Error in error callback: {e}")
                
    def _update_performance_stats(self):
        """Update performance statistics."""
        if self._stats['start_time']:
            elapsed = time.time() - self._stats['start_time']
            if elapsed > 0:
                self._stats['processing_rate'] = self._stats['lines_processed'] / elapsed
                
    def get_context(self) -> LogContext:
        """
        Get the current log context.
        
        Returns:
            LogContext object
        """
        return self._context
        
    def get_recent_lines(self, count: int = 50) -> List[LogLine]:
        """
        Get recent log lines.
        
        Args:
            count: Number of recent lines to return
            
        Returns:
            List of recent LogLine objects
        """
        return self._context.get_recent_lines(count)
        
    def search_recent_content(self, pattern: str, use_regex: bool = False, 
                            max_lines: int = 100) -> List[LogLine]:
        """
        Search recent log content for patterns.
        
        Args:
            pattern: Search pattern
            use_regex: Whether to use regex matching
            max_lines: Maximum number of lines to search
            
        Returns:
            List of matching LogLine objects
        """
        recent_lines = self._context.get_recent_lines(max_lines)
        context = LogContext(max_lines)
        for line in recent_lines:
            context.add_line(line)
        return context.search_content(pattern, use_regex)
        
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get parser statistics.
        
        Returns:
            Dictionary with parser statistics
        """
        stats = self._stats.copy()
        stats['context_memory'] = self._context.get_memory_usage()
        stats['is_monitoring'] = self.is_monitoring()
        stats['file_path'] = str(self._log_file_path) if self._log_file_path else None
        return stats
        
    def reset_statistics(self):
        """Reset parser statistics."""
        with self._lock:
            self._stats = {
                'lines_processed': 0,
                'bytes_processed': 0,
                'file_rotations': 0,
                'errors': 0,
                'start_time': time.time() if self.is_monitoring() else None,
                'last_activity': None,
                'processing_rate': 0.0
            }
            
    def __enter__(self):
        """Context manager entry."""
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.stop_monitoring()
        
    def __del__(self):
        """Destructor to ensure clean shutdown."""
        try:
            self.stop_monitoring()
        except:
            pass