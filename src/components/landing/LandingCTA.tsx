'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from '@/i18n';

export function LandingCTA() {
  const { t } = useTranslation();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--landing-primary)]/20 via-[var(--landing-bg-primary)] to-[var(--landing-purple)]/20" />

      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-[var(--landing-cyan)]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[var(--landing-purple)]/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 border border-[var(--landing-primary)]/30 mb-8">
            <Sparkles className="w-4 h-4 text-[var(--landing-cyan)]" />
            <span className="text-sm text-[var(--landing-cyan)] font-medium">
              {String(t('landing.cta.badge'))}
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            {String(t('landing.cta.titleStart'))}
            <br />
            <span className="bg-gradient-to-r from-[var(--landing-cyan)] via-[var(--landing-primary)] to-[var(--landing-purple)] bg-clip-text text-transparent">
              {String(t('landing.cta.titleHighlight'))}
            </span>
          </h2>

          {/* Description */}
          <p className="text-lg text-[var(--landing-text-secondary)] mb-10 max-w-2xl mx-auto">
            {String(t('landing.cta.subtitle'))}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white px-8 shadow-lg hover:shadow-[0_0_30px_rgba(0,102,255,0.5)] transition-all duration-300 hover:-translate-y-1"
              asChild
            >
              <Link href="/signup">
                {String(t('landing.cta.primaryButton'))}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-[var(--landing-border)] hover:border-[var(--landing-cyan)] hover:bg-[var(--landing-cyan)]/10 text-white px-8 transition-all duration-300"
              asChild
            >
              <Link href="/demo">
                {String(t('landing.cta.secondaryButton'))}
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-[var(--landing-text-muted)]">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--landing-success)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{String(t('landing.cta.noCard'))}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--landing-success)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{String(t('landing.cta.freeTrial'))}</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--landing-success)]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{String(t('landing.cta.cancelAnytime'))}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LandingCTA;
