'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { languages } from '@/lib/languages';
import { User, AlertTriangle, Languages } from 'lucide-react'; // Import icons
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

export interface Message {
  id: string;
  originalText: string;
  translatedText: string; // Can be '...', translation, or error message
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

  const isPlaceholder = message.translatedText === '...';
  const isError = message.translatedText.startsWith('Error:') || message.translatedText.startsWith('Translation currently unavailable');
  const isSameLanguage = message.sourceLanguage === message.targetLanguage && message.originalText === message.translatedText; // Check if translation was skipped

  return (
    <div className={cn(
        'flex flex-col w-full max-w-[80%] md:max-w-[65%]', // Slightly increased max-width
        isUser1 ? 'items-start self-start' : 'items-end self-end'
    )}>
        <span className="text-xs text-muted-foreground mb-1 px-2 flex items-center">
             <User className="w-3 h-3 mr-1 flex-shrink-0"/> User {isUser1 ? 1 : 2} • {sourceLangName}
        </span>
      <Card className={cn(
          'rounded-xl shadow-md w-fit', // Use w-fit to allow bubble to size to content
          isUser1 ? 'bg-background border-primary' : 'bg-primary text-primary-foreground'
      )}>
        <CardContent className="p-3 space-y-1">
          {/* Original Text */}
          <p className={cn('text-sm break-words', isUser1 ? 'text-foreground' : 'text-primary-foreground')}>
              {message.originalText}
          </p>

          {/* Show separator and translation area only if translation is expected/done/failed */}
          {!isSameLanguage && (
              <>
                 <Separator className={cn('my-1', isUser1 ? 'bg-border' : 'bg-primary-foreground/50')}/>
                 <div className="flex items-center gap-2">
                     {isPlaceholder ? (
                         <Skeleton className="h-4 w-full my-0.5" /> // Show skeleton while loading
                     ) : isError ? (
                         <>
                            <AlertTriangle className={cn("w-4 h-4 flex-shrink-0", isUser1 ? 'text-destructive' : 'text-destructive-foreground')} />
                            <p className={cn('text-sm font-light italic', isUser1 ? 'text-destructive' : 'text-destructive-foreground')}>
                                {message.translatedText}
                            </p>
                         </>
                     ) : (
                         <>
                            <Languages className={cn("w-4 h-4 flex-shrink-0", isUser1 ? 'text-muted-foreground' : 'text-primary-foreground/80')} />
                             <p className={cn('text-sm font-light italic break-words', isUser1 ? 'text-muted-foreground' : 'text-primary-foreground/80')}>
                                {message.translatedText}
                            </p>
                         </>
                     )}
                 </div>
               </>
          )}

          {/* Timestamp and Target Language */}
          <p className={cn(
              'text-xs text-right pt-1',
              isUser1 ? 'text-muted-foreground/70' : 'text-primary-foreground/70',
              isSameLanguage ? 'mt-1' : '' // Add margin-top if translation isn't shown
          )}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {!isSameLanguage && ` • ${targetLangName}`} {/* Show target lang only if translated */}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}