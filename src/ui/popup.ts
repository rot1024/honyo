import { BrowserWindow, screen, ipcMain, clipboard, Menu } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { cancelCurrentTranslation } from '../keyboard/handler.ts';
import { getConfig } from '../config/index.ts';

// Get __dirname in both ESM and CommonJS
const getCurrentDir = (): string => {
  if (typeof import.meta.url !== 'undefined') {
    // ESM
    return dirname(fileURLToPath(import.meta.url));
  } else {
    // CommonJS
    return __dirname;
  }
};

const currentDir = getCurrentDir();

let popupWindow: BrowserWindow | null = null;
let previousActiveApp: string | null = null;

// Function to get the currently active application
function capturePreviousApp(): void {
  if (process.platform === 'darwin') {
    exec(
      'osascript -e \'tell application "System Events" to get name of first application process whose frontmost is true\'',
      (error, stdout) => {
        if (!error && stdout) {
          previousActiveApp = stdout.trim();
          console.log('Captured previous app:', previousActiveApp);
        }
      },
    );
  }
}

// Function to restore focus to the previous application
function restorePreviousApp(): void {
  if (process.platform === 'darwin' && previousActiveApp && previousActiveApp !== 'Electron') {
    exec(`osascript -e 'tell application "${previousActiveApp}" to activate'`, error => {
      if (error) {
        console.error('Failed to restore previous app:', error);
      } else {
        console.log('Restored focus to:', previousActiveApp);
      }
    });
    previousActiveApp = null;
  }
}

export function showTranslationPopup(translation: string | null, originalText: string): void {
  // Get cursor position with DPI scaling consideration
  const cursorPoint = screen.getCursorScreenPoint();

  // Capture the previously active app before showing the popup
  if (!popupWindow || popupWindow.isDestroyed()) {
    capturePreviousApp();
  }

  // If popup exists, update content without repositioning
  if (popupWindow && !popupWindow.isDestroyed()) {
    // Update content
    if (translation === null) {
      popupWindow.webContents.send('translation-loading');
    } else {
      popupWindow.webContents.send('translation-data', {
        translation,
        originalText,
      });
    }

    // Focus the window
    popupWindow.focus();
    return;
  }

  // Create popup window
  popupWindow = new BrowserWindow({
    width: 400,
    height: 200,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    skipTaskbar: true,
    hasShadow: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Ensure window stays on top
  popupWindow.setAlwaysOnTop(true, 'floating');

  // Position the window
  repositionPopup(cursorPoint);

  // Load popup HTML
  const htmlPath = join(currentDir, '../../popup.html');
  void popupWindow.loadFile(htmlPath);

  // Send initial state once loaded
  popupWindow.webContents.once('did-finish-load', () => {
    if (translation === null) {
      popupWindow?.webContents.send('translation-loading');
    } else {
      popupWindow?.webContents.send('translation-data', {
        translation,
        originalText,
      });
    }
  });

  // Add blur event handler based on user preference
  const config = getConfig();
  if (config.autoCloseOnBlur) {
    popupWindow.on('blur', () => {
      if (popupWindow && !popupWindow.isDestroyed()) {
        popupWindow.close();
      }
    });
  }

  popupWindow.on('closed', () => {
    // Restore focus to the previous application when popup closes
    restorePreviousApp();
    popupWindow = null;
  });
}

export function updatePopupTranslation(text: string): void {
  if (popupWindow && !popupWindow.isDestroyed()) {
    popupWindow.webContents.send('translation-chunk', text);
  }
}

export function finalizePopupTranslation(text: string): void {
  if (popupWindow && !popupWindow.isDestroyed()) {
    popupWindow.webContents.send('translation-complete', text);
  }
}

export function setupPopupIPC(): void {
  ipcMain.on('copy-translation', (event, text: string) => {
    clipboard.writeText(text);
    if (popupWindow && !popupWindow.isDestroyed()) {
      popupWindow.close();
    }
  });

  ipcMain.on('close-popup', () => {
    // Cancel any ongoing translation when closing popup
    cancelCurrentTranslation();
    if (popupWindow && !popupWindow.isDestroyed()) {
      popupWindow.close();
    }
  });

  ipcMain.on('show-context-menu', (event, data: { selectedText: string; hasSelection: boolean }) => {
    if (!popupWindow || popupWindow.isDestroyed()) return;

    const template = [];

    if (data.hasSelection) {
      template.push(
        {
          label: 'Copy',
          click: () => {
            clipboard.writeText(data.selectedText);
          },
        },
        { type: 'separator' as const },
      );
    }

    template.push({
      label: 'Copy All',
      click: () => {
        popupWindow?.webContents.send('copy-all-requested');
      },
    });

    const menu = Menu.buildFromTemplate(template);
    menu.popup({ window: popupWindow });
  });
}

export function closePopup(): void {
  if (popupWindow && !popupWindow.isDestroyed()) {
    popupWindow.close();
  }
}

function repositionPopup(cursorPoint: { x: number; y: number }): void {
  if (!popupWindow || popupWindow.isDestroyed()) return;

  const windowBounds = {
    width: 400,
    height: 200,
  };

  // Get all displays to handle multi-monitor setups
  const currentDisplay = screen.getDisplayNearestPoint(cursorPoint);
  const displayBounds = currentDisplay.bounds;

  // Calculate position (center window on cursor)
  let x = cursorPoint.x - windowBounds.width / 2;
  let y = cursorPoint.y - windowBounds.height / 2;

  // Ensure popup doesn't go off-screen
  if (x + windowBounds.width > displayBounds.x + displayBounds.width) {
    x = displayBounds.x + displayBounds.width - windowBounds.width - 10;
  }
  if (y + windowBounds.height > displayBounds.y + displayBounds.height) {
    y = displayBounds.y + displayBounds.height - windowBounds.height - 10;
  }
  if (x < displayBounds.x) {
    x = displayBounds.x + 10;
  }
  if (y < displayBounds.y) {
    y = displayBounds.y + 10;
  }

  popupWindow.setPosition(Math.round(x), Math.round(y));
}
