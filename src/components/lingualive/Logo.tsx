import React from 'react';
import { MessagesSquare } from 'lucide-react'; // Changed from MessageSquare

export function Logo() {
  return (
    <MessagesSquare className="w-8 h-8 text-primary" /> // Using MessagesSquare
  );
}
