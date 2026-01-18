'use client';

import { XCircle, ArrowLeft, MessageCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-lg w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Cancel Icon */}
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-12 w-12 text-gray-400" />
          </div>

          {/* Content */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Checkout Cancelled
            </h1>
            <p className="text-gray-600 mb-6">
              Your payment was not processed. No charges have been made to your account.
            </p>

            {/* Reasons & Help */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-3">Need help deciding?</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">?</span>
                  </div>
                  <span>
                    <strong>Not sure which plan?</strong> Start with Free and upgrade anytime.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-xs font-bold">$</span>
                  </div>
                  <span>
                    <strong>Save 2 months</strong> when you choose yearly billing.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-purple-600 text-xs font-bold">!</span>
                  </div>
                  <span>
                    <strong>Cancel anytime</strong> with no hidden fees or commitments.
                  </span>
                </li>
              </ul>
            </div>

            {/* Special Offer */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6 border border-blue-100">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-blue-600">Special Offer:</span> Use code{' '}
                <code className="bg-white px-2 py-0.5 rounded text-blue-600 font-mono">WELCOME10</code>{' '}
                for 10% off your first month!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Link>

              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Have questions? Contact our sales team
          </Link>
        </div>
      </div>
    </div>
  );
}
