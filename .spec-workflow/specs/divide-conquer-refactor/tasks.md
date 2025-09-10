# Tasks Document

<!-- AI Instructions: For each task, generate a _Prompt field with structured AI guidance following this format:
_Prompt: Role: [specialized developer role] | Task: [clear task description with context references] | Restrictions: [what not to do, constraints] | Success: [specific completion criteria]_
This helps provide better AI agent guidance beyond simple "work on this task" prompts. -->

- [x] 1. Initialize Next.js project with TypeScript
  - File: package.json, next.config.js, tsconfig.json, app/layout.tsx
  - Create new Next.js 14+ project with App Router
  - Configure TypeScript with strict mode and proper app directory structure
  - Purpose: Establish modern Next.js foundation for monitoring application
  - _Leverage: Next.js 14 best practices, TypeScript strict configuration_
  - _Python Reference: Extract project structure patterns from src/ directory organization_
  - _Requirements: 1.1_
  - _Prompt: Role: Full-stack Developer specializing in Next.js and TypeScript project setup | Task: Initialize a new Next.js 14+ project with App Router and TypeScript strict mode following requirement 1.1, using app directory structure inspired by the Python src/ organization | Restrictions: Must use App Router only, maintain strict TypeScript settings, follow Next.js 14 conventions | Success: Project initializes correctly, TypeScript compiles without errors, App Router structure mirrors Python module organization_

- [x] 2. Create core TypeScript interfaces
  - File: app/lib/types/conversation.ts, app/lib/types/state.ts, app/lib/types/project.ts
  - Define ConversationEvent, StateAnalysis, ProjectInfo interfaces
  - Add comprehensive typing for JSONL data structures
  - Purpose: Establish type safety for JSONL event processing
  - _Leverage: TypeScript utility types, Zod validation schemas_
  - _Python Reference: Convert Python dataclasses from src/parsing/log_parser.py LogLine and LogContext classes_
  - _Requirements: 2.1, 2.2_
  - _Prompt: Role: TypeScript Developer specializing in type systems and data modeling | Task: Create comprehensive TypeScript interfaces following requirements 2.1 and 2.2, converting Python dataclasses from src/parsing/log_parser.py LogLine and LogContext to TypeScript interfaces | Restrictions: Must provide complete type coverage for JSONL structure, maintain type safety throughout, do not use 'any' types | Success: All interfaces compile without errors, complete type coverage for JSONL data, runtime validation with Zod schemas_

- [x] 3. Set up file system monitoring service
  - File: app/lib/services/jsonl-monitor.ts
  - Implement file watching for `~/.claude/projects/` directories
  - Add project path encoding/decoding logic
  - Purpose: Monitor Claude Code JSONL files for real-time changes
  - _Leverage: Node.js fs.watch, chokidar for cross-platform file watching_
  - _Python Reference: Convert logic from src/parsing/log_parser.py LogFileMonitor class and file monitoring methods_
  - _Requirements: 3.1, 3.2_
  - _Prompt: Role: Backend Developer with expertise in Node.js file system operations and real-time monitoring | Task: Implement robust file system monitoring following requirements 3.1 and 3.2, converting Python file monitoring logic from src/parsing/log_parser.py LogFileMonitor to TypeScript | Restrictions: Must handle file permission errors gracefully, avoid polling when possible, maintain memory efficiency with large file counts | Success: File monitoring works reliably across platforms, path encoding/decoding matches Python implementation, handles edge cases gracefully_

- [x] 4. Create JSONL event parser service
  - File: app/lib/services/event-parser.ts
  - Parse JSONL lines into TypeScript objects with validation
  - Extract commands and tool calls from message content
  - Purpose: Convert raw JSONL data into structured events
  - _Leverage: Zod for validation, date-fns for timestamp parsing_
  - _Python Reference: Convert parsing logic from src/parsing/log_parser.py LogLine class and parsing methods_
  - _Requirements: 4.1, 4.2_
  - _Prompt: Role: Data Processing Engineer with expertise in JSON parsing and validation | Task: Implement robust JSONL event parser following requirements 4.1 and 4.2, converting Python parsing logic from src/parsing/log_parser.py LogLine class to TypeScript with Zod validation | Restrictions: Must validate all input data, handle malformed JSON gracefully, maintain parsing performance with large files | Success: Parser handles all JSONL formats correctly, validation catches invalid data, command extraction matches Python implementation accuracy_

- [x] 5. Implement state detection algorithms
  - File: app/lib/services/state-detector.ts
  - Analyze conversation events to determine Claude's state
  - Implement confidence scoring and transition detection
  - Purpose: Detect ACTIVE/INACTIVE states from structured events
  - _Leverage: Finite state machine patterns, event analysis algorithms_
  - _Python Reference: Convert state detection logic from src/detection/state_detector.py ClaudeState enum and StateDetection class_
  - _Requirements: 5.1, 5.2_
  - _Prompt: Role: Software Engineer specializing in state machines and pattern recognition | Task: Implement intelligent state detection algorithms following requirements 5.1 and 5.2, converting Python state detection from src/detection/state_detector.py ClaudeState and StateDetection to TypeScript | Restrictions: Must maintain high accuracy in state detection, avoid false positives, handle edge cases in conversation flow | Success: State detection accuracy matches Python implementation, confidence scores reflect actual certainty, state transitions are detected correctly_

- [x] 6. Create recovery action service
  - File: app/lib/services/recovery-actions.ts
  - Implement Claude Code SDK integration for command execution
  - Add recovery action validation and execution
  - Purpose: Execute recovery commands through Claude Code API
  - _Leverage: Claude Code TypeScript SDK, command validation_
  - _Python Reference: Convert recovery logic from src/recovery/ directory and src/decision/decision_engine.py process_detection function_
  - _Requirements: 6.1, 6.2_
  - _Prompt: Role: Integration Developer with expertise in API integration and command execution | Task: Implement recovery action service following requirements 6.1 and 6.2, converting Python recovery logic from src/recovery/ and src/decision/decision_engine.py to TypeScript with Claude Code SDK | Restrictions: Must validate recovery conditions before execution, handle API failures gracefully, maintain command execution security | Success: Recovery actions execute reliably, API integration works correctly, validation logic matches Python implementation_

- [x] 7. Set up WebSocket server for real-time updates
  - File: app/lib/websocket/server.ts, app/api/socket/route.ts
  - Implement Socket.IO server with Next.js API routes
  - Add event broadcasting for monitoring updates
  - Purpose: Provide real-time dashboard updates for monitoring events
  - _Leverage: Socket.IO, Next.js API routes_
  - _Python Reference: Convert real-time update patterns from src/daemon.py main loop and component callbacks_
  - _Requirements: 7.1_
  - _Prompt: Role: Real-time Systems Developer with expertise in WebSocket implementation and Next.js | Task: Implement WebSocket server for real-time monitoring updates following requirement 7.1, converting Python daemon real-time patterns from src/daemon.py main loop to TypeScript WebSocket implementation | Restrictions: Must handle connection management properly, ensure efficient event broadcasting, maintain connection stability | Success: WebSocket connections are stable, real-time updates work correctly, event frequency matches Python daemon loop timing_

- [x] 8. Create project monitoring dashboard
  - File: app/components/dashboard/project-monitor.tsx, app/dashboard/page.tsx
  - Build React component for multi-project monitoring
  - Add real-time status indicators and state visualization
  - Purpose: Main dashboard for monitoring Claude Code projects
  - _Leverage: React 18+, Tailwind CSS, Recharts for visualization_
  - _Python Reference: Convert monitoring display logic from src/daemon.py statistics and status reporting methods_
  - _Requirements: 8.1, 8.2_
  - _Prompt: Role: Frontend Developer specializing in React dashboards and data visualization | Task: Create comprehensive project monitoring dashboard following requirements 8.1 and 8.2, converting Python monitoring display logic from src/daemon.py statistics and status reporting to React components | Restrictions: Must maintain responsive design, ensure accessibility compliance, handle real-time data efficiently | Success: Dashboard displays project status clearly matching Python daemon output, real-time updates work smoothly, user experience is intuitive and responsive_

- [x] 9. Implement session viewer component
  - File: app/components/dashboard/session-viewer.tsx, app/sessions/[id]/page.tsx
  - Create detailed conversation event timeline
  - Add event filtering and search capabilities
  - Purpose: Detailed view of conversation sessions with event history
  - _Leverage: React Query for data management, virtualization for performance_
  - _Python Reference: Convert context display logic from src/parsing/log_parser.py LogContext class methods_
  - _Requirements: 9.1, 9.2_
  - _Prompt: Role: Frontend Developer with expertise in complex data visualization and performance optimization | Task: Implement detailed session viewer following requirements 9.1 and 9.2, converting Python context display from src/parsing/log_parser.py LogContext to React timeline component | Restrictions: Must handle large event datasets efficiently, maintain smooth scrolling performance, ensure data consistency | Success: Session viewer handles large datasets smoothly matching Python LogContext performance, filtering and search work accurately, timeline visualization is clear and informative_

- [x] 10. Build recovery controls interface
  - File: app/components/dashboard/recovery-controls.tsx, app/recovery/page.tsx
  - Create interactive controls for manual and automated recovery
  - Add form validation and confirmation dialogs
  - Purpose: User interface for recovery action management
  - _Leverage: React Hook Form, Zod validation, custom UI components_
  - _Python Reference: Convert recovery trigger logic from src/decision/decision_engine.py and recovery execution from src/recovery/ modules_
  - _Requirements: 10.1, 10.2_
  - _Prompt: Role: UX Developer with expertise in interactive interfaces and form handling | Task: Build intuitive recovery controls interface following requirements 10.1 and 10.2, converting Python recovery trigger logic from src/decision/decision_engine.py to React form components | Restrictions: Must prevent accidental actions, validate all user inputs, provide clear feedback on actions | Success: Controls are intuitive and safe to use, validation prevents invalid actions matching Python validation logic, user feedback is clear and helpful_

- [x] 11. Set up database with Prisma
  - File: app/lib/database/schema.prisma, app/lib/database/client.ts
  - Define database schema for session persistence
  - Configure Prisma ORM with Next.js integration
  - Purpose: Persist session data and monitoring history
  - _Leverage: Prisma ORM, SQLite for development, type-safe queries_
  - _Python Reference: Convert data structures from src/daemon.py statistics and session tracking variables_
  - _Requirements: 11.1_
  - _Prompt: Role: Database Engineer with expertise in Prisma ORM and data modeling | Task: Set up database schema and Prisma integration following requirement 11.1, converting Python session data structures from src/daemon.py statistics and tracking variables to Prisma schema | Restrictions: Must maintain data consistency, follow Prisma best practices, ensure migration compatibility | Success: Database schema supports all required operations matching Python data structures, Prisma integration is properly configured, queries are type-safe and efficient_

- [x] 12. Create API routes for monitoring operations
  - File: app/api/projects/route.ts, app/api/sessions/route.ts, app/api/recovery/route.ts
  - Implement RESTful API endpoints for project management
  - Add request validation and error handling
  - Purpose: Backend API for dashboard operations and data management
  - _Leverage: Next.js API routes, Zod validation, error handling middleware_
  - _Python Reference: Convert API patterns from src/daemon.py public methods and src/orchestration/ component interfaces_
  - _Requirements: 12.1, 12.2_
  - _Prompt: Role: Backend API Developer with expertise in Next.js and REST API design | Task: Implement comprehensive API routes following requirements 12.1 and 12.2, converting Python daemon public methods from src/daemon.py and orchestration interfaces to Next.js API routes | Restrictions: Must validate all requests, handle errors gracefully, maintain API consistency and documentation | Success: API endpoints work correctly matching Python daemon functionality, validation prevents invalid requests, error handling provides clear feedback_

- [ ] 13. Implement authentication and security
  - File: app/lib/auth/config.ts, app/middleware.ts
  - Add basic authentication for dashboard access
  - Implement request rate limiting and input sanitization
  - Purpose: Secure the monitoring dashboard and API endpoints
  - _Leverage: NextAuth.js or simple token-based auth, middleware protection_
  - _Python Reference: Extract security patterns from src/config/config.py and daemon initialization security checks_
  - _Requirements: 13.1_
  - _Prompt: Role: Security Engineer with expertise in web application security and authentication | Task: Implement authentication and security measures following requirement 13.1, adapting security patterns from Python src/config/config.py to Next.js middleware and auth | Restrictions: Must not expose sensitive data, implement proper session management, validate all user inputs | Success: Authentication works correctly, security measures prevent unauthorized access matching Python config security, sensitive data is properly protected_

- [ ] 14. Add comprehensive error handling and logging
  - File: app/lib/utils/error-handler.ts, app/lib/utils/logger.ts
  - Implement centralized error handling for all services
  - Add structured logging for debugging and monitoring
  - Purpose: Robust error handling and debugging capabilities
  - _Leverage: Winston or Pino for logging, custom error classes_
  - _Python Reference: Convert error handling patterns from src/monitor_logging/logger.py and daemon error handling_
  - _Requirements: 14.1_
  - _Prompt: Role: DevOps Engineer with expertise in application logging and error handling | Task: Implement comprehensive error handling and logging following requirement 14.1, converting Python logging patterns from src/monitor_logging/logger.py to TypeScript structured logging | Restrictions: Must not log sensitive data, maintain log performance, ensure error handling doesn't mask issues | Success: Error handling is consistent throughout application, logging provides useful debugging information matching Python logging detail, performance impact is minimal_

- [ ] 15. Create unit tests for core services
  - File: app/__tests__/services/jsonl-monitor.test.ts, app/__tests__/services/event-parser.test.ts
  - Write comprehensive unit tests for monitoring services
  - Add test fixtures and mock data for JSONL processing
  - Purpose: Ensure reliability and catch regressions in core services
  - _Leverage: Jest, testing utilities, mock file systems_
  - _Python Reference: Convert test patterns from existing Python test structure and create equivalent test coverage_
  - _Requirements: 15.1, 15.2_
  - _Prompt: Role: QA Engineer with expertise in unit testing and Jest framework | Task: Create comprehensive unit tests for core services following requirements 15.1 and 15.2, establishing Jest test coverage equivalent to Python test patterns | Restrictions: Must test both success and failure scenarios, maintain test isolation, do not test external dependencies directly | Success: Unit tests achieve high coverage matching Python test thoroughness, all edge cases are tested, tests run reliably and independently_

- [ ] 16. Write integration tests
  - File: app/__tests__/integration/monitoring-flow.test.ts
  - Test complete monitoring workflow from JSONL to dashboard
  - Add tests for WebSocket communication and API endpoints
  - Purpose: Validate complete system integration and workflows
  - _Leverage: Jest, Supertest for API testing, WebSocket testing utilities_
  - _Python Reference: Convert integration test patterns from Python daemon workflow testing and component integration_
  - _Requirements: 16.1_
  - _Prompt: Role: Integration Test Engineer with expertise in full-stack testing | Task: Create comprehensive integration tests following requirement 16.1, testing complete monitoring workflows equivalent to Python daemon integration patterns | Restrictions: Must test realistic scenarios, ensure test environment isolation, maintain test performance | Success: Integration tests cover critical workflows matching Python system integration, tests validate system behavior accurately, test suite runs efficiently_

- [ ] 17. Set up E2E testing with Playwright
  - File: app/e2e/dashboard.spec.ts, app/e2e/recovery-actions.spec.ts
  - Create end-to-end tests for dashboard functionality
  - Test user workflows and recovery scenarios
  - Purpose: Validate complete user experience and critical workflows
  - _Leverage: Playwright, test fixtures, page object patterns_
  - _Python Reference: Convert user workflow scenarios from Python daemon operation patterns to E2E test scenarios_
  - _Requirements: 17.1_
  - _Prompt: Role: E2E Testing Specialist with expertise in Playwright and user workflow testing | Task: Implement comprehensive E2E tests following requirement 17.1, testing user workflows equivalent to Python daemon operation scenarios | Restrictions: Must test real user scenarios, ensure tests are maintainable, avoid testing implementation details | Success: E2E tests cover all critical user journeys matching Python daemon capabilities, tests run reliably in different browsers, user experience is validated end-to-end_

- [ ] 18. Create configuration and deployment setup
  - File: next.config.js, Dockerfile, docker-compose.yml, app/lib/config/settings.ts
  - Configure production deployment settings
  - Add Docker containerization for easy deployment
  - Purpose: Production-ready deployment configuration
  - _Leverage: Next.js production optimizations, Docker best practices_
  - _Python Reference: Convert configuration patterns from src/config/ directory structure and deployment approach_
  - _Requirements: 18.1_
  - _Prompt: Role: DevOps Engineer with expertise in Next.js deployment and containerization | Task: Create production deployment configuration following requirement 18.1, converting Python configuration patterns from src/config/ to Next.js deployment setup | Restrictions: Must optimize for production performance, ensure security best practices, maintain deployment reliability | Success: Application deploys successfully to production, performance is optimized, deployment process matches Python deployment reliability_

- [ ] 19. Add documentation and usage guides
  - File: README.md, app/docs/setup.md, app/docs/api.md
  - Write comprehensive setup and usage documentation
  - Add API documentation and troubleshooting guides
  - Purpose: Enable easy setup and maintenance of the monitoring system
  - _Leverage: Markdown documentation, API documentation tools_
  - _Python Reference: Convert documentation patterns from Python codebase comments and existing README structure_
  - _Requirements: 19.1_
  - _Prompt: Role: Technical Writer with expertise in developer documentation | Task: Create comprehensive documentation following requirement 19.1, converting Python codebase documentation and comments to Next.js application documentation | Restrictions: Must be clear and actionable, include troubleshooting information, maintain documentation consistency | Success: Documentation is complete and easy to follow covering all Python functionality equivalents, covers all necessary topics, enables successful setup and usage_

- [ ] 20. Final integration and performance optimization
  - File: Multiple files across the app/ directory
  - Integrate all components and optimize performance
  - Conduct final testing and bug fixes
  - Purpose: Complete system integration with optimized performance
  - _Leverage: Next.js performance tools, profiling utilities, load testing_
  - _Python Reference: Ensure performance characteristics match or exceed Python daemon performance benchmarks_
  - _Requirements: All_
  - _Prompt: Role: Senior Full-stack Developer with expertise in system integration and performance optimization | Task: Complete final integration covering all requirements, optimize system performance to match or exceed Python daemon benchmarks, and resolve any remaining issues | Restrictions: Must not break existing functionality, maintain code quality standards, ensure performance meets Python daemon standards | Success: All components work together seamlessly, performance meets or exceeds Python implementation, system meets all functional and non-functional requirements with feature parity to Python version_