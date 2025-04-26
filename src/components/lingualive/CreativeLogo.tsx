import React from 'react';
import { cn } from '@/lib/utils';

interface CreativeLogoProps extends React.SVGProps<SVGSVGElement> {}

export function CreativeLogo({ className, ...props }: CreativeLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-8 h-8 text-primary", className)} // Default size and color
      {...props}
    >
      {/* Outer speech bubble shape */}
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      {/* Stylized wave/translation element inside */}
      <path d="M7 10h4l2 2h2" />
      <path d="M7 7h10" />
    </svg>
  );
}
