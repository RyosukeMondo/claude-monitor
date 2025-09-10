/**
 * Core log parsing types converted from Python dataclasses
 * Based on src/parsing/log_parser.py LogLine and LogContext classes
 */
import { z } from 'zod';

// LogLine interface - represents a parsed log line with metadata
export interface LogLine {
  content: string;
  timestamp: Date;
  lineNumber: number;
  filePath: string;
  metadata: Record<string, any>;
}

// Zod schema for LogLine validation
export const LogLineSchema = z.object({
  content: z.string(),
  timestamp: z.date(),
  lineNumber: z.number().int().positive(),
  filePath: z.string(),
  metadata: z.record(z.string(), z.any())
});

// LogContext interface - maintains context for log analysis with bounded memory
export interface LogContext {
  maxLines: number;
  lines: LogLine[];
  memoryUsage: {
    linesCount: number;
    maxLines: number;
    estimatedBytes: number;
    memoryUtilization: number;
  };
}

// Zod schema for LogContext validation
export const LogContextSchema = z.object({
  maxLines: z.number().int().positive(),
  lines: z.array(LogLineSchema),
  memoryUsage: z.object({
    linesCount: z.number().int().min(0),
    maxLines: z.number().int().positive(),
    estimatedBytes: z.number().min(0),
    memoryUtilization: z.number().min(0).max(1)
  })
});

// Parser statistics interface based on Python LogParser._stats
export interface ParserStatistics {
  linesProcessed: number;
  bytesProcessed: number;
  fileRotations: number;
  errors: number;
  startTime: Date | null;
  lastActivity: Date | null;
  processingRate: number;
  contextMemory: LogContext['memoryUsage'];
  isMonitoring: boolean;
  filePath: string | null;
}

// Zod schema for ParserStatistics validation
export const ParserStatisticsSchema = z.object({
  linesProcessed: z.number().int().min(0),
  bytesProcessed: z.number().min(0),
  fileRotations: z.number().int().min(0),
  errors: z.number().int().min(0),
  startTime: z.date().nullable(),
  lastActivity: z.date().nullable(),
  processingRate: z.number().min(0),
  contextMemory: LogContextSchema.shape.memoryUsage,
  isMonitoring: z.boolean(),
  filePath: z.string().nullable()
});

// Pattern matching metadata based on Python LogParser._patterns
export interface PatternMetadata {
  claudePrompt?: boolean;
  errorMessage?: boolean;
  warningMessage?: boolean;
  contextPressure?: boolean;
  inputPrompt?: boolean;
  commandExecution?: boolean;
  filePath?: boolean;
  sessionStartMarker?: boolean;
  sessionEndMarker?: boolean;
  welcomeBanner?: boolean;
  tcpServerStarted?: boolean;
  tcpBridgeActive?: boolean;
  clearCompleted?: boolean;
  clearCommandEcho?: boolean;
  clearNoContent?: boolean;
  timestamp?: boolean;
  mentionedFile?: string;
}

// Zod schema for PatternMetadata validation
export const PatternMetadataSchema = z.object({
  claudePrompt: z.boolean().optional(),
  errorMessage: z.boolean().optional(),
  warningMessage: z.boolean().optional(),
  contextPressure: z.boolean().optional(),
  inputPrompt: z.boolean().optional(),
  commandExecution: z.boolean().optional(),
  filePath: z.boolean().optional(),
  sessionStartMarker: z.boolean().optional(),
  sessionEndMarker: z.boolean().optional(),
  welcomeBanner: z.boolean().optional(),
  tcpServerStarted: z.boolean().optional(),
  tcpBridgeActive: z.boolean().optional(),
  clearCompleted: z.boolean().optional(),
  clearCommandEcho: z.boolean().optional(),
  clearNoContent: z.boolean().optional(),
  timestamp: z.boolean().optional(),
  mentionedFile: z.string().optional()
});