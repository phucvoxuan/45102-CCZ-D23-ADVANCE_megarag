'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Package, ArrowRight, ExternalLink, Github, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

interface SDK {
  id: string;
  slug: string;
  name: string;
  language: string;
  description_en: string;
  description_vi: string;
  icon: string | null;
  color: string | null;
  package_name: string | null;
  install_command: string | null;
  docs_url: string | null;
  github_url: string | null;
  npm_url: string | null;
  pypi_url: string | null;
  current_version: string | null;
  min_language_version: string | null;
  is_featured: boolean;
}

const COMMUNITY_SDKS = [
  { name: 'Rust', author: 'community', repo: 'aidorag-rust' },
  { name: 'Java', author: 'community', repo: 'aidorag-java' },
  { name: 'PHP', author: 'community', repo: 'aidorag-php' },
];

export default function SDKsPage() {
  const { t, locale } = useTranslation();
  const [sdks, setSdks] = useState<SDK[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sdks')
      .then(res => res.json())
      .then(data => {
        setSdks(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
              <Package className="h-3 w-3" />
              {String(t('pages.sdks.badge'))}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              {String(t('pages.sdks.title'))}
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)] max-w-2xl mx-auto mb-8">
              {String(t('pages.sdks.subtitle'))}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
                asChild
              >
                <Link href="/docs/quickstart">
                  {String(t('pages.sdks.getStarted'))} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                asChild
              >
                <Link href="/docs/api">{String(t('pages.apiReference.title'))}</Link>
              </Button>
            </div>
          </div>

          {/* Official SDKs */}
          <div className="max-w-4xl mx-auto mb-20">
            <h2 className="text-2xl font-bold mb-8 text-center text-white">{String(t('pages.sdks.officialLibraries'))}</h2>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--landing-primary)]" />
              </div>
            ) : sdks.length === 0 ? (
              <p className="text-center text-[var(--landing-text-muted)]">No SDKs available yet.</p>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {sdks.map((sdk) => (
                  <div
                    key={sdk.id}
                    className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-6 hover:border-[var(--landing-cyan)]/30 transition-all"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${sdk.color || 'from-gray-500 to-gray-600'} flex items-center justify-center text-2xl`}>
                        {sdk.icon || '📦'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{sdk.name}</h3>
                        <p className="text-sm text-[var(--landing-text-muted)] font-mono">{sdk.package_name}</p>
                      </div>
                    </div>
                    {sdk.install_command && (
                      <div className="bg-black/30 rounded-lg p-3 mb-4 overflow-x-auto">
                        <code className="text-sm text-[var(--landing-cyan)]">{sdk.install_command}</code>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                        asChild
                      >
                        <Link href={sdk.docs_url || `/docs/sdks/${sdk.slug}`}>
                          {String(t('pages.sdks.viewDocs'))} <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                      {sdk.github_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[var(--landing-text-muted)] hover:text-white hover:bg-white/10"
                          asChild
                        >
                          <a href={sdk.github_url} target="_blank" rel="noopener noreferrer">
                            <Github className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Features */}
          <div className="max-w-3xl mx-auto mb-20">
            <div className="rounded-2xl border-2 border-[var(--landing-primary)] bg-gradient-to-br from-[var(--landing-primary)]/20 to-[var(--landing-purple)]/20 p-8">
              <h2 className="text-2xl font-bold mb-6 text-center text-white">{String(t('pages.sdks.features.title'))}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-[var(--landing-text-secondary)]">{String(t('pages.sdks.features.typeSafe'))}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-[var(--landing-text-secondary)]">{String(t('pages.sdks.features.autoRetry'))}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-[var(--landing-text-secondary)]">{String(t('pages.sdks.features.streaming'))}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                  <span className="text-[var(--landing-text-secondary)]">{String(t('pages.sdks.features.errorHandling'))}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Community SDKs */}
          <div className="max-w-3xl mx-auto mb-20">
            <h2 className="text-2xl font-bold mb-6 text-center text-white">{String(t('pages.sdks.communityLibraries'))}</h2>
            <p className="text-center text-[var(--landing-text-secondary)] mb-8">
              {String(t('pages.sdks.communityDesc'))}
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {COMMUNITY_SDKS.map((sdk) => (
                <a
                  key={sdk.name}
                  href={`https://github.com/${sdk.author}/${sdk.repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 hover:border-[var(--landing-cyan)]/30 transition-all"
                >
                  <span className="font-medium text-white">{sdk.name}</span>
                  <ExternalLink className="h-4 w-4 text-[var(--landing-text-muted)]" />
                </a>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="max-w-2xl mx-auto text-center">
            <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-8">
              <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.sdks.cta.title'))}</h2>
              <p className="text-[var(--landing-text-secondary)] mb-6">
                {String(t('pages.sdks.cta.subtitle'))}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
                  asChild
                >
                  <a href="https://github.com/aidorag" target="_blank" rel="noopener noreferrer">
                    <Github className="mr-2 h-4 w-4" />
                    {String(t('pages.sdks.viewOnGithub'))}
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                  asChild
                >
                  <Link href="/community">{String(t('pages.sdks.joinCommunity'))}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
