'use client';

import React, { useState, useCallback } from 'react';
import { LanguageSelector } from '@/components/lingualive/LanguageSelector';
import { ConversationView } from '@/components/lingualive/ConversationView';
import { UserInputArea } from '@/components/lingualive/UserInputArea';
import { Card, CardContent } from '@/components/ui/card';
import { translateText, type TranslationRequest, type TranslationResult } from '@/services/translation';
import type { Message } from '@/components/lingualive/TranslationBubble';
import { languages } from '@/lib/languages';
import { Separator } from '@/components/ui/separator';
import { Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; // Import useToast

export default function LinguaLiveApp() {
  const [user1Lang, setUser1Lang] = useState<string>('en');
  const [user2Lang, setUser2Lang] = useState<string>('tr'); // Default user 2 to Turkish
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isUser1Speaking, setIsUser1Speaking] = useState<boolean>(false);
  const [isUser2Speaking, setIsUser2Speaking] = useState<boolean>(false);
  const { toast } = useToast(); // Get toast function

  const handleTranslate = useCallback(async (text: string, sourceUser: 'user1' | 'user2') => {
    const sourceLanguage = sourceUser === 'user1' ? user1Lang : user2Lang;
    const targetLanguage = sourceUser === 'user1' ? user2Lang : user1Lang;

    if (!text || !sourceLanguage || !targetLanguage) return;

    // Basic check for identical languages
    if (sourceLanguage === targetLanguage) {
        toast({
            title: "Translation Skipped",
            description: "Source and target languages are the same.",
        });
        // Optionally add the message without translation
        const newMessage: Message = {
            id: Date.now().toString(),
            originalText: text,
            translatedText: text, // Show original text as "translated"
            sourceLanguage: sourceLanguage,
            targetLanguage: targetLanguage,
            user: sourceUser,
            timestamp: new Date(),
         };
         setConversation((prev) => [...prev, newMessage]);
        return;
    }


    const request: TranslationRequest = {
      text,
      sourceLanguage,
      targetLanguage,
    };

    // Indicate speaking state
    if (sourceUser === 'user1') setIsUser1Speaking(true);
    else setIsUser2Speaking(true);

    try {
      // No need for artificial delay, the API call will take time
      const result: TranslationResult = await translateText(request);

      // Check if the translation service returned an error message within the result
      if (result.translatedText.startsWith('Translation currently unavailable')) {
           toast({
                variant: "destructive",
                title: "Translation Error",
                description: result.translatedText,
           });
      } else {
            const newMessage: Message = {
                id: Date.now().toString(),
                originalText: text,
                translatedText: result.translatedText,
                sourceLanguage: sourceLanguage,
                targetLanguage: targetLanguage,
                user: sourceUser,
                timestamp: new Date(),
            };
            setConversation((prev) => [...prev, newMessage]);
      }
    } catch (error) {
      console.error('Translation failed:', error);
       toast({ // Use toast for error feedback
          variant: "destructive",
          title: "Translation Error",
          description: "An unexpected error occurred during translation.",
      });
    } finally {
       if (sourceUser === 'user1') setIsUser1Speaking(false);
       else setIsUser2Speaking(false);
    }

  }, [user1Lang, user2Lang, toast]); // Add toast to dependency array

  // Simulate receiving input and triggering translation
  const handleUserInput = (text: string, user: 'user1' | 'user2') => {
    handleTranslate(text, user);
  };

  return (
    <div className="flex flex-col h-screen bg-secondary p-4 overflow-hidden"> {/* Added overflow-hidden */}
      <header className="flex items-center justify-center mb-4 p-2 rounded-lg bg-background shadow-sm flex-shrink-0"> {/* Added flex-shrink-0 */}
         <Bot className="w-6 h-6 mr-2 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">LinguaLive</h1>
      </header>

       <div className="flex flex-col md:flex-row gap-4 mb-4 flex-shrink-0"> {/* Added flex-shrink-0 */}
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

      <Separator className="my-4 flex-shrink-0" /> {/* Added flex-shrink-0 */}

      {/* Make ConversationView take remaining space */}
      <div className="flex-grow min-h-0">
        <ConversationView conversation={conversation} user1Lang={user1Lang} user2Lang={user2Lang} />
      </div>


      <Separator className="my-4 flex-shrink-0" /> {/* Added flex-shrink-0 */}

       <div className="flex flex-col md:flex-row gap-4 mt-auto flex-shrink-0"> {/* Added flex-shrink-0 and mt-auto */}
         <UserInputArea
           user="user1"
           language={user1Lang}
           onSend={handleUserInput}
           isSpeaking={isUser1Speaking}
           placeholder={`Speak or type in ${languages.find(l => l.code === user1Lang)?.name || 'your language'}...`}
           aria-label="Input area for User 1"
         />
         <UserInputArea
           user="user2"
           language={user2Lang}
           onSend={handleUserInput}
           isSpeaking={isUser2Speaking}
           placeholder={`Speak or type in ${languages.find(l => l.code === user2Lang)?.name || 'your language'}...`}
           aria-label="Input area for User 2"
         />
      </div>
    </div>
  );
}
