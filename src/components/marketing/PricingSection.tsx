'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Zap, Star, Building2, Loader2, CreditCard, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { createCheckoutSession } from '@/lib/stripe/client';
import {
  getAvailableProviders,
  PAYMENT_PROVIDERS,
  type PaymentProvider,
} from '@/lib/payments';

type BillingCycle = 'monthly' | 'yearly';
type PlanName = 'FREE' | 'STARTER' | 'PRO' | 'BUSINESS';

const PLANS = [
  {
    id: 'free',
    planName: 'FREE' as PlanName,
    icon: Zap,
    price: 0,
    yearlyPrice: 0,
    period: 'forever',
    popular: false,
    priceIdMonthly: null,
    priceIdYearly: null,
  },
  {
    id: 'starter',
    planName: 'STARTER' as PlanName,
    icon: Star,
    price: 29,
    yearlyPrice: 290,
    period: '/month',
    popular: false,
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID || null,
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID || null,
  },
  {
    id: 'pro',
    planName: 'PRO' as PlanName,
    icon: Star,
    price: 99,
    yearlyPrice: 990,
    period: '/month',
    popular: true,
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || null,
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || null,
  },
  {
    id: 'business',
    planName: 'BUSINESS' as PlanName,
    icon: Building2,
    price: 299,
    yearlyPrice: 2990,
    period: '/month',
    popular: false,
    priceIdMonthly: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID || null,
    priceIdYearly: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID || null,
  },
];

export function PricingSection() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Payment method modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{
    plan: typeof PLANS[0];
    billingCycle: BillingCycle;
  } | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<PaymentProvider | null>(null);

  const availableProviders = getAvailableProviders();

  const getFeatures = (planId: string): string[] => {
    const features = t(`pricing.plans.${planId}.features`);
    if (Array.isArray(features)) {
      return features;
    }
    return [];
  };

  const getDisplayPrice = (plan: typeof PLANS[0]) => {
    if (plan.price === 0) return 0;
    if (billingCycle === 'yearly') {
      // Show monthly equivalent for yearly
      return Math.round(plan.yearlyPrice / 12);
    }
    return plan.price;
  };

  const getYearlySavings = (plan: typeof PLANS[0]) => {
    if (plan.price === 0) return 0;
    const fullYearlyPrice = plan.price * 12;
    return Math.round(((fullYearlyPrice - plan.yearlyPrice) / fullYearlyPrice) * 100);
  };

  const handleSubscribe = async (plan: typeof PLANS[0]) => {
    console.log('[PricingSection] handleSubscribe called:', {
      plan: plan.planName,
      billingCycle,
      user: !!user,
      availableProviders,
    });

    // Free plan - just redirect to signup
    if (plan.price === 0) {
      console.log('[PricingSection] Free plan - redirecting to signup');
      router.push('/signup');
      return;
    }

    // Not logged in - redirect to login with return URL
    if (!user) {
      console.log('[PricingSection] Not logged in - redirecting to login');
      router.push(`/login?redirect=/pricing&plan=${plan.id}&cycle=${billingCycle}`);
      return;
    }

    // Check available payment providers
    if (availableProviders.length === 0) {
      console.error('[PricingSection] No payment providers available!');
      alert('No payment providers are currently available. Please contact support.');
      return;
    }

    console.log('[PricingSection] Processing payment with providers:', availableProviders);

    // If only one provider, use it directly
    if (availableProviders.length === 1) {
      console.log('[PricingSection] Single provider mode:', availableProviders[0]);
      setLoadingPlan(plan.id);
      await processPayment(availableProviders[0], plan, billingCycle);
      setLoadingPlan(null);
      return;
    }

    // Multiple providers - show selection modal
    console.log('[PricingSection] Multiple providers - showing modal');
    setSelectedPlan({ plan, billingCycle });
    setShowPaymentModal(true);
  };

  const processPayment = async (
    provider: PaymentProvider,
    plan: typeof PLANS[0],
    cycle: BillingCycle
  ) => {
    console.log('[PricingSection] processPayment called:', {
      provider,
      plan: plan.planName,
      cycle,
    });

    setLoadingProvider(provider);

    try {
      if (provider === 'stripe') {
        console.log('[PricingSection] Using Stripe checkout');
        // Use Stripe checkout
        const priceId = cycle === 'yearly' ? plan.priceIdYearly : plan.priceIdMonthly;

        if (!priceId) {
          throw new Error('This plan is not available with Stripe yet.');
        }

        const { url } = await createCheckoutSession({
          priceId,
          billingCycle: cycle,
        });

        if (url) {
          console.log('[PricingSection] Redirecting to Stripe:', url);
          window.location.href = url;
        }
      } else if (provider === 'payhip') {
        console.log('[PricingSection] Using Payhip checkout - calling API');
        // Use Payhip checkout
        const response = await fetch('/api/payhip/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: plan.planName,
            billingCycle: cycle,
          }),
        });

        const data = await response.json();
        console.log('[PricingSection] Payhip API response:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create checkout');
        }

        if (data.url) {
          console.log('[PricingSection] Redirecting to Payhip:', data.url);
          window.location.href = data.url;
        } else {
          console.error('[PricingSection] No URL in Payhip response');
          throw new Error('No checkout URL returned from Payhip');
        }
      }
    } catch (error) {
      console.error('[PricingSection] Payment error:', error);
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

  return (
    <section id="pricing" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <Badge variant="secondary" className="mb-4">{String(t('pricing.badge'))}</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            {String(t('pricing.title'))}
          </h2>
          <p className="text-lg text-muted-foreground">
            {String(t('pricing.subtitle'))}
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Label
            htmlFor="billing-toggle"
            className={cn(
              'text-sm font-medium cursor-pointer',
              billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={billingCycle === 'yearly'}
            onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
          />
          <Label
            htmlFor="billing-toggle"
            className={cn(
              'text-sm font-medium cursor-pointer flex items-center gap-2',
              billingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground'
            )}
          >
            Yearly
            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
              Save 17%
            </Badge>
          </Label>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {PLANS.map((plan, index) => {
            const displayPrice = getDisplayPrice(plan);
            const savings = getYearlySavings(plan);
            const isLoading = loadingPlan === plan.id;

            return (
              <Card
                key={plan.id}
                className={cn(
                  'relative flex flex-col animate-fade-in',
                  plan.popular && 'border-primary shadow-lg scale-[1.02]'
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">{String(t('pricing.popular'))}</Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <plan.icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">{String(t(`pricing.plans.${plan.id}.name`))}</CardTitle>
                  </div>
                  <CardDescription>{String(t(`pricing.plans.${plan.id}.description`))}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${displayPrice}</span>
                    <span className="text-muted-foreground">
                      {plan.period === 'forever' ? String(t('pricing.forever')) : String(t('pricing.perMonth'))}
                    </span>
                    {billingCycle === 'yearly' && plan.price > 0 && (
                      <div className="mt-1">
                        <span className="text-sm text-muted-foreground line-through">
                          ${plan.price}/mo
                        </span>
                        <span className="text-sm text-green-600 ml-2">
                          Save {savings}%
                        </span>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {getFeatures(plan.id).map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(plan)}
                    disabled={isLoading || authLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : plan.price === 0 ? (
                      String(t('pricing.getStarted'))
                    ) : (
                      String(t('pricing.subscribe'))
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* View all plans link */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            {String(t('pricing.viewAllPlans'))}{' '}
            <Link href="/pricing" className="text-primary hover:underline">
              {String(t('pricing.comparePlans'))}
            </Link>
          </p>
        </div>
      </div>

      {/* Payment Method Selection Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Payment Method</DialogTitle>
            <DialogDescription>
              Select how you&apos;d like to pay for{' '}
              {selectedPlan && (
                <span className="font-medium">
                  {selectedPlan.plan.planName} ({selectedPlan.billingCycle})
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
                  className="w-full justify-start h-auto p-4 hover:bg-muted"
                  onClick={() => handleProviderSelect(provider)}
                  disabled={loadingProvider !== null}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-shrink-0 text-muted-foreground">
                      {getProviderIcon(provider)}
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-medium">{info.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {info.description}
                      </div>
                    </div>
                    {isLoading && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </Button>
              );
            })}
          </div>

          <div className="text-xs text-muted-foreground text-center border-t pt-4">
            Secure payment processing. Your payment info is never stored on our servers.
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
