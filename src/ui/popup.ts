import { BrowserWindow, screen, ipcMain, clipboard } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let popupWindow: BrowserWindow | null = null;

export function showTranslationPopup(translation: string | null, originalText: string): void {
  // Get cursor position with DPI scaling consideration
  const cursorPoint = screen.getCursorScreenPoint();

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
  void popupWindow.loadFile(join(__dirname, '../../popup.html'));

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

  // Remove blur event handler to prevent closing on click outside
  // Users should use the close button or copy button to close the window

  popupWindow.on('closed', () => {
    popupWindow = null;
  });
}

export function setupPopupIPC(): void {
  ipcMain.on('copy-translation', (event, text: string) => {
    clipboard.writeText(text);
    if (popupWindow && !popupWindow.isDestroyed()) {
      popupWindow.close();
    }
  });

  ipcMain.on('close-popup', () => {
    if (popupWindow && !popupWindow.isDestroyed()) {
      popupWindow.close();
    }
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
