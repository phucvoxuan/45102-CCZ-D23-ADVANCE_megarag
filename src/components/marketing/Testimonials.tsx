'use client';

import { Quote } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/i18n';

const TESTIMONIALS = [
  { initials: 'SC', author: 'Sarah Chen', role: 'Product Manager', company: 'TechCorp' },
  { initials: 'MP', author: 'Michael Park', role: 'Research Lead', company: 'DataLabs' },
  { initials: 'ER', author: 'Emily Rodriguez', role: 'Legal Counsel', company: 'LawFirm LLP' },
];

export function Testimonials() {
  const { t } = useTranslation();

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">{String(t('testimonials.badge'))}</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            {String(t('testimonials.title'))}
          </h2>
          <p className="text-lg text-muted-foreground">
            {String(t('testimonials.subtitle'))}
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {TESTIMONIALS.map((testimonial, index) => (
            <Card
              key={testimonial.author}
              className="hover-lift animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="pt-6">
                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                <p className="text-muted-foreground mb-6 italic">
                  &quot;{String(t(`testimonials.items.${index}.quote`))}&quot;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {testimonial.initials}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <p className="text-4xl font-bold gradient-text">{String(t('testimonials.stats.documents.value'))}</p>
            <p className="text-muted-foreground">{String(t('testimonials.stats.documents.label'))}</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold gradient-text">{String(t('testimonials.stats.users.value'))}</p>
            <p className="text-muted-foreground">{String(t('testimonials.stats.users.label'))}</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold gradient-text">{String(t('testimonials.stats.uptime.value'))}</p>
            <p className="text-muted-foreground">{String(t('testimonials.stats.uptime.label'))}</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold gradient-text">{String(t('testimonials.stats.rating.value'))}</p>
            <p className="text-muted-foreground">{String(t('testimonials.stats.rating.label'))}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
