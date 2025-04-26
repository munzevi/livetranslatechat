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

interface LanguageSelectorProps extends React.AriaAttributes {
  selectedLanguage: string;
  onLanguageChange: (languageCode: string) => void;
  languages: Language[];
}

export function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  languages,
  ...ariaProps
}: LanguageSelectorProps) {
  return (
    <Select onValueChange={onLanguageChange} value={selectedLanguage}>
      <SelectTrigger className="w-full" {...ariaProps}>
        <SelectValue placeholder="Select language" />
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
