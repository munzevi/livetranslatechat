'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Send, Bot, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast'; // Import useToast
import type { LanguageCode } from '@/lib/languages'; // Use LanguageCode type

interface UserInputAreaProps extends React.AriaAttributes {
  user: 'user1' | 'user2';
  language: LanguageCode; // Language code for placeholder/actions and speech recognition
  targetLanguage: LanguageCode; // Target language for TTS
  onSend: (text: string, user: 'user1' | 'user2', isVoiceInput?: boolean, targetLangForTTS?: LanguageCode) => void; // Added targetLangForTTS
  isSpeaking: boolean; // Indicates if the translation is processing
  placeholder?: string;
}

export function UserInputArea({
  user,
  language,
  targetLanguage, // Receive target language
  onSend,
  isSpeaking,
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
             setIsListening(false);
             // Let the onend event handle the state, don't nullify ref here
             // recognitionRef.current = null; // Avoid nullifying here
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

    // Create instance only if not already created (or if language changes and needs re-init)
    if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false; // Stop listening after a single utterance
        recognitionRef.current.interimResults = false; // Get final results only
    }

    const recognition = recognitionRef.current;
    recognition.lang = language; // Update language

    // Define handlers within useEffect or ensure they are stable references
    const handleResult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      // Pass the target language for TTS along with the transcript
      onSend(transcript, user, true, targetLanguage);
      // Stop listening after result is processed
      // No need to call stopListening() here as onend will fire
      // stopListening(); // Remove this call
    };

    const handleError = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = 'Speech recognition error occurred.';
      if (event.error === 'no-speech') {
        errorMessage = 'No speech detected. Please try again.';
      } else if (event.error === 'audio-capture') {
        errorMessage = 'Microphone error. Please check permissions.';
      } else if (event.error === 'not-allowed') {
         errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
      }
       toast({
        variant: "destructive",
        title: "Voice Input Error",
        description: errorMessage,
      });
      // Ensure listening stops on error
      stopListening(); // Call stopListening on error
    };

     const handleEnd = () => {
        // Set listening to false when recognition ends naturally or is stopped
        setIsListening(false);
        // Don't nullify ref on end, keep it for potential restart
        // recognitionRef.current = null;
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
            // Abort any ongoing recognition
            recognitionRef.current.abort();
            // Optionally nullify ref on unmount, but usually not needed if managed properly
             // recognitionRef.current = null;
        }
    };
    // onSend, user, targetLanguage, and stopListening are dependencies now
  }, [language, toast, isClient, recognitionSupported, SpeechRecognition, onSend, user, targetLanguage, stopListening]);


  // Update recognition language when the selected language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

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

    if (!isListening && !isSpeaking) {
      try {
        // Update language just before starting
        recognitionRef.current.lang = language;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
           console.error("Failed to start speech recognition:", error);
           const domError = error as DOMException;
           if (domError.name === 'InvalidStateError') {
                // Already listening, perhaps? Or stopping/starting too quickly.
                // console.warn("Attempted to start speech recognition in an invalid state.");
                // Optionally provide feedback or just ignore:
                // toast({ variant: "default", title: "Voice Input", description: "Already listening." });
                setIsListening(true); // Ensure state reflects potential listening state
           } else if (domError.name === 'NotAllowedError') {
                toast({ variant: "destructive", title: "Permission Denied", description: "Microphone access was denied." });
                setIsListening(false);
           } else {
               toast({
                  variant: "destructive",
                  title: "Voice Input Error",
                  description: "Could not start voice input. Check microphone and permissions.",
               });
                setIsListening(false); // Reset state on other errors
           }
      }
    }
  }, [isListening, isSpeaking, toast, recognitionSupported, SpeechRecognition, language]); // Added language


  const handleSend = useCallback(() => {
    const textToSend = inputText.trim();
    if (textToSend && !isSpeaking && !isListening) { // Also disable send if listening
       // Text input: isVoiceInput is false, no specific targetLangForTTS needed here (handled in main component)
       onSend(textToSend, user, false);
       setInputText('');
    }
  }, [inputText, onSend, user, isSpeaking, isListening]); // Added isListening


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
      stopListening();
    } else {
      setInputText('');
      startListening();
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
        disabled={isSpeaking || isListening} // Disable textarea while speaking/listening
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
                disabled={isSpeaking} // Disable mic button while translating
                className={cn("text-muted-foreground hover:text-primary", isListening && "text-destructive animate-pulse")}
                aria-label={isListening ? "Stop listening" : "Start voice input"}
            >
                <Mic className="w-5 h-5" />
            </Button>
         )}
         {(!recognitionSupported || !isClient) && <div className="w-10 h-10" />} {/* Placeholder to maintain layout */}

         <Button
            onClick={handleSend}
            disabled={!inputText.trim() || isSpeaking || isListening} // Disable send if no text, translating, or listening
            size="sm"
            aria-label="Send message"
          >
            {isSpeaking ? (
              <Bot className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <Send className="w-4 h-4 mr-1" />
            )}
            Send
          </Button>
      </div>
    </div>
  );
}
