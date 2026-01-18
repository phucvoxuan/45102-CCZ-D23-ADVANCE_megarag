'use client';

import Link from 'next/link';
import { Code, FileText, MessageSquare, Network, Search, Copy, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

const CATEGORY_ICONS = {
  documents: FileText,
  query: Search,
  chat: MessageSquare,
  knowledgeGraph: Network,
} as const;

const CATEGORY_KEYS = ['documents', 'query', 'chat', 'knowledgeGraph'] as const;

const endpointData = {
  documents: [
    { method: 'POST', path: '/v1/documents' },
    { method: 'GET', path: '/v1/documents' },
    { method: 'GET', path: '/v1/documents/{id}' },
    { method: 'DELETE', path: '/v1/documents/{id}' },
  ],
  query: [
    { method: 'POST', path: '/v1/query' },
    { method: 'POST', path: '/v1/query/stream' },
  ],
  chat: [
    { method: 'POST', path: '/v1/chat' },
    { method: 'GET', path: '/v1/chat/history' },
  ],
  knowledgeGraph: [
    { method: 'GET', path: '/v1/entities' },
    { method: 'GET', path: '/v1/relations' },
    { method: 'GET', path: '/v1/graph' },
  ],
};

const authExample = `curl -X POST https://api.aidorag.com/v1/query \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "What are the main findings?",
    "mode": "hybrid",
    "limit": 5
  }'`;

export default function APIReferencePage() {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
              <Code className="h-3 w-3" />
              {String(t('pages.apiReference.badge'))}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              {String(t('pages.apiReference.title'))}
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)] max-w-2xl mx-auto mb-8">
              {String(t('pages.apiReference.subtitle'))}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
                asChild
              >
                <Link href="/signup">
                  {String(t('pages.api.getApiKey'))} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                asChild
              >
                <Link href="/docs/quickstart">{String(t('pages.docs.sections.quickstart'))}</Link>
              </Button>
            </div>
          </div>

          {/* Authentication */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold mb-6 text-white">{String(t('pages.apiReference.auth.title'))}</h2>
            <div className="rounded-xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 overflow-hidden">
              <div className="p-6 border-b border-[var(--landing-border)]">
                <p className="text-[var(--landing-text-secondary)]">
                  {String(t('pages.apiReference.auth.desc'))}
                </p>
              </div>
              <div className="relative">
                <div className="flex items-center justify-between px-4 py-2 bg-black/30 border-b border-[var(--landing-border)]">
                  <span className="text-sm font-mono text-[var(--landing-text-muted)]">bash</span>
                  <Button variant="ghost" size="sm" className="text-[var(--landing-text-muted)] hover:text-white hover:bg-white/10">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <pre className="p-4 overflow-x-auto text-sm bg-black/20">
                  <code className="text-[var(--landing-cyan)]">{authExample}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Endpoints */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold mb-6 text-white">{String(t('pages.apiReference.endpoints'))}</h2>
            <div className="space-y-8">
              {CATEGORY_KEYS.map((categoryKey) => {
                const Icon = CATEGORY_ICONS[categoryKey];
                return (
                  <div key={categoryKey} className="rounded-xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--landing-border)] bg-black/20">
                      <Icon className="h-5 w-5 text-[var(--landing-cyan)]" />
                      <h3 className="font-semibold text-white">{String(t(`pages.apiReference.categories.${categoryKey}`))}</h3>
                    </div>
                    <div className="divide-y divide-[var(--landing-border)]">
                      {endpointData[categoryKey].map((endpoint) => (
                        <div
                          key={`${endpoint.method}-${endpoint.path}`}
                          className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <span
                            className={`px-2 py-1 rounded text-xs font-mono font-medium min-w-[60px] text-center ${
                              endpoint.method === 'GET'
                                ? 'bg-green-500/20 text-green-400'
                                : endpoint.method === 'POST'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {endpoint.method}
                          </span>
                          <code className="flex-1 font-mono text-sm text-[var(--landing-text-secondary)]">{endpoint.path}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rate Limits */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold mb-6 text-white">{String(t('pages.apiReference.rateLimits.title'))}</h2>
            <div className="rounded-xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-6">
              <div className="grid sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-[var(--landing-text-muted)] mb-1">{String(t('pages.apiReference.rateLimits.free'))}</p>
                  <p className="text-2xl font-bold text-white">20 <span className="text-sm font-normal text-[var(--landing-text-muted)]">req/day</span></p>
                </div>
                <div>
                  <p className="text-sm text-[var(--landing-text-muted)] mb-1">{String(t('pages.apiReference.rateLimits.pro'))}</p>
                  <p className="text-2xl font-bold text-white">5,000 <span className="text-sm font-normal text-[var(--landing-text-muted)]">req/month</span></p>
                </div>
                <div>
                  <p className="text-sm text-[var(--landing-text-muted)] mb-1">{String(t('pages.apiReference.rateLimits.business'))}</p>
                  <p className="text-2xl font-bold text-white">20,000 <span className="text-sm font-normal text-[var(--landing-text-muted)]">req/month</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Help */}
          <div className="max-w-2xl mx-auto text-center">
            <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-8">
              <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.apiReference.needHelp.title'))}</h2>
              <p className="text-[var(--landing-text-secondary)] mb-6">
                {String(t('pages.apiReference.needHelp.subtitle'))}
              </p>
              <Button
                className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
                asChild
              >
                <Link href="/support">{String(t('common.contactSupport'))}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
