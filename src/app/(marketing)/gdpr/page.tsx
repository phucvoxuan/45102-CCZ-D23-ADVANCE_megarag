'use client';

import { Shield } from 'lucide-react';
import { StaticPage } from '@/components/marketing/StaticPage';
import { useTranslation } from '@/i18n';

export default function GDPRPage() {
  const { t } = useTranslation();

  return (
    <StaticPage
      slug="gdpr"
      icon={<Shield className="h-3 w-3" />}
      badge={String(t('pages.gdpr.badge'))}
      fallbackTitle={String(t('pages.gdpr.title'))}
    />
  );
}
