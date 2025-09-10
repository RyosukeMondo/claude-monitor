/**
 * Custom error classes for Claude Monitor
 * 
 * Provides structured error handling with categorization and context,
 * converting Python error handling patterns to TypeScript.
 */

export interface ErrorDetails {
  code?: string;
  component?: string;
  context?: Record<string, unknown>;
  recoverable?: boolean;
  retryAfter?: number;
}

/**
 * Base error class for all Claude Monitor errors
 */
export abstract class MonitorError extends Error {
  public readonly component: string;
  public readonly code: string;
  public readonly context: Record<string, unknown>;
  public readonly recoverable: boolean;
  public readonly timestamp: Date;

  constructor(
    message: string,
    details: ErrorDetails = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.component = details.component || 'unknown';
    this.code = details.code || 'UNKNOWN_ERROR';
    this.context = details.context || {};
    this.recoverable = details.recoverable ?? false;
    this.timestamp = new Date();

    // Ensure proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to structured log format
   */
  toLogData(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      component: this.component,
      context: this.context,
      recoverable: this.recoverable,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    };
  }
}

/**
 * File system operation errors (JSONL files, monitoring, etc.)
 */
export class FileSystemError extends MonitorError {
  public readonly filePath?: string;
  public readonly operation: string;

  constructor(
    message: string,
    operation: string,
    filePath?: string,
    details: ErrorDetails = {}
  ) {
    super(message, {
      ...details,
      code: details.code || 'FILE_SYSTEM_ERROR',
      component: details.component || 'file-system'
    });
    
    this.operation = operation;
    this.filePath = filePath;
    this.context.operation = operation;
    if (filePath) {
      this.context.filePath = filePath;
    }
  }
}

/**
 * JSONL parsing and validation errors
 */
export class JSONLParsingError extends MonitorError {
  public readonly lineNumber?: number;
  public readonly rawData?: string;

  constructor(
    message: string,
    lineNumber?: number,
    rawData?: string,
    details: ErrorDetails = {}
  ) {
    super(message, {
      ...details,
      code: details.code || 'JSONL_PARSING_ERROR',
      component: details.component || 'jsonl-parser'
    });
    
    this.lineNumber = lineNumber;
    this.rawData = rawData;
    
    if (lineNumber !== undefined) {
      this.context.lineNumber = lineNumber;
    }
    if (rawData) {
      this.context.rawData = rawData.substring(0, 200); // Truncate for logging
    }
  }
}

/**
 * Project discovery and session correlation errors
 */
export class ProjectError extends MonitorError {
  public readonly projectPath?: string;
  public readonly encodedPath?: string;

  constructor(
    message: string,
    projectPath?: string,
    encodedPath?: string,
    details: ErrorDetails = {}
  ) {
    super(message, {
      ...details,
      code: details.code || 'PROJECT_ERROR',
      component: details.component || 'project-manager'
    });
    
    this.projectPath = projectPath;
    this.encodedPath = encodedPath;
    
    if (projectPath) {
      this.context.projectPath = projectPath;
    }
    if (encodedPath) {
      this.context.encodedPath = encodedPath;
    }
  }
}

/**
 * State detection and analysis errors
 */
export class StateDetectionError extends MonitorError {
  public readonly currentState?: string;
  public readonly confidence?: number;

  constructor(
    message: string,
    currentState?: string,
    confidence?: number,
    details: ErrorDetails = {}
  ) {
    super(message, {
      ...details,
      code: details.code || 'STATE_DETECTION_ERROR',
      component: details.component || 'state-detector'
    });
    
    this.currentState = currentState;
    this.confidence = confidence;
    
    if (currentState) {
      this.context.currentState = currentState;
    }
    if (confidence !== undefined) {
      this.context.confidence = confidence;
    }
  }
}

/**
 * Recovery action execution errors
 */
export class RecoveryError extends MonitorError {
  public readonly actionType: string;
  public readonly command?: string;
  public readonly attemptNumber: number;

  constructor(
    message: string,
    actionType: string,
    attemptNumber: number = 1,
    command?: string,
    details: ErrorDetails = {}
  ) {
    super(message, {
      ...details,
      code: details.code || 'RECOVERY_ERROR',
      component: details.component || 'recovery-engine',
      recoverable: details.recoverable ?? true // Recovery errors are often recoverable
    });
    
    this.actionType = actionType;
    this.command = command;
    this.attemptNumber = attemptNumber;
    
    this.context.actionType = actionType;
    this.context.attemptNumber = attemptNumber;
    if (command) {
      this.context.command = command;
    }
  }
}

/**
 * WebSocket and real-time communication errors
 */
export class WebSocketError extends MonitorError {
  public readonly connectionState: string;
  public readonly eventType?: string;

  constructor(
    message: string,
    connectionState: string,
    eventType?: string,
    details: ErrorDetails = {}
  ) {
    super(message, {
      ...details,
      code: details.code || 'WEBSOCKET_ERROR',
      component: details.component || 'websocket',
      recoverable: details.recoverable ?? true // WebSocket errors are usually recoverable
    });
    
    this.connectionState = connectionState;
    this.eventType = eventType;
    
    this.context.connectionState = connectionState;
    if (eventType) {
      this.context.eventType = eventType;
    }
  }
}

/**
 * API and external service errors
 */
export class APIError extends MonitorError {
  public readonly statusCode?: number;
  public readonly endpoint: string;
  public readonly method: string;

  constructor(
    message: string,
    endpoint: string,
    method: string = 'GET',
    statusCode?: number,
    details: ErrorDetails = {}
  ) {
    super(message, {
      ...details,
      code: details.code || 'API_ERROR',
      component: details.component || 'api'
    });
    
    this.endpoint = endpoint;
    this.method = method;
    this.statusCode = statusCode;
    
    this.context.endpoint = endpoint;
    this.context.method = method;
    if (statusCode) {
      this.context.statusCode = statusCode;
    }
  }
}

/**
 * Configuration and validation errors
 */
export class ConfigurationError extends MonitorError {
  public readonly configKey?: string;
  public readonly expectedType?: string;

  constructor(
    message: string,
    configKey?: string,
    expectedType?: string,
    details: ErrorDetails = {}
  ) {
    super(message, {
      ...details,
      code: details.code || 'CONFIGURATION_ERROR',
      component: details.component || 'config'
    });
    
    this.configKey = configKey;
    this.expectedType = expectedType;
    
    if (configKey) {
      this.context.configKey = configKey;
    }
    if (expectedType) {
      this.context.expectedType = expectedType;
    }
  }
}

/**
 * Performance and resource errors
 */
export class PerformanceError extends MonitorError {
  public readonly metricName: string;
  public readonly threshold: number;
  public readonly actualValue: number;

  constructor(
    message: string,
    metricName: string,
    threshold: number,
    actualValue: number,
    details: ErrorDetails = {}
  ) {
    super(message, {
      ...details,
      code: details.code || 'PERFORMANCE_ERROR',
      component: details.component || 'performance'
    });
    
    this.metricName = metricName;
    this.threshold = threshold;
    this.actualValue = actualValue;
    
    this.context.metricName = metricName;
    this.context.threshold = threshold;
    this.context.actualValue = actualValue;
  }
}

/**
 * Type guard functions for error categorization
 */
export function isMonitorError(error: unknown): error is MonitorError {
  return error instanceof MonitorError;
}

export function isRecoverableError(error: unknown): boolean {
  return isMonitorError(error) && error.recoverable;
}

export function getErrorComponent(error: unknown): string {
  if (isMonitorError(error)) {
    return error.component;
  }
  return 'unknown';
}

/**
 * Error factory functions for common error scenarios
 */
export const ErrorFactory = {
  fileNotFound: (filePath: string, component?: string): FileSystemError =>
    new FileSystemError(
      `File not found: ${filePath}`,
      'read',
      filePath,
      { code: 'FILE_NOT_FOUND', component, recoverable: false }
    ),

  jsonlParseError: (lineNumber: number, rawData: string, error: string): JSONLParsingError =>
    new JSONLParsingError(
      `Failed to parse JSONL at line ${lineNumber}: ${error}`,
      lineNumber,
      rawData,
      { code: 'INVALID_JSON', recoverable: true }
    ),

  projectNotFound: (projectPath: string): ProjectError =>
    new ProjectError(
      `Project not found or not accessible: ${projectPath}`,
      projectPath,
      undefined,
      { code: 'PROJECT_NOT_FOUND', recoverable: false }
    ),

  stateDetectionFailure: (reason: string): StateDetectionError =>
    new StateDetectionError(
      `State detection failed: ${reason}`,
      undefined,
      0,
      { code: 'STATE_DETECTION_FAILED', recoverable: true }
    ),

  recoveryActionFailed: (actionType: string, command: string, attempt: number, reason: string): RecoveryError =>
    new RecoveryError(
      `Recovery action '${actionType}' failed: ${reason}`,
      actionType,
      attempt,
      command,
      { code: 'RECOVERY_FAILED', recoverable: true }
    ),

  websocketConnectionFailed: (reason: string): WebSocketError =>
    new WebSocketError(
      `WebSocket connection failed: ${reason}`,
      'disconnected',
      'connection',
      { code: 'CONNECTION_FAILED', recoverable: true }
    ),

  configurationMissing: (key: string, expectedType: string): ConfigurationError =>
    new ConfigurationError(
      `Configuration missing or invalid: ${key} (expected ${expectedType})`,
      key,
      expectedType,
      { code: 'CONFIG_MISSING', recoverable: false }
    ),

  performanceThresholdExceeded: (metric: string, threshold: number, actual: number): PerformanceError =>
    new PerformanceError(
      `Performance threshold exceeded for ${metric}: ${actual} > ${threshold}`,
      metric,
      threshold,
      actual,
      { code: 'PERFORMANCE_THRESHOLD_EXCEEDED', recoverable: true }
    )
};