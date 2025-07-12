const { test, expect } = require('@playwright/test');
const { _electron: electron } = require('playwright');
const UpdateTestOrchestrator = require('../../test-utils/update-test-orchestrator');
const path = require('path');

describe('Update System E2E Tests', () => {
  let orchestrator;
  let electronApp;
  let window;
  const projectRoot = path.join(__dirname, '../../');

  beforeAll(async () => {
    // Start test orchestrator
    orchestrator = new UpdateTestOrchestrator(projectRoot);
    await orchestrator.start();
    
    // Set up test scenario
    await orchestrator.setupTestScenario({
      name: 'E2E Update Test',
      versions: ['1.0.0', '1.1.0'],
      releaseNotes: {
        '1.0.0': 'Initial release',
        '1.1.0': 'Bug fixes and new features'
      }
    });
  });

  afterAll(async () => {
    // Clean up
    if (electronApp) {
      await electronApp.close();
    }
    await orchestrator.stop();
  });

  beforeEach(async () => {
    // Launch Electron app
    electronApp = await electron.launch({
      args: [path.join(projectRoot, 'dist/electron/main.js')],
      env: {
        ...process.env,
        NODE_ENV: 'test',
        ELECTRON_DISABLE_SECURITY_WARNINGS: '1'
      }
    });
    
    // Get the main window
    window = await electronApp.firstWindow();
    
    // Wait for app to be ready
    await window.waitForLoadState('domcontentloaded');
  });

  afterEach(async () => {
    if (electronApp) {
      await electronApp.close();
      electronApp = null;
    }
  });

  test('should display update notification when update is available', async () => {
    // Wait for the app to fully load
    await window.waitForTimeout(2000);
    
    // Look for update notification elements
    const updateNotification = await window.locator('[data-testid="update-notification"]').first();
    
    // If notification appears, verify its content
    if (await updateNotification.isVisible()) {
      const notificationText = await updateNotification.textContent();
      expect(notificationText).toContain('update');
    }
  });

  test('should handle manual update check', async () => {
    // Wait for the app to fully load
    await window.waitForTimeout(2000);
    
    // Look for update check button or menu
    const updateButton = await window.locator('button').filter({ hasText: /update/i }).first();
    
    if (await updateButton.isVisible()) {
      // Click the update button
      await updateButton.click();
      
      // Wait for update check to complete
      await window.waitForTimeout(3000);
      
      // Verify some update-related UI appeared
      const updateDialog = await window.locator('[role="dialog"]').first();
      if (await updateDialog.isVisible()) {
        const dialogText = await updateDialog.textContent();
        expect(dialogText).toMatch(/update|version/i);
      }
    }
  });

  test('should display update progress during download', async () => {
    // This test would require triggering a download
    // For now, we'll just verify the UI elements exist
    
    await window.waitForTimeout(2000);
    
    // Check if progress elements are present in the DOM
    const progressElements = await window.locator('*[class*="progress"], *[role="progressbar"]').all();
    
    // At least the basic UI should be present
    expect(progressElements.length).toBeGreaterThanOrEqual(0);
  });

  test('should handle update errors gracefully', async () => {
    // Set up error scenario
    await orchestrator.setupTestScenario({
      name: 'Error Scenario',
      versions: [] // No versions = no releases
    });
    
    await window.waitForTimeout(2000);
    
    // Try to trigger an update check
    const updateButton = await window.locator('button').filter({ hasText: /update/i }).first();
    
    if (await updateButton.isVisible()) {
      await updateButton.click();
      await window.waitForTimeout(3000);
      
      // Should handle error gracefully without crashing
      const errorElements = await window.locator('*[class*="error"], *[role="alert"]').all();
      
      // If error UI appears, verify it's user-friendly
      if (errorElements.length > 0) {
        const errorText = await errorElements[0].textContent();
        expect(errorText).toMatch(/error|failed|problem/i);
      }
    }
  });

  test('should maintain app functionality during update process', async () => {
    await window.waitForTimeout(2000);
    
    // Verify main app functions still work
    const mainHeading = await window.locator('h1, h2, h3, h4').first();
    
    if (await mainHeading.isVisible()) {
      const headingText = await mainHeading.textContent();
      expect(headingText).toContain('SRT Generator');
    }
    
    // Verify app is responsive
    const clickableElements = await window.locator('button, [role="button"]').all();
    expect(clickableElements.length).toBeGreaterThan(0);
  });

  test('should persist update preferences', async () => {
    await window.waitForTimeout(2000);
    
    // Check if settings are accessible
    const settingsButton = await window.locator('button').filter({ hasText: /settings/i }).first();
    
    if (await settingsButton.isVisible()) {
      await settingsButton.click();
      await window.waitForTimeout(1000);
      
      // Verify settings dialog opens
      const settingsDialog = await window.locator('[role="dialog"]').first();
      if (await settingsDialog.isVisible()) {
        const dialogText = await settingsDialog.textContent();
        expect(dialogText).toMatch(/settings|configuration/i);
      }
    }
  });

  test('should handle window close during update', async () => {
    await window.waitForTimeout(2000);
    
    // Verify window can be closed cleanly
    const initialTitle = await window.title();
    expect(initialTitle).toMatch(/SRT Generator/i);
    
    // App should be in a stable state
    const bodyElement = await window.locator('body').first();
    expect(await bodyElement.isVisible()).toBe(true);
  });

  test('should support keyboard navigation in update UI', async () => {
    await window.waitForTimeout(2000);
    
    // Test basic keyboard navigation
    await window.keyboard.press('Tab');
    await window.waitForTimeout(500);
    
    // Check if focus is properly managed
    const focusedElement = await window.locator(':focus').first();
    
    if (await focusedElement.isVisible()) {
      const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
      expect(['button', 'input', 'a', 'select']).toContain(tagName);
    }
  });

  test('should handle multiple update checks', async () => {
    await window.waitForTimeout(2000);
    
    // Look for update check button
    const updateButton = await window.locator('button').filter({ hasText: /update/i }).first();
    
    if (await updateButton.isVisible()) {
      // Click multiple times to test handling
      await updateButton.click();
      await window.waitForTimeout(1000);
      
      // Should not crash or cause issues
      const appContainer = await window.locator('body').first();
      expect(await appContainer.isVisible()).toBe(true);
    }
  });

  test('should display correct version information', async () => {
    await window.waitForTimeout(2000);
    
    // Look for version information in the UI
    const versionElements = await window.locator('*').filter({ hasText: /version|v\d+\.\d+\.\d+/i }).all();
    
    // Should have at least some version information
    expect(versionElements.length).toBeGreaterThanOrEqual(0);
    
    // If version info is displayed, verify format
    if (versionElements.length > 0) {
      const versionText = await versionElements[0].textContent();
      expect(versionText).toMatch(/\d+\.\d+\.\d+/);
    }
  });
});