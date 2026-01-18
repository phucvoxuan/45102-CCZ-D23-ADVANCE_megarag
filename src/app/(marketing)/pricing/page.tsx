'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, X, Zap, Star, Building2, HelpCircle, Loader2, CreditCard, Wallet, Sparkles, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { createCheckoutSession } from '@/lib/stripe/client';
import {
  getAvailableProviders,
  PAYMENT_PROVIDERS,
  type PaymentProvider,
} from '@/lib/payments';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ParticleBackground } from '@/components/landing';

type BillingCycle = 'monthly' | 'yearly';
type PlanName = 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS';

const PLANS = [
  {
    id: 'free',
    planName: 'FREE' as PlanName,
    icon: Zap,
    monthlyPrice: 0,
    yearlyPrice: 0,
    popular: false,
    priceIdMonthly: null,
    priceIdYearly: null,
  },
  {
    id: 'starter',
    planName: 'STARTER' as PlanName,
    icon: Star,
    monthlyPrice: 29,
    yearlyPrice: 290,
    popular: false,
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID || null,
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID || null,
  },
  {
    id: 'pro',
    planName: 'PRO' as PlanName,
    icon: Star,
    monthlyPrice: 99,
    yearlyPrice: 990,
    popular: true,
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || null,
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || null,
  },
  {
    id: 'business',
    planName: 'BUSINESS' as PlanName,
    icon: Building2,
    monthlyPrice: 299,
    yearlyPrice: 2990,
    popular: false,
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID || null,
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID || null,
  },
];

const COMPARISON_FEATURES = [
  'documents',
  'queries',
  'storage',
  'ragModes',
  'knowledgeGraph',
  'chatbotWidgets',
  'chatbotBranding',
  'chatbotDomains',
  'chatbotAnalytics',
  'apiAccess',
  'teamMembers',
  'support',
  'customBranding',
  'webhooks',
  'sla',
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Payment method modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    plan: typeof PLANS[0];
    billingCycle: BillingCycle;
  } | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<PaymentProvider | null>(null);

  const availableProviders = getAvailableProviders();
  const billingCycle: BillingCycle = isYearly ? 'yearly' : 'monthly';

  const getPrice = (plan: typeof PLANS[0]) => {
    if (plan.monthlyPrice === 0) return 0;
    return isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  };

  const getFeatures = (planId: string): string[] => {
    const features = t(`pricingPage.plans.${planId}.features`);
    if (Array.isArray(features)) {
      return features;
    }
    return [];
  };

  const getComparisonValue = (planId: string, feature: string) => {
    const key = `pricingPage.comparison.values.${planId}.${feature}`;
    return String(t(key));
  };

  const handleSubscribe = async (plan: typeof PLANS[0]) => {
    // Free plan - just redirect to signup
    if (plan.monthlyPrice === 0) {
      router.push('/signup');
      return;
    }

    // Not logged in - redirect to signup with plan info
    if (!user) {
      router.push(`/signup?plan=${plan.id}&cycle=${billingCycle}`);
      return;
    }

    // Check available payment providers
    if (availableProviders.length === 0) {
      alert('No payment providers are currently available. Please contact support.');
      return;
    }

    // If only one provider, use it directly
    if (availableProviders.length === 1) {
      setLoadingPlan(plan.id);
      await processPayment(availableProviders[0], plan, billingCycle);
      setLoadingPlan(null);
      return;
    }

    // Multiple providers - show selection modal
    setSelectedPlan({ plan, billingCycle });
    setShowPaymentModal(true);
  };

  const processPayment = async (
    provider: PaymentProvider,
    plan: typeof PLANS[0],
    cycle: BillingCycle
  ) => {
    setLoadingProvider(provider);

    try {
      if (provider === 'stripe') {
        const priceId = cycle === 'yearly' ? plan.priceIdYearly : plan.priceIdMonthly;

        if (!priceId) {
          throw new Error('This plan is not available with Stripe yet.');
        }

        const { url } = await createCheckoutSession({
          priceId,
          billingCycle: cycle,
        });

        if (url) {
          window.location.href = url;
        }
      } else if (provider === 'payhip') {
        const response = await fetch('/api/payhip/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: plan.planName,
            billingCycle: cycle,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout');
        }

        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL returned from Payhip');
        }
      }
    } catch (error) {
      console.error('[PricingPage] Payment error:', error);
      alert(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    } finally {
      setLoadingProvider(null);
      setShowPaymentModal(false);
      setLoadingPlan(null);
    }
  };

  const handleProviderSelect = async (provider: PaymentProvider) => {
    if (!selectedPlan) return;
    await processPayment(provider, selectedPlan.plan, selectedPlan.billingCycle);
  };

  const getProviderIcon = (provider: PaymentProvider) => {
    const providerInfo = PAYMENT_PROVIDERS[provider];
    if (providerInfo.icon === 'credit-card') {
      return <CreditCard className="h-5 w-5" />;
    }
    return <Wallet className="h-5 w-5" />;
  };

  // FAQ items
  const faqItems = [
    { question: String(t('pricingPage.faq.items.0.question')), answer: String(t('pricingPage.faq.items.0.answer')) },
    { question: String(t('pricingPage.faq.items.1.question')), answer: String(t('pricingPage.faq.items.1.answer')) },
    { question: String(t('pricingPage.faq.items.2.question')), answer: String(t('pricingPage.faq.items.2.answer')) },
    { question: String(t('pricingPage.faq.items.3.question')), answer: String(t('pricingPage.faq.items.3.answer')) },
    { question: String(t('pricingPage.faq.items.4.question')), answer: String(t('pricingPage.faq.items.4.answer')) },
  ];

  return (
    <div className="relative">
      {/* Animated particle background */}
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-block px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
              {String(t('pricingPage.badge'))}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 text-white">
              {String(t('pricingPage.titleStart'))}
              <br />
              <span className="text-[var(--landing-cyan)]">{String(t('pricingPage.titleHighlight'))}</span>
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)] mb-8">
              {String(t('pricingPage.subtitle'))}
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={cn('text-sm font-medium', !isYearly ? 'text-white' : 'text-[var(--landing-text-muted)]')}>
                {String(t('pricingPage.monthly'))}
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={cn(
                  'relative w-14 h-7 rounded-full transition-colors',
                  isYearly ? 'bg-[var(--landing-primary)]' : 'bg-[var(--landing-bg-secondary)]'
                )}
              >
                <div
                  className={cn(
                    'absolute top-1 w-5 h-5 rounded-full bg-white transition-transform',
                    isYearly ? 'translate-x-8' : 'translate-x-1'
                  )}
                />
              </button>
              <span className={cn('text-sm font-medium', isYearly ? 'text-white' : 'text-[var(--landing-text-muted)]')}>
                {String(t('pricingPage.yearly'))}
              </span>
              {isYearly && (
                <span className="px-2 py-1 rounded-full bg-[var(--landing-success)]/20 text-[var(--landing-success)] text-xs font-medium">
                  {String(t('pricingPage.save20'))}
                </span>
              )}
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-20">
            {PLANS.map((plan) => {
              const planName = String(t(`pricingPage.plans.${plan.id}.name`));
              const planDescription = String(t(`pricingPage.plans.${plan.id}.description`));
              const planCta = String(t(`pricingPage.plans.${plan.id}.cta`));
              const features = getFeatures(plan.id);

              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative flex flex-col p-6 rounded-2xl border transition-all',
                    plan.popular
                      ? 'bg-[var(--landing-bg-card)] border-[var(--landing-cyan)] shadow-lg shadow-[var(--landing-cyan)]/10'
                      : 'bg-[var(--landing-bg-card)]/50 border-[var(--landing-border)] hover:border-[var(--landing-border-hover)]'
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] text-white text-xs font-medium flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {String(t('pricingPage.popular'))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-2">
                    <plan.icon className={cn('h-5 w-5', plan.popular ? 'text-[var(--landing-cyan)]' : 'text-[var(--landing-primary)]')} />
                    <h3 className="text-xl font-bold text-white">{planName}</h3>
                  </div>
                  <p className="text-sm text-[var(--landing-text-muted)] mb-4">{planDescription}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">${getPrice(plan)}</span>
                    <span className="text-[var(--landing-text-muted)]">
                      {plan.monthlyPrice === 0
                        ? String(t('pricingPage.oneTime'))
                        : isYearly
                          ? `/${String(t('pricingPage.year'))}`
                          : `/${String(t('pricingPage.mo'))}`}
                    </span>
                    {isYearly && plan.monthlyPrice > 0 && (
                      <p className="text-sm text-[var(--landing-text-muted)] mt-1">
                        {String(t('pricingPage.billedAnnually'))}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-6 flex-1">
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className={cn('h-5 w-5 shrink-0 mt-0.5', plan.popular ? 'text-[var(--landing-cyan)]' : 'text-[var(--landing-success)]')} />
                        <span className="text-sm text-[var(--landing-text-secondary)]">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={cn(
                      'w-full',
                      plan.popular
                        ? 'bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white'
                        : 'bg-[var(--landing-bg-secondary)] hover:bg-[var(--landing-bg-secondary)]/80 text-white border border-[var(--landing-border)]'
                    )}
                    onClick={() => handleSubscribe(plan)}
                    disabled={loadingPlan === plan.id || authLoading}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      planCta
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Feature Comparison Table */}
          <div className="max-w-6xl mx-auto mb-20">
            <h2 className="text-2xl font-bold text-center mb-8 text-white">
              {String(t('pricingPage.comparison.title'))}
            </h2>

            <div className="border-2 border-[var(--landing-primary)] rounded-2xl overflow-hidden bg-gradient-to-b from-[var(--landing-primary)]/20 to-[var(--landing-purple)]/20 shadow-lg shadow-[var(--landing-primary)]/10">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[var(--landing-bg-secondary)]/50">
                      <th className="px-6 py-4 text-left text-sm font-medium text-[var(--landing-text-secondary)]">
                        {String(t('pricingPage.comparison.feature'))}
                      </th>
                      {PLANS.map((plan) => (
                        <th
                          key={plan.id}
                          className={cn(
                            'px-6 py-4 text-center text-sm font-medium text-white',
                            plan.popular && 'bg-[var(--landing-primary)]/10'
                          )}
                        >
                          {String(t(`pricingPage.plans.${plan.id}.name`))}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_FEATURES.map((feature, idx) => (
                      <tr
                        key={feature}
                        className={cn(
                          'border-t border-[var(--landing-border)]',
                          idx % 2 === 0 && 'bg-[var(--landing-bg-card)]/30'
                        )}
                      >
                        <td className="px-6 py-4 text-sm text-[var(--landing-text-secondary)]">
                          {String(t(`pricingPage.comparison.features.${feature}`))}
                        </td>
                        {PLANS.map((plan) => {
                          const value = getComparisonValue(plan.id, feature);
                          return (
                            <td
                              key={plan.id}
                              className={cn(
                                'px-6 py-4 text-center',
                                plan.popular && 'bg-[var(--landing-primary)]/5'
                              )}
                            >
                              {value === 'true' ? (
                                <Check className="h-5 w-5 text-[var(--landing-success)] mx-auto" />
                              ) : value === 'false' ? (
                                <X className="h-5 w-5 text-[var(--landing-text-muted)]/50 mx-auto" />
                              ) : (
                                <span className="text-sm text-[var(--landing-text-secondary)]">{value}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Enterprise Section */}
          <div className="max-w-4xl mx-auto mb-20 mt-8">
            <div className="relative p-8 pt-12 rounded-2xl bg-gradient-to-r from-[var(--landing-primary)]/10 to-[var(--landing-cyan)]/10 border border-[var(--landing-border)] text-center overflow-hidden">
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[var(--landing-cyan)]/10 rounded-full blur-3xl" />

              <div className="relative z-10">
                <Building2 className="h-12 w-12 text-[var(--landing-cyan)] mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2 text-white">{String(t('pricingPage.enterprise.title'))}</h3>
                <p className="text-[var(--landing-text-secondary)] mb-6 max-w-md mx-auto">
                  {String(t('pricingPage.enterprise.description'))}
                </p>
                <div className="flex flex-wrap justify-center gap-3 mb-6">
                  {['unlimited', 'infrastructure', 'onPremise', 'customSla', 'support247'].map((feature) => (
                    <span
                      key={feature}
                      className="px-3 py-1 rounded-full bg-[var(--landing-bg-secondary)] border border-[var(--landing-border)] text-sm text-[var(--landing-text-muted)]"
                    >
                      {String(t(`pricingPage.enterprise.features.${feature}`))}
                    </span>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="bg-transparent border-[var(--landing-border)] text-white hover:bg-white/10 hover:border-[var(--landing-cyan)]"
                  asChild
                >
                  <Link href="/contact">{String(t('pricingPage.contactSales'))}</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Pricing FAQ */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8 text-white">
              {String(t('pricingPage.faq.title'))}
            </h2>

            <div className="space-y-4">
              {faqItems.map((faq, index) => {
                // Skip if key not found
                if (faq.question.includes('pricingPage.faq.items')) return null;

                return (
                  <div
                    key={index}
                    className={cn(
                      'rounded-2xl border transition-all',
                      openFaqIndex === index
                        ? 'bg-[var(--landing-bg-card)]/80 border-[var(--landing-cyan)]/30'
                        : 'bg-[var(--landing-bg-card)]/50 border-[var(--landing-border)] hover:border-[var(--landing-border-hover)]'
                    )}
                  >
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                      className="w-full flex items-center justify-between p-6 text-left"
                    >
                      <span className="flex items-center gap-3">
                        <HelpCircle className={cn('h-5 w-5', openFaqIndex === index ? 'text-[var(--landing-cyan)]' : 'text-[var(--landing-text-muted)]')} />
                        <span className="font-medium text-white">{faq.question}</span>
                      </span>
                      <ChevronDown
                        className={cn(
                          'w-5 h-5 text-[var(--landing-cyan)] flex-shrink-0 transition-transform',
                          openFaqIndex === index && 'rotate-180'
                        )}
                      />
                    </button>
                    <div
                      className={cn(
                        'overflow-hidden transition-all duration-300',
                        openFaqIndex === index ? 'max-h-96' : 'max-h-0'
                      )}
                    >
                      <div className="px-6 pb-6 text-[var(--landing-text-secondary)] leading-relaxed pl-14">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Note */}
          <div className="text-center mt-12">
            <p className="text-sm text-[var(--landing-text-muted)]">
              {String(t('pricingPage.bottomNote'))}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Method Selection Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md bg-[var(--landing-bg-card)] border-[var(--landing-border)]">
          <DialogHeader>
            <DialogTitle className="text-white">{String(t('pricingPage.modal.title'))}</DialogTitle>
            <DialogDescription className="text-[var(--landing-text-muted)]">
              {String(t('pricingPage.modal.description'))}{' '}
              {selectedPlan && (
                <span className="font-medium text-white">
                  {String(t(`pricingPage.plans.${selectedPlan.plan.id}.name`))} ({selectedPlan.billingCycle})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {availableProviders.map((provider) => {
              const info = PAYMENT_PROVIDERS[provider];
              const isLoading = loadingProvider === provider;

              return (
                <Button
                  key={provider}
                  variant="outline"
                  className="w-full justify-start h-auto p-4 bg-transparent border-[var(--landing-border)] hover:bg-[var(--landing-bg-secondary)] hover:border-[var(--landing-cyan)]"
                  onClick={() => handleProviderSelect(provider)}
                  disabled={loadingProvider !== null}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-shrink-0 text-[var(--landing-text-muted)]">
                      {getProviderIcon(provider)}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium text-white">{info.name}</div>
                      <div className="text-sm text-[var(--landing-text-muted)]">
                        {info.description}
                      </div>
                    </div>
                    {isLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--landing-text-muted)]" />
                    )}
                  </div>
                </Button>
              );
            })}
          </div>

          <div className="text-xs text-[var(--landing-text-muted)] text-center border-t border-[var(--landing-border)] pt-4">
            {String(t('pricingPage.modal.secureNote'))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
