# Requirements Document

## Introduction

The divide and conquer refactor aims to modernize the Claude monitor system's log processing architecture by leveraging Claude Code's structured JSONL logs instead of parsing raw terminal output. This refactoring addresses the current complex approach of parsing ANSI escape sequences by utilizing the clean, structured data already available in `~/.claude/projects/*/*.jsonl` files.

Claude Code automatically saves all conversations in structured JSONL format with timestamps, session tracking, command parsing, and clean content without ANSI codes. This refactor will create a robust monitoring pipeline that processes structured events rather than raw terminal output, eliminating the complexity of ANSI sanitization, chunking, and deduplication.

## Alignment with Product Vision

This feature supports the core monitoring system's reliability and maintainability by:
- Leveraging existing structured data instead of complex terminal parsing
- Improving accuracy through clean, structured event detection
- Reducing processing overhead by eliminating ANSI parsing complexity
- Creating a foundation for sophisticated conversation analysis and state detection
- Enhancing system performance through efficient structured data processing

## Requirements

### Requirement 1: JSONL Log File Monitoring

**User Story:** As a monitoring system, I want to watch Claude Code JSONL log files for changes, so that I can process new conversation events in real-time.

#### Acceptance Criteria

1. WHEN the system starts THEN it SHALL discover existing JSONL files in `~/.claude/projects/*/` directories
2. WHEN new JSONL files are created THEN the system SHALL automatically start monitoring them
3. WHEN JSONL files are modified THEN the system SHALL detect and parse only new lines added
4. WHEN monitoring multiple projects THEN the system SHALL handle concurrent file watching efficiently

### Requirement 2: Structured Event Parsing

**User Story:** As a log processor, I want to parse JSONL entries into structured events, so that I can analyze conversation flow and command execution without dealing with raw terminal formatting.

#### Acceptance Criteria

1. WHEN processing JSONL lines THEN the system SHALL parse each line as a JSON object with validation
2. WHEN parsing user messages THEN the system SHALL extract message content, timestamps, commands, and metadata
3. WHEN parsing assistant messages THEN the system SHALL extract content, tool calls, usage statistics, and response metadata  
4. WHEN encountering malformed JSON THEN the system SHALL log errors and continue processing subsequent lines

### Requirement 3: Command and State Detection

**User Story:** As a state detector, I want to identify Claude's activity state from structured conversation events, so that state transitions can be detected with high accuracy without parsing terminal formatting.

#### Acceptance Criteria

1. WHEN analyzing user messages THEN the system SHALL detect commands like `/clear`, `/sc:implement`, and custom commands
2. WHEN processing assistant responses THEN the system SHALL identify ongoing tool execution vs completed responses
3. WHEN detecting message sequences THEN the system SHALL identify ACTIVE (processing) vs INACTIVE (waiting) states
4. WHEN analyzing conversation flow THEN the system SHALL track conversation context and detect completion events

### Requirement 4: Event-Driven Decision Engine

**User Story:** As a decision engine, I want to process structured conversation events rather than raw logs, so that decision logic is based on clean, reliable data.

#### Acceptance Criteria

1. WHEN receiving structured events THEN the decision engine SHALL operate on parsed JSON data with full context
2. WHEN detecting state changes THEN the decision logic SHALL use message types, commands, and response patterns
3. WHEN making recovery decisions THEN the engine SHALL have access to conversation history, timing, and command context
4. WHEN processing events THEN the decision pipeline SHALL be more maintainable than pattern-matching approaches

### Requirement 5: Multi-Project Session Management

**User Story:** As a monitoring system, I want to track multiple Claude Code projects and sessions simultaneously, so that I can provide comprehensive monitoring across all active development work.

#### Acceptance Criteria

1. WHEN monitoring multiple projects THEN the system SHALL maintain separate session contexts for each project
2. WHEN detecting new sessions THEN the system SHALL automatically start monitoring the new session files
3. WHEN sessions become inactive THEN the system SHALL detect idle states per project independently
4. WHEN managing session state THEN the system SHALL handle session resumption and continuation properly

## Non-Functional Requirements

### Code Architecture and Modularity
- **Single Responsibility Principle**: Each component (file monitor, event parser, state detector, decision engine) should have a single, well-defined purpose
- **Modular Design**: Components should be isolated and reusable with clean interfaces between file monitoring, parsing, and decision making
- **Dependency Management**: Minimize interdependencies between monitoring, parsing, and decision components
- **Clear Interfaces**: Define clean contracts between JSONL monitoring, event parsing, state detection, and decision execution

### Performance
- **File Monitoring Efficiency**: Use efficient file watching (inotify/fsnotify) rather than polling for JSONL changes
- **Memory Management**: Process JSONL lines incrementally without loading entire files into memory
- **Parsing Speed**: JSON parsing should be faster and more reliable than ANSI escape sequence processing
- **Real-time Processing**: Maintain low-latency event processing for responsive monitoring

### Security
- **Input Validation**: All JSONL input should be validated to prevent malicious JSON injection
- **File Access Security**: Safely handle file permissions and concurrent access to JSONL logs
- **Resource Limits**: Processing should respect memory and CPU limits to prevent resource exhaustion
- **Safe JSON Parsing**: Use robust JSON parsing that handles malformed or truncated data gracefully

### Reliability
- **Error Handling**: Each pipeline stage should handle JSON parsing errors gracefully without breaking the monitoring flow
- **Data Integrity**: Conversation events should be processed accurately and completely from JSONL sources
- **Fault Isolation**: File monitoring failures should not cascade to event processing or decision making
- **Recovery Capability**: System should recover gracefully from temporary file access issues or parsing errors

### Usability
- **Debug Visibility**: Each pipeline stage should provide clear logging for troubleshooting structured event processing
- **Configuration**: Monitoring parameters should be configurable (file paths, polling intervals, session timeout)
- **Monitoring Metrics**: Pipeline performance and event processing metrics should be available
- **Maintenance**: Code should be self-documenting with clear separation between file monitoring, parsing, and state detection