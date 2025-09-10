/**
 * Socket.IO Next.js API Route
 * 
 * Integrates Socket.IO server with Next.js API routes for real-time communication.
 * This route handles WebSocket upgrade and Socket.IO server initialization.
 * 
 * Follows Next.js App Router API route patterns while integrating Socket.IO
 */

import { NextRequest, NextResponse } from 'next/server'
import { Server as HttpServer } from 'http'
import { getWebSocketServer, initializeWebSocketServer } from '../../lib/websocket/server'

// Extend global to store server instance
declare global {
  var wsServer: any
  var httpServer: HttpServer | undefined
}

/**
 * Handle GET requests for Socket.IO connection status
 */
export async function GET(request: NextRequest) {
  try {
    const wsServer = getWebSocketServer()
    
    if (!wsServer) {
      return NextResponse.json(
        { error: 'WebSocket server not initialized', status: 'inactive' },
        { status: 503 }
      )
    }

    const stats = wsServer.getStats()
    const connectedClients = wsServer.getConnectedClients()

    return NextResponse.json({
      status: 'active',
      isReady: wsServer.isReady(),
      stats,
      connectedClients: connectedClients.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[Socket API] Error getting status:', error)
    return NextResponse.json(
      { error: 'Failed to get WebSocket status' },
      { status: 500 }
    )
  }
}

/**
 * Handle POST requests for WebSocket server operations
 */
export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()
    const wsServer = getWebSocketServer()

    if (!wsServer) {
      return NextResponse.json(
        { error: 'WebSocket server not initialized' },
        { status: 503 }
      )
    }

    switch (action) {
      case 'broadcast':
        // Broadcast a monitoring event
        if (data.event) {
          wsServer.broadcastMonitoringEvent(data.event)
          return NextResponse.json({ 
            success: true, 
            message: 'Event broadcasted',
            eventsEmitted: wsServer.getStats().eventsEmitted
          })
        }
        break

      case 'health_check':
        // Broadcast health check
        wsServer.broadcastHealthCheck(data.status, data.details)
        return NextResponse.json({ 
          success: true, 
          message: 'Health check broadcasted' 
        })

      case 'project_status':
        // Emit project status
        if (data.projectId) {
          wsServer.emitProjectStatus(data.projectId)
          return NextResponse.json({ 
            success: true, 
            message: 'Project status emitted' 
          })
        }
        break

      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        )
    }

    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[Socket API] Error handling POST request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Initialize WebSocket server on first API call
 * This is a workaround since Next.js doesn't provide direct access to the HTTP server
 */
function ensureWebSocketServer() {
  if (!global.wsServer) {
    // In a real Next.js application, you would need to access the underlying HTTP server
    // This typically requires custom server setup or using a different approach
    console.warn('[Socket API] WebSocket server requires custom Next.js server setup')
    console.warn('[Socket API] Consider using server.js with custom HTTP server')
  }
}

// Ensure WebSocket server is available
ensureWebSocketServer()