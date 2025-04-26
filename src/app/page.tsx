'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { LanguageSelector } from '@/components/lingualive/LanguageSelector';
import { ConversationView } from '@/components/lingualive/ConversationView';
import { UserInputArea } from '@/components/lingualive/UserInputArea';
import { Card } from '@/components/ui/card'; // Import Card
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group" // Import ToggleGroup
import { translateText, type TranslationRequest, type TranslationResult } from '@/services/translation';
import type { Message } from '@/components/lingualive/TranslationBubble';
import { languages, type LanguageCode } from '@/lib/languages';
import { ArrowRightLeft, User, UserRound } from 'lucide-react'; // Add User icons
import { useToast } from '@/hooks/use-toast';
import { speakText, type Gender } from '@/lib/tts'; // Import Gender type
import { Logo } from '@/components/lingualive/Logo'; // Import Logo

export default function LinguaLiveApp() {
  const [user1Lang, setUser1Lang] = useState<LanguageCode>('en');
  const [user2Lang, setUser2Lang] = useState<LanguageCode>('tr');
  const [user1Gender, setUser1Gender] = useState<Gender>('female'); // Default gender for user 1
  const [user2Gender, setUser2Gender] = useState<Gender>('male'); // Default gender for user 2
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isUser1Translating, setIsUser1Translating] = useState<boolean>(false);
  const [isUser2Translating, setIsUser2Translating] = useState<boolean>(false);
  const { toast } = useToast();
  const [isTTSSupported, setIsTTSSupported] = useState<boolean>(false);
  const lastSpokenMessageId = useRef<string | null>(null);

  // Check for TTS support
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const checkVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          console.log("TTS Voices found:", voices.map(v => `${v.name} (${v.lang})`));
          setIsTTSSupported(true);
          window.speechSynthesis.onvoiceschanged = null; // Clear listener once voices are found
        } else {
          console.warn("Speech Synthesis API exists, but no voices found initially. Waiting for voiceschanged event.");
          const handleVoicesChanged = () => {
            console.log("voiceschanged event fired.");
            const updatedVoices = window.speechSynthesis.getVoices();
            if (updatedVoices.length > 0) {
              console.log("TTS Voices found after event:", updatedVoices.map(v => `${v.name} (${v.lang})`));
              setIsTTSSupported(true);
            } else {
              console.warn("Speech Synthesis API exists, but still no voices found after event.");
              setIsTTSSupported(false);
            }
            window.speechSynthesis.onvoiceschanged = null; // Clean up listener
          };
          // Make sure listener is attached only once or cleared properly
          window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
        }
      };
      // Sometimes voices are loaded immediately, sometimes after event
       if (window.speechSynthesis.getVoices().length > 0) {
            checkVoices();
       } else {
           window.speechSynthesis.onvoiceschanged = checkVoices;
       }
    } else if (typeof window !== 'undefined') {
      console.warn("Speech Synthesis API not supported in this browser.");
      setIsTTSSupported(false);
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null; // Ensure cleanup on unmount
      }
    };
  }, []);


  const handleTranslateAndSpeak = useCallback(async (text: string, sourceUser: 'user1' | 'user2', isVoiceInput: boolean) => {
    const sourceLanguage = sourceUser === 'user1' ? user1Lang : user2Lang;
    const targetLanguage = sourceUser === 'user1' ? user2Lang : user1Lang;
    // Determine the gender preference for the *recipient* of the spoken translation
    const targetRecipientGender = sourceUser === 'user1' ? user2Gender : user1Gender;

    console.log(`Translate/Speak - User: ${sourceUser}, Source: ${sourceLanguage}, Target: ${targetLanguage}, TargetGender: ${targetRecipientGender}, VoiceInput: ${isVoiceInput}, Text: "${text}"`);


    if (!text || !sourceLanguage || !targetLanguage) {
      console.warn("Translation skipped: Missing text, source, or target language.");
      return;
    }

    const setLoading = sourceUser === 'user1' ? setIsUser1Translating : setIsUser2Translating;
    setLoading(true);

    const messageId = Date.now().toString();
    const originalMessage: Message = {
      id: messageId,
      originalText: text,
      translatedText: '...', // Placeholder
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      user: sourceUser,
      timestamp: new Date(),
      isVoiceInput: isVoiceInput,
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

       // Speak original text if it was voice input and languages are same
       // Only speak if this is the first time or the message ID is new
       if (isVoiceInput && isTTSSupported && lastSpokenMessageId.current !== messageId) {
            lastSpokenMessageId.current = messageId; // Mark as spoken
            // Use the *source* user's gender preference when speaking their *original* text
            const sourceSpeakerGender = sourceUser === 'user1' ? user1Gender : user2Gender;
            speakText(text, sourceLanguage, sourceSpeakerGender, (errorMsg) => {
               console.error("TTS Error Callback (same lang):", errorMsg);
                toast({ variant: "destructive", title: "Speech Error", description: errorMsg });
                lastSpokenMessageId.current = null;
            });
        } else if (isVoiceInput && !isTTSSupported) {
            toast({ title: "Speech Unavailable", description: "Could not speak the message." });
        }

      setLoading(false);
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
        if (isTTSSupported && targetLanguage && lastSpokenMessageId.current !== messageId) {
          lastSpokenMessageId.current = messageId; // Mark as spoken
          console.log(`Attempting to speak translated: "${result.translatedText}" in ${targetLanguage} with ${targetRecipientGender} voice`);
          // Speak the *translation* using the *recipient's* gender preference
          speakText(result.translatedText, targetLanguage, targetRecipientGender, (errorMsg) => {
            console.error("TTS Error Callback (translated):", errorMsg);
            toast({
              variant: "destructive",
              title: "Speech Error",
              description: errorMsg,
            });
            lastSpokenMessageId.current = null;
          });
        } else if (!isTTSSupported) {
          console.warn("TTS not supported, skipping speech.");
          toast({
            title: "Speech Unavailable",
            description: "Could not speak the translation as text-to-speech is not supported or no voices found.",
          });
        } else if (!targetLanguage) {
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
      lastSpokenMessageId.current = null; // Reset on unexpected error
    } finally {
      setLoading(false);
      console.log("Translation/Speaking process finished for user:", sourceUser);
    }

  }, [user1Lang, user2Lang, user1Gender, user2Gender, toast, isTTSSupported]);


  const handleUserInput = useCallback((text: string, user: 'user1' | 'user2', isVoiceInput: boolean) => {
      console.log(`User Input Received - User: ${user}, Text: "${text}", Voice Input: ${isVoiceInput}`);
       if (!text) {
          console.warn("Empty input received, ignoring.");
          return;
      }
      lastSpokenMessageId.current = null;
      handleTranslateAndSpeak(text, user, isVoiceInput); // Pass voice input flag
  },[handleTranslateAndSpeak]);

  const swapLanguagesAndGenders = () => {
    setUser1Lang(user2Lang);
    setUser2Lang(user1Lang);
    setUser1Gender(user2Gender);
    setUser2Gender(user1Gender);
    // Optionally clear conversation or add a separator message
    // setConversation([]);
     toast({
       title: "Languages & Voices Swapped",
       description: `User 1 now speaks ${languages.find(l => l.code === user2Lang)?.name} (${user2Gender}) and User 2 speaks ${languages.find(l => l.code === user1Lang)?.name} (${user1Gender}).`,
     });
  };

  const handleGenderChange = (user: 'user1' | 'user2', value: string | null) => {
    if (value === 'male' || value === 'female') {
      if (user === 'user1') {
        setUser1Gender(value);
      } else {
        setUser2Gender(value);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-secondary p-4 md:p-6 lg:p-8 overflow-hidden font-sans">
      {/* Header */}
       <header className="flex items-center justify-between mb-4 p-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Logo />
            <h1 className="text-xl font-semibold text-foreground">LinguaLink</h1>
          </div>
        {/* Removed Settings Button */}
       </header>

      {/* Language & Gender Selectors */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 mb-4 flex-shrink-0">
        {/* User 1 Controls */}
        <div className="flex-1 flex flex-col items-center w-full md:w-auto gap-1">
          <LanguageSelector
            selectedLanguage={user1Lang}
            onLanguageChange={setUser1Lang}
            languages={languages}
            aria-label="Select your language"
            className="w-full max-w-xs mx-auto" // Center and limit width
          />
           <ToggleGroup
             type="single"
             value={user1Gender}
             onValueChange={(value) => handleGenderChange('user1', value)}
             aria-label="Select voice gender for User 1"
             size="sm"
             className="border rounded-md p-0.5 bg-background"
           >
            <ToggleGroupItem value="female" aria-label="Female voice">
                <User className="h-4 w-4 mr-1" /> Female
            </ToggleGroupItem>
            <ToggleGroupItem value="male" aria-label="Male voice">
                 <UserRound className="h-4 w-4 mr-1" /> Male
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Swap Button */}
        <Button
            variant="outline"
            size="icon"
            onClick={swapLanguagesAndGenders}
            className="flex-shrink-0 rounded-full border shadow-sm mt-4 md:mt-0" // Adjust margin for mobile
            aria-label="Swap languages and voices"
            >
            <ArrowRightLeft className="w-4 h-4 text-muted-foreground" />
        </Button>

        {/* User 2 Controls */}
        <div className="flex-1 flex flex-col items-center w-full md:w-auto gap-1">
           <LanguageSelector
             selectedLanguage={user2Lang}
             onLanguageChange={setUser2Lang}
             languages={languages}
             aria-label="Select their language"
             className="w-full max-w-xs mx-auto" // Center and limit width
           />
            <ToggleGroup
               type="single"
               value={user2Gender}
               onValueChange={(value) => handleGenderChange('user2', value)}
               aria-label="Select voice gender for User 2"
               size="sm"
               className="border rounded-md p-0.5 bg-background"
             >
              <ToggleGroupItem value="female" aria-label="Female voice">
                  <User className="h-4 w-4 mr-1" /> Female
              </ToggleGroupItem>
              <ToggleGroupItem value="male" aria-label="Male voice">
                   <UserRound className="h-4 w-4 mr-1" /> Male
              </ToggleGroupItem>
            </ToggleGroup>
        </div>
      </div>

      {/* Conversation Area */}
      <Card className="flex-grow min-h-0 overflow-hidden border shadow-sm bg-background"> {/* Wrap in Card */}
           <ConversationView conversation={conversation} />
      </Card>

      {/* Input Areas Container */}
       <div className="flex flex-col md:flex-row gap-4 mt-4 flex-shrink-0">
         <UserInputArea
           user="user1"
           language={user1Lang}
           onSend={handleUserInput}
           isTranslating={isUser1Translating}
           placeholder={`User 1 (${languages.find(l => l.code === user1Lang)?.name || 'your language'})`}
           aria-label="Input area for User 1"
           className="bg-background rounded-lg shadow flex-1"
         />
         <UserInputArea
           user="user2"
           language={user2Lang}
           onSend={handleUserInput}
           isTranslating={isUser2Translating}
           placeholder={`User 2 (${languages.find(l => l.code === user2Lang)?.name || 'their language'})`}
           aria-label="Input area for User 2"
           className="bg-background rounded-lg shadow flex-1"
         />
      </div>
    </div>
  );
}
