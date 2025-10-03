import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { dialog, BrowserWindow, shell } from 'electron';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getConfig, updateConfig, clearSkippedUpdateVersion } from '../config/index.ts';
import TurndownService from 'turndown';

let isCheckingForUpdate = false;
let menuUpdateCallback: (() => void) | null = null;
let isDownloading = false;
let isManualCheck = false;
let downloadProgress = 0;

// Get __dirname in both ESM and CommonJS
const getCurrentDir = (): string => {
  if (typeof import.meta.url !== 'undefined') {
    return dirname(fileURLToPath(import.meta.url));
  } else {
    return __dirname;
  }
};

// Get GitHub repository URL from package.json
function getGitHubReleasesUrl(): string {
  try {
    const packagePath = join(getCurrentDir(), '../../package.json');
    const packageContent = readFileSync(packagePath, 'utf-8');
    const packageJson = JSON.parse(packageContent) as {
      repository?: string;
      buildConfig?: {
        publish?: {
          provider?: string;
          owner?: string;
          repo?: string;
        };
      };
    };

    // Try to get from buildConfig.publish first
    const publish = packageJson.buildConfig?.publish;
    if (publish?.provider === 'github' && publish.owner && publish.repo) {
      return `https://github.com/${publish.owner}/${publish.repo}/releases/latest`;
    }

    // Fallback to repository field
    if (packageJson.repository) {
      const repoUrl = packageJson.repository.replace(/\.git$/, '');
      return `${repoUrl}/releases/latest`;
    }
  } catch (error) {
    console.error('Failed to read repository URL from package.json:', error);
  }

  return '';
}

const GITHUB_RELEASES_URL = getGitHubReleasesUrl();

// Convert HTML to plain text using Turndown
function convertHtmlToMarkdown(html: string): string {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });
  return turndownService.turndown(html);
}

export function setMenuUpdateCallback(callback: () => void): void {
  menuUpdateCallback = callback;
}

export function isCheckingUpdate(): boolean {
  return isCheckingForUpdate;
}

export function getDownloadProgress(): number {
  return downloadProgress;
}

export function isDownloadingUpdate(): boolean {
  return isDownloading;
}

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

  console.log('Auto-updater configuration:');
  console.log(
    '- Current version:',
    (autoUpdater.currentVersion as { version?: string } | null)?.version || 'unknown',
  );
  console.log('- Platform:', process.platform);
  console.log('- Allow downgrade:', autoUpdater.allowDowngrade);

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
    isCheckingForUpdate = true;
    menuUpdateCallback?.();
  });

  autoUpdater.on('update-available', info => {
    console.log('Update available:', info);
    isCheckingForUpdate = false;
    menuUpdateCallback?.();

    // Check if this version was previously skipped
    const config = getConfig();
    if (!isManualCheck && config.skippedUpdateVersion === info.version) {
      console.log(`Update ${info.version} was previously skipped, not showing dialog`);
      return;
    }

    // Format release notes
    let releaseNotes = 'New version available with improvements and bug fixes.';
    if (info.releaseNotes) {
      if (typeof info.releaseNotes === 'string') {
        releaseNotes = convertHtmlToMarkdown(info.releaseNotes);
      } else if (Array.isArray(info.releaseNotes)) {
        // electron-updater returns array of release notes objects
        releaseNotes = info.releaseNotes
          .map(note => {
            const version = note.version ? `Version ${note.version}:\n` : '';
            const noteText = note.note ? convertHtmlToMarkdown(note.note) : '';
            return version + noteText;
          })
          .join('\n\n');
      }
    }

    // For macOS, use direct GitHub download for unsigned builds
    if (process.platform === 'darwin') {
      void dialog
        .showMessageBox({
          type: 'info',
          title: 'Update Available',
          message: `A new version ${info.version} is available.`,
          detail: releaseNotes,
          buttons: ['Open GitHub Releases', 'Later', 'Skip This Version'],
          defaultId: 0,
          cancelId: 1,
        })
        .then(result => {
          if (result.response === 0) {
            // Open GitHub Releases button
            console.log('User clicked Open GitHub Releases, opening browser...');
            clearSkippedUpdateVersion();
            if (GITHUB_RELEASES_URL) {
              void shell.openExternal(GITHUB_RELEASES_URL);
            }
          } else if (result.response === 1) {
            // Later button - do nothing, will check again next time
            console.log('User chose to be reminded later');
          } else if (result.response === 2) {
            // Skip This Version button - save the version to skip it
            console.log(`User skipped update ${info.version}`);
            updateConfig({ skippedUpdateVersion: info.version });
          }
        });
    } else {
      // For other platforms, use auto-updater as usual
      void dialog
        .showMessageBox({
          type: 'info',
          title: 'Update Available',
          message: `A new version ${info.version} is available.`,
          detail: releaseNotes,
          buttons: ['Download', 'Later', 'Skip This Version'],
          defaultId: 0,
          cancelId: 1,
        })
        .then(result => {
          if (result.response === 0) {
            // Download button
            console.log('User clicked Download, starting download...');
            // Clear skipped version when user chooses to download
            clearSkippedUpdateVersion();
            isDownloading = true;
            menuUpdateCallback?.();
            autoUpdater
              .downloadUpdate()
              .then(() => {
                console.log('Download started successfully');
              })
              .catch(async (error: unknown) => {
                console.error('Failed to start download:', error);
                isDownloading = false;
                menuUpdateCallback?.();

                // Open GitHub Releases instead of showing error dialog
                if (GITHUB_RELEASES_URL) {
                  const res = await dialog.showMessageBox({
                    type: 'error',
                    title: 'Download Failed',
                    message: 'Failed to download the update automatically.',
                    detail: 'Would you like to download it manually from GitHub?',
                    buttons: ['Open GitHub Releases', 'Cancel'],
                    defaultId: 0,
                  });
                  if (res.response === 0) {
                    void shell.openExternal(GITHUB_RELEASES_URL);
                  }
                } else {
                  await dialog.showMessageBox({
                    type: 'error',
                    title: 'Download Failed',
                    message: 'Failed to download the update automatically.',
                    detail: 'Please check your network connection and try again later.',
                    buttons: ['OK'],
                  });
                }
              });
          } else if (result.response === 1) {
            // Later button - do nothing, will check again next time
            console.log('User chose to be reminded later');
          } else if (result.response === 2) {
            // Skip This Version button - save the version to skip it
            console.log(`User skipped update ${info.version}`);
            updateConfig({ skippedUpdateVersion: info.version });
          }
        });
    }
  });

  autoUpdater.on('update-not-available', info => {
    console.log('Update not available. Current version:', info?.version || 'unknown');
    isCheckingForUpdate = false;
    menuUpdateCallback?.();

    // Show dialog only for manual checks
    if (isManualCheck) {
      isManualCheck = false;
      void dialog.showMessageBox({
        type: 'info',
        title: 'No Updates Available',
        message: 'You are already running the latest version.',
        buttons: ['OK'],
      });
    }
  });

  autoUpdater.on('error', err => {
    console.error('Error in auto-updater:', err);
    isCheckingForUpdate = false;

    // If error occurred during download, offer to open GitHub Releases
    if (isDownloading) {
      isDownloading = false;

      void dialog
        .showMessageBox({
          type: 'error',
          title: 'Update Error',
          message: 'An error occurred while downloading the update.',
          detail: 'Would you like to download it manually from GitHub?',
          buttons: ['Open GitHub Releases', 'Cancel'],
          defaultId: 0,
        })
        .then(result => {
          if (result.response === 0) {
            void shell.openExternal(GITHUB_RELEASES_URL);
          }
        });
    } else if (isManualCheck) {
      // Show error dialog for manual checks
      isManualCheck = false;

      void dialog
        .showMessageBox({
          type: 'error',
          title: 'Update Check Failed',
          message: 'Failed to check for updates.',
          detail:
            'This may be due to network issues or other connectivity problems. You can check for updates manually on GitHub.',
          buttons: ['Open GitHub Releases', 'Cancel'],
          defaultId: 0,
        })
        .then(result => {
          if (result.response === 0) {
            void shell.openExternal(GITHUB_RELEASES_URL);
          }
        });
    }
    // Only log to console for automatic update check errors
    // Common causes: network issues, unsigned builds on macOS, etc.
    menuUpdateCallback?.();
  });

  autoUpdater.on('download-progress', progressObj => {
    const logMessage = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
    console.log(logMessage);

    downloadProgress = Math.round(progressObj.percent);
    menuUpdateCallback?.();

    // Optionally show progress in UI
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      window.setProgressBar(progressObj.percent / 100);
    });
  });

  autoUpdater.on('update-downloaded', info => {
    console.log('Update downloaded:', info);
    isDownloading = false;
    downloadProgress = 0;
    menuUpdateCallback?.();

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
            ? convertHtmlToMarkdown(info.releaseNotes)
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
  isManualCheck = true;
  void autoUpdater.checkForUpdates();
}
