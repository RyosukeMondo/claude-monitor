"""
TCP client for communicating with Claude Code expect bridge.

This module implements reliable TCP communication following requirements 2.1, 2.4, and 6.1:
- Connection management with retry logic and timeouts
- Thread-safe operation for concurrent access
- Graceful handling of network failures and disconnections
- Command sending with delivery confirmation
"""

import socket
import time
import threading
from typing import Optional, Dict, Any, Callable
from enum import Enum
import json

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from monitor_logging import get_logger


class ConnectionState(Enum):
    """TCP connection states."""
    DISCONNECTED = "disconnected"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    RECONNECTING = "reconnecting"
    ERROR = "error"


class TCPClient:
    """
    TCP client for communicating with Claude Code expect bridge.
    
    Provides reliable communication with automatic retry logic,
    connection management, and thread-safe operations.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the TCP client.
        
        Args:
            config: Configuration dictionary with connection settings
        """
        # Merge provided config with defaults to ensure required keys exist
        defaults = self._get_default_config()
        if isinstance(config, dict) and config:
            merged = defaults.copy()
            merged.update(config)
            self.config = merged
        else:
            self.config = defaults
        self.logger = get_logger('tcp_client')
        
        # Connection state
        self._socket: Optional[socket.socket] = None
        self._state = ConnectionState.DISCONNECTED
        self._lock = threading.RLock()
        self._reconnect_thread: Optional[threading.Thread] = None
        self._should_reconnect = False
        
        # Statistics
        self._stats = {
            'connections': 0,
            'successful_sends': 0,
            'failed_sends': 0,
            'reconnects': 0,
            'bytes_sent': 0,
            'last_connect_time': None,
            'last_error': None
        }
        # Communication tracing
        self._seq: int = 0  # sequence id for send/receive pairs
        
        # Callbacks
        self._on_connect_callback: Optional[Callable] = None
        self._on_disconnect_callback: Optional[Callable] = None
        self._on_error_callback: Optional[Callable] = None
        
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default TCP client configuration."""
        return {
            'host': 'localhost',
            'port': 9999,
            'connection_timeout': 5.0,
            'send_timeout': 3.0,
            'recv_timeout': 3.0,
            'max_retries': 3,
            'retry_backoff': 2.0,
            'auto_reconnect': True,
            'keepalive': True,
            'keepalive_interval': 30,
            'trace_communication': False  # when true, log detailed send/recv traces
        }
        
    def set_callbacks(self, 
                     on_connect: Optional[Callable] = None,
                     on_disconnect: Optional[Callable] = None,
                     on_error: Optional[Callable] = None):
        """
        Set callback functions for connection events.
        
        Args:
            on_connect: Called when connection is established
            on_disconnect: Called when connection is lost
            on_error: Called when an error occurs
        """
        self._on_connect_callback = on_connect
        self._on_disconnect_callback = on_disconnect
        self._on_error_callback = on_error
        
    def connect(self) -> bool:
        """
        Establish connection to the TCP server.
        
        Returns:
            True if connection successful, False otherwise
        """
        with self._lock:
            if self._state == ConnectionState.CONNECTED:
                return True
                
            self._state = ConnectionState.CONNECTING
            self.logger.info(f"Attempting to connect to {self.config['host']}:{self.config['port']}")
            
            try:
                # Create socket
                self._socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                self._socket.settimeout(self.config['connection_timeout'])
                
                # Set keepalive if enabled
                if self.config.get('keepalive', True):
                    self._socket.setsockopt(socket.SOL_SOCKET, socket.SO_KEEPALIVE, 1)
                    # Set keepalive parameters (Linux-specific)
                    if hasattr(socket, 'TCP_KEEPIDLE'):
                        keepalive_interval = self.config.get('keepalive_interval', 30)
                        self._socket.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPIDLE, keepalive_interval)
                        self._socket.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPINTVL, 10)
                        self._socket.setsockopt(socket.IPPROTO_TCP, socket.TCP_KEEPCNT, 3)
                
                # Connect to server
                self._socket.connect((self.config['host'], self.config['port']))
                
                # Set socket timeouts for send/receive
                self._socket.settimeout(self.config['send_timeout'])
                
                # Update state and stats
                self._state = ConnectionState.CONNECTED
                self._stats['connections'] += 1
                self._stats['last_connect_time'] = time.time()
                
                self.logger.info("Successfully connected to Claude Code expect bridge")
                
                # Call connect callback
                if self._on_connect_callback:
                    try:
                        self._on_connect_callback()
                    except Exception as e:
                        self.logger.error(f"Error in connect callback: {e}")
                
                return True
                
            except Exception as e:
                self._state = ConnectionState.ERROR
                self._stats['last_error'] = str(e)
                self.logger.error(f"Failed to connect: {e}")
                
                if self._socket:
                    try:
                        self._socket.close()
                    except:
                        pass
                    self._socket = None
                
                # Call error callback
                if self._on_error_callback:
                    try:
                        self._on_error_callback(e)
                    except Exception as cb_e:
                        self.logger.error(f"Error in error callback: {cb_e}")
                
                return False
                
    def disconnect(self):
        """Disconnect from the TCP server."""
        with self._lock:
            self._should_reconnect = False
            
            if self._reconnect_thread and self._reconnect_thread.is_alive():
                self._reconnect_thread = None
                
            if self._socket:
                try:
                    self._socket.close()
                    self.logger.info("Disconnected from TCP server")
                except Exception as e:
                    self.logger.error(f"Error during disconnect: {e}")
                finally:
                    self._socket = None
                    
            prev_state = self._state
            self._state = ConnectionState.DISCONNECTED
            
            # Call disconnect callback only if we were connected
            if prev_state == ConnectionState.CONNECTED and self._on_disconnect_callback:
                try:
                    self._on_disconnect_callback()
                except Exception as e:
                    self.logger.error(f"Error in disconnect callback: {e}")
                    
    def is_connected(self) -> bool:
        """
        Check if currently connected to the server.
        
        Returns:
            True if connected, False otherwise
        """
        with self._lock:
            return self._state == ConnectionState.CONNECTED and self._socket is not None
            
    def get_state(self) -> ConnectionState:
        """
        Get current connection state.
        
        Returns:
            Current ConnectionState
        """
        with self._lock:
            return self._state
            
    def send_command(self, command: str, wait_for_response: bool = False, timeout: float = None, context_tag: Optional[str] = None) -> bool:
        """
        Send a command to the Claude Code expect bridge.
        
        Args:
            command: Command to send
            wait_for_response: Whether to wait for a response
            timeout: Timeout for response waiting
            
        Returns:
            True if command sent successfully, False otherwise
        """
        if not command:
            return False
            
        # Add newline if not present
        if not command.endswith('\n'):
            command += '\n'
            
        return self._send_with_retry(command, wait_for_response, timeout, context_tag)
        
    def send_recovery_action(self, action_type: str, action_data: Dict[str, Any] = None) -> bool:
        """
        Send a structured recovery action to the bridge.
        
        Args:
            action_type: Type of recovery action (compact, resume, input, notify)
            action_data: Additional data for the action
            
        Returns:
            True if action sent successfully, False otherwise
        """
        action_msg = {
            'type': 'recovery_action',
            'action_type': action_type,
            'timestamp': time.time(),
            'data': action_data or {}
        }
        
        # Send as JSON
        json_msg = json.dumps(action_msg) + '\n'
        success = self._send_with_retry(json_msg, False, None)
        
        if success:
            self.logger.info(f"Sent recovery action: {action_type}")
        else:
            self.logger.error(f"Failed to send recovery action: {action_type}")
            
        return success
        
    def _send_with_retry(self, message: str, wait_for_response: bool = False, 
                        timeout: float = None, context_tag: Optional[str] = None) -> bool:
        """
        Send message with automatic retry logic.
        
        Args:
            message: Message to send
            wait_for_response: Whether to wait for response
            timeout: Response timeout
            
        Returns:
            True if sent successfully, False otherwise
        """
        max_retries = self.config['max_retries']
        backoff = 1.0
        
        for attempt in range(max_retries + 1):
            if self._send_message(message, wait_for_response, timeout, context_tag):
                self._stats['successful_sends'] += 1
                return True
                
            self._stats['failed_sends'] += 1
            
            if attempt < max_retries:
                self.logger.warning(f"Send attempt {attempt + 1} failed, retrying in {backoff}s")
                time.sleep(backoff)
                backoff *= self.config.get('retry_backoff', 2.0)
                
                # Try to reconnect if not connected
                if not self.is_connected():
                    self._attempt_reconnect()
            else:
                self.logger.error(f"All {max_retries + 1} send attempts failed")
                
        return False
        
    def _send_message(self, message: str, wait_for_response: bool = False, 
                     timeout: float = None, context_tag: Optional[str] = None) -> bool:
        """
        Send a single message to the server.
        
        Args:
            message: Message to send
            wait_for_response: Whether to wait for response
            timeout: Response timeout
            
        Returns:
            True if sent successfully, False otherwise
        """
        with self._lock:
            if not self.is_connected():
                self.logger.warning("Cannot send message: not connected")
                return False
                
            try:
                # Prepare trace data
                self._seq += 1
                seq = self._seq
                start_ts = time.time()
                message_bytes = message.encode('utf-8')
                # Send message
                self._socket.sendall(message_bytes)
                self._stats['bytes_sent'] += len(message_bytes)
                if self.config.get('trace_communication', False):
                    ctx = f" ctx={context_tag}" if context_tag else ""
                    self.logger.info(
                        f"TX seq={seq}{ctx} bytes={len(message_bytes)} timeout={timeout or self.config['recv_timeout']} msg={message.strip()}"
                    )
                else:
                    prefix = f"[{context_tag}] " if context_tag else ""
                    self.logger.debug(f"{prefix}Sent message seq={seq}: {message.strip()}")
                
                # Wait for response if requested
                if wait_for_response:
                    response = self._receive_response(timeout, seq, context_tag)
                    if response is None:
                        return False
                # Log duration
                dur_ms = int((time.time() - start_ts) * 1000)
                if self.config.get('trace_communication', False):
                    ctx = f" ctx={context_tag}" if context_tag else ""
                    self.logger.info(f"DONE seq={seq}{ctx} duration_ms={dur_ms}")
                return True
                
            except socket.timeout:
                self.logger.error("Send timeout")
                self._handle_connection_error("Send timeout")
                return False
            except socket.error as e:
                self.logger.error(f"Socket error during send: {e}")
                self._handle_connection_error(str(e))
                return False
            except Exception as e:
                self.logger.error(f"Unexpected error during send: {e}")
                return False
                
    def _receive_response(self, timeout: float = None, seq: Optional[int] = None, context_tag: Optional[str] = None) -> Optional[str]:
        """
        Receive response from server.
        
        Args:
            timeout: Receive timeout
            
        Returns:
            Response string or None if failed
        """
        if timeout is None:
            timeout = self.config['recv_timeout']
            
        try:
            self._socket.settimeout(timeout)
            response_bytes = self._socket.recv(4096)
            response = response_bytes.decode('utf-8')
            if self.config.get('trace_communication', False):
                tag = f" seq={seq}" if seq is not None else ""
                ctx = f" ctx={context_tag}" if context_tag else ""
                self.logger.info(f"RX{tag}{ctx} bytes={len(response_bytes)} msg={response.strip()}")
            else:
                prefix = f"[{context_tag}] " if context_tag else ""
                self.logger.debug(f"{prefix}Received response seq={seq}: {response.strip()}")
            return response
        except socket.timeout:
            self.logger.warning("Response timeout")
            return None
        except socket.error as e:
            self.logger.error(f"Socket error during receive: {e}")
            self._handle_connection_error(str(e))
            return None
        finally:
            # Reset timeout
            self._socket.settimeout(self.config['send_timeout'])
            
    def _handle_connection_error(self, error_msg: str):
        """
        Handle connection errors and potentially trigger reconnection.
        
        Args:
            error_msg: Error message
        """
        with self._lock:
            if self._state == ConnectionState.CONNECTED:
                self.logger.warning(f"Connection error detected: {error_msg}")
                self._state = ConnectionState.ERROR
                self._stats['last_error'] = error_msg
                
                # Close socket
                if self._socket:
                    try:
                        self._socket.close()
                    except:
                        pass
                    self._socket = None
                    
                # Call disconnect callback
                if self._on_disconnect_callback:
                    try:
                        self._on_disconnect_callback()
                    except Exception as e:
                        self.logger.error(f"Error in disconnect callback: {e}")
                
                # Trigger reconnection if enabled
                if self.config['auto_reconnect']:
                    self._attempt_reconnect()
                    
    def _attempt_reconnect(self):
        """Attempt to reconnect in a separate thread."""
        with self._lock:
            if (self._reconnect_thread and self._reconnect_thread.is_alive()) or \
               self._state == ConnectionState.CONNECTING:
                return
                
            self._should_reconnect = True
            self._reconnect_thread = threading.Thread(target=self._reconnect_worker, daemon=True)
            self._reconnect_thread.start()
            
    def _reconnect_worker(self):
        """Worker thread for reconnection attempts."""
        backoff = 1.0
        max_backoff = 30.0
        
        while self._should_reconnect and not self.is_connected():
            self.logger.info(f"Attempting reconnection in {backoff}s...")
            time.sleep(backoff)
            
            if not self._should_reconnect:
                break
                
            with self._lock:
                self._state = ConnectionState.RECONNECTING
                self._stats['reconnects'] += 1
                
            if self.connect():
                self.logger.info("Reconnection successful")
                break
            else:
                backoff = min(backoff * 2, max_backoff)
                
        with self._lock:
            if not self._should_reconnect:
                self._state = ConnectionState.DISCONNECTED
                
    def get_statistics(self) -> Dict[str, Any]:
        """
        Get connection statistics.
        
        Returns:
            Dictionary with connection statistics
        """
        with self._lock:
            return self._stats.copy()
            
    def reset_statistics(self):
        """Reset connection statistics."""
        with self._lock:
            self._stats = {
                'connections': 0,
                'successful_sends': 0,
                'failed_sends': 0,
                'reconnects': 0,
                'bytes_sent': 0,
                'last_connect_time': None,
                'last_error': None
            }
            
    def __enter__(self):
        """Context manager entry."""
        self.connect()
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.disconnect()
        
    def __del__(self):
        """Destructor to ensure clean shutdown."""
        try:
            self.disconnect()
        except:
            pass