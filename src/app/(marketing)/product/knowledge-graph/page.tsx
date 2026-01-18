'use client';

import Link from 'next/link';
import { Network, Scan, GitBranch, Eye, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

const FEATURE_ICONS = [Scan, GitBranch, Eye, Network];
const FEATURE_KEYS = ['detection', 'mapping', 'visual', 'queries'] as const;
const USE_CASE_KEYS = ['research', 'legal', 'enterprise'] as const;

export default function KnowledgeGraphPage() {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
              <Sparkles className="h-3 w-3" />
              {String(t('pages.knowledgeGraph.badge'))}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              {String(t('pages.knowledgeGraph.titleStart'))}{' '}
              <span className="text-[var(--landing-cyan)]">{String(t('pages.knowledgeGraph.titleHighlight'))}</span>
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)] max-w-2xl mx-auto mb-8">
              {String(t('pages.knowledgeGraph.subtitle'))}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white px-8"
                asChild
              >
                <Link href="/dashboard/explorer">
                  {String(t('common.requestDemo'))} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10 px-8"
                asChild
              >
                <Link href="/docs">{String(t('common.learnMore'))}</Link>
              </Button>
            </div>
          </div>

          {/* Visual Demo */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="relative rounded-2xl border-2 border-[var(--landing-primary)] bg-gradient-to-b from-[var(--landing-primary)]/20 to-[var(--landing-purple)]/20 overflow-hidden">
              <div className="p-8">
                <div className="aspect-video bg-[var(--landing-bg-secondary)]/50 rounded-lg flex items-center justify-center border border-[var(--landing-border)]">
                  <div className="text-center">
                    <Network className="h-16 w-16 text-[var(--landing-cyan)] mx-auto mb-4" />
                    <p className="text-[var(--landing-text-secondary)]">{String(t('pages.knowledgeGraph.demo'))}</p>
                    <p className="text-sm text-[var(--landing-text-muted)] mt-2">
                      {String(t('pages.knowledgeGraph.demoSubtitle'))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-12 text-white">{String(t('pages.knowledgeGraph.features.title'))}</h2>
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
                    <h3 className="text-xl font-semibold mb-2 text-white">{String(t(`pages.knowledgeGraph.features.${featureKey}`))}</h3>
                    <p className="text-[var(--landing-text-secondary)]">{String(t(`pages.knowledgeGraph.features.${featureKey}Desc`))}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Use Cases */}
          <div className="max-w-4xl mx-auto mb-20">
            <h2 className="text-3xl font-bold text-center mb-12 text-white">{String(t('pages.knowledgeGraph.useCases.title'))}</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {USE_CASE_KEYS.map((useCaseKey) => (
                <div key={useCaseKey} className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 text-center hover:border-[var(--landing-cyan)]/30 transition-all">
                  <h3 className="font-semibold mb-2 text-white">{String(t(`pages.knowledgeGraph.useCases.${useCaseKey}`))}</h3>
                  <p className="text-sm text-[var(--landing-text-secondary)]">{String(t(`pages.knowledgeGraph.useCases.${useCaseKey}Desc`))}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.knowledgeGraph.cta.title'))}</h2>
            <p className="text-[var(--landing-text-secondary)] mb-6">
              {String(t('pages.knowledgeGraph.cta.subtitle'))}
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
