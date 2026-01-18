'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Briefcase, MapPin, Clock, ArrowLeft, Send, Loader2, Home, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  description_en: string;
  description_vi: string;
  requirements_en?: string;
  requirements_vi?: string;
  responsibilities_en?: string;
  responsibilities_vi?: string;
  benefits_en?: string;
  benefits_vi?: string;
  location_en?: string;
  location_vi?: string;
  employment_type: string;
  experience_level: string;
  salary_range_min?: number;
  salary_range_max?: number;
  salary_currency: string;
  is_remote: boolean;
  updated_at: string;
  department?: Department;
}

const EMPLOYMENT_TYPE_LABELS: Record<string, { en: string; vi: string }> = {
  'full-time': { en: 'Full-time', vi: 'Toàn thời gian' },
  'part-time': { en: 'Part-time', vi: 'Bán thời gian' },
  'contract': { en: 'Contract', vi: 'Hợp đồng' },
  'internship': { en: 'Internship', vi: 'Thực tập' },
};

const EXPERIENCE_LABELS: Record<string, { en: string; vi: string }> = {
  'entry': { en: 'Entry Level', vi: 'Mới vào nghề' },
  'mid': { en: 'Mid Level', vi: 'Trung cấp' },
  'senior': { en: 'Senior', vi: 'Cao cấp' },
  'lead': { en: 'Lead', vi: 'Trưởng nhóm' },
  'executive': { en: 'Executive', vi: 'Điều hành' },
};

export default function JobDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { locale } = useTranslation();
  const [job, setJob] = useState<JobListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/careers/${slug}`);
        if (!res.ok) throw new Error('Job not found');
        const data = await res.json();
        setJob(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load job');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [slug]);

  const getLocalizedText = (en?: string, vi?: string) => locale === 'vi' ? (vi || en) : (en || vi);

  if (loading) {
    return (
      <div className="relative">
        <ParticleBackground />
        <div className="relative z-10 pt-32 pb-24">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--landing-cyan)]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="relative">
        <ParticleBackground />
        <div className="relative z-10 pt-32 pb-24">
          <div className="container mx-auto px-4">
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold text-white mb-4">
                {locale === 'vi' ? 'Không tìm thấy vị trí' : 'Job Not Found'}
              </h1>
              <p className="text-[var(--landing-text-secondary)] mb-6">
                {locale === 'vi'
                  ? 'Vị trí bạn tìm kiếm không tồn tại hoặc đã đóng.'
                  : 'The job you are looking for does not exist or has been closed.'}
              </p>
              <Link href="/careers">
                <Button className="bg-[var(--landing-primary)] hover:bg-[var(--landing-primary)]/80">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {locale === 'vi' ? 'Quay lại Tuyển dụng' : 'Back to Careers'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const title = getLocalizedText(job.title_en, job.title_vi);
  const description = getLocalizedText(job.description_en, job.description_vi);
  const requirements = getLocalizedText(job.requirements_en, job.requirements_vi);
  const responsibilities = getLocalizedText(job.responsibilities_en, job.responsibilities_vi);
  const benefits = getLocalizedText(job.benefits_en, job.benefits_vi);
  const location = getLocalizedText(job.location_en, job.location_vi);
  const deptName = job.department ? getLocalizedText(job.department.name_en, job.department.name_vi) : null;
  const employmentType = getLocalizedText(
    EMPLOYMENT_TYPE_LABELS[job.employment_type]?.en,
    EMPLOYMENT_TYPE_LABELS[job.employment_type]?.vi
  ) || job.employment_type;
  const experienceLevel = getLocalizedText(
    EXPERIENCE_LABELS[job.experience_level]?.en,
    EXPERIENCE_LABELS[job.experience_level]?.vi
  ) || job.experience_level;

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Back Link */}
          <div className="max-w-4xl mx-auto mb-8">
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 text-[var(--landing-text-muted)] hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {locale === 'vi' ? 'Quay lại Tuyển dụng' : 'Back to Careers'}
            </Link>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Job Header */}
            <header className="mb-8">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {deptName && (
                  <span className="px-3 py-1 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm">
                    {deptName}
                  </span>
                )}
                {job.is_remote && (
                  <span className="px-3 py-1 rounded-full bg-[var(--landing-cyan)]/20 text-[var(--landing-cyan)] text-sm flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    Remote
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
                {title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--landing-text-muted)] mb-6">
                {location && (
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {location}
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {employmentType}
                </span>
                <span className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  {experienceLevel}
                </span>
                {(job.salary_range_min || job.salary_range_max) && (
                  <span className="flex items-center gap-2 text-[var(--landing-cyan)]">
                    <DollarSign className="h-4 w-4" />
                    {job.salary_currency}{job.salary_range_min?.toLocaleString()} - {job.salary_currency}{job.salary_range_max?.toLocaleString()}
                  </span>
                )}
              </div>

              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
                asChild
              >
                <Link href="/contact">
                  <Send className="h-4 w-4" />
                  {locale === 'vi' ? 'Ứng tuyển ngay' : 'Apply Now'}
                </Link>
              </Button>
            </header>

            {/* Job Content */}
            <div className="space-y-8">
              {/* Description */}
              {description && (
                <section className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-6 md:p-8">
                  <h2 className="text-xl font-bold text-white mb-4">
                    {locale === 'vi' ? 'Mô tả công việc' : 'Job Description'}
                  </h2>
                  <div className="job-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {description}
                    </ReactMarkdown>
                  </div>
                </section>
              )}

              {/* Requirements */}
              {requirements && (
                <section className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-6 md:p-8">
                  <h2 className="text-xl font-bold text-white mb-4">
                    {locale === 'vi' ? 'Yêu cầu' : 'Requirements'}
                  </h2>
                  <div className="job-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {requirements}
                    </ReactMarkdown>
                  </div>
                </section>
              )}

              {/* Responsibilities */}
              {responsibilities && (
                <section className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-6 md:p-8">
                  <h2 className="text-xl font-bold text-white mb-4">
                    {locale === 'vi' ? 'Trách nhiệm' : 'Responsibilities'}
                  </h2>
                  <div className="job-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {responsibilities}
                    </ReactMarkdown>
                  </div>
                </section>
              )}

              {/* Benefits */}
              {benefits && (
                <section className="rounded-2xl border-2 border-[var(--landing-primary)] bg-gradient-to-br from-[var(--landing-primary)]/20 to-[var(--landing-purple)]/20 p-6 md:p-8">
                  <h2 className="text-xl font-bold text-white mb-4">
                    {locale === 'vi' ? 'Quyền lợi' : 'Benefits'}
                  </h2>
                  <div className="job-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {benefits}
                    </ReactMarkdown>
                  </div>
                </section>
              )}

              {/* Apply CTA */}
              <section className="text-center py-8">
                <h2 className="text-2xl font-bold mb-4 text-white">
                  {locale === 'vi' ? 'Sẵn sàng ứng tuyển?' : 'Ready to Apply?'}
                </h2>
                <p className="text-[var(--landing-text-secondary)] mb-6">
                  {locale === 'vi'
                    ? 'Gửi hồ sơ của bạn và chúng tôi sẽ liên hệ trong vòng 48 giờ.'
                    : 'Send us your application and we will get back to you within 48 hours.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="gap-2 bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white"
                    asChild
                  >
                    <Link href="/contact">
                      <Send className="h-4 w-4" />
                      {locale === 'vi' ? 'Ứng tuyển ngay' : 'Apply Now'}
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-[var(--landing-border)] !bg-transparent !text-white hover:!bg-white/10"
                    asChild
                  >
                    <Link href="/careers">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      {locale === 'vi' ? 'Xem tất cả vị trí' : 'View All Positions'}
                    </Link>
                  </Button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .job-content {
          color: rgba(255, 255, 255, 0.8);
          font-size: 1rem;
          line-height: 1.75;
        }
        .job-content h2, .job-content h3 {
          color: white;
          font-weight: 600;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .job-content h2 { font-size: 1.25rem; }
        .job-content h3 { font-size: 1.1rem; }
        .job-content p {
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 1rem;
        }
        .job-content strong {
          color: white;
          font-weight: 600;
        }
        .job-content a {
          color: var(--landing-cyan, #22d3ee);
          text-decoration: none;
        }
        .job-content a:hover {
          text-decoration: underline;
        }
        .job-content ul, .job-content ol {
          margin: 1rem 0;
          padding-left: 1.5rem;
          color: rgba(255, 255, 255, 0.7);
        }
        .job-content li {
          margin-bottom: 0.5rem;
        }
        .job-content code {
          background: rgba(255, 255, 255, 0.1);
          color: var(--landing-cyan, #22d3ee);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }
      `}</style>
    </div>
  );
}
