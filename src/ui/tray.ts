import { Tray } from 'electron';
import { createNormalIcon, createTranslatingIcon } from './icons.ts';
import { createTrayMenu } from './menu.ts';
import { setMenuUpdateCallback } from '../app/updater.ts';

let tray: Tray | null = null;
let normalIcon: Electron.NativeImage | null = null;
let translatingIcon: Electron.NativeImage | null = null;

export function createTray(): Tray {
  // Create icons
  normalIcon = createNormalIcon();
  translatingIcon = createTranslatingIcon();

  if (!normalIcon) throw new Error('Normal icon not created');
  tray = new Tray(normalIcon);

  console.log('Tray created successfully');

  // Create menu update function
  const updateMenu = (): void => {
    if (tray) {
      const menu = createTrayMenu(tray, () => {});
      tray.setContextMenu(menu);
    }
  };

  // Register menu update callback for updater
  setMenuUpdateCallback(updateMenu);

  // Create initial menu
  updateMenu();
  tray.setToolTip('Honyo - Double Cmd+C to translate');

  return tray;
}

export function getTray(): Tray | null {
  return tray;
}

export function setTrayIcon(isTranslating: boolean): void {
  if (!tray) return;

  if (isTranslating && translatingIcon) {
    tray.setImage(translatingIcon);
  } else if (normalIcon) {
    tray.setImage(normalIcon);
  }
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
