'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play, Sparkles, FileText, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/i18n';

export function LandingHero() {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className={`space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--landing-bg-card)] border border-[var(--landing-border)]">
              <Sparkles className="w-4 h-4 text-[var(--landing-purple)]" />
              <span className="text-[var(--landing-text-secondary)] text-sm">Multi-Modal RAG System</span>
              <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">New</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="text-white">{String(t('hero.titleStart'))}</span>
              <br />
              <span className="text-[var(--landing-cyan)]">{String(t('hero.titleHighlight'))}</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-[var(--landing-text-secondary)] max-w-lg">
              {String(t('hero.subtitle'))}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white px-8 py-6 text-lg shadow-lg hover:shadow-[0_0_20px_rgba(0,102,255,0.4)] transition-all duration-300 hover:-translate-y-0.5 group"
                asChild
              >
                <Link href="/signup">
                  {String(t('hero.cta.primary'))}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-[var(--landing-border)] text-white hover:bg-white/10 hover:border-[var(--landing-cyan)] px-8 py-6 text-lg transition-all duration-300"
                asChild
              >
                <Link href="/dashboard/chat">
                  <Play className="mr-2 w-5 h-5" />
                  {String(t('hero.cta.secondary'))}
                </Link>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-[var(--landing-text-muted)]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span>{String(t('hero.features.noCard'))}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>{String(t('hero.features.freePlan'))}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span>{String(t('hero.features.instantSetup'))}</span>
              </div>
            </div>
          </div>

          {/* Right Content - Chat Mockup */}
          <div className={`relative transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <ChatMockup t={t} />
          </div>
        </div>
      </div>
    </section>
  );
}

interface ChatMockupProps {
  t: (key: string) => string | object;
}

function ChatMockup({ t }: ChatMockupProps) {
  return (
    <div className="relative">
      {/* Floating document icon */}
      <div className="absolute -top-8 -left-8 w-16 h-16 rounded-xl bg-[var(--landing-bg-card)] border border-[var(--landing-border)] flex items-center justify-center animate-[float_6s_ease-in-out_infinite] z-10">
        <FileText className="w-8 h-8 text-[var(--landing-cyan)]" />
      </div>

      {/* Main chat window */}
      <div className="bg-[var(--landing-bg-card)]/80 backdrop-blur-xl border border-[var(--landing-border)] rounded-2xl p-6 shadow-2xl">
        {/* Window header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="ml-4 text-sm text-[var(--landing-text-secondary)]">AIDORag Chat</span>
        </div>

        {/* Chat messages */}
        <div className="space-y-4">
          {/* User message */}
          <div className="flex justify-end">
            <div className="bg-[var(--landing-primary)]/20 border border-[var(--landing-primary)]/30 rounded-2xl rounded-br-md px-4 py-3 max-w-[80%]">
              <p className="text-white text-sm">{String(t('hero.demo.userMessage'))}</p>
            </div>
          </div>

          {/* AI response */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--landing-cyan)] to-[var(--landing-purple)] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="bg-[var(--landing-bg-secondary)]/50 rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%]">
              <p className="text-white text-sm mb-3">{String(t('hero.demo.aiResponse'))}</p>
              <ul className="space-y-1 text-sm text-[var(--landing-text-secondary)]">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  {String(t('hero.demo.finding1'))}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  {String(t('hero.demo.finding2'))}
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  {String(t('hero.demo.finding3'))}
                </li>
              </ul>
              {/* Citation */}
              <div className="mt-3 flex items-center gap-2 text-xs text-[var(--landing-cyan)]">
                <FileText className="w-3 h-3" />
                <span>{String(t('hero.demo.source'))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Input area */}
        <div className="mt-6 flex items-center gap-3">
          <input
            type="text"
            placeholder="Ask anything about your documents..."
            className="flex-1 bg-[var(--landing-bg-primary)]/50 border border-[var(--landing-border)] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[var(--landing-text-muted)] focus:outline-none focus:border-[var(--landing-cyan)]/50"
            disabled
          />
          <button className="w-10 h-10 rounded-xl bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] flex items-center justify-center hover:opacity-90 transition-opacity">
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[var(--landing-purple)]/20 rounded-full blur-2xl" />
      <div className="absolute top-1/2 -right-8 w-16 h-16 bg-[var(--landing-cyan)]/20 rounded-full blur-xl" />
    </div>
  );
}

export default LandingHero;
