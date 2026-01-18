'use client';

import { Shield } from 'lucide-react';
import { StaticPage } from '@/components/marketing/StaticPage';
import { useTranslation } from '@/i18n';

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <StaticPage
      slug="privacy-policy"
      icon={<Shield className="h-3 w-3" />}
      badge={String(t('pages.privacy.badge'))}
      fallbackTitle={String(t('pages.privacy.title'))}
    />
  );
}
