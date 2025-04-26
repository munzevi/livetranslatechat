/**
 * @fileOverview Text-to-Speech (TTS) utility using the browser's SpeechSynthesis API.
 */

/**
 * Speaks the given text in the specified language using the browser's SpeechSynthesis API.
 *
 * @param text The text to speak.
 * @param lang The BCP 47 language code (e.g., "en-US", "tr-TR", "es-ES").
 * @param onError Optional callback function to handle errors (e.g., language not supported).
 */
export function speakText(text: string, lang: string, onError?: (errorMessage: string) => void): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('Speech Synthesis API is not available.');
    onError?.('Speech synthesis is not supported by your browser.');
    return;
  }

  // Cancel any ongoing speech before starting a new one
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang; // Set the language

  // Attempt to find a voice for the specified language
  const voices = window.speechSynthesis.getVoices();
  const voiceForLang = voices.find(voice => voice.lang === lang || voice.lang.startsWith(lang + '-'));

  if (voiceForLang) {
    utterance.voice = voiceForLang;
  } else {
    console.warn(`No specific voice found for language: ${lang}. Using default.`);
    // Let the browser use the default voice for the specified language if available,
    // otherwise it might fall back to the system default.
  }

  utterance.onerror = (event) => {
    console.error('SpeechSynthesisUtterance.onerror', event);
    let errorMsg = 'An error occurred during speech synthesis.';
    if (event.error === 'language-unavailable') {
        errorMsg = `Speech synthesis is not available for the selected language (${lang}).`;
    } else if (event.error === 'voice-unavailable') {
        errorMsg = `A specific voice for the selected language (${lang}) is not available.`;
    }
    onError?.(errorMsg);
  };

  // Need to ensure voices are loaded before speaking, especially on first use
  if (voices.length === 0) {
      // The 'voiceschanged' event fires when the voice list is ready
      window.speechSynthesis.onvoiceschanged = () => {
          const updatedVoices = window.speechSynthesis.getVoices();
          const updatedVoiceForLang = updatedVoices.find(voice => voice.lang === lang || voice.lang.startsWith(lang + '-'));
          if (updatedVoiceForLang) {
              utterance.voice = updatedVoiceForLang;
          } else {
               console.warn(`No specific voice found for language: ${lang} after voices loaded. Using default.`);
          }
          window.speechSynthesis.speak(utterance);
          // Clean up the event listener
          window.speechSynthesis.onvoiceschanged = null;
      };
  } else {
      // Voices are already loaded
      window.speechSynthesis.speak(utterance);
  }
}
