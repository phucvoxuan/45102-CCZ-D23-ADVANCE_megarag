'use client';

import Link from 'next/link';
import { Building, Target, Heart, Users, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

const VALUE_ICONS = [Target, Sparkles, Heart, Users];
const VALUE_KEYS = ['userFirst', 'innovation', 'transparency', 'community'] as const;

interface TeamMember {
  name: string;
  role: string;
  title?: string;
  avatar: string;
  quote?: string;
}

export default function AboutPage() {
  const { t } = useTranslation();
  const storyParagraphs = t('pages.about.story.paragraphs') as string[];
  const teamMembers = t('pages.about.team.members') as unknown as TeamMember[];

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
              <Building className="h-3 w-3" />
              {String(t('pages.about.badge'))}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              {String(t('pages.about.titlePrefix'))} <span className="text-[var(--landing-cyan)]">{String(t('pages.about.title'))}</span>
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)] max-w-2xl mx-auto">
              {String(t('pages.about.subtitle'))}
            </p>
          </div>

          {/* Mission */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="rounded-2xl border-2 border-[var(--landing-primary)] bg-gradient-to-br from-[var(--landing-primary)]/20 to-[var(--landing-purple)]/20 p-8 text-center">
              <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.about.mission.title'))}</h2>
              <p className="text-lg text-[var(--landing-text-secondary)] max-w-2xl mx-auto">
                {String(t('pages.about.mission.description'))}
              </p>
            </div>
          </div>

          {/* Story */}
          <div className="max-w-3xl mx-auto mb-20">
            <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-8">
              <h2 className="text-2xl font-bold mb-6 text-center text-white">{String(t('pages.about.story.title'))}</h2>
              <div className="space-y-4">
                {Array.isArray(storyParagraphs) && storyParagraphs.map((paragraph, index) => (
                  <p key={index} className="text-[var(--landing-text-secondary)]">
                    {String(paragraph)}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="max-w-4xl mx-auto mb-20">
            <h2 className="text-2xl font-bold mb-8 text-center text-white">{String(t('pages.about.values.title'))}</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              {VALUE_KEYS.map((valueKey, index) => {
                const Icon = VALUE_ICONS[index];
                return (
                  <div key={valueKey} className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 hover:border-[var(--landing-cyan)]/30 transition-all">
                    <div className="w-12 h-12 rounded-lg bg-[var(--landing-primary)]/20 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-[var(--landing-cyan)]" />
                    </div>
                    <h3 className="font-semibold mb-2 text-white">{String(t(`pages.about.values.items.${valueKey}`))}</h3>
                    <p className="text-sm text-[var(--landing-text-secondary)]">{String(t(`pages.about.values.items.${valueKey}Desc`))}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team */}
          <div className="max-w-5xl mx-auto mb-20">
            <h2 className="text-2xl font-bold mb-4 text-center text-white">{String(t('pages.about.team.title'))}</h2>
            <p className="text-center text-[var(--landing-text-secondary)] mb-8">{String(t('pages.about.team.desc'))}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.isArray(teamMembers) && teamMembers.map((member) => (
                <div key={member.name} className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 hover:border-[var(--landing-cyan)]/30 transition-all">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-[var(--landing-primary)]/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-[var(--landing-cyan)]">{member.avatar}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{member.name}</h3>
                      <p className="text-sm text-[var(--landing-cyan)]">{member.role}</p>
                      {member.title && (
                        <p className="text-xs text-[var(--landing-text-muted)]">{member.title}</p>
                      )}
                    </div>
                  </div>
                  {member.quote && (
                    <p className="text-sm text-[var(--landing-text-secondary)] italic">&ldquo;{member.quote}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.about.cta.title'))}</h2>
            <p className="text-[var(--landing-text-secondary)] mb-6">
              {String(t('pages.about.cta.subtitle'))}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white px-8"
                asChild
              >
                <Link href="/careers">
                  {String(t('pages.about.cta.viewPositions'))} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10 px-8"
                asChild
              >
                <Link href="/contact">{String(t('common.contactUs'))}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
