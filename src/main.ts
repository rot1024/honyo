import { app } from 'electron';
import { initializeConfig } from './config/index.ts';
import { createTray, setupSettingsIPC } from './ui/index.ts';
import { setupKeyboardHandler, startKeyboardListener } from './keyboard/index.ts';
import {
  setupSingleInstance,
  setupPlatformSpecific,
  setupShutdownHandlers,
  checkAccessibilityPermission,
} from './app/index.ts';
import { setupPopupIPC } from './ui/popup.ts';
import { setupAutoUpdater } from './app/updater.ts';

// Initialize the app
function initialize(): void {
  // Check for single instance
  if (!setupSingleInstance()) {
    app.quit();
    return;
  }

  // Platform specific setup
  setupPlatformSpecific();

  // Setup shutdown handlers
  setupShutdownHandlers();

  // When app is ready
  void app.whenReady().then(async () => {
    console.log('App ready, starting key listener...');
    console.log('API Key present:', !!process.env.ANTHROPIC_API_KEY);

    // Check accessibility permission on macOS
    const hasPermission = await checkAccessibilityPermission();
    if (!hasPermission) {
      return; // App will quit
    }

    // Initialize configuration
    initializeConfig();

    // Setup auto-updater
    setupAutoUpdater();

    // Create tray icon
    createTray();

    // Setup IPC for settings window
    setupSettingsIPC();

    // Setup IPC for popup window
    setupPopupIPC();

    // Setup keyboard handler
    setupKeyboardHandler();

    // Start listening for keyboard events
    try {
      startKeyboardListener();
    } catch (error) {
      console.error('Failed to start keyboard listener:', error);
      app.quit();
    }
  });
}

// Start the application
initialize();
