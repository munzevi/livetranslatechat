'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ConversationView } from '@/components/lingualive/ConversationView';
import { UserInputArea } from '@/components/lingualive/UserInputArea';
import { UserSettingsSheet } from '@/components/lingualive/UserSettingsSheet';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogCancel, // Import Cancel for the language settings part
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"; // Import Select components
import { Label } from '@/components/ui/label'; // Import Label
import { translateText, type TranslationRequest, type TranslationResult } from '@/services/translation';
import type { Message } from '@/components/lingualive/TranslationBubble';
import { languages, type LanguageCode, getLanguageName } from '@/lib/languages';
import { ArrowRightLeft, Settings, User, UserRound, Keyboard, Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { speakText, type Gender } from '@/lib/tts';
import { NicoleLogo } from '@/components/lingualive/NicoleLogo';
import { useIsMobile } from '@/hooks/use-mobile';

// Define available app languages (can be expanded)
const appLanguages = [
    { code: 'en', name: 'English' },
    { code: 'tr', name: 'Türkçe' },
    // Add other supported app languages here
];

export default function NicoleApp() {
  const [user1Lang, setUser1Lang] = useState<LanguageCode>('en');
  const [user2Lang, setUser2Lang] = useState<LanguageCode>('tr');
  const [user1Gender, setUser1Gender] = useState<Gender>('female');
  const [user2Gender, setUser2Gender] = useState<Gender>('male');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isUser1Translating, setIsUser1Translating] = useState<boolean>(false);
  const [isUser2Translating, setIsUser2Translating] = useState<boolean>(false);
  const { toast } = useToast();
  const [isTTSSupported, setIsTTSSupported] = useState<boolean>(false);
  const lastSpokenMessageId = useRef<string | null>(null);
  const isMobile = useIsMobile();
  const [showTextInput, setShowTextInput] = useState<boolean>(!isMobile);
  const [clientSideRendered, setClientSideRendered] = useState(false);
  const [isUser1SettingsOpen, setIsUser1SettingsOpen] = useState<boolean>(false);
  const [isUser2SettingsOpen, setIsUser2SettingsOpen] = useState<boolean>(false);
  const [showInitialAlert, setShowInitialAlert] = useState<boolean>(false);
  const [showLanguageSettings, setShowLanguageSettings] = useState<boolean>(false); // State for language settings in alert
  const [appLanguage, setAppLanguage] = useState<string>('en'); // State for app language selection

  useEffect(() => {
    setShowTextInput(!isMobile);
    setClientSideRendered(true);
    // Show the initial alert dialog once the component mounts
    // Only show if not previously dismissed (e.g., using localStorage)
     if (!localStorage.getItem('nicoleInitialAlertDismissed')) {
       setShowInitialAlert(true);
     }
  }, [isMobile]);


  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const checkVoices = () => {
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                setIsTTSSupported(true);
                if (window.speechSynthesis) {
                   window.speechSynthesis.onvoiceschanged = null;
                }
            } else {
                const handleVoicesChanged = () => {
                    const updatedVoices = window.speechSynthesis.getVoices();
                    if (updatedVoices.length > 0) {
                        setIsTTSSupported(true);
                    } else {
                        setIsTTSSupported(false);
                    }
                    if (window.speechSynthesis) {
                        window.speechSynthesis.onvoiceschanged = null;
                    }
                };
                 if (window.speechSynthesis) {
                     window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
                 }
            }
        };

        if (window.speechSynthesis.getVoices().length > 0) {
             checkVoices();
        } else {
             if (window.speechSynthesis) {
                 window.speechSynthesis.onvoiceschanged = checkVoices;
             }
        }

    } else if (typeof window !== 'undefined') {
        setIsTTSSupported(false);
    }

    return () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            window.speechSynthesis.onvoiceschanged = null;
        }
    };
}, []);


 const handleTranslateAndSpeak = useCallback(async (text: string, sourceUser: 'user1' | 'user2', isVoiceInput: boolean) => {
    const sourceLanguage = sourceUser === 'user1' ? user1Lang : user2Lang;
    const targetLanguage = sourceUser === 'user1' ? user2Lang : user1Lang;
    const sourceSpeakerGender = sourceUser === 'user1' ? user1Gender : user2Gender;
    const targetRecipientGender = sourceUser === 'user1' ? user2Gender : user1Gender;

    console.log(`Translate/Speak Start - User: ${sourceUser}, Source: ${sourceLanguage}, Target: ${targetLanguage}, SourceGender: ${sourceSpeakerGender}, TargetGender: ${targetRecipientGender}, VoiceInput: ${isVoiceInput}, Text: "${text}"`);

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
      translatedText: '...',
      sourceLanguage: sourceLanguage,
      targetLanguage: targetLanguage,
      user: sourceUser,
      timestamp: new Date(),
      isVoiceInput: isVoiceInput,
    };
    setConversation((prev) => [...prev, originalMessage]);
    lastSpokenMessageId.current = null; // Reset last spoken ID for new message


    let translationResultText = text;
    let translationSuccess = true;

    // Only call translation if source and target languages are different
    if (sourceLanguage !== targetLanguage) {
        const request: TranslationRequest = { text, sourceLanguage, targetLanguage };
        try {
            console.log(`Requesting translation for ID ${messageId}:`, request);
            const result: TranslationResult = await translateText(request);
            console.log(`Translation result for ID ${messageId}:`, result);

            if (result.translatedText.startsWith('Error:') || result.translatedText.startsWith('Translation currently unavailable')) {
                translationResultText = result.translatedText; // Keep the error message
                translationSuccess = false;
                console.error("Translation Service Error:", result.translatedText);
                toast({ variant: "destructive", title: "Translation Error", description: result.translatedText });
            } else {
                translationResultText = result.translatedText; // Use the successful translation
            }
        } catch (error) {
            translationSuccess = false;
            translationResultText = "Error: Translation failed."; // General error if API call fails
            console.error('Translation async processing failed:', error);
            toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred during translation." });
        }
    } else {
        // If languages are the same, no translation needed, success is true
        translationResultText = text;
        translationSuccess = true;
        console.log("Translation skipped: Source and target languages are the same.");
    }

    // Update conversation bubble with the final text (original, translated, or error)
    setConversation((prev) =>
        prev.map(msg =>
        msg.id === messageId ? { ...msg, translatedText: translationResultText } : msg
        )
    );


    // --- Text-to-Speech Logic ---
    // Speak only if input was voice AND translation was successful (or not needed because languages match)
    if (isVoiceInput && translationSuccess) {
        if (isTTSSupported && lastSpokenMessageId.current !== messageId) {
            lastSpokenMessageId.current = messageId; // Mark this message as being spoken
            const textToSpeak = translationResultText; // Speak the final text
            const languageToSpeakIn = targetLanguage; // Speak in the target language
            const voiceGenderToUse = targetRecipientGender; // Use the recipient's preferred gender

            console.log(`Attempting to speak for ID ${messageId}: "${textToSpeak}" in ${languageToSpeakIn} (${voiceGenderToUse} voice)`);

            speakText(textToSpeak, languageToSpeakIn, voiceGenderToUse, (errorMsg) => {
                console.error(`TTS Error Callback for ID ${messageId}:`, errorMsg);
                toast({ variant: "destructive", title: "Speech Error", description: errorMsg });
                // Reset last spoken only if this specific utterance failed?
                if (lastSpokenMessageId.current === messageId) {
                     lastSpokenMessageId.current = null;
                }
            });
        } else if (!isTTSSupported) {
            console.warn("TTS not supported, skipping speech.");
            toast({ title: "Speech Unavailable", description: "Text-to-speech is not supported or no voices found." });
        } else if (lastSpokenMessageId.current === messageId) {
            console.log(`Speech already initiated for ID ${messageId}, skipping duplicate call.`);
        }
    } else if (!translationSuccess) {
        console.log("Skipping speech due to translation failure.");
    } else if (!isVoiceInput) {
        console.log("Skipping speech as input was text.");
    }
    // --- End Text-to-Speech Logic ---

    setLoading(false);
    console.log(`Translate/Speak End - Process finished for user: ${sourceUser}, message ID: ${messageId}`);

  }, [user1Lang, user2Lang, user1Gender, user2Gender, toast, isTTSSupported]);


 const handleUserInput = useCallback((text: string, user: 'user1' | 'user2', isVoiceInput: boolean) => {
      console.log(`User Input Received - User: ${user}, Text: "${text}", Voice Input: ${isVoiceInput}`);
       if (!text) {
          console.warn("Empty input received, ignoring.");
          return;
      }
      // Call the combined function
      handleTranslateAndSpeak(text, user, isVoiceInput);
  },[handleTranslateAndSpeak]); // Dependency array includes the combined function


  const swapLanguagesAndGenders = () => {
    const tempLang = user1Lang;
    const tempGender = user1Gender;
    setUser1Lang(user2Lang);
    setUser1Gender(user2Gender);
    setUser2Lang(tempLang);
    setUser2Gender(tempGender);

     toast({
       title: "Languages & Voices Swapped",
       description: `User 1: ${getLanguageName(user2Lang)} (${user2Gender}) | User 2: ${getLanguageName(tempLang)} (${tempGender})`,
     });
  };

  const handleLanguageChange = (user: 'user1' | 'user2', langCode: LanguageCode) => {
    if (user === 'user1') {
      setUser1Lang(langCode);
    } else {
      setUser2Lang(langCode);
    }
  };

  const handleGenderChange = (user: 'user1' | 'user2', gender: Gender) => {
    if (user === 'user1') {
      setUser1Gender(gender);
    } else {
      setUser2Gender(gender);
    }
  };

  const toggleTextInputVisibility = useCallback(() => {
    setShowTextInput(prev => !prev);
  }, []);

   const handleDismissInitialAlert = () => {
       setShowInitialAlert(false);
       setShowLanguageSettings(false); // Close language settings if open
       // Optionally, remember dismissal
       if (typeof window !== 'undefined') {
         localStorage.setItem('nicoleInitialAlertDismissed', 'true');
       }
     };

  if (!clientSideRendered) {
    return null; // Or a skeleton loader
  }


  return (
    <div className="flex flex-col h-screen bg-secondary p-2 sm:p-4 md:p-6 lg:p-8 overflow-hidden font-sans">
       {/* Centered Header */}
       <header className="flex items-center justify-center mb-2 sm:mb-4 p-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <NicoleLogo />
            <h1 className="text-2xl sm:text-3xl font-pacifico text-primary">Nicole</h1>
          </div>
       </header>

      {/* User Controls Area - Always flex-row */}
      <div className="flex flex-row items-center justify-around gap-2 sm:gap-4 mb-2 sm:mb-4 flex-shrink-0 px-2">

        {/* User 1 Area */}
        <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-center">
           <User className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground"/>
           <span className="hidden md:inline font-medium text-foreground mr-1">User 1:</span>
           <span className="text-xs sm:text-sm text-primary">{getLanguageName(user1Lang)}</span>
           <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7" onClick={() => setIsUser1SettingsOpen(true)}>
             <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
             <span className="sr-only">User 1 Settings</span>
           </Button>
        </div>

        {/* Swap Button */}
        <Button
            variant="outline"
            size="icon"
            onClick={swapLanguagesAndGenders}
            className="flex-shrink-0 rounded-full border shadow-sm w-8 h-8 sm:w-10 sm:h-10"
            aria-label="Swap languages and voices"
            >
            <ArrowRightLeft className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
        </Button>

        {/* User 2 Area */}
        <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-center">
           <UserRound className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground"/>
           <span className="hidden md:inline font-medium text-foreground mr-1">User 2:</span>
           <span className="text-xs sm:text-sm text-primary">{getLanguageName(user2Lang)}</span>
           <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7" onClick={() => setIsUser2SettingsOpen(true)}>
             <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="sr-only">User 2 Settings</span>
           </Button>
        </div>
      </div>


      {/* Conversation Area */}
      <Card className="flex-grow min-h-0 overflow-hidden border shadow-sm bg-background rounded-lg">
           <ConversationView conversation={conversation} />
      </Card>

      {/* Input Areas Container - Always use flex-row */}
       <div className={`flex flex-row gap-2 sm:gap-4 mt-2 sm:mt-4 flex-shrink-0`}>
           <UserInputArea
               user="user1"
               language={user1Lang}
               onSend={handleUserInput}
               isTranslating={isUser1Translating}
               placeholder={`Speak or type in ${getLanguageName(user1Lang)}...`}
               aria-label="Input area for User 1"
               className={`bg-card rounded-lg shadow flex-1`}
               showTextInput={showTextInput}
               onToggleTextInput={isMobile ? toggleTextInputVisibility : undefined}
            />
            <UserInputArea
               user="user2"
               language={user2Lang}
               onSend={handleUserInput}
               isTranslating={isUser2Translating}
               placeholder={`Speak or type in ${getLanguageName(user2Lang)}...`}
               aria-label="Input area for User 2"
               className={`bg-card rounded-lg shadow flex-1`}
               showTextInput={showTextInput}
               onToggleTextInput={isMobile ? toggleTextInputVisibility : undefined}
            />
       </div>

       {/* User Settings Sheets */}
       <UserSettingsSheet
         isOpen={isUser1SettingsOpen}
         onOpenChange={setIsUser1SettingsOpen}
         userNumber={1}
         selectedLanguage={user1Lang}
         onLanguageChange={(lang) => handleLanguageChange('user1', lang)}
         selectedGender={user1Gender}
         onGenderChange={(gender) => handleGenderChange('user1', gender)}
         languages={languages}
       />
        <UserSettingsSheet
          isOpen={isUser2SettingsOpen}
          onOpenChange={setIsUser2SettingsOpen}
          userNumber={2}
          selectedLanguage={user2Lang}
          onLanguageChange={(lang) => handleLanguageChange('user2', lang)}
          selectedGender={user2Gender}
          onGenderChange={(gender) => handleGenderChange('user2', gender)}
          languages={languages}
       />

        {/* Initial Instruction Alert */}
        <AlertDialog open={showInitialAlert} onOpenChange={setShowInitialAlert}>
            <AlertDialogContent>
                 {!showLanguageSettings ? (
                     <>
                        <AlertDialogHeader>
                            <div className="flex justify-between items-center">
                                <AlertDialogTitle>Welcome to Nicole!</AlertDialogTitle>
                                <Button variant="ghost" size="icon" onClick={() => setShowLanguageSettings(true)} className="h-6 w-6">
                                    <Settings className="h-4 w-4" />
                                    <span className="sr-only">App Language Settings</span>
                                </Button>
                            </div>
                            <AlertDialogDescription className="text-sm space-y-3 text-left pt-2">
                                <p>
                                To start speaking, you can click on the microphone icon <Mic className="inline-block h-4 w-4 align-text-bottom mx-1"/> below the user area.
                                </p>
                                <p>
                                    In order for the app to work properly and transcribe your voice, you will need to <strong className='text-foreground'>grant permission to use the microphone</strong>.
                                </p>
                                <p>
                                For best results, it is important to <strong className='text-foreground'>speak clearly and audibly in a quiet environment</strong>.
                                </p>
                                <p>
                                    Technical errors can still occur, so it is a good idea to <strong className='text-foreground'>check your transcriptions</strong> during the chat.
                                </p>
                                <p className="italic text-muted-foreground pt-2">
                                Please note that this feature is still under development and occasional glitches may occur.
                                </p>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogAction onClick={handleDismissInitialAlert}>Got it!</AlertDialogAction>
                        </AlertDialogFooter>
                    </>
                 ) : (
                     <>
                         <AlertDialogHeader>
                             <AlertDialogTitle>App Language Settings</AlertDialogTitle>
                             <AlertDialogDescription>
                                 Choose the display language for the application interface.
                             </AlertDialogDescription>
                         </AlertDialogHeader>
                         <div className="py-4">
                            <Label htmlFor="app-language-select" className="mb-2 block">Select Language</Label>
                             <Select value={appLanguage} onValueChange={setAppLanguage}>
                                 <SelectTrigger id="app-language-select">
                                     <SelectValue placeholder="Select app language" />
                                 </SelectTrigger>
                                 <SelectContent>
                                     {appLanguages.map((lang) => (
                                         <SelectItem key={lang.code} value={lang.code}>
                                             {lang.name}
                                         </SelectItem>
                                     ))}
                                 </SelectContent>
                             </Select>
                         </div>
                         <AlertDialogFooter>
                             <AlertDialogCancel onClick={() => setShowLanguageSettings(false)}>Back</AlertDialogCancel>
                             <AlertDialogAction onClick={handleDismissInitialAlert}>Save & Close</AlertDialogAction>
                         </AlertDialogFooter>
                     </>
                 )}
            </AlertDialogContent>
        </AlertDialog>

    </div>
  );
}

    