'use client';

import Link from 'next/link';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';
import { Logo } from '@/components';
import { useTranslation } from '@/i18n';

const FOOTER_LINKS = {
  product: [
    { labelKey: 'footer.product.features', href: '/#features' },
    { labelKey: 'footer.product.pricing', href: '/pricing' },
    { labelKey: 'footer.product.apiDocs', href: '/admin/api-docs' },
    { labelKey: 'footer.product.dashboard', href: '/dashboard' },
  ],
  company: [
    { labelKey: 'footer.company.about', href: '/about' },
    { labelKey: 'footer.company.blog', href: '/blog' },
    { labelKey: 'footer.company.careers', href: '/careers' },
    { labelKey: 'footer.company.contact', href: '/contact' },
  ],
  resources: [
    { labelKey: 'footer.resources.documentation', href: '/docs' },
    { labelKey: 'footer.resources.helpCenter', href: '/help' },
    { labelKey: 'footer.resources.community', href: '/community' },
    { labelKey: 'footer.resources.status', href: '/status' },
  ],
  legal: [
    { labelKey: 'footer.legal.privacy', href: '/privacy' },
    { labelKey: 'footer.legal.terms', href: '/terms' },
    { labelKey: 'footer.legal.cookies', href: '/cookies' },
  ],
};

const SOCIAL_LINKS = [
  { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  { icon: Github, href: 'https://github.com', label: 'GitHub' },
  { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:hello@aidorag.io', label: 'Email' },
];

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
          {/* Logo & Description */}
          <div className="col-span-2">
            <Link href="/" className="inline-block mb-4">
              <Logo size="sm" />
            </Link>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              {String(t('footer.description'))}
            </p>
            <div className="flex gap-4">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold mb-4">{String(t('footer.sections.product'))}</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {String(t(link.labelKey))}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold mb-4">{String(t('footer.sections.company'))}</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {String(t(link.labelKey))}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold mb-4">{String(t('footer.sections.resources'))}</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {String(t(link.labelKey))}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold mb-4">{String(t('footer.sections.legal'))}</h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {String(t(link.labelKey))}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {String(t('footer.copyright', { year: new Date().getFullYear().toString() }))}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{String(t('footer.tagline'))}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
