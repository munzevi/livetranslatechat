'use client';

import React, { useRef, useEffect } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { TranslationBubble, type Message } from './TranslationBubble';

interface ConversationViewProps {
  conversation: Message[];
}

export function ConversationView({ conversation }: ConversationViewProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
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
    // Use h-full w-full to fill the parent Card
    <ScrollArea className="h-full w-full">
       {/* Add padding here for inner content spacing */}
       <div className="h-full space-y-4 p-4" ref={viewportRef}>
            {conversation.length === 0 && (
            <p className="text-center text-muted-foreground pt-10">Start the conversation!</p>
            )}
            {conversation.map((msg) => (
                <TranslationBubble key={`${msg.id}-${msg.timestamp.getTime()}`} message={msg} />
            ))}
       </div>
       <ScrollBar orientation="vertical" />
    </ScrollArea>
  );
}
