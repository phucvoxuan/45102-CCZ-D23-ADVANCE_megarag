'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';

export function CTASection() {
  const { t } = useTranslation();

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="relative rounded-3xl bg-gradient-to-r from-violet-600 to-purple-600 p-8 sm:p-12 lg:p-20 text-center overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[size:4rem_4rem]" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-sm text-white/90">{String(t('cta.badge'))}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              {String(t('cta.title'))}
            </h2>

            <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-xl mx-auto">
              {String(t('cta.subtitle'))}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild className="group">
                <Link href="/signup">
                  {String(t('cta.primaryButton'))}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white"
                asChild
              >
                <Link href="/dashboard/chat">
                  {String(t('cta.secondaryButton'))}
                </Link>
              </Button>
            </div>

            <p className="text-sm text-white/60 mt-8">
              {String(t('cta.footer'))}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
