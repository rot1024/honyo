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
  customPrompt: string;
  displayMode: DisplayMode;
  customModel?: CustomModel;
  customLanguages?: string[];
}

export interface SavedConfig extends Config {
  fallbackLanguage?: string; // For migration
}
