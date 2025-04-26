'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Language, LanguageCode } from '@/lib/languages';
import type { Gender } from '@/lib/tts';
import { User, UserRound } from 'lucide-react';

interface UserSettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userNumber: 1 | 2;
  selectedLanguage: LanguageCode;
  onLanguageChange: (languageCode: LanguageCode) => void;
  selectedGender: Gender;
  onGenderChange: (gender: Gender) => void;
  languages: Language[];
}

export function UserSettingsSheet({
  isOpen,
  onOpenChange,
  userNumber,
  selectedLanguage,
  onLanguageChange,
  selectedGender,
  onGenderChange,
  languages,
}: UserSettingsSheetProps) {
  const handleGenderChange = (value: string) => {
    if (value === 'male' || value === 'female' || value === 'neutral' || value === 'any') {
      onGenderChange(value as Gender);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side={userNumber === 1 ? 'left' : 'right'}>
        <SheetHeader>
          <SheetTitle>User {userNumber} Settings</SheetTitle>
          <SheetDescription>
            Select the language and voice gender for User {userNumber}.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 py-6">
          {/* Language Selection */}
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor={`language-${userNumber}`} className="text-right col-span-1">
              Language
            </Label>
            <Select
              value={selectedLanguage}
              onValueChange={(value) => onLanguageChange(value as LanguageCode)}
            >
              <SelectTrigger id={`language-${userNumber}`} className="col-span-2">
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
          </div>

          {/* Gender Selection */}
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor={`gender-${userNumber}`} className="text-right col-span-1">
              Voice Gender
            </Label>
            <RadioGroup
              id={`gender-${userNumber}`}
              value={selectedGender}
              onValueChange={handleGenderChange}
              className="col-span-2 flex items-center space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id={`female-${userNumber}`} />
                <Label htmlFor={`female-${userNumber}`} className="flex items-center gap-1">
                  <User className="w-4 h-4" /> Female
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id={`male-${userNumber}`} />
                <Label htmlFor={`male-${userNumber}`} className="flex items-center gap-1">
                  <UserRound className="w-4 h-4" /> Male
                </Label>
              </div>
               {/* Optionally add Neutral/Any if needed
               <div className="flex items-center space-x-2">
                <RadioGroupItem value="any" id={`any-${userNumber}`} />
                <Label htmlFor={`any-${userNumber}`}>Any</Label>
               </div>
               */}
            </RadioGroup>
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="button">Save Changes</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
