import { test, expect } from './fixtures/test-fixtures';
import { TestUtils, TestAssertions } from './fixtures/test-fixtures';

/**
 * E2E tests for UI Navigation and Complete User Journeys
 * These tests validate the complete user experience through the new UI,
 * covering navigation flows, feature integration, and user workflows.
 */
test.describe('UI Navigation and User Journeys', () => {
  
  test.describe('Authentication and Initial Access', () => {
    test('should redirect unauthenticated users to login with return URL', async ({ page }) => {
      // Try to access protected dashboard directly
      await page.goto('/dashboard');
      
      // Should redirect to login page
      await expect(page).toHaveURL(/\/login/);
      
      // Check that return URL is preserved
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/returnUrl/);
      
      // Verify login form is accessible
      await TestAssertions.assertAccessible(
        page.locator('[data-testid="login-form"], .login-form, form'),
        'Login form'
      );
    });

    test('should complete authentication flow and return to requested page', async ({ page }) => {
      // Mock successful authentication
      await TestUtils.mockApiResponses(page, {
        'auth/login': { success: true, token: 'mock-jwt-token', user: { id: 1, name: 'Test User' } },
        'auth/me': { id: 1, name: 'Test User', role: 'user' }
      });
      
      // Navigate to login and complete authentication
      await page.goto('/login?returnUrl=/dashboard');
      
      // Fill and submit login form
      await page.fill('[data-testid="email"], input[type="email"]', 'test@example.com');
      await page.fill('[data-testid="password"], input[type="password"]', 'password123');
      await page.click('[data-testid="login-button"], button[type="submit"]');
      
      // Should redirect to dashboard
      await expect(page).toHaveURL('/dashboard');
      
      // Verify user info in header
      await expect(page.locator('[data-testid="user-info"], .user-info')).toBeVisible();
      await expect(page.locator('[data-testid="user-name"], .user-name')).toContainText('Test User');
    });

    test('should handle session expiration gracefully', async ({ page }) => {
      // Start authenticated
      await TestUtils.mockApiResponses(page, {
        'auth/me': { id: 1, name: 'Test User', role: 'user' },
        'projects': { projects: [] }
      });
      
      await page.goto('/dashboard');
      await expect(page.locator('[data-testid="projects-section"]')).toBeVisible();
      
      // Simulate session expiration
      await TestUtils.mockApiResponses(page, {
        'auth/me': { error: 'Unauthorized' },
        'projects': { error: 'Unauthorized' }
      });
      
      // Trigger API call that will fail
      await page.reload();
      
      // Should prompt for re-authentication
      await expect(page.locator('[data-testid="session-expired"], .session-expired')).toBeVisible();
      
      // Or redirect to login
      const currentUrl = page.url();
      if (currentUrl.includes('/login')) {
        expect(currentUrl).toMatch(/returnUrl.*dashboard/);
      }
    });
  });

  test.describe('Main Navigation Flow', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authentication and basic data
      await TestUtils.mockApiResponses(page, {
        'auth/me': { id: 1, name: 'Test User', role: 'admin' },
        'health': { status: 'healthy', uptime: 3600, version: '1.0.0' },
        'projects': { projects: [] },
        'performance/metrics': { cpu: 45, memory: 60, requests: 120 }
      });
      
      await page.goto('/dashboard');
    });

    test('should display consistent layout with sidebar and header across all pages', async ({ page }) => {
      // Verify fixed layout elements
      await expect(page.locator('[data-testid="sidebar"], .sidebar, nav')).toBeVisible();
      await expect(page.locator('[data-testid="header"], header')).toBeVisible();
      await expect(page.locator('[data-testid="main-content"], main, .main-content')).toBeVisible();
      
      // Test navigation to different pages
      const navigationPages = [
        { link: 'Dashboard', path: '/dashboard' },
        { link: 'Performance', path: '/performance' },
        { link: 'Projects', path: '/projects' },
        { link: 'Sessions', path: '/sessions' },
        { link: 'Recovery', path: '/recovery' },
        { link: 'Settings', path: '/settings' }
      ];
      
      for (const navItem of navigationPages) {
        // Click navigation link
        await page.click(`[data-nav="${navItem.link}"], nav a:has-text("${navItem.link}")`);
        
        // Verify URL changed
        await expect(page).toHaveURL(navItem.path);
        
        // Verify active state in navigation
        const activeLink = page.locator(`[data-nav="${navItem.link}"].active, nav a[href="${navItem.path}"].active`);
        await expect(activeLink).toBeVisible();
        
        // Verify layout consistency
        await expect(page.locator('[data-testid="sidebar"], .sidebar, nav')).toBeVisible();
        await expect(page.locator('[data-testid="header"], header')).toBeVisible();
        
        // Verify page loaded successfully
        await TestAssertions.assertPerformance(page, 3000, `${navItem.link} page`);
      }
    });

    test('should show navigation tooltips on hover for better usability', async ({ page }) => {
      const navigationItems = page.locator('[data-testid="nav-item"], .nav-item, nav a');
      const count = await navigationItems.count();
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const navItem = navigationItems.nth(i);
        
        // Hover over navigation item
        await navItem.hover();
        
        // Check for tooltip or title attribute
        const tooltip = page.locator('[data-testid="tooltip"], .tooltip, [role="tooltip"]');
        const hasTooltip = await tooltip.isVisible();
        const hasTitle = await navItem.getAttribute('title');
        
        expect(hasTooltip || hasTitle).toBeTruthy();
      }
    });

    test('should provide responsive mobile navigation', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Mobile navigation toggle should be visible
      await expect(page.locator('[data-testid="mobile-menu-toggle"], .mobile-menu-toggle')).toBeVisible();
      
      // Sidebar should be collapsed on mobile
      const sidebar = page.locator('[data-testid="sidebar"], .sidebar, nav');
      const isCollapsed = await sidebar.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.transform.includes('translate') || style.left === '-100%' || !el.offsetWidth;
      });
      expect(isCollapsed).toBeTruthy();
      
      // Toggle mobile menu
      await page.click('[data-testid="mobile-menu-toggle"], .mobile-menu-toggle');
      
      // Navigation menu should become visible
      await expect(page.locator('[data-testid="mobile-menu"], .mobile-menu')).toBeVisible();
      
      // Test mobile navigation link
      await page.click('[data-nav="Performance"], nav a:has-text("Performance")');
      await expect(page).toHaveURL('/performance');
      
      // Menu should collapse after navigation
      const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu');
      await expect(mobileMenu).toBeHidden({ timeout: 5000 });
    });
  });

  test.describe('Complete User Journey - Dashboard to Feature Usage', () => {
    test.beforeEach(async ({ page }) => {
      // Mock comprehensive data for complete user journey
      await TestUtils.mockApiResponses(page, {
        'auth/me': { id: 1, name: 'Test User', role: 'admin' },
        'health': { 
          status: 'healthy', 
          uptime: 3600, 
          version: '1.0.0',
          dependencies: { database: 'connected', cache: 'connected' }
        },
        'projects': { 
          projects: [
            {
              id: 'project-1',
              name: 'Test Project',
              path: '/mnt/d/repos/test-project',
              state: 'ACTIVE',
              lastActivity: new Date().toISOString(),
              sessionCount: 3
            }
          ]
        },
        'projects/project-1/sessions': [
          {
            id: 'session-1',
            projectId: 'project-1',
            isActive: true,
            startTime: new Date().toISOString(),
            eventCount: 15
          }
        ],
        'performance/metrics': { 
          cpu: 45, 
          memory: 60, 
          requests: 120,
          responseTime: 150
        },
        'recovery/status': {
          canRecover: true,
          lastRecovery: new Date(Date.now() - 3600000).toISOString(),
          availableActions: ['restart', 'cleanup']
        }
      });
      
      await page.goto('/dashboard');
    });

    test('should complete full monitoring workflow: login → dashboard → project → session → recovery', async ({ page }) => {
      // Step 1: Dashboard Overview
      await expect(page.locator('[data-testid="dashboard-title"], h1')).toContainText('Dashboard');
      
      // Verify system health displayed
      await expect(page.locator('[data-testid="health-status"], .health-status')).toBeVisible();
      await expect(page.locator('[data-testid="health-status"]')).toContainText('healthy');
      
      // Verify quick action buttons
      await expect(page.locator('[data-testid="quick-actions"], .quick-actions')).toBeVisible();
      
      // Step 2: Navigate to Projects
      await page.click('[data-nav="Projects"], nav a:has-text("Projects")');
      await expect(page).toHaveURL('/projects');
      
      // Verify project list with status indicators
      await expect(page.locator('[data-testid="projects-list"], .projects-list')).toBeVisible();
      const projectCard = page.locator('[data-testid="project-project-1"], .project-card').first();
      await expect(projectCard).toBeVisible();
      await expect(projectCard.locator('[data-testid="project-state"]')).toContainText('ACTIVE');
      
      // Step 3: View Project Details
      await projectCard.click();
      await expect(page.locator('[data-testid="project-detail"], .project-detail')).toBeVisible();
      
      // Verify project information
      await expect(page.locator('[data-testid="project-name"]')).toContainText('Test Project');
      await expect(page.locator('[data-testid="session-count"]')).toContainText('3');
      
      // Step 4: Navigate to Sessions
      await page.click('[data-nav="Sessions"], nav a:has-text("Sessions")');
      await expect(page).toHaveURL('/sessions');
      
      // Verify session list
      await expect(page.locator('[data-testid="sessions-list"], .sessions-list')).toBeVisible();
      const sessionItem = page.locator('[data-testid="session-session-1"], .session-item').first();
      await expect(sessionItem).toBeVisible();
      
      // Step 5: View Session Details
      await sessionItem.click();
      await expect(page.locator('[data-testid="session-viewer"], .session-viewer')).toBeVisible();
      await expect(page.locator('[data-testid="event-count"]')).toContainText('15');
      
      // Step 6: Navigate to Performance Monitoring
      await page.click('[data-nav="Performance"], nav a:has-text("Performance")');
      await expect(page).toHaveURL('/performance');
      
      // Verify performance metrics displayed
      await expect(page.locator('[data-testid="performance-charts"], .performance-charts')).toBeVisible();
      await expect(page.locator('[data-testid="cpu-metric"]')).toContainText('45');
      await expect(page.locator('[data-testid="memory-metric"]')).toContainText('60');
      
      // Step 7: Access Recovery Operations
      await page.click('[data-nav="Recovery"], nav a:has-text("Recovery")');
      await expect(page).toHaveURL('/recovery');
      
      // Verify recovery interface
      await expect(page.locator('[data-testid="recovery-controls"], .recovery-controls')).toBeVisible();
      await expect(page.locator('[data-testid="recovery-status"]')).toContainText('Available');
      
      // Test recovery action (with confirmation)
      const recoveryButton = page.locator('[data-testid="restart-action"], button:has-text("Restart")');
      if (await recoveryButton.isVisible()) {
        await recoveryButton.click();
        
        // Should show confirmation dialog
        await expect(page.locator('[data-testid="confirmation-dialog"], .confirmation-dialog')).toBeVisible();
        
        // Cancel to avoid actual recovery
        await page.click('[data-testid="cancel-button"], button:has-text("Cancel")');
        await expect(page.locator('[data-testid="confirmation-dialog"]')).toBeHidden();
      }
      
      // Step 8: Complete workflow with Settings
      await page.click('[data-nav="Settings"], nav a:has-text("Settings")');
      await expect(page).toHaveURL('/settings');
      
      // Verify settings page
      await expect(page.locator('[data-testid="settings-form"], .settings-form')).toBeVisible();
      
      // Verify user can logout
      await page.click('[data-testid="user-menu"], .user-menu, .user-info');
      await expect(page.locator('[data-testid="logout-button"], a:has-text("Logout")')).toBeVisible();
    });

    test('should handle real-time updates throughout navigation', async ({ page }) => {
      // Enable real-time updates
      await page.goto('/dashboard');
      
      // Listen for WebSocket connection
      const wsPromise = page.waitForEvent('websocket');
      
      // Check if real-time toggle exists and enable it
      const realtimeToggle = page.locator('[data-testid="realtime-toggle"], .realtime-toggle');
      if (await realtimeToggle.isVisible()) {
        await realtimeToggle.check();
      }
      
      // Verify WebSocket connection
      const ws = await wsPromise;
      expect(ws.url()).toMatch(/socket\.io/);
      
      // Navigate between pages and verify real-time indicator persists
      const pages = ['/projects', '/sessions', '/performance'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        
        // Real-time indicator should be visible and connected
        const indicator = page.locator('[data-testid="realtime-indicator"], .realtime-indicator');
        await expect(indicator).toBeVisible();
        
        // Check connection status
        const isConnected = await indicator.evaluate(el => 
          el.classList.contains('connected') || el.textContent?.includes('Connected')
        );
        expect(isConnected).toBeTruthy();
      }
    });

    test('should provide accessible navigation throughout the application', async ({ page }) => {
      // Test keyboard navigation
      await page.goto('/dashboard');
      
      // Focus should start in a logical place
      await page.keyboard.press('Tab');
      const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
      expect(['BUTTON', 'A', 'INPUT']).toContain(firstFocused);
      
      // Test navigation with keyboard
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
        
        // Check focus is visible
        const focusedElement = page.locator(':focus');
        const isVisible = await focusedElement.isVisible();
        expect(isVisible).toBeTruthy();
      }
      
      // Test all main pages for accessibility
      const pages = ['/dashboard', '/projects', '/sessions', '/performance', '/recovery'];
      
      for (const pagePath of pages) {
        await page.goto(pagePath);
        
        // Check for proper heading structure
        const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
        expect(headings.length).toBeGreaterThan(0);
        
        // Check for proper landmarks
        await expect(page.locator('[role="main"], main')).toBeVisible();
        await expect(page.locator('[role="navigation"], nav')).toBeVisible();
        
        // Check for ARIA labels
        const ariaLabels = await page.locator('[aria-label]').count();
        expect(ariaLabels).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle API failures gracefully during navigation', async ({ page }) => {
      // Start with working authentication
      await TestUtils.mockApiResponses(page, {
        'auth/me': { id: 1, name: 'Test User', role: 'admin' }
      });
      
      await page.goto('/dashboard');
      
      // Simulate API failures
      await TestUtils.simulateNetworkFailure(page);
      
      // Navigate to projects page
      await page.click('[data-nav="Projects"], nav a:has-text("Projects")');
      
      // Should show error state but maintain layout
      await expect(page.locator('[data-testid="error-message"], .error-message')).toBeVisible();
      await expect(page.locator('[data-testid="sidebar"], .sidebar')).toBeVisible();
      
      // Should provide retry option
      const retryButton = page.locator('[data-testid="retry-button"], button:has-text("Retry")');
      await expect(retryButton).toBeVisible();
      
      // Restore network and test retry
      await TestUtils.restoreNetwork(page);
      await TestUtils.mockApiResponses(page, {
        'projects': { projects: [] }
      });
      
      await retryButton.click();
      await expect(page.locator('[data-testid="projects-list"], .projects-list')).toBeVisible();
    });

    test('should handle slow network conditions with loading states', async ({ page }) => {
      // Start authenticated
      await TestUtils.mockApiResponses(page, {
        'auth/me': { id: 1, name: 'Test User', role: 'admin' }
      });
      
      await page.goto('/dashboard');
      
      // Simulate slow network
      await TestUtils.simulateSlowNetwork(page, 3000);
      
      // Navigate to performance page
      await page.click('[data-nav="Performance"], nav a:has-text("Performance")');
      
      // Should show loading skeleton or spinner
      const loadingIndicator = page.locator('[data-testid="loading"], .loading, .spinner, .skeleton');
      await expect(loadingIndicator).toBeVisible();
      
      // Eventually load content
      await TestUtils.mockApiResponses(page, {
        'performance/metrics': { cpu: 45, memory: 60 }
      });
      
      await expect(page.locator('[data-testid="performance-charts"]')).toBeVisible({ timeout: 10000 });
      await expect(loadingIndicator).toBeHidden();
    });

    test('should maintain state across browser refresh and tab switches', async ({ page, context }) => {
      // Setup authenticated session
      await TestUtils.mockApiResponses(page, {
        'auth/me': { id: 1, name: 'Test User', role: 'admin' },
        'projects': { projects: [{ id: '1', name: 'Test', state: 'ACTIVE' }] }
      });
      
      await page.goto('/projects');
      
      // Select a project
      await page.click('[data-testid="project-1"], .project-card');
      
      // Refresh page
      await page.reload();
      
      // Should maintain selected state or redirect appropriately
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/projects/);
      
      // Open new tab
      const newPage = await context.newPage();
      await TestUtils.mockApiResponses(newPage, {
        'auth/me': { id: 1, name: 'Test User', role: 'admin' }
      });
      
      await newPage.goto('/dashboard');
      
      // Both tabs should work independently
      await expect(page.locator('[data-testid="projects-list"]')).toBeVisible();
      await expect(newPage.locator('[data-testid="dashboard-title"]')).toBeVisible();
      
      await newPage.close();
    });
  });

  test.describe('Performance and Responsiveness', () => {
    test('should load all main pages within acceptable time limits', async ({ page }) => {
      await TestUtils.mockApiResponses(page, {
        'auth/me': { id: 1, name: 'Test User', role: 'admin' },
        'health': { status: 'healthy' },
        'projects': { projects: [] },
        'performance/metrics': { cpu: 45 },
        'recovery/status': { canRecover: true }
      });
      
      const pages = [
        { path: '/dashboard', name: 'Dashboard' },
        { path: '/projects', name: 'Projects' },
        { path: '/sessions', name: 'Sessions' },
        { path: '/performance', name: 'Performance' },
        { path: '/recovery', name: 'Recovery' }
      ];
      
      for (const pageInfo of pages) {
        await TestAssertions.assertPerformance(page, 2000, `${pageInfo.name} page initial load`);
        
        const startTime = Date.now();
        await page.goto(pageInfo.path);
        await page.waitForLoadState('networkidle');
        const loadTime = Date.now() - startTime;
        
        expect(loadTime).toBeLessThan(2000);
      }
    });

    test('should work correctly on all supported viewport sizes', async ({ page }) => {
      const viewports = [
        { width: 1920, height: 1080, name: 'Desktop Large' },
        { width: 1366, height: 768, name: 'Desktop Standard' },
        { width: 768, height: 1024, name: 'Tablet' },
        { width: 375, height: 667, name: 'Mobile' }
      ];
      
      // Mock basic data
      await TestUtils.mockApiResponses(page, {
        'auth/me': { id: 1, name: 'Test User', role: 'admin' },
        'projects': { projects: [] }
      });
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('/dashboard');
        
        // Navigation should be accessible
        const nav = page.locator('[data-testid="sidebar"], .sidebar, nav');
        await expect(nav).toBeVisible();
        
        // Content should be readable
        const content = page.locator('[data-testid="main-content"], main');
        await expect(content).toBeVisible();
        
        // Test responsive navigation if mobile
        if (viewport.width < 768) {
          const mobileToggle = page.locator('[data-testid="mobile-menu-toggle"]');
          if (await mobileToggle.isVisible()) {
            await mobileToggle.click();
            await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
          }
        }
      }
    });
  });
});