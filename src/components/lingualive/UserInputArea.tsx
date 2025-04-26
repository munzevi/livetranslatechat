'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Send, Bot, Languages, AlertCircle, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import type { LanguageCode } from '@/lib/languages';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';

interface UserInputAreaProps extends React.AriaAttributes {
  user: 'user1' | 'user2';
  language: LanguageCode;
  onSend: (text: string, user: 'user1' | 'user2', isVoiceInput: boolean) => void;
  isTranslating: boolean;
  placeholder?: string;
  className?: string;
  showTextInput: boolean; // Receive state from parent
  onToggleTextInput?: () => void; // Optional prop for mobile toggle button
}

export function UserInputArea({
  user,
  language,
  onSend,
  isTranslating,
  placeholder,
  className,
  showTextInput,
  onToggleTextInput,
  ...ariaProps
}: UserInputAreaProps) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false); // Default to false for SSR
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const finalTranscriptRef = useRef(''); // Ref to store final transcript
  const isMobile = useIsMobile();

  // Check for SpeechRecognition support *after* mount
  useEffect(() => {
    const supported = !!(typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));
    setRecognitionSupported(supported);
    // Log warning only on client if not supported, after check
    if (typeof window !== 'undefined' && !supported) {
        console.warn("Speech Recognition API not supported in this browser.");
    }
  }, []); // Empty dependency array ensures this runs only once on mount


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
    // Setup recognition only if supported and on the client
    if (!recognitionSupported || typeof window === 'undefined') {
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return; // Safety check

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
    }

    const recognition = recognitionRef.current;
    recognition.lang = language;

    const handleResult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      console.log("Voice recognized (final):", transcript);
      finalTranscriptRef.current = transcript;
    };

    const handleError = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error, event.message);
      let errorMessage = 'Speech recognition error occurred.';
      if (event.error === 'no-speech') {
        console.log('No speech detected.');
        // No toast for no-speech
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
    };

    const handleEnd = () => {
        console.log("Speech recognition ended.");
        setIsListening(false);
        const finalTranscript = finalTranscriptRef.current;
        if (finalTranscript) {
             console.log("Sending final transcript from onEnd:", finalTranscript);
             onSend(finalTranscript, user, true);
             finalTranscriptRef.current = '';
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
         recognitionRef.current.onresult = null;
         recognitionRef.current.onerror = null;
         recognitionRef.current.onend = null;
         if (isListening) {
           try {
               recognitionRef.current.abort();
               console.log("Speech recognition aborted on component unmount.");
           } catch (e) {
               console.warn("Error aborting recognition on cleanup:", e);
           }
           setIsListening(false);
         }
      }
    };
    // Add recognitionSupported to dependencies
  }, [language, toast, onSend, user, stopListening, isListening, recognitionSupported]);


  const startListening = useCallback(() => {
    // Check support state first
    if (!recognitionSupported) {
      toast({ variant: "destructive", title: "Unsupported Feature", description: "Voice input is not supported by your browser." });
      return;
    }
    if (!recognitionRef.current) {
      console.error("Speech recognition instance not available.");
      toast({ variant: "destructive", title: "Error", description: "Could not initialize voice input." });
      return;
    }

    if (!isListening && !isTranslating) {
       finalTranscriptRef.current = '';
      try {
        recognitionRef.current.lang = language;
        console.log(`Starting speech recognition for language: ${language}`);
        recognitionRef.current.start();
        setIsListening(true);
        setInputText('');
      } catch (error) {
        console.error("Failed to start speech recognition:", error);
        const domError = error as DOMException;
        let userMessage = "Could not start voice input. Check microphone and permissions.";
        if (domError.name === 'InvalidStateError') {
           console.warn("Attempted to start speech recognition while it might already be running.");
           userMessage = "Voice input might already be active or processing.";
        } else if (domError.name === 'NotAllowedError' || domError.name === 'SecurityError') {
           userMessage = "Microphone access was denied. Please allow access in browser settings.";
           setIsListening(false);
        } else {
           setIsListening(false);
        }
        toast({ variant: "destructive", title: "Voice Input Error", description: userMessage });
      }
    } else if (isTranslating) {
      toast({ title: "Busy", description: "Please wait for the current translation to finish." });
    } else if (isListening) {
        console.log("Already listening, calling stopListening.");
        stopListening();
    }
    // Add recognitionSupported dependency
  }, [isListening, isTranslating, toast, recognitionSupported, language, stopListening]);

  const handleSendText = useCallback(() => {
    const textToSend = inputText.trim();
    if (textToSend && !isTranslating && !isListening) {
      console.log("Sending text:", textToSend);
      onSend(textToSend, user, false);
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
    // Check support state first
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

  // Determine helper text content *after* mount based on recognitionSupported state
  const micHelperText = isListening
    ? "Listening..."
    : recognitionSupported
    ? "Tap the mic to speak"
    : "Voice input not supported";

  return (
    <div className={cn(
        "flex flex-col items-center gap-2 p-2 sm:p-3 border rounded-lg bg-card shadow-sm w-full relative",
        className
    )}>

        {/* Mic Button - Always visible, larger */}
        <Button
            variant={isListening ? "destructive" : "ghost"}
            size="lg"
            onClick={toggleListening}
            disabled={isTranslating || !recognitionSupported}
            className={cn(
                "p-3 rounded-full text-primary hover:bg-primary/10 aspect-square h-16 w-16 sm:h-20 sm:w-20",
                isListening && "bg-red-500 text-white hover:bg-red-600 animate-pulse",
                (isTranslating || !recognitionSupported) && "opacity-50 cursor-not-allowed"
            )}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
        >
            <Mic className="w-8 h-8 sm:w-10 sm:h-10" />
        </Button>

         {/* Helper Text for Voice Input */}
         <p className="text-xs text-muted-foreground text-center -mt-1 mb-1 px-2">
            {micHelperText}
         </p>

         {/* Mobile: Toggle Text Input Button */}
         {isMobile && onToggleTextInput && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleTextInput}
                    className="shadow text-xs h-7 px-2 mb-2"
                >
                    {showTextInput ? <Mic className="mr-1 h-3 w-3" /> : <Keyboard className="mr-1 h-3 w-3" />}
                    {showTextInput ? 'Use Voice Only' : 'Type Message'}
                </Button>
         )}

         {/* Text Input Area & Send Button - Conditionally Rendered */}
         {showTextInput && (
            <div className="w-full flex flex-col gap-1 items-stretch">
                <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder || 'Or type here...'}
                    className="flex-1 resize-none bg-input text-sm p-2 min-h-[40px] sm:min-h-[50px]"
                    rows={2}
                    disabled={isTranslating || isListening}
                    aria-label={placeholder || 'Type your message'}
                    {...ariaProps}
                />
                {/* Only show Send button if there is text */}
                {inputText && (
                    <Button
                        onClick={handleSendText}
                        disabled={!inputText.trim() || isTranslating || isListening}
                        size="sm"
                        aria-label="Send typed message"
                        className="px-3 py-1 self-end mt-1 text-xs h-7"
                    >
                        {isTranslating && inputText ? (
                        <Bot className="w-3 h-3 animate-spin mr-1" />
                        ) : (
                        <Send className="w-3 h-3 mr-1" />
                        )}
                        Send
                    </Button>
                )}
            </div>
         )}

        {/* Optional: Indication for unsupported browser - Show based on state after mount */}
        {typeof window !== 'undefined' && !recognitionSupported && !showTextInput && (
            <div className="text-destructive text-xs gap-1 flex items-center justify-center mt-1">
               <AlertCircle className="w-3 h-3" />
               Voice not supported
            </div>
        )}
    </div>
  );
}
