'use client';

import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from '@/i18n';

export function FAQ() {
  const { t } = useTranslation();

  return (
    <section id="faq" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">{String(t('faq.badge'))}</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              {String(t('faq.title'))}
            </h2>
            <p className="text-lg text-muted-foreground">
              {String(t('faq.subtitle'))}
            </p>
          </div>

          {/* FAQ Accordion */}
          <Accordion type="single" collapsible className="space-y-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => {
              const question = String(t(`faq.items.${index}.question`));
              const answer = String(t(`faq.items.${index}.answer`));

              // Skip if translation key not found
              if (question.includes('faq.items')) return null;

              return (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="bg-card border rounded-lg px-6 data-[state=open]:shadow-md transition-shadow"
                >
                  <AccordionTrigger className="text-left hover:no-underline py-4">
                    <span className="font-medium">{question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {answer}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {/* Contact CTA */}
          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              {String(t('faq.stillHaveQuestions'))}{' '}
              <a href="mailto:support@aidorag.io" className="text-primary hover:underline">
                {String(t('faq.contactSupport'))}
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
