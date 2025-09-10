# Claude Monitor E2E Tests

This directory contains comprehensive end-to-end tests for the Claude Monitor application using Playwright. The tests validate complete user workflows equivalent to Python daemon operation scenarios, converted to web-based interactive experiences.

## Test Structure

### Core Test Files

- **`dashboard.spec.ts`** - Tests for the main dashboard functionality
  - Project monitoring and display
  - Real-time updates and state detection
  - Session viewing and conversation events
  - Performance and accessibility validation

- **`recovery-actions.spec.ts`** - Tests for recovery action workflows
  - Clear command execution
  - Custom command interface
  - Automated recovery rules
  - Notification and error handling

- **`setup.spec.ts`** - Basic application setup and configuration tests
  - Application loading validation
  - Responsive design checks
  - Console error monitoring
  - Accessibility foundation

### Supporting Files

- **`page-objects/dashboard-page.ts`** - Page Object Model for dashboard interactions
- **`page-objects/recovery-actions-page.ts`** - Page Object Model for recovery actions
- **`fixtures/test-fixtures.ts`** - Test utilities, data generators, and common assertions
- **`README.md`** - This documentation file

## Running Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   ```

2. Install Playwright browsers (if not already installed):
   ```bash
   npx playwright install
   ```

3. Ensure the application server is running:
   ```bash
   npm run dev
   ```

### Test Commands

```bash
# Run all E2E tests
npm run e2e

# Run tests with browser GUI (headed mode)
npm run e2e:headed

# Run tests with Playwright UI mode
npm run e2e:ui

# Debug specific test
npm run e2e:debug -- dashboard.spec.ts
```

### Running Specific Tests

```bash
# Run only dashboard tests
npx playwright test dashboard

# Run only recovery action tests  
npx playwright test recovery-actions

# Run tests matching pattern
npx playwright test --grep "recovery"
```

## Test Design Philosophy

### User Workflow Focus

These tests are designed to validate complete user experiences rather than individual component functionality. They test scenarios equivalent to the Python daemon's operation patterns:

- **Monitoring Workflows**: How users discover and track Claude Code projects
- **State Detection**: How users understand Claude's current activity state  
- **Recovery Actions**: How users intervene when issues are detected
- **Real-time Updates**: How users receive live feedback from the monitoring system

### Python Daemon Equivalence

The tests convert Python daemon scenarios to web-based interactions:

| Python Daemon Feature | Web E2E Test Coverage |
|----------------------|----------------------|
| JSONL file monitoring | Dashboard real-time updates |
| State detection logic | Project status indicators |
| Recovery command execution | Interactive recovery controls |
| Notification system | Browser/email alerts |
| Configuration management | Web-based settings UI |

### Page Object Pattern

Tests use the Page Object Model pattern for maintainability:

- **Encapsulation**: UI element selectors are centralized in page objects
- **Reusability**: Common interactions are abstracted into methods
- **Maintainability**: UI changes only require updates in page objects
- **Readability**: Tests focus on user workflows, not implementation details

## Test Data and Mocking

### Mock Data Generation

The test fixtures provide utilities for generating realistic test data:

```typescript
// Generate mock conversation events
const events = TestDataGenerator.generateMockConversationEvents(10);

// Generate mock project data
const projects = TestDataGenerator.generateMockProjects(5);

// Generate mock sessions
const sessions = TestDataGenerator.generateMockSessions('project-id', 3);
```

### API Mocking

Tests can mock API responses for controlled testing:

```typescript
await TestUtils.mockApiResponses(page, {
  'projects': mockProjects,
  'sessions/active': mockSessions,
  'recovery/clear': { status: 'success' }
});
```

### Network Simulation

Tests can simulate various network conditions:

```typescript
// Simulate slow network
await TestUtils.simulateSlowNetwork(page, 2000);

// Simulate network failure
await TestUtils.simulateNetworkFailure(page);

// Restore normal network
await TestUtils.restoreNetwork(page);
```

## Accessibility Testing

Tests include comprehensive accessibility validation:

- **Screen Reader Compatibility**: Proper heading structure, ARIA labels
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Visual Indicators**: Clear state indicators and feedback
- **Responsive Design**: Works across all device sizes

## Performance Testing

Tests validate performance requirements:

- **Load Times**: Dashboard loads within 3 seconds
- **Real-time Updates**: WebSocket connections establish quickly
- **Memory Usage**: No memory leaks during long-running sessions
- **Network Efficiency**: Minimal unnecessary requests

## Error Scenarios

Tests cover comprehensive error handling:

- **Network Connectivity**: Offline detection and reconnection
- **Command Failures**: Recovery action error handling
- **Validation Errors**: Invalid command prevention
- **System Errors**: Graceful degradation

## Browser Coverage

Tests run across multiple browsers:

- **Chromium**: Primary development browser
- **Firefox**: Cross-browser compatibility
- **WebKit**: Safari compatibility
- **Mobile**: Chrome and Safari on mobile viewports

## Configuration

### Playwright Configuration

The main configuration is in `playwright.config.ts` at the project root:

```typescript
{
  testDir: './e2e',
  baseURL: 'http://localhost:3000',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0
}
```

### Test Environment Variables

```bash
# CI environment (affects retries and parallelism)
CI=true

# Base URL for testing
PLAYWRIGHT_BASE_URL=http://localhost:3000

# Headless mode override
PLAYWRIGHT_HEADED=true
```

## Continuous Integration

These tests are designed to run in CI/CD pipelines:

1. **Parallel Execution**: Tests run in parallel for faster feedback
2. **Retry Logic**: Automatic retries on CI for flaky test handling
3. **Screenshots**: Automatic screenshots on failure for debugging
4. **Traces**: Detailed execution traces for failure analysis

## Debugging

### Debug Mode

```bash
# Run specific test in debug mode
npm run e2e:debug -- dashboard.spec.ts --grep "should display projects"
```

### Screenshots and Videos

Failed tests automatically capture:

- Screenshots at point of failure
- Full page screenshots
- Video recordings (when enabled)
- Network activity logs

### Trace Viewer

Playwright's trace viewer provides detailed debugging:

```bash
npx playwright show-trace trace.zip
```

## Maintenance

### Updating Selectors

When UI changes, update selectors in page objects:

1. Check failing tests to identify outdated selectors
2. Update selectors in appropriate page object files
3. Run tests to verify fixes
4. Consider using `data-testid` attributes for stability

### Adding New Tests

1. Follow existing test patterns and structure
2. Use page objects for UI interactions
3. Include accessibility and performance checks
4. Add appropriate error scenario coverage
5. Update this README if adding new concepts

### Performance Monitoring

Monitor test execution times and optimize slow tests:

```bash
# Run with timing information
npx playwright test --reporter=html
```

## Contributing

When adding new tests:

1. Follow the user workflow focus philosophy
2. Use descriptive test names that explain user value
3. Include error scenarios and edge cases
4. Add appropriate documentation
5. Ensure cross-browser compatibility