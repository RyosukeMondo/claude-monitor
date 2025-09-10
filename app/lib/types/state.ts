/**
 * State analysis types for Claude Code monitoring
 * Defines comprehensive state tracking and analysis structures
 */
import { z } from 'zod';
import { ConversationEvent, ConversationEventSchema } from './conversation';
import { LogLine, LogLineSchema } from './log';

// Claude Code session states
export type ClaudeSessionState = 
  | 'initializing'
  | 'idle'
  | 'user_input'
  | 'processing'
  | 'tool_execution'
  | 'context_pressure'
  | 'error_recovery'
  | 'session_ended';

// Context pressure levels
export type ContextPressureLevel = 'low' | 'medium' | 'high' | 'critical';

// State transition information
export interface StateTransition {
  from: ClaudeSessionState;
  to: ClaudeSessionState;
  timestamp: Date;
  trigger: ConversationEvent | LogLine;
  duration?: number; // milliseconds in previous state
  confidence: number; // 0-1 scale
}

// Zod schema for StateTransition
export const StateTransitionSchema = z.object({
  from: z.enum(['initializing', 'idle', 'user_input', 'processing', 'tool_execution', 'context_pressure', 'error_recovery', 'session_ended']),
  to: z.enum(['initializing', 'idle', 'user_input', 'processing', 'tool_execution', 'context_pressure', 'error_recovery', 'session_ended']),
  timestamp: z.date(),
  trigger: z.union([ConversationEventSchema, LogLineSchema]),
  duration: z.number().min(0).optional(),
  confidence: z.number().min(0).max(1)
});

// Performance metrics for state analysis
export interface PerformanceMetrics {
  averageResponseTime: number; // milliseconds
  toolExecutionTime: number; // milliseconds
  contextSwitchTime: number; // milliseconds
  memoryUtilization: number; // 0-1 scale
  tokenEfficiency: number; // tokens per second
  errorRate: number; // 0-1 scale
  throughput: {
    eventsPerMinute: number;
    linesProcessedPerMinute: number;
    toolCallsPerMinute: number;
  };
}

// Zod schema for PerformanceMetrics
export const PerformanceMetricsSchema = z.object({
  averageResponseTime: z.number().min(0),
  toolExecutionTime: z.number().min(0),
  contextSwitchTime: z.number().min(0),
  memoryUtilization: z.number().min(0).max(1),
  tokenEfficiency: z.number().min(0),
  errorRate: z.number().min(0).max(1),
  throughput: z.object({
    eventsPerMinute: z.number().min(0),
    linesProcessedPerMinute: z.number().min(0),
    toolCallsPerMinute: z.number().min(0)
  })
});

// Context analysis details
export interface ContextAnalysis {
  pressureLevel: ContextPressureLevel;
  tokenUsage: {
    current: number;
    maximum: number;
    utilization: number; // 0-1 scale
  };
  compressionOpportunities: {
    redundantContent: number; // estimated tokens
    summarizableContent: number; // estimated tokens
    removableMetadata: number; // estimated tokens
  };
  memoryFootprint: {
    totalBytes: number;
    activeObjects: number;
    gcPressure: boolean;
  };
}

// Zod schema for ContextAnalysis
export const ContextAnalysisSchema = z.object({
  pressureLevel: z.enum(['low', 'medium', 'high', 'critical']),
  tokenUsage: z.object({
    current: z.number().int().min(0),
    maximum: z.number().int().min(0),
    utilization: z.number().min(0).max(1)
  }),
  compressionOpportunities: z.object({
    redundantContent: z.number().int().min(0),
    summarizableContent: z.number().int().min(0),
    removableMetadata: z.number().int().min(0)
  }),
  memoryFootprint: z.object({
    totalBytes: z.number().int().min(0),
    activeObjects: z.number().int().min(0),
    gcPressure: z.boolean()
  })
});

// Anomaly detection results
export interface AnomalyDetection {
  anomalies: Array<{
    type: 'performance' | 'error' | 'pattern' | 'state';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    timestamp: Date;
    affectedMetrics: string[];
    suggestedAction?: string;
  }>;
  confidence: number; // 0-1 scale
  trends: {
    improving: string[];
    degrading: string[];
    stable: string[];
  };
}

// Zod schema for AnomalyDetection
export const AnomalyDetectionSchema = z.object({
  anomalies: z.array(z.object({
    type: z.enum(['performance', 'error', 'pattern', 'state']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    description: z.string(),
    timestamp: z.date(),
    affectedMetrics: z.array(z.string()),
    suggestedAction: z.string().optional()
  })),
  confidence: z.number().min(0).max(1),
  trends: z.object({
    improving: z.array(z.string()),
    degrading: z.array(z.string()),
    stable: z.array(z.string())
  })
});

// Main state analysis interface
export interface StateAnalysis {
  sessionId: string;
  analysisTimestamp: Date;
  timeWindow: {
    start: Date;
    end: Date;
    duration: number; // milliseconds
  };
  
  // Current state information
  currentState: ClaudeSessionState;
  stateHistory: StateTransition[];
  stateDurations: Record<ClaudeSessionState, number>; // total time in each state
  
  // Performance analysis
  performance: PerformanceMetrics;
  contextAnalysis: ContextAnalysis;
  anomalyDetection: AnomalyDetection;
  
  // Pattern recognition
  patterns: {
    commonSequences: Array<{
      states: ClaudeSessionState[];
      frequency: number;
      averageDuration: number;
    }>;
    errorPatterns: Array<{
      description: string;
      frequency: number;
      lastOccurrence: Date;
    }>;
    toolUsagePatterns: Array<{
      toolName: string;
      frequency: number;
      averageExecutionTime: number;
      successRate: number;
    }>;
  };
  
  // Health indicators
  healthScore: number; // 0-100 scale
  recommendations: Array<{
    priority: 'low' | 'medium' | 'high' | 'critical';
    category: 'performance' | 'reliability' | 'efficiency' | 'maintenance';
    description: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
  }>;
  
  // Data quality
  dataQuality: {
    completeness: number; // 0-1 scale
    accuracy: number; // 0-1 scale
    timeliness: number; // 0-1 scale
    missingDataPoints: number;
    inconsistencies: string[];
  };
}

// Zod schema for StateAnalysis validation
export const StateAnalysisSchema = z.object({
  sessionId: z.string(),
  analysisTimestamp: z.date(),
  timeWindow: z.object({
    start: z.date(),
    end: z.date(),
    duration: z.number().min(0)
  }),
  
  currentState: z.enum(['initializing', 'idle', 'user_input', 'processing', 'tool_execution', 'context_pressure', 'error_recovery', 'session_ended']),
  stateHistory: z.array(StateTransitionSchema),
  stateDurations: z.record(z.string(), z.number().min(0)),
  
  performance: PerformanceMetricsSchema,
  contextAnalysis: ContextAnalysisSchema,
  anomalyDetection: AnomalyDetectionSchema,
  
  patterns: z.object({
    commonSequences: z.array(z.object({
      states: z.array(z.enum(['initializing', 'idle', 'user_input', 'processing', 'tool_execution', 'context_pressure', 'error_recovery', 'session_ended'])),
      frequency: z.number().int().min(0),
      averageDuration: z.number().min(0)
    })),
    errorPatterns: z.array(z.object({
      description: z.string(),
      frequency: z.number().int().min(0),
      lastOccurrence: z.date()
    })),
    toolUsagePatterns: z.array(z.object({
      toolName: z.string(),
      frequency: z.number().int().min(0),
      averageExecutionTime: z.number().min(0),
      successRate: z.number().min(0).max(1)
    }))
  }),
  
  healthScore: z.number().min(0).max(100),
  recommendations: z.array(z.object({
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    category: z.enum(['performance', 'reliability', 'efficiency', 'maintenance']),
    description: z.string(),
    impact: z.string(),
    effort: z.enum(['low', 'medium', 'high'])
  })),
  
  dataQuality: z.object({
    completeness: z.number().min(0).max(1),
    accuracy: z.number().min(0).max(1),
    timeliness: z.number().min(0).max(1),
    missingDataPoints: z.number().int().min(0),
    inconsistencies: z.array(z.string())
  })
});