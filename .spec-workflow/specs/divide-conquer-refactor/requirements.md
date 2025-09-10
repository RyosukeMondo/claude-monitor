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

### Requirement 1: JSONL File Location and Structure Discovery

**User Story:** As a monitoring system, I want to discover and understand Claude Code JSONL file locations and structure, so that I can accurately monitor the correct sessions for each project.

#### Acceptance Criteria

1. WHEN the system starts THEN it SHALL scan `~/.claude/projects/` directories for project-specific subdirectories
2. WHEN discovering project directories THEN it SHALL map encoded project paths (e.g., `-mnt-d-repos-claude-monitor`) to actual project paths (e.g., `/mnt/d/repos/claude-monitor`)
3. WHEN parsing JSONL entries THEN it SHALL extract the `cwd` field to validate project-to-session mapping
4. WHEN monitoring a specific project THEN it SHALL locate the correct JSONL files by matching the project path with the `cwd` field in JSONL entries

**JSONL File Structure Requirements:**
- **Location Pattern**: `~/.claude/projects/[encoded-project-path]/[session-uuid].jsonl`  
- **Example**: `~/.claude/projects/-mnt-d-repos-claude-monitor/202119d9-3653-4246-a1be-00b6c0546fff.jsonl`
- **Required Fields**: Each JSONL line must contain:
  - `cwd`: Current working directory (actual project path)
  - `sessionId`: Unique session identifier
  - `type`: Message type (`user`, `assistant`)  
  - `timestamp`: ISO 8601 timestamp
  - `message`: Message content with `role` and `content` fields
  - `uuid`: Unique message identifier
  - `parentUuid`: Parent message reference for conversation threading

### Requirement 2: JSONL Log File Monitoring

**User Story:** As a monitoring system, I want to watch Claude Code JSONL log files for changes, so that I can process new conversation events in real-time.

#### Acceptance Criteria

1. WHEN monitoring a project path THEN it SHALL locate the corresponding encoded directory in `~/.claude/projects/`
2. WHEN JSONL files are created for the target project THEN the system SHALL automatically start monitoring them
3. WHEN JSONL files are modified THEN the system SHALL detect and parse only new lines added
4. WHEN monitoring multiple sessions THEN the system SHALL handle concurrent file watching efficiently
5. WHEN session files become inactive THEN the system SHALL detect when no new entries are being added

### Requirement 3: Structured Event Parsing

**User Story:** As a log processor, I want to parse JSONL entries into structured events, so that I can analyze conversation flow and command execution without dealing with raw terminal formatting.

#### Acceptance Criteria

1. WHEN processing JSONL lines THEN the system SHALL parse each line as a JSON object with validation
2. WHEN parsing user messages THEN the system SHALL extract message content, timestamps, commands, and metadata
3. WHEN parsing assistant messages THEN the system SHALL extract content, tool calls, usage statistics, and response metadata  
4. WHEN encountering malformed JSON THEN the system SHALL log errors and continue processing subsequent lines
5. WHEN parsing command messages THEN the system SHALL detect command patterns like `/clear`, `/sc:implement`, and custom commands

### Requirement 4: Project-Session Correlation

**User Story:** As a monitoring system, I want to correlate project paths with their corresponding JSONL sessions, so that I can monitor the correct Claude Code sessions for each project.

#### Acceptance Criteria

1. WHEN given a project path like `/mnt/d/repos/claude-monitor` THEN the system SHALL locate the encoded directory `-mnt-d-repos-claude-monitor`
2. WHEN finding JSONL files THEN the system SHALL validate that the `cwd` field matches the expected project path
3. WHEN multiple sessions exist for a project THEN the system SHALL identify the most recent active session
4. WHEN session resumption occurs THEN the system SHALL detect new session files and switch monitoring appropriately

### Requirement 5: Command and State Detection

**User Story:** As a state detector, I want to identify Claude's activity state from structured conversation events, so that state transitions can be detected with high accuracy without parsing terminal formatting.

#### Acceptance Criteria

1. WHEN analyzing user messages THEN the system SHALL detect commands like `/clear`, `/sc:implement`, and custom commands
2. WHEN processing assistant responses THEN the system SHALL identify ongoing tool execution vs completed responses
3. WHEN detecting message sequences THEN the system SHALL identify ACTIVE (processing) vs INACTIVE (waiting) states
4. WHEN analyzing conversation flow THEN the system SHALL track conversation context and detect completion events

### Requirement 6: Event-Driven Decision Engine

**User Story:** As a decision engine, I want to process structured conversation events rather than raw logs, so that decision logic is based on clean, reliable data.

#### Acceptance Criteria

1. WHEN receiving structured events THEN the decision engine SHALL operate on parsed JSON data with full context
2. WHEN detecting state changes THEN the decision logic SHALL use message types, commands, and response patterns
3. WHEN making recovery decisions THEN the engine SHALL have access to conversation history, timing, and command context
4. WHEN processing events THEN the decision pipeline SHALL be more maintainable than pattern-matching approaches

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
- **Path Resolution**: Efficiently resolve project path to encoded directory mapping

### Security
- **Input Validation**: All JSONL input should be validated to prevent malicious JSON injection
- **File Access Security**: Safely handle file permissions and concurrent access to JSONL logs
- **Resource Limits**: Processing should respect memory and CPU limits to prevent resource exhaustion
- **Safe JSON Parsing**: Use robust JSON parsing that handles malformed or truncated data gracefully
- **Path Sanitization**: Validate and sanitize project paths to prevent directory traversal attacks

### Reliability
- **Error Handling**: Each pipeline stage should handle JSON parsing errors gracefully without breaking the monitoring flow
- **Data Integrity**: Conversation events should be processed accurately and completely from JSONL sources
- **Fault Isolation**: File monitoring failures should not cascade to event processing or decision making
- **Recovery Capability**: System should recover gracefully from temporary file access issues or parsing errors
- **Session Continuity**: Handle session resumption and multiple concurrent sessions robustly

### Usability
- **Debug Visibility**: Each pipeline stage should provide clear logging for troubleshooting structured event processing
- **Configuration**: Monitoring parameters should be configurable (file paths, polling intervals, session timeout)
- **Monitoring Metrics**: Pipeline performance and event processing metrics should be available
- **Maintenance**: Code should be self-documenting with clear separation between file monitoring, parsing, and state detection
- **Project Discovery**: Provide clear visibility into which projects and sessions are being monitored