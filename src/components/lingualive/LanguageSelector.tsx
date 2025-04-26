'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Language } from '@/lib/languages';
import { Globe } from 'lucide-react'; // Import Globe icon
import { cn } from '@/lib/utils'; // Import cn utility

interface LanguageSelectorProps extends React.AriaAttributes {
  selectedLanguage: string;
  onLanguageChange: (languageCode: string) => void;
  languages: Language[];
  className?: string; // Add className prop
}

export function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  languages,
  className, // Destructure className
  ...ariaProps
}: LanguageSelectorProps) {
  return (
    <Select onValueChange={onLanguageChange} value={selectedLanguage}>
      <SelectTrigger
        className={cn(
          "w-full bg-transparent border-none shadow-none text-base font-medium text-primary focus:ring-0 focus:ring-offset-0", // Adjusted base styles
          className // Apply passed className
        )}
        {...ariaProps}
      >
        <div className="flex items-center gap-1.5"> {/* Reduced gap */}
            <Globe className="w-4 h-4 text-muted-foreground" /> {/* Slightly smaller icon */}
            <SelectValue placeholder="Select language" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {languages.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            {language.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
