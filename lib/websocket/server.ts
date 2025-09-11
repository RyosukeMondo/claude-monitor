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
import { ConversationEvent } from '../types/conversation'
import { MemorySessionCache } from '../cache/memory-cache'

export interface MonitoringEvent {
  type: 'state_change' | 'new_event' | 'project_update' | 'recovery_action' | 'health_check'
  timestamp: string
  projectId?: string
  data: unknown
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
  private clientSessions = new Map<string, Set<string>>() // clientId -> sessionIds
  private sessionClients = new Map<string, Set<string>>() // sessionId -> clientIds
  private memoryCache: MemorySessionCache | null = null
  private stats: ConnectionStats = {
    totalConnections: 0,
    activeConnections: 0,
    lastActivity: Date.now(),
    eventsEmitted: 0
  }

  constructor(private httpServer: HttpServer) {}

  /**
   * Set memory cache for session management integration
   * Enables cross-tab synchronization and session persistence
   */
  setMemoryCache(cache: MemorySessionCache): void {
    this.memoryCache = cache
    console.log('[WebSocket] Memory cache integration enabled')
  }

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

      // Handle session joining for cross-tab synchronization
      socket.on('join_session', (sessionId: string) => {
        this.addClientToSession(clientId, sessionId)
        socket.join(`session:${sessionId}`)
        
        // Register connection with memory cache
        if (this.memoryCache) {
          this.memoryCache.addConnection(sessionId, clientId)
        }
        
        console.log(`[WebSocket] Client ${clientId} joined session: ${sessionId}`)
        
        // Notify other clients in the session about new connection
        socket.to(`session:${sessionId}`).emit('session_member_joined', {
          sessionId,
          clientId,
          timestamp: new Date().toISOString()
        })
      })

      // Handle session leaving
      socket.on('leave_session', (sessionId: string) => {
        this.removeClientFromSession(clientId, sessionId)
        socket.leave(`session:${sessionId}`)
        
        // Remove connection from memory cache
        if (this.memoryCache) {
          this.memoryCache.removeConnection(sessionId, clientId)
        }
        
        console.log(`[WebSocket] Client ${clientId} left session: ${sessionId}`)
        
        // Notify other clients in the session about disconnection
        socket.to(`session:${sessionId}`).emit('session_member_left', {
          sessionId,
          clientId,
          timestamp: new Date().toISOString()
        })
      })

      // Handle session data synchronization
      socket.on('sync_session_data', (data: { sessionId: string; payload: unknown }) => {
        const { sessionId, payload } = data
        
        // Update session data in memory cache
        if (this.memoryCache) {
          this.memoryCache.set(sessionId, payload, undefined, undefined, clientId)
        }
        
        // Broadcast to other clients in the session
        socket.to(`session:${sessionId}`).emit('session_data_updated', {
          sessionId,
          payload,
          sourceClient: clientId,
          timestamp: new Date().toISOString()
        })
        
        console.log(`[WebSocket] Session ${sessionId} data synchronized by client ${clientId}`)
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
        
        // Clean up all session connections for this client
        this.cleanupClientSessions(clientId)
        
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
  broadcastStateChange(projectId: string, stateAnalysis: unknown): void {
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
  broadcastRecoveryAction(projectId: string, action: unknown): void {
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
  broadcastHealthCheck(status: 'healthy' | 'degraded' | 'error', details?: unknown): void {
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
   * Add client to session tracking for cross-tab synchronization
   */
  private addClientToSession(clientId: string, sessionId: string): void {
    // Track sessions for this client
    if (!this.clientSessions.has(clientId)) {
      this.clientSessions.set(clientId, new Set())
    }
    this.clientSessions.get(clientId)!.add(sessionId)

    // Track clients for this session
    if (!this.sessionClients.has(sessionId)) {
      this.sessionClients.set(sessionId, new Set())
    }
    this.sessionClients.get(sessionId)!.add(clientId)
  }

  /**
   * Remove client from session tracking
   */
  private removeClientFromSession(clientId: string, sessionId: string): void {
    // Remove session from client tracking
    const clientSessions = this.clientSessions.get(clientId)
    if (clientSessions) {
      clientSessions.delete(sessionId)
      if (clientSessions.size === 0) {
        this.clientSessions.delete(clientId)
      }
    }

    // Remove client from session tracking
    const sessionClients = this.sessionClients.get(sessionId)
    if (sessionClients) {
      sessionClients.delete(clientId)
      if (sessionClients.size === 0) {
        this.sessionClients.delete(sessionId)
      }
    }

    // Remove connection from memory cache
    if (this.memoryCache) {
      this.memoryCache.removeConnection(sessionId, clientId)
    }
  }

  /**
   * Clean up all sessions for a disconnected client
   */
  private cleanupClientSessions(clientId: string): void {
    const sessions = this.clientSessions.get(clientId)
    if (!sessions) return

    // Notify all sessions that this client left
    for (const sessionId of sessions) {
      // Remove from session tracking
      const sessionClients = this.sessionClients.get(sessionId)
      if (sessionClients) {
        sessionClients.delete(clientId)
        if (sessionClients.size === 0) {
          this.sessionClients.delete(sessionId)
        }
      }

      // Remove from memory cache
      if (this.memoryCache) {
        this.memoryCache.removeConnection(sessionId, clientId)
      }

      // Notify other clients in the session
      if (this.io) {
        this.io.to(`session:${sessionId}`).emit('session_member_left', {
          sessionId,
          clientId,
          timestamp: new Date().toISOString(),
          reason: 'disconnect'
        })
      }
    }

    // Clear all client sessions
    this.clientSessions.delete(clientId)
  }

  /**
   * Broadcast session event to all clients in a session
   */
  broadcastToSession(sessionId: string, event: string, data: unknown): void {
    if (!this.io) return

    this.io.to(`session:${sessionId}`).emit(event, {
      sessionId,
      data,
      timestamp: new Date().toISOString()
    })

    // Also broadcast via memory cache if available
    if (this.memoryCache) {
      this.memoryCache.broadcast(sessionId, { event, data })
    }
  }

  /**
   * Get connected clients for a specific session
   */
  getSessionClients(sessionId: string): string[] {
    const clients = this.sessionClients.get(sessionId)
    return clients ? Array.from(clients) : []
  }

  /**
   * Get session count and statistics
   */
  getSessionStats(): { totalSessions: number; totalSessionClients: number; clientSessionCount: number } {
    return {
      totalSessions: this.sessionClients.size,
      totalSessionClients: Array.from(this.sessionClients.values())
        .reduce((total, clients) => total + clients.size, 0),
      clientSessionCount: this.clientSessions.size
    }
  }

  /**
   * Close server and all connections
   */
  close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.io) {
        // Clean up session tracking
        this.clientSessions.clear()
        this.sessionClients.clear()
        
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

/**
 * Initialize WebSocket server with memory cache integration
 * Enables cross-tab session synchronization for standalone mode
 */
export function initializeWebSocketServerWithCache(
  httpServer: HttpServer, 
  memoryCache: MemorySessionCache
): MonitoringWebSocketServer {
  wsServer = new MonitoringWebSocketServer(httpServer)
  wsServer.setMemoryCache(memoryCache)
  wsServer.initialize()
  return wsServer
}