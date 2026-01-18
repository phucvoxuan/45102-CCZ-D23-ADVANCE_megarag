'use client';

import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Code, FileText, Key, Bell, Gauge, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

const VALID_SLUGS = ['upload', 'query-modes', 'knowledge-graph', 'api-auth', 'webhooks', 'rate-limits'] as const;
type ValidSlug = (typeof VALID_SLUGS)[number];

const SLUG_TO_KEY: Record<ValidSlug, string> = {
  'upload': 'upload',
  'query-modes': 'queryModes',
  'knowledge-graph': 'knowledgeGraph',
  'api-auth': 'apiAuth',
  'webhooks': 'webhooks',
  'rate-limits': 'rateLimits',
};

const TOPIC_ICONS: Record<ValidSlug, typeof BookOpen> = {
  'upload': FileText,
  'query-modes': Code,
  'knowledge-graph': BookOpen,
  'api-auth': Key,
  'webhooks': Bell,
  'rate-limits': Gauge,
};

export default function DocTopicPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { t } = useTranslation();

  if (!VALID_SLUGS.includes(slug as ValidSlug)) {
    notFound();
  }

  const topicKey = SLUG_TO_KEY[slug as ValidSlug];
  const Icon = TOPIC_ICONS[slug as ValidSlug];

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Back Link */}
          <div className="max-w-3xl mx-auto mb-8">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 text-[var(--landing-text-secondary)] hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {String(t('pages.docTopic.backToDocs'))}
            </Link>
          </div>

          {/* Topic Header */}
          <div className="max-w-3xl mx-auto">
            <header className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-[var(--landing-primary)]/20 flex items-center justify-center">
                  <Icon className="h-7 w-7 text-[var(--landing-cyan)]" />
                </div>
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-2">
                    {String(t('pages.docTopic.documentation'))}
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white">
                    {String(t(`pages.docTopic.topics.${topicKey}.title`))}
                  </h1>
                </div>
              </div>
              <p className="text-xl text-[var(--landing-text-secondary)]">
                {String(t(`pages.docTopic.topics.${topicKey}.subtitle`))}
              </p>
            </header>

            {/* Content */}
            <div className="space-y-8">
              {/* Overview */}
              <section>
                <h2 className="text-xl font-bold mb-4 text-white">{String(t('pages.docTopic.overview'))}</h2>
                <p className="text-[var(--landing-text-secondary)]">
                  {String(t(`pages.docTopic.topics.${topicKey}.overview`))}
                </p>
              </section>

              {/* Key Features */}
              <section>
                <h2 className="text-xl font-bold mb-4 text-white">{String(t('pages.docTopic.keyFeatures'))}</h2>
                <ul className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-[var(--landing-text-secondary)]">
                        {String(t(`pages.docTopic.topics.${topicKey}.features.item${i}`))}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Code Example */}
              <section>
                <h2 className="text-xl font-bold mb-4 text-white">{String(t('pages.docTopic.example'))}</h2>
                <div className="bg-black/40 rounded-xl border border-[var(--landing-border)] p-6 overflow-x-auto">
                  <pre className="text-sm text-[var(--landing-cyan)]">
                    <code>{String(t(`pages.docTopic.topics.${topicKey}.codeExample`))}</code>
                  </pre>
                </div>
              </section>

              {/* Best Practices */}
              <section className="rounded-xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-6">
                <h2 className="text-xl font-bold mb-4 text-white">{String(t('pages.docTopic.bestPractices'))}</h2>
                <ul className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-[var(--landing-cyan)] flex-shrink-0 mt-0.5" />
                      <span className="text-[var(--landing-text-secondary)]">
                        {String(t(`pages.docTopic.topics.${topicKey}.bestPractices.item${i}`))}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Related Links */}
              <section className="pt-8 border-t border-[var(--landing-border)]">
                <h2 className="text-xl font-bold mb-4 text-white">{String(t('pages.docTopic.relatedTopics'))}</h2>
                <div className="flex flex-wrap gap-3">
                  {VALID_SLUGS.filter(s => s !== slug).slice(0, 3).map((relatedSlug) => {
                    const relatedKey = SLUG_TO_KEY[relatedSlug];
                    return (
                      <Link
                        key={relatedSlug}
                        href={`/docs/topics/${relatedSlug}`}
                        className="px-4 py-2 rounded-full border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 hover:border-[var(--landing-cyan)]/30 transition-colors text-sm text-white"
                      >
                        {String(t(`pages.docTopic.topics.${relatedKey}.title`))}
                      </Link>
                    );
                  })}
                </div>
              </section>

              {/* CTA */}
              <section className="text-center py-8">
                <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-8">
                  <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.docTopic.needMoreHelp'))}</h2>
                  <p className="text-[var(--landing-text-secondary)] mb-6">
                    {String(t('pages.docTopic.needMoreHelpSubtitle'))}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
                      asChild
                    >
                      <Link href="/docs/api">{String(t('pages.docTopic.viewApiRef'))}</Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                      asChild
                    >
                      <Link href="/support">{String(t('common.contactSupport'))}</Link>
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
