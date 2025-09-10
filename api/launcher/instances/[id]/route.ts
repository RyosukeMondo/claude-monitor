/**
 * Individual Claude Launcher Instance API Route
 * 
 * RESTful endpoints for specific instance operations including status updates and command sending.
 * Supports GET for instance details, PATCH for status updates, POST for TCP commands.
 * 
 * Endpoints:
 * GET /api/launcher/instances/[id] - Get specific instance details
 * PATCH /api/launcher/instances/[id] - Update instance configuration or status
 * POST /api/launcher/instances/[id] - Send TCP command to instance
 * DELETE /api/launcher/instances/[id] - Stop and remove specific instance
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withPerformanceTracking } from '../../../../lib/services/performance-monitor';
import {
  InstanceInfoSchema,
  TCPCommandSchema,
  LauncherConfigSchema,
  type InstanceInfo,
  type TCPCommand,
  type TCPResponse
} from '../../../../lib/types/launcher';

// Validation schemas for dynamic route operations
const InstanceParamsSchema = z.object({
  id: z.string().uuid('Invalid instance ID format')
});

const UpdateInstanceRequestSchema = z.object({
  displayName: z.string().optional(),
  autoRestart: z.boolean().optional(),
  environment: z.record(z.string(), z.string()).optional(),
  claudeArgs: z.array(z.string()).optional()
});

const SendCommandRequestSchema = z.object({
  command: TCPCommandSchema.omit({ instanceId: true, timestamp: true })
});

/**
 * GET /api/launcher/instances/[id] - Get specific instance details with health metrics
 */
async function GET_HANDLER(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate instance ID parameter
    const validationResult = InstanceParamsSchema.safeParse(params);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid instance ID',
        details: validationResult.error.issues[0].message
      }, { status: 400 });
    }

    const { id: instanceId } = validationResult.data;
    const { searchParams } = new URL(request.url);
    const includeMetrics = searchParams.get('metrics') === 'true';
    const includeLogs = searchParams.get('logs') === 'true';

    // TODO: Integrate with actual launcher service
    // This would involve:
    // 1. Finding instance by ID in launcher service
    // 2. Getting current process status and health metrics
    // 3. Retrieving TCP bridge connection info
    // 4. Getting recent JSONL activity if requested
    // 5. Collecting performance metrics if requested

    // For now, return a structured response indicating the instance should exist
    // In real implementation, this would query the launcher service state

    return NextResponse.json({
      success: false,
      error: 'Instance not found',
      details: `No launcher instance found with ID: ${instanceId}`,
      suggestions: [
        'Verify the instance ID is correct',
        'Check if the instance was previously stopped',
        'Use GET /api/launcher/instances to list all active instances'
      ]
    }, { status: 404 });

  } catch (error) {
    console.error('[Launcher API] Error fetching instance details:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch instance details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * PATCH /api/launcher/instances/[id] - Update instance configuration
 */
async function PATCH_HANDLER(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate instance ID parameter
    const instanceValidation = InstanceParamsSchema.safeParse(params);
    if (!instanceValidation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid instance ID',
        details: instanceValidation.error.issues[0].message
      }, { status: 400 });
    }

    const { id: instanceId } = instanceValidation.data;
    const body = await request.json();

    // Validate request body
    const bodyValidation = UpdateInstanceRequestSchema.safeParse(body);
    if (!bodyValidation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid update data',
        details: bodyValidation.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }, { status: 400 });
    }

    const updateData = bodyValidation.data;

    // TODO: Integrate with actual launcher service
    // This would involve:
    // 1. Finding instance by ID
    // 2. Validating update is safe (instance not in critical state)
    // 3. Applying configuration changes
    // 4. Restarting TCP bridge if port/network config changed
    // 5. Updating monitoring configuration

    return NextResponse.json({
      success: false,
      error: 'Instance not found',
      details: `Cannot update instance ${instanceId}: instance does not exist`,
      suggestions: [
        'Verify the instance ID is correct',
        'Use GET /api/launcher/instances to list active instances',
        'Create a new instance if needed'
      ]
    }, { status: 404 });

  } catch (error) {
    console.error('[Launcher API] Error updating instance:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update instance',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/launcher/instances/[id] - Send TCP command to specific instance
 */
async function POST_HANDLER(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate instance ID parameter
    const instanceValidation = InstanceParamsSchema.safeParse(params);
    if (!instanceValidation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid instance ID',
        details: instanceValidation.error.issues[0].message
      }, { status: 400 });
    }

    const { id: instanceId } = instanceValidation.data;
    const body = await request.json();

    // Validate command data
    const commandValidation = SendCommandRequestSchema.safeParse(body);
    if (!commandValidation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid command data',
        details: commandValidation.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }, { status: 400 });
    }

    const { command } = commandValidation.data;

    // Construct full TCP command with instance ID and timestamp
    const fullCommand: TCPCommand = {
      ...command,
      instanceId,
      timestamp: new Date(),
      sequenceId: crypto.randomUUID()
    };

    // TODO: Integrate with actual TCP bridge service
    // This would involve:
    // 1. Finding instance and verifying it's running
    // 2. Connecting to TCP bridge for the instance
    // 3. Sending command through TCP connection
    // 4. Waiting for response with timeout
    // 5. Logging command execution for audit

    // For now, return structured response indicating command would be sent
    const mockResponse: TCPResponse = {
      success: false,
      message: `Cannot send command to instance ${instanceId}: instance not found or not running`,
      timestamp: new Date(),
      sequenceId: fullCommand.sequenceId
    };

    return NextResponse.json({
      success: false,
      error: 'Command execution failed',
      data: {
        command: fullCommand,
        response: mockResponse,
        instanceId
      },
      details: 'Instance not available for command execution',
      suggestions: [
        'Verify instance is running with GET /api/launcher/instances',
        'Check instance status and TCP bridge connectivity',
        'Restart instance if needed'
      ]
    }, { status: 404 });

  } catch (error) {
    console.error('[Launcher API] Error sending command to instance:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send command to instance',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/launcher/instances/[id] - Stop and remove specific instance
 */
async function DELETE_HANDLER(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate instance ID parameter
    const validationResult = InstanceParamsSchema.safeParse(params);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid instance ID',
        details: validationResult.error.issues[0].message
      }, { status: 400 });
    }

    const { id: instanceId } = validationResult.data;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    const gracePeriod = parseInt(searchParams.get('gracePeriod') || '5000');

    // TODO: Integrate with actual launcher service
    // This would involve:
    // 1. Finding instance by ID
    // 2. Checking if graceful shutdown is possible
    // 3. Sending shutdown signal to Claude Code process
    // 4. Waiting for graceful exit (with timeout)
    // 5. Force killing if needed and force=true
    // 6. Cleaning up TCP bridge and monitoring

    return NextResponse.json({
      success: false,
      error: 'Instance not found',
      details: `Cannot delete instance ${instanceId}: instance does not exist`,
      suggestions: [
        'Verify the instance ID is correct',
        'Use GET /api/launcher/instances to list active instances',
        'Instance may have already been stopped'
      ]
    }, { status: 404 });

  } catch (error) {
    console.error('[Launcher API] Error deleting instance:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete instance',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Export handlers with performance tracking
export const GET = withPerformanceTracking(GET_HANDLER);
export const PATCH = withPerformanceTracking(PATCH_HANDLER);
export const POST = withPerformanceTracking(POST_HANDLER);
export const DELETE = withPerformanceTracking(DELETE_HANDLER);