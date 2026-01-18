'use client';

import { Star, Quote } from 'lucide-react';
import { useTranslation } from '@/i18n';

export function LandingTestimonials() {
  const { t } = useTranslation();

  const TESTIMONIALS = [
    {
      quote: String(t('landing.testimonials.items.0.quote')),
      author: String(t('landing.testimonials.items.0.author')),
      role: String(t('landing.testimonials.items.0.role')),
      company: String(t('landing.testimonials.items.0.company')),
      rating: 5,
    },
    {
      quote: String(t('landing.testimonials.items.1.quote')),
      author: String(t('landing.testimonials.items.1.author')),
      role: String(t('landing.testimonials.items.1.role')),
      company: String(t('landing.testimonials.items.1.company')),
      rating: 5,
    },
    {
      quote: String(t('landing.testimonials.items.2.quote')),
      author: String(t('landing.testimonials.items.2.author')),
      role: String(t('landing.testimonials.items.2.role')),
      company: String(t('landing.testimonials.items.2.company')),
      rating: 5,
    },
    {
      quote: String(t('landing.testimonials.items.3.quote')),
      author: String(t('landing.testimonials.items.3.author')),
      role: String(t('landing.testimonials.items.3.role')),
      company: String(t('landing.testimonials.items.3.company')),
      rating: 5,
    },
  ];

  const STATS = [
    { value: '4.9/5', label: String(t('landing.testimonials.stats.rating')) },
    { value: '10K+', label: String(t('landing.testimonials.stats.users')) },
    { value: '500+', label: String(t('landing.testimonials.stats.clients')) },
    { value: '99%', label: String(t('landing.testimonials.stats.satisfaction')) },
  ];

  return (
    <section id="testimonials" className="py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
            {String(t('landing.testimonials.badge'))}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {String(t('landing.testimonials.titleStart'))}
            <br />
            <span className="text-[var(--landing-cyan)]">{String(t('landing.testimonials.titleHighlight'))}</span>
          </h2>
          <p className="text-[var(--landing-text-secondary)] text-lg max-w-2xl mx-auto">
            {String(t('landing.testimonials.subtitle'))}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {STATS.map((stat, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-2xl bg-[var(--landing-bg-card)]/30 border border-[var(--landing-border)]"
            >
              <div className="text-3xl md:text-4xl font-bold text-[var(--landing-cyan)] mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-[var(--landing-text-secondary)]">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TESTIMONIALS.map((testimonial, index) => (
            <div
              key={index}
              className="relative p-6 rounded-2xl bg-[var(--landing-bg-card)]/50 border border-[var(--landing-border)] hover:border-[var(--landing-cyan)]/30 transition-all group"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-12 h-12 text-[var(--landing-cyan)]" />
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[var(--landing-warning)] text-[var(--landing-warning)]" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-[var(--landing-text-secondary)] mb-6 leading-relaxed">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--landing-cyan)] to-[var(--landing-purple)] flex items-center justify-center text-white font-bold">
                  {testimonial.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-medium text-white">{testimonial.author}</div>
                  <div className="text-sm text-[var(--landing-text-muted)]">
                    {testimonial.role} {String(t('landing.testimonials.at'))} {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default LandingTestimonials;
