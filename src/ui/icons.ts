import { nativeImage, app } from 'electron';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in both ESM and CommonJS
// This dual compatibility is needed because:
// - Development uses ESM (type: "module" in package.json)
// - Production must use CommonJS due to @electron/universal limitations
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

function getIconPath(filename: string): string {
  // In production, icons are in extraResources
  if (app.isPackaged) {
    return join(process.resourcesPath, 'icons', filename);
  }
  // In development, use the source files
  return join(currentDir, filename);
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
