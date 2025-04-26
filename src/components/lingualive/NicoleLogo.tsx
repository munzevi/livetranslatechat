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
      viewBox="0 0 100 30" // Adjusted viewBox for a wider aspect ratio
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-12 h-8 text-primary", className)} // Adjust size as needed
      {...props}
    >
      {/* Sound Wave - adjusted path for smoother peaks and troughs */}
      <path
        d="M10 15 C 15 5, 20 5, 25 15 S 35 25, 40 15 S 50 5, 55 15 S 65 25, 70 15"
        stroke="hsl(var(--primary) / 0.7)" // Slightly lighter primary for the wave
        strokeWidth="2.5"
        fill="none"
      />
      {/* Microphone Icon - adjusted to match the image */}
      {/* Base */}
      <line x1="83" y1="25" x2="91" y2="25" strokeWidth="2" stroke="hsl(var(--primary))" />
      {/* Stand */}
      <line x1="87" y1="25" x2="87" y2="19" strokeWidth="2" stroke="hsl(var(--primary))" />
      {/* Head - Rounded rectangle */}
      <rect x="83" y="10" width="8" height="10" rx="4" ry="4" fill="hsl(var(--primary))" stroke="none" />
       {/* Top semicircle part of the head is achieved via rx/ry on rect */}

    </svg>
  );
}
