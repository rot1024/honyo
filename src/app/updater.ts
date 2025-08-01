import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { dialog, BrowserWindow } from 'electron';

export function setupAutoUpdater(): void {
  // Configure auto-updater
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;
  
  // Enable detailed logging
  autoUpdater.logger = console;
  
  // For macOS unsigned builds, allow downgrade (for testing)
  if (process.platform === 'darwin') {
    autoUpdater.allowDowngrade = true;
  }

  // Check for updates on startup and every hour
  void autoUpdater.checkForUpdates();
  setInterval(
    () => {
      void autoUpdater.checkForUpdates();
    },
    60 * 60 * 1000,
  ); // 1 hour

  // Event handlers
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
  });

  autoUpdater.on('update-available', info => {
    console.log('Update available:', info);

    void dialog
      .showMessageBox({
        type: 'info',
        title: 'Update Available',
        message: `A new version ${info.version} is available. Would you like to download it?`,
        detail:
          typeof info.releaseNotes === 'string'
            ? info.releaseNotes
            : 'New version available with improvements and bug fixes.',
        buttons: ['Download', 'Later'],
        defaultId: 0,
      })
      .then(result => {
        if (result.response === 0) {
          console.log('User clicked Download, starting download...');
          autoUpdater.downloadUpdate()
            .then(() => {
              console.log('Download started successfully');
            })
            .catch(error => {
              console.error('Failed to start download:', error);
              void dialog.showErrorBox(
                'Download Error',
                `Failed to download update: ${error.message || error}`,
              );
            });
        }
      });
  });

  autoUpdater.on('update-not-available', () => {
    console.log('Update not available');
  });

  autoUpdater.on('error', err => {
    console.error('Error in auto-updater:', err);
    // Show error to user for debugging
    void dialog.showErrorBox(
      'Auto-updater Error',
      `An error occurred while checking for updates:\n\n${err.message || err}\n\nThis might be due to unsigned builds on macOS.`,
    );
  });

  autoUpdater.on('download-progress', progressObj => {
    const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
    console.log(logMessage);

    // Optionally show progress in UI
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      window.setProgressBar(progressObj.percent / 100);
    });
  });

  autoUpdater.on('update-downloaded', info => {
    console.log('Update downloaded:', info);

    // Reset progress bar
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      window.setProgressBar(-1);
    });

    void dialog
      .showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded. The application will restart to apply the update.',
        detail:
          typeof info.releaseNotes === 'string'
            ? info.releaseNotes
            : 'The update will be installed when you restart the application.',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
      })
      .then(result => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });
}

// Manual check for updates (can be called from menu)
export function checkForUpdates(): void {
  void autoUpdater.checkForUpdates();
}
