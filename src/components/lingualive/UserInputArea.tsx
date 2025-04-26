'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Send, Bot, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast'; // Import useToast

interface UserInputAreaProps extends React.AriaAttributes {
  user: 'user1' | 'user2';
  language: string; // Language code for placeholder/actions and speech recognition
  onSend: (text: string, user: 'user1' | 'user2') => void;
  isSpeaking: boolean; // Indicates if the translation is processing
  placeholder?: string;
}

export function UserInputArea({
  user,
  language,
  onSend,
  isSpeaking,
  placeholder,
  ...ariaProps
}: UserInputAreaProps) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast(); // Get toast function

  // Moved these inside the component function body
  const isClient = typeof window !== 'undefined';
  // Check for SpeechRecognition API vendor prefixes only on the client
  const SpeechRecognition = isClient ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const recognitionSupported = !!SpeechRecognition;


   // Initialize SpeechRecognition
  useEffect(() => {
    // Ensure this runs only on the client and if supported
    if (!isClient || !recognitionSupported || !SpeechRecognition) {
        if (isClient && !recognitionSupported) {
            console.warn("Speech Recognition API not supported in this browser.");
        }
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop listening after a single utterance
    recognition.interimResults = false; // Get final results only
    recognition.lang = language; // Set the language for recognition

    recognition.onresult = (event) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setInputText(transcript);
      // Optionally auto-send after recognition:
      // handleSend(transcript);
      stopListening(); // Ensure listening stops after result
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      let errorMessage = 'Speech recognition error occurred.';
      if (event.error === 'no-speech') {
        errorMessage = 'No speech detected. Please try again.';
      } else if (event.error === 'audio-capture') {
        errorMessage = 'Microphone error. Please check permissions.';
      } else if (event.error === 'not-allowed') {
         errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
      }
       toast({ // Use toast for error feedback
        variant: "destructive",
        title: "Voice Input Error",
        description: errorMessage,
      });
      stopListening(); // Ensure listening stops on error
    };

     recognition.onend = () => {
      // Only set isListening to false if it wasn't manually stopped before onresult/onerror
      // Check ref existence to prevent state update after unmount or if manually stopped
       if (recognitionRef.current) {
           setIsListening(false);
       }
    };

    recognitionRef.current = recognition;

     // Cleanup function
    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.abort(); // Stop recognition if component unmounts
            recognitionRef.current = null; // Clear ref
        }
    };
    // Add SpeechRecognition to dependency array, although it shouldn't change after initial check
  }, [language, toast, isClient, recognitionSupported, SpeechRecognition]);

   // Update recognition language when the selected language changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language;
    }
  }, [language]);

  const startListening = useCallback(() => {
    // Check support again before starting
    if (!recognitionSupported || !SpeechRecognition) {
         toast({
            variant: "destructive",
            title: "Unsupported Feature",
            description: "Voice input is not supported by your browser.",
         });
         return;
    }
    if (recognitionRef.current && !isListening && !isSpeaking) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
           console.error("Failed to start speech recognition:", error);
           toast({
              variant: "destructive",
              title: "Voice Input Error",
              description: "Could not start voice input. Please try again.",
           });
           setIsListening(false); // Ensure listening state is reset on error
      }
    }
  }, [isListening, isSpeaking, toast, recognitionSupported, SpeechRecognition]); // Added SpeechRecognition to deps

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
       // Set ref to null *before* calling stop, so onend knows it was intentional
       const rec = recognitionRef.current;
       recognitionRef.current = null; // Indicate manual stop
       rec.stop();
      // onend might still fire, but the check inside onend will prevent setIsListening(false)
    }
    // Ensure state is false if called when not listening or after stopping
    setIsListening(false);
  }, [isListening]);

  const handleSend = useCallback(() => {
    const textToSend = inputText.trim();
    if (textToSend && !isSpeaking) {
       if (isListening) { // Stop listening only if it's active
          stopListening();
       }
       onSend(textToSend, user);
       setInputText('');
    }
  }, [inputText, onSend, user, isSpeaking, isListening, stopListening]); // Added isListening


  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const toggleListening = () => {
    // Check support before toggling
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
         {/* Only show warning on client if not supported */}
         {!recognitionSupported && isClient && (
             <div className="flex items-center text-destructive text-xs gap-1">
                <AlertCircle className="w-4 h-4" />
                Voice input not supported
             </div>
         )}
         {/* Only show Mic button on client if supported */}
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
         {/* Ensure the button takes space even if Mic button isn't rendered */}
         {(!recognitionSupported || !isClient) && <div />}

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
