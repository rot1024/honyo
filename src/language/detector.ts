import { generateText, type LanguageModel } from 'ai';

export async function detectLanguage(text: string, model: LanguageModel): Promise<string | null> {
  try {
    const { text: detectedLang } = await generateText({
      model,
      prompt: `Detect the language of this text and return ONLY the language name in English (e.g., "Japanese", "English", "Chinese", etc.). Do not include any explanation, just the language name: "${text.slice(0, 200)}"`,
    });
    return detectedLang.trim();
  } catch (error) {
    console.error('Language detection error:', error);
    return null;
  }
}
