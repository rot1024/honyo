import { BrowserWindow, ipcMain } from 'electron';
import { getApiKeys, updateApiKeys, type ApiKeys } from '../config/index.ts';

let settingsWindow: BrowserWindow | null = null;

export function openSettingsWindow(): void {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 600,
    height: 500,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    resizable: false,
    minimizable: false,
    maximizable: false,
    title: 'API Key Settings',
  });

  void settingsWindow.loadFile('settings.html');

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

export function setupSettingsIPC(): void {
  ipcMain.on('load-api-keys', event => {
    event.reply('api-keys-loaded', getApiKeys());
  });

  ipcMain.on('save-api-keys', (event, keys: Partial<ApiKeys>) => {
    updateApiKeys(keys);
    event.reply('api-keys-saved', true);
  });
}
