'use client';

import React, { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TranslationBubble, type Message } from './TranslationBubble';

interface ConversationViewProps {
  conversation: Message[];
  user1Lang: string;
  user2Lang: string;
}

export function ConversationView({ conversation, user1Lang, user2Lang }: ConversationViewProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
       const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
       if(viewport) {
         viewport.scrollTop = viewport.scrollHeight;
       }
    }
  }, [conversation]);


  return (
    <ScrollArea className="flex-1 w-full rounded-md border bg-card p-4" ref={scrollAreaRef}>
      <div className="space-y-4">
        {conversation.length === 0 && (
           <p className="text-center text-muted-foreground">Start the conversation!</p>
        )}
        {conversation.map((msg) => (
          <TranslationBubble key={msg.id} message={msg} />
        ))}
      </div>
    </ScrollArea>
  );
}
