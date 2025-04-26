'use client';

import React, { useRef, useEffect } from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'; // Import ScrollBar
import { TranslationBubble, type Message } from './TranslationBubble';

interface ConversationViewProps {
  conversation: Message[];
  user1Lang: string;
  user2Lang: string;
}

export function ConversationView({ conversation }: ConversationViewProps) { // Removed unused lang props
  const viewportRef = useRef<HTMLDivElement>(null); // Ref for the viewport div inside ScrollArea

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (viewportRef.current) {
       // Use requestAnimationFrame for smoother scrolling after render
       requestAnimationFrame(() => {
           if(viewportRef.current) {
               viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
           }
       });
    }
  }, [conversation]);


  return (
    // Apply h-full to ScrollArea to make it take the height of its flex container
    // Removed ref from ScrollArea itself as we need the inner viewport
    <ScrollArea className="h-full w-full rounded-md border bg-card p-4">
       {/* The direct child of ScrollArea's Viewport gets the ref */}
       <div className="h-full space-y-4" ref={viewportRef}>
            {conversation.length === 0 && (
            <p className="text-center text-muted-foreground pt-4">Start the conversation!</p>
            )}
            {conversation.map((msg) => (
                // Using a combination of id and timestamp for potentially better key uniqueness in high-frequency scenarios
                <TranslationBubble key={`${msg.id}-${msg.timestamp.getTime()}`} message={msg} />
            ))}
       </div>
       <ScrollBar orientation="vertical" /> {/* Explicitly add ScrollBar */}
    </ScrollArea>
  );
}