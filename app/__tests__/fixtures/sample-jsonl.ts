/**
 * Test fixtures for JSONL parsing tests
 * Sample JSONL data matching actual Claude Code format
 */

export const SAMPLE_JSONL_ENTRIES = [
  // User input example
  `{"uuid":"123e4567-e89b-12d3-a456-426614174000","parentUuid":null,"sessionId":"session-123","timestamp":"2025-01-15T10:30:00.000Z","type":"user","cwd":"/mnt/d/repos/test","message":{"role":"user","content":"Hello, can you help me with a task?"},"version":"1.0.0","gitBranch":"main"}`,
  
  // Assistant response without tool call
  `{"uuid":"223e4567-e89b-12d3-a456-426614174001","parentUuid":"123e4567-e89b-12d3-a456-426614174000","sessionId":"session-123","timestamp":"2025-01-15T10:31:00.000Z","type":"assistant","cwd":"/mnt/d/repos/test","message":{"role":"assistant","content":"I'll help you with that task.","usage":{"input_tokens":25,"output_tokens":15}},"version":"1.0.0","gitBranch":"main"}`,
  
  // Clear command example
  `{"uuid":"323e4567-e89b-12d3-a456-426614174002","parentUuid":null,"sessionId":"session-123","timestamp":"2025-01-15T10:32:00.000Z","type":"user","cwd":"/mnt/d/repos/test","message":{"role":"user","content":"<command-name>/clear</command-name>"},"version":"1.0.0","gitBranch":"main"}`,
  
  // Error example
  `{"uuid":"423e4567-e89b-12d3-a456-426614174003","parentUuid":"323e4567-e89b-12d3-a456-426614174002","sessionId":"session-123","timestamp":"2025-01-15T10:33:00.000Z","type":"assistant","cwd":"/mnt/d/repos/test","message":{"role":"assistant","content":"Error: File not found at /path/to/file.txt"},"version":"1.0.0","gitBranch":"main"}`,
  
  // File operation example
  `{"uuid":"523e4567-e89b-12d3-a456-426614174004","parentUuid":"423e4567-e89b-12d3-a456-426614174003","sessionId":"session-123","timestamp":"2025-01-15T10:34:00.000Z","type":"assistant","cwd":"/mnt/d/repos/test","message":{"role":"assistant","content":"Reading file /mnt/d/repos/test/src/main.ts..."},"version":"1.0.0","gitBranch":"main"}`,
  
  // Complex structured content
  `{"uuid":"623e4567-e89b-12d3-a456-426614174005","parentUuid":"523e4567-e89b-12d3-a456-426614174004","sessionId":"session-123","timestamp":"2025-01-15T10:35:00.000Z","type":"assistant","cwd":"/mnt/d/repos/test","message":{"role":"assistant","content":[{"type":"text","text":"Here's the content of the file:"},{"type":"code","code":"console.log('Hello World');"}]},"version":"1.0.0","gitBranch":"main"}`,
];

export const INVALID_JSONL_ENTRIES = [
  // Invalid JSON
  `{invalid json}`,
  
  // Missing required fields
  `{"uuid":"123","message":{"role":"user","content":"test"}}`,
  
  // Invalid timestamp
  `{"uuid":"123e4567-e89b-12d3-a456-426614174000","parentUuid":null,"sessionId":"session-123","timestamp":"invalid-date","type":"user","cwd":"/test","message":{"role":"user","content":"test"}}`,
];

export const COMMAND_EXAMPLES = [
  {
    content: '<command-name>/clear</command-name>',
    expectedCommand: '/clear'
  },
  {
    content: '<command-name>/sc:implement</command-name>',
    expectedCommand: '/sc:implement'
  },
  {
    content: '<command-name>/sc:load</command-name>',
    expectedCommand: '/sc:load'
  },
  {
    content: 'Some text with <command-name>custom-command</command-name> inside',
    expectedCommand: 'custom-command'
  }
];

export const FILE_OPERATION_EXAMPLES = [
  {
    content: 'Reading file /path/to/file.txt',
    expectedOperation: 'read',
    expectedPath: '/path/to/file.txt'
  },
  {
    content: 'Writing to file /src/main.ts with new content',
    expectedOperation: 'write',
    expectedPath: '/src/main.ts'
  },
  {
    content: 'Editing configuration in /config/app.json',
    expectedOperation: 'edit',
    expectedPath: '/config/app.json'
  }
];

export const ERROR_EXAMPLES = [
  {
    content: 'Error: Something went wrong',
    expectedSeverity: 'high'
  },
  {
    content: 'Warning: This might cause issues',
    expectedSeverity: 'medium'
  },
  {
    content: 'Critical error in the system',
    expectedSeverity: 'high'
  }
];

// Mock file system entries for testing
export const MOCK_FS_STRUCTURE = {
  '/home/test/.claude/projects': {
    '-mnt-d-repos-test': {
      'session-123.jsonl': SAMPLE_JSONL_ENTRIES.join('\n'),
      'session-456.jsonl': SAMPLE_JSONL_ENTRIES.slice(0, 2).join('\n')
    },
    '-home-user-another-project': {
      'session-789.jsonl': SAMPLE_JSONL_ENTRIES.slice(2, 4).join('\n')
    }
  }
};