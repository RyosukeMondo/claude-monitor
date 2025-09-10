/**
 * WebSocket module exports
 * 
 * Centralized exports for WebSocket server and client utilities
 */

// Server exports
export {
  MonitoringWebSocketServer,
  getWebSocketServer,
  initializeWebSocketServer,
  type MonitoringEvent,
  type ConnectionStats
} from './server'

// Client exports
export {
  useWebSocket,
  useMonitoringEvents,
  useProjectMonitoring,
  WebSocketClient,
  type ConnectionState,
  type WebSocketHookOptions
} from './client'