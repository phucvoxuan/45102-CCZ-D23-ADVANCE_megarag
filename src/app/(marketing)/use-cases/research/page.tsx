'use client';

import Link from 'next/link';
import { GraduationCap, BookOpen, Search, FileText, Quote, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

const BENEFIT_ICONS = [BookOpen, Search, FileText];
const BENEFIT_KEYS = ['literature', 'analysis', 'citation'] as const;

export default function ResearchPage() {
  const { t } = useTranslation();
  const features = t('pages.research.features') as string[];

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
              <GraduationCap className="h-3 w-3" />
              {String(t('pages.research.badge'))}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              AIDORag for <span className="text-[var(--landing-cyan)]">{String(t('pages.research.title'))}</span>
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)] max-w-2xl mx-auto mb-8">
              {String(t('pages.research.subtitle'))}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
                asChild
              >
                <Link href="/signup">
                  {String(t('common.tryFree'))} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                asChild
              >
                <Link href="/contact">{String(t('common.requestDemo'))}</Link>
              </Button>
            </div>
          </div>

          {/* Benefits */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="grid md:grid-cols-3 gap-8">
              {BENEFIT_KEYS.map((benefitKey, index) => {
                const Icon = BENEFIT_ICONS[index];
                return (
                  <div
                    key={benefitKey}
                    className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 text-center hover:border-[var(--landing-cyan)]/30 transition-all"
                  >
                    <div className="w-12 h-12 rounded-lg bg-[var(--landing-primary)]/20 flex items-center justify-center mb-4 mx-auto">
                      <Icon className="h-6 w-6 text-[var(--landing-cyan)]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-white">{String(t(`pages.research.benefits.${benefitKey}`))}</h3>
                    <p className="text-sm text-[var(--landing-text-secondary)]">{String(t(`pages.research.benefits.${benefitKey}Desc`))}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Features List */}
          <div className="max-w-3xl mx-auto mb-20">
            <div className="rounded-2xl border-2 border-[var(--landing-primary)] bg-gradient-to-br from-[var(--landing-primary)]/20 to-[var(--landing-purple)]/20 p-8">
              <h2 className="text-2xl font-bold mb-6 text-center text-white">{String(t('pages.research.whatYouCanDo'))}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {Array.isArray(features) && features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-[var(--landing-text-secondary)]">{String(feature)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="max-w-3xl mx-auto mb-20">
            <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-8">
              <Quote className="h-8 w-8 text-[var(--landing-cyan)]/30 mb-4" />
              <blockquote className="text-lg mb-4 text-white">
                {String(t('pages.research.testimonial.quote'))}
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--landing-primary)]/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-[var(--landing-cyan)]">DR</span>
                </div>
                <div>
                  <p className="font-semibold text-white">{String(t('pages.research.testimonial.author'))}</p>
                  <p className="text-sm text-[var(--landing-text-muted)]">{String(t('pages.research.testimonial.role'))}</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.research.cta.title'))}</h2>
            <p className="text-[var(--landing-text-secondary)] mb-6">
              {String(t('pages.research.cta.subtitle'))}
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
              asChild
            >
              <Link href="/signup">{String(t('common.getStartedFree'))}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
