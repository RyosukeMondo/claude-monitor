/**
 * Centralized error handling system for Claude Monitor
 * 
 * Provides consistent error processing, recovery strategies, and logging
 * throughout the Next.js application.
 */

import { NextResponse } from 'next/server';
import { 
  MonitorError, 
  isMonitorError, 
  isRecoverableError, 
  getErrorComponent,
  FileSystemError,
  JSONLParsingError,
  ProjectError,
  StateDetectionError,
  RecoveryError,
  WebSocketError,
  APIError,
  ConfigurationError,
  PerformanceError
} from './errors';
import { getGlobalLogger, LogHelpers } from './logger';

export interface ErrorHandlerOptions {
  logError?: boolean;
  includeStack?: boolean;
  notifyUser?: boolean;
  attemptRecovery?: boolean;
  component?: string;
}

export interface ErrorHandlerResult {
  handled: boolean;
  recoverable: boolean;
  shouldRetry: boolean;
  retryAfter?: number;
  userMessage: string;
  logData: Record<string, unknown>;
}

export interface RecoveryStrategy {
  canRecover: (error: MonitorError) => boolean;
  recover: (error: MonitorError) => Promise<boolean>;
  maxAttempts: number;
  backoffMs: number;
}

/**
 * Central error handler class
 */
export class ErrorHandler {
  private recoveryStrategies: Map<string, RecoveryStrategy> = new Map();
  private retryCount: Map<string, number> = new Map();

  constructor() {
    this.registerDefaultRecoveryStrategies();
  }

  /**
   * Handle any error with comprehensive processing
   */
  async handleError(
    error: Error | MonitorError | unknown,
    options: ErrorHandlerOptions = {}
  ): Promise<ErrorHandlerResult> {
    const {
      logError = true,
      includeStack = true,
      notifyUser = false,
      attemptRecovery = true,
      component = 'error-handler'
    } = options;

    // Convert unknown errors to structured format
    const structuredError = this.normalizeError(error, component);
    
    // Log the error
    if (logError) {
      LogHelpers.error(component, structuredError, undefined);
    }

    // Determine if error is recoverable
    const recoverable = isRecoverableError(structuredError);
    let shouldRetry = false;
    let retryAfter: number | undefined;

    // Attempt recovery if enabled and error is recoverable
    if (attemptRecovery && recoverable) {
      const recoveryResult = await this.attemptRecovery(structuredError);
      shouldRetry = recoveryResult.canRetry;
      retryAfter = recoveryResult.retryAfter;
    }

    // Generate user-friendly message
    const userMessage = this.generateUserMessage(structuredError, notifyUser);

    // Create log data for structured logging
    const logData = this.createLogData(structuredError, {
      handled: true,
      recoverable,
      shouldRetry,
      retryAfter,
      includeStack
    });

    return {
      handled: true,
      recoverable,
      shouldRetry,
      retryAfter,
      userMessage,
      logData
    };
  }

  /**
   * Handle API route errors with Next.js responses
   */
  handleAPIError(
    error: Error | MonitorError | unknown,
    component: string = 'api'
  ): NextResponse {
    const structuredError = this.normalizeError(error, component);
    
    LogHelpers.error(component, structuredError);

    if (structuredError instanceof APIError) {
      return NextResponse.json(
        {
          error: structuredError.message,
          code: structuredError.code,
          component: structuredError.component,
          timestamp: structuredError.timestamp
        },
        { status: structuredError.statusCode || 500 }
      );
    }

    if (structuredError instanceof ConfigurationError) {
      return NextResponse.json(
        { 
          error: 'Configuration error', 
          message: structuredError.message,
          code: structuredError.code
        },
        { status: 500 }
      );
    }

    if (structuredError instanceof FileSystemError) {
      return NextResponse.json(
        { 
          error: 'File system error', 
          message: structuredError.message,
          code: structuredError.code
        },
        { status: 404 }
      );
    }

    // Default error response
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: structuredError.message,
        code: structuredError.code || 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }

  /**
   * Handle WebSocket errors
   */
  handleWebSocketError(
    error: Error | MonitorError | unknown,
    socket: any,
    component: string = 'websocket'
  ): void {
    const structuredError = this.normalizeError(error, component);
    
    LogHelpers.error(component, structuredError);

    if (socket && socket.emit) {
      socket.emit('error', {
        message: structuredError.message,
        code: structuredError.code,
        recoverable: isRecoverableError(structuredError),
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Register a recovery strategy for specific error types
   */
  registerRecoveryStrategy(errorType: string, strategy: RecoveryStrategy): void {
    this.recoveryStrategies.set(errorType, strategy);
    
    LogHelpers.info('error-handler', `Registered recovery strategy for ${errorType}`);
  }

  /**
   * Normalize any error to a MonitorError
   */
  private normalizeError(error: unknown, component: string): MonitorError {
    if (isMonitorError(error)) {
      return error;
    }

    if (error instanceof Error) {
      // Convert standard errors to MonitorError
      return new class extends MonitorError {}(
        error.message,
        {
          component,
          code: 'STANDARD_ERROR',
          context: { 
            name: error.name,
            stack: error.stack 
          },
          recoverable: false
        }
      );
    }

    // Handle unknown error types
    const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred';
    return new class extends MonitorError {}(
      errorMessage,
      {
        component,
        code: 'UNKNOWN_ERROR',
        context: { originalError: error },
        recoverable: false
      }
    );
  }

  /**
   * Attempt recovery using registered strategies
   */
  private async attemptRecovery(error: MonitorError): Promise<{
    canRetry: boolean;
    retryAfter?: number;
  }> {
    const errorKey = error.constructor.name;
    const strategy = this.recoveryStrategies.get(errorKey);

    if (!strategy || !strategy.canRecover(error)) {
      return { canRetry: false };
    }

    const retryKey = `${errorKey}:${error.component}:${error.code}`;
    const currentRetries = this.retryCount.get(retryKey) || 0;

    if (currentRetries >= strategy.maxAttempts) {
      LogHelpers.warning(
        'error-handler', 
        `Max recovery attempts (${strategy.maxAttempts}) reached for ${errorKey}`
      );
      return { canRetry: false };
    }

    try {
      LogHelpers.info('error-handler', `Attempting recovery for ${errorKey} (attempt ${currentRetries + 1})`);
      
      const recovered = await strategy.recover(error);
      
      if (recovered) {
        // Reset retry count on successful recovery
        this.retryCount.delete(retryKey);
        LogHelpers.info('error-handler', `Recovery successful for ${errorKey}`);
        return { canRetry: true };
      } else {
        // Increment retry count
        this.retryCount.set(retryKey, currentRetries + 1);
        LogHelpers.warning('error-handler', `Recovery failed for ${errorKey}`);
        return { 
          canRetry: currentRetries + 1 < strategy.maxAttempts,
          retryAfter: strategy.backoffMs * Math.pow(2, currentRetries) // Exponential backoff
        };
      }
    } catch (recoveryError) {
      LogHelpers.error('error-handler', `Recovery strategy failed for ${errorKey}`, {
        recoveryError: recoveryError instanceof Error ? recoveryError.message : recoveryError
      });
      
      this.retryCount.set(retryKey, currentRetries + 1);
      return { canRetry: false };
    }
  }

  /**
   * Generate user-friendly error messages
   */
  private generateUserMessage(error: MonitorError, notifyUser: boolean): string {
    if (!notifyUser) {
      return error.message;
    }

    // Generate user-friendly messages based on error type
    if (error instanceof FileSystemError) {
      return `Unable to access file: ${error.filePath}. Please check file permissions.`;
    }

    if (error instanceof JSONLParsingError) {
      return `Failed to parse conversation data at line ${error.lineNumber || 'unknown'}. The session may be corrupted.`;
    }

    if (error instanceof ProjectError) {
      return `Project not found: ${error.projectPath}. Please verify the project path.`;
    }

    if (error instanceof StateDetectionError) {
      return 'Unable to determine Claude\'s current state. Monitoring may be temporarily unavailable.';
    }

    if (error instanceof RecoveryError) {
      return `Recovery action failed: ${error.actionType}. You may need to manually intervene.`;
    }

    if (error instanceof WebSocketError) {
      return 'Connection lost. Attempting to reconnect...';
    }

    if (error instanceof APIError) {
      return `Service unavailable (${error.statusCode}). Please try again later.`;
    }

    if (error instanceof ConfigurationError) {
      return `Configuration error: ${error.configKey}. Please check your settings.`;
    }

    if (error instanceof PerformanceError) {
      return `Performance issue detected: ${error.metricName}. System may be slower than expected.`;
    }

    return error.message;
  }

  /**
   * Create structured log data
   */
  private createLogData(
    error: MonitorError,
    handlerInfo: {
      handled: boolean;
      recoverable: boolean;
      shouldRetry: boolean;
      retryAfter?: number;
      includeStack: boolean;
    }
  ): Record<string, unknown> {
    const logData: Record<string, unknown> = {
      ...error.toLogData(),
      handled: handlerInfo.handled,
      recoverable: handlerInfo.recoverable,
      shouldRetry: handlerInfo.shouldRetry
    };

    if (handlerInfo.retryAfter) {
      logData.retryAfter = handlerInfo.retryAfter;
    }

    if (!handlerInfo.includeStack) {
      delete logData.stack;
    }

    return logData;
  }

  /**
   * Register default recovery strategies
   */
  private registerDefaultRecoveryStrategies(): void {
    // WebSocket reconnection strategy
    this.registerRecoveryStrategy('WebSocketError', {
      canRecover: (error) => error instanceof WebSocketError,
      recover: async (error) => {
        // Implement WebSocket reconnection logic here
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true; // Assume successful for now
      },
      maxAttempts: 3,
      backoffMs: 1000
    });

    // File system retry strategy
    this.registerRecoveryStrategy('FileSystemError', {
      canRecover: (error) => 
        error instanceof FileSystemError && 
        error.operation !== 'delete' && // Don't retry deletes
        !error.message.includes('permission'), // Don't retry permission errors
      recover: async (error) => {
        // Implement file system retry logic here
        await new Promise(resolve => setTimeout(resolve, 500));
        return false; // Assume retry needed for demonstration
      },
      maxAttempts: 2,
      backoffMs: 500
    });

    // JSONL parsing retry strategy
    this.registerRecoveryStrategy('JSONLParsingError', {
      canRecover: (error) => error instanceof JSONLParsingError,
      recover: async (error) => {
        // Skip the problematic line and continue
        LogHelpers.warning('error-handler', `Skipping malformed JSONL line: ${error.lineNumber}`);
        return true;
      },
      maxAttempts: 1,
      backoffMs: 0
    });

    // Recovery action retry strategy
    this.registerRecoveryStrategy('RecoveryError', {
      canRecover: (error) => 
        error instanceof RecoveryError && 
        error.attemptNumber < 3,
      recover: async (error) => {
        // Implement recovery action retry logic
        await new Promise(resolve => setTimeout(resolve, 2000));
        return false; // Assume needs retry
      },
      maxAttempts: 3,
      backoffMs: 2000
    });
  }

  /**
   * Clear retry counts (useful for testing or manual reset)
   */
  clearRetryCount(errorType?: string, component?: string): void {
    if (errorType && component) {
      const retryKey = `${errorType}:${component}`;
      this.retryCount.delete(retryKey);
    } else {
      this.retryCount.clear();
    }
    
    LogHelpers.info('error-handler', 'Retry counts cleared');
  }
}

// Global error handler instance
let globalErrorHandler: ErrorHandler | null = null;

/**
 * Get the global error handler instance
 */
export function getGlobalErrorHandler(): ErrorHandler {
  if (!globalErrorHandler) {
    globalErrorHandler = new ErrorHandler();
  }
  return globalErrorHandler;
}

/**
 * Convenience functions for common error handling scenarios
 */
export const ErrorHelpers = {
  // Handle and log any error
  handle: async (error: unknown, options?: ErrorHandlerOptions) => 
    getGlobalErrorHandler().handleError(error, options),

  // Handle API errors with Next.js responses
  handleAPI: (error: unknown, component?: string) => 
    getGlobalErrorHandler().handleAPIError(error, component),

  // Handle WebSocket errors
  handleWebSocket: (error: unknown, socket: any, component?: string) => 
    getGlobalErrorHandler().handleWebSocketError(error, socket, component),

  // Register recovery strategy
  registerRecovery: (errorType: string, strategy: RecoveryStrategy) => 
    getGlobalErrorHandler().registerRecoveryStrategy(errorType, strategy),

  // Clear retry counts
  clearRetries: (errorType?: string, component?: string) =>
    getGlobalErrorHandler().clearRetryCount(errorType, component)
};

export default ErrorHandler;