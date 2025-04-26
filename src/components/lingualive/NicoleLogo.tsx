import React from 'react';
import { cn } from '@/lib/utils';

interface NicoleLogoProps extends React.SVGProps<SVGSVGElement> {}

export function NicoleLogo({ className, ...props }: NicoleLogoProps) {
  // This SVG attempts to replicate the key elements of the provided logo image.
  // The "Nicole" text itself is rendered separately in the header using the Pacifico font.
  // This component provides the soundwave and microphone graphic.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 30" // Adjust viewBox for aspect ratio
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-12 h-8 text-primary", className)} // Adjust size as needed
      {...props}
    >
      {/* Sound Wave */}
      <path
        d="M10 15 Q 15 5, 20 15 T 30 15 Q 35 25, 40 15 T 50 15 Q 55 5, 60 15 T 70 15"
        stroke="hsl(var(--primary))" // Use primary color for the wave
        strokeWidth="2.5"
        fill="none"
      />
      {/* Microphone Icon */}
      {/* Base */}
      <line x1="75" y1="25" x2="85" y2="25" strokeWidth="2" stroke="hsl(var(--primary) / 0.8)" />
      {/* Stand */}
      <line x1="80" y1="25" x2="80" y2="19" strokeWidth="2" stroke="hsl(var(--primary) / 0.8)" />
      {/* Head */}
      <rect x="76" y="10" width="8" height="12" rx="4" fill="hsl(var(--primary) / 0.8)" stroke="none" />
      {/* Top arc */}
       <path d="M76 14 A 4 4 0 0 1 84 14" fill="hsl(var(--primary) / 0.8)" stroke="none"/>

    </svg>
  );
}
