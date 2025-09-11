/**
 * End-to-End Launcher Integration Tests
 * 
 * Comprehensive E2E testing for Claude Code launcher functionality in Docker environment.
 * Tests complete user journeys, Docker startup scenarios, and real-world usage patterns.
 */

import { test, expect, Page, Browser } from '@playwright/test';

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  tcpPort: 9999,
  testProjectPath: '/tmp/test-project',
  timeout: 30000,
  dockerStartupTimeout: 60000
};

// Test data for launcher instances
const TEST_INSTANCE = {
  projectPath: TEST_CONFIG.testProjectPath,
  displayName: 'E2E Test Instance',
  tcpPort: 9999,
  autoRestart: true
};

// Helper functions for launcher testing
class LauncherTestHelper {
  constructor(private page: Page) {}

  async navigateToLauncher() {
    await this.page.goto('/launcher');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForDashboardReady() {
    // Wait for the launcher dashboard to be fully loaded
    await expect(this.page.locator('h2:has-text("Claude Code Launcher")')).toBeVisible();
    await expect(this.page.locator('[data-testid="launcher-stats"]').first()).toBeVisible();
  }

  async getInstanceStats() {
    const totalInstances = await this.page.locator('[data-testid="total-instances"]').textContent();
    const runningInstances = await this.page.locator('[data-testid="running-instances"]').textContent();
    const errorInstances = await this.page.locator('[data-testid="error-instances"]').textContent();
    
    return {
      total: parseInt(totalInstances || '0'),
      running: parseInt(runningInstances || '0'),
      errors: parseInt(errorInstances || '0')
    };
  }

  async createNewInstance(config: typeof TEST_INSTANCE) {
    // Click new instance button
    await this.page.locator('button:has-text("New Instance")').click();
    
    // Fill out the form
    await this.page.fill('[data-testid="project-path-input"]', config.projectPath);
    await this.page.fill('[data-testid="display-name-input"]', config.displayName);
    await this.page.fill('[data-testid="tcp-port-input"]', config.tcpPort.toString());
    
    if (config.autoRestart) {
      await this.page.check('[data-testid="auto-restart-checkbox"]');
    }
    
    // Submit form
    await this.page.click('button:has-text("Create Instance")');
    
    // Wait for instance to appear in the list
    await expect(this.page.locator(`[data-testid="instance-${config.displayName}"]`)).toBeVisible();
  }

  async startInstance(instanceName: string) {
    const instanceCard = this.page.locator(`[data-testid="instance-${instanceName}"]`);
    await instanceCard.locator('button:has-text("Start")').click();
    
    // Wait for status to change to "Starting" then "Running"
    await expect(instanceCard.locator('[data-testid="instance-status"]:has-text("Starting")')).toBeVisible();
    await expect(instanceCard.locator('[data-testid="instance-status"]:has-text("Running")')).toBeVisible({ timeout: 15000 });
  }

  async stopInstance(instanceName: string) {
    const instanceCard = this.page.locator(`[data-testid="instance-${instanceName}"]`);
    await instanceCard.locator('button:has-text("Stop")').click();
    
    // Wait for status to change to "Stopping" then "Stopped"
    await expect(instanceCard.locator('[data-testid="instance-status"]:has-text("Stopping")')).toBeVisible();
    await expect(instanceCard.locator('[data-testid="instance-status"]:has-text("Stopped")')).toBeVisible({ timeout: 10000 });
  }

  async sendCommand(instanceName: string, command: string) {
    const instanceCard = this.page.locator(`[data-testid="instance-${instanceName}"]`);
    
    // Open command interface
    await instanceCard.locator('button:has-text("Commands")').click();
    await expect(instanceCard.locator('[data-testid="command-input"]')).toBeVisible();
    
    // Send command
    await instanceCard.locator('[data-testid="command-input"]').fill(command);
    await instanceCard.locator('button:has-text("Send")').click();
    
    // Verify command was sent (input should be cleared)
    await expect(instanceCard.locator('[data-testid="command-input"]')).toHaveValue('');
  }

  async verifyInstanceDetails(instanceName: string, expectedDetails: Partial<typeof TEST_INSTANCE>) {
    const instanceCard = this.page.locator(`[data-testid="instance-${instanceName}"]`);
    
    if (expectedDetails.projectPath) {
      await expect(instanceCard.locator(`text=${expectedDetails.projectPath}`)).toBeVisible();
    }
    
    if (expectedDetails.tcpPort) {
      await expect(instanceCard.locator(`text=${expectedDetails.tcpPort}`)).toBeVisible();
    }
  }
}

// Docker Environment Health Check
test.describe('Docker Environment Health', () => {
  test('should verify application is running in Docker', async ({ page }) => {
    // Check health endpoint
    const response = await page.request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    
    const healthData = await response.json();
    expect(healthData.status).toBe('healthy');
    expect(healthData.environment).toBe('production');
  });

  test('should verify required services are available', async ({ page }) => {
    // Check database connectivity
    const dbResponse = await page.request.get('/api/health/database');
    expect(dbResponse.ok()).toBeTruthy();
    
    // Check launcher service availability
    const launcherResponse = await page.request.get('/api/launcher/status');
    expect(launcherResponse.ok()).toBeTruthy();
  });

  test('should verify Docker volumes and permissions', async ({ page }) => {
    // This would test that Claude projects directory is properly mounted
    const volumeResponse = await page.request.get('/api/launcher/check-volumes');
    expect(volumeResponse.ok()).toBeTruthy();
    
    const volumeData = await volumeResponse.json();
    expect(volumeData.claudeConfigMounted).toBeTruthy();
    expect(volumeData.permissionsValid).toBeTruthy();
  });
});

// Launcher Dashboard Core Functionality
test.describe('Launcher Dashboard', () => {
  let helper: LauncherTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new LauncherTestHelper(page);
    await helper.navigateToLauncher();
  });

  test('should display launcher dashboard with correct stats', async ({ page }) => {
    await helper.waitForDashboardReady();
    
    // Verify dashboard components are visible
    await expect(page.locator('h2:has-text("Claude Code Launcher")')).toBeVisible();
    await expect(page.locator('button:has-text("New Instance")')).toBeVisible();
    await expect(page.locator('button:has-text("Refresh")')).toBeVisible();
    
    // Verify stats grid
    const stats = await helper.getInstanceStats();
    expect(typeof stats.total).toBe('number');
    expect(typeof stats.running).toBe('number');
    expect(typeof stats.errors).toBe('number');
  });

  test('should show real-time updates indicator', async ({ page }) => {
    await helper.waitForDashboardReady();
    
    // Check for live indicator
    await expect(page.locator('text=Live')).toBeVisible();
    await expect(page.locator('.animate-pulse')).toBeVisible();
    
    // Verify last updated timestamp updates
    const initialTime = await page.locator('text=/Last updated:/').textContent();
    await page.waitForTimeout(6000); // Wait for next update cycle
    const updatedTime = await page.locator('text=/Last updated:/').textContent();
    expect(updatedTime).not.toBe(initialTime);
  });

  test('should refresh dashboard data', async ({ page }) => {
    await helper.waitForDashboardReady();
    
    // Click refresh button
    await page.click('button:has-text("Refresh")');
    
    // Verify loading state
    await expect(page.locator('.animate-spin')).toBeVisible();
    
    // Wait for refresh to complete
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 5000 });
  });
});

// Instance Lifecycle Management
test.describe('Instance Lifecycle', () => {
  let helper: LauncherTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new LauncherTestHelper(page);
    await helper.navigateToLauncher();
    await helper.waitForDashboardReady();
  });

  test('should create new Claude instance successfully', async ({ page }) => {
    // Get initial stats
    const initialStats = await helper.getInstanceStats();
    
    // Create new instance
    await helper.createNewInstance(TEST_INSTANCE);
    
    // Verify instance appears in dashboard
    await expect(page.locator(`text=${TEST_INSTANCE.displayName}`)).toBeVisible();
    await helper.verifyInstanceDetails(TEST_INSTANCE.displayName, TEST_INSTANCE);
    
    // Verify stats updated
    const updatedStats = await helper.getInstanceStats();
    expect(updatedStats.total).toBe(initialStats.total + 1);
  });

  test('should start and stop instance correctly', async ({ page }) => {
    // Create instance first
    await helper.createNewInstance(TEST_INSTANCE);
    
    // Start instance
    await helper.startInstance(TEST_INSTANCE.displayName);
    
    // Verify running state
    const instanceCard = page.locator(`[data-testid="instance-${TEST_INSTANCE.displayName}"]`);
    await expect(instanceCard.locator('text=Running')).toBeVisible();
    await expect(instanceCard.locator('text=/PID:/')).toBeVisible();
    await expect(instanceCard.locator('text=/Uptime:/')).toBeVisible();
    
    // Stop instance
    await helper.stopInstance(TEST_INSTANCE.displayName);
    
    // Verify stopped state
    await expect(instanceCard.locator('text=Stopped')).toBeVisible();
    await expect(instanceCard.locator('text=/PID:/')).not.toBeVisible();
  });

  test('should handle instance errors gracefully', async ({ page }) => {
    // Create instance with invalid configuration to trigger error
    const invalidInstance = {
      ...TEST_INSTANCE,
      displayName: 'Invalid Instance',
      projectPath: '/nonexistent/path',
      tcpPort: 80 // Privileged port should cause error
    };
    
    await helper.createNewInstance(invalidInstance);
    await helper.startInstance(invalidInstance.displayName);
    
    // Verify error state is handled
    const instanceCard = page.locator(`[data-testid="instance-${invalidInstance.displayName}"]`);
    await expect(instanceCard.locator('text=Error').or(instanceCard.locator('text=Stopped'))).toBeVisible({ timeout: 10000 });
    
    // Check for error message if present
    const errorMessage = instanceCard.locator('[data-testid="error-message"]');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText(/error|failed|invalid/i);
    }
  });
});

// TCP Command Interface
test.describe('TCP Command Interface', () => {
  let helper: LauncherTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new LauncherTestHelper(page);
    await helper.navigateToLauncher();
    await helper.waitForDashboardReady();
    
    // Create and start instance for command testing
    await helper.createNewInstance(TEST_INSTANCE);
    await helper.startInstance(TEST_INSTANCE.displayName);
  });

  test('should send commands through TCP interface', async ({ page }) => {
    await helper.sendCommand(TEST_INSTANCE.displayName, 'ls');
    
    // Verify command interface is working
    const instanceCard = page.locator(`[data-testid="instance-${TEST_INSTANCE.displayName}"]`);
    await expect(instanceCard.locator('[data-testid="command-input"]')).toBeVisible();
  });

  test('should handle quick action commands', async ({ page }) => {
    const instanceCard = page.locator(`[data-testid="instance-${TEST_INSTANCE.displayName}"]`);
    
    // Open command interface
    await instanceCard.locator('button:has-text("Commands")').click();
    
    // Test quick action buttons
    await instanceCard.locator('button:has-text("Enter")').click();
    await instanceCard.locator('button:has-text("Tab")').click();
    await instanceCard.locator('button:has-text("↑")').click();
    await instanceCard.locator('button:has-text("↓")').click();
    
    // These should not cause errors
    await expect(instanceCard.locator('[data-testid="command-input"]')).toBeVisible();
  });

  test('should show logs for running instance', async ({ page }) => {
    const instanceCard = page.locator(`[data-testid="instance-${TEST_INSTANCE.displayName}"]`);
    
    // Click logs button
    await instanceCard.locator('button:has-text("Logs")').click();
    
    // This would typically open a logs panel or navigate to logs page
    // For now, verify the button works without errors
    await expect(instanceCard).toBeVisible();
  });
});

// API Integration Tests
test.describe('Launcher API Integration', () => {
  test('should list instances via API', async ({ page }) => {
    const response = await page.request.get('/api/launcher/instances');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.success).toBeTruthy();
    expect(data.data).toHaveProperty('instances');
    expect(data.data).toHaveProperty('totalCount');
    expect(data.data).toHaveProperty('runningCount');
  });

  test('should create instance via API', async ({ page }) => {
    const createResponse = await page.request.post('/api/launcher/instances', {
      data: {
        config: TEST_INSTANCE,
        startImmediately: false
      }
    });
    
    expect(createResponse.ok()).toBeTruthy();
    
    const data = await createResponse.json();
    expect(data.success).toBeTruthy();
    expect(data.data).toHaveProperty('instance');
    expect(data.data).toHaveProperty('bridgeInfo');
    expect(data.data.instance.config.projectPath).toBe(TEST_INSTANCE.projectPath);
  });

  test('should handle API validation errors', async ({ page }) => {
    // Send invalid data
    const invalidResponse = await page.request.post('/api/launcher/instances', {
      data: {
        config: {
          projectPath: '', // Invalid empty path
          tcpPort: 'invalid' // Invalid port type
        }
      }
    });
    
    expect(invalidResponse.status()).toBe(400);
    
    const errorData = await invalidResponse.json();
    expect(errorData.success).toBeFalsy();
    expect(errorData.error).toBeTruthy();
    expect(errorData.details).toBeTruthy();
  });

  test('should delete instance via API', async ({ page }) => {
    // First create an instance
    const createResponse = await page.request.post('/api/launcher/instances', {
      data: {
        config: TEST_INSTANCE,
        startImmediately: false
      }
    });
    
    const createData = await createResponse.json();
    const instanceId = createData.data.instance.id;
    
    // Then delete it
    const deleteResponse = await page.request.delete(`/api/launcher/instances?id=${instanceId}`);
    expect(deleteResponse.ok()).toBeTruthy();
    
    const deleteData = await deleteResponse.json();
    expect(deleteData.success).toBeTruthy();
    expect(deleteData.data.instanceId).toBe(instanceId);
  });
});

// Complete User Journey Tests
test.describe('Complete User Journeys', () => {
  let helper: LauncherTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new LauncherTestHelper(page);
  });

  test('should complete full Claude development workflow', async ({ page }) => {
    // Step 1: Navigate to launcher
    await helper.navigateToLauncher();
    await helper.waitForDashboardReady();
    
    // Step 2: Create development instance
    await helper.createNewInstance({
      ...TEST_INSTANCE,
      displayName: 'Development Project'
    });
    
    // Step 3: Start instance
    await helper.startInstance('Development Project');
    
    // Step 4: Send development commands
    await helper.sendCommand('Development Project', '/help');
    await helper.sendCommand('Development Project', 'ls');
    
    // Step 5: Monitor instance status
    const instanceCard = page.locator('[data-testid="instance-Development Project"]');
    await expect(instanceCard.locator('text=Running')).toBeVisible();
    await expect(instanceCard.locator('text=/Sessions: \\d+/')).toBeVisible();
    
    // Step 6: Check logs
    await instanceCard.locator('button:has-text("Logs")').click();
    
    // Step 7: Stop instance when done
    await helper.stopInstance('Development Project');
  });

  test('should handle multiple concurrent instances', async ({ page }) => {
    await helper.navigateToLauncher();
    await helper.waitForDashboardReady();
    
    // Create multiple instances
    const instances = [
      { ...TEST_INSTANCE, displayName: 'Project A', tcpPort: 9999 },
      { ...TEST_INSTANCE, displayName: 'Project B', tcpPort: 10000 },
      { ...TEST_INSTANCE, displayName: 'Project C', tcpPort: 10001 }
    ];
    
    // Create all instances
    for (const instance of instances) {
      await helper.createNewInstance(instance);
    }
    
    // Start all instances
    for (const instance of instances) {
      await helper.startInstance(instance.displayName);
    }
    
    // Verify all are running
    for (const instance of instances) {
      const instanceCard = page.locator(`[data-testid="instance-${instance.displayName}"]`);
      await expect(instanceCard.locator('text=Running')).toBeVisible();
    }
    
    // Check updated stats
    const stats = await helper.getInstanceStats();
    expect(stats.total).toBeGreaterThanOrEqual(3);
    expect(stats.running).toBeGreaterThanOrEqual(3);
    
    // Stop all instances
    for (const instance of instances) {
      await helper.stopInstance(instance.displayName);
    }
  });

  test('should handle Docker container restart scenarios', async ({ page }) => {
    await helper.navigateToLauncher();
    await helper.waitForDashboardReady();
    
    // Create persistent instance
    await helper.createNewInstance({
      ...TEST_INSTANCE,
      displayName: 'Persistent Instance',
      autoRestart: true
    });
    
    await helper.startInstance('Persistent Instance');
    
    // Simulate container restart by refreshing page and checking state persistence
    await page.reload();
    await helper.waitForDashboardReady();
    
    // Verify instance information is still available
    await expect(page.locator('text=Persistent Instance')).toBeVisible();
    
    // Note: In a real test, this would involve actual Docker container restart
    // which would require additional infrastructure setup
  });
});

// Performance and Reliability Tests
test.describe('Performance and Reliability', () => {
  test('should handle rapid instance creation/deletion', async ({ page }) => {
    const helper = new LauncherTestHelper(page);
    await helper.navigateToLauncher();
    await helper.waitForDashboardReady();
    
    // Rapidly create and delete instances
    for (let i = 0; i < 3; i++) {
      const instanceName = `Rapid Test ${i}`;
      await helper.createNewInstance({
        ...TEST_INSTANCE,
        displayName: instanceName,
        tcpPort: 9999 + i
      });
      
      // Immediately start and stop
      await helper.startInstance(instanceName);
      await helper.stopInstance(instanceName);
    }
    
    // Verify system stability
    const stats = await helper.getInstanceStats();
    expect(stats.errors).toBe(0);
  });

  test('should maintain responsive UI under load', async ({ page }) => {
    const helper = new LauncherTestHelper(page);
    await helper.navigateToLauncher();
    await helper.waitForDashboardReady();
    
    // Create multiple instances
    const instanceCount = 5;
    for (let i = 0; i < instanceCount; i++) {
      await helper.createNewInstance({
        ...TEST_INSTANCE,
        displayName: `Load Test ${i}`,
        tcpPort: 9999 + i
      });
    }
    
    // Verify UI remains responsive
    const refreshButton = page.locator('button:has-text("Refresh")');
    await refreshButton.click();
    
    // UI should respond within reasonable time
    await expect(page.locator('.animate-spin')).toBeVisible();
    await expect(page.locator('.animate-spin')).not.toBeVisible({ timeout: 10000 });
  });
});