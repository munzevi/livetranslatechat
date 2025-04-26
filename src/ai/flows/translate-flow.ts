'use server';
/**
 * @fileOverview Provides a text translation flow using Genkit.
 *
 * - translate - Translates text from a source language to a target language.
 * - TranslateInput - The input type for the translation flow.
 * - TranslateOutput - The return type for the translation flow.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';
import { languages } from '@/lib/languages'; // Import languages for validation/mapping if needed

const languageCodes = languages.map(lang => lang.code);

const TranslateInputSchema = z.object({
  text: z.string().describe('The text content to be translated.'),
  sourceLanguage: z.string().describe('The ISO 639-1 code of the source language (e.g., "en", "tr").'),
  targetLanguage: z.string().describe('The ISO 639-1 code of the target language (e.g., "es", "fr").'),
}).refine(data => languageCodes.includes(data.sourceLanguage), {
    message: "Invalid source language code.",
    path: ["sourceLanguage"],
}).refine(data => languageCodes.includes(data.targetLanguage), {
    message: "Invalid target language code.",
    path: ["targetLanguage"],
});
export type TranslateInput = z.infer<typeof TranslateInputSchema>;


const TranslateOutputSchema = z.object({
  translatedText: z.string().describe('The translated text in the target language.'),
});
export type TranslateOutput = z.infer<typeof TranslateOutputSchema>;


const translatePrompt = ai.definePrompt({
    name: 'translateTextPrompt',
    input: { schema: TranslateInputSchema },
    output: { schema: TranslateOutputSchema },
    prompt: `Translate the following text from {{sourceLanguage}} to {{targetLanguage}}. Only provide the translated text, without any introductory phrases or explanations.

Text:
{{{text}}}

Translated Text:`,
});


const translateFlow = ai.defineFlow(
    {
        name: 'translateFlow',
        inputSchema: TranslateInputSchema,
        outputSchema: TranslateOutputSchema,
    },
    async (input) => {
        const { output } = await translatePrompt(input);
        // Ensure output is not null or undefined before returning
        if (!output) {
            throw new Error("Translation failed: No output received from the model.");
        }
        return output;
    }
);

/**
 * Translates text using the configured Genkit flow.
 * @param input The translation request details.
 * @returns A promise resolving to the translation output.
 */
export async function translate(input: TranslateInput): Promise<TranslateOutput> {
    try {
        // Add extra validation or logging here if needed
        const result = await translateFlow(input);
        return result;
    } catch (error) {
         console.error("Error in translation flow:", error);
        // Rethrow or handle error appropriately, e.g., return a default error message
        // For now, rethrowing to let the caller handle it.
        // Consider returning a specific error structure if needed:
        // return { translatedText: "Error: Translation failed." };
         throw error;
    }
}
