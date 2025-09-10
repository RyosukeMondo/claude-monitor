/**
 * Projects API Route
 * 
 * RESTful API endpoints for project management operations.
 * Converts functionality from Python daemon project management to Next.js API routes.
 * 
 * Endpoints:
 * GET /api/projects - List all monitored projects
 * POST /api/projects - Add project to monitoring
 * PUT /api/projects - Update project monitoring settings
 * DELETE /api/projects - Remove project from monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabase } from '../../lib/database/client';

// Validation schemas using Zod
const ProjectRequestSchema = z.object({
  projectPath: z.string().min(1, 'Project path is required'),
  displayName: z.string().optional(),
  monitoring: z.boolean().optional().default(true),
  recoverySettings: z.object({
    autoRecover: z.boolean().default(true),
    recoveryCommands: z.array(z.string()).default(['/clear']),
    maxRetries: z.number().min(0).max(10).default(3),
    retryDelay: z.number().min(0).max(300).default(30)
  }).optional()
});

const ProjectUpdateSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
  displayName: z.string().optional(),
  monitoring: z.boolean().optional(),
  recoverySettings: z.object({
    autoRecover: z.boolean().optional(),
    recoveryCommands: z.array(z.string()).optional(),
    maxRetries: z.number().min(0).max(10).optional(),
    retryDelay: z.number().min(0).max(300).optional()
  }).optional()
});

const ProjectDeleteSchema = z.object({
  projectPath: z.string().min(1, 'Project path is required')
});

/**
 * GET /api/projects - List all monitored projects
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase();
    
    // Get projects with their session counts and recent activity
    const projects = await db.project.findMany({
      include: {
        sessions: {
          select: {
            id: true,
            isActive: true,
            lastActivity: true,
            eventCount: true
          }
        }
      },
      orderBy: {
        lastActivity: 'desc'
      }
    });

    // Transform data for response
    const projectsData = projects.map(project => ({
      id: project.id,
      projectPath: project.projectPath,
      displayName: project.displayName,
      encodedPath: project.encodedPath,
      monitoring: project.monitoring,
      currentState: project.currentState,
      lastActivity: project.lastActivity,
      recoverySettings: project.recoverySettings,
      sessionCount: project.sessions.length,
      activeSessions: project.sessions.filter(s => s.isActive).length,
      totalEvents: project.sessions.reduce((sum, s) => sum + (s.eventCount || 0), 0),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        projects: projectsData,
        totalProjects: projectsData.length,
        activeProjects: projectsData.filter(p => p.monitoring).length
      }
    });

  } catch (error) {
    console.error('[Projects API] Error fetching projects:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch projects',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/projects - Add project to monitoring
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request data
    const validationResult = ProjectRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { projectPath, displayName, monitoring, recoverySettings } = validationResult.data;
    const db = await getDatabase();

    // Check if project already exists
    const existingProject = await db.project.findUnique({
      where: { projectPath }
    });

    if (existingProject) {
      return NextResponse.json({
        success: false,
        error: 'Project already exists',
        details: `Project at path '${projectPath}' is already being monitored`
      }, { status: 409 });
    }

    // Generate encoded path (convert slashes and special chars)
    const encodedPath = projectPath
      .replace(/^\//, '')
      .replace(/\//g, '-')
      .replace(/[^a-zA-Z0-9\-_]/g, '-');

    // Create new project
    const project = await db.project.create({
      data: {
        projectPath,
        displayName: displayName || projectPath.split('/').pop() || projectPath,
        encodedPath,
        monitoring: monitoring ?? true,
        currentState: 'UNKNOWN',
        recoverySettings: recoverySettings || {
          autoRecover: true,
          recoveryCommands: ['/clear'],
          maxRetries: 3,
          retryDelay: 30
        },
        lastActivity: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        project: {
          id: project.id,
          projectPath: project.projectPath,
          displayName: project.displayName,
          encodedPath: project.encodedPath,
          monitoring: project.monitoring,
          currentState: project.currentState,
          recoverySettings: project.recoverySettings,
          createdAt: project.createdAt
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[Projects API] Error creating project:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create project',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * PUT /api/projects - Update project monitoring settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request data
    const validationResult = ProjectUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { id, displayName, monitoring, recoverySettings } = validationResult.data;
    const db = await getDatabase();

    // Check if project exists
    const existingProject = await db.project.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return NextResponse.json({
        success: false,
        error: 'Project not found',
        details: `Project with ID '${id}' does not exist`
      }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }

    if (monitoring !== undefined) {
      updateData.monitoring = monitoring;
    }

    if (recoverySettings !== undefined) {
      // Merge with existing recovery settings
      updateData.recoverySettings = {
        ...existingProject.recoverySettings,
        ...recoverySettings
      };
    }

    // Update project
    const updatedProject = await db.project.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      data: {
        project: {
          id: updatedProject.id,
          projectPath: updatedProject.projectPath,
          displayName: updatedProject.displayName,
          encodedPath: updatedProject.encodedPath,
          monitoring: updatedProject.monitoring,
          currentState: updatedProject.currentState,
          recoverySettings: updatedProject.recoverySettings,
          lastActivity: updatedProject.lastActivity,
          updatedAt: updatedProject.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('[Projects API] Error updating project:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update project',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/projects - Remove project from monitoring
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request data
    const validationResult = ProjectDeleteSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { projectPath } = validationResult.data;
    const db = await getDatabase();

    // Check if project exists
    const existingProject = await db.project.findUnique({
      where: { projectPath },
      include: {
        sessions: {
          select: { id: true }
        }
      }
    });

    if (!existingProject) {
      return NextResponse.json({
        success: false,
        error: 'Project not found',
        details: `Project at path '${projectPath}' does not exist`
      }, { status: 404 });
    }

    // Delete associated sessions first (cascade delete)
    await db.session.deleteMany({
      where: {
        projectId: existingProject.id
      }
    });

    // Delete project
    await db.project.delete({
      where: { projectPath }
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Project '${projectPath}' removed from monitoring`,
        deletedSessions: existingProject.sessions.length
      }
    });

  } catch (error) {
    console.error('[Projects API] Error deleting project:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete project',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}