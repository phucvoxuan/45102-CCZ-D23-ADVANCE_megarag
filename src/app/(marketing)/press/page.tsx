'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Newspaper, Download, Mail, Calendar, ArrowRight, FileText, Image as ImageIcon, Play, Video, Loader2, ExternalLink } from 'lucide-react';
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
  release_date: string;
  is_featured: boolean;
}

interface NewsCoverage {
  id: string;
  publication_name: string;
  publication_logo_url: string | null;
  article_title_en: string;
  article_title_vi: string | null;
  article_url: string;
  coverage_date: string;
  is_featured: boolean;
}

interface PressKitItem {
  id: string;
  name_en: string;
  name_vi: string;
  description_en: string | null;
  description_vi: string | null;
  file_url: string;
  file_type: string;
  file_size_kb: number | null;
  thumbnail_url: string | null;
}

interface PressVideo {
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
  description_en: string | null;
  description_vi: string | null;
  video_url: string;
  thumbnail_url: string | null;
  video_type: string;
  duration: string | null;
  event_date: string | null;
}

interface CompanyFact {
  id: string;
  slug: string;
  label_en: string;
  label_vi: string;
  value: string;
  description_en: string | null;
  description_vi: string | null;
}

// Fallback translations for hardcoded content
const MEDIA_KIT_KEYS = ['logos', 'screenshots', 'factSheet'] as const;

export default function PressPage() {
  const { t, locale } = useTranslation();
  const [releases, setReleases] = useState<PressRelease[]>([]);
  const [coverage, setCoverage] = useState<NewsCoverage[]>([]);
  const [kit, setKit] = useState<PressKitItem[]>([]);
  const [videos, setVideos] = useState<PressVideo[]>([]);
  const [facts, setFacts] = useState<CompanyFact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/press?type=all');
        if (res.ok) {
          const data = await res.json();
          setReleases(data.releases || []);
          setCoverage(data.coverage || []);
          setKit(data.kit || []);
          setVideos(data.videos || []);
          setFacts(data.facts || []);
        }
      } catch (error) {
        console.error('Failed to fetch press data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: undefined,
    });
  };

  const getFileIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'PNG':
      case 'JPG':
      case 'SVG':
      case 'AI':
      case 'EPS':
        return ImageIcon;
      default:
        return FileText;
    }
  };

  const getVideoThumbnail = (video: PressVideo) => {
    if (video.thumbnail_url) return video.thumbnail_url;
    if (video.video_type === 'youtube') {
      const videoId = video.video_url.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      );
      if (videoId) return `https://img.youtube.com/vi/${videoId[1]}/mqdefault.jpg`;
    }
    return null;
  };

  const getVideoEmbedUrl = (video: PressVideo) => {
    if (video.video_type === 'youtube') {
      const videoId = video.video_url.match(
        /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
      );
      if (videoId) return `https://www.youtube.com/watch?v=${videoId[1]}`;
    }
    return video.video_url;
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
              {String(t('pages.press.badge'))}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              {String(t('pages.press.titlePrefix'))} <span className="text-[var(--landing-cyan)]">{String(t('pages.press.title'))}</span>
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)] max-w-2xl mx-auto">
              {String(t('pages.press.subtitle'))}
            </p>
          </div>

          {/* Contact Card */}
          <div className="max-w-4xl mx-auto mb-16">
            <div className="rounded-2xl border-2 border-[var(--landing-primary)] bg-gradient-to-br from-[var(--landing-primary)]/20 to-[var(--landing-purple)]/20 p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2 text-white">{String(t('pages.press.contact.title'))}</h2>
                  <p className="text-[var(--landing-text-secondary)]">
                    {String(t('pages.press.contact.description'))}
                  </p>
                </div>
                <Button
                  className="gap-2 bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white whitespace-nowrap"
                  asChild
                >
                  <Link href="/contact">
                    <Mail className="h-4 w-4" />
                    {String(t('pages.press.contact.email'))}
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Press Releases from CMS */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center text-white">{String(t('pages.press.releases.title'))}</h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--landing-cyan)]" />
              </div>
            ) : releases.length > 0 ? (
              <div className="space-y-4">
                {releases.map((release) => (
                  <Link
                    key={release.id}
                    href={`/press/${release.slug}`}
                    className="block p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 hover:border-[var(--landing-cyan)]/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-[var(--landing-text-muted)]" />
                          <span className="text-sm text-[var(--landing-text-muted)]">
                            {formatDate(release.release_date)}
                          </span>
                          {release.is_featured && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)]">
                              Featured
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-white mb-2">
                          {locale === 'vi' ? release.title_vi : release.title_en}
                        </h3>
                        {(locale === 'vi' ? release.excerpt_vi : release.excerpt_en) && (
                          <p className="text-sm text-[var(--landing-text-secondary)]">
                            {locale === 'vi' ? release.excerpt_vi : release.excerpt_en}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="h-5 w-5 text-[var(--landing-text-muted)] flex-shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-[var(--landing-text-muted)] py-8">
                {locale === 'vi' ? 'Chưa có thông cáo báo chí nào.' : 'No press releases available yet.'}
              </p>
            )}
          </div>

          {/* News Coverage from CMS */}
          {coverage.length > 0 && (
            <div className="max-w-4xl mx-auto mb-16">
              <h2 className="text-2xl font-bold mb-8 text-center text-white">
                {locale === 'vi' ? 'Tin tức báo chí' : 'News Coverage'}
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {coverage.map((item) => (
                  <a
                    key={item.id}
                    href={item.article_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 hover:border-[var(--landing-cyan)]/30 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {item.publication_logo_url ? (
                        <img src={item.publication_logo_url} alt={item.publication_name} className="h-6 w-6 object-contain" />
                      ) : (
                        <Newspaper className="h-6 w-6 text-[var(--landing-cyan)]" />
                      )}
                      <span className="font-medium text-[var(--landing-text-secondary)]">{item.publication_name}</span>
                    </div>
                    <h3 className="font-semibold text-white mb-2 flex items-start gap-2">
                      {locale === 'vi' && item.article_title_vi ? item.article_title_vi : item.article_title_en}
                      <ExternalLink className="h-4 w-4 flex-shrink-0 mt-1" />
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-[var(--landing-text-muted)]">
                      <Calendar className="h-3 w-3" />
                      {formatDate(item.coverage_date)}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Video Showcase from CMS */}
          {videos.length > 0 && (
            <div className="max-w-4xl mx-auto mb-16">
              <h2 className="text-2xl font-bold mb-8 text-center text-white">{String(t('pages.press.videos.title'))}</h2>
              <p className="text-center text-[var(--landing-text-secondary)] mb-8 max-w-2xl mx-auto">
                {String(t('pages.press.videos.subtitle'))}
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => {
                  const thumbnail = getVideoThumbnail(video);
                  const videoLink = getVideoEmbedUrl(video);
                  return (
                    <a
                      key={video.id}
                      href={videoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 overflow-hidden hover:border-[var(--landing-cyan)]/30 transition-all"
                    >
                      <div className="relative aspect-video bg-[var(--landing-bg-card)] flex items-center justify-center">
                        {thumbnail ? (
                          <img src={thumbnail} alt={video.title_en} className="w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[var(--landing-primary)]/20 to-[var(--landing-purple)]/20" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all">
                          <div className="w-16 h-16 rounded-full bg-[var(--landing-primary)]/80 flex items-center justify-center group-hover:bg-[var(--landing-primary)] transition-all">
                            <Play className="h-8 w-8 text-white ml-1" />
                          </div>
                        </div>
                        {video.duration && (
                          <span className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-xs text-white">
                            {video.duration}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Video className="h-4 w-4 text-[var(--landing-cyan)]" />
                          {video.event_date && (
                            <span className="text-xs text-[var(--landing-text-muted)]">
                              {formatDate(video.event_date)}
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-white mb-1">
                          {locale === 'vi' ? video.title_vi : video.title_en}
                        </h3>
                        {(locale === 'vi' ? video.description_vi : video.description_en) && (
                          <p className="text-sm text-[var(--landing-text-secondary)] line-clamp-2">
                            {locale === 'vi' ? video.description_vi : video.description_en}
                          </p>
                        )}
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Media Kit from CMS */}
          <div className="max-w-4xl mx-auto mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center text-white">{String(t('pages.press.mediaKit.title'))}</h2>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--landing-cyan)]" />
              </div>
            ) : kit.length > 0 ? (
              <div className="grid sm:grid-cols-3 gap-6">
                {kit.map((item) => {
                  const Icon = getFileIcon(item.file_type);
                  return (
                    <div key={item.id} className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 text-center hover:border-[var(--landing-cyan)]/30 transition-all">
                      <div className="w-12 h-12 rounded-lg bg-[var(--landing-primary)]/20 flex items-center justify-center mb-4 mx-auto">
                        <Icon className="h-6 w-6 text-[var(--landing-cyan)]" />
                      </div>
                      <h3 className="font-semibold mb-2 text-white">
                        {locale === 'vi' ? item.name_vi : item.name_en}
                      </h3>
                      {(locale === 'vi' ? item.description_vi : item.description_en) && (
                        <p className="text-sm text-[var(--landing-text-muted)] mb-4">
                          {locale === 'vi' ? item.description_vi : item.description_en}
                        </p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                        asChild
                      >
                        <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4 mr-2" />
                          {String(t('pages.press.mediaKit.download'))}
                        </a>
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Fallback to hardcoded content if no CMS data */
              <div className="grid sm:grid-cols-3 gap-6">
                {MEDIA_KIT_KEYS.map((kitKey) => {
                  const icons = { logos: ImageIcon, screenshots: ImageIcon, factSheet: FileText };
                  const Icon = icons[kitKey];
                  return (
                    <div key={kitKey} className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 text-center hover:border-[var(--landing-cyan)]/30 transition-all">
                      <div className="w-12 h-12 rounded-lg bg-[var(--landing-primary)]/20 flex items-center justify-center mb-4 mx-auto">
                        <Icon className="h-6 w-6 text-[var(--landing-cyan)]" />
                      </div>
                      <h3 className="font-semibold mb-2 text-white">
                        {String(t(`pages.press.mediaKit.items.${kitKey}.title`))}
                      </h3>
                      <p className="text-sm text-[var(--landing-text-muted)] mb-4">
                        {String(t(`pages.press.mediaKit.items.${kitKey}.description`))}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {String(t('pages.press.mediaKit.download'))}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Company Facts from CMS */}
          {facts.length > 0 && (
            <div className="max-w-4xl mx-auto mb-16">
              <h2 className="text-2xl font-bold mb-8 text-center text-white">{String(t('pages.press.facts.title'))}</h2>
              <div className={`grid gap-6 ${facts.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' : facts.length === 2 ? 'sm:grid-cols-2' : facts.length === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 md:grid-cols-4'}`}>
                {facts.map((fact) => (
                  <div key={fact.id} className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 text-center">
                    <div className="text-3xl font-bold text-[var(--landing-cyan)] mb-2">{fact.value}</div>
                    <p className="text-sm text-[var(--landing-text-muted)]">
                      {locale === 'vi' ? fact.label_vi : fact.label_en}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.press.cta.title'))}</h2>
            <p className="text-[var(--landing-text-secondary)] mb-6">
              {String(t('pages.press.cta.subtitle'))}
            </p>
            <Button
              className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
              asChild
            >
              <Link href="/contact">{String(t('common.contactUs'))}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
