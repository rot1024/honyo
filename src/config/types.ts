export interface ApiKeys {
  anthropic: string;
  openai: string;
  google: string;
}

export type DisplayMode = 'notification' | 'popup';

export interface CustomModel {
  model: string;
  provider: 'anthropic' | 'openai' | 'google';
}

export interface Config {
  targetLanguage: string;
  secondaryLanguage: string;
  isPaused: boolean;
  aiModel: string;
  autoCloseOnBlur?: boolean;
  customPrompt: string;
  displayMode: DisplayMode;
  customModel?: CustomModel;
  customLanguages?: string[];
  skippedUpdateVersion?: string;
  enableStreaming?: boolean;
  openAtLogin?: boolean;
}

export interface SavedConfig extends Config {
  fallbackLanguage?: string; // For migration
}
