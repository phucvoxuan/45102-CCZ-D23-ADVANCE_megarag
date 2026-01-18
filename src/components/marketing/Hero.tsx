'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, Play, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';

export function Hero() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-8">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm gap-2">
              <Sparkles className="h-4 w-4" />
              {String(t('hero.badge'))}
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              {String(t('hero.titleStart'))}{' '}
              <span className="gradient-text">{String(t('hero.titleHighlight'))}</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-lg">
              {String(t('hero.subtitle'))}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild className="group">
                <Link href="/signup">
                  {String(t('hero.cta.primary'))}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard/chat">
                  <Play className="h-4 w-4" />
                  {String(t('hero.cta.secondary'))}
                </Link>
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>{String(t('hero.features.noCard'))}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>{String(t('hero.features.freePlan'))}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>{String(t('hero.features.instantSetup'))}</span>
              </div>
            </div>
          </div>

          {/* Visual - Dashboard Preview */}
          <div className="relative lg:pl-8">
            <div className="relative rounded-xl border bg-card shadow-2xl overflow-hidden">
              {/* Mock browser header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-6 bg-muted rounded-md w-full max-w-xs" />
                </div>
              </div>

              {/* Mock chat interface */}
              <div className="p-4 space-y-4 bg-background min-h-[300px]">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%]">
                    <p className="text-sm">{String(t('hero.demo.userMessage'))}</p>
                  </div>
                </div>

                {/* AI response */}
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] space-y-2">
                    <p className="text-sm">{String(t('hero.demo.aiResponse'))}</p>
                    <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                      <li>{String(t('hero.demo.finding1'))}</li>
                      <li>{String(t('hero.demo.finding2'))}</li>
                      <li>{String(t('hero.demo.finding3'))}</li>
                    </ul>
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <span className="inline-block w-2 h-2 bg-violet-500 rounded-full" />
                      {String(t('hero.demo.source'))}
                    </p>
                  </div>
                </div>

                {/* Typing indicator */}
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 bg-card border rounded-lg px-4 py-2 shadow-lg">
              <p className="text-xs text-muted-foreground">{String(t('hero.stats.label'))}</p>
              <p className="text-2xl font-bold">{String(t('hero.stats.value'))}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
