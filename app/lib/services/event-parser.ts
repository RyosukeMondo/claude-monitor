/**
 * JSONL Event Parser Service
 * 
 * Converts raw JSONL data into structured TypeScript events with comprehensive validation.
 * Converts parsing logic from Python src/parsing/log_parser.py LogLine class to TypeScript.
 * 
 * Requirements: 4.1, 4.2
 * Leverage: Zod for validation, date-fns for timestamp parsing
 */

import { z } from 'zod';
import { parseISO, isValid } from 'date-fns';
import { ConversationEvent, ConversationEventType, ConversationEventSchema, ToolExecution, FileOperation } from '../types/conversation';
import { PatternMetadata } from '../types/log';

// Raw JSONL entry schema - matches actual Claude Code JSONL structure
const RawJSONLEntrySchema = z.object({
  uuid: z.string(),
  parentUuid: z.string().nullable(),
  sessionId: z.string(),
  timestamp: z.string(),
  type: z.enum(['user', 'assistant']),
  cwd: z.string(),
  message: z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.union([z.string(), z.array(z.unknown())]),
    id: z.string().optional(),
    model: z.string().optional(),
    stop_reason: z.string().nullable().optional(),
    usage: z.object({
      input_tokens: z.number().optional(),
      output_tokens: z.number().optional(),
      cache_creation_input_tokens: z.number().optional(),
      cache_read_input_tokens: z.number().optional(),
      service_tier: z.string().optional(),
    }).optional()
  }),
  version: z.string().optional(),
  gitBranch: z.string().optional(),
  isSidechain: z.boolean().optional(),
  userType: z.string().optional(),
  isMeta: z.boolean().optional(),
  requestId: z.string().optional()
});

type RawJSONLEntry = z.infer<typeof RawJSONLEntrySchema>;

// Pattern matching rules - converted from Python regex patterns
const PATTERNS = {
  // Commands and interactions
  clearCommand: /<command-name>\/clear<\/command-name>/i,
  scImplementCommand: /<command-name>\/sc:implement<\/command-name>/i,
  scLoadCommand: /<command-name>\/sc:load<\/command-name>/i,
  scSaveCommand: /<command-name>\/sc:save<\/command-name>/i,
  customCommand: /<command-name>([^<]+)<\/command-name>/i,
  localCommandStdout: /<local-command-stdout>/i,
  
  // Error and warning patterns
  errorMessage: /(error|Error|ERROR|exception|Exception)/i,
  warningMessage: /(warning|Warning|WARNING|warn)/i,
  
  // Context and performance
  contextPressure: /(context|memory|limit|full|usage)/i,
  tokenUsage: /tokens?/i,
  
  // Session markers
  sessionStart: /session[^a-zA-Z]*start/i,
  sessionEnd: /session[^a-zA-Z]*end/i,
  welcomeBanner: /Welcome to Claude Code/i,
  
  // Tool execution patterns
  toolCall: /(tool|function)[^a-zA-Z]*call/i,
  toolResult: /(result|response|output)/i,
  
  // File operations
  fileOperation: /(read|write|edit|create|delete)[^a-zA-Z]*(file|path)/i,
  filePath: /([\/\\][^\s<>\"'|?*]+\.[a-zA-Z0-9]+)/g,
  
  // Recovery and completion
  clearCompleted: /(you'?ve run the \/clear command|terminal is now clear)/i,
  clearNoContent: /\(no\s+content\)/i,
} as const;

// Command extraction interface
export interface CommandInfo {
  command: string;
  args: string[];
  timestamp: Date;
  context: string;
  isSlashCommand: boolean;
}

// Processing error interface
export interface ProcessingError {
  line: number;
  error: string;
  rawContent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Parser configuration
export interface EventParserConfig {
  validateInput: boolean;
  extractCommands: boolean;
  detectToolCalls: boolean;
  parseFileOperations: boolean;
  maxContentLength: number;
  timestampFormat?: string;
}

const DEFAULT_CONFIG: EventParserConfig = {
  validateInput: true,
  extractCommands: true,
  detectToolCalls: true,
  parseFileOperations: true,
  maxContentLength: 32768,
  timestampFormat: 'iso'
};

/**
 * JSONL Event Parser Service
 * 
 * Provides robust parsing of JSONL lines into structured ConversationEvent objects
 * with comprehensive validation, command extraction, and metadata enrichment.
 */
export class EventParserService {
  private readonly config: EventParserConfig;
  private parseErrors: ProcessingError[] = [];
  private lineNumber = 0;

  constructor(config: Partial<EventParserConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Parse a single JSONL line into a ConversationEvent
   * 
   * @param jsonlLine Raw JSONL line string
   * @param lineNum Optional line number for error reporting
   * @returns ConversationEvent or null if parsing fails
   */
  async parseEvent(jsonlLine: string, lineNum?: number): Promise<ConversationEvent | null> {
    this.lineNumber = lineNum ?? this.lineNumber + 1;

    if (!jsonlLine.trim()) {
      return null; // Skip empty lines
    }

    try {
      // Parse JSON with error handling
      let rawData: unknown;
      try {
        rawData = JSON.parse(jsonlLine);
      } catch (jsonError) {
        this.addError('critical', `Invalid JSON: ${jsonError}`, jsonlLine);
        return null;
      }

      // Validate against schema if enabled
      if (this.config.validateInput) {
        const parseResult = RawJSONLEntrySchema.safeParse(rawData);
        if (!parseResult.success) {
          this.addError('high', `Schema validation failed: ${parseResult.error.message}`, jsonlLine);
          return null;
        }
        rawData = parseResult.data;
      }

      // Convert to structured event
      return await this.convertToEvent(rawData as RawJSONLEntry, jsonlLine);

    } catch (error) {
      this.addError('critical', `Parsing error: ${error}`, jsonlLine);
      return null;
    }
  }

  /**
   * Parse multiple JSONL lines from content string
   * 
   * @param content Multi-line JSONL content
   * @returns Array of successfully parsed events
   */
  async parseEvents(content: string): Promise<ConversationEvent[]> {
    const lines = content.split('\n').filter(line => line.trim());
    const events: ConversationEvent[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const event = await this.parseEvent(lines[i], i + 1);
      if (event) {
        events.push(event);
      }
    }

    return events;
  }

  /**
   * Extract commands from message content
   * 
   * @param content Message content string
   * @returns Array of extracted commands
   */
  extractCommands(content: string): CommandInfo[] {
    if (!this.config.extractCommands || !content) return [];

    const commands: CommandInfo[] = [];
    const timestamp = new Date();

    // Extract command-name tags (primary Claude Code command format)
    const commandMatch = content.match(PATTERNS.customCommand);
    if (commandMatch) {
      const command = commandMatch[1].trim();
      commands.push({
        command,
        args: [],
        timestamp,
        context: content.slice(0, 200),
        isSlashCommand: command.startsWith('/')
      });
    }

    // Look for specific commands
    if (PATTERNS.clearCommand.test(content)) {
      commands.push({
        command: '/clear',
        args: [],
        timestamp,
        context: content.slice(0, 200),
        isSlashCommand: true
      });
    }

    if (PATTERNS.scImplementCommand.test(content)) {
      commands.push({
        command: '/sc:implement',
        args: [],
        timestamp,
        context: content.slice(0, 200),
        isSlashCommand: true
      });
    }

    if (PATTERNS.scLoadCommand.test(content)) {
      commands.push({
        command: '/sc:load',
        args: [],
        timestamp,
        context: content.slice(0, 200),
        isSlashCommand: true
      });
    }

    if (PATTERNS.scSaveCommand.test(content)) {
      commands.push({
        command: '/sc:save',
        args: [],
        timestamp,
        context: content.slice(0, 200),
        isSlashCommand: true
      });
    }

    return commands;
  }

  /**
   * Validate a parsed ConversationEvent
   * 
   * @param event Event to validate
   * @returns true if valid, false otherwise
   */
  validateEvent(event: ConversationEvent): boolean {
    try {
      const result = ConversationEventSchema.safeParse(event);
      if (!result.success) {
        this.addError('medium', `Event validation failed: ${result.error.message}`, JSON.stringify(event));
        return false;
      }
      return true;
    } catch (error) {
      this.addError('medium', `Event validation error: ${error}`, JSON.stringify(event));
      return false;
    }
  }

  /**
   * Get accumulated parsing errors
   * 
   * @returns Array of processing errors
   */
  getErrors(): ProcessingError[] {
    return [...this.parseErrors];
  }

  /**
   * Clear accumulated errors
   */
  clearErrors(): void {
    this.parseErrors = [];
  }

  /**
   * Reset parser state
   */
  reset(): void {
    this.parseErrors = [];
    this.lineNumber = 0;
  }

  // Private helper methods

  private async convertToEvent(rawEntry: RawJSONLEntry, originalLine: string): Promise<ConversationEvent> {
    // Parse timestamp with date-fns
    const timestamp = this.parseTimestamp(rawEntry.timestamp);
    
    // Extract content - handle both string and array formats
    const content = this.extractContent(rawEntry.message.content);
    
    // Truncate content if needed
    const truncatedContent = this.config.maxContentLength > 0 && content.length > this.config.maxContentLength
      ? content.slice(0, this.config.maxContentLength) + '... [truncated]'
      : content;

    // Determine event type based on content and metadata
    const eventType = this.determineEventType(rawEntry, truncatedContent);

    // Build metadata with pattern matching
    const metadata = this.buildMetadata(rawEntry, truncatedContent);

    // Extract commands if enabled
    const commands = this.config.extractCommands ? this.extractCommands(truncatedContent) : [];

    // Build base event
    const event: ConversationEvent = {
      id: rawEntry.uuid,
      type: eventType,
      timestamp,
      sessionId: rawEntry.sessionId,
      content: truncatedContent,
      role: rawEntry.message.role,
      metadata: {
        ...metadata,
        cwd: rawEntry.cwd,
        version: rawEntry.version,
        gitBranch: rawEntry.gitBranch,
        parentUuid: rawEntry.parentUuid,
        isSidechain: rawEntry.isSidechain,
        userType: rawEntry.userType,
        isMeta: rawEntry.isMeta,
        requestId: rawEntry.requestId,
        commands,
        originalLine
      }
    };

    // Add tool execution details if detected
    if (this.config.detectToolCalls && this.isToolExecution(truncatedContent, rawEntry)) {
      event.toolExecution = this.extractToolExecution(rawEntry, truncatedContent);
    }

    // Add file operation details if detected
    if (this.config.parseFileOperations && this.isFileOperation(truncatedContent)) {
      event.fileOperation = this.extractFileOperation(truncatedContent);
    }

    // Add performance metrics from usage data
    if (rawEntry.message.usage) {
      event.performance = {
        tokenCount: (rawEntry.message.usage.input_tokens || 0) + (rawEntry.message.usage.output_tokens || 0),
        processingTime: undefined, // Not available in JSONL
        memoryUsage: undefined // Not available in JSONL
      };
    }

    // Add error information if detected
    const errorInfo = this.extractError(truncatedContent);
    if (errorInfo) {
      event.error = errorInfo;
    }

    return event;
  }

  private parseTimestamp(timestampStr: string): Date {
    try {
      const parsed = parseISO(timestampStr);
      if (isValid(parsed)) {
        return parsed;
      }
    } catch {
      // Fallback to current time if parsing fails
    }
    return new Date();
  }

  private extractContent(content: string | unknown[]): string {
    if (typeof content === 'string') {
      return content;
    }
    
    if (Array.isArray(content)) {
      // Handle structured content array (like Claude's response format)
      return content.map(item => {
        if (typeof item === 'object' && item !== null && 'type' in item && 
            item.type === 'text' && 'text' in item && typeof item.text === 'string') {
          return item.text;
        }
        return JSON.stringify(item);
      }).join('\n');
    }
    
    return String(content);
  }

  private determineEventType(rawEntry: RawJSONLEntry, content: string): ConversationEventType {
    // Check for specific patterns first
    if (PATTERNS.clearCommand.test(content)) return 'clear_command';
    if (PATTERNS.sessionStart.test(content)) return 'session_start';
    if (PATTERNS.sessionEnd.test(content)) return 'session_end';
    if (PATTERNS.errorMessage.test(content)) return 'error';
    if (PATTERNS.warningMessage.test(content)) return 'warning';
    if (PATTERNS.contextPressure.test(content)) return 'context_pressure';
    if (PATTERNS.localCommandStdout.test(content)) return 'command_execution';
    if (this.isToolExecution(content, rawEntry)) return 'tool_call';
    if (PATTERNS.fileOperation.test(content)) return 'file_operation';

    // Default based on role
    return rawEntry.type === 'user' ? 'user_input' : 'assistant_response';
  }

  private buildMetadata(rawEntry: RawJSONLEntry, content: string): PatternMetadata {
    const metadata: PatternMetadata = {};

    // Apply pattern matching
    Object.entries(PATTERNS).forEach(([key, pattern]) => {
      if (pattern.test(content)) {
        (metadata as Record<string, unknown>)[key] = true;
      }
    });

    // Extract file mentions
    const fileMatches = content.match(PATTERNS.filePath);
    if (fileMatches && fileMatches.length > 0) {
      metadata.mentionedFile = fileMatches[0];
    }

    return metadata;
  }

  private isToolExecution(content: string, rawEntry: RawJSONLEntry): boolean {
    return PATTERNS.toolCall.test(content) || 
           (rawEntry.type === 'assistant' && content.includes('tool')) ||
           Boolean(rawEntry.requestId); // Assistant responses with requestId often involve tools
  }

  private extractToolExecution(rawEntry: RawJSONLEntry, content: string): ToolExecution | undefined {
    if (rawEntry.type !== 'assistant') return undefined;

    return {
      toolName: 'unknown', // Cannot determine specific tool from JSONL
      parameters: {},
      startTime: this.parseTimestamp(rawEntry.timestamp),
      success: !PATTERNS.errorMessage.test(content),
      result: content
    };
  }

  private isFileOperation(content: string): boolean {
    return PATTERNS.fileOperation.test(content) || PATTERNS.filePath.test(content);
  }

  private extractFileOperation(content: string): FileOperation | undefined {
    const fileMatch = content.match(PATTERNS.filePath);
    if (!fileMatch) return undefined;

    // Determine operation type from content
    let operation: FileOperation['operation'] = 'read';
    if (/(write|writ)/i.test(content)) operation = 'write';
    else if (/(edit|modif)/i.test(content)) operation = 'edit';
    else if (/(create|new)/i.test(content)) operation = 'create';
    else if (/(delete|remove)/i.test(content)) operation = 'delete';

    return {
      operation,
      filePath: fileMatch[0],
      success: !PATTERNS.errorMessage.test(content)
    };
  }

  private extractError(content: string): ConversationEvent['error'] | undefined {
    if (!PATTERNS.errorMessage.test(content)) return undefined;

    return {
      message: content.slice(0, 200),
      severity: PATTERNS.warningMessage.test(content) ? 'medium' : 'high',
      recoverable: !content.toLowerCase().includes('critical')
    };
  }

  private addError(severity: ProcessingError['severity'], error: string, rawContent: string): void {
    this.parseErrors.push({
      line: this.lineNumber,
      error,
      rawContent: rawContent.slice(0, 500), // Truncate for storage
      severity
    });
  }
}

/**
 * Create a new EventParserService instance with optional configuration
 * 
 * @param config Optional parser configuration
 * @returns New EventParserService instance
 */
export function createEventParser(config?: Partial<EventParserConfig>): EventParserService {
  return new EventParserService(config);
}

/**
 * Parse a single JSONL line quickly (convenience function)
 * 
 * @param jsonlLine Raw JSONL line
 * @returns Parsed event or null
 */
export async function parseJSONLLine(jsonlLine: string): Promise<ConversationEvent | null> {
  const parser = createEventParser();
  return parser.parseEvent(jsonlLine);
}

/**
 * Parse multiple JSONL lines quickly (convenience function)
 * 
 * @param content Multi-line JSONL content
 * @returns Array of parsed events
 */
export async function parseJSONLContent(content: string): Promise<ConversationEvent[]> {
  const parser = createEventParser();
  return parser.parseEvents(content);
}