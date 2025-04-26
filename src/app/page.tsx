'use client';

import React, { useState, useCallback } from 'react';
import { LanguageSelector } from '@/components/lingualive/LanguageSelector';
import { ConversationView } from '@/components/lingualive/ConversationView';
import { UserInputArea } from '@/components/lingualive/UserInputArea';
import { Card, CardContent } from '@/components/ui/card';
import { translateText, type TranslationRequest, type TranslationResult } from '@/services/translation';
import type { Message } from '@/components/lingualive/TranslationBubble'; // Renamed from ConversationItem to Message
import { languages } from '@/lib/languages';
import { Separator } from '@/components/ui/separator';
import { Bot } from 'lucide-react'; // Using Bot icon as a placeholder brand icon

export default function LinguaLiveApp() {
  const [user1Lang, setUser1Lang] = useState<string>('en');
  const [user2Lang, setUser2Lang] = useState<string>('es');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isUser1Speaking, setIsUser1Speaking] = useState<boolean>(false);
  const [isUser2Speaking, setIsUser2Speaking] = useState<boolean>(false);

  const handleTranslate = useCallback(async (text: string, sourceUser: 'user1' | 'user2') => {
    const sourceLanguage = sourceUser === 'user1' ? user1Lang : user2Lang;
    const targetLanguage = sourceUser === 'user1' ? user2Lang : user1Lang;

    if (!text || !sourceLanguage || !targetLanguage) return;

    const request: TranslationRequest = {
      text,
      sourceLanguage,
      targetLanguage,
    };

    // Indicate speaking state
    if (sourceUser === 'user1') setIsUser1Speaking(true);
    else setIsUser2Speaking(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      const result: TranslationResult = await translateText(request);

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
    } catch (error) {
      console.error('Translation failed:', error);
      // Handle error display if needed (e.g., using toast)
    } finally {
       if (sourceUser === 'user1') setIsUser1Speaking(false);
       else setIsUser2Speaking(false);
    }

  }, [user1Lang, user2Lang]);

  // Simulate receiving input and triggering translation
  const handleUserInput = (text: string, user: 'user1' | 'user2') => {
    handleTranslate(text, user);
  };

  return (
    <div className="flex flex-col h-screen bg-secondary p-4">
      <header className="flex items-center justify-center mb-4 p-2 rounded-lg bg-background shadow-sm">
         <Bot className="w-6 h-6 mr-2 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">LinguaLive</h1>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
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

      <Separator className="my-4" />

      <ConversationView conversation={conversation} user1Lang={user1Lang} user2Lang={user2Lang} />

      <Separator className="my-4" />

      <div className="flex flex-col md:flex-row gap-4 mt-auto">
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
