/**
 * @fileOverview Text-to-Speech (TTS) utility using the browser's SpeechSynthesis API.
 */

export type Gender = 'male' | 'female' | 'neutral' | 'any'; // Define gender type

/**
 * Speaks the given text in the specified language using the browser's SpeechSynthesis API,
 * attempting to use a voice matching the preferred gender.
 *
 * @param text The text to speak.
 * @param lang The BCP 47 language code (e.g., "en-US", "tr-TR", "es-ES").
 * @param preferredGender The preferred gender for the voice ('male', 'female', 'neutral', or 'any'). Defaults to 'any'.
 * @param onError Optional callback function to handle errors (e.g., language not supported).
 */
export function speakText(
  text: string,
  lang: string,
  preferredGender: Gender = 'any',
  onError?: (errorMessage: string) => void
): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Speech Synthesis API is not available.');
    onError?.('Speech synthesis is not supported by your browser.');
    return;
  }

  // Cancel any ongoing speech before starting a new one
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang; // Set the language

  const findVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
    // Filter voices by language (exact match or prefix match like "en-US" for "en")
    const langVoices = voices.filter(voice => voice.lang === lang || voice.lang.startsWith(lang + '-'));
    if (langVoices.length === 0) return undefined; // No voices for this language

    // If no specific gender preferred, return the first voice for the language
    if (preferredGender === 'any') {
      return langVoices[0];
    }

    // Try to find a voice matching the preferred gender
    // Note: Gender information is not standardized and relies on voice names.
    const genderKeywords = preferredGender === 'male'
      ? ['male', 'erkek', 'hombre', 'homme', 'mann'] // Add keywords for male in different languages
      : preferredGender === 'female'
      ? ['female', 'kadın', 'mujer', 'femme', 'frau'] // Add keywords for female
      : []; // 'neutral' might be harder to detect reliably

    let matchingVoice: SpeechSynthesisVoice | undefined;

    if (genderKeywords.length > 0) {
       matchingVoice = langVoices.find(voice =>
         genderKeywords.some(keyword => voice.name.toLowerCase().includes(keyword))
       );
    }

    // If a gender-matching voice is found, return it
    if (matchingVoice) {
      return matchingVoice;
    }

    // Fallback: If no gender match, return the first available voice for the language
    console.warn(`No specific '${preferredGender}' voice found for language ${lang}. Using first available.`);
    return langVoices[0];
  };


  const speakWithSelectedVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
        console.warn('No voices available yet.');
        onError?.('Speech synthesis voices not loaded yet.');
        return; // Exit if no voices loaded
    }

    const selectedVoice = findVoice(voices);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log(`Using voice: ${selectedVoice.name} (${selectedVoice.lang}) for lang ${lang} with preference ${preferredGender}`);
    } else {
      console.warn(`No voice found for language: ${lang}. Using browser default.`);
      // Let the browser use the default voice for the specified language if available,
      // otherwise it might fall back to the system default.
    }

    utterance.onerror = (event) => {
      console.error('SpeechSynthesisUtterance.onerror', event);
      let errorMsg = `An error occurred during speech synthesis (${event.error}).`;
       if (event.error === 'language-unavailable' || event.error === 'voice-unavailable') {
          errorMsg = `Speech synthesis failed: No suitable voice found for the selected language (${lang}) and gender preference (${preferredGender}).`;
      }
      onError?.(errorMsg);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Ensure voices are loaded before attempting to speak
   if (window.speechSynthesis.getVoices().length === 0) {
     window.speechSynthesis.onvoiceschanged = () => {
        console.log("Voices loaded via onvoiceschanged.");
        speakWithSelectedVoice();
        window.speechSynthesis.onvoiceschanged = null; // Clean up listener
     };
   } else {
      console.log("Voices already available.");
      speakWithSelectedVoice(); // Voices are already loaded
   }
}
