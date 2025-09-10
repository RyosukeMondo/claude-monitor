/**
 * Structured logging system for Claude Monitor
 * 
 * TypeScript conversion of Python logger.py with Pino for structured logging,
 * maintaining compatibility with existing log formats and features.
 */

import * as pino from 'pino';
import { Logger } from 'pino';
import { MonitorError, isMonitorError } from './errors';

export interface LogContext {
  component?: string;
  state?: string;
  action?: string;
  context?: Record<string, unknown>;
  recovery_attempt?: number;
  error_details?: Record<string, unknown>;
  previous_state?: string;
  confidence?: number;
  action_type?: string;
  command?: string;
  success?: boolean;
  event_type?: string;
}

export interface PerformanceMetric {
  metric_name: string;
  value: number;
  unit?: string;
  context?: Record<string, unknown>;
}

export interface TaskStatusContext {
  total: number;
  completed: number;
  pending: number;
  in_progress: number;
  work_complete: boolean;
}

export interface LoggerConfig {
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  pretty: boolean;
  file?: string;
  maxFileSize?: string;
  maxFiles?: number;
}

/**
 * Main structured logger class for Claude Monitor
 */
export class MonitorLogger {
  private readonly rootLogger: Logger;
  private readonly loggers: Map<string, Logger>;
  private readonly config: LoggerConfig;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: 'info',
      pretty: process.env.NODE_ENV === 'development',
      maxFileSize: '100MB',
      maxFiles: 5,
      ...config
    };
    
    this.loggers = new Map();
    this.rootLogger = this.createRootLogger();
  }

  private createRootLogger(): Logger {
    const transport = this.config.pretty
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'UTC:yyyy-mm-dd HH:MM:ss.l',
            ignore: 'pid,hostname',
            messageFormat: '{component} [{action}] {msg}',
            customPrettifiers: {
              context: (value: any) => `context=${JSON.stringify(value)}`,
              error_details: (value: any) => `error_details=${JSON.stringify(value)}`
            }
          }
        }
      : undefined;

    const destinations: pino.DestinationStream[] = [];

    // Console output
    if (transport) {
      destinations.push(pino.transport(transport));
    } else {
      destinations.push(pino.destination({ dest: 1 })); // stdout
    }

    // File output
    if (this.config.file) {
      destinations.push(pino.destination({
        dest: this.config.file,
        sync: false
      }));
    }

    const logger = pino({
      name: 'claude_monitor',
      level: this.config.level,
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level: (label) => ({ level: label.toUpperCase() }),
        log: (object) => {
          // Ensure structured fields are properly formatted
          const structured = { ...object };
          
          // Convert error objects to structured format
          if (structured.error && isMonitorError(structured.error)) {
            structured.error_details = structured.error.toLogData();
            delete structured.error;
          }
          
          return structured;
        }
      }
    }, destinations.length > 1 ? pino.multistream(destinations) : destinations[0]);

    return logger;
  }

  /**
   * Get a component-specific logger
   */
  getLogger(componentName: string): Logger {
    const loggerName = `claude_monitor.${componentName}`;
    
    if (!this.loggers.has(loggerName)) {
      const childLogger = this.rootLogger.child({ 
        component: componentName,
        logger: loggerName 
      });
      this.loggers.set(loggerName, childLogger);
    }
    
    return this.loggers.get(loggerName)!;
  }

  /**
   * Log a state change event with structured data
   */
  logStateChange(
    componentName: string,
    oldState: string,
    newState: string,
    context?: string[],
    confidence: number = 0.0
  ): void {
    const logger = this.getLogger(componentName);
    
    logger.info({
      state: newState,
      context: context || [],
      action: 'state_change',
      component: componentName,
      confidence,
      previous_state: oldState
    }, `State change: ${oldState} -> ${newState}`);
  }

  /**
   * Log a recovery action with execution details
   */
  logRecoveryAction(
    componentName: string,
    actionType: string,
    command: string,
    success: boolean,
    attemptNumber: number = 1,
    errorDetails?: Record<string, unknown>
  ): void {
    const logger = this.getLogger(componentName);
    const level = success ? 'info' : 'error';
    const message = `Recovery action ${actionType}: ${command} ${success ? 'succeeded' : 'failed'}`;
    
    const logData: LogContext = {
      action: 'recovery',
      component: componentName,
      recovery_attempt: attemptNumber,
      action_type: actionType,
      command,
      success
    };
    
    if (errorDetails) {
      logData.error_details = errorDetails;
    }
    
    logger[level](logData, message);
  }

  /**
   * Log task status information
   */
  logTaskStatus(
    componentName: string,
    taskStatus: TaskStatusContext
  ): void {
    const logger = this.getLogger(componentName);
    
    logger.info({
      action: 'task_status',
      component: componentName,
      context: taskStatus
    }, `Task status: ${taskStatus.completed}/${taskStatus.total} complete, ${taskStatus.pending} pending, ${taskStatus.in_progress} in-progress`);
  }

  /**
   * Log an error with structured details
   */
  logError(
    componentName: string,
    error: Error | MonitorError | string,
    errorDetails?: Record<string, unknown>,
    includeStack: boolean = true
  ): void {
    const logger = this.getLogger(componentName);
    
    const logData: LogContext = {
      action: 'error',
      component: componentName
    };
    
    if (typeof error === 'string') {
      logData.error_details = errorDetails;
      logger.error(logData, error);
    } else if (isMonitorError(error)) {
      logData.error_details = error.toLogData();
      logger.error(logData, error.message);
    } else {
      logData.error_details = {
        name: error.name,
        message: error.message,
        stack: includeStack ? error.stack : undefined,
        ...errorDetails
      };
      logger.error(logData, error.message);
    }
  }

  /**
   * Log a performance metric
   */
  logPerformanceMetric(
    componentName: string,
    metric: PerformanceMetric
  ): void {
    const logger = this.getLogger(componentName);
    
    let message = `Performance metric ${metric.metric_name}: ${metric.value}`;
    if (metric.unit) {
      message += ` ${metric.unit}`;
    }
    
    logger.info({
      action: 'performance',
      component: componentName,
      context: {
        metric_name: metric.metric_name,
        value: metric.value,
        unit: metric.unit,
        ...metric.context
      }
    }, message);
  }

  /**
   * Log a system event (startup, shutdown, config reload, etc.)
   */
  logSystemEvent(
    componentName: string,
    eventType: string,
    description: string,
    context?: Record<string, unknown>
  ): void {
    const logger = this.getLogger(componentName);
    
    logger.info({
      action: 'system_event',
      component: componentName,
      context: context || {},
      event_type: eventType
    }, `System event ${eventType}: ${description}`);
  }

  /**
   * Log debug information
   */
  logDebug(
    componentName: string,
    message: string,
    context?: Record<string, unknown>
  ): void {
    const logger = this.getLogger(componentName);
    
    logger.debug({
      action: 'debug',
      component: componentName,
      context: context || {}
    }, message);
  }

  /**
   * Log informational message
   */
  logInfo(
    componentName: string,
    message: string,
    context?: Record<string, unknown>
  ): void {
    const logger = this.getLogger(componentName);
    
    logger.info({
      action: 'info',
      component: componentName,
      context: context || {}
    }, message);
  }

  /**
   * Log warning message
   */
  logWarning(
    componentName: string,
    message: string,
    context?: Record<string, unknown>
  ): void {
    const logger = this.getLogger(componentName);
    
    logger.warn({
      action: 'warning',
      component: componentName,
      context: context || {}
    }, message);
  }

  /**
   * Update logger configuration at runtime
   */
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    Object.assign(this.config, newConfig);
    
    // Update log level for all loggers
    if (newConfig.level) {
      this.rootLogger.level = newConfig.level;
      for (const logger of this.loggers.values()) {
        logger.level = newConfig.level;
      }
    }
    
    this.logSystemEvent('logger', 'config_update', 'Logger configuration updated');
  }

  /**
   * Flush all log streams
   */
  async flush(): Promise<void> {
    return new Promise((resolve) => {
      this.rootLogger.flush();
      // Give a small delay for flush to complete
      setTimeout(resolve, 100);
    });
  }

  /**
   * Close all log streams
   */
  async close(): Promise<void> {
    await this.flush();
    
    // Close all child loggers
    for (const logger of Array.from(this.loggers.values())) {
      // Close individual loggers if needed
    }
    this.loggers.clear();
    
    this.logSystemEvent('logger', 'shutdown', 'Logger system shutting down');
  }
}

// Global logger instance
let globalLogger: MonitorLogger | null = null;

/**
 * Initialize the global logging system
 */
export function initializeLogger(config?: Partial<LoggerConfig>): MonitorLogger {
  globalLogger = new MonitorLogger(config);
  return globalLogger;
}

/**
 * Get the global logger instance
 */
export function getGlobalLogger(): MonitorLogger {
  if (!globalLogger) {
    globalLogger = new MonitorLogger();
  }
  return globalLogger;
}

/**
 * Get a component-specific logger
 */
export function getLogger(componentName: string): Logger {
  return getGlobalLogger().getLogger(componentName);
}

/**
 * Convenience logging functions
 */
export const LogHelpers = {
  stateChange: (component: string, oldState: string, newState: string, context?: string[], confidence?: number) =>
    getGlobalLogger().logStateChange(component, oldState, newState, context, confidence),

  recoveryAction: (component: string, actionType: string, command: string, success: boolean, attemptNumber?: number, errorDetails?: Record<string, unknown>) =>
    getGlobalLogger().logRecoveryAction(component, actionType, command, success, attemptNumber, errorDetails),

  taskStatus: (component: string, taskStatus: TaskStatusContext) =>
    getGlobalLogger().logTaskStatus(component, taskStatus),

  error: (component: string, error: Error | MonitorError | string, errorDetails?: Record<string, unknown>) =>
    getGlobalLogger().logError(component, error, errorDetails),

  performance: (component: string, metric: PerformanceMetric) =>
    getGlobalLogger().logPerformanceMetric(component, metric),

  systemEvent: (component: string, eventType: string, description: string, context?: Record<string, unknown>) =>
    getGlobalLogger().logSystemEvent(component, eventType, description, context),

  debug: (component: string, message: string, context?: Record<string, unknown>) =>
    getGlobalLogger().logDebug(component, message, context),

  info: (component: string, message: string, context?: Record<string, unknown>) =>
    getGlobalLogger().logInfo(component, message, context),

  warning: (component: string, message: string, context?: Record<string, unknown>) =>
    getGlobalLogger().logWarning(component, message, context)
};

export default MonitorLogger;