"""
Cross-platform notification system for Claude Monitor.

This module implements desktop notifications and alert management following requirements 6.4 and 5.5:
- Desktop notifications and alert management across platforms
- Notification filtering and rate limiting
- Cross-platform compatibility (Linux, macOS, Windows)
- User notification preferences and smooth experience
"""

import os
import platform
import subprocess
import time
import threading
from typing import Dict, List, Optional, Any, Callable
from enum import Enum
from dataclasses import dataclass
from datetime import datetime, timedelta
import json

import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from monitor_logging import get_logger


class NotificationType(Enum):
    """Types of notifications."""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    SUCCESS = "success"
    RECOVERY = "recovery"
    COMPLETION = "completion"


class NotificationPriority(Enum):
    """Notification priority levels."""
    LOW = 1
    NORMAL = 2
    HIGH = 3
    URGENT = 4


@dataclass
class Notification:
    """Represents a notification."""
    title: str
    message: str
    notification_type: NotificationType
    priority: NotificationPriority = NotificationPriority.NORMAL
    icon: Optional[str] = None
    timeout: int = 5000  # Milliseconds
    actions: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()
        if self.actions is None:
            self.actions = []
        if self.metadata is None:
            self.metadata = {}


@dataclass
class NotificationHistory:
    """Tracks notification history for rate limiting."""
    notification: Notification
    sent_time: datetime
    success: bool
    error_message: Optional[str] = None


class PlatformNotifier:
    """Base class for platform-specific notifiers."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = get_logger('platform_notifier')
        
    def send_notification(self, notification: Notification) -> bool:
        """
        Send a notification using platform-specific method.
        
        Args:
            notification: Notification to send
            
        Returns:
            True if sent successfully, False otherwise
        """
        raise NotImplementedError("Subclasses must implement send_notification")
        
    def is_available(self) -> bool:
        """
        Check if this notifier is available on the current platform.
        
        Returns:
            True if available, False otherwise
        """
        raise NotImplementedError("Subclasses must implement is_available")


class LinuxNotifier(PlatformNotifier):
    """Linux desktop notification using notify-send."""
    
    def send_notification(self, notification: Notification) -> bool:
        """Send notification using notify-send."""
        try:
            cmd = ['notify-send']
            
            # Add urgency level based on priority
            if notification.priority == NotificationPriority.LOW:
                cmd.extend(['--urgency', 'low'])
            elif notification.priority == NotificationPriority.HIGH:
                cmd.extend(['--urgency', 'normal'])
            elif notification.priority == NotificationPriority.URGENT:
                cmd.extend(['--urgency', 'critical'])
            
            # Add timeout
            cmd.extend(['--expire-time', str(notification.timeout)])
            
            # Add icon if specified
            if notification.icon:
                cmd.extend(['--icon', notification.icon])
            elif notification.notification_type == NotificationType.ERROR:
                cmd.extend(['--icon', 'error'])
            elif notification.notification_type == NotificationType.WARNING:
                cmd.extend(['--icon', 'warning'])
            elif notification.notification_type == NotificationType.SUCCESS:
                cmd.extend(['--icon', 'info'])
            
            # Add category
            if notification.notification_type:
                cmd.extend(['--category', notification.notification_type.value])
            
            # Add title and message
            cmd.append(notification.title)
            cmd.append(notification.message)
            
            # Execute command
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=5.0)
            
            if result.returncode == 0:
                return True
            else:
                self.logger.error(f"notify-send failed: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            self.logger.error("notify-send command timed out")
            return False
        except FileNotFoundError:
            self.logger.error("notify-send command not found")
            return False
        except Exception as e:
            self.logger.error(f"Error sending Linux notification: {e}")
            return False
            
    def is_available(self) -> bool:
        """Check if notify-send is available."""
        try:
            result = subprocess.run(['which', 'notify-send'], capture_output=True, timeout=2.0)
            return result.returncode == 0
        except:
            return False


class MacOSNotifier(PlatformNotifier):
    """macOS notification using osascript."""
    
    def send_notification(self, notification: Notification) -> bool:
        """Send notification using AppleScript."""
        try:
            # Build AppleScript command
            script = f'''
display notification "{notification.message}" \\
with title "{notification.title}" \\
sound name "default"
'''
            
            cmd = ['osascript', '-e', script]
            
            # Execute command
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=5.0)
            
            if result.returncode == 0:
                return True
            else:
                self.logger.error(f"osascript failed: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            self.logger.error("osascript command timed out")
            return False
        except FileNotFoundError:
            self.logger.error("osascript command not found")
            return False
        except Exception as e:
            self.logger.error(f"Error sending macOS notification: {e}")
            return False
            
    def is_available(self) -> bool:
        """Check if osascript is available."""
        try:
            result = subprocess.run(['which', 'osascript'], capture_output=True, timeout=2.0)
            return result.returncode == 0
        except:
            return False


class WindowsNotifier(PlatformNotifier):
    """Windows notification using PowerShell."""
    
    def send_notification(self, notification: Notification) -> bool:
        """Send notification using PowerShell toast notification."""
        try:
            # Build PowerShell command for toast notification
            script = f'''
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
[Windows.UI.Notifications.ToastNotification, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] > $null

$APP_ID = "Claude Monitor"

$template = @"
<toast>
    <visual>
        <binding template="ToastText02">
            <text id="1">{notification.title}</text>
            <text id="2">{notification.message}</text>
        </binding>
    </visual>
</toast>
"@

$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$xml.LoadXml($template)
$toast = New-Object Windows.UI.Notifications.ToastNotification $xml
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($APP_ID).Show($toast)
'''
            
            cmd = ['powershell', '-Command', script]
            
            # Execute command
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10.0)
            
            if result.returncode == 0:
                return True
            else:
                self.logger.error(f"PowerShell notification failed: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            self.logger.error("PowerShell command timed out")
            return False
        except FileNotFoundError:
            self.logger.error("PowerShell command not found")
            return False
        except Exception as e:
            self.logger.error(f"Error sending Windows notification: {e}")
            return False
            
    def is_available(self) -> bool:
        """Check if PowerShell is available."""
        try:
            result = subprocess.run(['powershell', '-Command', 'echo "test"'], 
                                  capture_output=True, timeout=2.0)
            return result.returncode == 0
        except:
            return False


class FallbackNotifier(PlatformNotifier):
    """Fallback notifier for unsupported platforms or when others fail."""
    
    def send_notification(self, notification: Notification) -> bool:
        """Send notification using console output as fallback."""
        try:
            # Format notification for console
            timestamp = notification.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            type_str = notification.notification_type.value.upper()
            priority_str = notification.priority.name
            
            print(f"\n{'='*60}")
            print(f"[{timestamp}] {type_str} - {priority_str}")
            print(f"TITLE: {notification.title}")
            print(f"MESSAGE: {notification.message}")
            print(f"{'='*60}\n")
            
            # Also log it
            log_level_map = {
                NotificationType.ERROR: 'error',
                NotificationType.WARNING: 'warning',
                NotificationType.INFO: 'info',
                NotificationType.SUCCESS: 'info',
                NotificationType.RECOVERY: 'info',
                NotificationType.COMPLETION: 'info'
            }
            
            log_level = log_level_map.get(notification.notification_type, 'info')
            log_msg = f"NOTIFICATION [{notification.title}]: {notification.message}"
            
            if log_level == 'error':
                self.logger.error(log_msg)
            elif log_level == 'warning':
                self.logger.warning(log_msg)
            else:
                self.logger.info(log_msg)
            
            return True
            
        except Exception as e:
            self.logger.error(f"Error in fallback notification: {e}")
            return False
            
    def is_available(self) -> bool:
        """Fallback is always available."""
        return True


class NotificationFilter:
    """Filters notifications based on rules and user preferences."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = get_logger('notification_filter')
        
    def should_send_notification(self, notification: Notification, history: List[NotificationHistory]) -> bool:
        """
        Check if notification should be sent based on filters.
        
        Args:
            notification: Notification to check
            history: Recent notification history
            
        Returns:
            True if notification should be sent, False otherwise
        """
        # Check if notifications are globally enabled
        if not self.config.get('enabled', True):
            return False
            
        # Check priority threshold
        min_priority = NotificationPriority(self.config.get('min_priority', NotificationPriority.NORMAL.value))
        if notification.priority.value < min_priority.value:
            return False
            
        # Check type filters
        disabled_types = self.config.get('disabled_types', [])
        if notification.notification_type.value in disabled_types:
            return False
            
        # Check rate limiting
        if self._is_rate_limited(notification, history):
            return False
            
        # Check duplicate suppression
        if self._is_duplicate(notification, history):
            return False
            
        return True
        
    def _is_rate_limited(self, notification: Notification, history: List[NotificationHistory]) -> bool:
        """Check if notification is rate limited."""
        rate_limit_config = self.config.get('rate_limiting', {})
        
        if not rate_limit_config.get('enabled', True):
            return False
            
        # Check per-type rate limits
        type_limits = rate_limit_config.get('per_type', {})
        type_limit = type_limits.get(notification.notification_type.value)
        
        if type_limit:
            max_per_period = type_limit.get('max_per_period', 5)
            period_seconds = type_limit.get('period_seconds', 60)
            
            cutoff_time = datetime.now() - timedelta(seconds=period_seconds)
            recent_count = sum(1 for h in history 
                             if h.notification.notification_type == notification.notification_type 
                             and h.sent_time > cutoff_time)
            
            if recent_count >= max_per_period:
                self.logger.debug(f"Rate limit exceeded for type {notification.notification_type.value}")
                return True
                
        # Check global rate limit
        global_limit = rate_limit_config.get('global', {})
        if global_limit:
            max_per_period = global_limit.get('max_per_period', 20)
            period_seconds = global_limit.get('period_seconds', 60)
            
            cutoff_time = datetime.now() - timedelta(seconds=period_seconds)
            recent_count = sum(1 for h in history if h.sent_time > cutoff_time)
            
            if recent_count >= max_per_period:
                self.logger.debug("Global rate limit exceeded")
                return True
                
        return False
        
    def _is_duplicate(self, notification: Notification, history: List[NotificationHistory]) -> bool:
        """Check if notification is a duplicate."""
        duplicate_config = self.config.get('duplicate_suppression', {})
        
        if not duplicate_config.get('enabled', True):
            return False
            
        suppression_period = duplicate_config.get('period_seconds', 300)  # 5 minutes
        cutoff_time = datetime.now() - timedelta(seconds=suppression_period)
        
        # Check for recent identical notifications
        for history_item in history:
            if (history_item.sent_time > cutoff_time and
                history_item.notification.title == notification.title and
                history_item.notification.message == notification.message and
                history_item.notification.notification_type == notification.notification_type):
                
                self.logger.debug(f"Suppressing duplicate notification: {notification.title}")
                return True
                
        return False


class Notifier:
    """
    Cross-platform notification system with filtering and rate limiting.
    
    Provides desktop notifications with proper filtering, rate limiting,
    and cross-platform compatibility for user alerts and monitoring status.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the notification system.
        
        Args:
            config: Configuration dictionary with notifier settings
        """
        self.config = config or self._get_default_config()
        self.logger = get_logger('notifier')
        
        # Initialize platform-specific notifiers
        self._notifiers: List[PlatformNotifier] = []
        self._init_platform_notifiers()
        
        # Notification filtering
        self._filter = NotificationFilter(self.config.get('filtering', {}))
        
        # Notification history for rate limiting and deduplication
        self._history: List[NotificationHistory] = []
        self._history_lock = threading.RLock()
        
        # Statistics
        self._stats = {
            'total_notifications': 0,
            'sent_notifications': 0,
            'filtered_notifications': 0,
            'failed_notifications': 0,
            'rate_limited_notifications': 0,
            'duplicate_notifications': 0,
            'platform_failures': 0,
            'last_notification_time': None
        }
        
        # Background cleanup thread
        self._cleanup_thread: Optional[threading.Thread] = None
        self._shutdown_event = threading.Event()
        self._start_cleanup_thread()
        
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default notification configuration."""
        return {
            'enabled': True,
            'platforms': {
                'linux': {'enabled': True, 'prefer_notify_send': True},
                'macos': {'enabled': True},
                'windows': {'enabled': True},
                'fallback': {'enabled': True}
            },
            'filtering': {
                'enabled': True,
                'min_priority': NotificationPriority.NORMAL.value,
                'disabled_types': [],
                'rate_limiting': {
                    'enabled': True,
                    'global': {'max_per_period': 20, 'period_seconds': 60},
                    'per_type': {
                        'error': {'max_per_period': 5, 'period_seconds': 60},
                        'warning': {'max_per_period': 10, 'period_seconds': 60},
                        'info': {'max_per_period': 15, 'period_seconds': 60}
                    }
                },
                'duplicate_suppression': {
                    'enabled': True,
                    'period_seconds': 300
                }
            },
            'history_retention_hours': 24,
            'cleanup_interval_minutes': 10
        }
        
    def _init_platform_notifiers(self):
        """Initialize platform-specific notifiers."""
        current_platform = platform.system().lower()
        
        # Linux notifier
        if current_platform == 'linux' and self.config['platforms']['linux']['enabled']:
            linux_notifier = LinuxNotifier(self.config['platforms']['linux'])
            if linux_notifier.is_available():
                self._notifiers.append(linux_notifier)
                self.logger.info("Linux notify-send notifier available")
            
        # macOS notifier
        elif current_platform == 'darwin' and self.config['platforms']['macos']['enabled']:
            macos_notifier = MacOSNotifier(self.config['platforms']['macos'])
            if macos_notifier.is_available():
                self._notifiers.append(macos_notifier)
                self.logger.info("macOS osascript notifier available")
                
        # Windows notifier
        elif current_platform == 'windows' and self.config['platforms']['windows']['enabled']:
            windows_notifier = WindowsNotifier(self.config['platforms']['windows'])
            if windows_notifier.is_available():
                self._notifiers.append(windows_notifier)
                self.logger.info("Windows PowerShell notifier available")
        
        # Fallback notifier (always add)
        if self.config['platforms']['fallback']['enabled']:
            fallback_notifier = FallbackNotifier(self.config['platforms']['fallback'])
            self._notifiers.append(fallback_notifier)
            self.logger.info("Fallback console notifier available")
            
        self.logger.info(f"Initialized {len(self._notifiers)} notification backends")
        
    def _start_cleanup_thread(self):
        """Start background cleanup thread."""
        self._cleanup_thread = threading.Thread(target=self._cleanup_worker, daemon=True)
        self._cleanup_thread.start()
        
    def _cleanup_worker(self):
        """Background worker to clean up old history entries."""
        cleanup_interval = self.config.get('cleanup_interval_minutes', 10) * 60
        
        while not self._shutdown_event.wait(timeout=cleanup_interval):
            try:
                self._cleanup_history()
            except Exception as e:
                self.logger.error(f"Error in cleanup worker: {e}")
                
    def _cleanup_history(self):
        """Clean up old history entries."""
        retention_hours = self.config.get('history_retention_hours', 24)
        cutoff_time = datetime.now() - timedelta(hours=retention_hours)
        
        with self._history_lock:
            initial_count = len(self._history)
            self._history = [h for h in self._history if h.sent_time > cutoff_time]
            removed_count = initial_count - len(self._history)
            
            if removed_count > 0:
                self.logger.debug(f"Cleaned up {removed_count} old notification history entries")
                
    def send_notification(self, notification: Notification) -> bool:
        """
        Send a notification with filtering and rate limiting.
        
        Args:
            notification: Notification to send
            
        Returns:
            True if notification was sent, False if filtered or failed
        """
        with self._history_lock:
            self._stats['total_notifications'] += 1
            
            # Apply filters
            if not self._filter.should_send_notification(notification, self._history):
                self._stats['filtered_notifications'] += 1
                
                # Check specific reason for filtering
                if self._filter._is_rate_limited(notification, self._history):
                    self._stats['rate_limited_notifications'] += 1
                elif self._filter._is_duplicate(notification, self._history):
                    self._stats['duplicate_notifications'] += 1
                    
                self.logger.debug(f"Notification filtered: {notification.title}")
                return False
                
            # Try to send using available notifiers
            for notifier in self._notifiers:
                try:
                    if notifier.send_notification(notification):
                        # Record successful send
                        history_entry = NotificationHistory(
                            notification=notification,
                            sent_time=datetime.now(),
                            success=True
                        )
                        self._history.append(history_entry)
                        
                        self._stats['sent_notifications'] += 1
                        self._stats['last_notification_time'] = datetime.now()
                        
                        self.logger.debug(f"Notification sent successfully: {notification.title}")
                        return True
                        
                except Exception as e:
                    self.logger.error(f"Error sending notification with {notifier.__class__.__name__}: {e}")
                    self._stats['platform_failures'] += 1
                    continue
                    
            # If we get here, all notifiers failed
            self._stats['failed_notifications'] += 1
            
            # Record failed send
            history_entry = NotificationHistory(
                notification=notification,
                sent_time=datetime.now(),
                success=False,
                error_message="All notifiers failed"
            )
            self._history.append(history_entry)
            
            self.logger.error(f"Failed to send notification: {notification.title}")
            return False
            
    def notify_info(self, title: str, message: str, **kwargs) -> bool:
        """Send an info notification."""
        notification = Notification(
            title=title,
            message=message,
            notification_type=NotificationType.INFO,
            **kwargs
        )
        return self.send_notification(notification)
        
    def notify_warning(self, title: str, message: str, **kwargs) -> bool:
        """Send a warning notification."""
        notification = Notification(
            title=title,
            message=message,
            notification_type=NotificationType.WARNING,
            priority=NotificationPriority.HIGH,
            **kwargs
        )
        return self.send_notification(notification)
        
    def notify_error(self, title: str, message: str, **kwargs) -> bool:
        """Send an error notification."""
        notification = Notification(
            title=title,
            message=message,
            notification_type=NotificationType.ERROR,
            priority=NotificationPriority.HIGH,
            **kwargs
        )
        return self.send_notification(notification)
        
    def notify_success(self, title: str, message: str, **kwargs) -> bool:
        """Send a success notification."""
        notification = Notification(
            title=title,
            message=message,
            notification_type=NotificationType.SUCCESS,
            **kwargs
        )
        return self.send_notification(notification)
        
    def notify_recovery(self, title: str, message: str, **kwargs) -> bool:
        """Send a recovery action notification."""
        notification = Notification(
            title=title,
            message=message,
            notification_type=NotificationType.RECOVERY,
            priority=NotificationPriority.HIGH,
            **kwargs
        )
        return self.send_notification(notification)
        
    def notify_completion(self, title: str, message: str, **kwargs) -> bool:
        """Send a task completion notification."""
        notification = Notification(
            title=title,
            message=message,
            notification_type=NotificationType.COMPLETION,
            **kwargs
        )
        return self.send_notification(notification)
        
    def get_history(self, limit: Optional[int] = None) -> List[NotificationHistory]:
        """
        Get notification history.
        
        Args:
            limit: Maximum number of entries to return
            
        Returns:
            List of NotificationHistory entries
        """
        with self._history_lock:
            history = sorted(self._history, key=lambda x: x.sent_time, reverse=True)
            if limit:
                history = history[:limit]
            return history
            
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get notification statistics.
        
        Returns:
            Dictionary with statistics
        """
        with self._history_lock:
            stats = self._stats.copy()
            stats['history_entries'] = len(self._history)
            stats['available_notifiers'] = len(self._notifiers)
            
            if stats['total_notifications'] > 0:
                stats['success_rate'] = stats['sent_notifications'] / stats['total_notifications']
                stats['filter_rate'] = stats['filtered_notifications'] / stats['total_notifications']
            else:
                stats['success_rate'] = 0.0
                stats['filter_rate'] = 0.0
                
            return stats
            
    def reset_statistics(self):
        """Reset notification statistics."""
        with self._history_lock:
            self._stats = {
                'total_notifications': 0,
                'sent_notifications': 0,
                'filtered_notifications': 0,
                'failed_notifications': 0,
                'rate_limited_notifications': 0,
                'duplicate_notifications': 0,
                'platform_failures': 0,
                'last_notification_time': None
            }
            
    def clear_history(self):
        """Clear notification history."""
        with self._history_lock:
            self._history.clear()
            self.logger.info("Notification history cleared")
            
    def update_config(self, new_config: Dict[str, Any]):
        """
        Update notification configuration.
        
        Args:
            new_config: New configuration dictionary
        """
        self.config.update(new_config)
        self._filter = NotificationFilter(self.config.get('filtering', {}))
        self.logger.info("Notification configuration updated")
        
    def shutdown(self):
        """Shutdown the notification system."""
        self.logger.info("Shutting down notification system")
        
        # Stop cleanup thread
        self._shutdown_event.set()
        if self._cleanup_thread and self._cleanup_thread.is_alive():
            self._cleanup_thread.join(timeout=2.0)
            
        # Clear resources
        with self._history_lock:
            self._history.clear()
            
        self.logger.info("Notification system shutdown complete")


# Global notifier instance
_notifier: Optional[Notifier] = None


def get_notifier() -> Notifier:
    """
    Get the global notifier instance.
    
    Returns:
        Notifier instance
    """
    global _notifier
    if _notifier is None:
        _notifier = Notifier()
    return _notifier


def shutdown_notifier():
    """Shutdown the global notifier."""
    global _notifier
    if _notifier:
        _notifier.shutdown()
        _notifier = None


# Convenience functions
def notify_info(title: str, message: str, **kwargs) -> bool:
    """Send an info notification using global notifier."""
    return get_notifier().notify_info(title, message, **kwargs)


def notify_warning(title: str, message: str, **kwargs) -> bool:
    """Send a warning notification using global notifier."""
    return get_notifier().notify_warning(title, message, **kwargs)


def notify_error(title: str, message: str, **kwargs) -> bool:
    """Send an error notification using global notifier."""
    return get_notifier().notify_error(title, message, **kwargs)


def notify_success(title: str, message: str, **kwargs) -> bool:
    """Send a success notification using global notifier."""
    return get_notifier().notify_success(title, message, **kwargs)


def notify_recovery(title: str, message: str, **kwargs) -> bool:
    """Send a recovery action notification using global notifier."""
    return get_notifier().notify_recovery(title, message, **kwargs)


def notify_completion(title: str, message: str, **kwargs) -> bool:
    """Send a task completion notification using global notifier."""
    return get_notifier().notify_completion(title, message, **kwargs)