'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { languages } from '@/lib/languages';
import { User, Languages, AlertTriangle } from 'lucide-react'; // Using Languages icon for translation
import { Skeleton } from '@/components/ui/skeleton';

export interface Message {
  id: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  user: 'user1' | 'user2';
  timestamp: Date;
  isVoiceInput?: boolean; // Optional flag
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
  const isSameLanguage = message.sourceLanguage === message.targetLanguage && message.originalText === message.translatedText;

  return (
    <div className={cn(
        'flex flex-col w-full max-w-[85%] md:max-w-[70%]', // Maintain max-width
        // Remove self-start/self-end to allow parent centering
        isUser1 ? 'items-start' : 'items-end' // Align internal items based on user
    )}>
        {/* User Info Header */}
        <span className="text-xs text-muted-foreground mb-1 px-1 flex items-center">
             <User className="w-3 h-3 mr-1 flex-shrink-0"/> User {isUser1 ? 1 : 2} • {sourceLangName}
        </span>

        {/* Message Card */}
        <Card className={cn(
          'rounded-lg shadow-sm w-fit', // Use w-fit, slightly less rounded corners
          isUser1
             ? 'bg-background border border-border' // User 1: White background, standard border
             : 'bg-primary text-primary-foreground border-none' // User 2: Primary background, white text, no border
        )}>
          <CardContent className="p-2.5 space-y-1.5"> {/* Adjusted padding and spacing */}
            {/* Original Text */}
            <p className={cn(
                'text-sm break-words',
                isUser1 ? 'text-foreground' : 'text-primary-foreground'
            )}>
              {message.originalText}
            </p>

            {/* Translation Section (Separator and Text/Status) */}
            {!isSameLanguage && (
              <>
                 <Separator className={cn('my-1', isUser1 ? 'bg-border/50' : 'bg-primary-foreground/30')}/> {/* Lighter separator */}
                 <div className="flex items-start gap-1.5 text-sm"> {/* Use items-start for alignment */}
                     {isPlaceholder ? (
                         <Skeleton className="h-4 w-full my-0.5" />
                     ) : isError ? (
                         <>
                            <AlertTriangle className={cn(
                                "w-4 h-4 mt-0.5 flex-shrink-0", // Add margin-top for alignment
                                isUser1 ? 'text-destructive' : 'text-destructive-foreground/80' // Slightly muted error color for user 2
                                )} />
                            <p className={cn(
                                'font-light italic',
                                isUser1 ? 'text-destructive' : 'text-destructive-foreground/80'
                                )}>
                                {message.translatedText}
                            </p>
                         </>
                     ) : (
                         <>
                            {/* Using Languages icon as per the image */}
                            <Languages className={cn(
                                "w-4 h-4 mt-0.5 flex-shrink-0",
                                isUser1 ? 'text-muted-foreground' : 'text-primary-foreground/80'
                                )} />
                             <p className={cn(
                                 'font-light italic break-words',
                                 isUser1 ? 'text-muted-foreground' : 'text-primary-foreground/80' // Muted italic style for translation
                                )}>
                                {message.translatedText}
                            </p>
                         </>
                     )}
                 </div>
               </>
            )}

            {/* Timestamp and Target Language Footer */}
            <p className={cn(
                'text-xs text-right pt-1',
                 isUser1 ? 'text-muted-foreground/80' : 'text-primary-foreground/80', // Consistent muted style
                 isSameLanguage ? 'mt-1' : ''
             )}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {!isSameLanguage && ` • ${targetLangName}`}
            </p>
          </CardContent>
        </Card>
    </div>
  );
}
