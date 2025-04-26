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
       // Use requestAnimationFrame to ensure the scroll happens after the DOM update
       requestAnimationFrame(() => {
           if(viewportRef.current) {
               // Scroll the viewport itself, not the outer ScrollArea
               viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
           }
       });
    }
  }, [conversation]); // Dependency is the conversation array


  return (
    // Use h-full w-full to fill the parent Card
    <ScrollArea className="h-full w-full bg-gradient-to-b from-background to-secondary/20 rounded-lg">
       {/*
         Viewport ref is now on the inner div.
         Added pb-4 to ensure the last message isn't cut off.
         Added flex-grow to make this inner div fill the scroll area viewport height.
       */}
       <div
          className="h-full flex flex-col items-center space-y-4 p-4 pb-8" // Increased bottom padding
          ref={viewportRef}
        >
            {conversation.length === 0 && (
            <p className="text-center text-muted-foreground pt-10">Start the conversation!</p>
            )}
            {conversation.map((msg) => (
                // Ensure TranslationBubble doesn't override centering with self-align
                <TranslationBubble key={`${msg.id}-${msg.timestamp.getTime()}`} message={msg} />
            ))}
       </div>
       <ScrollBar orientation="vertical" />
    </ScrollArea>
  );
}
