'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ArrowLeft, Loader2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

interface PressRelease {
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
  excerpt_en: string | null;
  excerpt_vi: string | null;
  content_en: string;
  content_vi: string;
  featured_image_url: string | null;
  pdf_url_en: string | null;
  pdf_url_vi: string | null;
  release_date: string;
  is_featured: boolean;
}

export default function PressReleasePage() {
  const params = useParams();
  const { locale } = useTranslation();
  const [release, setRelease] = useState<PressRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelease = async () => {
      try {
        const res = await fetch(`/api/press/${params.slug}`);
        if (res.ok) {
          setRelease(await res.json());
        } else {
          setError(locale === 'vi' ? 'Không tìm thấy thông cáo báo chí' : 'Press release not found');
        }
      } catch (err) {
        setError(locale === 'vi' ? 'Lỗi khi tải dữ liệu' : 'Failed to load press release');
      } finally {
        setLoading(false);
      }
    };
    if (params.slug) {
      fetchRelease();
    }
  }, [params.slug, locale]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: locale === 'vi' ? release?.title_vi : release?.title_en,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen">
        <ParticleBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-[var(--landing-cyan)]" />
        </div>
      </div>
    );
  }

  if (error || !release) {
    return (
      <div className="relative min-h-screen">
        <ParticleBackground />
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4">
          <h1 className="text-3xl font-bold text-white mb-4">
            {error || (locale === 'vi' ? 'Không tìm thấy thông cáo báo chí' : 'Press Release Not Found')}
          </h1>
          <Button asChild>
            <Link href="/press">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {locale === 'vi' ? 'Quay lại trang Báo chí' : 'Back to Press'}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const title = locale === 'vi' ? release.title_vi : release.title_en;
  const content = locale === 'vi' ? release.content_vi : release.content_en;
  const pdfUrl = locale === 'vi' ? release.pdf_url_vi : release.pdf_url_en;

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Back Link */}
          <div className="max-w-3xl mx-auto mb-8">
            <Link
              href="/press"
              className="inline-flex items-center text-[var(--landing-text-secondary)] hover:text-[var(--landing-cyan)] transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {locale === 'vi' ? 'Quay lại trang Báo chí' : 'Back to Press'}
            </Link>
          </div>

          {/* Header */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2 text-[var(--landing-text-muted)]">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(release.release_date)}</span>
              </div>
              {release.is_featured && (
                <span className="px-3 py-1 text-xs rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)]">
                  Featured
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              {title}
            </h1>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {locale === 'vi' ? 'Chia sẻ' : 'Share'}
              </Button>
              {pdfUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                >
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                    {locale === 'vi' ? 'Tải PDF' : 'Download PDF'}
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Featured Image */}
          {release.featured_image_url && (
            <div className="max-w-4xl mx-auto mb-12">
              <img
                src={release.featured_image_url}
                alt={title}
                className="w-full rounded-2xl border border-[var(--landing-border)]"
              />
            </div>
          )}

          {/* Content */}
          <div className="max-w-3xl mx-auto">
            <div className="text-white text-lg leading-relaxed whitespace-pre-wrap">
              {content}
            </div>
          </div>

          {/* Footer */}
          <div className="max-w-3xl mx-auto mt-16 pt-8 border-t border-[var(--landing-border)]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[var(--landing-text-muted)] text-sm">
                {locale === 'vi' ? 'Liên hệ báo chí:' : 'Press Contact:'}{' '}
                <a href="mailto:info@aidorag.ai" className="text-[var(--landing-cyan)] hover:underline">
                  info@aidorag.ai
                </a>
              </div>
              <Button asChild>
                <Link href="/press">
                  {locale === 'vi' ? 'Xem thêm thông cáo báo chí' : 'View More Press Releases'}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
