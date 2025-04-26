import React from 'react';
import { cn } from '@/lib/utils';

interface OvalMessagesLogoProps extends React.SVGProps<SVGSVGElement> {}

export function OvalMessagesLogo({ className, ...props }: OvalMessagesLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-8 h-8 text-primary", className)} // Default size and color
      {...props}
    >
      {/* Larger oval bubble (background) */}
      <ellipse cx="12" cy="11" rx="7" ry="5" />
      <path d="M8 16s-1.5 2-4 2" />

      {/* Smaller oval bubble (foreground) */}
      <ellipse cx="17" cy="13" rx="5" ry="4" transform="rotate(-10 17 13)"/>
      <path d="M19.5 16.5s1 1.5 3 1.5" />
    </svg>
  );
}
