# Requirements Document

## Introduction

The Claude Auto-Recovery System is an automated monitoring solution that detects when Claude Code execution stops mid-task, automatically runs `/compact` to free up context, provides appropriate new instructions to resume work, and intelligently terminates monitoring when all tasks are completed. This system addresses the common problem where Claude Code becomes unresponsive due to context limitations or requires user input during long-running tasks, leading to workflow interruptions and lost productivity.

The system builds upon the TCP control and logging framework described in the blog post "Claude Codeのttyをexpectでハックする - TCP制御とログ監視で実現する柔軟な自動化基盤" to create a robust automated recovery mechanism.

## Alignment with Product Vision

This feature supports developer productivity by:
- Eliminating manual intervention when Claude Code stops mid-execution
- Reducing context-related failures through automatic context management
- Maintaining workflow continuity during complex, multi-step tasks
- Providing seamless recovery from common Claude Code interruption scenarios
- Automatically terminating monitoring when all work is complete to optimize resource usage
- Integrating with spec-workflow system for intelligent task completion detection

## Requirements

### Requirement 1: Claude Execution State Detection

**User Story:** As a developer, I want the system to automatically detect when Claude Code has stopped responding or is waiting for input, so that I don't need to constantly monitor its execution status.

#### Acceptance Criteria

1. WHEN Claude Code output stops for more than configurable timeout (default 30 seconds) THEN system SHALL detect idle state
2. WHEN Claude Code displays input prompts or confirmation dialogs THEN system SHALL detect input-waiting state
3. WHEN Claude Code encounters context limit warnings THEN system SHALL detect context-pressure state
4. WHEN Claude Code displays error messages or failure conditions THEN system SHALL detect error state
5. IF multiple detection patterns match THEN system SHALL prioritize context-pressure > input-waiting > error > idle

### Requirement 2: Automatic Context Management

**User Story:** As a developer, I want the system to automatically run `/compact` when Claude Code reaches context limits, so that execution can continue without manual intervention.

#### Acceptance Criteria

1. WHEN context-pressure state is detected THEN system SHALL execute `/compact` command via TCP interface
2. WHEN `/compact` command completes successfully THEN system SHALL wait for Claude to be ready (prompt appears)
3. IF `/compact` command fails THEN system SHALL retry up to 3 times with exponential backoff
4. WHEN context compaction is successful THEN system SHALL log the action and continue with recovery process

### Requirement 3: Intelligent Task Resumption

**User Story:** As a developer, I want the system to provide appropriate instructions to resume the interrupted task, so that work continues seamlessly from where it left off.

#### Acceptance Criteria

1. WHEN Claude Code is ready after recovery THEN system SHALL analyze the last task context from terminal logs
2. WHEN task context is identified THEN system SHALL generate resumption instructions based on task type and current state
3. IF previous task was code generation THEN system SHALL provide "continue implementation" instructions
4. IF previous task was analysis THEN system SHALL provide "continue analysis from last checkpoint" instructions
5. IF previous task was testing THEN system SHALL provide "resume testing process" instructions
6. WHEN resumption instructions are ready THEN system SHALL send them via TCP interface

### Requirement 4: Configurable Monitoring Parameters

**User Story:** As a developer, I want to configure monitoring timeouts and recovery behavior, so that the system adapts to my specific workflow needs.

#### Acceptance Criteria

1. WHEN system starts THEN configuration SHALL be loaded from config file or environment variables
2. IF no configuration exists THEN system SHALL use sensible defaults
3. WHEN configuration includes idle_timeout THEN system SHALL use it for idle state detection (min: 10s, max: 300s)
4. WHEN configuration includes input_timeout THEN system SHALL use it for input-waiting detection (min: 5s, max: 60s)
5. WHEN configuration includes retry_attempts THEN system SHALL use it for command retry logic (min: 1, max: 10)

### Requirement 5: Comprehensive Logging and Monitoring

**User Story:** As a developer, I want detailed logs of all monitoring and recovery actions, so that I can understand what happened and troubleshoot issues.

#### Acceptance Criteria

1. WHEN any state change occurs THEN system SHALL log with timestamp, state, and context
2. WHEN recovery actions are taken THEN system SHALL log command execution and results
3. WHEN errors occur THEN system SHALL log error details and recovery attempts
4. IF log file exceeds size limit THEN system SHALL rotate logs automatically
5. WHEN system runs THEN logs SHALL be written to both file and console (configurable)

### Requirement 6: Task Completion Detection and Monitoring Termination

**User Story:** As a developer, I want the system to automatically detect when all tasks are completed and stop monitoring, so that system resources are not wasted on unnecessary monitoring.

#### Acceptance Criteria

1. WHEN system starts monitoring THEN it SHALL integrate with spec-workflow to track task status
2. WHEN monitoring is active THEN system SHALL periodically query spec-workflow for remaining tasks
3. WHEN spec-workflow reports no pending or in-progress tasks THEN system SHALL detect completion state
4. WHEN all tasks are completed AND Claude Code shows ready prompt THEN system SHALL terminate monitoring gracefully
5. WHEN monitoring terminates THEN system SHALL log completion status and send final notification
6. IF new tasks are added after completion THEN system SHALL detect and resume monitoring automatically
7. WHEN task completion is detected THEN system SHALL wait for configurable cool-down period (default 60s) before termination

### Requirement 7: Safe Operation Mode

**User Story:** As a developer, I want the system to operate safely without interfering with normal Claude Code usage, so that I can trust it to run in the background.

#### Acceptance Criteria

1. WHEN Claude Code is functioning normally THEN system SHALL remain passive and only monitor
2. WHEN user is actively typing or interacting THEN system SHALL detect activity and pause monitoring
3. IF system cannot determine safe recovery action THEN system SHALL alert user instead of taking automatic action
4. WHEN system takes recovery action THEN notification SHALL be sent to user (configurable: desktop notification, log, or both)
5. IF user manually intervenes during recovery THEN system SHALL detect and yield control

## Non-Functional Requirements

### Code Architecture and Modularity
- **Single Responsibility Principle**: Separate modules for monitoring, detection, recovery, and configuration
- **Modular Design**: Independent components for log parsing, TCP communication, and state detection
- **Dependency Management**: Minimize dependencies on external libraries, use standard system tools where possible
- **Clear Interfaces**: Well-defined APIs between monitoring engine, detection logic, and recovery actions

### Performance
- Log parsing must process files up to 100MB without significant delay
- State detection must complete within 1 second of log updates
- Spec-workflow task status queries must complete within 2 seconds
- Memory usage must remain under 50MB during normal operation
- CPU usage must remain under 5% when monitoring idle Claude Code sessions
- Task completion checking must occur at configurable intervals (default: every 30 seconds)

### Security
- TCP communication must be restricted to localhost only
- Configuration files must validate input parameters to prevent injection attacks
- Log files must be protected with appropriate file permissions (readable by user only)
- System must not expose sensitive information in logs (API keys, personal data)

### Reliability
- System must continue monitoring even if individual recovery attempts fail
- System must recover gracefully from its own crashes or interruptions
- System must handle log file rotation and temporary file system issues
- System must validate all external command execution results before proceeding

### Usability
- Configuration must be possible through simple configuration files (YAML/JSON)
- System must provide clear status indicators about monitoring state
- Error messages must be actionable and include suggested remediation steps
- System must start/stop cleanly with standard system service management