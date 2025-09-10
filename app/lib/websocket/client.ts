/**
 * WebSocket Client utilities for real-time monitoring
 * 
 * Provides client-side Socket.IO connection management and event handling
 * for dashboard real-time updates and monitoring communication.
 * 
 * React hooks and utilities for WebSocket integration
 */

import { io, Socket } from 'socket.io-client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { MonitoringEvent, ConnectionStats } from './server'

export interface ConnectionState {
  connected: boolean
  connecting: boolean
  error: string | null
  lastPing: number | null
}

export interface WebSocketHookOptions {
  autoConnect?: boolean
  projectId?: string
  reconnection?: boolean
  reconnectionAttempts?: number
  reconnectionDelay?: number
}

/**
 * React hook for WebSocket connection management
 * Handles connection lifecycle, reconnection, and event subscriptions
 */
export function useWebSocket(options: WebSocketHookOptions = {}) {
  const {
    autoConnect = true,
    projectId,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000
  } = options

  const [connectionState, setConnectionState] = useState<ConnectionState>({
    connected: false,
    connecting: false,
    error: null,
    lastPing: null
  })

  const [serverStats, setServerStats] = useState<ConnectionStats | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const eventHandlersRef = useRef(new Map<string, Function[]>())

  // Initialize socket connection
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    setConnectionState(prev => ({ ...prev, connecting: true, error: null }))

    const socket = io({
      autoConnect: false,
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
      transports: ['websocket', 'polling']
    })

    // Connection event handlers
    socket.on('connect', () => {
      console.log('[WebSocket Client] Connected:', socket.id)
      setConnectionState({
        connected: true,
        connecting: false,
        error: null,
        lastPing: Date.now()
      })

      // Auto-subscribe to project if specified
      if (projectId) {
        socket.emit('subscribe_project', projectId)
      }
    })

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket Client] Disconnected:', reason)
      setConnectionState(prev => ({
        ...prev,
        connected: false,
        connecting: false
      }))
    })

    socket.on('connect_error', (error) => {
      console.error('[WebSocket Client] Connection error:', error)
      setConnectionState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error: error.message
      }))
    })

    socket.on('reconnect', (attemptNumber) => {
      console.log('[WebSocket Client] Reconnected after', attemptNumber, 'attempts')
    })

    socket.on('reconnect_error', (error) => {
      console.error('[WebSocket Client] Reconnection error:', error)
    })

    // Server acknowledgment
    socket.on('connection_ack', (data) => {
      console.log('[WebSocket Client] Server acknowledgment:', data)
    })

    // Ping/pong for connection health
    socket.on('pong', (data) => {
      setConnectionState(prev => ({
        ...prev,
        lastPing: data.timestamp
      }))
    })

    // Handle monitoring events
    socket.on('monitoring_event', (event: MonitoringEvent) => {
      // Dispatch to registered event handlers
      const handlers = eventHandlersRef.current.get(event.type) || []
      handlers.forEach(handler => {
        try {
          handler(event)
        } catch (error) {
          console.error(`[WebSocket Client] Error in ${event.type} handler:`, error)
        }
      })

      // Update server stats if it's a health check
      if (event.type === 'health_check' && event.data.stats) {
        setServerStats(event.data.stats)
      }
    })

    socketRef.current = socket
    socket.connect()
  }, [projectId, reconnection, reconnectionAttempts, reconnectionDelay])

  // Disconnect socket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    setConnectionState({
      connected: false,
      connecting: false,
      error: null,
      lastPing: null
    })
  }, [])

  // Subscribe to monitoring event type
  const subscribe = useCallback((eventType: string, handler: (event: MonitoringEvent) => void) => {
    const handlers = eventHandlersRef.current.get(eventType) || []
    handlers.push(handler)
    eventHandlersRef.current.set(eventType, handlers)

    // Return unsubscribe function
    return () => {
      const currentHandlers = eventHandlersRef.current.get(eventType) || []
      const index = currentHandlers.indexOf(handler)
      if (index > -1) {
        currentHandlers.splice(index, 1)
        eventHandlersRef.current.set(eventType, currentHandlers)
      }
    }
  }, [])

  // Subscribe to project monitoring
  const subscribeToProject = useCallback((projectId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe_project', projectId)
    }
  }, [])

  // Unsubscribe from project monitoring
  const unsubscribeFromProject = useCallback((projectId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe_project', projectId)
    }
  }, [])

  // Send ping to check connection health
  const ping = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('ping')
    }
  }, [])

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  // Periodic ping for connection health
  useEffect(() => {
    if (!connectionState.connected) return

    const pingInterval = setInterval(ping, 30000) // Ping every 30 seconds
    return () => clearInterval(pingInterval)
  }, [connectionState.connected, ping])

  return {
    connectionState,
    serverStats,
    connect,
    disconnect,
    subscribe,
    subscribeToProject,
    unsubscribeFromProject,
    ping,
    socket: socketRef.current
  }
}

/**
 * React hook for monitoring specific event types
 * Simplified hook for listening to specific monitoring events
 */
export function useMonitoringEvents(
  eventType: string | string[],
  handler: (event: MonitoringEvent) => void,
  deps: any[] = []
) {
  const { subscribe } = useWebSocket({ autoConnect: true })
  
  useEffect(() => {
    const eventTypes = Array.isArray(eventType) ? eventType : [eventType]
    const unsubscribeFunctions = eventTypes.map(type => subscribe(type, handler))
    
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe())
    }
  }, [subscribe, ...deps])
}

/**
 * React hook for project-specific monitoring
 * Automatically subscribes to project events and manages subscription lifecycle
 */
export function useProjectMonitoring(projectId: string) {
  const webSocket = useWebSocket({ projectId, autoConnect: true })
  const [projectEvents, setProjectEvents] = useState<MonitoringEvent[]>([])
  const [projectState, setProjectState] = useState<any>(null)

  useEffect(() => {
    const unsubscribeStateChange = webSocket.subscribe('state_change', (event) => {
      if (event.projectId === projectId) {
        setProjectState(event.data)
        setProjectEvents(prev => [...prev, event].slice(-100)) // Keep last 100 events
      }
    })

    const unsubscribeNewEvent = webSocket.subscribe('new_event', (event) => {
      if (event.projectId === projectId) {
        setProjectEvents(prev => [...prev, event].slice(-100))
      }
    })

    const unsubscribeRecoveryAction = webSocket.subscribe('recovery_action', (event) => {
      if (event.projectId === projectId) {
        setProjectEvents(prev => [...prev, event].slice(-100))
      }
    })

    return () => {
      unsubscribeStateChange()
      unsubscribeNewEvent()
      unsubscribeRecoveryAction()
    }
  }, [webSocket, projectId])

  return {
    ...webSocket,
    projectEvents,
    projectState
  }
}

/**
 * Utility function to create WebSocket client outside React
 * For use in service workers, utility functions, etc.
 */
export class WebSocketClient {
  private socket: Socket | null = null
  private eventHandlers = new Map<string, Function[]>()

  constructor(private options: { 
    reconnection?: boolean
    reconnectionAttempts?: number
  } = {}) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve()
        return
      }

      this.socket = io({
        autoConnect: false,
        reconnection: this.options.reconnection ?? true,
        reconnectionAttempts: this.options.reconnectionAttempts ?? 5,
        transports: ['websocket', 'polling']
      })

      this.socket.on('connect', () => {
        console.log('[WebSocket Client] Connected')
        resolve()
      })

      this.socket.on('connect_error', (error) => {
        console.error('[WebSocket Client] Connection error:', error)
        reject(error)
      })

      this.socket.on('monitoring_event', (event: MonitoringEvent) => {
        const handlers = this.eventHandlers.get(event.type) || []
        handlers.forEach(handler => {
          try {
            handler(event)
          } catch (error) {
            console.error(`[WebSocket Client] Error in ${event.type} handler:`, error)
          }
        })
      })

      this.socket.connect()
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  subscribe(eventType: string, handler: (event: MonitoringEvent) => void): () => void {
    const handlers = this.eventHandlers.get(eventType) || []
    handlers.push(handler)
    this.eventHandlers.set(eventType, handlers)

    return () => {
      const currentHandlers = this.eventHandlers.get(eventType) || []
      const index = currentHandlers.indexOf(handler)
      if (index > -1) {
        currentHandlers.splice(index, 1)
        this.eventHandlers.set(eventType, currentHandlers)
      }
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }
}