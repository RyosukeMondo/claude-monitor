# Tasks Document

<!-- AI Instructions: For each task, generate a _Prompt field with structured AI guidance following this format:
_Prompt: Role: [specialized developer role] | Task: [clear task description with context references] | Restrictions: [what not to do, constraints] | Success: [specific completion criteria]_
This helps provide better AI agent guidance beyond simple "work on this task" prompts. -->

- [x] 1. Create Claude Code launcher type definitions
  - File: lib/types/launcher.ts
  - Define comprehensive TypeScript interfaces for launcher config, instance info, TCP commands, and installation status
  - Create modern, clean interfaces optimized for Docker integration
  - Purpose: Establish type safety for Claude Code launcher functionality
  - _Requirements: 1.1, 6.1_
  - _Prompt: Role: TypeScript Developer specializing in modern type systems | Task: Create comprehensive TypeScript interfaces for Claude Code launcher following requirements 1.1 and 6.1, designing clean, modern interfaces optimized for Docker integration without legacy constraints | Restrictions: Focus on optimal design, no need to maintain backward compatibility, use modern TypeScript features | Success: All interfaces are well-designed and compile without errors, full type coverage for launcher requirements with modern TypeScript practices_

- [x] 2. Implement Claude Code CLI installer service
  - File: lib/services/claude-installer.ts
  - Create service to detect, install, and validate Claude Code CLI within the Next.js container
  - Add authentication status checking and MCP tools installation
  - Purpose: Handle automated Claude Code CLI setup within containerized environment
  - _Requirements: 4.2, 4.3, 6.1_
  - _Prompt: Role: Node.js Developer with expertise in CLI installation and container environments | Task: Implement Claude Code CLI installation service following requirements 4.2, 4.3, and 6.1, creating a clean, modern implementation for container environments | Restrictions: Focus on reliable installation, handle failures gracefully, use modern async/await patterns | Success: Service reliably installs Claude Code CLI in container, handles authentication requirements, provides clear status reporting_

- [x] 3. Implement TTY bridge service (choose optimal approach)
  - File: lib/services/tty-bridge.ts
  - Evaluate and implement best approach for TTY interaction: node-pty (recommended) or hybrid expect
  - Implement command parsing and validation for supported operations (send, enter, up, down, ctrl-c, tab)
  - Purpose: Provide reliable TTY interface to Claude Code sessions
  - _Requirements: 1.1, 1.2_
  - _Technical Options:_
    - _Recommended: node-pty for pure TypeScript TTY handling_
    - _Alternative: Hybrid with existing expect scripts if needed_
  - _Prompt: Role: Systems Developer with expertise in TTY handling and modern Node.js | Task: Implement TTY bridge service following requirements 1.1 and 1.2, choosing the most optimal approach (preferably node-pty) for reliable terminal interaction with Claude Code | Restrictions: Focus on reliability and maintainability, use modern async patterns, ensure proper TTY handling | Success: TTY bridge reliably forwards commands with proper terminal handling, chosen approach is sustainable and performant_

- [x] 4. Create TCP command server
  - File: lib/services/tcp-server.ts
  - Implement modern TCP server that accepts commands and forwards to TTY bridge
  - Add connection management, rate limiting, and proper error handling
  - Purpose: Provide network interface for programmatic Claude Code interaction
  - _Leverage: lib/services/tty-bridge.ts_
  - _Requirements: 1.1, 1.2_
  - _Prompt: Role: Network Programming Specialist with expertise in modern Node.js TCP servers | Task: Create TCP server for command interface following requirements 1.1 and 1.2, implementing modern connection management and rate limiting | Restrictions: Use modern Node.js patterns, ensure security, implement proper rate limiting | Success: TCP server handles commands efficiently, forwards to TTY bridge reliably, manages multiple connections safely_

- [x] 5. Implement Claude Code launcher orchestrator
  - File: lib/services/claude-launcher.ts
  - Create main launcher service that orchestrates Claude Code process lifecycle
  - Integrate TTY bridge and TCP server with process management
  - Purpose: Provide core launcher functionality with modern architecture
  - _Leverage: lib/services/tty-bridge.ts, lib/services/tcp-server.ts_
  - _Requirements: 1.1, 1.3, 1.6_
  - _Prompt: Role: Backend Architect with expertise in process orchestration and modern service design | Task: Implement Claude launcher orchestrator following requirements 1.1, 1.3, and 1.6, creating a modern service architecture for process lifecycle management | Restrictions: Use modern design patterns, focus on reliability and observability, implement proper process isolation | Success: Launcher orchestrates all components reliably, provides comprehensive monitoring and error recovery_

- [x] 6. Create modern launcher API endpoints
  - File: api/launcher/instances/route.ts
  - Implement clean RESTful endpoints for instance management (GET, POST, DELETE)
  - Use modern validation with Zod and contemporary API patterns
  - Purpose: Provide HTTP API for Claude Code instance management
  - _Requirements: 2.1, 2.2, 2.4_
  - _Prompt: Role: API Developer with expertise in modern Next.js App Router and REST design | Task: Create launcher management API endpoints following requirements 2.1, 2.2, and 2.4, implementing modern RESTful patterns with comprehensive validation | Restrictions: Use contemporary API design patterns, implement proper error handling, focus on developer experience | Success: API provides excellent developer experience, comprehensive error handling, follows modern REST conventions_

- [x] 7. Create command forwarding API
  - File: api/launcher/instances/[id]/commands/route.ts
  - Implement endpoint for sending commands to instances via TCP bridge
  - Add modern validation, rate limiting, and security measures
  - Purpose: Provide HTTP interface for TCP command forwarding
  - _Leverage: lib/services/tcp-server.ts_
  - _Requirements: 1.2_
  - _Prompt: Role: API Security Specialist with expertise in command interfaces | Task: Implement command forwarding API following requirement 1.2, creating secure interface with modern validation and rate limiting | Restrictions: Implement comprehensive security measures, validate all commands, use modern rate limiting patterns | Success: Command API is secure and efficient, proper validation prevents abuse, excellent error handling_

- [x] 8. Create modern JSONL monitoring integration
  - File: lib/services/launcher-monitor.ts
  - Create new monitoring service specifically for launcher-created sessions
  - Design clean integration with JSONL file monitoring
  - Purpose: Monitor launcher sessions with modern architecture
  - _Requirements: 3.1, 3.2, 3.5_
  - _Prompt: Role: Monitoring Engineer with expertise in modern file monitoring and event systems | Task: Create launcher monitoring service following requirements 3.1, 3.2, and 3.5, designing clean monitoring architecture for launcher sessions | Restrictions: Use modern file watching patterns, implement efficient event handling, focus on performance | Success: Monitoring service efficiently tracks launcher sessions, provides real-time updates, minimal performance overhead_

- [x] 9. Implement real-time instance monitoring
  - File: lib/services/instance-health.ts
  - Create modern health monitoring service for launcher instances
  - Integrate with WebSocket for real-time dashboard updates
  - Purpose: Provide comprehensive real-time monitoring
  - _Requirements: 2.3, 3.3_
  - _Prompt: Role: Systems Monitoring Specialist with expertise in real-time health checks | Task: Create instance health monitoring following requirements 2.3 and 3.3, implementing modern health check patterns with real-time updates | Restrictions: Use efficient polling strategies, implement circuit breakers, focus on reliability | Success: Health monitoring is accurate and responsive, real-time updates work seamlessly, monitoring is resilient_

- [x] 10. Create modern launcher dashboard
  - File: src/components/launcher/launcher-dashboard.tsx
  - Implement modern React dashboard for instance creation and management
  - Use contemporary UI patterns and real-time updates
  - Purpose: Provide intuitive user interface for launcher management
  - _Requirements: 2.1, 2.2, 2.5_
  - _Prompt: Role: React Developer with expertise in modern dashboard interfaces | Task: Create launcher dashboard following requirements 2.1, 2.2, and 2.5, implementing contemporary React patterns with excellent UX | Restrictions: Use modern React patterns (hooks, context), ensure responsive design, focus on user experience | Success: Dashboard is intuitive and responsive, real-time updates work smoothly, excellent user experience_

- [x] 11. Create instance management components
  - File: src/components/launcher/instance-manager.tsx
  - Implement components for displaying and managing active instances
  - Add status indicators, actions, and real-time updates
  - Purpose: Provide comprehensive instance management interface
  - _Requirements: 2.3, 2.4_
  - _Prompt: Role: Frontend Developer specializing in data visualization and interactive components | Task: Create instance management components following requirements 2.3 and 2.4, implementing modern React patterns for instance display and control | Restrictions: Use modern state management, ensure good performance with many instances, focus on usability | Success: Components handle instances efficiently, provide clear status indicators, actions work reliably_

- [x] 12. Create interactive command interface
  - File: src/components/launcher/command-terminal.tsx
  - Implement modern terminal-like interface for sending commands
  - Add command history, validation, and real-time feedback
  - Purpose: Provide interactive command interface for Claude Code instances
  - _Requirements: 1.2_
  - _Prompt: Role: UI/UX Developer with expertise in terminal interfaces and command input | Task: Create command terminal interface following requirement 1.2, implementing modern terminal-like UI with excellent user experience | Restrictions: Use contemporary UI libraries, ensure accessibility, provide clear command feedback | Success: Terminal interface is intuitive and responsive, command validation works well, excellent user experience_

- [x] 13. Configure Docker Compose for launcher
  - File: docker-compose.yml, docker-compose.dev.yml (modify)
  - Update Docker configuration to support launcher functionality
  - Add environment variables and volume mounts for Claude Code access
  - Include TTY dependencies (node-pty or expect) as needed
  - Purpose: Ensure Docker environment supports all launcher functionality
  - _Requirements: 4.1, 4.5_
  - _Prompt: Role: Docker Engineer with expertise in container orchestration | Task: Update Docker Compose configuration following requirements 4.1 and 4.5, optimizing for launcher functionality without legacy constraints | Restrictions: Focus on optimal configuration, ensure secure volume mounting, optimize for development and production | Success: Docker configuration supports all launcher features, efficient and secure setup_

- [x] 14. Update Dockerfile for modern dependencies
  - File: Dockerfile (modify)
  - Add Claude Code CLI installation and TTY dependencies
  - Optimize container build for launcher functionality
  - Configure MCP tools and authentication handling
  - Purpose: Create optimized container with all launcher dependencies
  - _Requirements: 4.2, 4.6, 6.1_
  - _Prompt: Role: Container Engineer with expertise in Dockerfile optimization | Task: Update Dockerfile following requirements 4.2, 4.6, and 6.1, creating optimized container build for launcher functionality | Restrictions: Optimize image layers, ensure efficient builds, focus on security and performance | Success: Container builds efficiently with all dependencies, optimized layers, secure configuration_

- [x] 15. Create container initialization script
  - File: deployment/docker-entrypoint.sh (rewrite/optimize)
  - Implement modern container startup with dependency validation
  - Add Claude Code CLI validation and authentication setup
  - Purpose: Ensure reliable container startup with all launcher components
  - _Requirements: 6.1, 6.2, 6.3_
  - _Prompt: Role: DevOps Engineer with expertise in container initialization | Task: Create modern container initialization following requirements 6.1, 6.2, and 6.3, implementing reliable startup sequence for launcher components | Restrictions: Focus on reliability and clear error reporting, use modern shell scripting practices | Success: Container starts reliably with all dependencies validated, clear error messages for any issues_

- [x] 16. Create comprehensive API tests
  - File: __tests__/api/launcher.test.ts
  - Write modern integration tests for all launcher API endpoints
  - Test instance lifecycle, error scenarios, and edge cases
  - Purpose: Ensure API reliability and comprehensive coverage
  - _Requirements: 2.1, 2.2, 2.4_
  - _Prompt: Role: QA Engineer with expertise in modern API testing | Task: Create comprehensive API tests for launcher endpoints following requirements 2.1, 2.2, and 2.4, using modern testing patterns | Restrictions: Use contemporary testing frameworks, ensure good coverage, focus on real-world scenarios | Success: All API endpoints thoroughly tested, excellent coverage, tests are maintainable and reliable_

- [x] 17. Create TTY bridge service tests
  - File: __tests__/services/tty-bridge.test.ts
  - Write comprehensive tests for TTY bridge functionality
  - Test command handling, validation, and edge cases
  - Purpose: Ensure TTY bridge reliability and proper error handling
  - _Requirements: 1.1, 1.2_
  - _Prompt: Role: Systems Testing Specialist with expertise in TTY testing | Task: Create comprehensive TTY bridge tests following requirements 1.1 and 1.2, testing terminal interaction with modern patterns | Restrictions: Use safe testing patterns for TTY, ensure comprehensive coverage, test error scenarios | Success: TTY bridge thoroughly tested, all command scenarios covered, robust error handling verified_

- [x] 18. Create end-to-end integration tests
  - File: e2e/launcher-integration.spec.ts
  - Write comprehensive E2E tests for complete launcher workflow
  - Test Docker environment startup and full user journeys
  - Purpose: Validate complete launcher functionality in real environment
  - _Requirements: All launcher requirements_
  - _Prompt: Role: E2E Testing Engineer with expertise in containerized testing | Task: Create comprehensive end-to-end tests covering complete launcher workflow in Docker environment, testing all requirements | Restrictions: Test real user scenarios, ensure reliable execution in CI/CD, handle container timing | Success: E2E tests cover all critical workflows, run reliably in containerized environments, validate complete user experience_

- [x] 19. Create comprehensive documentation
  - File: README.md (rewrite Docker section)
  - Write comprehensive setup and usage documentation
  - Document architecture decisions and troubleshooting
  - Include performance characteristics and operational guidance
  - Purpose: Provide excellent documentation for deployment and usage
  - _Requirements: All requirements (documentation aspects)_
  - _Prompt: Role: Technical Writer with expertise in Docker and system documentation | Task: Create comprehensive documentation covering Docker integration, launcher usage, and operations, documenting all requirements | Restrictions: Focus on clarity and completeness, provide excellent troubleshooting guidance, document architecture decisions | Success: Documentation is comprehensive and user-friendly, setup is clearly explained, troubleshooting covers common scenarios_

- [ ] 20. System integration and optimization
  - Files: Multiple (all components)
  - Integrate all components and optimize system performance
  - Validate functionality and fix any integration issues
  - Purpose: Ensure complete system works optimally in Docker environment
  - _Requirements: All requirements_
  - _Prompt: Role: Senior System Engineer with expertise in containerized system optimization | Task: Perform complete system integration and optimization covering all requirements, ensuring optimal performance in Docker environment | Restrictions: Focus on performance and reliability, ensure all components work together seamlessly | Success: Complete system works optimally, all requirements met, excellent performance in containerized deployment_