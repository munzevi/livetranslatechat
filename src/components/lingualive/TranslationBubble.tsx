'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { languages } from '@/lib/languages';
import { User } from 'lucide-react';

export interface Message {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  user: 'user1' | 'user2';
  timestamp: Date;
}

interface TranslationBubbleProps {
  message: Message;
}

export function TranslationBubble({ message }: TranslationBubbleProps) {
  const isUser1 = message.user === 'user1';
  const sourceLangName = languages.find(l => l.code === message.sourceLanguage)?.name || message.sourceLanguage;
  const targetLangName = languages.find(l => l.code === message.targetLanguage)?.name || message.targetLanguage;

  return (
    <div className={cn('flex flex-col w-full max-w-[80%] md:max-w-[60%]', isUser1 ? 'items-start self-start' : 'items-end self-end')}>
        <span className="text-xs text-muted-foreground mb-1 px-2 flex items-center">
             <User className="w-3 h-3 mr-1"/> User {isUser1 ? 1 : 2} • {sourceLangName}
        </span>
      <Card className={cn(
          'rounded-xl shadow-md',
          isUser1 ? 'bg-background border-primary' : 'bg-primary text-primary-foreground' // User 1 white, User 2 teal
      )}>
        <CardContent className="p-3 space-y-1">
          <p className={cn('text-sm', isUser1 ? 'text-foreground' : 'text-primary-foreground')}>{message.originalText}</p>
          <Separator className={cn('my-1', isUser1 ? 'bg-border' : 'bg-primary-foreground/50')}/>
          <p className={cn('text-sm font-light italic', isUser1 ? 'text-muted-foreground' : 'text-primary-foreground/80')}>
            {message.translatedText}
          </p>
          <p className={cn('text-xs text-right pt-1', isUser1 ? 'text-muted-foreground/70' : 'text-primary-foreground/70')}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {targetLangName}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
