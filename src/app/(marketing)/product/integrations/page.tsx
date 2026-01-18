'use client';

import Link from 'next/link';
import { Plug, MessageSquare, FileText, Cloud, Zap, ArrowRight, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

const INTEGRATION_ICONS = {
  slack: MessageSquare,
  notion: FileText,
  gdrive: Cloud,
  zapier: Zap,
} as const;

const INTEGRATION_KEYS = ['slack', 'notion', 'gdrive', 'zapier'] as const;
const INTEGRATION_STATUS = {
  slack: 'available',
  notion: 'available',
  gdrive: 'coming',
  zapier: 'coming',
} as const;

export default function IntegrationsPage() {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
              <Plug className="h-3 w-3" />
              {String(t('pages.integrations.badge'))}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              {String(t('pages.integrations.titleStart'))}{' '}
              <span className="text-[var(--landing-cyan)]">{String(t('pages.integrations.titleHighlight'))}</span>
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)] max-w-2xl mx-auto mb-8">
              {String(t('pages.integrations.subtitle'))}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white px-8"
                asChild
              >
                <Link href="/signup">
                  {String(t('common.getStarted'))} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10 px-8"
                asChild
              >
                <Link href="/docs">{String(t('common.viewDocs'))}</Link>
              </Button>
            </div>
          </div>

          {/* Integration Cards */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="grid sm:grid-cols-2 gap-6">
              {INTEGRATION_KEYS.map((integrationKey) => {
                const Icon = INTEGRATION_ICONS[integrationKey];
                const status = INTEGRATION_STATUS[integrationKey];
                return (
                  <div
                    key={integrationKey}
                    className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 hover:border-[var(--landing-cyan)]/30 transition-all relative overflow-hidden"
                  >
                    {status === 'coming' && (
                      <span className="absolute top-4 right-4 px-2 py-1 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-xs font-medium">
                        {String(t('pages.integrations.comingSoon'))}
                      </span>
                    )}
                    <div className="w-12 h-12 rounded-lg bg-[var(--landing-primary)]/20 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-[var(--landing-cyan)]" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">{String(t(`pages.integrations.items.${integrationKey}`))}</h3>
                    <p className="text-[var(--landing-text-secondary)] mb-4">{String(t(`pages.integrations.items.${integrationKey}Desc`))}</p>
                    {status === 'available' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                        asChild
                      >
                        <Link href="/docs">{String(t('pages.integrations.setupGuide'))}</Link>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[var(--landing-text-muted)]"
                        disabled
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        {String(t('pages.integrations.notifyMe'))}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Request Integration */}
          <div className="max-w-2xl mx-auto mb-20">
            <div className="rounded-2xl border-2 border-[var(--landing-primary)] bg-gradient-to-br from-[var(--landing-primary)]/20 to-[var(--landing-cyan)]/20 p-8 text-center">
              <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.integrations.request.title'))}</h2>
              <p className="text-[var(--landing-text-secondary)] mb-6">
                {String(t('pages.integrations.request.subtitle'))}
              </p>
              <Button
                className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
                asChild
              >
                <Link href="/contact">{String(t('pages.integrations.request.cta'))}</Link>
              </Button>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.integrations.cta.title'))}</h2>
            <p className="text-[var(--landing-text-secondary)] mb-6">
              {String(t('pages.integrations.cta.subtitle'))}
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white px-8"
              asChild
            >
              <Link href="/signup">{String(t('common.getStarted'))}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
