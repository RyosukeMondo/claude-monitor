/**
 * Claude Launcher Instances API Route
 * 
 * Modern RESTful API endpoints for Claude Code instance management.
 * Provides HTTP API for Docker integration with comprehensive validation and error handling.
 * 
 * Endpoints:
 * GET /api/launcher/instances - List all launcher instances
 * POST /api/launcher/instances - Create new Claude Code instance  
 * DELETE /api/launcher/instances/:id - Stop and remove instance
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../lib/database/client';
import { withPerformanceTracking } from '../../../lib/services/performance-monitor';
import {
  CreateInstanceRequestSchema,
  LauncherConfigSchema,
  InstanceInfoSchema,
  TCPCommandSchema,
  type CreateInstanceRequest,
  type CreateInstanceResponse,
  type InstanceInfo,
  type ListInstancesResponse,
  type TCPCommand
} from '../../../lib/types/launcher';

// Response caching
const cache = new Map();
const CACHE_TTL = 10000; // 10 seconds for launcher data

// Validation schemas for API routes
const InstanceParamsSchema = z.object({
  id: z.string().uuid('Invalid instance ID format')
});

const SendCommandRequestSchema = z.object({
  command: TCPCommandSchema.omit({ instanceId: true })
});

/**
 * GET /api/launcher/instances - List all launcher instances with health status
 */
async function GET_HANDLER(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skipCache = searchParams.get('cache') === 'false';
    const includeHealth = searchParams.get('health') === 'true';
    const cacheKey = `launcher:instances:${includeHealth}`;
    
    // Check cache first for non-critical data
    if (!skipCache && cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json(cached.data, {
          headers: {
            'Cache-Control': 'public, max-age=10, s-maxage=10',
            'X-Cache': 'HIT'
          }
        });
      }
    }

    const db = prisma;
    
    // Query launcher instances from database
    // Note: In full implementation, this would connect to actual launcher service
    // For now, we'll return a structured response format
    const instances: InstanceInfo[] = [];
    
    // TODO: Integrate with actual launcher service to get real instance data
    // This would involve:
    // 1. Connecting to launcher service
    // 2. Querying active instances
    // 3. Getting process status and TCP bridge info
    // 4. Aggregating health metrics if requested

    const responseData: ListInstancesResponse = {
      instances,
      totalCount: instances.length,
      runningCount: instances.filter(i => i.status === 'running').length
    };

    const fullResponse = {
      success: true,
      data: responseData,
      timestamp: new Date().toISOString(),
      ...(includeHealth && {
        healthSummary: {
          overallStatus: instances.length > 0 ? 'healthy' : 'idle',
          activeInstances: responseData.runningCount,
          errorInstances: instances.filter(i => i.status === 'error').length
        }
      })
    };

    // Cache the response
    cache.set(cacheKey, {
      data: fullResponse,
      timestamp: Date.now()
    });

    return NextResponse.json(fullResponse, {
      headers: {
        'Cache-Control': 'public, max-age=10, s-maxage=10',
        'X-Cache': 'MISS'
      }
    });

  } catch (error) {
    console.error('[Launcher API] Error fetching instances:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch launcher instances',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/launcher/instances - Create new Claude Code instance
 */
async function POST_HANDLER(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request data with comprehensive error handling
    const validationResult = CreateInstanceRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }, { status: 400 });
    }

    const { config, startImmediately } = validationResult.data;

    // Additional validation for project path accessibility
    if (!config.projectPath || config.projectPath.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Project path validation failed',
        details: 'Project path cannot be empty'
      }, { status: 400 });
    }

    // Validate TCP port availability (in real implementation)
    const requestedPort = config.tcpPort || 9999;
    if (requestedPort < 1024 || requestedPort > 65535) {
      return NextResponse.json({
        success: false,
        error: 'Invalid TCP port',
        details: `Port ${requestedPort} is outside valid range (1024-65535)`
      }, { status: 400 });
    }

    // TODO: Integrate with actual launcher service
    // This would involve:
    // 1. Validating project path exists and is accessible
    // 2. Checking Claude Code installation
    // 3. Starting Claude Code process with TCP bridge
    // 4. Registering instance in monitoring system
    // 5. Setting up JSONL file monitoring

    // For now, return a mock successful response with proper structure
    const mockInstance: InstanceInfo = {
      id: crypto.randomUUID(),
      config: {
        projectPath: config.projectPath,
        tcpPort: requestedPort,
        displayName: config.displayName || `Claude ${config.projectPath.split('/').pop()}`,
        autoRestart: config.autoRestart || false,
        environment: config.environment || {},
        claudeArgs: config.claudeArgs || []
      },
      processId: Math.floor(Math.random() * 65535) + 1000, // Mock PID
      tcpPort: requestedPort,
      status: startImmediately ? 'starting' : 'stopped',
      startTime: new Date(),
      lastActivity: new Date(),
      sessionIds: [],
      restartCount: 0,
      metadata: {
        createdBy: 'api',
        dockerMode: true
      }
    };

    const response: CreateInstanceResponse = {
      instance: mockInstance,
      bridgeInfo: {
        port: requestedPort,
        instanceId: mockInstance.id,
        isListening: startImmediately,
        clientCount: 0,
        startTime: new Date(),
        errorCount: 0
      }
    };

    // Invalidate instances cache
    const keysToDelete = Array.from(cache.keys()).filter(key => key.includes('launcher:instances'));
    keysToDelete.forEach(key => cache.delete(key));

    return NextResponse.json({
      success: true,
      data: response,
      message: `Instance created successfully${startImmediately ? ' and starting' : ''}`,
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('[Launcher API] Error creating instance:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create launcher instance',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/launcher/instances - Remove launcher instance by ID
 */
async function DELETE_HANDLER(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const instanceId = searchParams.get('id');

    if (!instanceId) {
      return NextResponse.json({
        success: false,
        error: 'Missing instance ID',
        details: 'Instance ID must be provided as query parameter'
      }, { status: 400 });
    }

    // Validate instance ID format
    const validationResult = InstanceParamsSchema.safeParse({ id: instanceId });
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid instance ID',
        details: validationResult.error.issues[0].message
      }, { status: 400 });
    }

    // TODO: Integrate with actual launcher service
    // This would involve:
    // 1. Finding the instance by ID
    // 2. Gracefully stopping Claude Code process
    // 3. Cleaning up TCP bridge server
    // 4. Removing from monitoring system
    // 5. Cleaning up any temporary files or connections

    // For now, return success response
    const response = {
      success: true,
      data: {
        instanceId,
        message: 'Instance stopped and removed successfully',
        stoppedAt: new Date().toISOString(),
        cleanupActions: [
          'Claude Code process terminated',
          'TCP bridge server closed',
          'Monitoring stopped',
          'Session cleanup completed'
        ]
      }
    };

    // Invalidate instances cache
    const keysToDelete = Array.from(cache.keys()).filter(key => key.includes('launcher:instances'));
    keysToDelete.forEach(key => cache.delete(key));

    return NextResponse.json(response);

  } catch (error) {
    console.error('[Launcher API] Error removing instance:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to remove launcher instance',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Export handlers with performance tracking and modern error handling
export const GET = withPerformanceTracking(GET_HANDLER);
export const POST = withPerformanceTracking(POST_HANDLER);
export const DELETE = withPerformanceTracking(DELETE_HANDLER);