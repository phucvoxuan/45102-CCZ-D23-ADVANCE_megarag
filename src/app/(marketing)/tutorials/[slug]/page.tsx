'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Loader2, Clock, Play, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Tutorial {
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
  description_en?: string;
  description_vi?: string;
  content_en: string;
  content_vi: string;
  video_url?: string;
  thumbnail_url?: string;
  duration_minutes?: number;
  is_featured: boolean;
  updated_at: string;
  level?: {
    id: string;
    name_en: string;
    name_vi: string;
    color?: string;
  };
  topic?: {
    id: string;
    name_en: string;
    name_vi: string;
  };
}

export default function TutorialPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { locale } = useTranslation();
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTutorial = async () => {
      try {
        const res = await fetch(`/api/tutorials/${slug}`);
        if (!res.ok) {
          throw new Error('Tutorial not found');
        }
        const data = await res.json();
        setTutorial(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tutorial');
      } finally {
        setLoading(false);
      }
    };
    fetchTutorial();
  }, [slug]);

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

  if (error || !tutorial) {
    return (
      <div className="relative">
        <ParticleBackground />
        <div className="relative z-10 pt-32 pb-24">
          <div className="container mx-auto px-4">
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold text-white mb-4">
                {locale === 'vi' ? 'Hướng dẫn không tìm thấy' : 'Tutorial Not Found'}
              </h1>
              <p className="text-[var(--landing-text-secondary)] mb-6">
                {locale === 'vi'
                  ? 'Hướng dẫn bạn tìm kiếm không tồn tại hoặc chưa được xuất bản.'
                  : 'The tutorial you are looking for does not exist or has not been published.'}
              </p>
              <Link href="/tutorials">
                <Button className="bg-[var(--landing-primary)] hover:bg-[var(--landing-primary)]/80">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {locale === 'vi' ? 'Quay lại Tutorials' : 'Back to Tutorials'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const title = locale === 'vi' ? tutorial.title_vi : tutorial.title_en;
  const description = locale === 'vi' ? tutorial.description_vi : tutorial.description_en;
  const content = locale === 'vi' ? tutorial.content_vi : tutorial.content_en;
  const levelName = tutorial.level ? (locale === 'vi' ? tutorial.level.name_vi : tutorial.level.name_en) : null;
  const topicName = tutorial.topic ? (locale === 'vi' ? tutorial.topic.name_vi : tutorial.topic.name_en) : null;

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Back Link */}
          <div className="max-w-3xl mx-auto mb-8">
            <Link
              href="/tutorials"
              className="inline-flex items-center gap-2 text-[var(--landing-text-muted)] hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {locale === 'vi' ? 'Quay lại Tutorials' : 'Back to Tutorials'}
            </Link>
          </div>

          {/* Tutorial Header */}
          <article className="max-w-3xl mx-auto">
            <header className="mb-8">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {topicName && (
                  <span className="px-3 py-1 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm">
                    {topicName}
                  </span>
                )}
                {levelName && (
                  <span
                    className="px-3 py-1 rounded-full text-sm"
                    style={{
                      backgroundColor: tutorial.level?.color ? `${tutorial.level.color}20` : 'rgba(34, 211, 238, 0.2)',
                      color: tutorial.level?.color || 'var(--landing-cyan)'
                    }}
                  >
                    {levelName}
                  </span>
                )}
                {tutorial.is_featured && (
                  <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400" />
                    Featured
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
                {title}
              </h1>

              {description && (
                <p className="text-xl text-[var(--landing-text-secondary)] mb-6">
                  {description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-[var(--landing-text-muted)]">
                {tutorial.duration_minutes && (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {tutorial.duration_minutes} {locale === 'vi' ? 'phút' : 'min'}
                  </span>
                )}
                <span>
                  {locale === 'vi' ? 'Cập nhật: ' : 'Updated: '}
                  {new Date(tutorial.updated_at).toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </header>

            {/* Video Player */}
            {tutorial.video_url && (
              <div className="mb-8">
                <div className="aspect-video rounded-xl overflow-hidden border border-[var(--landing-border)] bg-black">
                  {tutorial.video_url.includes('youtube.com') || tutorial.video_url.includes('youtu.be') ? (
                    <iframe
                      src={getYouTubeEmbedUrl(tutorial.video_url)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : tutorial.video_url.includes('vimeo.com') ? (
                    <iframe
                      src={getVimeoEmbedUrl(tutorial.video_url)}
                      className="w-full h-full"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <a
                        href={tutorial.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[var(--landing-cyan)] hover:underline"
                      >
                        <Play className="h-8 w-8" />
                        {locale === 'vi' ? 'Xem video' : 'Watch Video'}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tutorial Content */}
            <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-6 md:p-8">
              <div className="tutorial-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            </div>

            {/* Footer */}
            <footer className="mt-12 pt-8 border-t border-[var(--landing-border)]">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <Link href="/tutorials">
                  <Button
                    variant="outline"
                    className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {locale === 'vi' ? 'Xem tất cả tutorials' : 'View All Tutorials'}
                  </Button>
                </Link>
                <Link href="/docs">
                  <Button className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white">
                    <BookOpen className="h-4 w-4 mr-2" />
                    {locale === 'vi' ? 'Xem tài liệu' : 'View Documentation'}
                  </Button>
                </Link>
              </div>
            </footer>
          </article>
        </div>
      </div>

      <style jsx global>{`
        .tutorial-content {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1.125rem;
          line-height: 1.75;
        }
        .tutorial-content h1 {
          color: white;
          font-size: 1.875rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
          margin-top: 0;
        }
        .tutorial-content h2 {
          color: white;
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--landing-border, rgba(255, 255, 255, 0.1));
        }
        .tutorial-content h3 {
          color: white;
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .tutorial-content p {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 1rem;
          line-height: 1.75;
        }
        .tutorial-content strong {
          color: white;
          font-weight: 600;
        }
        .tutorial-content a {
          color: var(--landing-cyan, #22d3ee);
          text-decoration: none;
        }
        .tutorial-content a:hover {
          text-decoration: underline;
        }
        .tutorial-content ul, .tutorial-content ol {
          margin: 1rem 0;
          padding-left: 1.5rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .tutorial-content li {
          margin-bottom: 0.5rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .tutorial-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
        }
        .tutorial-content th {
          text-align: left;
          color: white;
          font-weight: 600;
          padding: 0.75rem;
          border-bottom: 1px solid var(--landing-border, rgba(255, 255, 255, 0.1));
        }
        .tutorial-content td {
          padding: 0.75rem;
          color: rgba(255, 255, 255, 0.7);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .tutorial-content code {
          background: rgba(255, 255, 255, 0.1);
          color: var(--landing-cyan, #22d3ee);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }
        .tutorial-content pre {
          background: rgba(0, 0, 0, 0.3);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        .tutorial-content pre code {
          background: transparent;
          padding: 0;
        }
        .tutorial-content blockquote {
          border-left: 4px solid var(--landing-cyan, #22d3ee);
          padding-left: 1rem;
          margin: 1rem 0;
          color: rgba(255, 255, 255, 0.6);
          font-style: italic;
        }
        .tutorial-content hr {
          border: none;
          border-top: 1px solid var(--landing-border, rgba(255, 255, 255, 0.1));
          margin: 2rem 0;
        }
      `}</style>
    </div>
  );
}

function getYouTubeEmbedUrl(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  const videoId = match && match[2].length === 11 ? match[2] : null;
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

function getVimeoEmbedUrl(url: string): string {
  const regExp = /vimeo\.com\/(\d+)/;
  const match = url.match(regExp);
  const videoId = match ? match[1] : null;
  return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
}
