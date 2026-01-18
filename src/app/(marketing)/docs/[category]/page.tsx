'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Loader2, Clock, Star, FileText } from 'lucide-react';
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
}

interface DocArticle {
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
  excerpt_en?: string;
  excerpt_vi?: string;
  reading_time?: number;
  is_featured: boolean;
}

interface CategoryData {
  category: DocCategory;
  articles: DocArticle[];
}

export default function DocCategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const { locale } = useTranslation();
  const [data, setData] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/docs/${categorySlug}`);
        if (!res.ok) {
          throw new Error('Category not found');
        }
        const result = await res.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load category');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [categorySlug]);

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
                {locale === 'vi' ? 'Danh mục không tìm thấy' : 'Category Not Found'}
              </h1>
              <p className="text-[var(--landing-text-secondary)] mb-6">
                {locale === 'vi'
                  ? 'Danh mục bạn tìm kiếm không tồn tại.'
                  : 'The category you are looking for does not exist.'}
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

  const { category, articles } = data;
  const categoryName = locale === 'vi' ? category.name_vi : category.name_en;
  const categoryDesc = locale === 'vi' ? category.description_vi : category.description_en;

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Back Link */}
          <div className="max-w-4xl mx-auto mb-8">
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 text-[var(--landing-text-muted)] hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {locale === 'vi' ? 'Quay lại Docs' : 'Back to Docs'}
            </Link>
          </div>

          {/* Category Header */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-[var(--landing-primary)]/20 flex items-center justify-center">
                <BookOpen className="h-7 w-7 text-[var(--landing-cyan)]" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white">
                  {categoryName}
                </h1>
                {categoryDesc && (
                  <p className="text-[var(--landing-text-secondary)] mt-1">{categoryDesc}</p>
                )}
              </div>
            </div>
            <p className="text-[var(--landing-text-muted)]">
              {articles.length} {locale === 'vi' ? 'bài viết' : 'articles'}
            </p>
          </div>

          {/* Articles List */}
          <div className="max-w-4xl mx-auto">
            {articles.length > 0 ? (
              <div className="space-y-4">
                {articles.map((article) => {
                  const title = locale === 'vi' ? article.title_vi : article.title_en;
                  const excerpt = locale === 'vi' ? article.excerpt_vi : article.excerpt_en;

                  return (
                    <Link
                      key={article.id}
                      href={`/docs/${categorySlug}/${article.slug}`}
                      className="block p-6 rounded-xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 hover:border-[var(--landing-cyan)]/30 transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-[var(--landing-primary)]/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-[var(--landing-cyan)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-white group-hover:text-[var(--landing-cyan)] transition-colors">
                              {title}
                            </h3>
                            {article.is_featured && (
                              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            )}
                          </div>
                          {excerpt && (
                            <p className="text-[var(--landing-text-muted)] line-clamp-2 mb-2">
                              {excerpt}
                            </p>
                          )}
                          {article.reading_time && (
                            <span className="text-xs text-[var(--landing-text-muted)] flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {article.reading_time} {locale === 'vi' ? 'phút đọc' : 'min read'}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-[var(--landing-text-muted)] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {locale === 'vi' ? 'Chưa có bài viết' : 'No articles yet'}
                </h3>
                <p className="text-[var(--landing-text-secondary)]">
                  {locale === 'vi'
                    ? 'Nội dung đang được cập nhật. Vui lòng quay lại sau.'
                    : 'Content is being updated. Please check back later.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
