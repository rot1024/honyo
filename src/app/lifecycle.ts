import { app, Notification } from 'electron';
import { stopKeyboardListener } from '../keyboard/index.ts';
import { destroyTray, getTray } from '../ui/tray.ts';

// Prevent multiple instances
export function setupSingleInstance(): boolean {
  const gotTheLock = app.requestSingleInstanceLock();

  if (!gotTheLock) {
    console.log('Another instance is already running. Exiting...');
    return false;
  }

  // Handle second instance attempt
  app.on('second-instance', () => {
    console.log('Another instance tried to run');
    // Focus existing instance
    if (getTray()) {
      new Notification({
        title: 'Honyo Translator',
        body: 'Already running in the system tray',
      }).show();
    }
  });

  return true;
}

// Hide dock icon on macOS
export function setupPlatformSpecific(): void {
  if (process.platform === 'darwin' && app.dock) {
    app.dock.hide();
  }
}

// Cleanup function
export function cleanupAndExit(): void {
  stopKeyboardListener();
  destroyTray();

  // Wait a bit then force exit
  setTimeout(() => {
    app.exit(0);
  }, 100);
}

// Setup shutdown handlers
export function setupShutdownHandlers(): void {
  // Electron app shutdown handling
  app.on('window-all-closed', () => {
    // Don't quit the app when all windows are closed
    // The app should keep running in the system tray
  });

  // Cleanup before app quit
  app.on('before-quit', () => {
    console.log('App is about to quit, cleaning up...');
    stopKeyboardListener();
  });

  // Process termination handling
  process.on('SIGINT', () => {
    console.log('Received SIGINT, cleaning up...');
    cleanupAndExit();
  });

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, cleaning up...');
    cleanupAndExit();
  });

  process.on('uncaughtException', error => {
    console.error('Uncaught exception:', error);
    cleanupAndExit();
  });
}
