'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '@/i18n';

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { t } = useTranslation();

  const FAQ_ITEMS = [
    {
      question: String(t('landing.faq.items.0.question')),
      answer: String(t('landing.faq.items.0.answer')),
    },
    {
      question: String(t('landing.faq.items.1.question')),
      answer: String(t('landing.faq.items.1.answer')),
    },
    {
      question: String(t('landing.faq.items.2.question')),
      answer: String(t('landing.faq.items.2.answer')),
    },
    {
      question: String(t('landing.faq.items.3.question')),
      answer: String(t('landing.faq.items.3.answer')),
    },
    {
      question: String(t('landing.faq.items.4.question')),
      answer: String(t('landing.faq.items.4.answer')),
    },
    {
      question: String(t('landing.faq.items.5.question')),
      answer: String(t('landing.faq.items.5.answer')),
    },
    {
      question: String(t('landing.faq.items.6.question')),
      answer: String(t('landing.faq.items.6.answer')),
    },
    {
      question: String(t('landing.faq.items.7.question')),
      answer: String(t('landing.faq.items.7.answer')),
    },
  ];

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
            {String(t('landing.faq.badge'))}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {String(t('landing.faq.titleStart'))}
            <br />
            <span className="text-[var(--landing-cyan)]">{String(t('landing.faq.titleHighlight'))}</span>
          </h2>
          <p className="text-[var(--landing-text-secondary)] text-lg max-w-2xl mx-auto">
            {String(t('landing.faq.subtitle'))}
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto space-y-4">
          {FAQ_ITEMS.map((item, index) => (
            <div
              key={index}
              className={`rounded-2xl border transition-all ${
                openIndex === index
                  ? 'bg-[var(--landing-bg-card)]/80 border-[var(--landing-cyan)]/30'
                  : 'bg-[var(--landing-bg-card)]/50 border-[var(--landing-border)] hover:border-[var(--landing-border-hover)]'
              }`}
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-medium text-white pr-4">{item.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-[var(--landing-cyan)] flex-shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-6 text-[var(--landing-text-secondary)] leading-relaxed">
                  {item.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="text-center mt-12">
          <p className="text-[var(--landing-text-secondary)] mb-4">
            {String(t('landing.faq.stillHaveQuestions'))}
          </p>
          <a
            href="/contact"
            className="text-[var(--landing-cyan)] hover:underline font-medium"
          >
            {String(t('landing.faq.contactSupport'))} →
          </a>
        </div>
      </div>
    </section>
  );
}

export default LandingFAQ;
