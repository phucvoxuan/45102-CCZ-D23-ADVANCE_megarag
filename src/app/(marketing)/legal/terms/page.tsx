'use client';

import { FileText } from 'lucide-react';
import { StaticPage } from '@/components/marketing/StaticPage';
import { useTranslation } from '@/i18n';

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <StaticPage
      slug="terms-of-service"
      icon={<FileText className="h-3 w-3" />}
      badge={String(t('pages.terms.badge'))}
      fallbackTitle={String(t('pages.terms.title'))}
    />
  );
}
