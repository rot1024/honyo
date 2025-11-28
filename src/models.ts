export interface AIModelInfo {
  name: string;
  provider: 'anthropic' | 'openai' | 'google';
  model: string;
}

export const AI_MODELS: Record<string, AIModelInfo> = {
  // Anthropic Claude models (latest first, Sonnet as default for cost efficiency)
  'claude-4.5-sonnet': {
    provider: 'anthropic',
    name: 'Claude 4.5 Sonnet',
    model: 'claude-sonnet-4-5-20250929',
  },
  'claude-4.5-opus': {
    provider: 'anthropic',
    name: 'Claude 4.5 Opus',
    model: 'claude-opus-4-5-20251101',
  },
  'claude-4.5-haiku': {
    provider: 'anthropic',
    name: 'Claude 4.5 Haiku',
    model: 'claude-haiku-4-5-20251001',
  },
  'claude-4.1-opus': {
    provider: 'anthropic',
    name: 'Claude 4.1 Opus',
    model: 'claude-opus-4-1-20250805',
  },
  'claude-4-sonnet': {
    provider: 'anthropic',
    name: 'Claude 4 Sonnet',
    model: 'claude-sonnet-4-20250514',
  },
  'claude-4-opus': {
    provider: 'anthropic',
    name: 'Claude 4 Opus',
    model: 'claude-opus-4-20250514',
  },
  'claude-3.7-sonnet': {
    provider: 'anthropic',
    name: 'Claude 3.7 Sonnet',
    model: 'claude-3-7-sonnet-20250219',
  },
  'claude-3.5-haiku': {
    provider: 'anthropic',
    name: 'Claude 3.5 Haiku',
    model: 'claude-3-5-haiku-20241022',
  },
  // OpenAI GPT models (latest first)
  'gpt-5': {
    provider: 'openai',
    name: 'GPT-5',
    model: 'gpt-5',
  },
  'gpt-5-mini': {
    provider: 'openai',
    name: 'GPT-5 Mini',
    model: 'gpt-5-mini',
  },
  'gpt-5-nano': {
    provider: 'openai',
    name: 'GPT-5 Nano',
    model: 'gpt-5-nano',
  },
  'gpt-4.1': {
    provider: 'openai',
    name: 'GPT-4.1',
    model: 'gpt-4.1',
  },
  'gpt-4.1-mini': {
    provider: 'openai',
    name: 'GPT-4.1 Mini',
    model: 'gpt-4.1-mini',
  },
  'gpt-4.1-nano': {
    provider: 'openai',
    name: 'GPT-4.1 Nano',
    model: 'gpt-4.1-nano',
  },
  'gpt-4o': {
    provider: 'openai',
    name: 'GPT-4o',
    model: 'gpt-4o',
  },
  'gpt-4o-mini': {
    provider: 'openai',
    name: 'GPT-4o Mini',
    model: 'gpt-4o-mini',
  },
  o3: {
    provider: 'openai',
    name: 'o3',
    model: 'o3',
  },
  'o3-pro': {
    provider: 'openai',
    name: 'o3 Pro',
    model: 'o3-pro',
  },
  'o3-mini': {
    provider: 'openai',
    name: 'o3 Mini',
    model: 'o3-mini',
  },
  'o4-mini': {
    provider: 'openai',
    name: 'o4 Mini',
    model: 'o4-mini',
  },
  o1: {
    provider: 'openai',
    name: 'o1',
    model: 'o1',
  },
  'o1-mini': {
    provider: 'openai',
    name: 'o1 Mini',
    model: 'o1-mini',
  },
  // Google Gemini models (latest first)
  'gemini-3.0-pro': {
    provider: 'google',
    name: 'Gemini 3.0 Pro (Preview)',
    model: 'gemini-3-pro-preview',
  },
  'gemini-2.5-pro': {
    provider: 'google',
    name: 'Gemini 2.5 Pro',
    model: 'gemini-2.5-pro',
  },
  'gemini-2.5-flash': {
    provider: 'google',
    name: 'Gemini 2.5 Flash',
    model: 'gemini-2.5-flash',
  },
  'gemini-2.5-flash-lite': {
    provider: 'google',
    name: 'Gemini 2.5 Flash-Lite',
    model: 'gemini-2.5-flash-lite',
  },
  'gemini-2.0-flash': {
    provider: 'google',
    name: 'Gemini 2.0 Flash',
    model: 'gemini-2.0-flash',
  },
  'gemini-1.5-flash': {
    provider: 'google',
    name: 'Gemini 1.5 Flash',
    model: 'gemini-1.5-flash',
  },
  'gemini-1.5-pro': {
    provider: 'google',
    name: 'Gemini 1.5 Pro',
    model: 'gemini-1.5-pro',
  },
};

export const DEFAULT_AI_MODEL = Object.keys(AI_MODELS)[0] ?? 'claude-3.5-haiku';
export const CUSTOM_MODEL_ID = 'custom-model';
