import { BrowserWindow, ipcMain } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  getApiKeys,
  updateApiKeys,
  getConfig,
  updateConfig,
  type ApiKeys,
  type CustomModel,
} from '../config/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let settingsWindow: BrowserWindow | null = null;

export function openSettingsWindow(): void {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    resizable: true,
    minimizable: true,
    maximizable: true,
    title: 'Settings',
  });

  const htmlPath = join(__dirname, '../../settings.html');
  void settingsWindow.loadFile(htmlPath);

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

  ipcMain.on('load-custom-prompt', event => {
    const config = getConfig();
    event.reply('custom-prompt-loaded', config.customPrompt);
  });

  ipcMain.on('save-custom-prompt', (event, customPrompt: string) => {
    updateConfig({ customPrompt });
    event.reply('custom-prompt-saved', true);
  });

  ipcMain.on('load-custom-model', event => {
    const config = getConfig();
    event.reply('custom-model-loaded', config.customModel);
  });

  ipcMain.on('save-custom-model', (event, customModel: CustomModel) => {
    updateConfig({ customModel });
    event.reply('custom-model-saved', true);
  });

  ipcMain.on('load-custom-languages', event => {
    const config = getConfig();
    event.reply('custom-languages-loaded', config.customLanguages || []);
  });

  ipcMain.on('save-custom-languages', (event, customLanguages: string[]) => {
    updateConfig({ customLanguages });
    event.reply('custom-languages-saved', true);
  });
}
