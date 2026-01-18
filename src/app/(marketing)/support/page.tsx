'use client';

import Link from 'next/link';
import { LifeBuoy, MessageCircle, BookOpen, Mail, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

const OPTION_ICONS = [BookOpen, MessageCircle, Mail];
const OPTION_KEYS = ['docs', 'community', 'email'] as const;

const RESPONSE_KEYS = ['community', 'emailFree', 'priority', 'dedicated'] as const;

const FAQ_KEYS = ['password', 'processing', 'upgrade', 'export'] as const;

export default function SupportPage() {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
              <LifeBuoy className="h-3 w-3" />
              {String(t('pages.supportPage.badge'))}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              {String(t('pages.supportPage.titlePrefix'))} <span className="text-[var(--landing-cyan)]">{String(t('pages.supportPage.title'))}</span>
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)] max-w-2xl mx-auto">
              {String(t('pages.supportPage.subtitle'))}
            </p>
          </div>

          {/* Support Options */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="grid md:grid-cols-3 gap-6">
              {OPTION_KEYS.map((optionKey, index) => {
                const Icon = OPTION_ICONS[index];
                const link = optionKey === 'docs' ? '/docs' : optionKey === 'community' ? '/community' : 'mailto:support@aidorag.com';
                return (
                  <div
                    key={optionKey}
                    className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 text-center hover:border-[var(--landing-cyan)]/30 transition-all"
                  >
                    <div className="w-12 h-12 rounded-lg bg-[var(--landing-primary)]/20 flex items-center justify-center mb-4 mx-auto">
                      <Icon className="h-6 w-6 text-[var(--landing-cyan)]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-white">{String(t(`pages.supportPage.options.${optionKey}.title`))}</h3>
                    <p className="text-sm text-[var(--landing-text-secondary)] mb-4">{String(t(`pages.supportPage.options.${optionKey}.description`))}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                      asChild
                    >
                      <Link href={link}>{String(t(`pages.supportPage.options.${optionKey}.cta`))}</Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Response Times */}
          <div className="max-w-2xl mx-auto mb-20">
            <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                <Clock className="h-5 w-5 text-[var(--landing-cyan)]" />
                {String(t('pages.supportPage.responseTimes.title'))}
              </h2>
              <div className="space-y-3">
                {RESPONSE_KEYS.map((responseKey, index) => (
                  <div key={responseKey} className={`flex items-center justify-between py-2 ${index < RESPONSE_KEYS.length - 1 ? 'border-b border-[var(--landing-border)]' : ''}`}>
                    <span className="text-white">{String(t(`pages.supportPage.responseTimes.${responseKey}.name`))}</span>
                    <span className="text-sm text-[var(--landing-text-muted)]">{String(t(`pages.supportPage.responseTimes.${responseKey}.time`))}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div className="max-w-3xl mx-auto mb-20">
            <h2 className="text-2xl font-bold mb-6 text-center text-white">{String(t('pages.supportPage.faq.title'))}</h2>
            <div className="space-y-4">
              {FAQ_KEYS.map((faqKey) => (
                <div key={faqKey} className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-6">
                  <h3 className="font-semibold mb-2 text-white">{String(t(`pages.supportPage.faq.items.${faqKey}.question`))}</h3>
                  <p className="text-sm text-[var(--landing-text-secondary)]">{String(t(`pages.supportPage.faq.items.${faqKey}.answer`))}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <Button
                variant="outline"
                className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                asChild
              >
                <Link href="/#faq">{String(t('pages.supportPage.faq.viewAll'))}</Link>
              </Button>
            </div>
          </div>

          {/* System Status */}
          <div className="max-w-xl mx-auto mb-20">
            <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">{String(t('pages.supportPage.systemStatus.title'))}</h2>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                  <CheckCircle2 className="h-3 w-3" />
                  {String(t('pages.supportPage.systemStatus.operational'))}
                </span>
              </div>
              <p className="text-sm text-[var(--landing-text-secondary)] mb-4">
                {String(t('pages.supportPage.systemStatus.description'))}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                asChild
              >
                <Link href="/status">{String(t('pages.supportPage.systemStatus.viewStatus'))}</Link>
              </Button>
            </div>
          </div>

          {/* Contact Form CTA */}
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.supportPage.cta.title'))}</h2>
            <p className="text-[var(--landing-text-secondary)] mb-6">
              {String(t('pages.supportPage.cta.subtitle'))}
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
              asChild
            >
              <Link href="/contact">{String(t('common.contactUs'))}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
