import { type Locator, type Page, expect } from '@playwright/test';

/**
 * Page Object Model for Claude Monitor Dashboard
 * Encapsulates dashboard interactions and element selectors for maintainable E2E testing
 */
export class DashboardPage {
  readonly page: Page;
  
  // Header and Navigation
  readonly headerTitle: Locator;
  readonly navigationMenu: Locator;
  readonly mobileNavigationToggle: Locator;
  readonly mobileMenu: Locator;
  
  // Main Dashboard Sections
  readonly projectsSection: Locator;
  readonly projectsList: Locator;
  readonly statusIndicators: Locator;
  readonly connectionStatus: Locator;
  readonly lastUpdateTime: Locator;
  
  // Real-time Updates
  readonly realTimeIndicator: Locator;
  readonly offlineIndicator: Locator;
  
  // Project Details
  readonly projectDetailPanel: Locator;
  readonly sessionsList: Locator;
  readonly sessionViewer: Locator;
  readonly eventTimeline: Locator;
  readonly stateHistory: Locator;
  readonly conversationEvents: Locator;
  
  // Empty States
  readonly emptyProjectsMessage: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // Header and Navigation
    this.headerTitle = page.locator('header h1, .header-title, [data-testid="header-title"]');
    this.navigationMenu = page.locator('nav, .navigation-menu, [data-testid="navigation-menu"]');
    this.mobileNavigationToggle = page.locator('.mobile-menu-toggle, [data-testid="mobile-menu-toggle"]');
    this.mobileMenu = page.locator('.mobile-menu, [data-testid="mobile-menu"]');
    
    // Main Dashboard Sections
    this.projectsSection = page.locator('.projects-section, [data-testid="projects-section"]');
    this.projectsList = page.locator('.projects-list, [data-testid="projects-list"]');
    this.statusIndicators = page.locator('.status-indicators, [data-testid="status-indicators"]');
    this.connectionStatus = page.locator('.connection-status, [data-testid="connection-status"]');
    this.lastUpdateTime = page.locator('.last-update, [data-testid="last-update"]');
    
    // Real-time Updates
    this.realTimeIndicator = page.locator('.realtime-indicator, [data-testid="realtime-indicator"]');
    this.offlineIndicator = page.locator('.offline-indicator, [data-testid="offline-indicator"]');
    
    // Project Details
    this.projectDetailPanel = page.locator('.project-detail-panel, [data-testid="project-detail-panel"]');
    this.sessionsList = page.locator('.sessions-list, [data-testid="sessions-list"]');
    this.sessionViewer = page.locator('.session-viewer, [data-testid="session-viewer"]');
    this.eventTimeline = page.locator('.event-timeline, [data-testid="event-timeline"]');
    this.stateHistory = page.locator('.state-history, [data-testid="state-history"]');
    this.conversationEvents = page.locator('.conversation-events, [data-testid="conversation-events"]');
    
    // Empty States
    this.emptyProjectsMessage = page.locator('.empty-projects, [data-testid="empty-projects"]');
  }

  /**
   * Navigate to dashboard page
   */
  async goto() {
    await this.page.goto('/dashboard');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for initial data to load
   */
  async waitForDataLoad() {
    // Wait for either projects to load or empty state to show
    await Promise.race([
      this.projectsList.waitFor(),
      this.emptyProjectsMessage.waitFor()
    ]);
    
    // Wait for status indicators to be ready
    await this.statusIndicators.waitFor({ timeout: 5000 });
  }

  /**
   * Toggle navigation menu
   */
  async toggleNavigationMenu() {
    await this.mobileNavigationToggle.click();
  }

  /**
   * Toggle mobile menu
   */
  async toggleMobileMenu() {
    await this.mobileNavigationToggle.click();
  }

  /**
   * Get navigation link by text
   */
  getNavigationLink(linkText: string): Locator {
    return this.navigationMenu.locator(`a:has-text("${linkText}"), [data-nav="${linkText}"]`);
  }

  /**
   * Get project count
   */
  async getProjectCount(): Promise<number> {
    const projectCards = this.projectsList.locator('.project-card, [data-testid^="project-"]');
    return await projectCards.count();
  }

  /**
   * Get project card by index
   */
  getProjectCard(index: number) {
    const card = this.projectsList.locator('.project-card, [data-testid^="project-"]').nth(index);
    
    return {
      projectName: card.locator('.project-name, [data-testid="project-name"]'),
      projectPath: card.locator('.project-path, [data-testid="project-path"]'),
      statusIndicator: card.locator('.status-indicator, [data-testid="status-indicator"]'),
      lastActivity: card.locator('.last-activity, [data-testid="last-activity"]'),
      
      async getStateIndicator(): Promise<string> {
        const stateElement = card.locator('.state-indicator, [data-testid="state-indicator"]');
        return await stateElement.textContent() || 'UNKNOWN';
      },
      
      async getStateIndicatorColor(): Promise<string> {
        const stateElement = card.locator('.state-indicator, [data-testid="state-indicator"]');
        return await stateElement.evaluate(el => getComputedStyle(el).backgroundColor);
      }
    };
  }

  /**
   * Click on a project by index
   */
  async clickProject(index: number) {
    const projectCard = this.projectsList.locator('.project-card, [data-testid^="project-"]').nth(index);
    await projectCard.click();
    await this.projectDetailPanel.waitFor();
  }

  /**
   * Get project state by index
   */
  async getProjectState(index: number): Promise<string> {
    const projectCard = this.getProjectCard(index);
    return await projectCard.getStateIndicator();
  }

  /**
   * Get session count
   */
  async getSessionCount(): Promise<number> {
    const sessionItems = this.sessionsList.locator('.session-item, [data-testid^="session-"]');
    return await sessionItems.count();
  }

  /**
   * Click on a session by index
   */
  async clickSession(index: number) {
    const sessionItem = this.sessionsList.locator('.session-item, [data-testid^="session-"]').nth(index);
    await sessionItem.click();
    await this.sessionViewer.waitFor();
  }

  /**
   * Get conversation events
   */
  async getConversationEvents(): Promise<Array<{ timestamp: string; eventType: string; content: string }>> {
    const events = await this.conversationEvents.locator('.event-item, [data-testid^="event-"]').all();
    
    const eventData = [];
    for (const event of events) {
      const timestamp = await event.locator('.event-timestamp, [data-testid="event-timestamp"]').textContent();
      const eventType = await event.locator('.event-type, [data-testid="event-type"]').textContent();
      const content = await event.locator('.event-content, [data-testid="event-content"]').textContent();
      
      eventData.push({
        timestamp: timestamp || '',
        eventType: eventType || '',
        content: content || ''
      });
    }
    
    return eventData;
  }

  /**
   * Get last update time
   */
  async getLastUpdateTime(): Promise<string> {
    return await this.lastUpdateTime.textContent() || '';
  }

  /**
   * Enable real-time updates
   */
  async enableRealTimeUpdates() {
    const realTimeToggle = this.page.locator('.realtime-toggle, [data-testid="realtime-toggle"]');
    if (await realTimeToggle.isVisible()) {
      await realTimeToggle.check();
    }
  }

  /**
   * Wait for reconnection after network issues
   */
  async waitForReconnection() {
    await this.realTimeIndicator.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Wait for project state change
   */
  async waitForStateChange(projectIndex: number, timeout: number = 30000) {
    const initialState = await this.getProjectState(projectIndex);
    
    await this.page.waitForFunction(
      ({ index, initial }) => {
        const projectCards = document.querySelectorAll('.project-card, [data-testid^="project-"]');
        const card = projectCards[index];
        if (!card) return false;
        
        const stateElement = card.querySelector('.state-indicator, [data-testid="state-indicator"]');
        const currentState = stateElement?.textContent || 'UNKNOWN';
        return currentState !== initial;
      },
      { projectIndex, initial: initialState },
      { timeout }
    );
  }

  /**
   * Open recovery controls for current project
   */
  async openRecoveryControls() {
    const recoveryButton = this.projectDetailPanel.locator('.recovery-button, [data-testid="recovery-button"]');
    await recoveryButton.click();
  }
}