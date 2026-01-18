'use client';

import Link from 'next/link';
import { Mail, MessageCircle, MapPin, Phone, Send, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';
import { ParticleBackground } from '@/components/landing';

const METHOD_ICONS = [Mail, MessageCircle, Phone];
const METHOD_KEYS = ['email', 'discord', 'sales'] as const;

const SUBJECT_KEYS = ['general', 'salesEnterprise', 'technical', 'partnership', 'press'] as const;

export default function ContactPage() {
  const { t } = useTranslation();

  const getMethodHref = (key: string) => {
    switch (key) {
      case 'email': return 'mailto:info@aidorag.ai';
      case 'discord': return '#';
      case 'sales': return 'mailto:sales@aidorag.ai';
      default: return '#';
    }
  };

  return (
    <div className="relative">
      {/* Animated particle background */}
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
              <Mail className="h-3 w-3 mr-1 inline" />
              {String(t('pages.contact.badge'))}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              {String(t('pages.contact.titlePrefix'))} <span className="text-[var(--landing-cyan)]">{String(t('pages.contact.title'))}</span>
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)] max-w-2xl mx-auto">
              {String(t('pages.contact.subtitle'))}
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 backdrop-blur-sm p-8">
                <h2 className="text-xl font-bold mb-6 text-white">{String(t('pages.contact.form.title'))}</h2>
                <form className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-[var(--landing-text-secondary)]">{String(t('pages.contact.form.firstName'))}</label>
                      <input
                        type="text"
                        className="w-full h-10 px-4 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-bg-secondary)] text-white placeholder:text-[var(--landing-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--landing-primary)] focus:border-transparent"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-[var(--landing-text-secondary)]">{String(t('pages.contact.form.lastName'))}</label>
                      <input
                        type="text"
                        className="w-full h-10 px-4 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-bg-secondary)] text-white placeholder:text-[var(--landing-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--landing-primary)] focus:border-transparent"
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[var(--landing-text-secondary)]">{String(t('pages.contact.form.email'))}</label>
                    <input
                      type="email"
                      className="w-full h-10 px-4 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-bg-secondary)] text-white placeholder:text-[var(--landing-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--landing-primary)] focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[var(--landing-text-secondary)]">{String(t('pages.contact.form.subject'))}</label>
                    <select className="w-full h-10 px-4 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-bg-secondary)] text-white focus:outline-none focus:ring-2 focus:ring-[var(--landing-primary)] focus:border-transparent">
                      {SUBJECT_KEYS.map((subjectKey) => (
                        <option key={subjectKey} className="bg-[var(--landing-bg-secondary)] text-white">{String(t(`pages.contact.form.subjects.${subjectKey}`))}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[var(--landing-text-secondary)]">{String(t('pages.contact.form.message'))}</label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-bg-secondary)] text-white placeholder:text-[var(--landing-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--landing-primary)] focus:border-transparent resize-none"
                      placeholder={String(t('pages.contact.form.messagePlaceholder'))}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {String(t('pages.contact.form.send'))}
                  </Button>
                </form>
              </div>

              {/* Contact Info */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold mb-6 text-white">{String(t('pages.contact.otherWays'))}</h2>
                  <div className="space-y-4">
                    {METHOD_KEYS.map((methodKey, index) => {
                      const Icon = METHOD_ICONS[index];
                      return (
                        <Link
                          key={methodKey}
                          href={getMethodHref(methodKey)}
                          className="flex items-start gap-4 p-4 rounded-xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 backdrop-blur-sm hover:border-[var(--landing-cyan)]/50 hover:bg-[var(--landing-bg-card)] transition-all"
                        >
                          <div className="w-10 h-10 rounded-lg bg-[var(--landing-primary)]/20 flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-[var(--landing-primary)]" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{String(t(`pages.contact.methods.${methodKey}.title`))}</h3>
                            <p className="text-sm text-[var(--landing-text-muted)]">{String(t(`pages.contact.methods.${methodKey}.description`))}</p>
                            <p className="text-sm text-[var(--landing-cyan)] mt-1">{String(t(`pages.contact.methods.${methodKey}.value`))}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Office */}
                <div className="rounded-xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 backdrop-blur-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <MapPin className="h-5 w-5 text-[var(--landing-cyan)]" />
                    <h3 className="font-semibold text-white">{String(t('pages.contact.office.title'))}</h3>
                  </div>
                  <p className="text-[var(--landing-text-muted)] whitespace-pre-line">
                    {String(t('pages.contact.office.address'))}
                  </p>
                </div>

                {/* Response Time */}
                <div className="rounded-xl border border-[var(--landing-border)] bg-gradient-to-br from-[var(--landing-primary)]/10 to-[var(--landing-cyan)]/10 backdrop-blur-sm p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-5 w-5 text-[var(--landing-cyan)]" />
                    <h3 className="font-semibold text-white">{String(t('pages.contact.responseTime.title'))}</h3>
                  </div>
                  <p className="text-sm text-[var(--landing-text-secondary)]">
                    {String(t('pages.contact.responseTime.description'))}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
