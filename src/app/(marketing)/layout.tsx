'use client';

import { I18nProvider } from '@/i18n';
import { MarketingNav, Footer, AnnouncementBar } from '@/components/marketing';
import { LandingFooter } from '@/components/landing';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <I18nProvider>
      <div className="min-h-screen flex flex-col">
        <AnnouncementBar />
        <MarketingNav />
        <main className="flex-1">{children}</main>
        <LandingFooter />
      </div>
    </I18nProvider>
  );
}
