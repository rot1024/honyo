import { Tray } from 'electron';
import { createNormalIcon, createTranslatingIcon } from './icons.ts';
import { createTrayMenu } from './menu.ts';
import { getPausedState } from '../config/index.ts';

let tray: Tray | null = null;
let normalIcon: Electron.NativeImage | null = null;
let translatingIcon: Electron.NativeImage | null = null;

export function createTray(): Tray {
  // Create icons
  normalIcon = createNormalIcon();
  translatingIcon = createTranslatingIcon();

  if (!normalIcon) throw new Error('Normal icon not created');
  tray = new Tray(normalIcon);

  // Debug: Show title on macOS to confirm existence
  if (process.platform === 'darwin') {
    tray.setTitle(getPausedState() ? 'P' : 'H');
  }

  console.log('Tray created successfully');

  // Create menu with update function
  const updateTrayTitle = (title: string): void => {
    if (process.platform === 'darwin' && tray) {
      tray.setTitle(title);
    }
  };

  const menu = createTrayMenu(tray, updateTrayTitle);
  tray.setContextMenu(menu);
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
    if (process.platform === 'darwin') {
      tray.setTitle('T');
    }
  } else if (normalIcon) {
    tray.setImage(normalIcon);
    if (process.platform === 'darwin') {
      tray.setTitle(getPausedState() ? 'P' : 'H');
    }
  }
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
