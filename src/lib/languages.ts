
export interface Language {
  code: LanguageCode; // Use LanguageCode type
  name: string;
}

// Define a union type for allowed language codes for better type safety
export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'zh' | 'ru' | 'ar' | 'hi' | 'tr';

export const languages: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'ru', name: 'Russian' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'tr', name: 'Turkish' },
];

/**
 * Finds the display name for a given language code.
 * @param code The language code (e.g., 'en', 'tr').
 * @returns The full language name or the code itself if not found.
 */
export function getLanguageName(code: LanguageCode | string | undefined): string {
  if (!code) return 'Unknown';
  const language = languages.find(l => l.code === code);
  return language ? language.name : code;
}
