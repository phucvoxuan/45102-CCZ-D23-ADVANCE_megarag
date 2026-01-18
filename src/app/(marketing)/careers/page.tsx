'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Briefcase, MapPin, Clock, Heart, Coffee, Laptop, ArrowRight, Loader2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

interface Department {
  id: string;
  slug: string;
  name_en: string;
  name_vi: string;
}

interface JobListing {
  id: string;
  slug: string;
  title_en: string;
  title_vi: string;
  location_en: string | null;
  location_vi: string | null;
  employment_type: string;
  experience_level: string;
  salary_range_min: number | null;
  salary_range_max: number | null;
  salary_currency: string;
  is_remote: boolean;
  department?: Department;
}

const PERK_ICONS = [Laptop, Heart, Coffee, Briefcase];
const PERK_KEYS = ['remote', 'health', 'flexible', 'equity'] as const;

const EMPLOYMENT_TYPE_LABELS: Record<string, { en: string; vi: string }> = {
  'full-time': { en: 'Full-time', vi: 'Toàn thời gian' },
  'part-time': { en: 'Part-time', vi: 'Bán thời gian' },
  'contract': { en: 'Contract', vi: 'Hợp đồng' },
  'internship': { en: 'Internship', vi: 'Thực tập' },
};

export default function CareersPage() {
  const { t, locale } = useTranslation();
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch('/api/careers');
        if (res.ok) {
          const data = await res.json();
          setJobs(data.jobs || []);
          setDepartments(data.departments || []);
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const getLocalizedText = (en: string, vi: string) => locale === 'vi' ? vi : en;

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
              <Briefcase className="h-3 w-3" />
              {String(t('pages.careers.badge'))}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              {String(t('pages.careers.titlePrefix'))} <span className="text-[var(--landing-cyan)]">{String(t('pages.careers.title'))}</span>
            </h1>
            <p className="text-xl text-[var(--landing-text-secondary)] max-w-2xl mx-auto">
              {String(t('pages.careers.subtitle'))}
            </p>
          </div>

          {/* Culture */}
          <div className="max-w-4xl mx-auto mb-20">
            <div className="rounded-2xl border-2 border-[var(--landing-primary)] bg-gradient-to-br from-[var(--landing-primary)]/20 to-[var(--landing-purple)]/20 p-8 text-center">
              <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.careers.culture.title'))}</h2>
              <p className="text-[var(--landing-text-secondary)] max-w-2xl mx-auto">
                {String(t('pages.careers.culture.description'))}
              </p>
            </div>
          </div>

          {/* Perks */}
          <div className="max-w-4xl mx-auto mb-20">
            <h2 className="text-2xl font-bold mb-8 text-center text-white">{String(t('pages.careers.perks.title'))}</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
              {PERK_KEYS.map((perkKey, index) => {
                const Icon = PERK_ICONS[index];
                return (
                  <div key={perkKey} className="p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 text-center hover:border-[var(--landing-cyan)]/30 transition-all">
                    <div className="w-12 h-12 rounded-lg bg-[var(--landing-primary)]/20 flex items-center justify-center mb-4 mx-auto">
                      <Icon className="h-6 w-6 text-[var(--landing-cyan)]" />
                    </div>
                    <h3 className="font-semibold mb-1 text-white">{String(t(`pages.careers.perks.items.${perkKey}`))}</h3>
                    <p className="text-sm text-[var(--landing-text-muted)]">{String(t(`pages.careers.perks.items.${perkKey}Desc`))}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Open Positions */}
          <div className="max-w-3xl mx-auto mb-20">
            <h2 className="text-2xl font-bold mb-8 text-center text-white">{String(t('pages.careers.openings.title'))}</h2>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--landing-cyan)]" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-16 w-16 mx-auto mb-4 text-[var(--landing-text-muted)]" />
                <p className="text-[var(--landing-text-secondary)]">
                  {locale === 'vi' ? 'Hiện tại chưa có vị trí tuyển dụng. Hãy quay lại sau!' : 'No open positions at the moment. Check back soon!'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Link key={job.id} href={`/careers/${job.slug}`} className="block group">
                    <div className="flex items-center justify-between p-6 rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 hover:border-[var(--landing-cyan)]/30 transition-all">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {job.department && (
                            <span className="px-3 py-1 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-xs">
                              {getLocalizedText(job.department.name_en, job.department.name_vi)}
                            </span>
                          )}
                          {job.is_remote && (
                            <span className="px-3 py-1 rounded-full bg-[var(--landing-cyan)]/20 text-[var(--landing-cyan)] text-xs flex items-center gap-1">
                              <Home className="h-3 w-3" />
                              Remote
                            </span>
                          )}
                        </div>
                        <h3 className="font-semibold text-white group-hover:text-[var(--landing-cyan)] transition-colors">
                          {getLocalizedText(job.title_en, job.title_vi)}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-[var(--landing-text-muted)]">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {getLocalizedText(job.location_en || '', job.location_vi || '') || 'Remote'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getLocalizedText(
                              EMPLOYMENT_TYPE_LABELS[job.employment_type]?.en || job.employment_type,
                              EMPLOYMENT_TYPE_LABELS[job.employment_type]?.vi || job.employment_type
                            )}
                          </span>
                          {(job.salary_range_min || job.salary_range_max) && (
                            <span className="text-[var(--landing-cyan)]">
                              {job.salary_currency || '$'}{job.salary_range_min?.toLocaleString() || '?'} - {job.salary_currency || '$'}{job.salary_range_max?.toLocaleString() || '?'}
                            </span>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-[var(--landing-text-muted)] group-hover:text-[var(--landing-cyan)] transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* No Fit */}
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.careers.noFit.title'))}</h2>
            <p className="text-[var(--landing-text-secondary)] mb-6">
              {String(t('pages.careers.noFit.subtitle'))}
            </p>
            <Button
              className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
              asChild
            >
              <Link href="/contact">{String(t('pages.careers.noFit.cta'))}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
