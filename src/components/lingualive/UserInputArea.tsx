'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Send, Bot, AlertCircle, Keyboard } from 'lucide-react';
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
  const [recognitionSupported, setRecognitionSupported] = useState<boolean>(false); // Default to false for SSR
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();
  const finalTranscriptRef = useRef(''); // Ref to store final transcript
  const isMobile = useIsMobile();
  const [clientSideRendered, setClientSideRendered] = useState(false); // Hydration fix state

  // Hydration Fix: Set state only after component mounts
  useEffect(() => {
    const supported = !!(typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition));
    setRecognitionSupported(supported);
    setClientSideRendered(true);
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
      recognitionRef.current.continuous = false; // Stop after first result? Consider true for longer dictation.
      recognitionRef.current.interimResults = false; // We only want final results
    }

    const recognition = recognitionRef.current;
    recognition.lang = language;

    const handleResult = (event: SpeechRecognitionEvent) => {
       // Get the final transcript from the last result segment
       const transcript = event.results[event.results.length - 1][0].transcript.trim();
       console.log("Voice recognized (final):", transcript);
       finalTranscriptRef.current = transcript; // Store final transcript

       // Don't send immediately from here if continuous is false, wait for 'end'
       // If continuous were true, you might send here or accumulate.
    };

    const handleError = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error, event.message);
      let errorMessage = 'Speech recognition error occurred.';
      if (event.error === 'no-speech') {
        console.log('No speech detected.');
        // No toast for no-speech, it's common
        errorMessage = ''; // Clear error message for no-speech
      } else if (event.error === 'audio-capture') {
        errorMessage = 'Microphone error. Please check permissions.';
      } else if (event.error === 'not-allowed') {
        errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
      } else {
        errorMessage = `Error: ${event.error}. ${event.message || ''}`;
      }

      if (errorMessage) { // Only show toast if there's an actual error message
          toast({
            variant: "destructive",
            title: "Voice Input Error",
            description: errorMessage,
          });
      }
      setIsListening(false); // Ensure listening state is reset on error
      finalTranscriptRef.current = ''; // Clear any potentially captured transcript on error
    };

     const handleEnd = () => {
        console.log("Speech recognition ended.");
        setIsListening(false); // Update state when recognition naturally ends or is stopped
        const finalTranscript = finalTranscriptRef.current;
        // Send the transcript captured before 'end' was triggered
        if (finalTranscript) {
             console.log("Sending final transcript from onEnd:", finalTranscript);
             onSend(finalTranscript, user, true); // Send with isVoiceInput=true
             finalTranscriptRef.current = ''; // Clear ref after sending
        } else {
            console.log("No final transcript captured before end.");
             // Optionally handle the case where speech ended without capturing anything (e.g., silence timeout)
             // Maybe a subtle feedback or just ignore.
        }
    };


    // Assign event handlers
    recognition.onresult = handleResult;
    recognition.onerror = handleError;
    recognition.onend = handleEnd; // Use onend to send the final transcript

    // Cleanup function
    return () => {
      if (recognitionRef.current) {
         recognitionRef.current.onresult = null;
         recognitionRef.current.onerror = null;
         recognitionRef.current.onend = null;
         if (isListening) { // Check isListening state before aborting
           try {
               recognitionRef.current.abort(); // Abort if still listening on unmount
               console.log("Speech recognition aborted on component unmount/cleanup.");
           } catch (e) {
               console.warn("Error aborting recognition on cleanup:", e);
           }
           setIsListening(false); // Ensure state is false on cleanup
         }
      }
    };
    // stopListening removed as explicit dependency, useEffect cleanup handles stopping/aborting
  }, [language, toast, onSend, user, recognitionSupported, isListening]); // isListening added


  const startListening = useCallback(() => {
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
       finalTranscriptRef.current = ''; // Clear previous transcript before starting
       setInputText(''); // Clear text input when starting voice
      try {
        recognitionRef.current.lang = language; // Ensure language is up-to-date
        console.log(`Starting speech recognition for language: ${language}`);
        recognitionRef.current.start();
        setIsListening(true); // Set listening state immediately
      } catch (error) {
        console.error("Failed to start speech recognition:", error);
        const domError = error as DOMException;
        let userMessage = "Could not start voice input. Check microphone and permissions.";
        if (domError.name === 'InvalidStateError') {
           console.warn("Attempted to start speech recognition while it might already be running or stopping.");
           // It might already be stopping, let the onend handle state. Don't toast.
           userMessage = ""; // No user message for this specific case
           // Check if it's *actually* still listening
           if (isListening) {
               console.log("Already listening, attempt to stop first.");
               stopListening(); // Try stopping if state says it's listening
           } else {
               // If not listening, perhaps it's safe to try starting again after a short delay?
               // Or just inform the user it's in a weird state. For now, do nothing extra.
           }
        } else if (domError.name === 'NotAllowedError' || domError.name === 'SecurityError') {
           userMessage = "Microphone access was denied. Please allow access in browser settings.";
           setIsListening(false); // Ensure state is false if permission denied
        } else {
           setIsListening(false); // Reset state on other errors
        }
        if (userMessage) { // Only toast if there is a message
            toast({ variant: "destructive", title: "Voice Input Error", description: userMessage });
        }
      }
    } else if (isTranslating) {
      toast({ title: "Busy", description: "Please wait for the current translation to finish." });
    }
    // Removed the isListening check here, handled by stopListening call below
  }, [isListening, isTranslating, toast, recognitionSupported, language, stopListening]); // stopListening added

  const handleSendText = useCallback(() => {
    const textToSend = inputText.trim();
    if (textToSend && !isTranslating && !isListening) {
      console.log("Sending text:", textToSend);
      onSend(textToSend, user, false); // Send with isVoiceInput=false
      setInputText('');
    }
  }, [inputText, onSend, user, isTranslating, isListening]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendText();
    }
  };

  const toggleListening = useCallback(() => {
    if (!recognitionSupported) {
      toast({ variant: "destructive", title: "Unsupported Feature", description: "Voice input is not supported by your browser." });
      return;
    }
    if (isListening) {
      console.log("toggleListening: Stopping listening.");
      stopListening();
    } else if (!isTranslating) {
      console.log("toggleListening: Starting listening.");
      startListening();
    } else {
      toast({ title: "Busy", description: "Cannot start voice input while translating." });
    }
  }, [isListening, isTranslating, recognitionSupported, startListening, stopListening, toast]);


  // Hydration fix: Render placeholder or null during SSR/hydration phase
   if (!clientSideRendered) {
    return (
        <div className={cn(
            "flex flex-col items-center gap-2 p-2 sm:p-3 border rounded-lg bg-card shadow-sm w-full relative min-h-[150px] justify-center", // Ensure some height
            className
        )}>
            {/* Optional: You can add a skeleton loader here */}
        </div>
    );
  }

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
            size="lg" // Use Shadcn's size prop
            onClick={toggleListening}
            disabled={isTranslating || !recognitionSupported}
            className={cn(
                "p-0 rounded-full text-primary hover:bg-primary/10 aspect-square h-20 w-20 sm:h-24 sm:w-24 flex items-center justify-center", // Ensure icon centering
                isListening && "bg-red-500 text-white hover:bg-red-600 animate-pulse",
                (isTranslating || !recognitionSupported) && "opacity-50 cursor-not-allowed"
            )}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
        >
             {/* Adjusted icon size to better fit the button */}
            <Mic className="w-10 h-10 sm:w-12 sm:h-12" />
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
                    {/* Changed text here */}
                    {showTextInput ? 'Use Voice Only' : 'Tap to write text messages'}
                </Button>
         )}

         {/* Text Input Area & Send Button - Conditionally Rendered */}
         {/* This part only shows if showTextInput is true */}
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
                {/* Only show Send button if there is text and not listening */}
                {inputText.trim() && !isListening && (
                    <Button
                        onClick={handleSendText}
                        disabled={!inputText.trim() || isTranslating}
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
        {clientSideRendered && !recognitionSupported && !showTextInput && (
            <div className="text-destructive text-xs gap-1 flex items-center justify-center mt-1">
               <AlertCircle className="w-3 h-3" />
               Voice not supported
            </div>
        )}
    </div>
  );
}
