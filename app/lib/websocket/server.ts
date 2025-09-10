/**
 * WebSocket Server for real-time monitoring updates
 * 
 * Provides Socket.IO server implementation with proper connection management
 * and event broadcasting for dashboard real-time updates.
 * 
 * Converted from Python daemon.py main loop and callback patterns
 */

import { Server as HttpServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'
import { ConversationEvent, StateAnalysis, ProjectInfo } from '../types/conversation'

export interface MonitoringEvent {
  type: 'state_change' | 'new_event' | 'project_update' | 'recovery_action' | 'health_check'
  timestamp: string
  projectId?: string
  data: any
}

export interface ConnectionStats {
  totalConnections: number
  activeConnections: number
  lastActivity: number
  eventsEmitted: number
}

/**
 * WebSocket server for real-time monitoring updates
 * Handles connection lifecycle and event broadcasting
 */
export class MonitoringWebSocketServer {
  private io: SocketIOServer | null = null
  private connectedClients = new Set<string>()
  private stats: ConnectionStats = {
    totalConnections: 0,
    activeConnections: 0,
    lastActivity: Date.now(),
    eventsEmitted: 0
  }

  constructor(private httpServer: HttpServer) {}

  /**
   * Initialize Socket.IO server with proper configuration
   */
  initialize(): void {
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: process.env.NODE_ENV === 'development' 
          ? ['http://localhost:3000'] 
          : false,
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    })

    this.setupEventHandlers()
    console.log('[WebSocket] Server initialized')
  }

  /**
   * Setup Socket.IO event handlers
   * Maps to Python daemon callback patterns
   */
  private setupEventHandlers(): void {
    if (!this.io) return

    this.io.on('connection', (socket: Socket) => {
      const clientId = socket.id
      this.connectedClients.add(clientId)
      this.stats.totalConnections++
      this.stats.activeConnections++
      this.stats.lastActivity = Date.now()

      console.log(`[WebSocket] Client connected: ${clientId} (total: ${this.stats.activeConnections})`)

      // Send initial connection acknowledgment
      socket.emit('connection_ack', {
        clientId,
        timestamp: new Date().toISOString(),
        serverStatus: 'active'
      })

      // Handle client subscription to project monitoring
      socket.on('subscribe_project', (projectId: string) => {
        socket.join(`project:${projectId}`)
        console.log(`[WebSocket] Client ${clientId} subscribed to project: ${projectId}`)
        
        // Send current project status
        this.emitProjectStatus(projectId, socket)
      })

      // Handle client unsubscription
      socket.on('unsubscribe_project', (projectId: string) => {
        socket.leave(`project:${projectId}`)
        console.log(`[WebSocket] Client ${clientId} unsubscribed from project: ${projectId}`)
      })

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() })
      })

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        this.connectedClients.delete(clientId)
        this.stats.activeConnections--
        console.log(`[WebSocket] Client disconnected: ${clientId}, reason: ${reason}`)
      })

      // Error handling
      socket.on('error', (error) => {
        console.error(`[WebSocket] Socket error for client ${clientId}:`, error)
      })
    })

    // Handle server-level errors
    this.io.on('error', (error) => {
      console.error('[WebSocket] Server error:', error)
    })
  }

  /**
   * Broadcast monitoring event to all connected clients
   * Equivalent to Python daemon callback pattern
   */
  broadcastMonitoringEvent(event: MonitoringEvent): void {
    if (!this.io) return

    this.stats.eventsEmitted++
    this.stats.lastActivity = Date.now()

    if (event.projectId) {
      // Send to clients subscribed to specific project
      this.io.to(`project:${event.projectId}`).emit('monitoring_event', event)
    } else {
      // Broadcast to all clients
      this.io.emit('monitoring_event', event)
    }

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[WebSocket] Broadcasted ${event.type} event to ${this.stats.activeConnections} clients`)
    }
  }

  /**
   * Send project status update to specific client or all clients in project room
   * Equivalent to Python daemon status reporting
   */
  emitProjectStatus(projectId: string, targetSocket?: Socket): void {
    if (!this.io) return

    const statusEvent: MonitoringEvent = {
      type: 'project_update',
      timestamp: new Date().toISOString(),
      projectId,
      data: {
        status: 'active', // Would be determined by actual project state
        lastActivity: this.stats.lastActivity,
        connections: this.stats.activeConnections
      }
    }

    if (targetSocket) {
      targetSocket.emit('monitoring_event', statusEvent)
    } else {
      this.io.to(`project:${projectId}`).emit('monitoring_event', statusEvent)
    }
  }

  /**
   * Broadcast state change event
   * Maps to Python StateDetection results
   */
  broadcastStateChange(projectId: string, stateAnalysis: StateAnalysis): void {
    this.broadcastMonitoringEvent({
      type: 'state_change',
      timestamp: new Date().toISOString(),
      projectId,
      data: stateAnalysis
    })
  }

  /**
   * Broadcast new conversation event
   * Maps to Python log parser callbacks
   */
  broadcastNewEvent(projectId: string, event: ConversationEvent): void {
    this.broadcastMonitoringEvent({
      type: 'new_event',
      timestamp: new Date().toISOString(),
      projectId,
      data: event
    })
  }

  /**
   * Broadcast recovery action execution
   * Maps to Python recovery engine callbacks
   */
  broadcastRecoveryAction(projectId: string, action: any): void {
    this.broadcastMonitoringEvent({
      type: 'recovery_action',
      timestamp: new Date().toISOString(),
      projectId,
      data: action
    })
  }

  /**
   * Send health check status to all clients
   * Equivalent to Python daemon health monitoring
   */
  broadcastHealthCheck(status: 'healthy' | 'degraded' | 'error', details?: any): void {
    this.broadcastMonitoringEvent({
      type: 'health_check',
      timestamp: new Date().toISOString(),
      data: { status, details, stats: this.stats }
    })
  }

  /**
   * Get current connection statistics
   * Equivalent to Python daemon statistics
   */
  getStats(): ConnectionStats {
    return { ...this.stats }
  }

  /**
   * Get list of active client IDs
   */
  getConnectedClients(): string[] {
    return Array.from(this.connectedClients)
  }

  /**
   * Close server and all connections
   */
  close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.io) {
        this.io.close(() => {
          console.log('[WebSocket] Server closed')
          resolve()
        })
      } else {
        resolve()
      }
    })
  }

  /**
   * Check if server is initialized and ready
   */
  isReady(): boolean {
    return this.io !== null
  }
}

// Singleton instance for app-wide access
let wsServer: MonitoringWebSocketServer | null = null

/**
 * Get or create WebSocket server instance
 */
export function getWebSocketServer(httpServer?: HttpServer): MonitoringWebSocketServer | null {
  if (!wsServer && httpServer) {
    wsServer = new MonitoringWebSocketServer(httpServer)
  }
  return wsServer
}

/**
 * Initialize WebSocket server
 */
export function initializeWebSocketServer(httpServer: HttpServer): MonitoringWebSocketServer {
  wsServer = new MonitoringWebSocketServer(httpServer)
  wsServer.initialize()
  return wsServer
}