'use client';

import Link from 'next/link';
import { Rocket, UserPlus, Upload, MessageSquare, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

const STEP_ICONS = [UserPlus, Upload, MessageSquare];
const STEP_KEYS = ['signup', 'upload', 'query'] as const;
const QUERY_MODE_KEYS = ['naive', 'local', 'global', 'hybrid', 'mix'] as const;

export default function QuickstartPage() {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
              <Rocket className="h-3 w-3" />
              {String(t('pages.quickstart.badge'))}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              {String(t('pages.quickstart.title'))}
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)] max-w-2xl mx-auto mb-8">
              {String(t('pages.quickstart.subtitle'))}
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
              asChild
            >
              <Link href="/signup">
                {String(t('pages.quickstart.createAccount'))} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Steps */}
          <div className="max-w-3xl mx-auto mb-20">
            <div className="space-y-8">
              {STEP_KEYS.map((stepKey, index) => {
                const Icon = STEP_ICONS[index];

                return (
                  <div key={stepKey} className="relative">
                    {/* Connector line */}
                    {index < STEP_KEYS.length - 1 && (
                      <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-[var(--landing-border)] -mb-8 hidden sm:block" />
                    )}

                    <div className="flex gap-6">
                      {/* Step number */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] flex items-center justify-center text-white font-bold text-lg relative z-10">
                          {index + 1}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-8">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="h-5 w-5 text-[var(--landing-cyan)]" />
                          <h3 className="text-xl font-semibold text-white">{String(t(`pages.quickstart.steps.${stepKey}.title`))}</h3>
                        </div>
                        <p className="text-[var(--landing-text-secondary)] mb-4">{String(t(`pages.quickstart.steps.${stepKey}.desc`))}</p>

                        <div className="rounded-lg border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-4">
                          <p className="text-sm text-[var(--landing-text-secondary)]">
                            {String(t(`pages.quickstart.steps.${stepKey}.details`))}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Query Modes */}
          <div className="max-w-4xl mx-auto mb-20">
            <h2 className="text-2xl font-bold mb-6 text-center text-white">{String(t('pages.quickstart.queryModes.title'))}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {QUERY_MODE_KEYS.map((modeKey) => (
                <div key={modeKey} className="p-4 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 hover:border-[var(--landing-cyan)]/30 transition-all">
                  <h4 className="font-semibold mb-1 text-white">{String(t(`pages.quickstart.queryModes.${modeKey}`))}</h4>
                  <p className="text-sm text-[var(--landing-text-secondary)]">{String(t(`pages.quickstart.queryModes.${modeKey}Desc`))}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="max-w-2xl mx-auto text-center">
            <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-8">
              <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.quickstart.next.title'))}</h2>
              <p className="text-[var(--landing-text-secondary)] mb-6">
                {String(t('pages.quickstart.next.subtitle'))}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  variant="outline"
                  className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                  asChild
                >
                  <Link href="/docs/api">{String(t('pages.apiReference.title'))}</Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                  asChild
                >
                  <Link href="/product/knowledge-graph">{String(t('pages.knowledgeGraph.badge'))}</Link>
                </Button>
                <Button
                  className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
                  asChild
                >
                  <Link href="/dashboard">{String(t('pages.quickstart.next.dashboard'))}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
