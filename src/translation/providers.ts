import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';
import { AI_MODELS } from '../models.ts';
import type { ApiKeys } from '../config/types.ts';

export function getAIProvider(modelId: string, apiKeys: ApiKeys): LanguageModel {
  const modelInfo = AI_MODELS[modelId];
  if (!modelInfo) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  const apiKey = apiKeys[modelInfo.provider];
  if (!apiKey) {
    throw new Error(`No API key configured for ${modelInfo.provider}`);
  }

  switch (modelInfo.provider) {
    case 'anthropic':
      return createAnthropic({ apiKey })(modelInfo.model);
    case 'openai':
      return createOpenAI({ apiKey })(modelInfo.model);
    case 'google':
      return createGoogleGenerativeAI({ apiKey })(modelInfo.model);
  }

  throw new Error('Unknown provider');
}
