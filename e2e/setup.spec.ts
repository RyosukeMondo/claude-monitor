import { test, expect } from '@playwright/test';

/**
 * Basic setup and configuration tests for Playwright E2E testing
 * Validates that the testing environment and application are properly configured
 */
test.describe('E2E Test Setup', () => {
  test('should load the application successfully', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Verify page loads without errors
    await page.waitForLoadState('networkidle');
    
    // Check that we get a valid response (not 404 or error)
    const response = await page.request.get('/');
    expect(response.status()).toBeLessThan(400);
  });

  test('should have proper meta tags and document structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic HTML structure
    await expect(page.locator('html')).toBeVisible();
    await expect(page.locator('head')).toBeAttached();
    await expect(page.locator('body')).toBeVisible();
    
    // Check for viewport meta tag (responsive design)
    const viewportMeta = page.locator('meta[name="viewport"]');
    await expect(viewportMeta).toBeAttached();
  });

  test('should handle different viewport sizes', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 1024, height: 768, name: 'Desktop Small' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      
      // Verify page loads properly on each viewport
      await page.waitForLoadState('networkidle');
      
      // Check that body is visible (basic responsiveness check)
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should not have console errors on page load', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Allow for some common non-critical errors but fail on serious ones
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon.ico') && // Favicon errors are not critical
      !error.includes('WebSocket') && // WebSocket errors may occur in test env
      !error.includes('Service Worker') // SW errors may occur in test env
    );

    expect(criticalErrors).toEqual([]);
  });

  test('should have proper accessibility foundation', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic accessibility structure
    const hasSkipLinks = await page.locator('a[href^="#"]:has-text("Skip")').count() > 0;
    const hasMainLandmark = await page.locator('main, [role="main"]').count() > 0;
    const hasHeadings = await page.locator('h1, h2, h3, h4, h5, h6').count() > 0;
    
    // At least one of these accessibility features should be present
    expect(hasSkipLinks || hasMainLandmark || hasHeadings).toBeTruthy();
  });
});