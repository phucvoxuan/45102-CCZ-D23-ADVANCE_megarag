import { loadStripe, Stripe } from '@stripe/stripe-js';

// Lazy load Stripe on the client side
let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

// Helper to handle checkout flow - returns URL for redirect
export async function createCheckoutSession(params: {
  priceId: string;
  billingCycle: 'monthly' | 'yearly';
}): Promise<{ sessionId: string; url: string }> {
  const response = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create checkout session');
  }

  return response.json();
}

// Helper to redirect to Stripe Checkout using URL from session
export async function redirectToCheckout(priceId: string, billingCycle: 'monthly' | 'yearly'): Promise<void> {
  const { url } = await createCheckoutSession({ priceId, billingCycle });
  if (url) {
    window.location.href = url;
  } else {
    throw new Error('No checkout URL returned');
  }
}

// Helper to redirect to Customer Portal
export async function redirectToCustomerPortal(): Promise<void> {
  const response = await fetch('/api/stripe/portal', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create portal session');
  }

  const { url } = await response.json();
  window.location.href = url;
}

// Export stripePromise for components that need direct access
export { stripePromise };
