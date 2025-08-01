import { app } from 'electron';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, chmodSync } from 'fs';
import type { ApiKeys, Config, SavedConfig } from './types';

export const configPath = join(app.getPath('userData'), 'config.json');
export const apiKeysPath = join(app.getPath('userData'), 'apikeys.json');

export function loadConfigFromFile(defaultConfig: Config): Config {
  try {
    if (existsSync(configPath)) {
      const data = readFileSync(configPath, 'utf8');
      const savedConfig = JSON.parse(data) as SavedConfig;

      // Migrate old fallbackLanguage to secondaryLanguage
      if (savedConfig.fallbackLanguage && !savedConfig.secondaryLanguage) {
        savedConfig.secondaryLanguage = savedConfig.fallbackLanguage;
        delete savedConfig.fallbackLanguage;
      }

      return { ...defaultConfig, ...savedConfig };
    }
  } catch (error) {
    console.error('Failed to load config:', error);
  }
  return defaultConfig;
}

export function saveConfigToFile(config: Config, isPaused: boolean): void {
  try {
    const configToSave = {
      ...config,
      isPaused: isPaused,
    };
    writeFileSync(configPath, JSON.stringify(configToSave, null, 2));
  } catch (error) {
    console.error('Failed to save config:', error);
  }
}

export function loadApiKeysFromFile(defaultKeys: ApiKeys): ApiKeys {
  try {
    if (existsSync(apiKeysPath)) {
      const data = readFileSync(apiKeysPath, 'utf8');
      const savedKeys = JSON.parse(data) as Partial<ApiKeys>;
      return { ...defaultKeys, ...savedKeys };
    }
  } catch (error) {
    console.error('Failed to load API keys:', error);
  }
  return defaultKeys;
}

export function saveApiKeysToFile(apiKeys: ApiKeys): void {
  try {
    writeFileSync(apiKeysPath, JSON.stringify(apiKeys, null, 2));
    // Set file permissions (read-only for owner)
    chmodSync(apiKeysPath, 0o600);
  } catch (error) {
    console.error('Failed to save API keys:', error);
  }
}
