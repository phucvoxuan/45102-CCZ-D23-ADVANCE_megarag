'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookOpen, Loader2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DocArticle {
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
  excerpt_en: string;
  excerpt_vi: string;
  content_en: string;
  content_vi: string;
  reading_time_minutes?: number;
  updated_at: string;
}

interface DocCategory {
  id: string;
  slug: string;
  name_en: string;
  name_vi: string;
}

interface NavItem {
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
}

interface DocData {
  article: DocArticle;
  category: DocCategory;
  navigation: {
    prev: NavItem | null;
    next: NavItem | null;
  };
}

export default function DocArticlePage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const slug = params.slug as string;
  const { locale } = useTranslation();
  const [data, setData] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/docs/${categorySlug}/${slug}`);
        if (!res.ok) {
          throw new Error('Article not found');
        }
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load article');
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [categorySlug, slug]);

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

  if (error || !data) {
    return (
      <div className="relative">
        <ParticleBackground />
        <div className="relative z-10 pt-32 pb-24">
          <div className="container mx-auto px-4">
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold text-white mb-4">
                {locale === 'vi' ? 'Bài viết không tìm thấy' : 'Article Not Found'}
              </h1>
              <p className="text-[var(--landing-text-secondary)] mb-6">
                {locale === 'vi'
                  ? 'Bài viết bạn tìm kiếm không tồn tại hoặc chưa được xuất bản.'
                  : 'The article you are looking for does not exist or has not been published.'}
              </p>
              <Link href="/docs">
                <Button className="bg-[var(--landing-primary)] hover:bg-[var(--landing-primary)]/80">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {locale === 'vi' ? 'Quay lại Docs' : 'Back to Docs'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { article, category, navigation } = data;
  const title = locale === 'vi' ? article.title_vi : article.title_en;
  const content = locale === 'vi' ? article.content_vi : article.content_en;
  const categoryName = locale === 'vi' ? category.name_vi : category.name_en;

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Back Link */}
          <div className="max-w-3xl mx-auto mb-8">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 text-[var(--landing-text-muted)] hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {locale === 'vi' ? 'Quay lại Docs' : 'Back to Docs'}
            </Link>
          </div>

          {/* Article Header */}
          <article className="max-w-3xl mx-auto">
            <header className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-[var(--landing-primary)]/20 flex items-center justify-center">
                  <BookOpen className="h-7 w-7 text-[var(--landing-cyan)]" />
                </div>
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-2">
                    {categoryName}
                  </span>
                  <h1 className="text-3xl sm:text-4xl font-bold text-white">
                    {title}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-[var(--landing-text-muted)]">
                {article.reading_time_minutes && (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {article.reading_time_minutes} {locale === 'vi' ? 'phút đọc' : 'min read'}
                  </span>
                )}
                <span>
                  {locale === 'vi' ? 'Cập nhật: ' : 'Updated: '}
                  {new Date(article.updated_at).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </header>

            {/* Article Content */}
            <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-6 md:p-8">
              <div className="doc-article-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            </div>

            {/* Navigation */}
            <nav className="mt-12 pt-8 border-t border-[var(--landing-border)]">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                {navigation.prev ? (
                  <Link
                    href={`/docs/${categorySlug}/${navigation.prev.slug}`}
                    className="flex-1 p-4 rounded-xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 hover:border-[var(--landing-cyan)]/30 transition-all group"
                  >
                    <span className="text-sm text-[var(--landing-text-muted)] flex items-center gap-1 mb-1">
                      <ArrowLeft className="h-3 w-3" />
                      {locale === 'vi' ? 'Bài trước' : 'Previous'}
                    </span>
                    <span className="font-medium text-white group-hover:text-[var(--landing-cyan)] transition-colors">
                      {locale === 'vi' ? navigation.prev.title_vi : navigation.prev.title_en}
                    </span>
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}
                {navigation.next ? (
                  <Link
                    href={`/docs/${categorySlug}/${navigation.next.slug}`}
                    className="flex-1 p-4 rounded-xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 hover:border-[var(--landing-cyan)]/30 transition-all group text-right"
                  >
                    <span className="text-sm text-[var(--landing-text-muted)] flex items-center gap-1 justify-end mb-1">
                      {locale === 'vi' ? 'Bài tiếp' : 'Next'}
                      <ArrowRight className="h-3 w-3" />
                    </span>
                    <span className="font-medium text-white group-hover:text-[var(--landing-cyan)] transition-colors">
                      {locale === 'vi' ? navigation.next.title_vi : navigation.next.title_en}
                    </span>
                  </Link>
                ) : (
                  <div className="flex-1" />
                )}
              </div>
            </nav>
          </article>
        </div>
      </div>

      <style jsx global>{`
        .doc-article-content {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.125rem;
          line-height: 1.75;
        }
        .doc-article-content h1 {
          color: white;
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          margin-top: 0;
        }
        .doc-article-content h2 {
          color: white;
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--landing-border, rgba(255, 255, 255, 0.1));
        }
        .doc-article-content h3 {
          color: white;
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .doc-article-content p {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 1rem;
          line-height: 1.75;
        }
        .doc-article-content strong {
          color: white;
          font-weight: 600;
        }
        .doc-article-content a {
          color: var(--landing-cyan, #22d3ee);
          text-decoration: none;
        }
        .doc-article-content a:hover {
          text-decoration: underline;
        }
        .doc-article-content ul, .doc-article-content ol {
          margin: 1rem 0;
          padding-left: 1.5rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .doc-article-content li {
          margin-bottom: 0.5rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .doc-article-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
        }
        .doc-article-content th {
          text-align: left;
          color: white;
          font-weight: 600;
          padding: 0.75rem;
          border-bottom: 1px solid var(--landing-border, rgba(255, 255, 255, 0.1));
        }
        .doc-article-content td {
          padding: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .doc-article-content code {
          background: rgba(255, 255, 255, 0.1);
          color: var(--landing-cyan, #22d3ee);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }
        .doc-article-content pre {
          background: rgba(0, 0, 0, 0.3);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .doc-article-content pre code {
          background: transparent;
          padding: 0;
        }
        .doc-article-content blockquote {
          border-left: 4px solid var(--landing-cyan, #22d3ee);
          padding-left: 1rem;
          margin: 1rem 0;
          color: rgba(255, 255, 255, 0.6);
          font-style: italic;
        }
        .doc-article-content hr {
          border: none;
          border-top: 1px solid var(--landing-border, rgba(255, 255, 255, 0.1));
          margin: 2rem 0;
        }
      `}</style>
    </div>
  );
}
