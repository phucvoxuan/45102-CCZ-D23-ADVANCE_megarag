'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Newspaper, Calendar, Clock, ArrowLeft, User, Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Tag {
  id: string;
  slug: string;
  name_en: string;
  name_vi: string;
}

interface BlogPost {
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
  excerpt_en: string;
  excerpt_vi: string;
  content_en: string;
  content_vi: string;
  featured_image_url?: string;
  author_name?: string;
  reading_time_minutes?: number;
  published_at: string;
  category?: {
    id: string;
    name_en: string;
    name_vi: string;
  };
  tags?: Tag[];
}

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { locale, t } = useTranslation();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/blog/${slug}`);
        if (!res.ok) {
          throw new Error('Post not found');
        }
        const data = await res.json();
        setPost(data);

        // Fetch related posts
        const relatedRes = await fetch('/api/blog?limit=3');
        if (relatedRes.ok) {
          const relatedData = await relatedRes.json();
          // Filter out current post
          setRelatedPosts(relatedData.posts?.filter((p: BlogPost) => p.slug !== slug).slice(0, 2) || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  const title = post ? (locale === 'vi' ? post.title_vi : post.title_en) : '';
  const excerpt = post ? (locale === 'vi' ? post.excerpt_vi : post.excerpt_en) : '';
  const content = post ? (locale === 'vi' ? post.content_vi : post.content_en) : '';
  const categoryName = post?.category ? (locale === 'vi' ? post.category.name_vi : post.category.name_en) : '';

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

  if (error || !post) {
    return (
      <div className="relative">
        <ParticleBackground />
        <div className="relative z-10 pt-32 pb-24">
          <div className="container mx-auto px-4">
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold text-white mb-4">
                {locale === 'vi' ? 'Bài viết không tìm thấy' : 'Post Not Found'}
              </h1>
              <p className="text-[var(--landing-text-secondary)] mb-6">
                {locale === 'vi'
                  ? 'Bài viết bạn tìm kiếm không tồn tại hoặc chưa được xuất bản.'
                  : 'The post you are looking for does not exist or has not been published.'}
              </p>
              <Link href="/blog">
                <Button className="bg-[var(--landing-primary)] hover:bg-[var(--landing-primary)]/80">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {locale === 'vi' ? 'Quay lại Blog' : 'Back to Blog'}
                </Button>
              </Link>
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
          {/* Back Link */}
          <div className="max-w-3xl mx-auto mb-8">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-[var(--landing-text-muted)] hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {locale === 'vi' ? 'Quay lại Blog' : 'Back to Blog'}
            </Link>
          </div>

          {/* Article Header */}
          <article className="max-w-3xl mx-auto">
            <header className="mb-12">
              {categoryName && (
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm">
                    {categoryName}
                  </span>
                </div>
              )}
              <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-white">
                {title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--landing-text-muted)] mb-6">
                {post.author_name && (
                  <span className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {post.author_name}
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.published_at).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                {post.reading_time_minutes && (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {post.reading_time_minutes} {locale === 'vi' ? 'phút đọc' : 'min read'}
                  </span>
                )}
              </div>

              {/* Featured Image */}
              {post.featured_image_url ? (
                <div className="aspect-video rounded-xl overflow-hidden mb-8 border border-[var(--landing-border)]">
                  <Image
                    src={post.featured_image_url}
                    alt={title}
                    width={1200}
                    height={675}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-xl bg-gradient-to-br from-[var(--landing-primary)]/20 to-[var(--landing-purple)]/20 flex items-center justify-center mb-8 border border-[var(--landing-border)]">
                  <Newspaper className="h-20 w-20 text-[var(--landing-primary)]/30" />
                </div>
              )}
            </header>

            {/* Article Content */}
            <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-6 md:p-8">
              {excerpt && (
                <p className="lead text-xl text-[var(--landing-text-secondary)] mb-8 pb-8 border-b border-[var(--landing-border)]">
                  {excerpt}
                </p>
              )}

              <div className="blog-post-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-3 py-1 rounded-full bg-[var(--landing-bg-card)] border border-[var(--landing-border)] text-sm text-[var(--landing-text-muted)]"
                  >
                    {locale === 'vi' ? tag.name_vi : tag.name_en}
                  </span>
                ))}
              </div>
            )}

            {/* Share & Tags */}
            <footer className="mt-12 pt-8 border-t border-[var(--landing-border)]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--landing-text-muted)]">
                    {locale === 'vi' ? 'Chia sẻ' : 'Share'}:
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    {locale === 'vi' ? 'Sao chép liên kết' : 'Copy Link'}
                  </Button>
                </div>
                <Link href="/blog">
                  <Button
                    variant="outline"
                    className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {locale === 'vi' ? 'Quay lại Blog' : 'Back to Blog'}
                  </Button>
                </Link>
              </div>
            </footer>
          </article>

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="max-w-3xl mx-auto mt-16">
              <h2 className="text-2xl font-bold mb-6 text-white">
                {locale === 'vi' ? 'Bài viết liên quan' : 'Related Posts'}
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`} className="block group">
                    <div className="rounded-xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-6 h-full hover:border-[var(--landing-cyan)]/30 transition-all">
                      {relatedPost.category && (
                        <span className="px-3 py-1 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-xs mb-3 inline-block">
                          {locale === 'vi' ? relatedPost.category.name_vi : relatedPost.category.name_en}
                        </span>
                      )}
                      <h3 className="font-semibold mb-2 text-white group-hover:text-[var(--landing-cyan)] transition-colors">
                        {locale === 'vi' ? relatedPost.title_vi : relatedPost.title_en}
                      </h3>
                      <p className="text-sm text-[var(--landing-text-muted)] line-clamp-2">
                        {locale === 'vi' ? relatedPost.excerpt_vi : relatedPost.excerpt_en}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .blog-post-content {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.125rem;
          line-height: 1.75;
        }
        .blog-post-content h1 {
          color: white;
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          margin-top: 0;
        }
        .blog-post-content h2 {
          color: white;
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--landing-border, rgba(255, 255, 255, 0.1));
        }
        .blog-post-content h3 {
          color: white;
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .blog-post-content p {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 1rem;
          line-height: 1.75;
        }
        .blog-post-content strong {
          color: white;
          font-weight: 600;
        }
        .blog-post-content a {
          color: var(--landing-cyan, #22d3ee);
          text-decoration: none;
        }
        .blog-post-content a:hover {
          text-decoration: underline;
        }
        .blog-post-content ul, .blog-post-content ol {
          margin: 1rem 0;
          padding-left: 1.5rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .blog-post-content li {
          margin-bottom: 0.5rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .blog-post-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
        }
        .blog-post-content th {
          text-align: left;
          color: white;
          font-weight: 600;
          padding: 0.75rem;
          border-bottom: 1px solid var(--landing-border, rgba(255, 255, 255, 0.1));
        }
        .blog-post-content td {
          padding: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .blog-post-content code {
          background: rgba(255, 255, 255, 0.1);
          color: var(--landing-cyan, #22d3ee);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }
        .blog-post-content pre {
          background: rgba(0, 0, 0, 0.3);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .blog-post-content pre code {
          background: transparent;
          padding: 0;
        }
        .blog-post-content blockquote {
          border-left: 4px solid var(--landing-cyan, #22d3ee);
          padding-left: 1rem;
          margin: 1rem 0;
          color: rgba(255, 255, 255, 0.6);
          font-style: italic;
        }
        .blog-post-content hr {
          border: none;
          border-top: 1px solid var(--landing-border, rgba(255, 255, 255, 0.1));
          margin: 2rem 0;
        }
      `}</style>
    </div>
  );
}
