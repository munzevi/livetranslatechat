import React from 'react';
import { MessageSquare } from 'lucide-react'; // Using Lucide icon for simplicity

export function Logo() {
  return (
    <MessageSquare className="w-8 h-8 text-primary" />
    /* Previous SVG logo kept for reference if needed
    <svg
      width="32"
      height="32"
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-primary" // Use primary color from theme
    >
      {/* Two overlapping speech bubbles *//*}
      <path
        d="M20 15 C10 15 5 25 5 35 C5 55 25 75 50 75 C55 75 60 72 60 72 L60 55 C60 55 55 58 50 58 C30 58 20 45 20 35 C20 25 25 15 35 15 L20 15 Z"
        fill="currentColor"
        opacity="0.7"
      />
      <path
        d="M80 25 C90 25 95 35 95 45 C95 65 75 85 50 85 C45 85 40 82 40 82 L40 65 C40 65 45 68 50 68 C70 68 80 55 80 45 C80 35 75 25 65 25 L80 25 Z"
        fill="currentColor"
      />
    </svg>
    */
  );
}
