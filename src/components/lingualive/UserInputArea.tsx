'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Send, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserInputAreaProps extends React.AriaAttributes {
  user: 'user1' | 'user2';
  language: string; // Language code for placeholder/actions
  onSend: (text: string, user: 'user1' | 'user2') => void;
  isSpeaking: boolean; // Indicates if the translation is processing
  placeholder?: string;
}

export function UserInputArea({
  user,
  language,
  onSend,
  isSpeaking,
  placeholder,
  ...ariaProps
}: UserInputAreaProps) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false); // Placeholder for voice input state

  const handleSend = useCallback(() => {
    if (inputText.trim() && !isSpeaking) {
      onSend(inputText, user);
      setInputText('');
    }
  }, [inputText, onSend, user, isSpeaking]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const toggleListening = () => {
    // Placeholder for actual voice input logic
    setIsListening(!isListening);
    if (!isListening) {
      // Simulate voice input being captured and sent
      setInputText('Simulated voice input text...');
      // In a real app, you'd likely call onSend here after speech recognition
    } else {
      setInputText(''); // Clear text when stopping listening simulation
    }
  };

  return (
    <div className="flex flex-col gap-2 p-4 border rounded-lg bg-card shadow-sm w-full md:w-1/2">
      <Textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Type or use voice input...'}
        className="flex-1 resize-none bg-input"
        rows={2}
        disabled={isSpeaking || isListening}
        {...ariaProps}
      />
      <div className="flex justify-between items-center">
         <Button
            variant="ghost"
            size="icon"
            onClick={toggleListening}
            disabled={isSpeaking}
            className={cn("text-muted-foreground hover:text-primary", isListening && "text-destructive animate-pulse")}
            aria-label={isListening ? "Stop listening" : "Start voice input"}
          >
            <Mic className="w-5 h-5" />
         </Button>
         <Button
            onClick={handleSend}
            disabled={!inputText.trim() || isSpeaking || isListening}
            size="sm"
            aria-label="Send message"
          >
            {isSpeaking ? (
              <Bot className="w-4 h-4 animate-spin mr-1" /> // Use Bot icon spinning
            ) : (
              <Send className="w-4 h-4 mr-1" />
            )}
            Send
          </Button>
      </div>
    </div>
  );
}
