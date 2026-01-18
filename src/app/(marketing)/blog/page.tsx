'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Newspaper, Calendar, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

interface BlogCategory {
  id: string;
  slug: string;
  name_en: string;
  name_vi: string;
  color?: string;
}

interface BlogPost {
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
  excerpt_en: string;
  excerpt_vi: string;
  featured_image_url?: string;
  author_name?: string;
  reading_time?: number;
  is_featured: boolean;
  published_at: string;
  category?: BlogCategory;
}

export default function BlogPage() {
  const { t, locale } = useTranslation();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<BlogCategory[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/blog');
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
          // Extract unique categories from posts
          const uniqueCategories: BlogCategory[] = [];
          const seenIds = new Set<string>();
          (data.posts || []).forEach((post: BlogPost) => {
            if (post.category && !seenIds.has(post.category.id)) {
              seenIds.add(post.category.id);
              uniqueCategories.push(post.category);
            }
          });
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Failed to fetch blog posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const featuredPost = posts.find(p => p.is_featured) || posts[0];
  const filteredPosts = selectedCategory === 'all'
    ? posts.filter(p => p.id !== featuredPost?.id)
    : posts.filter(p => p.category?.slug === selectedCategory && p.id !== featuredPost?.id);

  const getLocalizedText = (en: string, vi: string) => locale === 'vi' ? vi : en;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
              <Newspaper className="h-3 w-3" />
              {String(t('pages.blog.badge'))}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              {String(t('pages.blog.titlePrefix'))} <span className="text-[var(--landing-cyan)]">{String(t('pages.blog.title'))}</span>
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)] max-w-2xl mx-auto">
              {String(t('pages.blog.subtitle'))}
            </p>
          </div>

          {/* Categories */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className={selectedCategory === 'all'
                ? 'bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white'
                : 'border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10'
              }
            >
              {String(t('pages.blog.categories.all'))}
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.slug ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.slug)}
                className={selectedCategory === category.slug
                  ? 'bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white'
                  : 'border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10'
                }
              >
                {getLocalizedText(category.name_en, category.name_vi)}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--landing-cyan)]" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20">
              <Newspaper className="h-16 w-16 mx-auto mb-4 text-[var(--landing-text-muted)]" />
              <p className="text-[var(--landing-text-secondary)]">
                {locale === 'vi' ? 'Chưa có bài viết nào.' : 'No blog posts yet.'}
              </p>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {featuredPost && (
                <div className="max-w-4xl mx-auto mb-12">
                  <Link href={`/blog/${featuredPost.slug}`} className="block group">
                    <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 overflow-hidden hover:border-[var(--landing-cyan)]/30 transition-all">
                      <div className="aspect-video bg-gradient-to-br from-[var(--landing-primary)]/20 to-[var(--landing-purple)]/20 flex items-center justify-center">
                        {featuredPost.featured_image_url ? (
                          <img
                            src={featuredPost.featured_image_url}
                            alt={getLocalizedText(featuredPost.title_en, featuredPost.title_vi)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Newspaper className="h-16 w-16 text-[var(--landing-cyan)]/30" />
                        )}
                      </div>
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          {featuredPost.category && (
                            <span className="px-3 py-1 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-xs">
                              {getLocalizedText(featuredPost.category.name_en, featuredPost.category.name_vi)}
                            </span>
                          )}
                          {featuredPost.is_featured && (
                            <span className="px-3 py-1 rounded-full border border-[var(--landing-cyan)]/30 text-[var(--landing-cyan)] text-xs">
                              {String(t('pages.blog.featured'))}
                            </span>
                          )}
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-white group-hover:text-[var(--landing-cyan)] transition-colors">
                          {getLocalizedText(featuredPost.title_en, featuredPost.title_vi)}
                        </h2>
                        <p className="text-[var(--landing-text-secondary)] mb-4">
                          {getLocalizedText(featuredPost.excerpt_en, featuredPost.excerpt_vi)}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-[var(--landing-text-muted)]">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(featuredPost.published_at)}
                          </span>
                          {featuredPost.reading_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {featuredPost.reading_time} {locale === 'vi' ? 'phút đọc' : 'min read'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Posts Grid */}
              {filteredPosts.length > 0 && (
                <div className="max-w-4xl mx-auto">
                  <div className="grid md:grid-cols-2 gap-6">
                    {filteredPosts.map((post) => (
                      <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
                        <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-6 h-full hover:border-[var(--landing-cyan)]/30 transition-all">
                          <div className="flex items-center gap-2 mb-3">
                            {post.category && (
                              <span className="px-3 py-1 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-xs">
                                {getLocalizedText(post.category.name_en, post.category.name_vi)}
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-[var(--landing-cyan)] transition-colors">
                            {getLocalizedText(post.title_en, post.title_vi)}
                          </h3>
                          <p className="text-sm text-[var(--landing-text-secondary)] mb-4">
                            {getLocalizedText(post.excerpt_en, post.excerpt_vi)}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-[var(--landing-text-muted)]">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(post.published_at)}
                            </span>
                            {post.reading_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {post.reading_time} {locale === 'vi' ? 'phút' : 'min'}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Newsletter */}
          <div className="max-w-xl mx-auto mt-20 text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.blog.newsletter.title'))}</h2>
            <p className="text-[var(--landing-text-secondary)] mb-6">
              {String(t('pages.blog.newsletter.subtitle'))}
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder={String(t('pages.blog.newsletter.placeholder'))}
                className="flex-1 h-10 px-4 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 text-white placeholder:text-[var(--landing-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--landing-primary)]"
              />
              <Button className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white">
                {String(t('common.subscribe'))}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
