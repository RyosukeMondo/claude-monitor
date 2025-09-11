# Tasks Document

<!-- AI Instructions: For each task, generate a _Prompt field with structured AI guidance following this format:
_Prompt: Role: [specialized developer role] | Task: [clear task description with context references] | Restrictions: [what not to do, constraints] | Success: [specific completion criteria]_
This helps provide better AI agent guidance beyond simple "work on this task" prompts. -->

- [x] 1. Create environment detection service in lib/services/environment-detector.ts
  - File: lib/services/environment-detector.ts
  - Implement runtime environment detection logic
  - Detect Docker vs standalone mode automatically
  - Purpose: Enable automatic mode switching based on runtime environment
  - _Leverage: lib/config/settings.ts, process.env patterns_
  - _Requirements: 1.1, 1.2_
  - _Prompt: Role: DevOps Engineer with expertise in runtime environment detection and Node.js process management | Task: Create environment detection service that automatically identifies Docker vs standalone mode using filesystem checks, environment variables, and process detection following requirements 1.1 and 1.2, leveraging existing configuration patterns from lib/config/settings.ts | Restrictions: Must not rely on user input, should be deterministic and fast, do not make network calls for detection | Success: Service correctly identifies runtime environment, provides reliable mode detection, integrates with existing configuration system_

- [x] 2. Create standalone configuration generator in lib/config/standalone-generator.ts
  - File: lib/config/standalone-generator.ts
  - Generate .env.local files with SQLite configuration
  - Create default development settings automatically
  - Purpose: Automate initial setup for standalone development
  - _Leverage: lib/config/settings.ts Zod schemas, file system utilities_
  - _Requirements: 4.1, 4.2, 4.3_
  - _Prompt: Role: Configuration Engineer with expertise in environment setup and file generation | Task: Create configuration generator that automatically creates .env.local files with SQLite settings and development defaults following requirements 4.1-4.3, using existing Zod validation schemas from lib/config/settings.ts | Restrictions: Must validate generated configuration, do not overwrite existing files without confirmation, ensure secure default values | Success: Generator creates valid configuration files, validates settings using existing schemas, provides clear setup feedback to users_

- [x] 3. Extend configuration system in lib/config/settings.ts
  - File: lib/config/settings.ts (modify existing)
  - Add standalone mode configuration options
  - Extend existing Zod schemas for new settings
  - Purpose: Support new standalone configuration parameters
  - _Leverage: Existing Zod schemas and validation patterns_
  - _Requirements: 1.1, 2.1, 3.1_
  - _Prompt: Role: Backend Developer specializing in configuration management and TypeScript validation | Task: Extend existing configuration system to support standalone mode options following requirements 1.1, 2.1, 3.1, adding new Zod schemas while maintaining backward compatibility with existing configuration patterns | Restrictions: Must not break existing configuration, maintain type safety, follow existing schema patterns | Success: Configuration system supports both Docker and standalone modes, validation works for all scenarios, backward compatibility maintained_

- [x] 4. Create SQLite database adapter in lib/database/adapters/sqlite-adapter.ts
  - File: lib/database/adapters/sqlite-adapter.ts
  - Implement SQLite-specific database operations
  - Handle automatic database initialization and migrations
  - Purpose: Provide SQLite support while maintaining Prisma compatibility
  - _Leverage: lib/database/client.ts Prisma patterns, lib/database/utils.ts_
  - _Requirements: 2.1, 2.2_
  - _Prompt: Role: Database Engineer with expertise in SQLite and Prisma ORM | Task: Create SQLite adapter that handles database initialization, migrations, and operations following requirements 2.1-2.2, extending existing Prisma client patterns from lib/database/client.ts and using database utilities | Restrictions: Must maintain Prisma compatibility, ensure thread safety, do not bypass existing database utilities | Success: SQLite operations work seamlessly with existing code, automatic initialization works correctly, migrations run without manual intervention_

- [x] 5. Create memory session cache in lib/cache/memory-cache.ts
  - File: lib/cache/memory-cache.ts
  - Implement in-memory data structures for session management
  - Add LRU eviction and memory management
  - Purpose: Replace Redis functionality with memory-based caching
  - _Leverage: lib/websocket/server.ts event patterns_
  - _Requirements: 3.1, 3.2, 3.3_
  - _Prompt: Role: Performance Engineer with expertise in memory management and caching systems | Task: Create memory-based cache system with LRU eviction and session management following requirements 3.1-3.3, integrating with existing WebSocket event patterns from lib/websocket/server.ts | Restrictions: Must handle memory pressure gracefully, implement proper cleanup, do not cause memory leaks | Success: Memory cache performs efficiently, handles session data correctly, integrates seamlessly with WebSocket system_

- [x] 6. Create database migration handler in lib/database/migration-handler.ts
  - File: lib/database/migration-handler.ts
  - Handle automatic migration execution for SQLite
  - Provide migration status tracking and rollback
  - Purpose: Ensure database schema is current without manual intervention
  - _Leverage: lib/database/utils.ts, Prisma migration tools_
  - _Requirements: 2.3, 2.4_
  - _Prompt: Role: Database Migration Specialist with expertise in Prisma migrations and SQLite | Task: Create migration handler that automatically executes Prisma migrations for SQLite following requirements 2.3-2.4, using existing database utilities and Prisma migration tools | Restrictions: Must handle migration failures gracefully, provide rollback capability, ensure data integrity during migrations | Success: Migrations run automatically on startup, status is tracked properly, rollback functionality works when needed_

- [x] 7. Create development setup assistant in lib/setup/setup-assistant.ts
  - File: lib/setup/setup-assistant.ts
  - Guide users through initial standalone setup
  - Validate prerequisites and dependencies
  - Purpose: Provide user-friendly setup experience
  - _Leverage: lib/config/standalone-generator.ts, lib/utils/logger.ts_
  - _Requirements: 6.1, 6.2, 6.3_
  - _Prompt: Role: Developer Experience Engineer with expertise in setup automation and user guidance | Task: Create setup assistant that guides users through standalone setup process following requirements 6.1-6.3, using configuration generator and logging utilities for clear feedback | Restrictions: Must handle setup failures gracefully, provide clear error messages, do not assume user expertise | Success: Setup process is intuitive and reliable, users can complete setup without technical knowledge, clear feedback provided at each step_

- [x] 8. Add startup detection in src/app/layout.tsx
  - File: src/app/layout.tsx (modify existing)
  - Add environment detection on application startup
  - Initialize appropriate services based on detected mode
  - Purpose: Automatically configure application for detected environment
  - _Leverage: lib/services/environment-detector.ts, existing layout patterns_
  - _Requirements: 1.3, 1.4_
  - _Prompt: Role: Frontend Developer with expertise in Next.js application initialization and React lifecycle | Task: Modify application layout to detect environment and initialize services on startup following requirements 1.3-1.4, using environment detector and maintaining existing layout patterns | Restrictions: Must not break existing functionality, ensure graceful fallbacks, maintain Next.js SSR compatibility | Success: Application automatically detects and configures for correct environment, existing functionality remains intact, startup is fast and reliable_

- [x] 9. Create startup configuration middleware in src/middleware/startup-config.ts
  - File: src/middleware/startup-config.ts
  - Handle automatic configuration and setup on first run
  - Display setup progress and status to users
  - Purpose: Ensure smooth first-time experience
  - _Leverage: lib/setup/setup-assistant.ts, lib/config/standalone-generator.ts_
  - _Requirements: 4.4, 4.5_
  - _Prompt: Role: Middleware Developer with expertise in Next.js middleware and startup processes | Task: Create startup middleware that handles automatic configuration on first run following requirements 4.4-4.5, using setup assistant and configuration generator with clear user feedback | Restrictions: Must work with Next.js middleware limitations, ensure non-blocking execution, handle concurrent requests properly | Success: First-time setup runs automatically, users see clear progress indicators, subsequent startups are fast without unnecessary setup checks_

- [x] 10. Update API health check in src/app/api/health/route.ts
  - File: src/app/api/health/route.ts (modify existing)
  - Add standalone mode health indicators
  - Check SQLite database and memory cache status
  - Purpose: Provide comprehensive health monitoring for standalone mode
  - _Leverage: lib/database/adapters/sqlite-adapter.ts, lib/cache/memory-cache.ts_
  - _Requirements: 7.1, 7.2_
  - _Prompt: Role: API Developer with expertise in health monitoring and system diagnostics | Task: Extend existing health check API to include standalone mode monitoring following requirements 7.1-7.2, checking SQLite and memory cache status using respective adapters | Restrictions: Must maintain existing health check format, ensure fast response times, do not expose sensitive system information | Success: Health check accurately reports standalone mode status, provides useful diagnostic information, maintains API compatibility_

- [x] 11. Add WebSocket connection handling for memory cache in lib/websocket/server.ts
  - File: lib/websocket/server.ts (modify existing)
  - Integrate memory cache with WebSocket connections
  - Handle session synchronization across browser tabs
  - Purpose: Maintain real-time functionality without Redis
  - _Leverage: lib/cache/memory-cache.ts, existing WebSocket patterns_
  - _Requirements: 3.4, 3.5_
  - _Prompt: Role: WebSocket Developer with expertise in real-time communication and session management | Task: Integrate memory cache with existing WebSocket server following requirements 3.4-3.5, maintaining real-time functionality and cross-tab synchronization using existing WebSocket patterns | Restrictions: Must maintain existing WebSocket API, ensure message delivery reliability, handle connection drops gracefully | Success: WebSocket functionality works identically to Redis-backed version, session sync works across tabs, connection management is robust_

- [x] 12. Create error handling for standalone mode in lib/utils/standalone-errors.ts
  - File: lib/utils/standalone-errors.ts
  - Define standalone-specific error types and handlers
  - Provide helpful error messages and recovery suggestions
  - Purpose: Handle standalone mode failures gracefully
  - _Leverage: lib/utils/error-handler.ts, lib/utils/errors.ts_
  - _Requirements: 7.3, 7.4_
  - _Prompt: Role: Error Handling Specialist with expertise in user-friendly error management and system recovery | Task: Create standalone-specific error handling following requirements 7.3-7.4, extending existing error handling patterns with helpful recovery suggestions for users | Restrictions: Must not expose system internals, provide actionable guidance, maintain error logging for debugging | Success: Error messages are clear and helpful, recovery suggestions are actionable, error handling integrates with existing system_

- [x] 13. Add logging configuration for standalone mode in lib/utils/logger.ts
  - File: lib/utils/logger.ts (modify existing)
  - Configure debug-level logging for development
  - Add file-based logging with rotation
  - Purpose: Provide comprehensive logging for development debugging
  - _Leverage: existing Pino logger configuration_
  - _Requirements: 5.1, 5.2, 5.3_
  - _Prompt: Role: Logging Engineer with expertise in Pino and development tooling | Task: Extend existing logger configuration for standalone mode following requirements 5.1-5.3, adding debug logging and file rotation while maintaining existing Pino patterns | Restrictions: Must not break existing logging, ensure log file management, maintain performance in production | Success: Debug logging works in development, log files are managed properly, existing logging functionality preserved_

- [x] 14. Create integration tests in tests/integration/standalone-mode.test.ts
  - File: tests/integration/standalone-mode.test.ts
  - Test complete standalone setup and operation
  - Verify database operations and WebSocket functionality
  - Purpose: Ensure end-to-end standalone functionality works correctly
  - _Leverage: existing test utilities and patterns_
  - _Requirements: All_
  - _Prompt: Role: Integration Test Engineer with expertise in full-stack testing and Node.js test frameworks | Task: Create comprehensive integration tests covering complete standalone mode functionality including setup, database operations, and WebSocket communication, following all requirements and using existing test utilities | Restrictions: Must test realistic scenarios, ensure test isolation, do not depend on external services | Success: Integration tests cover all standalone functionality, tests run reliably in CI/CD, realistic user scenarios are validated_

- [x] 15. Create unit tests for new components
  - Files: tests/unit/environment-detector.test.ts, tests/unit/standalone-generator.test.ts, tests/unit/memory-cache.test.ts
  - Test individual component functionality
  - Mock dependencies and external systems
  - Purpose: Ensure component reliability and catch regressions
  - _Leverage: existing Jest configuration and test patterns_
  - _Requirements: 1.1-7.4_
  - _Prompt: Role: Unit Test Developer with expertise in Jest and component testing | Task: Create comprehensive unit tests for all new standalone components covering requirements 1.1-7.4, using existing Jest patterns with proper mocking of dependencies | Restrictions: Must maintain test isolation, mock all external dependencies, follow existing test patterns | Success: All components have good test coverage, edge cases are tested, tests run fast and reliably_

- [x] 16. Update documentation and examples in README.md and docs/
  - Files: README.md, docs/standalone-setup.md
  - Document standalone setup process and configuration
  - Provide troubleshooting guide and examples
  - Purpose: Enable developers to successfully use standalone mode
  - _Leverage: existing documentation patterns_
  - _Requirements: 6.4, 6.5_
  - _Prompt: Role: Technical Writer with expertise in developer documentation and user guides | Task: Create comprehensive documentation for standalone mode setup and usage following requirements 6.4-6.5, maintaining existing documentation style and providing clear examples | Restrictions: Must be accessible to developers of all skill levels, provide copy-paste examples, maintain consistency with existing docs | Success: Documentation is clear and comprehensive, developers can successfully set up standalone mode, troubleshooting guide covers common issues_

- [x] 17. Final integration and validation
  - Integrate all components and test full system
  - Validate against all requirements
  - Clean up code and resolve any remaining issues
  - Purpose: Ensure complete feature delivery
  - _Leverage: all created components and existing system_
  - _Requirements: All_
  - _Prompt: Role: Senior Full-Stack Developer with expertise in system integration and quality assurance | Task: Complete final integration of all standalone mode components and validate against all requirements, ensuring seamless operation with existing Docker-based functionality | Restrictions: Must not break existing Docker functionality, ensure backward compatibility, maintain code quality standards | Success: Standalone mode works completely as specified, Docker mode continues to function, all requirements are met, code quality is maintained_