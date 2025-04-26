'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { LanguageSelector } from '@/components/lingualive/LanguageSelector';
import { ConversationView } from '@/components/lingualive/ConversationView';
import { UserInputArea } from '@/components/lingualive/UserInputArea';
import { Card, CardContent } from '@/components/ui/card';
import { translateText, type TranslationRequest, type TranslationResult } from '@/services/translation';
import type { Message } from '@/components/lingualive/TranslationBubble';
import { languages, type LanguageCode } from '@/lib/languages';
import { Separator } from '@/components/ui/separator';
import { Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { speakText } from '@/lib/tts'; // Import the TTS utility

export default function LinguaLiveApp() {
  const [user1Lang, setUser1Lang] = useState<LanguageCode>('en');
  const [user2Lang, setUser2Lang] = useState<LanguageCode>('tr');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isUser1Translating, setIsUser1Translating] = useState<boolean>(false);
  const [isUser2Translating, setIsUser2Translating] = useState<boolean>(false);
  const { toast } = useToast();
  const [isTTSSupported, setIsTTSSupported] = useState<boolean>(false);

  // Check for TTS support on component mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Check for voices also, as API might exist but have no voices
       const checkVoices = () => {
            if (window.speechSynthesis.getVoices().length > 0) {
                setIsTTSSupported(true);
            } else {
                 console.warn("Speech Synthesis API exists, but no voices found initially.");
                 // Try again if voices load later
                 window.speechSynthesis.onvoiceschanged = () => {
                     if(window.speechSynthesis.getVoices().length > 0) {
                         setIsTTSSupported(true);
                         window.speechSynthesis.onvoiceschanged = null; // Remove listener once voices are confirmed
                     } else {
                         console.warn("Speech Synthesis API exists, but still no voices found after event.");
                         setIsTTSSupported(false); // Explicitly set to false if voices never load
                     }
                 };
            }
       };
       // Voices might not be loaded immediately
       if (window.speechSynthesis.getVoices().length > 0) {
            checkVoices();
       } else {
           window.speechSynthesis.onvoiceschanged = checkVoices;
       }

    } else if (typeof window !== 'undefined') {
        console.warn("Speech Synthesis API not supported in this browser.");
        setIsTTSSupported(false);
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  const handleTranslateAndSpeak = useCallback(async (text: string, sourceUser: 'user1' | 'user2', isVoiceInput: boolean = false, targetLangForTTS?: LanguageCode) => {
    const sourceLanguage = sourceUser === 'user1' ? user1Lang : user2Lang;
    const targetLanguage = sourceUser === 'user1' ? user2Lang : user1Lang;

    if (!text || !sourceLanguage || !targetLanguage) return;

    // Set loading state
    if (sourceUser === 'user1') setIsUser1Translating(true);
    else setIsUser2Translating(true);

    // Add original message immediately
    const originalMessage: Message = {
        id: Date.now().toString(),
        originalText: text,
        translatedText: '...', // Placeholder for translation
        sourceLanguage: sourceLanguage,
        targetLanguage: targetLanguage,
        user: sourceUser,
        timestamp: new Date(),
     };
     setConversation((prev) => [...prev, originalMessage]);

    // Skip translation and TTS if languages are the same
    if (sourceLanguage === targetLanguage) {
        toast({
            title: "Translation Skipped",
            description: "Source and target languages are the same.",
        });
        setConversation((prev) =>
            prev.map(msg =>
            msg.id === originalMessage.id
                ? { ...msg, translatedText: text } // Update placeholder with original text
                : msg
            )
        );
         // Reset loading state
         if (sourceUser === 'user1') setIsUser1Translating(false);
         else setIsUser2Translating(false);
        return;
    }

    // Perform Translation
    const request: TranslationRequest = {
      text,
      sourceLanguage,
      targetLanguage,
    };

    try {
      const result: TranslationResult = await translateText(request);

      // Update message with translation
      setConversation((prev) =>
        prev.map(msg =>
          msg.id === originalMessage.id
            ? { ...msg, translatedText: result.translatedText }
            : msg
        )
      );

      // Handle translation errors specifically
      if (result.translatedText.startsWith('Translation currently unavailable')) {
           toast({
                variant: "destructive",
                title: "Translation Error",
                description: result.translatedText,
           });
      } else {
            // Speak the translated text if it was voice input and TTS is supported
            if (isVoiceInput && isTTSSupported && targetLangForTTS) {
                speakText(result.translatedText, targetLangForTTS, (errorMsg) => { // Use targetLangForTTS
                     toast({
                        variant: "destructive",
                        title: "Speech Error",
                        description: errorMsg,
                     });
                });
            } else if (isVoiceInput && !isTTSSupported) {
                 toast({
                    title: "Speech Unavailable",
                    description: "Could not speak the translation as text-to-speech is not supported.",
                 });
            }
      }
    } catch (error) {
      console.error('Translation or Speech failed:', error);
      // Update the message with an error state
       setConversation((prev) =>
        prev.map(msg =>
          msg.id === originalMessage.id
            ? { ...msg, translatedText: "Error: Translation failed." }
            : msg
        )
      );
       toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred.",
      });
    } finally {
       // Reset loading state
       if (sourceUser === 'user1') setIsUser1Translating(false);
       else setIsUser2Translating(false);
    }

  }, [user1Lang, user2Lang, toast, isTTSSupported]); // Added isTTSSupported

  // Updated handler to receive targetLangForTTS
  const handleUserInput = (text: string, user: 'user1' | 'user2', isVoiceInput: boolean = false, targetLangForTTS?: LanguageCode) => {
    handleTranslateAndSpeak(text, user, isVoiceInput, targetLangForTTS); // Pass targetLangForTTS
  };

  return (
    <div className="flex flex-col h-screen bg-secondary p-4 overflow-hidden">
      <header className="flex items-center justify-center mb-4 p-2 rounded-lg bg-background shadow-sm flex-shrink-0">
         <Bot className="w-6 h-6 mr-2 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">LinguaLive</h1>
      </header>

       <div className="flex flex-col md:flex-row gap-4 mb-4 flex-shrink-0">
        <Card className="flex-1 bg-card">
          <CardContent className="p-4 space-y-2">
            <h2 className="text-sm font-medium text-center text-muted-foreground">User 1</h2>
            <LanguageSelector
              selectedLanguage={user1Lang}
              onLanguageChange={setUser1Lang}
              languages={languages}
              aria-label="Select language for User 1"
            />
          </CardContent>
        </Card>
         <Card className="flex-1 bg-card">
          <CardContent className="p-4 space-y-2">
             <h2 className="text-sm font-medium text-center text-muted-foreground">User 2</h2>
            <LanguageSelector
              selectedLanguage={user2Lang}
              onLanguageChange={setUser2Lang}
              languages={languages}
              aria-label="Select language for User 2"
            />
          </CardContent>
        </Card>
      </div>

      <Separator className="my-4 flex-shrink-0" />

      <div className="flex-grow min-h-0">
        <ConversationView conversation={conversation} user1Lang={user1Lang} user2Lang={user2Lang} />
      </div>


      <Separator className="my-4 flex-shrink-0" />

       <div className="flex flex-col md:flex-row gap-4 mt-auto flex-shrink-0">
         <UserInputArea
           user="user1"
           language={user1Lang}
           targetLanguage={user2Lang} // Pass the target language for TTS
           onSend={handleUserInput}
           isSpeaking={isUser1Translating} // Pass translating state
           placeholder={`Speak or type in ${languages.find(l => l.code === user1Lang)?.name || 'your language'}...`}
           aria-label="Input area for User 1"
         />
         <UserInputArea
           user="user2"
           language={user2Lang}
           targetLanguage={user1Lang} // Pass the target language for TTS
           onSend={handleUserInput}
           isSpeaking={isUser2Translating} // Pass translating state
           placeholder={`Speak or type in ${languages.find(l => l.code === user2Lang)?.name || 'your language'}...`}
           aria-label="Input area for User 2"
         />
      </div>
    </div>
  );
}
