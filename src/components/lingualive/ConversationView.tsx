'use client';

import React, { useRef, useEffect } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'; // Import ScrollBar
import { TranslationBubble, type Message } from './TranslationBubble';

interface ConversationViewProps {
  conversation: Message[];
  // user1Lang and user2Lang removed as they were unused
}

export function ConversationView({ conversation }: ConversationViewProps) {
  const viewportRef = useRef<HTMLDivElement>(null); // Ref for the viewport div inside ScrollArea

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
    // Removed background, border, and padding from ScrollArea
    // Added padding directly to the inner div for spacing from edges
    <ScrollArea className="h-full w-full">
       <div className="h-full space-y-4 px-2 sm:px-4" ref={viewportRef}>
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
