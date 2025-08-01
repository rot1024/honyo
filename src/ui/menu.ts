import type { Tray } from 'electron';
import { Menu, app } from 'electron';
import { uIOhook } from 'uiohook-napi';
import { languages } from '../language/index.ts';
import { AI_MODELS } from '../models.ts';
import { getConfig, updateConfig, getPausedState, setPausedState } from '../config/index.ts';
import { openSettingsWindow } from './settings.ts';

export function createTrayMenu(tray: Tray | null, updateTrayTitle: (title: string) => void): Menu {
  const config = getConfig();
  const isPaused = getPausedState();

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Honyo Translator', type: 'normal', enabled: false },
    { type: 'separator' },
    {
      label: `Primary: ${config.targetLanguage}`,
      submenu: languages.map(lang => ({
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
      submenu: languages.map(lang => ({
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
      label: `AI Model: ${AI_MODELS[config.aiModel]?.name ?? 'Unknown'}`,
      submenu: Object.entries(AI_MODELS).map(([modelId, modelInfo]) => ({
        label: modelInfo.name,
        type: 'radio',
        checked: config.aiModel === modelId,
        click: (): void => {
          updateConfig({ aiModel: modelId });
          tray?.setContextMenu(createTrayMenu(tray, updateTrayTitle));
        },
      })),
    },
    {
      label: 'API Key Settings...',
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
        updateTrayTitle(getPausedState() ? 'P' : 'H');
        console.log(`Translation ${getPausedState() ? 'paused' : 'resumed'}`);
        tray?.setContextMenu(createTrayMenu(tray, updateTrayTitle));
      },
    },
    { type: 'separator' },
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
