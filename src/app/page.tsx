'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { LanguageSelector } from '@/components/lingualive/LanguageSelector';
import { ConversationView } from '@/components/lingualive/ConversationView';
import { UserInputArea } from '@/components/lingualive/UserInputArea';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { translateText, type TranslationRequest, type TranslationResult } from '@/services/translation';
import type { Message } from '@/components/lingualive/TranslationBubble';
import { languages, type LanguageCode } from '@/lib/languages';
import { Separator } from '@/components/ui/separator';
import { ArrowRightLeft, Cog } from 'lucide-react'; // Changed icons
import { useToast } from '@/hooks/use-toast';
import { speakText } from '@/lib/tts';

export default function LinguaLiveApp() {
  const [user1Lang, setUser1Lang] = useState<LanguageCode>('en');
  const [user2Lang, setUser2Lang] = useState<LanguageCode>('tr');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isUser1Translating, setIsUser1Translating] = useState<boolean>(false);
  const [isUser2Translating, setIsUser2Translating] = useState<boolean>(false);
  const { toast } = useToast();
  const [isTTSSupported, setIsTTSSupported] = useState<boolean>(false);

  // Check for TTS support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const checkVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          console.log("TTS Voices found:", voices.map(v => `${v.name} (${v.lang})`));
          setIsTTSSupported(true);
          window.speechSynthesis.onvoiceschanged = null;
        } else {
          console.warn("Speech Synthesis API exists, but no voices found initially. Waiting for voiceschanged event.");
          window.speechSynthesis.onvoiceschanged = () => {
            console.log("voiceschanged event fired.");
            const updatedVoices = window.speechSynthesis.getVoices();
            if (updatedVoices.length > 0) {
              console.log("TTS Voices found after event:", updatedVoices.map(v => `${v.name} (${v.lang})`));
              setIsTTSSupported(true);
              window.speechSynthesis.onvoiceschanged = null;
            } else {
              console.warn("Speech Synthesis API exists, but still no voices found after event.");
              setIsTTSSupported(false);
            }
          };
        }
      };
      checkVoices();
    } else if (typeof window !== 'undefined') {
      console.warn("Speech Synthesis API not supported in this browser.");
      setIsTTSSupported(false);
    }
  }, []);

  const handleTranslateAndSpeak = useCallback(async (text: string, sourceUser: 'user1' | 'user2', isVoiceInput: boolean = false) => {
    const sourceLanguage = sourceUser === 'user1' ? user1Lang : user2Lang;
    const targetLanguage = sourceUser === 'user1' ? user2Lang : user1Lang;
    const targetLangForTTS = targetLanguage; // Target language is where the translation should be spoken

    console.log(`Translating from ${sourceLanguage} to ${targetLanguage}. Voice input: ${isVoiceInput}. TTS Target: ${targetLangForTTS}`);

    if (!text || !sourceLanguage || !targetLanguage) {
      console.warn("Translation skipped: Missing text, source, or target language.");
      return;
    }

    const setLoading = sourceUser === 'user1' ? setIsUser1Translating : setIsUser2Translating;
    setLoading(true);

    const originalMessage: Message = {
      id: Date.now().toString(),
      originalText: text,
      translatedText: '...', // Placeholder
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      user: sourceUser,
      timestamp: new Date(),
    };
    setConversation((prev) => [...prev, originalMessage]);

    if (sourceLanguage === targetLanguage) {
      console.log("Translation skipped: Source and target languages are the same.");
      toast({
        title: "Translation Skipped",
        description: "Source and target languages are the same.",
      });
      setConversation((prev) =>
        prev.map(msg =>
          msg.id === originalMessage.id
            ? { ...msg, translatedText: text }
            : msg
        )
      );
      setLoading(false);
      // Speak original text if it was voice input and languages are same
      if (isVoiceInput && isTTSSupported) {
          speakText(text, sourceLanguage, (errorMsg) => {
              console.error("TTS Error Callback:", errorMsg);
               toast({ variant: "destructive", title: "Speech Error", description: errorMsg });
          });
      } else if (isVoiceInput && !isTTSSupported) {
          toast({ title: "Speech Unavailable", description: "Could not speak the message." });
      }
      return;
    }

    const request: TranslationRequest = {
      text,
      sourceLanguage,
      targetLanguage,
    };

    let translationResultText = "Error: Translation failed.";

    try {
      const result: TranslationResult = await translateText(request);
      translationResultText = result.translatedText;

      setConversation((prev) =>
        prev.map(msg =>
          msg.id === originalMessage.id
            ? { ...msg, translatedText: result.translatedText }
            : msg
        )
      );

      if (result.translatedText.startsWith('Error:') || result.translatedText.startsWith('Translation currently unavailable')) {
        console.error("Translation Service Error:", result.translatedText);
        toast({
          variant: "destructive",
          title: "Translation Error",
          description: result.translatedText,
        });
      } else if (isVoiceInput) { // Speak the *translated* text if voice input
        if (isTTSSupported && targetLangForTTS) {
          console.log(`Attempting to speak translated: "${result.translatedText}" in ${targetLangForTTS}`);
          speakText(result.translatedText, targetLangForTTS, (errorMsg) => {
            console.error("TTS Error Callback:", errorMsg);
            toast({
              variant: "destructive",
              title: "Speech Error",
              description: errorMsg,
            });
          });
        } else if (!isTTSSupported) {
          console.warn("TTS not supported, skipping speech.");
          toast({
            title: "Speech Unavailable",
            description: "Could not speak the translation as text-to-speech is not supported or no voices found.",
          });
        } else if (!targetLangForTTS) {
             console.warn("Target language for TTS is missing, skipping speech.");
             toast({
                 title: "Speech Skipped",
                 description: "Target language for speech synthesis is missing.",
             });
        }
      }
    } catch (error) {
      console.error('Translation or Speech async processing failed:', error);
      setConversation((prev) =>
        prev.map(msg =>
          msg.id === originalMessage.id
            ? { ...msg, translatedText: translationResultText }
            : msg
        )
      );
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred during processing.",
      });
    } finally {
      setLoading(false);
      console.log("Translation/Speaking process finished for user:", sourceUser);
    }

  }, [user1Lang, user2Lang, toast, isTTSSupported]);

  // Receives only text and user, determines if voice input was used
  const handleUserInput = (text: string, user: 'user1' | 'user2', isVoiceInput: boolean) => {
      console.log(`User Input Received - User: ${user}, Text: "${text}", Voice Input: ${isVoiceInput}`);
      handleTranslateAndSpeak(text, user, isVoiceInput); // Pass voice input flag
  };

  const swapLanguages = () => {
    setUser1Lang(user2Lang);
    setUser2Lang(user1Lang);
    // Optionally clear conversation or add a separator message
    // setConversation([]);
  };

  return (
    <div className="flex flex-col h-screen bg-secondary p-4 md:p-6 lg:p-8 overflow-hidden font-sans">
      {/* Header */}
      <header className="flex items-center justify-between mb-4 p-2 flex-shrink-0">
        <h1 className="text-xl font-semibold text-foreground">LetSpeak</h1>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Cog className="w-5 h-5" />
            <span className="sr-only">Settings</span>
        </Button>
      </header>

      {/* Language Selectors */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 mb-4 flex-shrink-0">
        {/* User 1 / You Speak */}
        <div className="flex-1 flex flex-col items-center w-full md:w-auto">
          <h2 className="text-sm font-medium text-muted-foreground mb-1">You speak</h2>
          <LanguageSelector
            selectedLanguage={user1Lang}
            onLanguageChange={setUser1Lang}
            languages={languages}
            aria-label="Select your language"
            className="w-full max-w-xs mx-auto" // Center and limit width
          />
        </div>

        {/* Swap Button */}
        <Button
            variant="outline"
            size="icon"
            onClick={swapLanguages}
            className="flex-shrink-0 rounded-full border shadow-sm mt-4 md:mt-6" // Adjust margin
            aria-label="Swap languages"
            >
            <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
        </Button>

        {/* User 2 / They Speak */}
        <div className="flex-1 flex flex-col items-center w-full md:w-auto">
           <h2 className="text-sm font-medium text-muted-foreground mb-1">They speak</h2>
           <LanguageSelector
             selectedLanguage={user2Lang}
             onLanguageChange={setUser2Lang}
             languages={languages}
             aria-label="Select their language"
             className="w-full max-w-xs mx-auto" // Center and limit width
           />
        </div>
      </div>

      {/* Separator - removed */}
      {/* <Separator className="my-4 flex-shrink-0" /> */}

      {/* Conversation Area */}
      <div className="flex-grow min-h-0 py-4">
        <ConversationView conversation={conversation} />
      </div>

      {/* Separator - removed */}
      {/* <Separator className="my-4 flex-shrink-0" /> */}

      {/* Input Areas Container */}
       <div className="flex flex-col md:flex-row gap-4 mt-auto flex-shrink-0 bg-secondary -mx-4 -mb-4 md:-mx-6 md:-mb-6 lg:-mx-8 lg:-mb-8 p-4 md:p-6 lg:p-8 border-t">
         <UserInputArea
           user="user1"
           language={user1Lang}
           onSend={handleUserInput}
           isTranslating={isUser1Translating}
           placeholder={`Speak or type in ${languages.find(l => l.code === user1Lang)?.name || 'your language'}...`}
           aria-label="Input area for User 1"
           className="bg-background rounded-lg shadow" // Style input area like image
         />
         <UserInputArea
           user="user2"
           language={user2Lang}
           onSend={handleUserInput}
           isTranslating={isUser2Translating}
           placeholder={`Speak or type in ${languages.find(l => l.code === user2Lang)?.name || 'their language'}...`}
           aria-label="Input area for User 2"
           className="bg-background rounded-lg shadow" // Style input area like image
         />
      </div>
    </div>
  );
}
