'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock, Code, Terminal, Copy, Key, Webhook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

const codeExample = `// Query documents with AIDORag API
const response = await fetch('https://api.aidorag.com/v1/query', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'What are the key findings?',
    mode: 'hybrid',
    limit: 5
  })
});

const data = await response.json();
console.log(data.results);`;

const STEPS = ['setup', 'authenticate', 'query', 'handle'];

export default function ApiIntegrationTutorialPage() {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Back Link */}
          <Link
            href="/tutorials"
            className="inline-flex items-center gap-2 text-[var(--landing-text-muted)] hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            {String(t('pages.tutorialDetail.backToTutorials'))}
          </Link>

          {/* Header */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)]">
                {String(t('pages.tutorials.items.apiIntegration.category'))}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                {String(t('pages.tutorials.items.apiIntegration.level'))}
              </span>
              <span className="flex items-center gap-1 text-xs text-[var(--landing-text-muted)]">
                <Clock className="h-3 w-3" />
                {String(t('pages.tutorials.items.apiIntegration.duration'))}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              {String(t('pages.tutorialDetail.apiIntegration.title'))}
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)]">
              {String(t('pages.tutorialDetail.apiIntegration.description'))}
            </p>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto">
            {/* Code Example */}
            <div className="mb-12 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/80 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--landing-border)] bg-[var(--landing-bg-secondary)]/50">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-[var(--landing-text-muted)]" />
                  <span className="text-sm font-medium text-white">
                    {String(t('pages.tutorialDetail.apiIntegration.codeExample'))}
                  </span>
                </div>
                <Button variant="ghost" size="sm" className="text-[var(--landing-text-muted)] hover:text-white">
                  <Copy className="h-4 w-4 mr-2" />
                  {String(t('pages.api.copy'))}
                </Button>
              </div>
              <pre className="p-4 overflow-x-auto text-sm">
                <code className="text-[var(--landing-text-secondary)]">{codeExample}</code>
              </pre>
            </div>

            {/* Steps */}
            <div className="space-y-6 mb-12">
              {STEPS.map((step, index) => (
                <div
                  key={step}
                  className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-cyan)] flex items-center justify-center font-bold border border-[var(--landing-cyan)]/30">
                      {index + 1}
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      {String(t(`pages.tutorialDetail.apiIntegration.steps.${step}.title`))}
                    </h3>
                  </div>
                  <p className="text-[var(--landing-text-secondary)] ml-14">
                    {String(t(`pages.tutorialDetail.apiIntegration.steps.${step}.content`))}
                  </p>
                </div>
              ))}
            </div>

            {/* API Features */}
            <div className="grid sm:grid-cols-3 gap-6 mb-12">
              <div className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 text-center">
                <div className="w-12 h-12 rounded-xl bg-[var(--landing-primary)]/20 flex items-center justify-center mx-auto mb-4">
                  <Code className="h-6 w-6 text-[var(--landing-cyan)]" />
                </div>
                <h3 className="font-semibold text-white mb-2">
                  {String(t('pages.tutorialDetail.apiIntegration.features.rest'))}
                </h3>
                <p className="text-sm text-[var(--landing-text-muted)]">
                  {String(t('pages.tutorialDetail.apiIntegration.features.restDesc'))}
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 text-center">
                <div className="w-12 h-12 rounded-xl bg-[var(--landing-primary)]/20 flex items-center justify-center mx-auto mb-4">
                  <Key className="h-6 w-6 text-[var(--landing-cyan)]" />
                </div>
                <h3 className="font-semibold text-white mb-2">
                  {String(t('pages.tutorialDetail.apiIntegration.features.auth'))}
                </h3>
                <p className="text-sm text-[var(--landing-text-muted)]">
                  {String(t('pages.tutorialDetail.apiIntegration.features.authDesc'))}
                </p>
              </div>
              <div className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 text-center">
                <div className="w-12 h-12 rounded-xl bg-[var(--landing-primary)]/20 flex items-center justify-center mx-auto mb-4">
                  <Webhook className="h-6 w-6 text-[var(--landing-cyan)]" />
                </div>
                <h3 className="font-semibold text-white mb-2">
                  {String(t('pages.tutorialDetail.apiIntegration.features.webhooks'))}
                </h3>
                <p className="text-sm text-[var(--landing-text-muted)]">
                  {String(t('pages.tutorialDetail.apiIntegration.features.webhooksDesc'))}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-[var(--landing-border)]">
              <Button
                variant="outline"
                className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                asChild
              >
                <Link href="/tutorials/knowledge-graph">
                  <ArrowLeft className="mr-2 h-4 w-4" /> {String(t('pages.tutorialDetail.prevTutorial'))}
                </Link>
              </Button>
              <Button
                className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
                asChild
              >
                <Link href="/tutorials/optimization">
                  {String(t('pages.tutorialDetail.nextTutorial'))} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
