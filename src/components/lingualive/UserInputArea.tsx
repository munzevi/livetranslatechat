'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Send, Bot, AlertCircle, Languages } from 'lucide-react'; // Keep Send for potential text input later, Languages for visual cue
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { LanguageCode } from '@/lib/languages';
import { Textarea } from '@/components/ui/textarea'; // Keep textarea for text input fallback

interface UserInputAreaProps extends React.AriaAttributes {
  user: 'user1' | 'user2';
  language: LanguageCode;
  onSend: (text: string, user: 'user1' | 'user2', isVoiceInput: boolean) => void; // isVoiceInput flag determines how it was sent
  isTranslating: boolean;
  placeholder?: string;
  className?: string; // Allow custom styling
}

export function UserInputArea({
  user,
  language,
  onSend,
  isTranslating,
  placeholder,
  className, // Destructure className
  ...ariaProps
}: UserInputAreaProps) {
  const [inputText, setInputText] = useState(''); // State for text input
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  const isClient = typeof window !== 'undefined';
  const SpeechRecognition = isClient ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const recognitionSupported = !!SpeechRecognition;

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
        try {
             recognitionRef.current.stop();
             console.log("Speech recognition stopped by user.");
        } catch (error) {
             console.error("Error stopping speech recognition:", error);
        }
        // onend event will set isListening to false
    } else {
        setIsListening(false); // Ensure state is false if not listening
    }
  }, [isListening]);


  useEffect(() => {
    if (!isClient || !recognitionSupported || !SpeechRecognition) {
        if (isClient && !recognitionSupported) {
            console.warn("Speech Recognition API not supported in this browser.");
        }
        return;
    }

    if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
    }

    const recognition = recognitionRef.current;
    recognition.lang = language;

    const handleResult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      console.log("Voice recognized:", transcript);
      onSend(transcript, user, true); // Send with isVoiceInput = true
      // stopListening is called implicitly via onend
    };

    const handleError = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error, event.message);
      let errorMessage = 'Speech recognition error occurred.';
       if (event.error === 'no-speech') {
         // Don't show toast for no-speech, just stop listening
         console.log('No speech detected.');
         stopListening();
         return; // Exit early
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
      stopListening(); // Ensure state is reset on error
    };

    const handleEnd = () => {
        console.log("Speech recognition ended.");
        setIsListening(false); // Set listening to false when recognition ends
    };

    recognition.onresult = handleResult;
    recognition.onerror = handleError;
    recognition.onend = handleEnd;

    return () => {
        if (recognitionRef.current) {
            recognition.onresult = null;
            recognition.onerror = null;
            recognition.onend = null;
            if (isListening) {
                try { recognitionRef.current.abort(); } catch (e) { console.warn("Error aborting recognition on cleanup:", e); }
            }
        }
    };
  }, [language, toast, isClient, recognitionSupported, SpeechRecognition, onSend, user, stopListening, isListening]);


  const startListening = useCallback(() => {
    if (!recognitionSupported || !SpeechRecognition) {
         toast({ variant: "destructive", title: "Unsupported Feature", description: "Voice input is not supported by your browser." });
         return;
    }
    if (!recognitionRef.current) {
        console.error("Speech recognition instance not available.");
        toast({ variant: "destructive", title: "Error", description: "Could not initialize voice input." });
        return;
    }

    if (!isListening && !isTranslating) {
      try {
        recognitionRef.current.lang = language;
        console.log(`Starting speech recognition for language: ${language}`);
        recognitionRef.current.start();
        setIsListening(true);
        setInputText(''); // Clear text input when starting voice
      } catch (error) {
           console.error("Failed to start speech recognition:", error);
           const domError = error as DOMException;
           let userMessage = "Could not start voice input. Check microphone and permissions.";
           // Handle specific errors... (as before)
            if (domError.name === 'InvalidStateError') {
                console.warn("Attempted to start speech recognition in an invalid state.");
                setIsListening(true); // Assume it's already listening
                userMessage = "Already listening or processing.";
           } else if (domError.name === 'NotAllowedError' || domError.name === 'SecurityError') {
                 userMessage = "Microphone access was denied. Please allow access in browser settings.";
                 setIsListening(false);
           } else {
                setIsListening(false); // Reset state on other errors
           }
           toast({ variant: "destructive", title: "Voice Input Error", description: userMessage });
      }
    } else if (isTranslating) {
        toast({ title: "Busy", description: "Please wait for the current translation to finish." });
    }
  }, [isListening, isTranslating, toast, recognitionSupported, SpeechRecognition, language]);

  const handleSendText = useCallback(() => {
    const textToSend = inputText.trim();
    if (textToSend && !isTranslating && !isListening) {
       console.log("Sending text:", textToSend);
       onSend(textToSend, user, false); // Send with isVoiceInput = false
       setInputText('');
    }
  }, [inputText, onSend, user, isTranslating, isListening]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendText();
    }
  };

  const toggleListening = () => {
     if (!recognitionSupported) {
         toast({ variant: "destructive", title: "Unsupported Feature", description: "Voice input is not supported by your browser." });
         return;
    }
    if (isListening) {
      stopListening();
    } else if (!isTranslating) {
      startListening();
    } else {
         toast({ title: "Busy", description: "Cannot start voice input while translating." });
    }
  };


  return (
    <div className={cn(
        "flex flex-col gap-2 p-3 border rounded-lg bg-card shadow-sm w-full md:w-1/2 relative", // Added relative positioning
        className // Apply passed className
        )}>
        {/* Textarea for manual input */}
        <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Or type here...'}
            className="flex-1 resize-none bg-input text-sm p-2" // Basic styling
            rows={2}
            disabled={isTranslating || isListening}
            aria-label={placeholder || 'Type your message'} // More specific aria-label
            {...ariaProps} // Spread ariaProps here
        />

       <div className="flex justify-between items-center mt-1">
            {/* Mic Button - More prominent */}
            <Button
                variant="ghost"
                size="icon" // Make it a standard icon button size
                onClick={toggleListening}
                disabled={isTranslating || !recognitionSupported}
                className={cn(
                    "text-muted-foreground hover:text-primary rounded-full", // Rounded mic button
                     isListening && "text-red-500 animate-pulse bg-red-100/50 dark:bg-red-900/50", // More prominent listening state
                     (isTranslating || !recognitionSupported) && "opacity-50 cursor-not-allowed"
                 )}
                 aria-label={isListening ? "Stop listening" : "Start voice input"}
            >
                <Mic className="w-5 h-5" />
            </Button>

             {/* Send Button for Text Input */}
             <Button
                onClick={handleSendText}
                disabled={!inputText.trim() || isTranslating || isListening}
                size="sm" // Smaller send button
                aria-label="Send typed message"
                className="px-3 py-1" // Compact padding
              >
                {isTranslating && inputText ? ( // Only show spinner if sending THIS text input is translating
                  <Bot className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Send className="w-4 h-4 mr-1" />
                )}
                Send
              </Button>
       </div>

        {/* Optional: Indication for unsupported browser */}
        {!recognitionSupported && isClient && (
            <div className="absolute bottom-2 left-2 flex items-center text-destructive text-xs gap-1 pointer-events-none">
               <AlertCircle className="w-3 h-3" />
               Voice not supported
            </div>
        )}
    </div>
  );
}
