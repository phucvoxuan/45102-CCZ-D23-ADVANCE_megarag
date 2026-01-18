'use client';

import { Cookie } from 'lucide-react';
import { StaticPage } from '@/components/marketing/StaticPage';
import { useTranslation } from '@/i18n';

export default function CookiesPage() {
  const { t } = useTranslation();

  return (
    <StaticPage
      slug="cookies"
      icon={<Cookie className="h-3 w-3" />}
      badge={String(t('pages.cookies.badge'))}
      fallbackTitle={String(t('pages.cookies.title'))}
    />
  );
}
