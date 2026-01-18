'use client';

import Link from 'next/link';
import { Building2, Shield, Server, Users, ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

const BENEFIT_ICONS = [Server, Shield, Users];
const BENEFIT_KEYS = ['scale', 'security', 'team'] as const;

const SECURITY_ICONS = [Lock, Shield, Server, Users];
const SECURITY_KEYS = ['encryption', 'soc2', 'residency', 'rbac'] as const;

export default function EnterprisePage() {
  const { t } = useTranslation();
  const features = t('pages.enterprise.features') as string[];
  const trustedBy = t('pages.enterprise.trustedBy') as string[];

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
              <Building2 className="h-3 w-3" />
              {String(t('pages.enterprise.badge'))}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              AIDORag for <span className="text-[var(--landing-cyan)]">{String(t('pages.enterprise.title'))}</span>
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)] max-w-2xl mx-auto mb-8">
              {String(t('pages.enterprise.subtitle'))}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
                asChild
              >
                <Link href="/contact">
                  {String(t('common.contactSales'))} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                asChild
              >
                <Link href="/pricing">{String(t('common.viewPricing'))}</Link>
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
                    <h3 className="text-lg font-semibold mb-2 text-white">{String(t(`pages.enterprise.benefits.${benefitKey}`))}</h3>
                    <p className="text-sm text-[var(--landing-text-secondary)]">{String(t(`pages.enterprise.benefits.${benefitKey}Desc`))}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-8">
              <h2 className="text-2xl font-bold mb-6 text-center text-white">{String(t('pages.enterprise.securityTitle'))}</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
                {SECURITY_KEYS.map((securityKey, index) => {
                  const Icon = SECURITY_ICONS[index];
                  return (
                    <div key={securityKey} className="text-center">
                      <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-3 mx-auto">
                        <Icon className="h-6 w-6 text-green-400" />
                      </div>
                      <p className="text-sm font-medium text-white">{String(t(`pages.enterprise.securityFeatures.${securityKey}`))}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="max-w-3xl mx-auto mb-20">
            <div className="rounded-2xl border-2 border-[var(--landing-primary)] bg-gradient-to-br from-[var(--landing-primary)]/20 to-[var(--landing-purple)]/20 p-8">
              <h2 className="text-2xl font-bold mb-6 text-center text-white">{String(t('pages.enterprise.featuresTitle'))}</h2>
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

          {/* Trusted By */}
          <div className="max-w-4xl mx-auto mb-20 text-center">
            <h2 className="text-xl font-semibold text-[var(--landing-text-muted)] mb-8">{String(t('pages.enterprise.trustedByTitle'))}</h2>
            <div className="flex flex-wrap justify-center gap-8">
              {Array.isArray(trustedBy) && trustedBy.map((org, index) => (
                <div key={index} className="px-6 py-3 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50">
                  <span className="font-medium text-[var(--landing-text-secondary)]">{String(org)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="max-w-2xl mx-auto text-center">
            <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-8">
              <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.enterprise.cta.title'))}</h2>
              <p className="text-[var(--landing-text-secondary)] mb-6">
                {String(t('pages.enterprise.cta.subtitle'))}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
                  asChild
                >
                  <Link href="/contact">{String(t('common.contactSales'))}</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                  asChild
                >
                  <Link href="/docs">{String(t('common.viewDocs'))}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
