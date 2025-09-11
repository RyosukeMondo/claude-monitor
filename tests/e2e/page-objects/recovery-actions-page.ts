import { type Locator, type Page, expect } from '@playwright/test';

/**
 * Page Object Model for Recovery Actions functionality
 * Handles interactions with recovery controls, command execution, and automation settings
 */
export class RecoveryActionsPage {
  readonly page: Page;
  
  // Main Recovery Panel
  readonly recoveryPanel: Locator;
  readonly clearCommandButton: Locator;
  readonly customCommandInput: Locator;
  readonly executeButton: Locator;
  readonly automationToggle: Locator;
  readonly notificationSettings: Locator;
  
  // Action History
  readonly actionHistory: Locator;
  readonly actionHistoryList: Locator;
  readonly emptyHistoryMessage: Locator;
  
  // Command Interface
  readonly commandPreview: Locator;
  readonly commandValidationError: Locator;
  readonly commandSuggestions: Locator;
  
  // Action Execution
  readonly confirmationModal: Locator;
  readonly confirmationMessage: Locator;
  readonly actionInProgress: Locator;
  readonly progressIndicator: Locator;
  readonly actionResult: Locator;
  readonly errorMessage: Locator;
  readonly retryButton: Locator;
  readonly executionFeedback: Locator;
  
  // Automation Settings
  readonly autoRecoveryToggle: Locator;
  readonly recoveryThresholds: Locator;
  readonly actionDelays: Locator;
  readonly settingsSavedMessage: Locator;
  readonly automatedActionNotification: Locator;
  readonly automatedActionDetails: Locator;
  
  // Notification Settings
  readonly browserNotificationsToggle: Locator;
  readonly emailNotificationsToggle: Locator;
  readonly soundAlertsToggle: Locator;
  readonly notificationThresholds: Locator;
  readonly inAppNotification: Locator;
  
  // Error Handling
  readonly validationWarning: Locator;
  readonly validationMessage: Locator;
  readonly networkErrorMessage: Locator;
  readonly offlineIndicator: Locator;
  readonly reconnectedMessage: Locator;
  
  // Diagnostics
  readonly diagnosticsPanel: Locator;
  readonly systemStatus: Locator;
  readonly connectionDiagnostics: Locator;
  readonly sessionDiagnostics: Locator;
  readonly connectionTestResult: Locator;
  readonly sessionRefreshComplete: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Main Recovery Panel
    this.recoveryPanel = page.locator('.recovery-panel, [data-testid="recovery-panel"]');
    this.clearCommandButton = page.locator('.clear-command-btn, [data-testid="clear-command"]');
    this.customCommandInput = page.locator('.custom-command-input, [data-testid="custom-command-input"]');
    this.executeButton = page.locator('.execute-btn, [data-testid="execute-command"]');
    this.automationToggle = page.locator('.automation-toggle, [data-testid="automation-toggle"]');
    this.notificationSettings = page.locator('.notification-settings, [data-testid="notification-settings"]');
    
    // Action History
    this.actionHistory = page.locator('.action-history, [data-testid="action-history"]');
    this.actionHistoryList = page.locator('.action-history-list, [data-testid="action-history-list"]');
    this.emptyHistoryMessage = page.locator('.empty-history, [data-testid="empty-history"]');
    
    // Command Interface
    this.commandPreview = page.locator('.command-preview, [data-testid="command-preview"]');
    this.commandValidationError = page.locator('.validation-error, [data-testid="validation-error"]');
    this.commandSuggestions = page.locator('.command-suggestions, [data-testid="command-suggestions"]');
    
    // Action Execution
    this.confirmationModal = page.locator('.confirmation-modal, [data-testid="confirmation-modal"]');
    this.confirmationMessage = page.locator('.confirmation-message, [data-testid="confirmation-message"]');
    this.actionInProgress = page.locator('.action-in-progress, [data-testid="action-in-progress"]');
    this.progressIndicator = page.locator('.progress-indicator, [data-testid="progress-indicator"]');
    this.actionResult = page.locator('.action-result, [data-testid="action-result"]');
    this.errorMessage = page.locator('.error-message, [data-testid="error-message"]');
    this.retryButton = page.locator('.retry-btn, [data-testid="retry-action"]');
    this.executionFeedback = page.locator('.execution-feedback, [data-testid="execution-feedback"]');
    
    // Automation Settings
    this.autoRecoveryToggle = page.locator('.auto-recovery-toggle, [data-testid="auto-recovery-toggle"]');
    this.recoveryThresholds = page.locator('.recovery-thresholds, [data-testid="recovery-thresholds"]');
    this.actionDelays = page.locator('.action-delays, [data-testid="action-delays"]');
    this.settingsSavedMessage = page.locator('.settings-saved, [data-testid="settings-saved"]');
    this.automatedActionNotification = page.locator('.automated-action-notification, [data-testid="automated-action-notification"]');
    this.automatedActionDetails = page.locator('.automated-action-details, [data-testid="automated-action-details"]');
    
    // Notification Settings
    this.browserNotificationsToggle = page.locator('.browser-notifications-toggle, [data-testid="browser-notifications-toggle"]');
    this.emailNotificationsToggle = page.locator('.email-notifications-toggle, [data-testid="email-notifications-toggle"]');
    this.soundAlertsToggle = page.locator('.sound-alerts-toggle, [data-testid="sound-alerts-toggle"]');
    this.notificationThresholds = page.locator('.notification-thresholds, [data-testid="notification-thresholds"]');
    this.inAppNotification = page.locator('.in-app-notification, [data-testid="in-app-notification"]');
    
    // Error Handling
    this.validationWarning = page.locator('.validation-warning, [data-testid="validation-warning"]');
    this.validationMessage = page.locator('.validation-message, [data-testid="validation-message"]');
    this.networkErrorMessage = page.locator('.network-error, [data-testid="network-error"]');
    this.offlineIndicator = page.locator('.offline-indicator, [data-testid="offline-indicator"]');
    this.reconnectedMessage = page.locator('.reconnected-message, [data-testid="reconnected"]');
    
    // Diagnostics
    this.diagnosticsPanel = page.locator('.diagnostics-panel, [data-testid="diagnostics-panel"]');
    this.systemStatus = page.locator('.system-status, [data-testid="system-status"]');
    this.connectionDiagnostics = page.locator('.connection-diagnostics, [data-testid="connection-diagnostics"]');
    this.sessionDiagnostics = page.locator('.session-diagnostics, [data-testid="session-diagnostics"]');
    this.connectionTestResult = page.locator('.connection-test-result, [data-testid="connection-test-result"]');
    this.sessionRefreshComplete = page.locator('.session-refresh-complete, [data-testid="session-refresh-complete"]');
  }

  /**
   * Click clear command button
   */
  async clickClearCommand() {
    await this.clearCommandButton.click();
  }

  /**
   * Execute clear command with confirmation
   */
  async executeClearCommand() {
    await this.clickClearCommand();
    await this.confirmAction();
    await this.waitForActionCompletion();
  }

  /**
   * Confirm action in modal
   */
  async confirmAction() {
    const confirmButton = this.confirmationModal.locator('.confirm-btn, [data-testid="confirm-action"]');
    await confirmButton.click();
  }

  /**
   * Cancel action in modal
   */
  async cancelAction() {
    const cancelButton = this.confirmationModal.locator('.cancel-btn, [data-testid="cancel-action"]');
    await cancelButton.click();
  }

  /**
   * Wait for action to complete
   */
  async waitForActionCompletion(timeout: number = 30000) {
    // Wait for action to start
    await this.actionInProgress.waitFor({ timeout: 5000 });
    
    // Wait for action to complete
    await this.actionInProgress.waitFor({ state: 'hidden', timeout });
    
    // Wait for result to appear
    await this.actionResult.waitFor({ timeout: 5000 });
  }

  /**
   * Wait for automated action to complete
   */
  async waitForAutomatedActionCompletion(timeout: number = 60000) {
    await this.automatedActionNotification.waitFor({ timeout: 10000 });
    await this.automatedActionNotification.waitFor({ state: 'hidden', timeout });
  }

  /**
   * Get action result
   */
  async getActionResult(): Promise<{ status: string; message: string }> {
    const statusElement = this.actionResult.locator('.result-status, [data-testid="result-status"]');
    const messageElement = this.actionResult.locator('.result-message, [data-testid="result-message"]');
    
    return {
      status: await statusElement.textContent() || 'unknown',
      message: await messageElement.textContent() || ''
    };
  }

  /**
   * Click retry button
   */
  async clickRetry() {
    await this.retryButton.click();
  }

  /**
   * Enter custom command
   */
  async enterCustomCommand(command: string) {
    await this.customCommandInput.fill(command);
  }

  /**
   * Enter partial command for autocomplete testing
   */
  async enterPartialCommand(partialCommand: string) {
    await this.customCommandInput.fill(partialCommand);
    await this.page.waitForTimeout(500); // Wait for suggestions to appear
  }

  /**
   * Clear custom command input
   */
  async clearCustomCommand() {
    await this.customCommandInput.clear();
  }

  /**
   * Execute custom command
   */
  async executeCustomCommand() {
    await this.executeButton.click();
  }

  /**
   * Get command suggestions
   */
  async getCommandSuggestions(): Promise<string[]> {
    const suggestions = await this.commandSuggestions.locator('.suggestion-item, [data-testid^="suggestion-"]').all();
    
    const suggestionTexts = [];
    for (const suggestion of suggestions) {
      const text = await suggestion.textContent();
      if (text) suggestionTexts.push(text.trim());
    }
    
    return suggestionTexts;
  }

  /**
   * Select suggestion by text
   */
  async selectSuggestion(suggestionText: string) {
    const suggestion = this.commandSuggestions.locator(`.suggestion-item:has-text("${suggestionText}"), [data-suggestion="${suggestionText}"]`);
    await suggestion.click();
  }

  /**
   * Get action history count
   */
  async getActionHistoryCount(): Promise<number> {
    const historyItems = this.actionHistoryList.locator('.history-item, [data-testid^="history-"]');
    return await historyItems.count();
  }

  /**
   * Get history entry by index
   */
  getHistoryEntry(index: number) {
    const entry = this.actionHistoryList.locator('.history-item, [data-testid^="history-"]').nth(index);
    
    return {
      timestamp: entry.locator('.history-timestamp, [data-testid="history-timestamp"]'),
      actionType: entry.locator('.history-action-type, [data-testid="history-action-type"]'),
      status: entry.locator('.history-status, [data-testid="history-status"]')
    };
  }

  /**
   * Open automation settings
   */
  async openAutomationSettings() {
    const settingsButton = this.page.locator('.automation-settings-btn, [data-testid="automation-settings"]');
    await settingsButton.click();
  }

  /**
   * Enable auto recovery
   */
  async enableAutoRecovery() {
    await this.autoRecoveryToggle.check();
  }

  /**
   * Disable auto recovery
   */
  async disableAutoRecovery() {
    await this.autoRecoveryToggle.uncheck();
  }

  /**
   * Set recovery threshold
   */
  async setRecoveryThreshold(threshold: 'low' | 'medium' | 'high') {
    const thresholdSelect = this.recoveryThresholds.locator('select, [data-testid="threshold-select"]');
    await thresholdSelect.selectOption(threshold);
  }

  /**
   * Set action delay
   */
  async setActionDelay(seconds: number) {
    const delayInput = this.actionDelays.locator('input, [data-testid="delay-input"]');
    await delayInput.fill(seconds.toString());
  }

  /**
   * Save automation settings
   */
  async saveAutomationSettings() {
    const saveButton = this.page.locator('.save-automation-btn, [data-testid="save-automation"]');
    await saveButton.click();
  }

  /**
   * Open notification settings
   */
  async openNotificationSettings() {
    const notificationButton = this.page.locator('.notification-settings-btn, [data-testid="notification-settings-btn"]');
    await notificationButton.click();
  }

  /**
   * Enable browser notifications
   */
  async enableBrowserNotifications() {
    await this.browserNotificationsToggle.check();
  }

  /**
   * Enable email notifications
   */
  async enableEmailNotifications() {
    await this.emailNotificationsToggle.check();
  }

  /**
   * Enable sound alerts
   */
  async enableSoundAlerts() {
    await this.soundAlertsToggle.check();
  }

  /**
   * Set notification threshold
   */
  async setNotificationThreshold(threshold: 'low' | 'medium' | 'high') {
    const thresholdSelect = this.notificationThresholds.locator('select, [data-testid="notification-threshold-select"]');
    await thresholdSelect.selectOption(threshold);
  }

  /**
   * Save notification settings
   */
  async saveNotificationSettings() {
    const saveButton = this.page.locator('.save-notifications-btn, [data-testid="save-notifications"]');
    await saveButton.click();
  }

  /**
   * Open error diagnostics
   */
  async openErrorDiagnostics() {
    const diagnosticsButton = this.page.locator('.diagnostics-btn, [data-testid="error-diagnostics"]');
    await diagnosticsButton.click();
  }

  /**
   * Get system status
   */
  async getSystemStatus(): Promise<{ claudeVersion: string; projectPath: string; lastActivity: string }> {
    const versionElement = this.systemStatus.locator('.claude-version, [data-testid="claude-version"]');
    const pathElement = this.systemStatus.locator('.project-path, [data-testid="project-path"]');
    const activityElement = this.systemStatus.locator('.last-activity, [data-testid="last-activity"]');
    
    return {
      claudeVersion: await versionElement.textContent() || '',
      projectPath: await pathElement.textContent() || '',
      lastActivity: await activityElement.textContent() || ''
    };
  }

  /**
   * Run connection test
   */
  async runConnectionTest() {
    const testButton = this.connectionDiagnostics.locator('.test-connection-btn, [data-testid="test-connection"]');
    await testButton.click();
  }

  /**
   * Refresh session info
   */
  async refreshSessionInfo() {
    const refreshButton = this.sessionDiagnostics.locator('.refresh-session-btn, [data-testid="refresh-session"]');
    await refreshButton.click();
  }
}