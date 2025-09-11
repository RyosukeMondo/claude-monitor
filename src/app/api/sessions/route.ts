/**
 * Sessions API Route
 * 
 * RESTful API endpoints for session management operations.
 * Handles Claude Code conversation session monitoring and management.
 * 
 * Endpoints:
 * GET /api/sessions - List sessions with optional filtering
 * POST /api/sessions - Create/register new session for monitoring
 * PUT /api/sessions - Update session information
 * DELETE /api/sessions - Remove session from monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/database/client';

// Validation schemas using Zod
const SessionRequestSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  projectPath: z.string().min(1, 'Project path is required'),
  jsonlFilePath: z.string().min(1, 'JSONL file path is required'),
  isActive: z.boolean().optional().default(true),
  metadata: z.record(z.string(), z.any()).optional().default({})
});

const SessionUpdateSchema = z.object({
  id: z.string().min(1, 'Session ID is required'),
  isActive: z.boolean().optional(),
  eventCount: z.number().int().min(0).optional(),
  lastActivity: z.date().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

const SessionQuerySchema = z.object({
  projectPath: z.string().optional(),
  projectId: z.string().optional(),
  isActive: z.boolean().optional(),
  limit: z.number().int().min(1).max(1000).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
  sortBy: z.enum(['lastActivity', 'startTime', 'eventCount']).optional().default('lastActivity'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

const SessionDeleteSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required')
});

/**
 * GET /api/sessions - List sessions with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const queryParams = {
      projectPath: searchParams.get('projectPath') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      sortBy: searchParams.get('sortBy') as 'lastActivity' | 'startTime' | 'eventCount' || 'lastActivity',
      sortOrder: searchParams.get('sortOrder') as 'asc' | 'desc' || 'desc'
    };

    // Validate query parameters
    const validationResult = SessionQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { projectPath, projectId, isActive, limit, offset, sortBy, sortOrder } = validationResult.data;
    const db = prisma;

    // Build where clause for filtering
    const whereClause: any = {};
    
    if (projectPath) {
      whereClause.project = { projectPath };
    } else if (projectId) {
      whereClause.projectId = projectId;
    }
    
    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    // Get sessions with project information
    const sessions = await db.session.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            projectPath: true,
            displayName: true,
            encodedPath: true,
            currentState: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip: offset,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await db.session.count({
      where: whereClause
    });

    // Transform data for response
    const sessionsData = sessions.map(session => ({
      id: session.id,
      sessionId: session.sessionId,
      projectId: session.projectId,
      project: session.project,
      jsonlFilePath: session.jsonlFilePath,
      isActive: session.isActive,
      eventCount: session.eventCount,
      startTime: session.startTime,
      lastActivity: session.lastActivity,
      metadata: session.metadata,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        sessions: sessionsData,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      }
    });

  } catch (error) {
    console.error('[Sessions API] Error fetching sessions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch sessions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/sessions - Create/register new session for monitoring
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request data
    const validationResult = SessionRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { sessionId, projectPath, jsonlFilePath, isActive, metadata } = validationResult.data;
    const db = prisma;

    // Find the project
    const project = await db.project.findUnique({
      where: { projectPath }
    });

    if (!project) {
      return NextResponse.json({
        success: false,
        error: 'Project not found',
        details: `Project at path '${projectPath}' does not exist. Create the project first.`
      }, { status: 404 });
    }

    // Check if session already exists
    const existingSession = await db.session.findUnique({
      where: { sessionId }
    });

    if (existingSession) {
      return NextResponse.json({
        success: false,
        error: 'Session already exists',
        details: `Session '${sessionId}' is already registered`
      }, { status: 409 });
    }

    // Create new session
    const session = await db.session.create({
      data: {
        sessionId,
        projectId: project.id,
        jsonlFilePath,
        isActive: isActive ?? true,
        eventCount: 0,
        startTime: new Date(),
        lastActivity: new Date(),
        metadata: metadata || {}
      },
      include: {
        project: {
          select: {
            id: true,
            projectPath: true,
            displayName: true,
            encodedPath: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: session.id,
          sessionId: session.sessionId,
          projectId: session.projectId,
          project: session.project,
          jsonlFilePath: session.jsonlFilePath,
          isActive: session.isActive,
          eventCount: session.eventCount,
          startTime: session.startTime,
          lastActivity: session.lastActivity,
          metadata: session.metadata,
          createdAt: session.createdAt
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[Sessions API] Error creating session:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * PUT /api/sessions - Update session information
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request data
    const validationResult = SessionUpdateSchema.safeParse({
      ...body,
      lastActivity: body.lastActivity ? new Date(body.lastActivity) : undefined
    });
    
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { id, isActive, eventCount, lastActivity, metadata } = validationResult.data;
    const db = prisma;

    // Check if session exists
    const existingSession = await db.session.findUnique({
      where: { id }
    });

    if (!existingSession) {
      return NextResponse.json({
        success: false,
        error: 'Session not found',
        details: `Session with ID '${id}' does not exist`
      }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (isActive !== undefined) {
      updateData.isActive = isActive;
    }

    if (eventCount !== undefined) {
      updateData.eventCount = eventCount;
    }

    if (lastActivity !== undefined) {
      updateData.lastActivity = lastActivity;
    }

    if (metadata !== undefined) {
      // Merge with existing metadata
      updateData.metadata = {
        ...existingSession.metadata,
        ...metadata
      };
    }

    // Update session
    const updatedSession = await db.session.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            projectPath: true,
            displayName: true,
            encodedPath: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: updatedSession.id,
          sessionId: updatedSession.sessionId,
          projectId: updatedSession.projectId,
          project: updatedSession.project,
          jsonlFilePath: updatedSession.jsonlFilePath,
          isActive: updatedSession.isActive,
          eventCount: updatedSession.eventCount,
          startTime: updatedSession.startTime,
          lastActivity: updatedSession.lastActivity,
          metadata: updatedSession.metadata,
          updatedAt: updatedSession.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('[Sessions API] Error updating session:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/sessions - Remove session from monitoring
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request data
    const validationResult = SessionDeleteSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { sessionId } = validationResult.data;
    const db = prisma;

    // Check if session exists
    const existingSession = await db.session.findUnique({
      where: { sessionId },
      include: {
        project: {
          select: {
            projectPath: true,
            displayName: true
          }
        }
      }
    });

    if (!existingSession) {
      return NextResponse.json({
        success: false,
        error: 'Session not found',
        details: `Session '${sessionId}' does not exist`
      }, { status: 404 });
    }

    // Delete session
    await db.session.delete({
      where: { sessionId }
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Session '${sessionId}' removed from monitoring`,
        projectPath: existingSession.project.projectPath,
        projectName: existingSession.project.displayName
      }
    });

  } catch (error) {
    console.error('[Sessions API] Error deleting session:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete session',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}