'use client';

import { useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { X, Sparkles } from 'lucide-react';
import { useTranslation } from '@/i18n';

// Context to share announcement bar visibility state
const AnnouncementContext = createContext<{
  isVisible: boolean;
  setIsVisible: (visible: boolean) => void;
}>({
  isVisible: true,
  setIsVisible: () => {},
});

export const useAnnouncement = () => useContext(AnnouncementContext);

export function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);
  const { t } = useTranslation();

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-violet-600 to-purple-600 text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 py-2.5 text-sm">
          <Sparkles className="h-4 w-4" />
          <span>{String(t('announcement.message'))}</span>
          <Link
            href="/signup"
            className="font-semibold underline underline-offset-4 hover:no-underline ml-1"
          >
            {String(t('announcement.cta'))} →
          </Link>
        </div>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors"
        aria-label="Dismiss announcement"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
