'use client';

import Link from 'next/link';
import { HelpCircle, BookOpen, MessageCircle, Mail, Search, ExternalLink, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';

const QUICK_LINK_ICONS = [BookOpen, MessageCircle, Mail];
const QUICK_LINK_KEYS = ['docs', 'community', 'contact'] as const;
const QUICK_LINK_HREFS = ['/docs', '/community', '/contact'];

const POPULAR_TOPIC_KEYS = ['upload', 'queryModes', 'knowledgeGraph', 'apiAuth', 'billing', 'security'] as const;

export default function HelpPage() {
  const { t } = useTranslation();

  return (
    <div className="py-20">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            <HelpCircle className="h-3 w-3 mr-1" />
            {String(t('pages.help.badge'))}
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            {String(t('pages.help.titlePrefix'))} <span className="gradient-text">{String(t('pages.help.title'))}</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {String(t('pages.help.subtitle'))}
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder={String(t('pages.help.searchPlaceholder'))}
                className="w-full h-12 pl-12 pr-4 rounded-lg border bg-card focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="grid md:grid-cols-3 gap-6">
            {QUICK_LINK_KEYS.map((linkKey, index) => {
              const Icon = QUICK_LINK_ICONS[index];
              return (
                <Link
                  key={linkKey}
                  href={QUICK_LINK_HREFS[index]}
                  className="p-6 rounded-xl border bg-card text-center hover:shadow-lg hover:border-primary/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 mx-auto group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                    {String(t(`pages.help.quickLinks.${linkKey}.title`))}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {String(t(`pages.help.quickLinks.${linkKey}.description`))}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Popular Topics */}
        <div className="max-w-3xl mx-auto mb-20">
          <h2 className="text-2xl font-bold mb-6 text-center">{String(t('pages.help.popularTopics.title'))}</h2>
          <div className="space-y-3">
            {POPULAR_TOPIC_KEYS.map((topicKey) => (
              <Link
                key={topicKey}
                href="/docs"
                className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-md hover:border-primary/50 transition-all group"
              >
                <span className="font-medium group-hover:text-primary transition-colors">
                  {String(t(`pages.help.popularTopics.items.${topicKey}`))}
                </span>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-2xl font-bold mb-6 text-center">{String(t('pages.help.resources.title'))}</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <Link
              href="/docs/quickstart"
              className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow"
            >
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                {String(t('pages.help.resources.quickstart.title'))}
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </h3>
              <p className="text-sm text-muted-foreground">
                {String(t('pages.help.resources.quickstart.description'))}
              </p>
            </Link>
            <Link
              href="/tutorials"
              className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow"
            >
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                {String(t('pages.help.resources.tutorials.title'))}
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </h3>
              <p className="text-sm text-muted-foreground">
                {String(t('pages.help.resources.tutorials.description'))}
              </p>
            </Link>
            <Link
              href="/docs/api"
              className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow"
            >
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                {String(t('pages.help.resources.apiRef.title'))}
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </h3>
              <p className="text-sm text-muted-foreground">
                {String(t('pages.help.resources.apiRef.description'))}
              </p>
            </Link>
            <Link
              href="/status"
              className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow"
            >
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                {String(t('pages.help.resources.status.title'))}
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </h3>
              <p className="text-sm text-muted-foreground">
                {String(t('pages.help.resources.status.description'))}
              </p>
            </Link>
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">{String(t('pages.help.cta.title'))}</h2>
          <p className="text-muted-foreground mb-6">
            {String(t('pages.help.cta.subtitle'))}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/support">{String(t('common.contactSupport'))}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/community">{String(t('common.joinCommunity'))}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
