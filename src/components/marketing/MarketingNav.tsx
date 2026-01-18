'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Zap, Network, Code, Plug, BookOpen, FileCode, Rocket, History, Users, Scale, HeadphonesIcon, Building2, Newspaper, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/auth';
import { cn } from '@/lib/utils';
import { NavDropdown, MobileNavDropdown } from './NavDropdown';
import { LanguageSwitcher, LanguageSwitcherCompact } from './LanguageSwitcher';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/contexts/AuthContext';

export function MarketingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const productItems = [
    {
      label: String(t('nav.product_items.ragEngine.title')),
      description: String(t('nav.product_items.ragEngine.desc')),
      href: '/product/rag-engine',
      icon: Zap,
    },
    {
      label: String(t('nav.product_items.knowledgeGraph.title')),
      description: String(t('nav.product_items.knowledgeGraph.desc')),
      href: '/product/knowledge-graph',
      icon: Network,
    },
    {
      label: String(t('nav.product_items.api.title')),
      description: String(t('nav.product_items.api.desc')),
      href: '/product/api',
      icon: Code,
    },
    {
      label: String(t('nav.product_items.integrations.title')),
      description: String(t('nav.product_items.integrations.desc')),
      href: '/product/integrations',
      icon: Plug,
    },
  ];

  const developersItems = [
    {
      label: String(t('nav.developers_items.apiDocs.title')),
      description: String(t('nav.developers_items.apiDocs.desc')),
      href: '/docs',
      icon: BookOpen,
    },
    {
      label: String(t('nav.developers_items.quickstart.title')),
      description: String(t('nav.developers_items.quickstart.desc')),
      href: '/docs/quickstart',
      icon: Rocket,
    },
    {
      label: String(t('nav.developers_items.sdks.title')),
      description: String(t('nav.developers_items.sdks.desc')),
      href: '/docs/sdks',
      icon: FileCode,
    },
    {
      label: String(t('nav.developers_items.community.title')),
      description: String(t('nav.developers_items.community.desc')),
      href: '/community',
      icon: History,
    },
  ];

  const useCasesItems = [
    {
      label: String(t('nav.useCases_items.research.title')),
      description: String(t('nav.useCases_items.research.desc')),
      href: '/use-cases/research',
      icon: Users,
    },
    {
      label: String(t('nav.useCases_items.legal.title')),
      description: String(t('nav.useCases_items.legal.desc')),
      href: '/use-cases/legal',
      icon: Scale,
    },
    {
      label: String(t('nav.useCases_items.support.title')),
      description: String(t('nav.useCases_items.support.desc')),
      href: '/use-cases/support',
      icon: HeadphonesIcon,
    },
    {
      label: String(t('nav.useCases_items.enterprise.title')),
      description: String(t('nav.useCases_items.enterprise.desc')),
      href: '/use-cases/enterprise',
      icon: Building2,
    },
  ];

  const resourcesItems = [
    {
      label: String(t('nav.resources_items.docs.title')),
      description: String(t('nav.resources_items.docs.desc')),
      href: '/docs',
      icon: BookOpen,
    },
    {
      label: String(t('nav.resources_items.tutorials.title')),
      description: String(t('nav.resources_items.tutorials.desc')),
      href: '/tutorials',
      icon: GraduationCap,
    },
    {
      label: String(t('nav.resources_items.blog.title')),
      description: String(t('nav.resources_items.blog.desc')),
      href: '/blog',
      icon: Newspaper,
    },
    {
      label: String(t('nav.resources_items.changelog.title')),
      description: String(t('nav.resources_items.changelog.desc')),
      href: '/changelog',
      icon: History,
    },
  ];

  return (
    <header
      className={cn(
        'fixed top-[42px] left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-[var(--landing-bg-primary)]/80 backdrop-blur-xl border-b border-white/10 shadow-lg'
          : 'bg-transparent'
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/logo.png"
              alt="AIDORag"
              width={40}
              height={40}
              className="transition-transform group-hover:scale-110"
            />
            <span className="font-bold text-xl text-white">
              AIDO<span className="text-[var(--landing-cyan)]">Rag</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <NavDropdown label={String(t('nav.product'))} items={productItems} />
            <NavDropdown label={String(t('nav.developers'))} items={developersItems} />
            <NavDropdown label={String(t('nav.useCases'))} items={useCasesItems} />
            <NavDropdown label={String(t('nav.resources'))} items={resourcesItems} />
            <Link
              href="/pricing"
              className="px-3 py-2 text-sm font-medium text-[var(--landing-text-secondary)] hover:text-white transition-colors"
            >
              {String(t('nav.pricing'))}
            </Link>
          </nav>

          {/* Desktop Right Side */}
          <div className="hidden lg:flex items-center gap-4">
            <LanguageSwitcher />
            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
            ) : user ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white"
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <UserNav />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-2 text-sm font-medium text-[var(--landing-text-secondary)] hover:text-white transition-colors"
                >
                  {String(t('nav.signIn'))}
                </Link>
                <Button
                  asChild
                  className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white shadow-lg hover:shadow-[var(--landing-glow-blue)] transition-all duration-300 hover:-translate-y-0.5"
                >
                  <Link href="/signup">{String(t('nav.startFree'))}</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white hover:bg-white/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          'lg:hidden overflow-hidden transition-all duration-300',
          mobileMenuOpen
            ? 'max-h-[calc(100vh-4rem)] bg-[var(--landing-bg-primary)]/95 backdrop-blur-xl border-t border-white/10'
            : 'max-h-0'
        )}
      >
        <div className="container mx-auto px-4 py-4 space-y-2">
          <MobileNavDropdown
            label={String(t('nav.product'))}
            items={productItems}
            onItemClick={() => setMobileMenuOpen(false)}
          />
          <MobileNavDropdown
            label={String(t('nav.developers'))}
            items={developersItems}
            onItemClick={() => setMobileMenuOpen(false)}
          />
          <MobileNavDropdown
            label={String(t('nav.useCases'))}
            items={useCasesItems}
            onItemClick={() => setMobileMenuOpen(false)}
          />
          <MobileNavDropdown
            label={String(t('nav.resources'))}
            items={resourcesItems}
            onItemClick={() => setMobileMenuOpen(false)}
          />
          <Link
            href="/pricing"
            className="block py-2 text-sm font-medium text-[var(--landing-text-secondary)] hover:text-white transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            {String(t('nav.pricing'))}
          </Link>

          <div className="pt-4 border-t border-white/10 space-y-3">
            <LanguageSwitcherCompact />
            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse mx-auto" />
            ) : user ? (
              <div className="flex flex-col gap-2">
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)]"
                >
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                </Button>
                <div className="flex justify-center">
                  <UserNav />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  asChild
                  className="w-full bg-transparent border-white/20 text-white hover:bg-white/10"
                >
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    {String(t('nav.signIn'))}
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)]"
                >
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    {String(t('nav.startFree'))}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
