'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GraduationCap, Clock, ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

interface TutorialLevel {
  id: string;
  slug: string;
  name_en: string;
  name_vi: string;
  color?: string;
}

interface TutorialTopic {
  id: string;
  slug: string;
  name_en: string;
  name_vi: string;
  icon?: string;
}

interface Tutorial {
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
  description_en: string;
  description_vi: string;
  thumbnail_url?: string;
  video_url?: string;
  duration_minutes?: number;
  reading_time?: number;
  is_featured: boolean;
  level?: TutorialLevel;
  topic?: TutorialTopic;
}

const LEVEL_STYLES: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400',
  intermediate: 'bg-yellow-500/20 text-yellow-400',
  advanced: 'bg-red-500/20 text-red-400',
};

export default function TutorialsPage() {
  const { t, locale } = useTranslation();
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [topics, setTopics] = useState<TutorialTopic[]>([]);

  useEffect(() => {
    const fetchTutorials = async () => {
      try {
        const res = await fetch('/api/tutorials');
        if (res.ok) {
          const data = await res.json();
          setTutorials(data || []);
          // Extract unique topics
          const uniqueTopics: TutorialTopic[] = [];
          const seenIds = new Set<string>();
          (data || []).forEach((tutorial: Tutorial) => {
            if (tutorial.topic && !seenIds.has(tutorial.topic.id)) {
              seenIds.add(tutorial.topic.id);
              uniqueTopics.push(tutorial.topic);
            }
          });
          setTopics(uniqueTopics);
        }
      } catch (error) {
        console.error('Failed to fetch tutorials:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTutorials();
  }, []);

  const getLocalizedText = (en: string, vi: string) => locale === 'vi' ? vi : en;

  const filteredTutorials = selectedTopic === 'all'
    ? tutorials
    : tutorials.filter(t => t.topic?.slug === selectedTopic);

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
              <GraduationCap className="h-3 w-3" />
              {String(t('pages.tutorials.badge'))}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              {String(t('pages.tutorials.titleStart'))}{' '}
              <span className="text-[var(--landing-cyan)]">{String(t('pages.tutorials.titleHighlight'))}</span>
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)] max-w-2xl mx-auto">
              {String(t('pages.tutorials.subtitle'))}
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            <Button
              variant={selectedTopic === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTopic('all')}
              className={selectedTopic === 'all'
                ? 'bg-[var(--landing-primary)] hover:bg-[var(--landing-primary)]/90 text-white'
                : 'border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10'
              }
            >
              {String(t('pages.tutorials.categories.all'))}
            </Button>
            {topics.map((topic) => (
              <Button
                key={topic.id}
                variant={selectedTopic === topic.slug ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTopic(topic.slug)}
                className={selectedTopic === topic.slug
                  ? 'bg-[var(--landing-primary)] hover:bg-[var(--landing-primary)]/90 text-white'
                  : 'border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10'
                }
              >
                {getLocalizedText(topic.name_en, topic.name_vi)}
              </Button>
            ))}
          </div>

          {/* Tutorials Grid */}
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--landing-cyan)]" />
              </div>
            ) : filteredTutorials.length === 0 ? (
              <div className="text-center py-20">
                <GraduationCap className="h-16 w-16 mx-auto mb-4 text-[var(--landing-text-muted)]" />
                <p className="text-[var(--landing-text-secondary)]">
                  {locale === 'vi' ? 'Chưa có hướng dẫn nào.' : 'No tutorials yet.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTutorials.map((tutorial) => {
                  const levelSlug = tutorial.level?.slug || 'beginner';
                  const levelStyle = LEVEL_STYLES[levelSlug] || LEVEL_STYLES.beginner;
                  const duration = tutorial.duration_minutes || tutorial.reading_time;

                  return (
                    <Link key={tutorial.id} href={`/tutorials/${tutorial.slug}`} className="block group">
                      <div className="flex items-center gap-6 p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 hover:border-[var(--landing-cyan)]/50 transition-all">
                        {/* Icon */}
                        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-[var(--landing-primary)]/20 flex items-center justify-center group-hover:bg-[var(--landing-primary)]/30 transition-colors overflow-hidden">
                          {tutorial.thumbnail_url ? (
                            <img
                              src={tutorial.thumbnail_url}
                              alt={getLocalizedText(tutorial.title_en, tutorial.title_vi)}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen className="h-8 w-8 text-[var(--landing-cyan)]" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {tutorial.topic && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)]">
                                {getLocalizedText(tutorial.topic.name_en, tutorial.topic.name_vi)}
                              </span>
                            )}
                            {tutorial.level && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${levelStyle}`}>
                                {getLocalizedText(tutorial.level.name_en, tutorial.level.name_vi)}
                              </span>
                            )}
                            {tutorial.is_featured && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--landing-cyan)]/20 text-[var(--landing-cyan)]">
                                Featured
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold mb-1 text-white group-hover:text-[var(--landing-cyan)] transition-colors">
                            {getLocalizedText(tutorial.title_en, tutorial.title_vi)}
                          </h3>
                          <p className="text-sm text-[var(--landing-text-secondary)]">
                            {getLocalizedText(tutorial.description_en, tutorial.description_vi)}
                          </p>
                        </div>

                        {/* Duration */}
                        {duration && (
                          <div className="flex-shrink-0 text-right hidden sm:block">
                            <div className="flex items-center gap-1 text-sm text-[var(--landing-text-muted)]">
                              <Clock className="h-4 w-4" />
                              {duration} {locale === 'vi' ? 'phút' : 'min'}
                            </div>
                          </div>
                        )}

                        {/* Arrow */}
                        <ArrowRight className="h-5 w-5 text-[var(--landing-text-muted)] group-hover:text-[var(--landing-cyan)] transition-colors flex-shrink-0" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="max-w-xl mx-auto mt-20 text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.tutorials.needHelp.title'))}</h2>
            <p className="text-[var(--landing-text-secondary)] mb-6">
              {String(t('pages.tutorials.needHelp.subtitle'))}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="outline"
                className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                asChild
              >
                <Link href="/docs">{String(t('common.viewDocs'))}</Link>
              </Button>
              <Button
                className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
                asChild
              >
                <Link href="/community">{String(t('common.joinCommunity'))}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
