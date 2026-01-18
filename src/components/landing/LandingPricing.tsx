'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check, Sparkles } from 'lucide-react';
import { useTranslation } from '@/i18n';

export function LandingPricing() {
  const [isYearly, setIsYearly] = useState(false);
  const { t } = useTranslation();

  const PLANS = [
    {
      name: String(t('landing.pricing.plans.free.name')),
      description: String(t('landing.pricing.plans.free.description')),
      monthlyPrice: 0,
      yearlyTotal: 0,
      features: [
        String(t('landing.pricing.plans.free.features.0')),
        String(t('landing.pricing.plans.free.features.1')),
        String(t('landing.pricing.plans.free.features.2')),
        String(t('landing.pricing.plans.free.features.3')),
      ],
      cta: String(t('landing.pricing.plans.free.cta')),
      href: '/signup',
      highlighted: false,
    },
    {
      name: String(t('landing.pricing.plans.starter.name')),
      description: String(t('landing.pricing.plans.starter.description')),
      monthlyPrice: 29,
      yearlyTotal: 290,
      features: [
        String(t('landing.pricing.plans.starter.features.0')),
        String(t('landing.pricing.plans.starter.features.1')),
        String(t('landing.pricing.plans.starter.features.2')),
        String(t('landing.pricing.plans.starter.features.3')),
        String(t('landing.pricing.plans.starter.features.4')),
      ],
      cta: String(t('landing.pricing.plans.starter.cta')),
      href: '/signup?plan=starter',
      highlighted: false,
    },
    {
      name: String(t('landing.pricing.plans.pro.name')),
      description: String(t('landing.pricing.plans.pro.description')),
      monthlyPrice: 99,
      yearlyTotal: 990,
      features: [
        String(t('landing.pricing.plans.pro.features.0')),
        String(t('landing.pricing.plans.pro.features.1')),
        String(t('landing.pricing.plans.pro.features.2')),
        String(t('landing.pricing.plans.pro.features.3')),
        String(t('landing.pricing.plans.pro.features.4')),
        String(t('landing.pricing.plans.pro.features.5')),
        String(t('landing.pricing.plans.pro.features.6')),
      ],
      cta: String(t('landing.pricing.plans.pro.cta')),
      href: '/signup?plan=pro',
      highlighted: true,
      badge: String(t('landing.pricing.popular')),
    },
    {
      name: String(t('landing.pricing.plans.business.name')),
      description: String(t('landing.pricing.plans.business.description')),
      monthlyPrice: 299,
      yearlyTotal: 2990,
      features: [
        String(t('landing.pricing.plans.business.features.0')),
        String(t('landing.pricing.plans.business.features.1')),
        String(t('landing.pricing.plans.business.features.2')),
        String(t('landing.pricing.plans.business.features.3')),
        String(t('landing.pricing.plans.business.features.4')),
        String(t('landing.pricing.plans.business.features.5')),
        String(t('landing.pricing.plans.business.features.6')),
        String(t('landing.pricing.plans.business.features.7')),
      ],
      cta: String(t('landing.pricing.plans.business.cta')),
      href: '/signup?plan=business',
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
            {String(t('landing.pricing.badge'))}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {String(t('landing.pricing.titleStart'))}
            <br />
            <span className="text-[var(--landing-cyan)]">{String(t('landing.pricing.titleHighlight'))}</span>
          </h2>
          <p className="text-[var(--landing-text-secondary)] text-lg max-w-2xl mx-auto">
            {String(t('landing.pricing.subtitle'))}
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm font-medium ${!isYearly ? 'text-white' : 'text-[var(--landing-text-secondary)]'}`}>
            {String(t('landing.pricing.monthly'))}
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              isYearly ? 'bg-[var(--landing-primary)]' : 'bg-[var(--landing-bg-secondary)]'
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                isYearly ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isYearly ? 'text-white' : 'text-[var(--landing-text-secondary)]'}`}>
            {String(t('landing.pricing.yearly'))}
          </span>
          {isYearly && (
            <span className="px-2 py-1 rounded-full bg-[var(--landing-success)]/20 text-[var(--landing-success)] text-xs font-medium">
              {String(t('landing.pricing.save20'))}
            </span>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-6 rounded-2xl transition-all ${
                plan.highlighted
                  ? 'bg-gradient-to-b from-[var(--landing-primary)]/20 to-[var(--landing-purple)]/20 border-2 border-[var(--landing-primary)] scale-105'
                  : 'bg-[var(--landing-bg-card)]/50 border border-[var(--landing-border)] hover:border-[var(--landing-cyan)]/30'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] text-white text-xs font-medium">
                    <Sparkles className="w-3 h-3" />
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-sm text-[var(--landing-text-secondary)]">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="mb-6">
                {isYearly ? (
                  <>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">
                        ${plan.yearlyTotal}
                      </span>
                      <span className="text-[var(--landing-text-secondary)]">/{String(t('landing.pricing.year'))}</span>
                    </div>
                    {plan.monthlyPrice > 0 && (
                      <p className="text-xs text-[var(--landing-text-muted)] mt-1">
                        ${Math.round(plan.yearlyTotal / 12)}/{String(t('landing.pricing.mo'))} {String(t('landing.pricing.billedAnnually'))}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      ${plan.monthlyPrice}
                    </span>
                    <span className="text-[var(--landing-text-secondary)]">/{String(t('landing.pricing.mo'))}</span>
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                      plan.highlighted ? 'text-[var(--landing-cyan)]' : 'text-[var(--landing-success)]'
                    }`} />
                    <span className="text-sm text-[var(--landing-text-secondary)]">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                className={`w-full ${
                  plan.highlighted
                    ? 'bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white'
                    : 'bg-[var(--landing-bg-secondary)] hover:bg-[var(--landing-bg-secondary)]/80 text-white border border-[var(--landing-border)]'
                }`}
                asChild
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm text-[var(--landing-text-muted)] mt-8">
          {String(t('landing.pricing.bottomNote'))}
        </p>
      </div>
    </section>
  );
}

export default LandingPricing;
