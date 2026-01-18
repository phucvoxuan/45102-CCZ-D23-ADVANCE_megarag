'use client';

import { Lock } from 'lucide-react';
import { StaticPage } from '@/components/marketing/StaticPage';
import { useTranslation } from '@/i18n';

export default function SecurityPage() {
  const { t } = useTranslation();

  return (
    <StaticPage
      slug="security"
      icon={<Lock className="h-3 w-3" />}
      badge={String(t('pages.security.badge'))}
      fallbackTitle={String(t('pages.security.title'))}
    />
  );
}
