export interface AIModelInfo {
  name: string;
  provider: 'anthropic' | 'openai' | 'google';
  model: string;
}

export const AI_MODELS: Record<string, AIModelInfo> = {
  // Anthropic Claude models (latest first)
  'claude-4.5-sonnet': {
    provider: 'anthropic',
    name: 'Claude 4.5 Sonnet',
    model: 'claude-sonnet-4-5-20250929',
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
  'claude-3.5-sonnet': {
    provider: 'anthropic',
    name: 'Claude 3.5 Sonnet (Oct)',
    model: 'claude-3-5-sonnet-20241022',
  },
  'claude-3.5-sonnet-v2': {
    provider: 'anthropic',
    name: 'Claude 3.5 Sonnet (June)',
    model: 'claude-3-5-sonnet-20240620',
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
  'gpt-4': {
    provider: 'openai',
    name: 'GPT-4',
    model: 'gpt-4',
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
  'o1-preview': {
    provider: 'openai',
    name: 'o1 Preview',
    model: 'o1-preview',
  },
  // Google Gemini models (latest first)
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
  'gemini-2.0-flash-exp': {
    provider: 'google',
    name: 'Gemini 2.0 Flash (Experimental)',
    model: 'gemini-2.0-flash-exp',
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
