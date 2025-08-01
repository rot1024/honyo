import { Notification } from 'electron';
import { generateText } from 'ai';
import { AI_MODELS, CUSTOM_MODEL_ID } from '../models.ts';
import { detectLanguage } from '../language/index.ts';
import { getAIProvider } from './providers.ts';
import { getConfig, getApiKeys } from '../config/index.ts';

export async function translateText(
  text: string,
  primaryLanguage: string,
  secondaryLanguage: string,
  signal?: AbortSignal,
): Promise<string> {
  const config = getConfig();
  const apiKeys = getApiKeys();

  try {
    // Pre-check API key
    if (config.aiModel === CUSTOM_MODEL_ID) {
      if (!config.customModel || !config.customModel.model || !config.customModel.provider) {
        new Notification({
          title: 'Custom Model Not Configured',
          body: 'Please configure custom model in Settings',
        }).show();
        return 'Custom model not configured';
      }

      const apiKey = apiKeys[config.customModel.provider];
      if (!apiKey) {
        new Notification({
          title: 'API Key Missing',
          body: `Please configure API key for ${config.customModel.provider}`,
        }).show();
        return `API key not configured for ${config.customModel.provider}`;
      }
    } else {
      const modelInfo = AI_MODELS[config.aiModel];
      if (!modelInfo) {
        throw new Error(`Unknown model: ${config.aiModel}`);
      }

      const apiKey = apiKeys[modelInfo.provider];
      if (!apiKey) {
        new Notification({
          title: 'API Key Missing',
          body: `Please configure API key for ${modelInfo.name}`,
        }).show();
        return `API key not configured for ${modelInfo.provider}`;
      }
    }

    // Get the model
    const model = getAIProvider(config.aiModel, apiKeys, config.customModel);

    // Detect language
    const detectedLanguage = await detectLanguage(text, model, signal, config.customLanguages);
    if (!detectedLanguage) {
      return 'Could not detect language';
    }

    console.log(`Detected language: ${detectedLanguage}`);

    // Determine target language
    let targetLanguage: string;
    if (detectedLanguage && detectedLanguage.toLowerCase() === primaryLanguage.toLowerCase()) {
      targetLanguage = secondaryLanguage;
      console.log(
        `Source language matches primary (${primaryLanguage}), using secondary: ${secondaryLanguage}`,
      );
    } else {
      targetLanguage = primaryLanguage;
      console.log(`Translating to primary language: ${primaryLanguage}`);
    }

    console.log(`Translating text to ${targetLanguage}:`, text.slice(0, 50) + '...');

    // Add custom prompt if configured
    const customPromptSection = config.customPrompt
      ? `\n\nAdditional instructions:\n${config.customPrompt}\n`
      : '';

    const prompt = `You are a translator. Translate the following text to ${targetLanguage}.
IMPORTANT: Return ONLY the translated text. Do not include any explanations, notes, or phrases like "Here is the translation" or "The translation is". Just the translated text itself.${customPromptSection}

Text to translate: ${text}`;

    const { text: translation } = await generateText(
      signal
        ? {
            model,
            prompt,
            abortSignal: signal,
          }
        : {
            model,
            prompt,
          },
    );
    console.log('Translation complete:', translation.slice(0, 50) + '...');
    return translation.trim();
  } catch (error) {
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
}

export { getAIProvider } from './providers.ts';
