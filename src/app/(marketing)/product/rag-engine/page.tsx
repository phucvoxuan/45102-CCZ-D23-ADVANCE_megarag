'use client';

import Link from 'next/link';
import { Layers, Database, Search, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

const FEATURE_ICONS = [Layers, Database, Search, Zap];
const FEATURE_KEYS = ['chunking', 'embeddings', 'search', 'retrieval'] as const;
const STEP_KEYS = ['upload', 'process', 'index', 'query'] as const;

export default function RAGEnginePage() {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
              {String(t('pages.ragEngine.badge'))}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              {String(t('pages.ragEngine.titleStart'))}{' '}
              <span className="text-[var(--landing-cyan)]">{String(t('pages.ragEngine.titleHighlight'))}</span>
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)] max-w-2xl mx-auto mb-8">
              {String(t('pages.ragEngine.subtitle'))}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white px-8"
                asChild
              >
                <Link href="/signup">
                  {String(t('common.tryFree'))} <ArrowRight className="ml-2 h-4 w-4" />
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

          {/* How It Works */}
          <div className="max-w-5xl mx-auto mb-20">
            <div className="relative rounded-2xl border-2 border-[var(--landing-primary)] bg-gradient-to-b from-[var(--landing-primary)]/20 to-[var(--landing-purple)]/20 p-8 overflow-hidden">
              <h2 className="text-2xl font-bold mb-8 text-center text-white">{String(t('pages.ragEngine.howItWorks'))}</h2>
              <div className="grid md:grid-cols-4 gap-6">
                {STEP_KEYS.map((stepKey, index) => (
                  <div key={stepKey} className="text-center">
                    <div className="w-12 h-12 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-cyan)] flex items-center justify-center mx-auto mb-3 font-bold text-lg border border-[var(--landing-cyan)]/30">
                      {index + 1}
                    </div>
                    <h3 className="font-semibold mb-1 text-white">{String(t(`pages.ragEngine.steps.${stepKey}`))}</h3>
                    <p className="text-sm text-[var(--landing-text-secondary)]">
                      {String(t(`pages.ragEngine.steps.${stepKey}Desc`))}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-12 text-white">{String(t('pages.ragEngine.features.title'))}</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {FEATURE_KEYS.map((featureKey, index) => {
                const Icon = FEATURE_ICONS[index];
                return (
                  <div
                    key={featureKey}
                    className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 hover:border-[var(--landing-cyan)]/30 transition-all"
                  >
                    <div className="w-12 h-12 rounded-lg bg-[var(--landing-primary)]/20 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-[var(--landing-cyan)]" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">{String(t(`pages.ragEngine.features.${featureKey}`))}</h3>
                    <p className="text-[var(--landing-text-secondary)]">{String(t(`pages.ragEngine.features.${featureKey}Desc`))}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Benefits */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="rounded-2xl border border-[var(--landing-border)] bg-gradient-to-br from-[var(--landing-primary)]/10 to-[var(--landing-cyan)]/10 p-8">
              <h2 className="text-2xl font-bold mb-6 text-center text-white">{String(t('pages.ragEngine.benefits.title'))}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[var(--landing-success)] flex-shrink-0" />
                    <span className="text-[var(--landing-text-secondary)]">{String(t(`pages.ragEngine.benefits.items.${index}`))}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.ragEngine.cta.title'))}</h2>
            <p className="text-[var(--landing-text-secondary)] mb-6">
              {String(t('pages.ragEngine.cta.subtitle'))}
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
