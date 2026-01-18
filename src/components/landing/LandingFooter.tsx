'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { useTranslation } from '@/i18n';

const SOCIAL_LINKS = [
  { name: 'GitHub', icon: Github, href: 'https://github.com' },
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com' },
  { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
  { name: 'Email', icon: Mail, href: 'mailto:contact@aidorag.com' },
];

export function LandingFooter() {
  const { t } = useTranslation();

  const FOOTER_LINKS = {
    [String(t('landing.footer.sections.product'))]: [
      { name: String(t('landing.footer.product.features')), href: '#features' },
      { name: String(t('landing.footer.product.pricing')), href: '#pricing' },
      { name: String(t('landing.footer.product.howItWorks')), href: '#how-it-works' },
      { name: String(t('landing.footer.product.apiDocs')), href: '/docs' },
      { name: String(t('landing.footer.product.changelog')), href: '/changelog' },
    ],
    [String(t('landing.footer.sections.company'))]: [
      { name: String(t('landing.footer.company.about')), href: '/about' },
      { name: String(t('landing.footer.company.blog')), href: '/blog' },
      { name: String(t('landing.footer.company.careers')), href: '/careers' },
      { name: String(t('landing.footer.company.contact')), href: '/contact' },
      { name: String(t('landing.footer.company.pressKit')), href: '/press' },
    ],
    [String(t('landing.footer.sections.resources'))]: [
      { name: String(t('landing.footer.resources.documentation')), href: '/docs' },
      { name: String(t('landing.footer.resources.tutorials')), href: '/tutorials' },
      { name: String(t('landing.footer.resources.community')), href: '/community' },
      { name: String(t('landing.footer.resources.support')), href: '/support' },
      { name: String(t('landing.footer.resources.status')), href: '/status' },
    ],
    [String(t('landing.footer.sections.legal'))]: [
      { name: String(t('landing.footer.legal.privacy')), href: '/privacy' },
      { name: String(t('landing.footer.legal.terms')), href: '/terms' },
      { name: String(t('landing.footer.legal.cookies')), href: '/cookies' },
      { name: String(t('landing.footer.legal.gdpr')), href: '/gdpr' },
      { name: String(t('landing.footer.legal.security')), href: '/security' },
    ],
  };

  return (
    <footer className="bg-[var(--landing-deep-blue)] border-t border-[var(--landing-border)]">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Logo & Description */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="AIDORag"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <span className="text-xl font-bold text-white">AIDORag</span>
            </Link>
            <p className="text-sm text-[var(--landing-text-secondary)] mb-6 max-w-xs">
              {String(t('landing.footer.description'))}
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-[var(--landing-bg-card)] border border-[var(--landing-border)] flex items-center justify-center text-[var(--landing-text-muted)] hover:text-[var(--landing-cyan)] hover:border-[var(--landing-cyan)]/30 transition-all"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-white mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-[var(--landing-text-muted)] hover:text-[var(--landing-cyan)] transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[var(--landing-border)] to-transparent mb-8" />

        {/* Bottom Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--landing-text-muted)]">
            © {new Date().getFullYear()} AIDORag. {String(t('landing.footer.allRightsReserved'))}
          </p>
          <div className="flex items-center gap-6 text-sm text-[var(--landing-text-muted)]">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--landing-success)] animate-pulse" />
              {String(t('landing.footer.systemsOperational'))}
            </span>
            <span>v2.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
