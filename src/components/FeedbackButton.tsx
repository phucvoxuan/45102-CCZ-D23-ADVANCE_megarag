'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, X, Send, Loader2, CheckCircle } from 'lucide-react';

type FeedbackType = 'bug' | 'feature' | 'general';

interface FeedbackButtonProps {
  position?: 'bottom-right' | 'bottom-left';
}

export function FeedbackButton({ position = 'bottom-right' }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const positionClasses = position === 'bottom-right'
    ? 'right-4 bottom-4'
    : 'left-4 bottom-4';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          message,
          email: email || undefined,
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      setIsSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setIsSubmitted(false);
        setMessage('');
        setEmail('');
        setFeedbackType('general');
      }, 2000);
    } catch {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed ${positionClasses} z-50`}>
      {/* Feedback Form */}
      {isOpen && (
        <div className="mb-4 w-80 rounded-lg border bg-background shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-3">
            <h3 className="font-semibold">Send Feedback</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Content */}
          {isSubmitted ? (
            <div className="flex flex-col items-center justify-center p-8">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="mt-2 font-medium">Thank you!</p>
              <p className="text-sm text-muted-foreground">Your feedback has been received.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4">
              {/* Type Selection */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">Feedback Type</label>
                <div className="flex gap-2">
                  {(['bug', 'feature', 'general'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFeedbackType(type)}
                      className={`rounded-md px-3 py-1.5 text-sm capitalize transition-colors ${
                        feedbackType === type
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {type === 'bug' ? 'Bug Report' : type === 'feature' ? 'Feature Request' : 'General'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    feedbackType === 'bug'
                      ? 'Describe the bug you encountered...'
                      : feedbackType === 'feature'
                      ? 'Describe the feature you would like...'
                      : 'Share your thoughts...'
                  }
                  className="h-24 w-full resize-none rounded-md border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* Email (Optional) */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">
                  Email <span className="text-muted-foreground">(optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-md border bg-background p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="mb-4 text-sm text-red-500">{error}</p>
              )}

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !message.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Feedback
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      )}

      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageSquare className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
