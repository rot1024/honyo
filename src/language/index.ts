import { LANGUAGES } from './constants.ts';

export function getLanguageFromLocale(locale: string): string {
  // Try exact match
  if (LANGUAGES[locale]) {
    return LANGUAGES[locale];
  }

  // Try with language code only (e.g., ja-JP → ja)
  const langCode = locale.split('-')[0];
  if (langCode && LANGUAGES[langCode]) {
    return LANGUAGES[langCode];
  }

  // Special handling for Chinese
  if (langCode === 'zh') {
    return locale.includes('TW') || locale.includes('HK')
      ? (LANGUAGES['zh-TW'] ?? LANGUAGES.en ?? 'English')
      : (LANGUAGES['zh-CN'] ?? LANGUAGES.en ?? 'English');
  }

  // Default to English
  return LANGUAGES.en ?? 'English';
}

export { LANGUAGES, languages } from './constants.ts';
export { detectLanguage } from './detector.ts';
