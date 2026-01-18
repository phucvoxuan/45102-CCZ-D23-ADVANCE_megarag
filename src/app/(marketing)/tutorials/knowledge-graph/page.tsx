'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock, Network, Scan, GitBranch, Eye, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

const FEATURES = [
  { key: 'entityDetection', icon: Scan },
  { key: 'relationMapping', icon: GitBranch },
  { key: 'visualization', icon: Eye },
  { key: 'graphQuery', icon: Search },
];

export default function KnowledgeGraphTutorialPage() {
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
                {String(t('pages.tutorials.items.knowledgeGraph.category'))}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                {String(t('pages.tutorials.items.knowledgeGraph.level'))}
              </span>
              <span className="flex items-center gap-1 text-xs text-[var(--landing-text-muted)]">
                <Clock className="h-3 w-3" />
                {String(t('pages.tutorials.items.knowledgeGraph.duration'))}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              {String(t('pages.tutorialDetail.knowledgeGraph.title'))}
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)]">
              {String(t('pages.tutorialDetail.knowledgeGraph.description'))}
            </p>
          </div>

          {/* Content */}
          <div className="max-w-4xl mx-auto">
            {/* Visual Demo */}
            <div className="mb-12 p-8 rounded-2xl border-2 border-[var(--landing-primary)] bg-gradient-to-b from-[var(--landing-primary)]/20 to-[var(--landing-purple)]/20">
              <div className="aspect-video bg-[var(--landing-bg-secondary)]/50 rounded-lg flex items-center justify-center border border-[var(--landing-border)]">
                <div className="text-center">
                  <Network className="h-16 w-16 text-[var(--landing-cyan)] mx-auto mb-4" />
                  <p className="text-[var(--landing-text-secondary)]">
                    {String(t('pages.tutorialDetail.knowledgeGraph.demo'))}
                  </p>
                </div>
              </div>
            </div>

            {/* Introduction */}
            <div className="mb-12 p-8 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50">
              <h2 className="text-2xl font-bold text-white mb-4">
                {String(t('pages.tutorialDetail.knowledgeGraph.intro.title'))}
              </h2>
              <p className="text-[var(--landing-text-secondary)]">
                {String(t('pages.tutorialDetail.knowledgeGraph.intro.content'))}
              </p>
            </div>

            {/* Features */}
            <div className="grid sm:grid-cols-2 gap-6 mb-12">
              {FEATURES.map(({ key, icon: Icon }) => (
                <div
                  key={key}
                  className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 hover:border-[var(--landing-cyan)]/30 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--landing-primary)]/20 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-[var(--landing-cyan)]" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {String(t(`pages.tutorialDetail.knowledgeGraph.features.${key}.title`))}
                  </h3>
                  <p className="text-sm text-[var(--landing-text-secondary)]">
                    {String(t(`pages.tutorialDetail.knowledgeGraph.features.${key}.description`))}
                  </p>
                </div>
              ))}
            </div>

            {/* How to Use */}
            <div className="mb-12 p-8 rounded-2xl border border-[var(--landing-border)] bg-gradient-to-br from-[var(--landing-primary)]/10 to-[var(--landing-cyan)]/10">
              <h2 className="text-2xl font-bold text-white mb-4">
                {String(t('pages.tutorialDetail.knowledgeGraph.howToUse.title'))}
              </h2>
              <p className="text-[var(--landing-text-secondary)]">
                {String(t('pages.tutorialDetail.knowledgeGraph.howToUse.content'))}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-8 border-t border-[var(--landing-border)]">
              <Button
                variant="outline"
                className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                asChild
              >
                <Link href="/tutorials/query-modes">
                  <ArrowLeft className="mr-2 h-4 w-4" /> {String(t('pages.tutorialDetail.prevTutorial'))}
                </Link>
              </Button>
              <Button
                className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
                asChild
              >
                <Link href="/tutorials/api-integration">
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
