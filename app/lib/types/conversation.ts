/**
 * Conversation event types for JSONL processing
 * Defines comprehensive typing for Claude Code conversation events
 */
import { z } from 'zod';
import { LogLine, LogLineSchema } from './log';

// Base conversation event types
export type ConversationEventType = 
  | 'session_start'
  | 'session_end' 
  | 'user_input'
  | 'assistant_response'
  | 'tool_call'
  | 'tool_result'
  | 'error'
  | 'warning'
  | 'context_pressure'
  | 'command_execution'
  | 'file_operation'
  | 'clear_command';

// Tool execution details
export interface ToolExecution {
  toolName: string;
  parameters: Record<string, any>;
  startTime: Date;
  endTime?: Date;
  success?: boolean;
  errorMessage?: string;
  result?: any;
}

// Zod schema for ToolExecution
export const ToolExecutionSchema = z.object({
  toolName: z.string(),
  parameters: z.record(z.string(), z.any()),
  startTime: z.date(),
  endTime: z.date().optional(),
  success: z.boolean().optional(),
  errorMessage: z.string().optional(),
  result: z.any().optional()
});

// File operation details
export interface FileOperation {
  operation: 'read' | 'write' | 'edit' | 'create' | 'delete';
  filePath: string;
  lineNumbers?: number[];
  success: boolean;
  errorMessage?: string;
  bytesProcessed?: number;
}

// Zod schema for FileOperation
export const FileOperationSchema = z.object({
  operation: z.enum(['read', 'write', 'edit', 'create', 'delete']),
  filePath: z.string(),
  lineNumbers: z.array(z.number().int().positive()).optional(),
  success: z.boolean(),
  errorMessage: z.string().optional(),
  bytesProcessed: z.number().min(0).optional()
});

// Conversation event interface - comprehensive JSONL event structure
export interface ConversationEvent {
  id: string;
  type: ConversationEventType;
  timestamp: Date;
  sessionId?: string;
  
  // Content fields
  content?: string;
  role?: 'user' | 'assistant' | 'system';
  
  // Context and metadata
  logLine?: LogLine;
  metadata: Record<string, any>;
  
  // Tool and execution details
  toolExecution?: ToolExecution;
  fileOperation?: FileOperation;
  
  // Error handling
  error?: {
    message: string;
    code?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recoverable: boolean;
  };
  
  // Performance metrics
  performance?: {
    processingTime?: number;
    memoryUsage?: number;
    tokenCount?: number;
  };
  
  // State indicators
  contextPressure?: {
    level: number; // 0-1 scale
    threshold: number;
    action: 'none' | 'compress' | 'truncate' | 'split';
  };
}

// Zod schema for ConversationEvent validation
export const ConversationEventSchema = z.object({
  id: z.string(),
  type: z.enum([
    'session_start',
    'session_end', 
    'user_input',
    'assistant_response',
    'tool_call',
    'tool_result',
    'error',
    'warning',
    'context_pressure',
    'command_execution',
    'file_operation',
    'clear_command'
  ]),
  timestamp: z.date(),
  sessionId: z.string().optional(),
  
  content: z.string().optional(),
  role: z.enum(['user', 'assistant', 'system']).optional(),
  
  logLine: LogLineSchema.optional(),
  metadata: z.record(z.string(), z.any()),
  
  toolExecution: ToolExecutionSchema.optional(),
  fileOperation: FileOperationSchema.optional(),
  
  error: z.object({
    message: z.string(),
    code: z.string().optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    recoverable: z.boolean()
  }).optional(),
  
  performance: z.object({
    processingTime: z.number().min(0).optional(),
    memoryUsage: z.number().min(0).optional(),
    tokenCount: z.number().int().min(0).optional()
  }).optional(),
  
  contextPressure: z.object({
    level: z.number().min(0).max(1),
    threshold: z.number().min(0).max(1),
    action: z.enum(['none', 'compress', 'truncate', 'split'])
  }).optional()
});

// Session management types
export interface ConversationSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  events: ConversationEvent[];
  metadata: {
    userAgent?: string;
    platform?: string;
    version?: string;
    totalEvents: number;
    totalTokens?: number;
  };
}

// Zod schema for ConversationSession validation
export const ConversationSessionSchema = z.object({
  id: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  events: z.array(ConversationEventSchema),
  metadata: z.object({
    userAgent: z.string().optional(),
    platform: z.string().optional(),
    version: z.string().optional(),
    totalEvents: z.number().int().min(0),
    totalTokens: z.number().int().min(0).optional()
  })
});

// JSONL processing result
export interface JSONLProcessingResult {
  success: boolean;
  totalLines: number;
  validEvents: number;
  errors: Array<{
    line: number;
    error: string;
    rawContent?: string;
  }>;
  sessions: ConversationSession[];
  processingTime: number;
}

// Zod schema for JSONLProcessingResult validation
export const JSONLProcessingResultSchema = z.object({
  success: z.boolean(),
  totalLines: z.number().int().min(0),
  validEvents: z.number().int().min(0),
  errors: z.array(z.object({
    line: z.number().int().positive(),
    error: z.string(),
    rawContent: z.string().optional()
  })),
  sessions: z.array(ConversationSessionSchema),
  processingTime: z.number().min(0)
});