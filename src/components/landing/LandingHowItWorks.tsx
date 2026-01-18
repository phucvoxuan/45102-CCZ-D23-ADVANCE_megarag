'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Upload, Cpu, MessageSquare, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/i18n';

const STEPS = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload',
    subtitle: 'Drop your files',
    description: 'Simply drag and drop your documents. We support PDF, DOCX, PPTX, images, and more.',
    color: 'cyan',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'AI Processes',
    subtitle: 'We extract, embed, and connect',
    description: 'Our AI analyzes your documents, extracts key information, and builds a knowledge graph.',
    color: 'primary',
  },
  {
    number: '03',
    icon: MessageSquare,
    title: 'Chat',
    subtitle: 'Ask anything, get cited answers',
    description: 'Start asking questions and receive accurate answers with precise citations.',
    color: 'purple',
  },
];

export function LandingHowItWorks() {
  const { t } = useTranslation();

  const getColorClasses = (color: string, type: 'bg' | 'text' | 'bgLight') => {
    const colors = {
      cyan: {
        bg: 'bg-[var(--landing-cyan)]',
        text: 'text-[var(--landing-cyan)]',
        bgLight: 'bg-[var(--landing-cyan)]/20',
      },
      primary: {
        bg: 'bg-[var(--landing-primary)]',
        text: 'text-[var(--landing-primary)]',
        bgLight: 'bg-[var(--landing-primary)]/20',
      },
      purple: {
        bg: 'bg-[var(--landing-purple)]',
        text: 'text-[var(--landing-purple)]',
        bgLight: 'bg-[var(--landing-purple)]/20',
      },
    };
    return colors[color as keyof typeof colors]?.[type] || '';
  };

  return (
    <section id="how-it-works" className="py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
            How It Works
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            From Documents to Answers
            <br />
            <span className="text-[var(--landing-cyan)]">in Minutes</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {STEPS.map((step, index) => (
            <div key={index} className="relative">
              {/* Step Card */}
              <div className="relative p-8 rounded-2xl bg-[var(--landing-bg-card)]/50 border border-[var(--landing-border)] hover:border-[var(--landing-cyan)]/30 transition-all h-full">
                {/* Number Badge */}
                <div className={`absolute -top-4 left-8 w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${getColorClasses(step.color, 'bg')}`}>
                  {step.number}
                </div>

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 mt-4 ${getColorClasses(step.color, 'bgLight')}`}>
                  <step.icon className={`w-6 h-6 ${getColorClasses(step.color, 'text')}`} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className={`text-sm mb-3 ${getColorClasses(step.color, 'text')}`}>
                  {step.subtitle}
                </p>
                <p className="text-[var(--landing-text-secondary)] text-sm">
                  {step.description}
                </p>

                {/* Decorative dots */}
                <div className="flex gap-1 mt-6">
                  <div className={`w-2 h-2 rounded-full ${getColorClasses(step.color, 'bg')}`} />
                  <div className={`w-2 h-2 rounded-full opacity-60 ${getColorClasses(step.color, 'bg')}`} />
                  <div className={`w-2 h-2 rounded-full opacity-30 ${getColorClasses(step.color, 'bg')}`} />
                </div>
              </div>

              {/* Arrow Connector (hidden on mobile, shown between cards) */}
              {index < STEPS.length - 1 && (
                <div className="hidden md:flex absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-[var(--landing-bg-card)] border border-[var(--landing-border)] items-center justify-center z-10">
                  <ArrowRight className="w-3 h-3 text-[var(--landing-text-muted)]" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <p className="text-[var(--landing-text-secondary)] mb-6">
            Ready to transform your document workflow?
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white px-8 shadow-lg hover:shadow-[0_0_20px_rgba(0,102,255,0.4)] transition-all duration-300 hover:-translate-y-0.5"
            asChild
          >
            <Link href="/signup">
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

export default LandingHowItWorks;
