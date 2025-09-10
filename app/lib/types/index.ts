/**
 * Core TypeScript interfaces for Claude Code monitoring
 * Complete type system for JSONL event processing, state analysis, and project tracking
 */

import { z } from 'zod';

// Re-export all types and schemas
export type {
  LogLine,
  LogContext,
  ParserStatistics,
  PatternMetadata
} from './log';

export {
  LogLineSchema,
  LogContextSchema,
  ParserStatisticsSchema,
  PatternMetadataSchema
} from './log';

export type {
  ConversationEventType,
  ToolExecution,
  FileOperation,
  ConversationEvent,
  ConversationSession,
  JSONLProcessingResult
} from './conversation';

export {
  ToolExecutionSchema,
  FileOperationSchema,
  ConversationEventSchema,
  ConversationSessionSchema,
  JSONLProcessingResultSchema
} from './conversation';

export type {
  ClaudeSessionState,
  ContextPressureLevel,
  StateTransition,
  PerformanceMetrics,
  ContextAnalysis,
  AnomalyDetection,
  StateAnalysis
} from './state';

export {
  StateTransitionSchema,
  PerformanceMetricsSchema,
  ContextAnalysisSchema,
  AnomalyDetectionSchema,
  StateAnalysisSchema
} from './state';

export type {
  TechnologyStack,
  FileSystemAnalysis,
  DevelopmentActivity,
  ProjectHealth,
  ProjectInfo
} from './project';

export {
  TechnologyStackSchema,
  FileSystemAnalysisSchema,
  DevelopmentActivitySchema,
  ProjectHealthSchema,
  ProjectInfoSchema
} from './project';

// Import required types and schemas
import type {
  LogLine,
  LogContext,
  ParserStatistics,
  PatternMetadata
} from './log';

import {
  LogLineSchema,
  LogContextSchema,
  ParserStatisticsSchema,
  PatternMetadataSchema
} from './log';

import type {
  ConversationEventType,
  ToolExecution,
  FileOperation,
  ConversationEvent,
  ConversationSession,
  JSONLProcessingResult
} from './conversation';

import {
  ToolExecutionSchema,
  FileOperationSchema,
  ConversationEventSchema,
  ConversationSessionSchema,
  JSONLProcessingResultSchema
} from './conversation';

import type {
  ClaudeSessionState,
  ContextPressureLevel,
  StateTransition,
  PerformanceMetrics,
  ContextAnalysis,
  AnomalyDetection,
  StateAnalysis
} from './state';

import {
  StateTransitionSchema,
  PerformanceMetricsSchema,
  ContextAnalysisSchema,
  AnomalyDetectionSchema,
  StateAnalysisSchema
} from './state';

import type {
  TechnologyStack,
  FileSystemAnalysis,
  DevelopmentActivity,
  ProjectHealth,
  ProjectInfo
} from './project';

import {
  TechnologyStackSchema,
  FileSystemAnalysisSchema,
  DevelopmentActivitySchema,
  ProjectHealthSchema,
  ProjectInfoSchema
} from './project';

// Utility type guards for runtime type checking
export const isLogLine = (obj: unknown): obj is LogLine => {
  try {
    LogLineSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
};

export const isConversationEvent = (obj: unknown): obj is ConversationEvent => {
  try {
    ConversationEventSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
};

export const isStateAnalysis = (obj: unknown): obj is StateAnalysis => {
  try {
    StateAnalysisSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
};

export const isProjectInfo = (obj: unknown): obj is ProjectInfo => {
  try {
    ProjectInfoSchema.parse(obj);
    return true;
  } catch {
    return false;
  }
};

// Validation helper functions
export const validateLogLine = (obj: unknown) => LogLineSchema.safeParse(obj);
export const validateConversationEvent = (obj: unknown) => ConversationEventSchema.safeParse(obj);
export const validateStateAnalysis = (obj: unknown) => StateAnalysisSchema.safeParse(obj);
export const validateProjectInfo = (obj: unknown) => ProjectInfoSchema.safeParse(obj);
export const validateJSONLProcessingResult = (obj: unknown) => JSONLProcessingResultSchema.safeParse(obj);

// Re-export important imports for convenience
export { z } from 'zod';

// Type aliases for commonly used union types
export type ValidatedData<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: {
    message: string;
    issues: Array<{
      path: (string | number)[];
      message: string;
      code: string;
    }>;
  };
};

// Generic validation wrapper
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidatedData<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return {
      success: true,
      data: result.data
    };
  } else {
    return {
      success: false,
      error: {
        message: 'Validation failed',
        issues: result.error.issues.map((issue: any) => ({
          path: issue.path,
          message: issue.message,
          code: issue.code
        }))
      }
    };
  }
}

// Constants for commonly used values
export const CONTEXT_PRESSURE_THRESHOLDS = {
  LOW: 0.3,
  MEDIUM: 0.6,
  HIGH: 0.8,
  CRITICAL: 0.95
} as const;

export const DEFAULT_MONITORING_CONFIG = {
  enabled: true,
  logLevel: 'info' as const,
  retentionPeriod: 30,
  alertThresholds: {
    errorRate: 0.05,
    performanceDegradation: 0.3,
    contextPressure: 0.8
  },
  excludedPaths: ['node_modules', '.git', 'dist', 'build'],
  watchedFilePatterns: ['**/*.ts', '**/*.js', '**/*.tsx', '**/*.jsx', '**/*.py', '**/*.md']
} as const;