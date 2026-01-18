'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Code, Rocket, FileText, Search, ArrowRight, Loader2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

interface DocCategory {
  id: string;
  slug: string;
  name_en: string;
  name_vi: string;
  description_en?: string;
  description_vi?: string;
  icon?: string;
  article_count: number;
}

interface DocArticle {
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
  excerpt_en?: string;
  excerpt_vi?: string;
  category_id: string;
  is_featured: boolean;
}

const ICON_MAP: Record<string, typeof BookOpen> = {
  'rocket': Rocket,
  'code': Code,
  'book-open': BookOpen,
  'file-text': FileText,
  'folder': FolderOpen,
};

export default function DocsPage() {
  const { locale, t } = useTranslation();
  const [categories, setCategories] = useState<DocCategory[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<DocArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories
        const catRes = await fetch('/api/docs');
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData || []);
        }

        // Fetch featured articles
        const artRes = await fetch('/api/admin/docs/articles?featured=true&limit=6');
        if (artRes.ok) {
          const artData = await artRes.json();
          setFeaturedArticles(artData.articles || []);
        }
      } catch (error) {
        console.error('Failed to fetch docs data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
              <BookOpen className="h-3 w-3" />
              {String(t('pages.docs.badge'))}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              AIDORag <span className="text-[var(--landing-cyan)]">Docs</span>
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)] max-w-2xl mx-auto mb-8">
              {String(t('pages.docs.subtitle'))}
            </p>

            {/* Search Bar (UI only) */}
            <div className="max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--landing-text-muted)]" />
                <input
                  type="text"
                  placeholder={String(t('pages.docs.search'))}
                  className="w-full h-12 pl-12 pr-4 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 text-white placeholder:text-[var(--landing-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--landing-primary)]"
                />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--landing-cyan)]" />
            </div>
          )}

          {/* Categories from CMS */}
          {!loading && categories.length > 0 && (
            <div className="max-w-4xl mx-auto mb-20">
              <h2 className="text-2xl font-bold mb-6 text-white">
                {locale === 'vi' ? 'Danh mục tài liệu' : 'Documentation Categories'}
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {categories.map((category) => {
                  const IconComponent = ICON_MAP[category.icon || 'book-open'] || BookOpen;
                  const name = locale === 'vi' ? category.name_vi : category.name_en;
                  const description = locale === 'vi' ? category.description_vi : category.description_en;

                  return (
                    <Link
                      key={category.id}
                      href={`/docs/${category.slug}`}
                      className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 hover:border-[var(--landing-cyan)]/30 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-lg bg-[var(--landing-primary)]/20 flex items-center justify-center mb-4">
                        <IconComponent className="h-6 w-6 text-[var(--landing-cyan)]" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-white group-hover:text-[var(--landing-cyan)] transition-colors">
                        {name}
                      </h3>
                      {description && (
                        <p className="text-[var(--landing-text-secondary)] mb-4">{description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--landing-cyan)] text-sm font-medium flex items-center gap-1">
                          {String(t('common.learnMore'))} <ArrowRight className="h-4 w-4" />
                        </span>
                        <span className="text-xs text-[var(--landing-text-muted)]">
                          {category.article_count} {locale === 'vi' ? 'bài viết' : 'articles'}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Featured Articles */}
          {!loading && featuredArticles.length > 0 && (
            <div className="max-w-4xl mx-auto mb-20">
              <h2 className="text-2xl font-bold mb-6 text-white">
                {locale === 'vi' ? 'Bài viết nổi bật' : 'Featured Articles'}
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredArticles.map((article) => {
                  const category = categories.find(c => c.id === article.category_id);
                  const title = locale === 'vi' ? article.title_vi : article.title_en;
                  const excerpt = locale === 'vi' ? article.excerpt_vi : article.excerpt_en;

                  return (
                    <Link
                      key={article.id}
                      href={`/docs/${category?.slug || 'general'}/${article.slug}`}
                      className="p-4 rounded-xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 hover:border-[var(--landing-cyan)]/30 transition-all group"
                    >
                      <h3 className="font-semibold mb-2 text-white group-hover:text-[var(--landing-cyan)] transition-colors line-clamp-2">
                        {title}
                      </h3>
                      {excerpt && (
                        <p className="text-sm text-[var(--landing-text-muted)] line-clamp-2">{excerpt}</p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && categories.length === 0 && (
            <div className="max-w-4xl mx-auto mb-20 text-center py-12">
              <BookOpen className="h-16 w-16 text-[var(--landing-text-muted)] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {locale === 'vi' ? 'Chưa có tài liệu' : 'No documentation yet'}
              </h3>
              <p className="text-[var(--landing-text-secondary)]">
                {locale === 'vi'
                  ? 'Tài liệu đang được cập nhật. Vui lòng quay lại sau.'
                  : 'Documentation is being updated. Please check back later.'}
              </p>
            </div>
          )}

          {/* Help Section */}
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.docs.needHelp.title'))}</h2>
            <p className="text-[var(--landing-text-secondary)] mb-6">
              {String(t('pages.docs.needHelp.subtitle'))}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                asChild
              >
                <Link href="/community">{String(t('common.joinCommunity'))}</Link>
              </Button>
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
