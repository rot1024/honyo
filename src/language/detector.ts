import { generateText, type LanguageModel } from 'ai';
import { languages } from './constants.ts';

export async function detectLanguage(
  text: string,
  model: LanguageModel,
  signal?: AbortSignal,
  customLanguages?: string[],
): Promise<string | null> {
  try {
    // Combine built-in and custom languages
    const allLanguages = [...languages];
    if (customLanguages && customLanguages.length > 0) {
      allLanguages.push(...customLanguages);
    }

    const languageList = allLanguages.join(', ');
    const prompt = `Detect the language of this text and return ONLY the language name in English. Choose from one of these languages: ${languageList}. Do not include any explanation, just the language name.\n\nText: "${text.slice(0, 200)}"`;

    const { text: detectedLang } = await generateText(
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
    return detectedLang.trim();
  } catch (error) {
    console.error('Language detection error:', error);
    return null;
  }
}
