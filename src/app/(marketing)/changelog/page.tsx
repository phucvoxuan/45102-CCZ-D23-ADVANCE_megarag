'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { History, Sparkles, Bug, Zap, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChangelogType {
  id: string;
  slug: string;
  name_en: string;
  name_vi: string;
  color?: string;
  icon?: string;
}

interface ChangelogEntry {
  id: string;
  version: string;
  title_en: string;
  title_vi: string;
  content_en: string;
  content_vi: string;
  release_date: string;
  is_major: boolean;
  type?: ChangelogType;
}

const TYPE_ICONS: Record<string, typeof Sparkles> = {
  feature: Sparkles,
  improvement: Zap,
  fix: Bug,
  security: Shield,
};

const TYPE_STYLES: Record<string, string> = {
  feature: 'bg-green-500/20 text-green-400',
  improvement: 'bg-blue-500/20 text-blue-400',
  fix: 'bg-orange-500/20 text-orange-400',
  security: 'bg-purple-500/20 text-purple-400',
};

export default function ChangelogPage() {
  const { t, locale } = useTranslation();
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [types, setTypes] = useState<ChangelogType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChangelog = async () => {
      try {
        const res = await fetch('/api/changelog');
        if (res.ok) {
          const data = await res.json();
          setEntries(data.entries || []);
          setTypes(data.types || []);
        }
      } catch (error) {
        console.error('Failed to fetch changelog:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchChangelog();
  }, []);

  const getLocalizedText = (en: string, vi: string) => locale === 'vi' ? vi : en;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  // Group entries by version
  const groupedByVersion = entries.reduce((acc, entry) => {
    if (!acc[entry.version]) {
      acc[entry.version] = {
        version: entry.version,
        date: entry.release_date,
        is_major: entry.is_major,
        changes: []
      };
    }
    acc[entry.version].changes.push(entry);
    return acc;
  }, {} as Record<string, { version: string; date: string; is_major: boolean; changes: ChangelogEntry[] }>);

  const releases = Object.values(groupedByVersion).sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
              <History className="h-3 w-3" />
              {String(t('pages.changelog.badge'))}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              <span className="text-[var(--landing-cyan)]">{String(t('pages.changelog.title'))}</span>
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)] max-w-2xl mx-auto mb-8">
              {String(t('pages.changelog.subtitle'))}
            </p>
            <Button
              variant="outline"
              className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
              asChild
            >
              <Link href="/docs">{String(t('common.viewDocs'))}</Link>
            </Button>
          </div>

          {/* Releases */}
          <div className="max-w-3xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--landing-cyan)]" />
              </div>
            ) : releases.length === 0 ? (
              <div className="text-center py-20">
                <History className="h-16 w-16 mx-auto mb-4 text-[var(--landing-text-muted)]" />
                <p className="text-[var(--landing-text-secondary)]">
                  {locale === 'vi' ? 'Chưa có bản cập nhật nào.' : 'No changelog entries yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-12">
                {releases.map((release, index) => (
                  <div key={release.version} className="relative">
                    {/* Timeline connector */}
                    {index < releases.length - 1 && (
                      <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-[var(--landing-border)] -mb-12 hidden sm:block" />
                    )}

                    <div className="flex gap-6">
                      {/* Version badge */}
                      <div className="flex-shrink-0 hidden sm:block">
                        <div className="w-10 h-10 rounded-full bg-[var(--landing-primary)]/20 border-2 border-[var(--landing-cyan)] flex items-center justify-center relative z-10">
                          <span className="text-xs font-bold text-[var(--landing-cyan)]">
                            {release.version.split('.').slice(0, 2).join('.')}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-xl font-bold text-white">v{release.version}</h3>
                          {index === 0 && (
                            <span className="px-3 py-1 rounded-full text-xs bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] text-white">
                              {String(t('pages.changelog.latest'))}
                            </span>
                          )}
                          {release.is_major && index !== 0 && (
                            <span className="px-3 py-1 rounded-full text-xs bg-[var(--landing-primary)]/20 text-[var(--landing-primary)]">
                              Major
                            </span>
                          )}
                          <span className="text-sm text-[var(--landing-text-muted)]">{formatDate(release.date)}</span>
                        </div>

                        <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-6">
                          <ul className="space-y-3">
                            {release.changes.map((change) => {
                              const typeSlug = change.type?.slug || 'feature';
                              const Icon = TYPE_ICONS[typeSlug] || Sparkles;
                              const typeStyle = TYPE_STYLES[typeSlug] || TYPE_STYLES.feature;

                              return (
                                <li key={change.id} className="flex items-start gap-3">
                                  <div className={`mt-0.5 p-1 rounded flex-shrink-0 ${typeStyle}`}>
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-white font-medium">
                                      {getLocalizedText(change.title_en, change.title_vi)}
                                    </span>
                                    {(change.content_en || change.content_vi) && (
                                      <div className="changelog-content mt-2">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                          {getLocalizedText(change.content_en, change.content_vi)}
                                        </ReactMarkdown>
                                      </div>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subscribe */}
          <div className="max-w-xl mx-auto mt-20 text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.changelog.subscribe.title'))}</h2>
            <p className="text-[var(--landing-text-secondary)] mb-6">
              {String(t('pages.changelog.subscribe.subtitle'))}
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <input
                type="email"
                placeholder={String(t('pages.changelog.subscribe.placeholder'))}
                className="flex-1 h-10 px-4 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 text-white placeholder:text-[var(--landing-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--landing-primary)]"
              />
              <Button className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white">
                {String(t('common.subscribe'))}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .changelog-content {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.9rem;
          line-height: 1.6;
        }
        .changelog-content h2 {
          color: white;
          font-size: 1.25rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--landing-border, rgba(255, 255, 255, 0.1));
        }
        .changelog-content h3 {
          color: white;
          font-size: 1.1rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .changelog-content p {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 0.75rem;
        }
        .changelog-content strong {
          color: white;
          font-weight: 600;
        }
        .changelog-content a {
          color: var(--landing-cyan, #22d3ee);
          text-decoration: none;
        }
        .changelog-content a:hover {
          text-decoration: underline;
        }
        .changelog-content ul, .changelog-content ol {
          margin: 0.75rem 0;
          padding-left: 1.25rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .changelog-content li {
          margin-bottom: 0.375rem;
        }
        .changelog-content code {
          background: rgba(255, 255, 255, 0.1);
          color: var(--landing-cyan, #22d3ee);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.85em;
        }
        .changelog-content pre {
          background: rgba(0, 0, 0, 0.3);
          padding: 0.75rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 0.75rem 0;
        }
        .changelog-content pre code {
          background: transparent;
          padding: 0;
        }
        .changelog-content blockquote {
          border-left: 3px solid var(--landing-cyan, #22d3ee);
          padding-left: 0.75rem;
          margin: 0.75rem 0;
          color: rgba(255, 255, 255, 0.6);
          font-style: italic;
        }
        .changelog-content hr {
          border: none;
          border-top: 1px solid var(--landing-border, rgba(255, 255, 255, 0.1));
          margin: 1.5rem 0;
        }
      `}</style>
    </div>
  );
}
