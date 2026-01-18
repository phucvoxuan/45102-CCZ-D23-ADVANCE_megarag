'use client';

import {
  Layers,
  Network,
  FileText,
  Quote,
  Shield,
  Users,
  LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';

const FEATURE_ICONS: Record<string, LucideIcon> = {
  queryModes: Layers,
  knowledgeGraph: Network,
  multiFormat: FileText,
  citations: Quote,
  security: Shield,
  collaboration: Users,
};

const FEATURE_KEYS = [
  'queryModes',
  'knowledgeGraph',
  'multiFormat',
  'citations',
  'security',
  'collaboration',
];

export function Features() {
  const { t } = useTranslation();

  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">{String(t('features.badge'))}</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            {String(t('features.title'))}
          </h2>
          <p className="text-lg text-muted-foreground">
            {String(t('features.subtitle'))}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURE_KEYS.map((key, index) => {
            const Icon = FEATURE_ICONS[key];
            return (
              <Card
                key={key}
                className="hover-lift border-border/50 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {String(t(`features.items.${key}.badge`))}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{String(t(`features.items.${key}.title`))}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {String(t(`features.items.${key}.description`))}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
