'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Send, Bot, AlertCircle, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { LanguageCode } from '@/lib/languages';
import { Textarea } from '@/components/ui/textarea';

interface UserInputAreaProps extends React.AriaAttributes {
  user: 'user1' | 'user2';
  language: LanguageCode;
  onSend: (text: string, user: 'user1' | 'user2', isVoiceInput: boolean) => void;
  isTranslating: boolean;
  placeholder?: string;
  className?: string;
}

export function UserInputArea({
  user,
  language,
  onSend,
  isTranslating,
  placeholder,
  className,
  ...ariaProps
}: UserInputAreaProps) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const finalTranscriptRef = useRef(''); // Ref to store final transcript

  const isClient = typeof window !== 'undefined';
  const SpeechRecognition = isClient ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const recognitionSupported = !!SpeechRecognition;

   // Define stopListening using useCallback, referencing isListening
   const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
        try {
             recognitionRef.current.stop();
             console.log("Speech recognition stopped by user.");
             // onend will set isListening to false
        } catch (error) {
             console.error("Error stopping speech recognition:", error);
             setIsListening(false); // Force state update on error
        }
    } else {
         // If not listening or no ref, ensure state is false
         if (isListening) {
             setIsListening(false);
         }
    }
  }, [isListening]); // Dependency: isListening


  useEffect(() => {
    if (!isClient || !recognitionSupported || !SpeechRecognition) {
      if (isClient && !recognitionSupported) {
        console.warn("Speech Recognition API not supported in this browser.");
      }
      return;
    }

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Stop after first utterance
      recognitionRef.current.interimResults = false; // We only want final results
    }

    const recognition = recognitionRef.current;
    recognition.lang = language;

    const handleResult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      console.log("Voice recognized (final):", transcript);
      finalTranscriptRef.current = transcript; // Store final transcript
      // Note: We let the 'end' event handle sending and state reset
    };

    const handleError = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error, event.message);
      let errorMessage = 'Speech recognition error occurred.';
      if (event.error === 'no-speech') {
        console.log('No speech detected.');
        // Don't show toast for no-speech, just stop listening implicitly via onend
      } else if (event.error === 'audio-capture') {
        errorMessage = 'Microphone error. Please check permissions.';
      } else if (event.error === 'not-allowed') {
        errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
      } else {
        errorMessage = `Error: ${event.error}. ${event.message || ''}`;
      }
      if (event.error !== 'no-speech') {
          toast({
            variant: "destructive",
            title: "Voice Input Error",
            description: errorMessage,
          });
      }
       // 'onend' will be called after error, resetting state.
       // If stopListening needs to be called explicitly here for some reason:
       // stopListening();
    };

    const handleEnd = () => {
        console.log("Speech recognition ended.");
        setIsListening(false); // Always set listening to false when recognition ends
        const finalTranscript = finalTranscriptRef.current;
        if (finalTranscript) {
             console.log("Sending final transcript from onEnd:", finalTranscript);
             onSend(finalTranscript, user, true); // Send with isVoiceInput = true
             finalTranscriptRef.current = ''; // Clear the ref
        } else {
            console.log("No final transcript captured before end.");
        }
    };


    // Assign event handlers
    recognition.onresult = handleResult;
    recognition.onerror = handleError;
    recognition.onend = handleEnd;

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
         // Remove event listeners to prevent memory leaks
         recognitionRef.current.onresult = null;
         recognitionRef.current.onerror = null;
         recognitionRef.current.onend = null;
         // If recognition is active during unmount, try to abort
         if (isListening) {
           try {
               recognitionRef.current.abort();
               console.log("Speech recognition aborted on component unmount.");
           } catch (e) {
               console.warn("Error aborting recognition on cleanup:", e);
           }
           setIsListening(false); // Ensure state is reset
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
       finalTranscriptRef.current = ''; // Clear previous transcript
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
        if (domError.name === 'InvalidStateError') {
           console.warn("Attempted to start speech recognition while it might already be running.");
           // Don't toggle state here, let 'onend' or 'onerror' handle it.
           // If you're sure it's already listening, maybe call stopListening first?
           // Or just inform the user.
           userMessage = "Voice input might already be active or processing.";
        } else if (domError.name === 'NotAllowedError' || domError.name === 'SecurityError') {
           userMessage = "Microphone access was denied. Please allow access in browser settings.";
           setIsListening(false); // Ensure state is correct
        } else {
           setIsListening(false); // Reset state on other errors
        }
        toast({ variant: "destructive", title: "Voice Input Error", description: userMessage });
      }
    } else if (isTranslating) {
      toast({ title: "Busy", description: "Please wait for the current translation to finish." });
    } else if (isListening) {
        console.log("Already listening, calling stopListening.");
        stopListening(); // If already listening, stop it
    }
  }, [isListening, isTranslating, toast, recognitionSupported, SpeechRecognition, language, stopListening]);

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
        "flex flex-col gap-2 p-3 border rounded-lg bg-card shadow-sm w-full relative", // Removed md:w-1/2
        className
        )}>

        {/* Main Row: Mic button and Textarea/Send */}
        <div className="flex items-end gap-2"> {/* Use items-end for bottom alignment */}
            {/* Mic Button - Larger and Centered */}
            <Button
                variant={isListening ? "destructive" : "ghost"} // Change variant when listening
                size="lg" // Larger button
                onClick={toggleListening}
                disabled={isTranslating || !recognitionSupported}
                className={cn(
                    "p-3 rounded-full text-primary hover:bg-primary/10 aspect-square h-14 w-14", // Larger, rounded, aspect ratio
                    isListening && "bg-red-500 text-white hover:bg-red-600 animate-pulse", // Prominent listening state
                    (isTranslating || !recognitionSupported) && "opacity-50 cursor-not-allowed"
                )}
                aria-label={isListening ? "Stop listening" : "Start voice input"}
            >
                <Mic className="w-7 h-7" /> {/* Larger Icon */}
            </Button>

             {/* Text Input Area & Send Button */}
             <div className="flex-grow flex flex-col gap-1">
                 <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || 'Or type here...'}
                    className="flex-1 resize-none bg-input text-sm p-2 min-h-[40px]" // Adjusted styling, ensure min-height
                    rows={2} // Adjust rows as needed
                    disabled={isTranslating || isListening}
                    aria-label={placeholder || 'Type your message'}
                    {...ariaProps}
                />
                 {inputText && ( // Only show Send button if there is text
                     <Button
                        onClick={handleSendText}
                        disabled={!inputText.trim() || isTranslating || isListening}
                        size="sm"
                        aria-label="Send typed message"
                        className="px-3 py-1 self-end" // Align to the right
                    >
                        {isTranslating && inputText ? (
                        <Bot className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                        <Send className="w-4 h-4 mr-1" />
                        )}
                        Send
                    </Button>
                 )}
             </div>
        </div>

         {/* Helper Text for Voice Input */}
         <p className="text-xs text-muted-foreground text-center mt-1 px-2">
            {isListening ? "Listening..." : recognitionSupported ? "Tap the mic to speak" : "Voice input not supported"}
          </p>

        {/* Optional: Indication for unsupported browser - Moved under mic */}
        {/* {!recognitionSupported && isClient && (
            <div className="text-destructive text-xs gap-1 flex items-center justify-center mt-1">
               <AlertCircle className="w-3 h-3" />
               Voice not supported
            </div>
        )} */}
    </div>
  );
}
