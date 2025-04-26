import { translate as translateFlow, type TranslateInput, type TranslateOutput } from '@/ai/flows/translate-flow';


/**
 * Represents a translation request.
 */
export interface TranslationRequest extends TranslateInput {} // Use the same type as flow input


/**
 * Represents a translation result.
 */
export interface TranslationResult extends TranslateOutput {} // Use the same type as flow output


/**
 * Asynchronously translates text from one language to another using the Genkit flow.
 *
 * @param request The translation request containing the text, source language, and target language.
 * @returns A promise that resolves to a TranslationResult object containing the translated text.
 */
export async function translateText(request: TranslationRequest): Promise<TranslationResult> {
  try {
    // Call the Genkit flow wrapper function
    const result: TranslationResult = await translateFlow(request);
    return result;
  } catch (error) {
    console.error('Translation service failed:', error);
    // Provide a user-friendly error message in the result
    return {
      translatedText: 'Translation currently unavailable. Please try again later.',
    };
  }
}
