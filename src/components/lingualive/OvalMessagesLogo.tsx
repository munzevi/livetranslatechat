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
      strokeWidth="1.5" // Slightly thinner stroke for a cleaner look
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-8 h-8 text-primary", className)} // Default size and color
      {...props}
    >
      {/* Larger oval bubble (background) - Moved slightly left */}
      <ellipse cx="10" cy="10" rx="6" ry="4" />
      <path d="M6 14s-1 1.5-3 1.5" />

      {/* Smaller oval bubble (foreground) - Moved slightly right and adjusted */}
      <ellipse cx="15" cy="12" rx="5.5" ry="3.5" />
      <path d="M19 15.5s1 1 2.5 1" />
    </svg>
  );
}