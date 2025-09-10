import { test, expect } from '@playwright/test';
import { DashboardPage } from './page-objects/dashboard-page';
import { RecoveryActionsPage } from './page-objects/recovery-actions-page';

/**
 * E2E tests for Claude Monitor Recovery Actions
 * These tests validate recovery workflows equivalent to Python daemon operation scenarios
 * converting from terminal-based actions to web-based interactive recovery controls.
 */
test.describe('Recovery Actions', () => {
  let dashboardPage: DashboardPage;
  let recoveryPage: RecoveryActionsPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    recoveryPage = new RecoveryActionsPage(page);
    await dashboardPage.goto();
    await dashboardPage.waitForDataLoad();
  });

  test.describe('Recovery Controls Interface', () => {
    test('should display recovery controls for monitored projects', async () => {
      const projectCount = await dashboardPage.getProjectCount();
      if (projectCount > 0) {
        await dashboardPage.clickProject(0);
        
        // Navigate to recovery controls
        await dashboardPage.openRecoveryControls();
        
        // Verify recovery controls are visible
        await expect(recoveryPage.recoveryPanel).toBeVisible();
        await expect(recoveryPage.clearCommandButton).toBeVisible();
        await expect(recoveryPage.customCommandInput).toBeVisible();
        await expect(recoveryPage.automationToggle).toBeVisible();
        await expect(recoveryPage.notificationSettings).toBeVisible();
      }
    });

    test('should show recovery action status and history', async () => {
      const projectCount = await dashboardPage.getProjectCount();
      if (projectCount > 0) {
        await dashboardPage.clickProject(0);
        await dashboardPage.openRecoveryControls();
        
        // Verify action history section
        await expect(recoveryPage.actionHistory).toBeVisible();
        await expect(recoveryPage.actionHistoryList).toBeVisible();
        
        // Check if history shows recent actions or empty state
        const historyCount = await recoveryPage.getActionHistoryCount();
        if (historyCount === 0) {
          await expect(recoveryPage.emptyHistoryMessage).toBeVisible();
        } else {
          // Verify history entries have required information
          const firstAction = recoveryPage.getHistoryEntry(0);
          await expect(firstAction.timestamp).toBeVisible();
          await expect(firstAction.actionType).toBeVisible();
          await expect(firstAction.status).toBeVisible();
        }
      }
    });

    test('should validate recovery conditions before actions', async () => {
      const projectCount = await dashboardPage.getProjectCount();
      if (projectCount > 0) {
        await dashboardPage.clickProject(0);
        await dashboardPage.openRecoveryControls();
        
        // Attempt recovery action without valid conditions
        await recoveryPage.clickClearCommand();
        
        // Should show validation warning if conditions not met
        const projectState = await dashboardPage.getProjectState(0);
        if (projectState !== 'ERROR' && projectState !== 'ACTIVE') {
          await expect(recoveryPage.validationWarning).toBeVisible();
          await expect(recoveryPage.validationMessage).toContainText(/not require recovery/);
        }
      }
    });
  });

  test.describe('Clear Command Recovery', () => {
    test('should send clear command to Claude Code session', async ({ page }) => {
      const projectCount = await dashboardPage.getProjectCount();
      if (projectCount > 0) {
        // Select a project that might need recovery
        await dashboardPage.clickProject(0);
        const projectState = await dashboardPage.getProjectState(0);
        
        if (projectState === 'ERROR' || projectState === 'ACTIVE') {
          await dashboardPage.openRecoveryControls();
          
          // Execute clear command
          await recoveryPage.clickClearCommand();
          
          // Confirm action in modal
          await expect(recoveryPage.confirmationModal).toBeVisible();
          await expect(recoveryPage.confirmationMessage).toContainText(/send \/clear command/);
          await recoveryPage.confirmAction();
          
          // Verify action is executing
          await expect(recoveryPage.actionInProgress).toBeVisible();
          await expect(recoveryPage.progressIndicator).toBeVisible();
          
          // Wait for completion (with timeout)
          await recoveryPage.waitForActionCompletion();
          
          // Verify result
          await expect(recoveryPage.actionResult).toBeVisible();
          const result = await recoveryPage.getActionResult();
          expect(['success', 'partial', 'failed']).toContain(result.status);
        }
      }
    });

    test('should handle clear command failures gracefully', async ({ page }) => {
      const projectCount = await dashboardPage.getProjectCount();
      if (projectCount > 0) {
        await dashboardPage.clickProject(0);
        await dashboardPage.openRecoveryControls();
        
        // Mock network failure for command execution
        await page.route('**/api/recovery/clear', route => route.abort());
        
        await recoveryPage.clickClearCommand();
        await recoveryPage.confirmAction();
        
        // Verify error handling
        await expect(recoveryPage.errorMessage).toBeVisible();
        await expect(recoveryPage.errorMessage).toContainText(/failed to send command/);
        
        // Verify retry option is available
        await expect(recoveryPage.retryButton).toBeVisible();
        
        // Restore network and test retry
        await page.unroute('**/api/recovery/clear');
        await recoveryPage.clickRetry();
        
        // Should attempt action again
        await expect(recoveryPage.actionInProgress).toBeVisible();
      }
    });

    test('should update project state after successful clear', async () => {
      const projectCount = await dashboardPage.getProjectCount();
      if (projectCount > 0) {
        await dashboardPage.clickProject(0);
        const initialState = await dashboardPage.getProjectState(0);
        
        if (initialState === 'ERROR' || initialState === 'ACTIVE') {
          await dashboardPage.openRecoveryControls();
          await recoveryPage.executeClearCommand();
          
          // Wait for state change
          await dashboardPage.waitForStateChange(0);
          
          // Verify state has been updated
          const newState = await dashboardPage.getProjectState(0);
          expect(newState).not.toBe(initialState);
          
          // Should typically transition to IDLE or WAITING_INPUT
          expect(['IDLE', 'WAITING_INPUT', 'UNKNOWN']).toContain(newState);
        }
      }
    });
  });

  test.describe('Custom Command Recovery', () => {
    test('should execute custom commands with validation', async () => {
      const projectCount = await dashboardPage.getProjectCount();
      if (projectCount > 0) {
        await dashboardPage.clickProject(0);
        await dashboardPage.openRecoveryControls();
        
        // Test various custom commands
        const testCommands = [
          { command: '/sc:save', description: 'Save session' },
          { command: '/help', description: 'Get help' },
          { command: '/sc:load', description: 'Load session' }
        ];
        
        for (const testCmd of testCommands) {
          // Enter custom command
          await recoveryPage.enterCustomCommand(testCmd.command);
          
          // Verify command preview
          await expect(recoveryPage.commandPreview).toContainText(testCmd.command);
          
          // Execute command
          await recoveryPage.executeCustomCommand();
          
          // Verify execution feedback
          await expect(recoveryPage.executionFeedback).toBeVisible();
          
          // Wait for completion before next command
          await recoveryPage.waitForActionCompletion();
        }
      }
    });

    test('should prevent invalid or dangerous commands', async () => {
      const projectCount = await dashboardPage.getProjectCount();
      if (projectCount > 0) {
        await dashboardPage.clickProject(0);
        await dashboardPage.openRecoveryControls();
        
        // Test invalid commands
        const invalidCommands = [
          'rm -rf /',
          'sudo shutdown now',
          'malicious-script.sh',
          'exec(harmful_code)'
        ];
        
        for (const invalidCmd of invalidCommands) {
          await recoveryPage.enterCustomCommand(invalidCmd);
          
          // Should show validation error
          await expect(recoveryPage.commandValidationError).toBeVisible();
          await expect(recoveryPage.executeButton).toBeDisabled();
          
          // Clear input for next test
          await recoveryPage.clearCustomCommand();
        }
      }
    });

    test('should provide command suggestions and autocomplete', async () => {
      const projectCount = await dashboardPage.getProjectCount();
      if (projectCount > 0) {
        await dashboardPage.clickProject(0);
        await dashboardPage.openRecoveryControls();
        
        // Type partial command to trigger suggestions
        await recoveryPage.enterPartialCommand('/sc:');
        
        // Verify autocomplete suggestions appear
        await expect(recoveryPage.commandSuggestions).toBeVisible();
        
        const suggestions = await recoveryPage.getCommandSuggestions();
        expect(suggestions).toContain('/sc:save');
        expect(suggestions).toContain('/sc:load');
        expect(suggestions).toContain('/sc:implement');
        
        // Select suggestion and verify completion
        await recoveryPage.selectSuggestion('/sc:save');
        await expect(recoveryPage.customCommandInput).toHaveValue('/sc:save');
      }
    });
  });

  test.describe('Automated Recovery Rules', () => {
    test('should configure automation settings', async () => {
      const projectCount = await dashboardPage.getProjectCount();
      if (projectCount > 0) {
        await dashboardPage.clickProject(0);
        await dashboardPage.openRecoveryControls();
        
        // Access automation settings
        await recoveryPage.openAutomationSettings();
        
        // Verify automation options are available
        await expect(recoveryPage.autoRecoveryToggle).toBeVisible();
        await expect(recoveryPage.recoveryThresholds).toBeVisible();
        await expect(recoveryPage.actionDelays).toBeVisible();
        
        // Test automation configuration
        await recoveryPage.enableAutoRecovery();
        await recoveryPage.setRecoveryThreshold('medium');
        await recoveryPage.setActionDelay(30); // 30 seconds
        
        // Save settings
        await recoveryPage.saveAutomationSettings();
        
        // Verify settings are persisted
        await expect(recoveryPage.settingsSavedMessage).toBeVisible();
      }
    });

    test('should trigger automated recovery based on rules', async ({ page }) => {
      const projectCount = await dashboardPage.getProjectCount();
      if (projectCount > 0) {
        await dashboardPage.clickProject(0);
        await dashboardPage.openRecoveryControls();
        
        // Configure automation for immediate testing
        await recoveryPage.openAutomationSettings();
        await recoveryPage.enableAutoRecovery();
        await recoveryPage.setRecoveryThreshold('low');
        await recoveryPage.setActionDelay(5); // 5 seconds for testing
        await recoveryPage.saveAutomationSettings();
        
        // Simulate error condition that should trigger recovery
        // (In real implementation, this would be triggered by actual monitoring)
        await page.evaluate(() => {
          window.dispatchEvent(new CustomEvent('claude-error', {
            detail: { projectId: 0, errorType: 'timeout', severity: 'medium' }
          }));
        });
        
        // Verify automated recovery is triggered
        await expect(recoveryPage.automatedActionNotification).toBeVisible();
        await expect(recoveryPage.automatedActionDetails).toContainText(/automatic recovery/);
        
        // Wait for automated action to complete
        await recoveryPage.waitForAutomatedActionCompletion();
        
        // Verify action was logged in history
        const historyCount = await recoveryPage.getActionHistoryCount();
        expect(historyCount).toBeGreaterThan(0);
        
        const latestAction = recoveryPage.getHistoryEntry(0);
        await expect(latestAction.actionType).toContainText(/automated/);
      }
    });
  });

  test.describe('Notification and Alerting', () => {
    test('should configure notification preferences', async () => {
      const projectCount = await dashboardPage.getProjectCount();
      if (projectCount > 0) {
        await dashboardPage.clickProject(0);
        await dashboardPage.openRecoveryControls();
        
        // Access notification settings
        await recoveryPage.openNotificationSettings();
        
        // Verify notification options
        await expect(recoveryPage.browserNotificationsToggle).toBeVisible();
        await expect(recoveryPage.emailNotificationsToggle).toBeVisible();
        await expect(recoveryPage.soundAlertsToggle).toBeVisible();
        await expect(recoveryPage.notificationThresholds).toBeVisible();
        
        // Configure notifications
        await recoveryPage.enableBrowserNotifications();
        await recoveryPage.enableSoundAlerts();
        await recoveryPage.setNotificationThreshold('high');
        
        // Save notification settings
        await recoveryPage.saveNotificationSettings();
        
        // Verify browser permission request (if needed)
        // Note: This would require actual browser permission handling in real scenario
      }
    });

    test('should show recovery action notifications', async ({ context }) => {
      const projectCount = await dashboardPage.getProjectCount();
      if (projectCount > 0) {
        // Grant notification permissions
        await context.grantPermissions(['notifications']);
        
        await dashboardPage.clickProject(0);
        await dashboardPage.openRecoveryControls();
        
        // Configure to show notifications
        await recoveryPage.openNotificationSettings();
        await recoveryPage.enableBrowserNotifications();
        await recoveryPage.saveNotificationSettings();
        
        // Execute recovery action
        await recoveryPage.executeClearCommand();
        
        // Verify notification appears (implementation would depend on actual notification system)
        // In real scenario, we would listen for browser notifications
        await expect(recoveryPage.inAppNotification).toBeVisible();
        await expect(recoveryPage.inAppNotification).toContainText(/recovery action/);
      }
    });
  });

  test.describe('Error Recovery Scenarios', () => {
    test('should handle network connectivity issues', async ({ page }) => {
      const projectCount = await dashboardPage.getProjectCount();
      if (projectCount > 0) {
        await dashboardPage.clickProject(0);
        await dashboardPage.openRecoveryControls();
        
        // Simulate network disconnection during recovery action
        await recoveryPage.clickClearCommand();
        await recoveryPage.confirmAction();
        
        // Disconnect network mid-action
        await page.route('**/*', route => route.abort());
        
        // Verify offline handling
        await expect(recoveryPage.networkErrorMessage).toBeVisible();
        await expect(recoveryPage.offlineIndicator).toBeVisible();
        
        // Restore network
        await page.unroute('**/*');
        
        // Verify reconnection and retry capabilities
        await expect(recoveryPage.reconnectedMessage).toBeVisible();
        await expect(recoveryPage.retryButton).toBeVisible();
      }
    });

    test('should provide detailed error diagnostics', async () => {
      const projectCount = await dashboardPage.getProjectCount();
      if (projectCount > 0) {
        await dashboardPage.clickProject(0);
        await dashboardPage.openRecoveryControls();
        
        // Access error diagnostics
        await recoveryPage.openErrorDiagnostics();
        
        // Verify diagnostic information is available
        await expect(recoveryPage.diagnosticsPanel).toBeVisible();
        await expect(recoveryPage.systemStatus).toBeVisible();
        await expect(recoveryPage.connectionDiagnostics).toBeVisible();
        await expect(recoveryPage.sessionDiagnostics).toBeVisible();
        
        // Verify diagnostic data is meaningful
        const systemStatus = await recoveryPage.getSystemStatus();
        expect(systemStatus.claudeVersion).toBeTruthy();
        expect(systemStatus.projectPath).toBeTruthy();
        expect(systemStatus.lastActivity).toBeTruthy();
        
        // Test diagnostic actions
        await recoveryPage.runConnectionTest();
        await expect(recoveryPage.connectionTestResult).toBeVisible();
        
        await recoveryPage.refreshSessionInfo();
        await expect(recoveryPage.sessionRefreshComplete).toBeVisible();
      }
    });
  });
});