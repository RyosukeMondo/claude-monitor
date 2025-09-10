import { test, expect } from '@playwright/test';
import { DashboardPage } from './page-objects/dashboard-page';
import { RecoveryActionsPage } from './page-objects/recovery-actions-page';

/**
 * E2E tests for the Claude Monitor Dashboard functionality
 * These tests validate the complete user experience for monitoring Claude Code projects
 * and managing recovery actions through the web interface.
 */
test.describe('Claude Monitor Dashboard', () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
  });

  test.describe('Dashboard Navigation and Layout', () => {
    test('should display main dashboard with project monitoring sections', async () => {
      // Verify main dashboard elements are present
      await expect(dashboardPage.page).toHaveTitle(/Claude Monitor/);
      await expect(dashboardPage.headerTitle).toBeVisible();
      await expect(dashboardPage.projectsSection).toBeVisible();
      await expect(dashboardPage.statusIndicators).toBeVisible();
    });

    test('should show responsive navigation menu', async () => {
      // Test navigation menu functionality
      await dashboardPage.toggleNavigationMenu();
      await expect(dashboardPage.navigationMenu).toBeVisible();
      
      // Check navigation links
      const expectedLinks = ['Dashboard', 'Projects', 'Sessions', 'Recovery', 'Settings'];
      for (const link of expectedLinks) {
        await expect(dashboardPage.getNavigationLink(link)).toBeVisible();
      }
    });

    test('should display real-time status updates', async () => {
      // Wait for initial data to load
      await dashboardPage.waitForDataLoad();
      
      // Verify status indicators are functional
      await expect(dashboardPage.connectionStatus).toBeVisible();
      await expect(dashboardPage.lastUpdateTime).toBeVisible();
      
      // Check that update time reflects recent activity
      const updateTime = await dashboardPage.getLastUpdateTime();
      expect(updateTime).toBeTruthy();
    });
  });

  test.describe('Project Monitoring', () => {
    test('should display list of monitored Claude Code projects', async () => {
      await dashboardPage.waitForDataLoad();
      
      // Verify project list is displayed
      await expect(dashboardPage.projectsList).toBeVisible();
      
      // Check if we have at least one project or proper empty state
      const projectCount = await dashboardPage.getProjectCount();
      if (projectCount === 0) {
        await expect(dashboardPage.emptyProjectsMessage).toBeVisible();
      } else {
        // Verify project cards contain required information
        const firstProject = dashboardPage.getProjectCard(0);
        await expect(firstProject.projectName).toBeVisible();
        await expect(firstProject.projectPath).toBeVisible();
        await expect(firstProject.statusIndicator).toBeVisible();
        await expect(firstProject.lastActivity).toBeVisible();
      }
    });

    test('should show project-specific monitoring details', async ({ page }) => {
      await dashboardPage.waitForDataLoad();
      
      const projectCount = await dashboardPage.getProjectCount();
      if (projectCount > 0) {
        // Click on first project to view details
        await dashboardPage.clickProject(0);
        
        // Verify project detail view
        await expect(dashboardPage.projectDetailPanel).toBeVisible();
        await expect(dashboardPage.sessionsList).toBeVisible();
        await expect(dashboardPage.eventTimeline).toBeVisible();
        await expect(dashboardPage.stateHistory).toBeVisible();
      }
    });

    test('should display Claude activity states correctly', async () => {
      await dashboardPage.waitForDataLoad();
      
      const projectCount = await dashboardPage.getProjectCount();
      if (projectCount > 0) {
        // Check state indicators for each project
        for (let i = 0; i < Math.min(projectCount, 3); i++) {
          const project = dashboardPage.getProjectCard(i);
          const stateIndicator = await project.getStateIndicator();
          
          // Verify state is one of the valid states
          const validStates = ['UNKNOWN', 'IDLE', 'ACTIVE', 'WAITING_INPUT', 'ERROR'];
          expect(validStates).toContain(stateIndicator);
          
          // Verify visual indicator matches state
          const indicatorColor = await project.getStateIndicatorColor();
          expect(indicatorColor).toBeTruthy();
        }
      }
    });

    test('should show session information and conversation events', async () => {
      await dashboardPage.waitForDataLoad();
      
      const projectCount = await dashboardPage.getProjectCount();
      if (projectCount > 0) {
        await dashboardPage.clickProject(0);
        
        // Verify session viewer displays correctly
        await expect(dashboardPage.sessionViewer).toBeVisible();
        
        const sessionCount = await dashboardPage.getSessionCount();
        if (sessionCount > 0) {
          // Click on first session
          await dashboardPage.clickSession(0);
          
          // Verify conversation events are shown
          await expect(dashboardPage.conversationEvents).toBeVisible();
          await expect(dashboardPage.eventTimeline).toBeVisible();
          
          // Check event details
          const events = await dashboardPage.getConversationEvents();
          if (events.length > 0) {
            const firstEvent = events[0];
            expect(firstEvent.timestamp).toBeTruthy();
            expect(firstEvent.eventType).toMatch(/user|assistant/);
            expect(firstEvent.content).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('Real-time Updates', () => {
    test('should receive live updates when Claude activity changes', async ({ page }) => {
      await dashboardPage.waitForDataLoad();
      
      // Listen for WebSocket connections
      const wsPromise = page.waitForEvent('websocket');
      await dashboardPage.enableRealTimeUpdates();
      
      const ws = await wsPromise;
      expect(ws.url()).toMatch(/socket\.io/);
      
      // Verify real-time indicator is active
      await expect(dashboardPage.realTimeIndicator).toBeVisible();
      await expect(dashboardPage.realTimeIndicator).toHaveClass(/connected/);
    });

    test('should handle connection failures gracefully', async ({ page }) => {
      await dashboardPage.waitForDataLoad();
      
      // Simulate network disconnection
      await page.route('**/socket.io/**', route => route.abort());
      
      // Verify offline indicator appears
      await expect(dashboardPage.offlineIndicator).toBeVisible();
      
      // Restore connection and verify reconnection
      await page.unroute('**/socket.io/**');
      await dashboardPage.waitForReconnection();
      
      await expect(dashboardPage.realTimeIndicator).toBeVisible();
    });
  });

  test.describe('Performance and Accessibility', () => {
    test('should load dashboard within acceptable time limits', async ({ page }) => {
      const startTime = Date.now();
      await dashboardPage.goto();
      await dashboardPage.waitForDataLoad();
      const loadTime = Date.now() - startTime;
      
      // Dashboard should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should be accessible to screen readers', async ({ page }) => {
      await dashboardPage.goto();
      
      // Check for proper heading structure
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
      expect(headings.length).toBeGreaterThan(0);
      
      // Verify ARIA labels are present
      await expect(page.locator('[aria-label]')).toHaveCount({ min: 1 });
      
      // Check for proper landmark roles
      await expect(page.locator('[role="main"]')).toBeVisible();
      await expect(page.locator('[role="navigation"]')).toBeVisible();
    });

    test('should work on mobile viewports', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await dashboardPage.goto();
      
      // Verify mobile-friendly layout
      await expect(dashboardPage.mobileNavigationToggle).toBeVisible();
      
      // Test mobile menu functionality
      await dashboardPage.toggleMobileMenu();
      await expect(dashboardPage.mobileMenu).toBeVisible();
      
      // Verify project cards are properly stacked
      const projectCards = await dashboardPage.projectsList.locator('.project-card').all();
      if (projectCards.length > 0) {
        // Projects should stack vertically on mobile
        for (let i = 1; i < Math.min(projectCards.length, 3); i++) {
          const prevCard = await projectCards[i - 1].boundingBox();
          const currentCard = await projectCards[i].boundingBox();
          expect(currentCard.y).toBeGreaterThan(prevCard.y + prevCard.height);
        }
      }
    });
  });
});