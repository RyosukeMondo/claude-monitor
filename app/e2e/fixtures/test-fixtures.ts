import { test as base, expect } from '@playwright/test';
import { DashboardPage } from '../page-objects/dashboard-page';
import { RecoveryActionsPage } from '../page-objects/recovery-actions-page';

/**
 * Test fixtures for Claude Monitor E2E tests
 * Provides reusable setup, data generation, and utilities for testing
 */

// Extend base test with page objects
export const test = base.extend<{
  dashboardPage: DashboardPage;
  recoveryActionsPage: RecoveryActionsPage;
}>({
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  
  recoveryActionsPage: async ({ page }, use) => {
    await use(new RecoveryActionsPage(page));
  },
});

// Test data generators
export class TestDataGenerator {
  /**
   * Generate mock JSONL conversation events for testing
   */
  static generateMockConversationEvents(count: number = 5) {
    const events = [];
    const startTime = Date.now() - (count * 60000); // Events spread over last N minutes
    
    for (let i = 0; i < count; i++) {
      const timestamp = new Date(startTime + (i * 60000)).toISOString();
      const eventType = i % 2 === 0 ? 'user' : 'assistant';
      
      events.push({
        uuid: `event-${i}-${Math.random().toString(36).substr(2, 9)}`,
        parentUuid: i > 0 ? `event-${i-1}-parent` : null,
        sessionId: 'test-session-id',
        timestamp,
        eventType,
        cwd: '/mnt/d/repos/claude-monitor',
        messageContent: eventType === 'user' 
          ? `User message ${i + 1}: Test command or query`
          : `Assistant response ${i + 1}: Processing and responding`,
        commands: eventType === 'user' && i % 3 === 0 ? ['/clear'] : [],
        toolCalls: eventType === 'assistant' ? ['Read', 'Write', 'Bash'] : [],
        usageStats: eventType === 'assistant' ? { 
          inputTokens: 100 + i * 10, 
          outputTokens: 200 + i * 15 
        } : null
      });
    }
    
    return events;
  }

  /**
   * Generate mock project data for testing
   */
  static generateMockProjects(count: number = 3) {
    const projects = [];
    const states = ['IDLE', 'ACTIVE', 'WAITING_INPUT', 'ERROR', 'UNKNOWN'];
    
    for (let i = 0; i < count; i++) {
      projects.push({
        projectPath: `/mnt/d/repos/test-project-${i + 1}`,
        encodedPath: `-mnt-d-repos-test-project-${i + 1}`,
        displayName: `Test Project ${i + 1}`,
        currentState: states[i % states.length],
        lastActivity: new Date(Date.now() - (i * 300000)).toISOString(), // Last 5i minutes
        monitoring: true,
        sessionCount: Math.floor(Math.random() * 5) + 1,
        eventCount: Math.floor(Math.random() * 100) + 10
      });
    }
    
    return projects;
  }

  /**
   * Generate mock session data
   */
  static generateMockSessions(projectId: string, count: number = 2) {
    const sessions = [];
    
    for (let i = 0; i < count; i++) {
      sessions.push({
        sessionId: `session-${projectId}-${i + 1}`,
        jsonlFilePath: `/home/user/.claude/projects/${projectId}/session-${i + 1}.jsonl`,
        isActive: i === 0, // First session is active
        eventCount: Math.floor(Math.random() * 50) + 5,
        startTime: new Date(Date.now() - ((count - i) * 3600000)).toISOString(), // Hours ago
        lastActivity: new Date(Date.now() - (i * 1800000)).toISOString() // 30min intervals
      });
    }
    
    return sessions;
  }
}

// Test utilities
export class TestUtils {
  /**
   * Wait for element to be stable (not moving/changing)
   */
  static async waitForStableElement(locator: any, timeout: number = 5000) {
    let previousBox = await locator.boundingBox();
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
      const currentBox = await locator.boundingBox();
      
      if (previousBox && currentBox &&
          previousBox.x === currentBox.x &&
          previousBox.y === currentBox.y &&
          previousBox.width === currentBox.width &&
          previousBox.height === currentBox.height) {
        return; // Element is stable
      }
      
      previousBox = currentBox;
    }
    
    throw new Error('Element did not stabilize within timeout');
  }

  /**
   * Generate random test string
   */
  static randomString(length: number = 10): string {
    return Math.random().toString(36).substring(2, length + 2);
  }

  /**
   * Format timestamp for testing
   */
  static formatTestTimestamp(date: Date): string {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  /**
   * Mock API responses for testing
   */
  static async mockApiResponses(page: any, scenarios: { [endpoint: string]: any }) {
    for (const [endpoint, response] of Object.entries(scenarios)) {
      await page.route(`**/api/${endpoint}`, route => {
        route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify(response)
        });
      });
    }
  }

  /**
   * Clear all API mocks
   */
  static async clearApiMocks(page: any) {
    await page.unroute('**/api/**');
  }

  /**
   * Simulate slow network for testing loading states
   */
  static async simulateSlowNetwork(page: any, delayMs: number = 2000) {
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      route.continue();
    });
  }

  /**
   * Simulate network failure
   */
  static async simulateNetworkFailure(page: any) {
    await page.route('**/api/**', route => route.abort());
  }

  /**
   * Restore normal network behavior
   */
  static async restoreNetwork(page: any) {
    await page.unroute('**/api/**');
  }
}

// Common assertions
export class TestAssertions {
  /**
   * Assert element is accessible
   */
  static async assertAccessible(locator: any, description: string) {
    // Check for proper ARIA attributes
    const element = locator.first();
    
    // Should have accessible name
    const accessibleName = await element.getAttribute('aria-label') || 
                          await element.getAttribute('aria-labelledby') ||
                          await element.textContent();
    expect(accessibleName).toBeTruthy(`${description} should have accessible name`);
    
    // Should not have accessibility violations
    const role = await element.getAttribute('role');
    if (role) {
      expect(role).toMatch(/^(button|link|textbox|checkbox|radio|menuitem|tab|tabpanel|dialog|alert|status|region|main|navigation|banner|contentinfo|complementary|search|form|article|section|aside|header|footer|heading|listitem|list|table|row|cell|columnheader|rowheader|grid|gridcell|tree|treeitem|option|combobox|group|toolbar|tooltip|progressbar|slider|spinbutton|scrollbar|separator|presentation|none)$/);
    }
  }

  /**
   * Assert performance meets requirements
   */
  static async assertPerformance(page: any, maxLoadTime: number = 3000, description: string) {
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(maxLoadTime, 
      `${description} should load within ${maxLoadTime}ms, but took ${loadTime}ms`);
  }

  /**
   * Assert responsive design works
   */
  static async assertResponsive(page: any, locator: any, description: string) {
    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(locator).toBeVisible(`${description} should be visible on desktop`);
    
    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(locator).toBeVisible(`${description} should be visible on tablet`);
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(locator).toBeVisible(`${description} should be visible on mobile`);
  }
}

export { expect };