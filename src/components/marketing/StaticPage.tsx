'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface StaticPageData {
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
  meta_description_en?: string;
  meta_description_vi?: string;
  content_en: string;
  content_vi: string;
  is_published: boolean;
  updated_at: string;
}

interface StaticPageProps {
  slug: string;
  icon?: React.ReactNode;
  badge?: string;
  fallbackTitle?: string;
}

export function StaticPage({ slug, icon, badge, fallbackTitle }: StaticPageProps) {
  const { locale } = useTranslation();
  const [page, setPage] = useState<StaticPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await fetch(`/api/pages/${slug}`);
        if (!res.ok) {
          throw new Error('Page not found');
        }
        const data = await res.json();
        setPage(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load page');
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  const title = page ? (locale === 'vi' ? page.title_vi : page.title_en) : fallbackTitle;
  const content = page ? (locale === 'vi' ? page.content_vi : page.content_en) : '';

  if (loading) {
    return (
      <div className="relative">
        <ParticleBackground />
        <div className="relative z-10 pt-32 pb-24">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--landing-cyan)]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="relative">
        <ParticleBackground />
        <div className="relative z-10 pt-32 pb-24">
          <div className="container mx-auto px-4">
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold text-white mb-4">
                {locale === 'vi' ? 'Trang không tìm thấy' : 'Page Not Found'}
              </h1>
              <p className="text-[var(--landing-text-secondary)]">
                {locale === 'vi'
                  ? 'Trang bạn tìm kiếm không tồn tại hoặc chưa được xuất bản.'
                  : 'The page you are looking for does not exist or has not been published.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            {badge && (
              <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
                {icon}
                {badge}
              </span>
            )}
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">{title}</h1>
            <p className="text-[var(--landing-text-muted)]">
              {locale === 'vi' ? 'Cập nhật lần cuối: ' : 'Last updated: '}
              {new Date(page.updated_at).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>

          {/* Content */}
          <div className="max-w-3xl mx-auto">
            <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-6 md:p-8">
              <div className="static-page-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          <style jsx global>{`
            .static-page-content {
              color: rgba(255, 255, 255, 0.8);
              font-size: 1.125rem;
              line-height: 1.75;
            }
            .static-page-content h1 {
              color: white;
              font-size: 1.875rem;
              font-weight: 700;
              margin-bottom: 1.5rem;
              margin-top: 0;
            }
            .static-page-content h2 {
              color: white;
              font-size: 1.5rem;
              font-weight: 700;
              margin-top: 2rem;
              margin-bottom: 1rem;
              padding-bottom: 0.5rem;
              border-bottom: 1px solid var(--landing-border, rgba(255, 255, 255, 0.1));
            }
            .static-page-content h3 {
              color: white;
              font-size: 1.25rem;
              font-weight: 600;
              margin-top: 1.5rem;
              margin-bottom: 0.75rem;
            }
            .static-page-content p {
              color: rgba(255, 255, 255, 0.7);
              margin-bottom: 1rem;
              line-height: 1.75;
            }
            .static-page-content strong {
              color: white;
              font-weight: 600;
            }
            .static-page-content a {
              color: var(--landing-cyan, #22d3ee);
              text-decoration: none;
            }
            .static-page-content a:hover {
              text-decoration: underline;
            }
            .static-page-content ul, .static-page-content ol {
              margin: 1rem 0;
              padding-left: 1.5rem;
              color: rgba(255, 255, 255, 0.7);
            }
            .static-page-content li {
              margin-bottom: 0.5rem;
              color: rgba(255, 255, 255, 0.7);
            }
            .static-page-content table {
              width: 100%;
              border-collapse: collapse;
              margin: 1.5rem 0;
            }
            .static-page-content th {
              text-align: left;
              color: white;
              font-weight: 600;
              padding: 0.75rem;
              border-bottom: 1px solid var(--landing-border, rgba(255, 255, 255, 0.1));
            }
            .static-page-content td {
              padding: 0.75rem;
              color: rgba(255, 255, 255, 0.7);
              border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            }
            .static-page-content code {
              background: rgba(255, 255, 255, 0.1);
              color: var(--landing-cyan, #22d3ee);
              padding: 0.125rem 0.375rem;
              border-radius: 0.25rem;
              font-size: 0.875em;
            }
            .static-page-content pre {
              background: rgba(0, 0, 0, 0.3);
              padding: 1rem;
              border-radius: 0.5rem;
              overflow-x: auto;
              margin: 1rem 0;
            }
            .static-page-content pre code {
              background: transparent;
              padding: 0;
            }
            .static-page-content blockquote {
              border-left: 4px solid var(--landing-cyan, #22d3ee);
              padding-left: 1rem;
              margin: 1rem 0;
              color: rgba(255, 255, 255, 0.6);
              font-style: italic;
            }
            .static-page-content hr {
              border: none;
              border-top: 1px solid var(--landing-border, rgba(255, 255, 255, 0.1));
              margin: 2rem 0;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
