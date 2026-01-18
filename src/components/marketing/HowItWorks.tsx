'use client';

import { Upload, Cpu, MessageSquare, CheckCircle, LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/i18n';

const STEP_ICONS: LucideIcon[] = [Upload, Cpu, MessageSquare, CheckCircle];
const STEP_COLORS = ['bg-blue-500', 'bg-violet-500', 'bg-purple-500', 'bg-green-500'];

export function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section id="how-it-works" className="py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">{String(t('howItWorks.badge'))}</Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            {String(t('howItWorks.title'))}
          </h2>
          <p className="text-lg text-muted-foreground">
            {String(t('howItWorks.subtitle'))}
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line - desktop (positioned behind icons) */}
          <div className="absolute top-8 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-violet-500 to-green-500 hidden lg:block mx-[12.5%] z-0" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[0, 1, 2, 3].map((index) => {
              const Icon = STEP_ICONS[index];
              return (
                <div
                  key={index}
                  className="relative text-center animate-fade-in z-10"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  {/* Step number with icon */}
                  <div className="relative mx-auto mb-6">
                    <div className={`w-16 h-16 rounded-2xl ${STEP_COLORS[index]} flex items-center justify-center shadow-lg mx-auto relative z-10`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-card border-2 border-border flex items-center justify-center text-sm font-bold z-20">
                      {index + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold mb-2 relative z-10">
                    {String(t(`howItWorks.steps.${index}.title`))}
                  </h3>
                  <p className="text-muted-foreground relative z-10">
                    {String(t(`howItWorks.steps.${index}.description`))}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* File types supported */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground mb-4">{String(t('howItWorks.supportedTypes'))}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['PDF', 'DOCX', 'PPTX', 'XLSX', 'TXT', 'MD', 'MP4', 'MP3', 'JPG', 'PNG'].map((type) => (
              <span
                key={type}
                className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full border"
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
