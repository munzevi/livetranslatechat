'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Send, Bot, AlertCircle, Volume2 } from 'lucide-react'; // Added Volume2 for speaking indicator
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast'; // Import useToast
import type { LanguageCode } from '@/lib/languages'; // Use LanguageCode type

interface UserInputAreaProps extends React.AriaAttributes {
  user: 'user1' | 'user2';
  language: LanguageCode; // Language code for placeholder/actions and speech recognition
  targetLanguage: LanguageCode; // Target language for TTS
  onSend: (text: string, user: 'user1' | 'user2', isVoiceInput?: boolean, targetLangForTTS?: LanguageCode) => void; // Added targetLangForTTS
  isTranslating: boolean; // Renamed from isSpeaking to avoid confusion with TTS
  placeholder?: string;
}

export function UserInputArea({
  user,
  language,
  targetLanguage, // Receive target language
  onSend,
  isTranslating, // Use translating state
  placeholder,
  ...ariaProps
}: UserInputAreaProps) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  const isClient = typeof window !== 'undefined';
  const SpeechRecognition = isClient ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const recognitionSupported = !!SpeechRecognition;


  // Define stopListening *before* the useEffect that uses it
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
        try {
            // Check if recognition is running before stopping
            // Some browsers throw an error if stop() is called when not running
             recognitionRef.current.stop();
        } catch (error) {
             console.error("Error stopping speech recognition:", error);
             // Potentially handle specific stop errors if needed, e.g., InvalidStateError
        } finally {
             // Ensure state is updated regardless of stop success/failure
             // Let the onend event handle setting isListening to false
             // setIsListening(false); // Remove this - handled by onend
        }
    } else {
        // If stopListening is called when not listening (e.g., due to error/end event), just ensure state is false
        setIsListening(false);
    }
  }, [isListening]); // Dependencies for stopListening


   // Initialize SpeechRecognition
  useEffect(() => {
    if (!isClient || !recognitionSupported || !SpeechRecognition) {
        if (isClient && !recognitionSupported) {
            console.warn("Speech Recognition API not supported in this browser.");
        }
        return;
    }

    // Create instance only if not already created
    // Avoid re-creating if language changes, just update the lang property
    if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false; // Stop listening after a single utterance
        recognitionRef.current.interimResults = false; // Get final results only
    }


    const recognition = recognitionRef.current;
    recognition.lang = language; // Update language immediately

    // Define handlers within useEffect or ensure they are stable references using useCallback if needed
    const handleResult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      console.log("Voice recognized:", transcript);
      // Pass the target language for TTS along with the transcript
      onSend(transcript, user, true, targetLanguage);
      // No need to call stopListening() here as onend will fire and set state
    };

    const handleError = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error, event.message);
      let errorMessage = 'Speech recognition error occurred.';
      if (event.error === 'no-speech') {
        errorMessage = 'No speech detected. Please try again.';
      } else if (event.error === 'audio-capture') {
        errorMessage = 'Microphone error. Please check permissions.';
      } else if (event.error === 'not-allowed') {
         errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
      } else {
         errorMessage = `Error: ${event.error}. ${event.message || ''}`;
      }
       toast({
        variant: "destructive",
        title: "Voice Input Error",
        description: errorMessage,
      });
      // Ensure listening state is reset on error - call stopListening to handle state
      stopListening();
    };

     const handleEnd = () => {
        console.log("Speech recognition ended.");
        // Set listening to false when recognition ends naturally or is stopped
        setIsListening(false);
        // Keep the recognitionRef.current instance for potential restarts
    };

    // Assign event handlers
    recognition.onresult = handleResult;
    recognition.onerror = handleError;
    recognition.onend = handleEnd;

     // Cleanup function
    return () => {
        if (recognitionRef.current) {
            // Remove event listeners to prevent memory leaks
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
            // Abort any ongoing recognition if component unmounts while listening
            if (isListening) {
                try {
                    recognitionRef.current.abort();
                } catch (e) {
                     console.warn("Error aborting recognition on cleanup:", e);
                }
            }
            // Don't nullify ref on cleanup, keep it for potential restart
            // recognitionRef.current = null;
        }
    };
    // Dependencies: Need to re-run if dependencies change. `stopListening` depends on `isListening`.
  }, [language, toast, isClient, recognitionSupported, SpeechRecognition, onSend, user, targetLanguage, stopListening, isListening]);


  // Update recognition language dynamically when the selected language changes
  // This is handled inside the main useEffect now by setting recognition.lang = language
  // useEffect(() => {
  //   if (recognitionRef.current) {
  //     recognitionRef.current.lang = language;
  //   }
  // }, [language]);

  const startListening = useCallback(() => {
    if (!recognitionSupported || !SpeechRecognition) {
         toast({
            variant: "destructive",
            title: "Unsupported Feature",
            description: "Voice input is not supported by your browser.",
         });
         return;
    }
    // Ensure we have a recognition instance
    if (!recognitionRef.current) {
        console.error("Speech recognition instance not available.");
        toast({ variant: "destructive", title: "Error", description: "Could not initialize voice input." });
        return;
    }

    if (!isListening && !isTranslating) { // Check !isTranslating as well
      try {
        // Update language just before starting - ensure it's current
        recognitionRef.current.lang = language;
        console.log(`Starting speech recognition for language: ${language}`);
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
           console.error("Failed to start speech recognition:", error);
           const domError = error as DOMException;
           let userMessage = "Could not start voice input. Check microphone and permissions.";
           if (domError.name === 'InvalidStateError') {
                // Already listening, or stopping/starting too quickly.
                console.warn("Attempted to start speech recognition in an invalid state.");
                // Might already be listening, ensure state reflects this
                setIsListening(true);
                userMessage = "Already listening or processing."; // More informative
           } else if (domError.name === 'NotAllowedError' || domError.name === 'SecurityError') {
                 userMessage = "Microphone access was denied. Please allow access in browser settings.";
                setIsListening(false);
           } else if (domError.name === 'AbortError') {
                 userMessage = "Speech recognition was aborted.";
                 setIsListening(false);
           } else if (domError.name === 'NetworkError') {
                 userMessage = "Network error during speech recognition.";
                 setIsListening(false);
            } else if (domError.name === 'AudioCaptureError') {
                 userMessage = "Microphone capture error.";
                 setIsListening(false);
            } else {
                 setIsListening(false); // Reset state on other errors
            }
           toast({
               variant: "destructive",
               title: "Voice Input Error",
               description: userMessage,
           });
      }
    } else if (isTranslating) {
        toast({
            title: "Busy",
            description: "Please wait for the current translation to finish.",
        });
    }
  }, [isListening, isTranslating, toast, recognitionSupported, SpeechRecognition, language]); // Added language, isTranslating


  const handleSend = useCallback(() => {
    const textToSend = inputText.trim();
    if (textToSend && !isTranslating && !isListening) { // Check isTranslating and isListening
       // Text input: isVoiceInput is false, no specific targetLangForTTS needed here (handled in main component)
       console.log("Sending text:", textToSend);
       onSend(textToSend, user, false);
       setInputText('');
    }
  }, [inputText, onSend, user, isTranslating, isListening]); // Added isTranslating, isListening


  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const toggleListening = () => {
     if (!recognitionSupported) {
         toast({
            variant: "destructive",
            title: "Unsupported Feature",
            description: "Voice input is not supported by your browser.",
         });
         return;
    }
    if (isListening) {
      console.log("Stopping listening via toggle button");
      stopListening();
    } else if (!isTranslating) { // Only start if not currently translating
      setInputText(''); // Clear text input when starting voice
      startListening();
    } else {
         toast({
            title: "Busy",
            description: "Cannot start voice input while translating.",
        });
    }
  };


  return (
    <div className="flex flex-col gap-2 p-4 border rounded-lg bg-card shadow-sm w-full md:w-1/2">
      <Textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Type or use voice input...'}
        className="flex-1 resize-none bg-input"
        rows={2}
        disabled={isTranslating || isListening} // Disable textarea while translating or listening
        {...ariaProps}
      />
      <div className="flex justify-between items-center">
         {!recognitionSupported && isClient && (
             <div className="flex items-center text-destructive text-xs gap-1">
                <AlertCircle className="w-4 h-4" />
                Voice input not supported
             </div>
         )}
         {recognitionSupported && isClient && (
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleListening}
                disabled={isTranslating} // Disable mic button while translating
                className={cn(
                    "text-muted-foreground hover:text-primary",
                    isListening && "text-destructive animate-pulse",
                    isTranslating && "text-muted-foreground opacity-50 cursor-not-allowed" // Style when disabled due to translation
                 )}
                aria-label={isListening ? "Stop listening" : "Start voice input"}
            >
                <Mic className="w-5 h-5" />
            </Button>
         )}
         {(!recognitionSupported || !isClient) && <div className="w-10 h-10" />} {/* Placeholder to maintain layout */}

         <Button
            onClick={handleSend}
            disabled={!inputText.trim() || isTranslating || isListening} // Disable send if no text, translating, or listening
            size="sm"
            aria-label="Send message"
          >
            {isTranslating ? (
              <Bot className="w-4 h-4 animate-spin mr-1" /> // Show translating icon
            ) : (
              <Send className="w-4 h-4 mr-1" />
            )}
            Send
          </Button>
      </div>
    </div>
  );
}
