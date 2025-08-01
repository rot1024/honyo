import { nativeImage, app } from 'electron';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getIconPath(filename: string): string {
  // In production, icons are in extraResources
  if (app.isPackaged) {
    return join(process.resourcesPath, 'icons', filename);
  }
  // In development, use the source files
  return join(__dirname, filename);
}

export function createNormalIcon(): Electron.NativeImage {
  const iconPath = getIconPath('icon-normal.png');
  const iconBuffer = readFileSync(iconPath);
  const icon = nativeImage.createFromBuffer(iconBuffer);
  
  // Set DPI for proper retina display
  const scaledIcon = icon.resize({ width: 16, height: 16 });

  // Set as template image on macOS
  if (process.platform === 'darwin') {
    scaledIcon.setTemplateImage(true);
  }

  return scaledIcon;
}

export function createTranslatingIcon(): Electron.NativeImage {
  const iconPath = getIconPath('icon-translating.png');
  const iconBuffer = readFileSync(iconPath);
  const icon = nativeImage.createFromBuffer(iconBuffer);
  
  // Set DPI for proper retina display
  const scaledIcon = icon.resize({ width: 16, height: 16 });

  // Set as template image on macOS
  if (process.platform === 'darwin') {
    scaledIcon.setTemplateImage(true);
  }

  return scaledIcon;
}