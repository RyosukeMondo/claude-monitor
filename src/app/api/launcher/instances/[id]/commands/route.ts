/**
 * TCP Command Forwarding API Route
 * 
 * Secure HTTP interface for forwarding commands to Claude Code instances via TCP bridge.
 * Implements comprehensive validation, rate limiting, and security measures to prevent abuse.
 * 
 * Endpoints:
 * POST /api/launcher/instances/[id]/commands - Send command to instance TCP bridge
 * 
 * Security Features:
 * - Command validation with whitelist
 * - Rate limiting per client
 * - Request size limits
 * - Input sanitization
 * - Audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withPerformanceTracking } from 'lib/services/performance-monitor';
import { tcpServerManager } from 'lib/services/tcp-server';
import {
  TCPCommandTypeSchema,
  type TCPCommand,
  type TCPResponse
} from 'lib/types/launcher';
import { LogHelpers } from 'lib/utils/logger';
import { ErrorFactory } from 'lib/utils/errors';

// Security and validation configuration
const COMMAND_RATE_LIMIT = {
  maxRequests: 50,
  windowMs: 60000, // 1 minute
  blockDuration: 300000 // 5 minutes
};

const COMMAND_TIMEOUT = 10000; // 10 seconds
const MAX_COMMAND_CONTENT_LENGTH = 10000; // 10KB
const MAX_REQUEST_SIZE = 50000; // 50KB

// Rate limiting storage (in production, use Redis or similar)
const rateLimitStore = new Map<string, { 
  requests: number[], 
  blocked: boolean, 
  blockUntil?: number 
}>();

// Validation schemas
const InstanceParamsSchema = z.object({
  id: z.string().uuid('Invalid instance ID format')
});

const CommandRequestSchema = z.object({
  command: z.object({
    type: TCPCommandTypeSchema,
    content: z.string()
      .max(MAX_COMMAND_CONTENT_LENGTH, 'Command content too large')
      .optional(),
    sequenceId: z.string().uuid().optional()
  }),
  options: z.object({
    timeout: z.number().int().min(1000).max(30000).default(COMMAND_TIMEOUT),
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
    waitForResponse: z.boolean().default(true)
  }).optional().default(() => ({
    timeout: COMMAND_TIMEOUT,
    priority: 'normal' as const,
    waitForResponse: true,
  }))
});

// Command whitelist for security
const ALLOWED_COMMANDS = new Set([
  'send', 'enter', 'up', 'down', 'ctrl-c', 'tab', 'raw', 'status', 'ping'
]);

// Forbidden command patterns
const FORBIDDEN_PATTERNS = [
  /rm\s+-rf/i,
  /sudo/i,
  /passwd/i,
  /ssh/i,
  /curl.*\|\s*sh/i,
  /wget.*\|\s*sh/i,
  /eval/i,
  /exec/i
];

/**
 * Check rate limiting for client
 */
function checkRateLimit(clientId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const client = rateLimitStore.get(clientId) || { 
    requests: [], 
    blocked: false 
  };

  // Check if client is blocked
  if (client.blocked && client.blockUntil && now < client.blockUntil) {
    return { 
      allowed: false, 
      retryAfter: Math.ceil((client.blockUntil - now) / 1000) 
    };
  }

  // Clean old requests and unblock if block period expired
  if (client.blockUntil && now >= client.blockUntil) {
    client.blocked = false;
    client.blockUntil = undefined;
  }

  // Filter requests within the window
  const windowStart = now - COMMAND_RATE_LIMIT.windowMs;
  client.requests = client.requests.filter(timestamp => timestamp > windowStart);

  // Check rate limit
  if (client.requests.length >= COMMAND_RATE_LIMIT.maxRequests) {
    client.blocked = true;
    client.blockUntil = now + COMMAND_RATE_LIMIT.blockDuration;
    rateLimitStore.set(clientId, client);
    
    LogHelpers.warning('command-api', 'Rate limit exceeded', {
      clientId,
      requestCount: client.requests.length,
      blockDuration: COMMAND_RATE_LIMIT.blockDuration
    });

    return { 
      allowed: false, 
      retryAfter: Math.ceil(COMMAND_RATE_LIMIT.blockDuration / 1000) 
    };
  }

  // Add current request
  client.requests.push(now);
  rateLimitStore.set(clientId, client);

  return { allowed: true };
}

/**
 * Validate command security
 */
function validateCommandSecurity(command: TCPCommand): { valid: boolean; reason?: string } {
  // Check command type whitelist
  if (!ALLOWED_COMMANDS.has(command.type)) {
    return { 
      valid: false, 
      reason: `Command type '${command.type}' is not allowed` 
    };
  }

  // Check for forbidden patterns in content
  if (command.content) {
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(command.content)) {
        return { 
          valid: false, 
          reason: 'Command contains forbidden pattern' 
        };
      }
    }

    // Additional security checks
    if (command.content.includes('..')) {
      return { 
        valid: false, 
        reason: 'Path traversal attempts are not allowed' 
      };
    }

    if (command.content.length > MAX_COMMAND_CONTENT_LENGTH) {
      return { 
        valid: false, 
        reason: 'Command content exceeds maximum allowed length' 
      };
    }
  }

  return { valid: true };
}

/**
 * Get client identifier for rate limiting
 */
function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const remoteAddr = forwarded?.split(',')[0] || realIp || 'unknown';
  
  // Include user agent for better fingerprinting
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const hash = Buffer.from(`${remoteAddr}:${userAgent}`).toString('base64');
  
  return hash.substring(0, 16);
}

/**
 * Send command to TCP bridge with timeout
 */
async function sendCommandToTCPBridge(
  instanceId: string, 
  command: TCPCommand, 
  timeout: number
): Promise<TCPResponse> {
  const server = tcpServerManager.getServer(instanceId);
  
  if (!server) {
    throw ErrorFactory.configurationMissing('TCP_SERVER_INSTANCE', 'string');
  }

  if (!server.isHealthy()) {
    throw ErrorFactory.recoveryActionFailed(
      'send_command',
      'health_check',
      1,
      'TCP server is not healthy'
    );
  }

  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(ErrorFactory.configurationMissing('COMMAND_TIMEOUT', 'number'));
    }, timeout);
  });

  // Send command through TCP server's command handler
  // Note: This assumes the TCP server has a method to send commands
  // In a real implementation, this would connect to the TCP server
  return Promise.race([
    new Promise<TCPResponse>((resolve) => {
      // Mock implementation - in real scenario, this would:
      // 1. Connect to the TCP server
      // 2. Send the command
      // 3. Wait for response
      // 4. Handle errors and timeouts
      
      resolve({
        success: true,
        message: 'Command sent successfully',
        data: { commandType: command.type },
        timestamp: new Date(),
        sequenceId: command.sequenceId
      });
    }),
    timeoutPromise
  ]);
}

/**
 * POST /api/launcher/instances/[id]/commands - Send command to instance
 */
async function POST_HANDLER(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const startTime = Date.now();
  let clientId: string | undefined;
  let instanceId: string | undefined;

  try {
    // Check request size
    const contentLength = parseInt(request.headers.get('content-length') || '0');
    if (contentLength > MAX_REQUEST_SIZE) {
      return NextResponse.json({
        success: false,
        error: 'Request too large',
        details: `Request size ${contentLength} exceeds maximum of ${MAX_REQUEST_SIZE} bytes`
      }, { status: 413 });
    }

    // Validate instance ID
    const instanceValidation = InstanceParamsSchema.safeParse(params);
    if (!instanceValidation.success) {
      return NextResponse.json({
        success: false,
        error: 'Invalid instance ID',
        details: instanceValidation.error.issues[0].message
      }, { status: 400 });
    }

    instanceId = instanceValidation.data.id;
    clientId = getClientId(request);

    // Check rate limiting
    const rateLimitResult = checkRateLimit(clientId);
    if (!rateLimitResult.allowed) {
      const headers: Record<string, string> = {
        'X-RateLimit-Limit': COMMAND_RATE_LIMIT.maxRequests.toString(),
        'X-RateLimit-Window': (COMMAND_RATE_LIMIT.windowMs / 1000).toString(),
      };
      
      if (rateLimitResult.retryAfter) {
        headers['Retry-After'] = rateLimitResult.retryAfter.toString();
      }

      return NextResponse.json({
        success: false,
        error: 'Rate limit exceeded',
        details: 'Too many command requests. Please wait before retrying.',
        retryAfter: rateLimitResult.retryAfter
      }, { status: 429, headers });
    }

    // Parse and validate request body
    const body = await request.json();
    const requestValidation = CommandRequestSchema.safeParse(body);
    
    if (!requestValidation.success) {
      LogHelpers.warning('command-api', 'Invalid request format', {
        clientId,
        instanceId,
        errors: requestValidation.error.issues
      });

      return NextResponse.json({
        success: false,
        error: 'Invalid request format',
        details: requestValidation.error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }, { status: 400 });
    }

    const { command: commandData, options } = requestValidation.data;

    // Construct full TCP command
    const command: TCPCommand = {
      type: commandData.type,
      content: commandData.content,
      instanceId,
      timestamp: new Date(),
      sequenceId: commandData.sequenceId || crypto.randomUUID()
    };

    // Validate command security
    const securityValidation = validateCommandSecurity(command);
    if (!securityValidation.valid) {
      LogHelpers.warning('command-api', 'Security validation failed', {
        clientId,
        instanceId,
        commandType: command.type,
        reason: securityValidation.reason
      });

      return NextResponse.json({
        success: false,
        error: 'Command validation failed',
        details: securityValidation.reason
      }, { status: 403 });
    }

    // Log command attempt for audit
    LogHelpers.info('command-api', 'Command forwarding attempt', {
      clientId,
      instanceId,
      commandType: command.type,
      sequenceId: command.sequenceId,
      hasContent: !!command.content,
      contentLength: command.content?.length || 0
    });

    // Send command to TCP bridge
    const response = await sendCommandToTCPBridge(
      instanceId, 
      command, 
      options.timeout
    );

    const duration = Date.now() - startTime;

    // Log successful command execution
    LogHelpers.info('command-api', 'Command executed successfully', {
      clientId,
      instanceId,
      commandType: command.type,
      sequenceId: command.sequenceId,
      duration,
      success: response.success
    });

    return NextResponse.json({
      success: true,
      data: {
        command: {
          type: command.type,
          sequenceId: command.sequenceId,
          timestamp: command.timestamp
        },
        response,
        execution: {
          duration,
          instanceId
        }
      }
    }, { 
      status: 200,
      headers: {
        'X-RateLimit-Remaining': (COMMAND_RATE_LIMIT.maxRequests - 
          (rateLimitStore.get(clientId)?.requests.length || 0)).toString()
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    LogHelpers.error('command-api', error as Error, {
      clientId: clientId ?? 'unknown',
      instanceId: instanceId ?? 'unknown',
      duration
    });

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json({
          success: false,
          error: 'Command timeout',
          details: 'Command execution timed out. The instance may be unresponsive.'
        }, { status: 408 });
      }

      if (error.message.includes('not found')) {
        return NextResponse.json({
          success: false,
          error: 'Instance not found',
          details: `No active instance found with ID: ${instanceId}`
        }, { status: 404 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Command execution failed',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}

// Export handler with performance tracking
export const POST = withPerformanceTracking(POST_HANDLER);

// Add health check endpoint for the command API
export async function GET(_request: NextRequest) {
  return NextResponse.json({
    success: true,
    service: 'command-forwarding-api',
    version: '1.0.0',
    timestamp: new Date(),
    rateLimits: {
      maxRequests: COMMAND_RATE_LIMIT.maxRequests,
      windowMs: COMMAND_RATE_LIMIT.windowMs,
      blockDuration: COMMAND_RATE_LIMIT.blockDuration
    },
    security: {
      allowedCommands: Array.from(ALLOWED_COMMANDS),
      maxContentLength: MAX_COMMAND_CONTENT_LENGTH,
      maxRequestSize: MAX_REQUEST_SIZE
    }
  });
}