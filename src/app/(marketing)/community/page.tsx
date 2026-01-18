'use client';

import Link from 'next/link';
import { MessageCircle, Github, Users, Heart, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

const CHANNEL_ICONS = [MessageCircle, Github, Users];
const CHANNEL_KEYS = ['discord', 'github', 'forum'] as const;

const STAT_KEYS = ['users', 'countries', 'contributors', 'active'] as const;

const contributors = [
  { name: 'Alex Chen', avatar: 'AC', contributions: 47 },
  { name: 'Sarah Kim', avatar: 'SK', contributions: 32 },
  { name: 'Mike Johnson', avatar: 'MJ', contributions: 28 },
  { name: 'Emily Davis', avatar: 'ED', contributions: 24 },
  { name: 'Chris Lee', avatar: 'CL', contributions: 19 },
];

export default function CommunityPage() {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
              <Heart className="h-3 w-3" />
              {String(t('pages.community.badge'))}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              {String(t('pages.community.titlePrefix'))} <span className="text-[var(--landing-cyan)]">{String(t('pages.community.title'))}</span>
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)] max-w-2xl mx-auto mb-8">
              {String(t('pages.community.subtitle'))}
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
              asChild
            >
              <Link href="#">
                {String(t('pages.community.joinDiscord'))} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Channels */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="grid md:grid-cols-3 gap-6">
              {CHANNEL_KEYS.map((channelKey, index) => {
                const Icon = CHANNEL_ICONS[index];
                return (
                  <div
                    key={channelKey}
                    className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 hover:border-[var(--landing-cyan)]/30 transition-all"
                  >
                    <div className="w-12 h-12 rounded-lg bg-[var(--landing-primary)]/20 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-[var(--landing-cyan)]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-white">{String(t(`pages.community.channels.${channelKey}.name`))}</h3>
                    <p className="text-sm text-[var(--landing-text-secondary)] mb-4">{String(t(`pages.community.channels.${channelKey}.description`))}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[var(--landing-text-muted)]">
                        {String(t(`pages.community.channels.${channelKey}.members`))} {String(t('pages.community.members'))}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                        asChild
                      >
                        <Link href="#">
                          {String(t(`pages.community.channels.${channelKey}.cta`))} <ExternalLink className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stats */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {STAT_KEYS.map((statKey) => (
                <div key={statKey} className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50">
                  <p className="text-3xl font-bold text-[var(--landing-cyan)]">{String(t(`pages.community.stats.${statKey}.value`))}</p>
                  <p className="text-sm text-[var(--landing-text-muted)]">{String(t(`pages.community.stats.${statKey}.label`))}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Contributors */}
          <div className="max-w-2xl mx-auto mb-20">
            <h2 className="text-2xl font-bold mb-6 text-center text-white">{String(t('pages.community.topContributors'))}</h2>
            <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 overflow-hidden">
              <div className="divide-y divide-[var(--landing-border)]">
                {contributors.map((contributor, index) => (
                  <div key={contributor.name} className="flex items-center gap-4 p-4">
                    <span className="text-sm text-[var(--landing-text-muted)] w-6">{index + 1}</span>
                    <div className="w-10 h-10 rounded-full bg-[var(--landing-primary)]/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-[var(--landing-cyan)]">{contributor.avatar}</span>
                    </div>
                    <span className="flex-1 font-medium text-white">{contributor.name}</span>
                    <span className="text-sm text-[var(--landing-text-muted)]">
                      {contributor.contributions} {String(t('pages.community.contributions'))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.community.cta.title'))}</h2>
            <p className="text-[var(--landing-text-secondary)] mb-6">
              {String(t('pages.community.cta.subtitle'))}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
                asChild
              >
                <Link href="#">{String(t('pages.community.joinDiscord'))}</Link>
              </Button>
              <Button
                variant="outline"
                className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                asChild
              >
                <Link href="#">{String(t('pages.community.starGithub'))}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
