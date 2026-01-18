'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface SessionInfo {
  status: string;
  customerEmail: string;
  subscriptionId: string;
}

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const provider = searchParams.get('provider'); // 'stripe' or 'payhip'

  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    async function verifySession() {
      // For Payhip, we don't need to verify session - just show success
      // Payhip webhook will handle subscription activation
      if (provider === 'payhip') {
        setLoading(false);
        // Start countdown for redirect
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              // Use full page reload to ensure auth state is fresh
              window.location.href = '/dashboard';
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(timer);
      }

      // For Stripe, verify the session
      if (!sessionId) {
        setError('No session ID found');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/stripe/checkout?session_id=${sessionId}`);
        if (!response.ok) {
          throw new Error('Failed to verify session');
        }

        const data = await response.json();
        setSessionInfo(data);

        // Start countdown for redirect
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              // Use full page reload to ensure auth state is fresh
              window.location.href = '/dashboard';
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Verification failed');
      } finally {
        setLoading(false);
      }
    }

    verifySession();
  }, [sessionId, provider]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">!</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Pricing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-lg w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Success Animation */}
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600 mb-6">
              Thank you for subscribing to AIDORag. Your account has been upgraded.
            </p>

            {/* Subscription Details */}
            {sessionInfo && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-2">Subscription Details</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Email:</span> {sessionInfo.customerEmail}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span>{' '}
                    <span className="text-green-600 font-medium">Active</span>
                  </p>
                </div>
              </div>
            )}

            {/* What's Next */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">What&apos;s Next?</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Upload more documents with your increased limits</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Access all RAG query modes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Explore the knowledge graph features</span>
                </li>
              </ul>
            </div>

            {/* Redirect Notice */}
            <p className="text-sm text-gray-500 mb-4">
              Redirecting to dashboard in {countdown} seconds...
            </p>

            {/* CTA Button */}
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-4">
          Need help? Contact us at{' '}
          <a href="mailto:support@aidorag.com" className="text-green-600 hover:underline">
            support@aidorag.com
          </a>
        </p>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
