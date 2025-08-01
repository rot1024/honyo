import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { LanguageModel } from 'ai';
import { AI_MODELS, CUSTOM_MODEL_ID } from '../models.ts';
import type { ApiKeys, CustomModel } from '../config/types.ts';

export function getAIProvider(
  modelId: string,
  apiKeys: ApiKeys,
  customModel?: CustomModel,
): LanguageModel {
  if (modelId === CUSTOM_MODEL_ID) {
    if (!customModel || !customModel.model || !customModel.provider) {
      throw new Error('Custom model is not configured properly');
    }

    const apiKey = apiKeys[customModel.provider];
    if (!apiKey) {
      throw new Error(`No API key configured for ${customModel.provider}`);
    }

    switch (customModel.provider) {
      case 'anthropic':
        return createAnthropic({ apiKey })(customModel.model);
      case 'openai':
        return createOpenAI({ apiKey })(customModel.model);
      case 'google':
        return createGoogleGenerativeAI({ apiKey })(customModel.model);
    }

    throw new Error('Unknown provider');
  }

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
