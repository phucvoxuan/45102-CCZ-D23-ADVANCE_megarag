'use client';

import Link from 'next/link';
import { Code, Terminal, Webhook, Key, ArrowRight, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

const FEATURE_ICONS = [Code, Key, Webhook];
const FEATURE_KEYS = ['rest', 'keys', 'webhooks'] as const;

const codeExample = `// Query your documents with AIDORag API
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

export default function APIPage() {
  const { t } = useTranslation();

  const endpoints = [
    { method: 'POST', path: '/api/documents', descKey: 'upload' },
    { method: 'GET', path: '/api/documents', descKey: 'list' },
    { method: 'GET', path: '/api/documents/:id', descKey: 'get' },
    { method: 'DELETE', path: '/api/documents/:id', descKey: 'delete' },
    { method: 'POST', path: '/api/query', descKey: 'query' },
    { method: 'POST', path: '/api/query/stream', descKey: 'stream' },
    { method: 'POST', path: '/api/chat', descKey: 'chat' },
    { method: 'GET', path: '/api/chat/history', descKey: 'history' },
    { method: 'GET', path: '/api/entities', descKey: 'entities' },
    { method: 'GET', path: '/api/relations', descKey: 'relations' },
    { method: 'GET', path: '/api/graph', descKey: 'graph' },
  ];

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
              {String(t('pages.api.badge'))}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              {String(t('pages.api.titleStart'))}{' '}
              <span className="text-[var(--landing-cyan)]">{String(t('pages.api.titleHighlight'))}</span>
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)] max-w-2xl mx-auto mb-8">
              {String(t('pages.api.subtitle'))}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white px-8"
                asChild
              >
                <Link href="/docs/api">
                  {String(t('common.viewDocs'))} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10 px-8"
                asChild
              >
                <Link href="/signup">{String(t('pages.api.getApiKey'))}</Link>
              </Button>
            </div>
          </div>

          {/* Code Example */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/80 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--landing-border)] bg-[var(--landing-bg-secondary)]/50">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-[var(--landing-text-muted)]" />
                  <span className="text-sm font-medium text-white">{String(t('pages.api.example'))}</span>
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
          </div>

          {/* Features */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold text-center mb-12 text-white">{String(t('pages.api.features.title'))}</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {FEATURE_KEYS.map((featureKey, index) => {
                const Icon = FEATURE_ICONS[index];
                return (
                  <div key={featureKey} className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 text-center hover:border-[var(--landing-cyan)]/30 transition-all">
                    <div className="w-12 h-12 rounded-lg bg-[var(--landing-primary)]/20 flex items-center justify-center mb-4 mx-auto">
                      <Icon className="h-6 w-6 text-[var(--landing-cyan)]" />
                    </div>
                    <h3 className="font-semibold mb-2 text-white">{String(t(`pages.api.features.${featureKey}`))}</h3>
                    <p className="text-sm text-[var(--landing-text-secondary)]">{String(t(`pages.api.features.${featureKey}Desc`))}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Endpoints */}
          <div className="max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl font-bold text-center mb-12 text-white">{String(t('pages.api.endpoints.title'))}</h2>
            <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 overflow-hidden">
              <div className="divide-y divide-[var(--landing-border)]">
                {endpoints.map((endpoint) => (
                  <div key={`${endpoint.method}-${endpoint.path}`} className="flex items-center gap-4 p-4 hover:bg-[var(--landing-bg-secondary)]/30 transition-colors">
                    <span className={`px-2 py-1 rounded text-xs font-mono font-medium ${
                      endpoint.method === 'GET' ? 'bg-green-500/20 text-green-400' :
                      endpoint.method === 'DELETE' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {endpoint.method}
                    </span>
                    <code className="flex-1 font-mono text-sm text-white">{endpoint.path}</code>
                    <span className="text-sm text-[var(--landing-text-secondary)]">{String(t(`pages.api.endpoints.${endpoint.descKey}`))}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.api.cta.title'))}</h2>
            <p className="text-[var(--landing-text-secondary)] mb-6">
              {String(t('pages.api.cta.subtitle'))}
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
