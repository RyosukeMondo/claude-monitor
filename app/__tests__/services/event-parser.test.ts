/**
 * Unit tests for JSONL Event Parser Service
 * 
 * Tests cover:
 * - JSONL line parsing with validation
 * - Command extraction from content
 * - Event type classification
 * - Tool execution detection
 * - File operation parsing
 * - Error detection and handling
 * - Pattern matching and metadata extraction
 * - Edge cases and malformed data
 */

import { 
  EventParserService, 
  createEventParser, 
  parseJSONLLine, 
  parseJSONLContent 
} from '../../lib/services/event-parser';
import { ConversationEventType } from '../../lib/types/conversation';
import { 
  SAMPLE_JSONL_ENTRIES, 
  INVALID_JSONL_ENTRIES, 
  COMMAND_EXAMPLES,
  FILE_OPERATION_EXAMPLES,
  ERROR_EXAMPLES
} from '../fixtures/sample-jsonl';

describe('EventParserService', () => {
  let parser: EventParserService;

  beforeEach(() => {
    parser = new EventParserService({
      validateInput: true,
      extractCommands: true,
      detectToolCalls: true,
      parseFileOperations: true,
      maxContentLength: 1000
    });
  });

  afterEach(() => {
    parser.reset();
  });

  describe('Initialization and Configuration', () => {
    it('should create parser with default configuration', () => {
      const defaultParser = new EventParserService();
      expect(defaultParser).toBeInstanceOf(EventParserService);
      expect(defaultParser.getErrors()).toHaveLength(0);
    });

    it('should merge custom configuration', () => {
      const customParser = new EventParserService({
        validateInput: false,
        extractCommands: false,
        maxContentLength: 500
      });
      expect(customParser).toBeInstanceOf(EventParserService);
    });

    it('should reset parser state correctly', () => {
      parser.extractCommands('test content');
      parser.reset();
      expect(parser.getErrors()).toHaveLength(0);
    });
  });

  describe('Basic JSONL Parsing', () => {
    it('should parse valid user input event', async () => {
      const jsonlLine = SAMPLE_JSONL_ENTRIES[0]; // User input
      const event = await parser.parseEvent(jsonlLine);

      expect(event).toBeDefined();
      expect(event?.type).toBe('user_input');
      expect(event?.role).toBe('user');
      expect(event?.content).toBe('Hello, can you help me with a task?');
      expect(event?.sessionId).toBe('session-123');
      expect(event?.id).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(event?.timestamp).toBeInstanceOf(Date);
    });

    it('should parse valid assistant response event', async () => {
      const jsonlLine = SAMPLE_JSONL_ENTRIES[1]; // Assistant response
      const event = await parser.parseEvent(jsonlLine);

      expect(event).toBeDefined();
      expect(event?.type).toBe('assistant_response');
      expect(event?.role).toBe('assistant');
      expect(event?.content).toContain('I\'ll help you with that task');
      expect(event?.performance?.tokenCount).toBe(40); // 25 input + 15 output
    });

    it('should handle empty lines gracefully', async () => {
      const event = await parser.parseEvent('');
      expect(event).toBeNull();
      
      const event2 = await parser.parseEvent('   \n  ');
      expect(event2).toBeNull();
    });

    it('should handle malformed JSON', async () => {
      const event = await parser.parseEvent(INVALID_JSONL_ENTRIES[0]);
      expect(event).toBeNull();
      
      const errors = parser.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].severity).toBe('critical');
      expect(errors[0].error).toContain('Invalid JSON');
    });

    it('should handle schema validation failures', async () => {
      const event = await parser.parseEvent(INVALID_JSONL_ENTRIES[1]);
      expect(event).toBeNull();
      
      const errors = parser.getErrors();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].severity).toBe('high');
      expect(errors[0].error).toContain('Schema validation failed');
    });

    it('should parse multiple events from content', async () => {
      const content = SAMPLE_JSONL_ENTRIES.slice(0, 3).join('\n');
      const events = await parser.parseEvents(content);

      expect(events).toHaveLength(3);
      expect(events[0].type).toBe('user_input');
      expect(events[1].type).toBe('assistant_response');
      expect(events[2].type).toBe('clear_command');
    });
  });

  describe('Event Type Classification', () => {
    it('should classify clear command correctly', async () => {
      const jsonlLine = SAMPLE_JSONL_ENTRIES[2]; // Clear command
      const event = await parser.parseEvent(jsonlLine);

      expect(event?.type).toBe('clear_command');
      expect(event?.metadata?.clearCommand).toBe(true);
    });

    it('should classify error events correctly', async () => {
      const jsonlLine = SAMPLE_JSONL_ENTRIES[3]; // Error message
      const event = await parser.parseEvent(jsonlLine);

      expect(event?.type).toBe('error');
      expect(event?.error).toBeDefined();
      expect(event?.error?.severity).toBe('high');
      expect(event?.error?.message).toContain('Error: File not found');
    });

    it('should classify file operations correctly', async () => {
      const jsonlLine = SAMPLE_JSONL_ENTRIES[4]; // File operation
      const event = await parser.parseEvent(jsonlLine);

      expect(event?.type).toBe('file_operation');
      expect(event?.fileOperation).toBeDefined();
      expect(event?.fileOperation?.operation).toBe('read');
      expect(event?.fileOperation?.filePath).toBe('/mnt/d/repos/test/src/main.ts');
    });

    it('should classify tool calls correctly', async () => {
      const jsonlLine = SAMPLE_JSONL_ENTRIES[1]; // Assistant with requestId (tool call)
      const event = await parser.parseEvent(jsonlLine);

      expect(event?.toolExecution).toBeDefined();
      expect(event?.toolExecution?.success).toBe(true);
      expect(event?.toolExecution?.startTime).toBeInstanceOf(Date);
    });

    it('should handle complex structured content', async () => {
      const jsonlLine = SAMPLE_JSONL_ENTRIES[5]; // Structured content array
      const event = await parser.parseEvent(jsonlLine);

      expect(event).toBeDefined();
      expect(event?.content).toContain('Here\'s the content of the file:');
      expect(event?.content).toContain('console.log(\'Hello World\');');
    });
  });

  describe('Command Extraction', () => {
    it('should extract slash commands correctly', () => {
      COMMAND_EXAMPLES.forEach(example => {
        const commands = parser.extractCommands(example.content);
        expect(commands.length).toBeGreaterThan(0);
        
        const command = commands.find(c => c.command === example.expectedCommand);
        expect(command).toBeDefined();
        expect(command?.isSlashCommand).toBe(example.expectedCommand.startsWith('/'));
      });
    });

    it('should extract clear command specifically', () => {
      const content = '<command-name>/clear</command-name>';
      const commands = parser.extractCommands(content);
      
      expect(commands).toHaveLength(1);
      expect(commands[0].command).toBe('/clear');
      expect(commands[0].isSlashCommand).toBe(true);
    });

    it('should extract SC commands', () => {
      const implementContent = '<command-name>/sc:implement</command-name>';
      const loadContent = '<command-name>/sc:load</command-name>';
      const saveContent = '<command-name>/sc:save</command-name>';

      const implementCommands = parser.extractCommands(implementContent);
      const loadCommands = parser.extractCommands(loadContent);
      const saveCommands = parser.extractCommands(saveContent);

      expect(implementCommands[0].command).toBe('/sc:implement');
      expect(loadCommands[0].command).toBe('/sc:load');
      expect(saveCommands[0].command).toBe('/sc:save');
    });

    it('should extract custom commands', () => {
      const content = 'Some text with <command-name>custom-action</command-name> in it';
      const commands = parser.extractCommands(content);
      
      expect(commands).toHaveLength(1);
      expect(commands[0].command).toBe('custom-action');
      expect(commands[0].isSlashCommand).toBe(false);
    });

    it('should handle content without commands', () => {
      const content = 'This is just regular text without any commands';
      const commands = parser.extractCommands(content);
      
      expect(commands).toHaveLength(0);
    });

    it('should include context and timestamp', () => {
      const content = '<command-name>/test</command-name>';
      const commands = parser.extractCommands(content);
      
      expect(commands[0].context).toBe(content);
      expect(commands[0].timestamp).toBeInstanceOf(Date);
      expect(commands[0].args).toEqual([]);
    });
  });

  describe('File Operation Detection', () => {
    it('should detect different file operations', () => {
      FILE_OPERATION_EXAMPLES.forEach(example => {
        const event = {
          content: example.content,
          type: 'assistant_response' as ConversationEventType
        };
        
        const fileOp = (parser as any).extractFileOperation(example.content);
        expect(fileOp).toBeDefined();
        expect(fileOp.operation).toBe(example.expectedOperation);
        expect(fileOp.filePath).toBe(example.expectedPath);
      });
    });

    it('should detect file paths in content', () => {
      const content = 'Working with file /home/user/project/src/app.ts for the implementation';
      const metadata = (parser as any).buildMetadata({ type: 'assistant' }, content);
      
      expect(metadata.mentionedFile).toBe('/home/user/project/src/app.ts');
    });

    it('should return undefined for non-file content', () => {
      const content = 'This is just regular text without file references';
      const fileOp = (parser as any).extractFileOperation(content);
      
      expect(fileOp).toBeUndefined();
    });
  });

  describe('Error Detection and Classification', () => {
    it('should detect different error severities', () => {
      ERROR_EXAMPLES.forEach(example => {
        const error = (parser as any).extractError(example.content);
        expect(error).toBeDefined();
        expect(error.severity).toBe(example.expectedSeverity);
        expect(error.message).toContain(example.content.slice(0, 200));
      });
    });

    it('should detect recoverable vs non-recoverable errors', () => {
      const criticalError = 'Critical system failure occurred';
      const regularError = 'Error: File not found';

      const critical = (parser as any).extractError(criticalError);
      const regular = (parser as any).extractError(regularError);

      expect(critical.recoverable).toBe(false);
      expect(regular.recoverable).toBe(true);
    });

    it('should return undefined for non-error content', () => {
      const content = 'This is normal content without errors';
      const error = (parser as any).extractError(content);
      
      expect(error).toBeUndefined();
    });
  });

  describe('Pattern Matching and Metadata', () => {
    it('should apply pattern matching to metadata', () => {
      const content = 'Warning: context limit approaching, memory usage high';
      const metadata = (parser as any).buildMetadata({ type: 'assistant' }, content);

      expect(metadata.warningMessage).toBe(true);
      expect(metadata.contextPressure).toBe(true);
    });

    it('should detect session markers', () => {
      const sessionStartContent = 'Session started successfully';
      const sessionEndContent = 'Session ended';

      const startType = (parser as any).determineEventType({ type: 'assistant' }, sessionStartContent);
      const endType = (parser as any).determineEventType({ type: 'assistant' }, sessionEndContent);

      expect(startType).toBe('session_start');
      expect(endType).toBe('session_end');
    });

    it('should detect welcome banner', () => {
      const content = 'Welcome to Claude Code - your AI programming assistant';
      const metadata = (parser as any).buildMetadata({ type: 'assistant' }, content);

      expect(metadata.welcomeBanner).toBe(true);
    });

    it('should detect token usage patterns', () => {
      const content = 'Processing completed. Total tokens used: 150';
      const metadata = (parser as any).buildMetadata({ type: 'assistant' }, content);

      expect(metadata.tokenUsage).toBe(true);
    });
  });

  describe('Content Processing', () => {
    it('should truncate long content correctly', async () => {
      const longContent = 'x'.repeat(2000);
      const longParser = new EventParserService({ maxContentLength: 100 });
      
      const jsonlLine = JSON.stringify({
        uuid: "123e4567-e89b-12d3-a456-426614174000",
        parentUuid: null,
        sessionId: "session-123",
        timestamp: "2025-01-15T10:30:00.000Z",
        type: "user",
        cwd: "/test",
        message: { role: "user", content: longContent }
      });

      const event = await longParser.parseEvent(jsonlLine);
      
      expect(event?.content).toHaveLength(100 + '... [truncated]'.length);
      expect(event?.content).toEndWith('... [truncated]');
    });

    it('should handle array content format', () => {
      const arrayContent = [
        { type: 'text', text: 'First part' },
        { type: 'code', code: 'console.log("test");' },
        { type: 'text', text: 'Second part' }
      ];

      const extracted = (parser as any).extractContent(arrayContent);
      expect(extracted).toContain('First part');
      expect(extracted).toContain('console.log("test");');
      expect(extracted).toContain('Second part');
    });

    it('should handle mixed content types in arrays', () => {
      const mixedContent = ['string', { type: 'text', text: 'object' }, 123];
      const extracted = (parser as any).extractContent(mixedContent);
      
      expect(extracted).toContain('string');
      expect(extracted).toContain('object');
      expect(extracted).toContain('123');
    });
  });

  describe('Timestamp Parsing', () => {
    it('should parse ISO timestamps correctly', () => {
      const isoTimestamp = '2025-01-15T10:30:00.000Z';
      const parsed = (parser as any).parseTimestamp(isoTimestamp);
      
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.toISOString()).toBe(isoTimestamp);
    });

    it('should fallback to current time for invalid timestamps', () => {
      const invalidTimestamp = 'not-a-date';
      const before = new Date();
      const parsed = (parser as any).parseTimestamp(invalidTimestamp);
      const after = new Date();
      
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(parsed.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('Tool Execution Detection', () => {
    it('should detect tool execution from content patterns', () => {
      const toolContent = 'Executing tool call to read file';
      const rawEntry = {
        type: 'assistant' as const,
        requestId: 'req-123'
      };

      const isToolExecution = (parser as any).isToolExecution(toolContent, rawEntry);
      expect(isToolExecution).toBe(true);
    });

    it('should detect tool execution from requestId presence', () => {
      const normalContent = 'Just a regular response';
      const rawEntry = {
        type: 'assistant' as const,
        requestId: 'req-456'
      };

      const isToolExecution = (parser as any).isToolExecution(normalContent, rawEntry);
      expect(isToolExecution).toBe(true);
    });

    it('should not detect tool execution for user messages', () => {
      const toolContent = 'tool call';
      const rawEntry = {
        type: 'user' as const,
        requestId: 'req-123'
      };

      const toolExecution = (parser as any).extractToolExecution(rawEntry, toolContent);
      expect(toolExecution).toBeUndefined();
    });
  });

  describe('Event Validation', () => {
    it('should validate correct events', async () => {
      const jsonlLine = SAMPLE_JSONL_ENTRIES[0];
      const event = await parser.parseEvent(jsonlLine);
      
      expect(event).toBeDefined();
      const isValid = parser.validateEvent(event!);
      expect(isValid).toBe(true);
    });

    it('should reject invalid events', () => {
      const invalidEvent = {
        id: 'test',
        // Missing required fields
      } as any;

      const isValid = parser.validateEvent(invalidEvent);
      expect(isValid).toBe(false);
      
      const errors = parser.getErrors();
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('Error Collection and Management', () => {
    it('should collect parsing errors', async () => {
      await parser.parseEvent(INVALID_JSONL_ENTRIES[0]);
      await parser.parseEvent(INVALID_JSONL_ENTRIES[1]);

      const errors = parser.getErrors();
      expect(errors.length).toBeGreaterThan(0);
      
      errors.forEach(error => {
        expect(error.line).toBeGreaterThan(0);
        expect(error.error).toBeDefined();
        expect(error.rawContent).toBeDefined();
        expect(['low', 'medium', 'high', 'critical']).toContain(error.severity);
      });
    });

    it('should clear errors', async () => {
      await parser.parseEvent(INVALID_JSONL_ENTRIES[0]);
      expect(parser.getErrors().length).toBeGreaterThan(0);

      parser.clearErrors();
      expect(parser.getErrors()).toHaveLength(0);
    });

    it('should track line numbers correctly', async () => {
      await parser.parseEvent(INVALID_JSONL_ENTRIES[0], 5);
      await parser.parseEvent(INVALID_JSONL_ENTRIES[1], 10);

      const errors = parser.getErrors();
      expect(errors[0].line).toBe(5);
      expect(errors[1].line).toBe(10);
    });
  });

  describe('Convenience Functions', () => {
    it('should parse single line with parseJSONLLine', async () => {
      const event = await parseJSONLLine(SAMPLE_JSONL_ENTRIES[0]);
      
      expect(event).toBeDefined();
      expect(event?.type).toBe('user_input');
    });

    it('should parse multiple lines with parseJSONLContent', async () => {
      const content = SAMPLE_JSONL_ENTRIES.slice(0, 2).join('\n');
      const events = await parseJSONLContent(content);
      
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('user_input');
      expect(events[1].type).toBe('assistant_response');
    });

    it('should create parser with factory function', () => {
      const customParser = createEventParser({
        maxContentLength: 500,
        validateInput: false
      });
      
      expect(customParser).toBeInstanceOf(EventParserService);
    });
  });

  describe('Edge Cases and Robustness', () => {
    it('should handle null and undefined content', () => {
      const extracted1 = (parser as any).extractContent(null);
      const extracted2 = (parser as any).extractContent(undefined);
      
      expect(extracted1).toBe('null');
      expect(extracted2).toBe('undefined');
    });

    it('should handle empty arrays in content', () => {
      const extracted = (parser as any).extractContent([]);
      expect(extracted).toBe('');
    });

    it('should handle circular references safely', () => {
      const circular: any = { prop: 'value' };
      circular.self = circular;
      
      // Should not throw
      expect(() => {
        const extracted = (parser as any).extractContent([circular]);
      }).not.toThrow();
    });

    it('should handle very large line numbers', async () => {
      const largeLineNumber = 999999;
      await parser.parseEvent(INVALID_JSONL_ENTRIES[0], largeLineNumber);
      
      const errors = parser.getErrors();
      expect(errors[0].line).toBe(largeLineNumber);
    });

    it('should handle content with special characters', async () => {
      const specialContent = 'Content with émojis 🎉 and unicôde characters';
      const jsonlLine = JSON.stringify({
        uuid: "123e4567-e89b-12d3-a456-426614174000",
        parentUuid: null,
        sessionId: "session-123",
        timestamp: "2025-01-15T10:30:00.000Z",
        type: "user",
        cwd: "/test",
        message: { role: "user", content: specialContent }
      });

      const event = await parser.parseEvent(jsonlLine);
      expect(event?.content).toBe(specialContent);
    });
  });
});