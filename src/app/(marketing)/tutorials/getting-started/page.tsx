'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock, BookOpen, CheckCircle2, Upload, Search, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

export default function GettingStartedTutorialPage() {
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
                {String(t('pages.tutorials.items.gettingStarted.category'))}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">
                {String(t('pages.tutorials.items.gettingStarted.level'))}
              </span>
              <span className="flex items-center gap-1 text-xs text-[var(--landing-text-muted)]">
                <Clock className="h-3 w-3" />
                {String(t('pages.tutorials.items.gettingStarted.duration'))}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              {String(t('pages.tutorialDetail.gettingStarted.title'))}
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)]">
              {String(t('pages.tutorialDetail.gettingStarted.description'))}
            </p>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto">
            {/* Step 1 */}
            <div className="mb-12 p-8 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-cyan)] flex items-center justify-center font-bold text-lg border border-[var(--landing-cyan)]/30">
                  1
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {String(t('pages.tutorialDetail.gettingStarted.step1.title'))}
                </h2>
              </div>
              <p className="text-[var(--landing-text-secondary)] mb-6">
                {String(t('pages.tutorialDetail.gettingStarted.step1.content'))}
              </p>
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[var(--landing-success)] flex-shrink-0" />
                    <span className="text-[var(--landing-text-secondary)]">
                      {String(t(`pages.tutorialDetail.gettingStarted.step1.items.${i}`))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2 */}
            <div className="mb-12 p-8 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-cyan)] flex items-center justify-center font-bold text-lg border border-[var(--landing-cyan)]/30">
                  2
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {String(t('pages.tutorialDetail.gettingStarted.step2.title'))}
                </h2>
              </div>
              <p className="text-[var(--landing-text-secondary)] mb-6">
                {String(t('pages.tutorialDetail.gettingStarted.step2.content'))}
              </p>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[var(--landing-bg-secondary)]/50 border border-[var(--landing-border)]">
                  <Upload className="h-8 w-8 text-[var(--landing-cyan)] mb-3" />
                  <h3 className="font-semibold text-white mb-1">{String(t('pages.tutorialDetail.gettingStarted.step2.upload.title'))}</h3>
                  <p className="text-sm text-[var(--landing-text-muted)]">{String(t('pages.tutorialDetail.gettingStarted.step2.upload.desc'))}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--landing-bg-secondary)]/50 border border-[var(--landing-border)]">
                  <Search className="h-8 w-8 text-[var(--landing-cyan)] mb-3" />
                  <h3 className="font-semibold text-white mb-1">{String(t('pages.tutorialDetail.gettingStarted.step2.search.title'))}</h3>
                  <p className="text-sm text-[var(--landing-text-muted)]">{String(t('pages.tutorialDetail.gettingStarted.step2.search.desc'))}</p>
                </div>
                <div className="p-4 rounded-xl bg-[var(--landing-bg-secondary)]/50 border border-[var(--landing-border)]">
                  <MessageSquare className="h-8 w-8 text-[var(--landing-cyan)] mb-3" />
                  <h3 className="font-semibold text-white mb-1">{String(t('pages.tutorialDetail.gettingStarted.step2.chat.title'))}</h3>
                  <p className="text-sm text-[var(--landing-text-muted)]">{String(t('pages.tutorialDetail.gettingStarted.step2.chat.desc'))}</p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="mb-12 p-8 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-cyan)] flex items-center justify-center font-bold text-lg border border-[var(--landing-cyan)]/30">
                  3
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {String(t('pages.tutorialDetail.gettingStarted.step3.title'))}
                </h2>
              </div>
              <p className="text-[var(--landing-text-secondary)]">
                {String(t('pages.tutorialDetail.gettingStarted.step3.content'))}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-[var(--landing-border)]">
              <Link
                href="/tutorials"
                className="flex items-center gap-2 text-[var(--landing-text-muted)] hover:text-white transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                {String(t('pages.tutorialDetail.backToTutorials'))}
              </Link>
              <Button
                className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
                asChild
              >
                <Link href="/tutorials/query-modes">
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
