'use client';

import { useTranslation } from '@/i18n';

const LOGOS = [
  { name: 'TechCorp', abbr: 'TC' },
  { name: 'InnovateLab', abbr: 'IL' },
  { name: 'DataFlow', abbr: 'DF' },
  { name: 'CloudSync', abbr: 'CS' },
  { name: 'AI Systems', abbr: 'AI' },
  { name: 'NextGen', abbr: 'NG' },
  { name: 'FutureTech', abbr: 'FT' },
  { name: 'SmartData', abbr: 'SD' },
];

const STATS = [
  { value: '10K+', label: 'Active Users', color: 'text-[var(--landing-cyan)]' },
  { value: '1M+', label: 'Documents Processed', color: 'text-[var(--landing-primary)]' },
  { value: '50M+', label: 'Queries Answered', color: 'text-[var(--landing-purple)]' },
  { value: '99.9%', label: 'Uptime', color: 'text-green-400' },
];

export function LogoCloud() {
  const { t } = useTranslation();

  return (
    <section className="py-20 border-y border-[var(--landing-border)]/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <p className="text-center text-sm text-[var(--landing-text-muted)] tracking-widest uppercase mb-12">
          Trusted by innovative teams worldwide
        </p>

        {/* Scrolling Logos */}
        <div className="relative overflow-hidden mb-16">
          {/* Left fade gradient */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[var(--landing-bg-primary)] to-transparent z-10 pointer-events-none" />
          {/* Right fade gradient */}
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[var(--landing-bg-primary)] to-transparent z-10 pointer-events-none" />

          <div className="flex animate-scroll hover:[animation-play-state:paused]">
            {[...LOGOS, ...LOGOS].map((logo, index) => (
              <div
                key={index}
                className="flex items-center gap-3 mx-4 flex-shrink-0 px-6 py-3 rounded-xl border border-[var(--landing-border)]/50 bg-[var(--landing-bg-card)]/30 hover:border-[var(--landing-cyan)]/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--landing-primary)]/20 flex items-center justify-center text-[var(--landing-primary)] font-bold text-sm">
                  {logo.abbr}
                </div>
                <span className="text-[var(--landing-text-secondary)] font-medium whitespace-nowrap">
                  {logo.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`text-4xl md:text-5xl font-bold ${stat.color} mb-2`}>
                {stat.value}
              </div>
              <div className="text-[var(--landing-text-muted)] text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default LogoCloud;
