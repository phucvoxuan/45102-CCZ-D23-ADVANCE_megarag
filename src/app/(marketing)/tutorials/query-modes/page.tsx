'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock, Layers, Zap, Globe, Target, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

const QUERY_MODES = [
  { key: 'naive', icon: Target, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  { key: 'local', icon: Layers, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  { key: 'global', icon: Globe, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  { key: 'hybrid', icon: Shuffle, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  { key: 'mix', icon: Zap, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
];

export default function QueryModesTutorialPage() {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Back Link */}
          <Link
            href="/tutorials"
            className="inline-flex items-center gap-2 text-[var(--landing-text-muted)] hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            {String(t('pages.tutorialDetail.backToTutorials'))}
          </Link>

          {/* Header */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)]">
                {String(t('pages.tutorials.items.queryModes.category'))}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                {String(t('pages.tutorials.items.queryModes.level'))}
              </span>
              <span className="flex items-center gap-1 text-xs text-[var(--landing-text-muted)]">
                <Clock className="h-3 w-3" />
                {String(t('pages.tutorials.items.queryModes.duration'))}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              {String(t('pages.tutorialDetail.queryModes.title'))}
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)]">
              {String(t('pages.tutorialDetail.queryModes.description'))}
            </p>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto">
            {/* Introduction */}
            <div className="mb-12 p-8 rounded-2xl border-2 border-[var(--landing-primary)] bg-gradient-to-b from-[var(--landing-primary)]/20 to-[var(--landing-purple)]/20">
              <h2 className="text-2xl font-bold text-white mb-4">
                {String(t('pages.tutorialDetail.queryModes.intro.title'))}
              </h2>
              <p className="text-[var(--landing-text-secondary)]">
                {String(t('pages.tutorialDetail.queryModes.intro.content'))}
              </p>
            </div>

            {/* Query Modes */}
            <div className="space-y-6 mb-12">
              {QUERY_MODES.map(({ key, icon: Icon, color, bgColor }) => (
                <div
                  key={key}
                  className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 hover:border-[var(--landing-cyan)]/30 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`h-6 w-6 ${color}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {String(t(`pages.tutorialDetail.queryModes.modes.${key}.title`))}
                      </h3>
                      <p className="text-[var(--landing-text-secondary)] mb-3">
                        {String(t(`pages.tutorialDetail.queryModes.modes.${key}.description`))}
                      </p>
                      <p className="text-sm text-[var(--landing-text-muted)]">
                        <span className="font-medium text-[var(--landing-primary)]">
                          {String(t('pages.tutorialDetail.queryModes.bestFor'))}:
                        </span>{' '}
                        {String(t(`pages.tutorialDetail.queryModes.modes.${key}.bestFor`))}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tips */}
            <div className="mb-12 p-8 rounded-2xl border border-[var(--landing-border)] bg-gradient-to-br from-[var(--landing-primary)]/10 to-[var(--landing-cyan)]/10">
              <h2 className="text-2xl font-bold text-white mb-4">
                {String(t('pages.tutorialDetail.queryModes.tips.title'))}
              </h2>
              <p className="text-[var(--landing-text-secondary)]">
                {String(t('pages.tutorialDetail.queryModes.tips.content'))}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-[var(--landing-border)]">
              <Button
                variant="outline"
                className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                asChild
              >
                <Link href="/tutorials/getting-started">
                  <ArrowLeft className="mr-2 h-4 w-4" /> {String(t('pages.tutorialDetail.prevTutorial'))}
                </Link>
              </Button>
              <Button
                className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
                asChild
              >
                <Link href="/tutorials/knowledge-graph">
                  {String(t('pages.tutorialDetail.nextTutorial'))} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
