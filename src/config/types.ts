export interface ApiKeys {
  anthropic: string;
  openai: string;
  google: string;
}

export interface Config {
  targetLanguage: string;
  secondaryLanguage: string;
  isPaused: boolean;
  aiModel: string;
}

export interface SavedConfig extends Config {
  fallbackLanguage?: string; // For migration
}
