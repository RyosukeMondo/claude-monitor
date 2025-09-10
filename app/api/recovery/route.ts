/**
 * Recovery API Route
 * 
 * RESTful API endpoints for recovery action management.
 * Converts Python daemon recovery logic to Next.js API routes for executing
 * recovery commands and managing recovery state.
 * 
 * Endpoints:
 * GET /api/recovery - Get recovery status and history
 * POST /api/recovery - Execute recovery action
 * PUT /api/recovery - Update recovery settings
 * DELETE /api/recovery - Cancel ongoing recovery action
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getDatabase } from '../../lib/database/client';
import { executeRecoveryAction, validateRecoveryConditions } from '../../lib/services/recovery-actions';

// Validation schemas using Zod
const RecoveryExecuteSchema = z.object({
  projectPath: z.string().min(1, 'Project path is required'),
  action: z.enum(['clear', 'custom_command', 'restart_session', 'force_recovery']),
  command: z.string().optional(),
  parameters: z.record(z.string(), z.any()).optional().default({}),
  force: z.boolean().optional().default(false),
  timeout: z.number().int().min(1).max(300).optional().default(30)
});

const RecoveryStatusSchema = z.object({
  projectPath: z.string().optional(),
  projectId: z.string().optional(),
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']).optional(),
  actionType: z.enum(['clear', 'custom_command', 'restart_session', 'force_recovery']).optional()
});

const RecoveryUpdateSchema = z.object({
  projectPath: z.string().min(1, 'Project path is required'),
  recoverySettings: z.object({
    autoRecover: z.boolean().optional(),
    recoveryCommands: z.array(z.string()).optional(),
    maxRetries: z.number().min(0).max(10).optional(),
    retryDelay: z.number().min(0).max(300).optional(),
    recoveryTimeout: z.number().min(10).max(300).optional(),
    enabledActions: z.array(z.enum(['clear', 'custom_command', 'restart_session', 'force_recovery'])).optional()
  })
});

const RecoveryCancelSchema = z.object({
  projectPath: z.string().min(1, 'Project path is required'),
  actionId: z.string().optional()
});

/**
 * GET /api/recovery - Get recovery status and history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const queryParams = {
      projectPath: searchParams.get('projectPath') || undefined,
      projectId: searchParams.get('projectId') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
      status: searchParams.get('status') as 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' || undefined,
      actionType: searchParams.get('actionType') as 'clear' | 'custom_command' | 'restart_session' | 'force_recovery' || undefined
    };

    // Validate query parameters
    const validationResult = RecoveryStatusSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid query parameters',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { projectPath, projectId, limit, offset, status, actionType } = validationResult.data;
    const db = await getDatabase();

    // Build where clause for filtering
    const whereClause: any = {};
    
    if (projectPath) {
      whereClause.project = { projectPath };
    } else if (projectId) {
      whereClause.projectId = projectId;
    }
    
    if (status) {
      whereClause.status = status;
    }

    if (actionType) {
      whereClause.actionType = actionType;
    }

    // Get recovery actions with project information
    const recoveryActions = await db.recoveryAction.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            projectPath: true,
            displayName: true,
            currentState: true,
            recoverySettings: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await db.recoveryAction.count({
      where: whereClause
    });

    // Get current recovery status for projects
    const currentRecoveryStatus = await db.recoveryAction.findMany({
      where: {
        ...whereClause,
        status: {
          in: ['pending', 'in_progress']
        }
      },
      include: {
        project: {
          select: {
            projectPath: true,
            displayName: true,
            currentState: true
          }
        }
      }
    });

    // Transform data for response
    const actionsData = recoveryActions.map(action => ({
      id: action.id,
      projectId: action.projectId,
      project: action.project,
      actionType: action.actionType,
      command: action.command,
      parameters: action.parameters,
      status: action.status,
      result: action.result,
      errorMessage: action.errorMessage,
      executionTime: action.executionTime,
      retryCount: action.retryCount,
      createdAt: action.createdAt,
      updatedAt: action.updatedAt,
      completedAt: action.completedAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        recoveryActions: actionsData,
        currentlyActive: currentRecoveryStatus.map(action => ({
          id: action.id,
          projectPath: action.project.projectPath,
          projectName: action.project.displayName,
          actionType: action.actionType,
          status: action.status,
          createdAt: action.createdAt
        })),
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        }
      }
    });

  } catch (error) {
    console.error('[Recovery API] Error fetching recovery status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch recovery status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/recovery - Execute recovery action
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request data
    const validationResult = RecoveryExecuteSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { projectPath, action, command, parameters, force, timeout } = validationResult.data;
    const db = await getDatabase();

    // Find the project
    const project = await db.project.findUnique({
      where: { projectPath },
      include: {
        sessions: {
          where: { isActive: true },
          orderBy: { lastActivity: 'desc' },
          take: 1
        }
      }
    });

    if (!project) {
      return NextResponse.json({
        success: false,
        error: 'Project not found',
        details: `Project at path '${projectPath}' does not exist`
      }, { status: 404 });
    }

    // Check if recovery is needed and allowed (unless forced)
    if (!force) {
      const validationResult = await validateRecoveryConditions(project, action);
      if (!validationResult.allowed) {
        return NextResponse.json({
          success: false,
          error: 'Recovery action not allowed',
          details: validationResult.reason,
          suggestions: validationResult.suggestions
        }, { status: 422 });
      }
    }

    // Check for existing active recovery actions for this project
    const existingAction = await db.recoveryAction.findFirst({
      where: {
        projectId: project.id,
        status: {
          in: ['pending', 'in_progress']
        }
      }
    });

    if (existingAction && !force) {
      return NextResponse.json({
        success: false,
        error: 'Recovery action already in progress',
        details: `${existingAction.actionType} action is currently ${existingAction.status} for this project`,
        activeActionId: existingAction.id
      }, { status: 409 });
    }

    // Create recovery action record
    const recoveryAction = await db.recoveryAction.create({
      data: {
        projectId: project.id,
        actionType: action,
        command: command || (action === 'clear' ? '/clear' : undefined),
        parameters: parameters || {},
        status: 'pending',
        retryCount: 0,
        timeout
      }
    });

    // Execute recovery action asynchronously
    try {
      // Update status to in_progress
      await db.recoveryAction.update({
        where: { id: recoveryAction.id },
        data: { 
          status: 'in_progress',
          updatedAt: new Date()
        }
      });

      // Execute the recovery action
      const executionResult = await executeRecoveryAction({
        projectPath,
        actionType: action,
        command: command || (action === 'clear' ? '/clear' : ''),
        parameters: parameters || {},
        timeout,
        session: project.sessions[0] || null
      });

      // Update recovery action with results
      const updateData: any = {
        status: executionResult.success ? 'completed' : 'failed',
        result: executionResult.result,
        executionTime: executionResult.executionTime,
        completedAt: new Date(),
        updatedAt: new Date()
      };

      if (!executionResult.success && executionResult.error) {
        updateData.errorMessage = executionResult.error;
      }

      await db.recoveryAction.update({
        where: { id: recoveryAction.id },
        data: updateData
      });

      return NextResponse.json({
        success: true,
        data: {
          recoveryAction: {
            id: recoveryAction.id,
            projectPath: project.projectPath,
            actionType: action,
            command: updateData.result?.command || command,
            status: updateData.status,
            result: updateData.result,
            executionTime: updateData.executionTime,
            createdAt: recoveryAction.createdAt,
            completedAt: updateData.completedAt
          },
          execution: executionResult
        }
      }, { status: 201 });

    } catch (executionError) {
      // Update recovery action with error
      await db.recoveryAction.update({
        where: { id: recoveryAction.id },
        data: {
          status: 'failed',
          errorMessage: executionError instanceof Error ? executionError.message : 'Unknown execution error',
          completedAt: new Date(),
          updatedAt: new Date()
        }
      });

      throw executionError;
    }

  } catch (error) {
    console.error('[Recovery API] Error executing recovery action:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to execute recovery action',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * PUT /api/recovery - Update recovery settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request data
    const validationResult = RecoveryUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { projectPath, recoverySettings } = validationResult.data;
    const db = await getDatabase();

    // Check if project exists
    const existingProject = await db.project.findUnique({
      where: { projectPath }
    });

    if (!existingProject) {
      return NextResponse.json({
        success: false,
        error: 'Project not found',
        details: `Project at path '${projectPath}' does not exist`
      }, { status: 404 });
    }

    // Merge with existing recovery settings
    const updatedSettings = {
      ...existingProject.recoverySettings,
      ...recoverySettings
    };

    // Update project recovery settings
    const updatedProject = await db.project.update({
      where: { projectPath },
      data: {
        recoverySettings: updatedSettings,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        projectPath: updatedProject.projectPath,
        displayName: updatedProject.displayName,
        recoverySettings: updatedProject.recoverySettings,
        updatedAt: updatedProject.updatedAt
      }
    });

  } catch (error) {
    console.error('[Recovery API] Error updating recovery settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update recovery settings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/recovery - Cancel ongoing recovery action
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request data
    const validationResult = RecoveryCancelSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: validationResult.error.errors
      }, { status: 400 });
    }

    const { projectPath, actionId } = validationResult.data;
    const db = await getDatabase();

    // Find the project
    const project = await db.project.findUnique({
      where: { projectPath }
    });

    if (!project) {
      return NextResponse.json({
        success: false,
        error: 'Project not found',
        details: `Project at path '${projectPath}' does not exist`
      }, { status: 404 });
    }

    // Build where clause for finding recovery action
    const whereClause: any = {
      projectId: project.id,
      status: {
        in: ['pending', 'in_progress']
      }
    };

    if (actionId) {
      whereClause.id = actionId;
    }

    // Find active recovery action
    const activeAction = await db.recoveryAction.findFirst({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    if (!activeAction) {
      return NextResponse.json({
        success: false,
        error: 'No active recovery action found',
        details: actionId 
          ? `Recovery action '${actionId}' not found or not active`
          : `No active recovery actions found for project '${projectPath}'`
      }, { status: 404 });
    }

    // Cancel the recovery action
    const cancelledAction = await db.recoveryAction.update({
      where: { id: activeAction.id },
      data: {
        status: 'cancelled',
        errorMessage: 'Recovery action cancelled by user',
        completedAt: new Date(),
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Recovery action cancelled successfully`,
        cancelledAction: {
          id: cancelledAction.id,
          actionType: cancelledAction.actionType,
          status: cancelledAction.status,
          cancelledAt: cancelledAction.completedAt
        }
      }
    });

  } catch (error) {
    console.error('[Recovery API] Error cancelling recovery action:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to cancel recovery action',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}