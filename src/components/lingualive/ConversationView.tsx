'use client';

import React, { useRef, useEffect } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TranslationBubble, type Message } from './TranslationBubble';

interface ConversationViewProps {
  conversation: Message[];
}

export function ConversationView({ conversation }: ConversationViewProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
       requestAnimationFrame(() => {
           if(viewportRef.current) {
               viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
           }
       });
    }
  }, [conversation]);


  return (
    <ScrollArea className="h-full w-full bg-gradient-to-b from-background to-secondary/20 rounded-lg">
       <div
          className="h-full flex flex-col items-center space-y-4 p-4 pb-8"
          ref={viewportRef}
        >
            {/* Removed the initial message paragraph */}
            {conversation.map((msg) => (
                <TranslationBubble key={`${msg.id}-${msg.timestamp.getTime()}`} message={msg} />
            ))}
       </div>
       <ScrollBar orientation="vertical" />
    </ScrollArea>
  );
}
