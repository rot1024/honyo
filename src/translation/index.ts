import { Notification } from 'electron';
import { generateText } from 'ai';
import { AI_MODELS } from '../models.ts';
import { detectLanguage } from '../language/index.ts';
import { getAIProvider } from './providers.ts';
import { getConfig, getApiKeys } from '../config/index.ts';

export async function translateText(
  text: string,
  primaryLanguage: string,
  secondaryLanguage: string,
): Promise<string> {
  const config = getConfig();
  const apiKeys = getApiKeys();

  try {
    // Pre-check API key
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

    // Get the model
    const model = getAIProvider(config.aiModel, apiKeys);

    // Detect language
    const detectedLanguage = await detectLanguage(text, model);
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

    const { text: translation } = await generateText({
      model,
      prompt: `You are a translator. Translate the following text to ${targetLanguage}.
IMPORTANT: Return ONLY the translated text. Do not include any explanations, notes, or phrases like "Here is the translation" or "The translation is". Just the translated text itself.

Text to translate: ${text}`,
    });
    console.log('Translation complete:', translation.slice(0, 50) + '...');
    return translation.trim();
  } catch (error) {
    console.error('Translation error:', error);
    if (error instanceof Error && error.message.includes('No API key')) {
      new Notification({
        title: 'API Key Missing',
        body: `Please configure API key for ${AI_MODELS[config.aiModel]?.name ?? 'selected model'}`,
      }).show();
      return 'API key not configured';
    }
    return 'Translation failed: ' + (error instanceof Error ? error.message : String(error));
  }
}

export { getAIProvider } from './providers.ts';
