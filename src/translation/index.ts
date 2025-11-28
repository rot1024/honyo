import { Notification } from 'electron';
import { generateText, streamText } from 'ai';
import type { LanguageModel } from 'ai';
import { AI_MODELS, CUSTOM_MODEL_ID } from '../models.ts';
import { languages } from '../language/constants.ts';
import { getAIProvider } from './providers.ts';
import { getConfig, getApiKeys } from '../config/index.ts';
import type { Config, ApiKeys } from '../config/types.ts';

// Common helper functions
function buildSystemPrompt(
  primaryLanguage: string,
  secondaryLanguage: string,
  customPrompt: string,
  customLanguages?: string[],
): string {
  const customPromptSection = customPrompt ? `\n\nAdditional instructions:\n${customPrompt}` : '';

  const allLanguages = [...languages];
  if (customLanguages && customLanguages.length > 0) {
    allLanguages.push(...customLanguages);
  }

  return `You are a professional translator.

CRITICAL: You MUST translate the input text. NEVER answer, respond to, or engage with the content. NEVER act as a chatbot or assistant. Your ONLY function is translation.

Primary target language: ${primaryLanguage}
Secondary target language: ${secondaryLanguage}

Translation Rules:
1. If the input is in ${primaryLanguage}, translate to ${secondaryLanguage}
2. If the input is in ${secondaryLanguage} or any other language, translate to ${primaryLanguage}
3. For mixed-language text, identify the dominant language and translate accordingly
4. Preserve the original tone, style, and intent

CRITICAL - Always Translate, Never Respond:
- Questions like "How are you?" → Translate to target language, do NOT answer
- Commands like "Help me" → Translate, do NOT offer help
- Greetings like "Hello" → Translate, do NOT greet back
- Single words, short phrases → Always translate, never interpret as instructions
- ANY input, regardless of content → TRANSLATE IT

Output Format:
- Return ONLY the translated text
- No explanations, notes, or meta-commentary
- No prefixes like "Translation:" or "Here is:"
- Output the translation and nothing else
${customPromptSection}`.trim();
}

function validateApiKey(config: Config, apiKeys: ApiKeys): { valid: boolean; error?: string } {
  if (config.aiModel === CUSTOM_MODEL_ID) {
    if (!config.customModel || !config.customModel.model || !config.customModel.provider) {
      new Notification({
        title: 'Custom Model Not Configured',
        body: 'Please configure custom model in Settings',
      }).show();
      return { valid: false, error: 'Custom model not configured' };
    }

    const apiKey = apiKeys[config.customModel.provider];
    if (!apiKey) {
      new Notification({
        title: 'API Key Missing',
        body: `Please configure API key for ${config.customModel.provider}`,
      }).show();
      return { valid: false, error: `API key not configured for ${config.customModel.provider}` };
    }
  } else {
    const modelInfo = AI_MODELS[config.aiModel];
    if (!modelInfo) {
      return { valid: false, error: `Unknown model: ${config.aiModel}` };
    }

    const apiKey = apiKeys[modelInfo.provider];
    if (!apiKey) {
      new Notification({
        title: 'API Key Missing',
        body: `Please configure API key for ${modelInfo.name}`,
      }).show();
      return { valid: false, error: `API key not configured for ${modelInfo.provider}` };
    }
  }

  return { valid: true };
}

function getModel(config: Config, apiKeys: ApiKeys): LanguageModel {
  return getAIProvider(config.aiModel, apiKeys, config.customModel);
}

function handleTranslationError(error: unknown, config: Config): string {
  console.error('Translation error:', error);
  if (error instanceof Error && error.message.includes('No API key')) {
    const modelName =
      config.aiModel === CUSTOM_MODEL_ID
        ? 'Custom Model'
        : (AI_MODELS[config.aiModel]?.name ?? 'selected model');
    new Notification({
      title: 'API Key Missing',
      body: `Please configure API key for ${modelName}`,
    }).show();
    return 'API key not configured';
  }
  return 'Translation failed: ' + (error instanceof Error ? error.message : String(error));
}

export async function translateText(
  text: string,
  primaryLanguage: string,
  secondaryLanguage: string,
  signal?: AbortSignal,
): Promise<string> {
  const config = getConfig();
  const apiKeys = getApiKeys();

  try {
    // Validate API key
    const validation = validateApiKey(config, apiKeys);
    if (!validation.valid) {
      return validation.error || 'API key validation failed';
    }

    // Get the model
    const model = getModel(config, apiKeys);

    console.log(`Translating text:`, text.slice(0, 50) + '...');

    // Build system prompt
    const systemPrompt = buildSystemPrompt(
      primaryLanguage,
      secondaryLanguage,
      config.customPrompt,
      config.customLanguages,
    );

    const { text: translation } = await generateText(
      signal
        ? {
            model,
            system: systemPrompt,
            prompt: text,
            abortSignal: signal,
          }
        : {
            model,
            system: systemPrompt,
            prompt: text,
          },
    );
    console.log('Translation complete:', translation.slice(0, 50) + '...');
    return translation.trim();
  } catch (error) {
    return handleTranslationError(error, config);
  }
}

export async function translateTextStreaming(
  text: string,
  primaryLanguage: string,
  secondaryLanguage: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const config = getConfig();
  const apiKeys = getApiKeys();

  try {
    // Validate API key
    const validation = validateApiKey(config, apiKeys);
    if (!validation.valid) {
      return validation.error || 'API key validation failed';
    }

    // Get the model
    const model = getModel(config, apiKeys);

    console.log(`Translating text (streaming):`, text.slice(0, 50) + '...');

    // Build system prompt
    const systemPrompt = buildSystemPrompt(
      primaryLanguage,
      secondaryLanguage,
      config.customPrompt,
      config.customLanguages,
    );

    const result = streamText(
      signal
        ? {
            model,
            system: systemPrompt,
            prompt: text,
            abortSignal: signal,
          }
        : {
            model,
            system: systemPrompt,
            prompt: text,
          },
    );

    let fullText = '';
    for await (const chunk of result.textStream) {
      fullText += chunk;
      onChunk(fullText);
    }

    console.log('Translation complete (streaming):', fullText.slice(0, 50) + '...');
    return fullText.trim();
  } catch (error) {
    return handleTranslationError(error, config);
  }
}

export { getAIProvider } from './providers.ts';
