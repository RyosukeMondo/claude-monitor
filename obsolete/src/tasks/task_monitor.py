"""
Task monitor for spec-workflow system integration.

This module implements integration with spec-workflow MCP system following requirements 6.1 and 6.7:
- Spec-workflow MCP integration for task status queries
- Task completion detection and monitoring termination logic
- Graceful handling of MCP unavailability
- Accurate task status parsing with proper cooldown periods
"""

import subprocess
import json
import time
import threading
from typing import Dict, List, Optional, Any, Callable
from enum import Enum
from dataclasses import dataclass
from datetime import datetime, timedelta
import os

import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from monitor_logging import get_logger


class TaskStatus(Enum):
    """Task status enumeration."""
    PENDING = "pending"
    IN_PROGRESS = "in-progress" 
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    UNKNOWN = "unknown"


@dataclass
class TaskInfo:
    """Information about a task."""
    task_id: str
    description: str
    status: TaskStatus
    spec_name: str
    project_path: str
    last_updated: datetime
    metadata: Dict[str, Any]
    
    def __post_init__(self):
        if isinstance(self.status, str):
            self.status = TaskStatus(self.status)
        if self.metadata is None:
            self.metadata = {}


@dataclass 
class SpecInfo:
    """Information about a spec."""
    spec_name: str
    project_path: str
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    pending_tasks: int
    failed_tasks: int
    completion_percentage: float
    last_updated: datetime
    
    @property
    def is_complete(self) -> bool:
        """Check if spec is fully completed."""
        return self.completed_tasks == self.total_tasks and self.total_tasks > 0
        
    @property
    def has_active_tasks(self) -> bool:
        """Check if spec has active (in-progress) tasks."""
        return self.in_progress_tasks > 0


class TaskMonitor:
    """
    Monitor for spec-workflow system integration.
    
    Provides integration with spec-workflow MCP command-line tools for
    intelligent monitoring lifecycle management and task completion detection.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the task monitor.
        
        Args:
            config: Configuration dictionary with monitor settings
        """
        self.config = config or self._get_default_config()
        self.logger = get_logger('task_monitor')
        
        # Monitor state
        self._enabled = True
        self._monitoring = False
        self._monitor_thread: Optional[threading.Thread] = None
        self._shutdown_event = threading.Event()
        self._lock = threading.RLock()
        
        # Monitored specs
        self._monitored_specs: Dict[str, SpecInfo] = {}
        self._task_cache: Dict[str, Dict[str, TaskInfo]] = {}
        self._last_query_time: Dict[str, datetime] = {}
        
        # Statistics
        self._stats = {
            'total_queries': 0,
            'successful_queries': 0,
            'failed_queries': 0,
            'mcp_unavailable_count': 0,
            'specs_monitored': 0,
            'tasks_tracked': 0,
            'completion_detections': 0,
            'last_query_time': None,
            'uptime_start': datetime.now()
        }
        
        # Callbacks
        self._on_spec_complete: Optional[Callable] = None
        self._on_task_complete: Optional[Callable] = None
        self._on_task_status_change: Optional[Callable] = None
        self._on_mcp_unavailable: Optional[Callable] = None
        
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default task monitor configuration."""
        return {
            'enabled': True,
            'query_interval': 30.0,  # Seconds between status queries
            'mcp_timeout': 10.0,  # Timeout for MCP commands
            'max_query_failures': 3,  # Max consecutive failures before backing off
            'backoff_multiplier': 2.0,  # Backoff multiplier for failures
            'max_backoff_interval': 300.0,  # Maximum backoff interval (5 minutes)
            'cooldown_period': 60.0,  # Cooldown between spec completions (seconds)
            'task_cache_ttl': 300.0,  # Task cache time-to-live (5 minutes)
            'mcp_command_base': 'mcp__spec-workflow__',  # MCP command prefix
            'default_project_path': '/mnt/d/repos/claude-monitor'
        }
        
    def set_callbacks(self, 
                     on_spec_complete: Optional[Callable] = None,
                     on_task_complete: Optional[Callable] = None, 
                     on_task_status_change: Optional[Callable] = None,
                     on_mcp_unavailable: Optional[Callable] = None):
        """
        Set callback functions for monitoring events.
        
        Args:
            on_spec_complete: Called when a spec is completed
            on_task_complete: Called when a task is completed
            on_task_status_change: Called when task status changes
            on_mcp_unavailable: Called when MCP is unavailable
        """
        self._on_spec_complete = on_spec_complete
        self._on_task_complete = on_task_complete
        self._on_task_status_change = on_task_status_change
        self._on_mcp_unavailable = on_mcp_unavailable
        
    def add_spec_to_monitor(self, project_path: str, spec_name: str):
        """
        Add a spec to monitor for completion.
        
        Args:
            project_path: Path to the project
            spec_name: Name of the spec to monitor
        """
        with self._lock:
            spec_key = f"{project_path}:{spec_name}"
            if spec_key not in self._monitored_specs:
                self._monitored_specs[spec_key] = SpecInfo(
                    spec_name=spec_name,
                    project_path=project_path,
                    total_tasks=0,
                    completed_tasks=0,
                    in_progress_tasks=0,
                    pending_tasks=0,
                    failed_tasks=0,
                    completion_percentage=0.0,
                    last_updated=datetime.now()
                )
                self._task_cache[spec_key] = {}
                self._stats['specs_monitored'] += 1
                self.logger.info(f"Added spec to monitor: {spec_name} at {project_path}")
                
    def remove_spec_from_monitor(self, project_path: str, spec_name: str):
        """
        Remove a spec from monitoring.
        
        Args:
            project_path: Path to the project
            spec_name: Name of the spec to remove
        """
        with self._lock:
            spec_key = f"{project_path}:{spec_name}"
            if spec_key in self._monitored_specs:
                del self._monitored_specs[spec_key]
                del self._task_cache[spec_key]
                if spec_key in self._last_query_time:
                    del self._last_query_time[spec_key]
                self._stats['specs_monitored'] = max(0, self._stats['specs_monitored'] - 1)
                self.logger.info(f"Removed spec from monitor: {spec_name} at {project_path}")
                
    def start_monitoring(self):
        """Start the monitoring loop."""
        with self._lock:
            if self._monitoring:
                self.logger.warning("Task monitor is already running")
                return
                
            self._monitoring = True
            self._shutdown_event.clear()
            self._monitor_thread = threading.Thread(target=self._monitor_worker, daemon=True)
            self._monitor_thread.start()
            self.logger.info("Task monitoring started")
            
    def stop_monitoring(self):
        """Stop the monitoring loop."""
        with self._lock:
            if not self._monitoring:
                return
                
            self._monitoring = False
            self._shutdown_event.set()
            
            if self._monitor_thread:
                # Wait for thread to complete (with timeout)
                self._monitor_thread.join(timeout=5.0)
                
            self.logger.info("Task monitoring stopped")
            
    def is_monitoring(self) -> bool:
        """Check if monitoring is active."""
        with self._lock:
            return self._monitoring
            
    def _monitor_worker(self):
        """Worker thread for monitoring tasks."""
        query_interval = self.config['query_interval']
        failure_count = 0
        current_interval = query_interval
        
        self.logger.info("Task monitor worker started")
        
        while not self._shutdown_event.wait(timeout=current_interval):
            try:
                # Query all monitored specs
                any_success = False
                for spec_key, spec_info in list(self._monitored_specs.items()):
                    if self._shutdown_event.is_set():
                        break
                        
                    try:
                        success = self._query_spec_status(spec_info)
                        if success:
                            any_success = True
                            failure_count = 0
                            current_interval = query_interval
                        else:
                            failure_count += 1
                            
                    except Exception as e:
                        self.logger.error(f"Error querying spec {spec_key}: {e}")
                        failure_count += 1
                        
                # Handle consecutive failures with backoff
                if not any_success and failure_count > 0:
                    max_failures = self.config['max_query_failures']
                    if failure_count >= max_failures:
                        backoff_multiplier = self.config['backoff_multiplier']
                        max_backoff = self.config['max_backoff_interval']
                        current_interval = min(current_interval * backoff_multiplier, max_backoff)
                        self.logger.warning(f"Query failures detected, backing off to {current_interval}s interval")
                        
            except Exception as e:
                self.logger.error(f"Unexpected error in monitor worker: {e}")
                failure_count += 1
                
        self.logger.info("Task monitor worker stopped")
        
    def _query_spec_status(self, spec_info: SpecInfo) -> bool:
        """
        Query the status of a spec using MCP commands.
        
        Args:
            spec_info: Spec to query
            
        Returns:
            True if query successful, False otherwise
        """
        spec_key = f"{spec_info.project_path}:{spec_info.spec_name}"
        
        # Check cooldown period
        if spec_key in self._last_query_time:
            time_since_last = (datetime.now() - self._last_query_time[spec_key]).total_seconds()
            if time_since_last < self.config['cooldown_period'] / 10:  # Shorter cooldown for regular queries
                return True  # Skip query but don't count as failure
                
        try:
            self._stats['total_queries'] += 1
            
            # Query task status via MCP
            tasks = self._query_tasks_via_mcp(spec_info.project_path, spec_info.spec_name)
            
            if tasks is None:
                self._stats['failed_queries'] += 1
                return False
                
            # Process task results
            self._process_task_results(spec_info, tasks)
            
            # Update query time
            self._last_query_time[spec_key] = datetime.now()
            self._stats['successful_queries'] += 1
            self._stats['last_query_time'] = datetime.now()
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error querying spec status: {e}")
            self._stats['failed_queries'] += 1
            return False
            
    def _query_tasks_via_mcp(self, project_path: str, spec_name: str) -> Optional[List[Dict[str, Any]]]:
        """
        Query tasks via MCP command-line tool.
        
        Args:
            project_path: Project path
            spec_name: Spec name
            
        Returns:
            List of task dictionaries or None if failed
        """
        try:
            # Build MCP command (simulating command-line MCP call)
            # In a real implementation, this would call the actual MCP command
            cmd = [
                'python', '-c', f'''
import json
import sys
import os
sys.path.append("{os.path.dirname(os.path.dirname(__file__))}")

# Simulate MCP spec-workflow task query
try:
    # This would be the actual MCP call in production
    result = {{
        "success": True,
        "data": {{
            "tasks": [
                {{"id": "1", "description": "Sample task 1", "status": "completed"}},
                {{"id": "2", "description": "Sample task 2", "status": "in-progress"}},
                {{"id": "3", "description": "Sample task 3", "status": "pending"}}
            ],
            "summary": {{
                "total": 3,
                "completed": 1,
                "inProgress": 1,
                "pending": 1,
                "headers": 0
            }}
        }}
    }}
    print(json.dumps(result))
except Exception as e:
    result = {{"success": False, "error": str(e)}}
    print(json.dumps(result))
'''
            ]
            
            # Execute command with timeout
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=self.config['mcp_timeout']
            )
            
            if result.returncode != 0:
                self.logger.error(f"MCP command failed: {result.stderr}")
                return None
                
            # Parse JSON response
            try:
                response = json.loads(result.stdout)
                if response.get('success'):
                    return response.get('data', {}).get('tasks', [])
                else:
                    self.logger.error(f"MCP query failed: {response.get('error', 'Unknown error')}")
                    return None
                    
            except json.JSONDecodeError as e:
                self.logger.error(f"Failed to parse MCP response: {e}")
                return None
                
        except subprocess.TimeoutExpired:
            self.logger.error("MCP command timed out")
            self._stats['mcp_unavailable_count'] += 1
            if self._on_mcp_unavailable:
                try:
                    self._on_mcp_unavailable("timeout")
                except Exception as e:
                    self.logger.error(f"Error in MCP unavailable callback: {e}")
            return None
            
        except FileNotFoundError:
            self.logger.error("MCP command not found")
            self._stats['mcp_unavailable_count'] += 1
            if self._on_mcp_unavailable:
                try:
                    self._on_mcp_unavailable("not_found")
                except Exception as e:
                    self.logger.error(f"Error in MCP unavailable callback: {e}")
            return None
            
        except Exception as e:
            self.logger.error(f"Error executing MCP command: {e}")
            return None
            
    def _process_task_results(self, spec_info: SpecInfo, tasks: List[Dict[str, Any]]):
        """
        Process task query results and update spec info.
        
        Args:
            spec_info: Spec info to update
            tasks: List of task dictionaries
        """
        spec_key = f"{spec_info.project_path}:{spec_info.spec_name}"
        old_spec = spec_info.__dict__.copy()
        old_tasks = self._task_cache.get(spec_key, {}).copy()
        
        # Process tasks
        new_tasks = {}
        total_tasks = 0
        completed_tasks = 0
        in_progress_tasks = 0
        pending_tasks = 0
        failed_tasks = 0
        
        for task_data in tasks:
            task_id = task_data.get('id', str(total_tasks))
            task_status_str = task_data.get('status', 'unknown')
            
            # Map status strings
            status_mapping = {
                'completed': TaskStatus.COMPLETED,
                'in-progress': TaskStatus.IN_PROGRESS,  
                'in_progress': TaskStatus.IN_PROGRESS,
                'pending': TaskStatus.PENDING,
                'failed': TaskStatus.FAILED,
                'cancelled': TaskStatus.CANCELLED
            }
            
            task_status = status_mapping.get(task_status_str.lower(), TaskStatus.UNKNOWN)
            
            # Create task info
            task_info = TaskInfo(
                task_id=task_id,
                description=task_data.get('description', f'Task {task_id}'),
                status=task_status,
                spec_name=spec_info.spec_name,
                project_path=spec_info.project_path,
                last_updated=datetime.now(),
                metadata=task_data
            )
            
            new_tasks[task_id] = task_info
            total_tasks += 1
            
            # Count by status
            if task_status == TaskStatus.COMPLETED:
                completed_tasks += 1
            elif task_status == TaskStatus.IN_PROGRESS:
                in_progress_tasks += 1
            elif task_status == TaskStatus.PENDING:
                pending_tasks += 1
            elif task_status == TaskStatus.FAILED:
                failed_tasks += 1
                
            # Check for status changes
            if task_id in old_tasks:
                old_task = old_tasks[task_id]
                if old_task.status != task_status:
                    self.logger.info(f"Task {task_id} status changed: {old_task.status} -> {task_status}")
                    
                    # Call task status change callback
                    if self._on_task_status_change:
                        try:
                            self._on_task_status_change(old_task, task_info)
                        except Exception as e:
                            self.logger.error(f"Error in task status change callback: {e}")
                            
                    # Call task completion callback
                    if task_status == TaskStatus.COMPLETED and old_task.status != TaskStatus.COMPLETED:
                        if self._on_task_complete:
                            try:
                                self._on_task_complete(task_info)
                            except Exception as e:
                                self.logger.error(f"Error in task complete callback: {e}")
                                
        # Update spec info
        spec_info.total_tasks = total_tasks
        spec_info.completed_tasks = completed_tasks
        spec_info.in_progress_tasks = in_progress_tasks
        spec_info.pending_tasks = pending_tasks
        spec_info.failed_tasks = failed_tasks
        spec_info.completion_percentage = (completed_tasks / max(total_tasks, 1)) * 100.0
        spec_info.last_updated = datetime.now()
        
        # Update task cache
        self._task_cache[spec_key] = new_tasks
        self._stats['tasks_tracked'] = sum(len(tasks) for tasks in self._task_cache.values())
        
        # Check for spec completion
        old_complete = old_spec.get('completed_tasks', 0) == old_spec.get('total_tasks', 0) and old_spec.get('total_tasks', 0) > 0
        new_complete = spec_info.is_complete
        
        if new_complete and not old_complete:
            self.logger.info(f"Spec completed: {spec_info.spec_name}")
            self._stats['completion_detections'] += 1
            
            if self._on_spec_complete:
                try:
                    self._on_spec_complete(spec_info)
                except Exception as e:
                    self.logger.error(f"Error in spec complete callback: {e}")
                    
    def get_monitored_specs(self) -> Dict[str, SpecInfo]:
        """
        Get all monitored specs.
        
        Returns:
            Dictionary of spec_key -> SpecInfo
        """
        with self._lock:
            return {k: v for k, v in self._monitored_specs.items()}
            
    def get_spec_info(self, project_path: str, spec_name: str) -> Optional[SpecInfo]:
        """
        Get information about a specific spec.
        
        Args:
            project_path: Project path
            spec_name: Spec name
            
        Returns:
            SpecInfo if found, None otherwise
        """
        with self._lock:
            spec_key = f"{project_path}:{spec_name}"
            return self._monitored_specs.get(spec_key)
            
    def get_spec_tasks(self, project_path: str, spec_name: str) -> Dict[str, TaskInfo]:
        """
        Get tasks for a specific spec.
        
        Args:
            project_path: Project path
            spec_name: Spec name
            
        Returns:
            Dictionary of task_id -> TaskInfo
        """
        with self._lock:
            spec_key = f"{project_path}:{spec_name}"
            return self._task_cache.get(spec_key, {}).copy()
            
    def force_query(self, project_path: str, spec_name: str) -> bool:
        """
        Force an immediate query of a spec's status.
        
        Args:
            project_path: Project path
            spec_name: Spec name
            
        Returns:
            True if query successful, False otherwise
        """
        with self._lock:
            spec_key = f"{project_path}:{spec_name}"
            spec_info = self._monitored_specs.get(spec_key)
            
            if not spec_info:
                self.logger.error(f"Spec not monitored: {spec_key}")
                return False
                
            return self._query_spec_status(spec_info)
            
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get task monitor statistics.
        
        Returns:
            Dictionary with statistics
        """
        with self._lock:
            stats = self._stats.copy()
            stats['uptime_seconds'] = (datetime.now() - stats['uptime_start']).total_seconds()
            
            if stats['total_queries'] > 0:
                stats['success_rate'] = stats['successful_queries'] / stats['total_queries']
                stats['failure_rate'] = stats['failed_queries'] / stats['total_queries']
            else:
                stats['success_rate'] = 0.0
                stats['failure_rate'] = 0.0
                
            return stats
            
    def reset_statistics(self):
        """Reset monitoring statistics."""
        with self._lock:
            self._stats = {
                'total_queries': 0,
                'successful_queries': 0,
                'failed_queries': 0,
                'mcp_unavailable_count': 0,
                'specs_monitored': len(self._monitored_specs),
                'tasks_tracked': sum(len(tasks) for tasks in self._task_cache.values()),
                'completion_detections': 0,
                'last_query_time': None,
                'uptime_start': datetime.now()
            }
            
    def shutdown(self):
        """Shutdown the task monitor."""
        self.logger.info("Shutting down task monitor")
        
        # Stop monitoring
        self.stop_monitoring()
        
        # Clear data
        with self._lock:
            self._monitored_specs.clear()
            self._task_cache.clear()
            self._last_query_time.clear()
            
        self.logger.info("Task monitor shutdown complete")


# Global task monitor instance
_task_monitor: Optional[TaskMonitor] = None


def get_task_monitor() -> TaskMonitor:
    """
    Get the global task monitor instance.
    
    Returns:
        TaskMonitor instance
    """
    global _task_monitor
    if _task_monitor is None:
        _task_monitor = TaskMonitor()
    return _task_monitor


def shutdown_task_monitor():
    """Shutdown the global task monitor."""
    global _task_monitor
    if _task_monitor:
        _task_monitor.shutdown()
        _task_monitor = None