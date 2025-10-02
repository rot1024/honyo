import type { Tray } from 'electron';
import { Menu, app } from 'electron';
import { uIOhook } from 'uiohook-napi';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { languages } from '../language/index.ts';
import { AI_MODELS, CUSTOM_MODEL_ID } from '../models.ts';
import { getConfig, updateConfig, getPausedState, setPausedState } from '../config/index.ts';
import { openSettingsWindow } from './settings.ts';
import { checkForUpdates, isCheckingUpdate } from '../app/updater.ts';
import { cancelCurrentTranslation, isCurrentlyTranslating } from '../keyboard/handler.ts';
import { closePopup } from './popup.ts';

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

// Get version from package.json
let appVersion = '';
try {
  const packageContent = readFileSync(join(currentDir, '../../package.json'), 'utf-8');
  const packageJson = JSON.parse(packageContent) as { version?: string };
  appVersion = packageJson.version ?? '';
} catch (error) {
  console.error('Failed to read package.json version:', error);
}

export function createTrayMenu(tray: Tray | null, updateTrayTitle: (title: string) => void): Menu {
  const config = getConfig();
  const isPaused = getPausedState();

  // Combine default languages with custom languages
  const allLanguages = [...languages];
  if (config.customLanguages && config.customLanguages.length > 0) {
    allLanguages.push(...config.customLanguages);
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `Honyo Translator ${appVersion ? `v${appVersion}` : ''}`,
      type: 'normal',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: `Primary: ${config.targetLanguage}`,
      submenu: allLanguages.map(lang => ({
        label: lang,
        type: 'radio',
        checked: config.targetLanguage === lang,
        click: (): void => {
          if (config.secondaryLanguage === lang) {
            // Swap languages if same language selected
            updateConfig({
              targetLanguage: lang,
              secondaryLanguage: config.targetLanguage,
            });
          } else {
            updateConfig({ targetLanguage: lang });
          }
          tray?.setContextMenu(createTrayMenu(tray, updateTrayTitle));
        },
      })),
    },
    {
      label: `Secondary: ${config.secondaryLanguage}`,
      submenu: allLanguages.map(lang => ({
        label: lang,
        type: 'radio',
        checked: config.secondaryLanguage === lang,
        click: (): void => {
          if (config.targetLanguage === lang) {
            // Swap languages if same language selected
            updateConfig({
              targetLanguage: config.secondaryLanguage,
              secondaryLanguage: lang,
            });
          } else {
            updateConfig({ secondaryLanguage: lang });
          }
          tray?.setContextMenu(createTrayMenu(tray, updateTrayTitle));
        },
      })),
    },
    { type: 'separator' },
    {
      label: 'Display Mode',
      submenu: [
        {
          label: 'Notification && Copy',
          type: 'radio',
          checked: config.displayMode === 'notification',
          click: (): void => {
            updateConfig({ displayMode: 'notification' });
            tray?.setContextMenu(createTrayMenu(tray, updateTrayTitle));
          },
        },
        {
          label: 'Popup Window',
          type: 'radio',
          checked: config.displayMode === 'popup',
          click: (): void => {
            updateConfig({ displayMode: 'popup' });
            tray?.setContextMenu(createTrayMenu(tray, updateTrayTitle));
          },
        },
      ],
    },
    {
      label: `AI Model: ${
        config.aiModel === CUSTOM_MODEL_ID
          ? 'Custom Model'
          : (AI_MODELS[config.aiModel]?.name ?? 'Unknown')
      }`,
      submenu: [
        ...Object.entries(AI_MODELS).map(([modelId, modelInfo]) => ({
          label: modelInfo.name,
          type: 'radio' as const,
          checked: config.aiModel === modelId,
          click: (): void => {
            updateConfig({ aiModel: modelId });
            tray?.setContextMenu(createTrayMenu(tray, updateTrayTitle));
          },
        })),
        { type: 'separator' as const },
        {
          label: 'Custom Model',
          type: 'radio' as const,
          checked: config.aiModel === CUSTOM_MODEL_ID,
          click: (): void => {
            updateConfig({ aiModel: CUSTOM_MODEL_ID });
            tray?.setContextMenu(createTrayMenu(tray, updateTrayTitle));
          },
        },
      ],
    },
    {
      label: 'Settings...',
      click: (): void => {
        openSettingsWindow();
      },
    },
    { type: 'separator' },
    {
      label: 'Pause Translation',
      type: 'checkbox',
      checked: isPaused,
      click: (): void => {
        setPausedState(!isPaused);
        console.log(`Translation ${getPausedState() ? 'paused' : 'resumed'}`);
        tray?.setContextMenu(createTrayMenu(tray, updateTrayTitle));
      },
    },
    {
      label: 'Stop Current Translation',
      enabled: isCurrentlyTranslating(),
      click: (): void => {
        cancelCurrentTranslation();
        closePopup();
        tray?.setContextMenu(createTrayMenu(tray, updateTrayTitle));
      },
    },
    { type: 'separator' },
    {
      label: isCheckingUpdate() ? 'Checking for Updates...' : 'Check for Updates...',
      enabled: !isCheckingUpdate(),
      click: (): void => {
        checkForUpdates();
      },
    },
    {
      label: 'Quit',
      click: (): void => {
        console.log('Quit menu clicked');
        // Stop uIOhook
        try {
          uIOhook.stop();
        } catch (error) {
          console.error('Error stopping uIOhook:', error);
        }

        // Destroy tray icon
        if (tray) {
          tray.destroy();
        }

        // Force quit app
        app.exit(0);
      },
    },
  ]);

  return contextMenu;
}
