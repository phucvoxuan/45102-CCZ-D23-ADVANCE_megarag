'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useI18n, locales, localeNames, localeFlags, Locale } from '@/i18n';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{localeFlags[locale]}</span>
        <span className="hidden md:inline">{localeNames[locale]}</span>
        <ChevronDown
          className={cn(
            'h-3 w-3 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      <div
        className={cn(
          'absolute right-0 top-full mt-2 w-40 rounded-lg border bg-card shadow-lg transition-all duration-200 z-50',
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        )}
        role="listbox"
      >
        <div className="p-1">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => handleSelect(l)}
              className={cn(
                'flex items-center justify-between w-full px-3 py-2 text-sm rounded-md transition-colors',
                locale === l
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-muted'
              )}
              role="option"
              aria-selected={locale === l}
            >
              <span className="flex items-center gap-2">
                <span>{localeFlags[l]}</span>
                <span>{localeNames[l]}</span>
              </span>
              {locale === l && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Compact version for mobile
export function LanguageSwitcherCompact() {
  const { locale, setLocale } = useI18n();

  const handleToggle = () => {
    const currentIndex = locales.indexOf(locale);
    const nextIndex = (currentIndex + 1) % locales.length;
    setLocale(locales[nextIndex]);
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
      title={`Current: ${localeNames[locale]}. Click to switch.`}
    >
      <span className="text-lg">{localeFlags[locale]}</span>
      <span>{localeNames[locale]}</span>
    </button>
  );
}
