'use client';

import { Activity, CheckCircle2, Clock, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleBackground } from '@/components/landing';
import { useTranslation } from '@/i18n';

const SERVICE_KEYS = ['webApp', 'api', 'docProcessing', 'knowledgeGraph', 'database', 'storage'] as const;
const INCIDENT_KEYS = ['apiLatency', 'docDelays'] as const;

export default function StatusPage() {
  const { t } = useTranslation();

  return (
    <div className="relative">
      <ParticleBackground />

      <div className="relative z-10 pt-32 pb-24">
        <div className="container mx-auto px-4">
          {/* Hero */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
              <Activity className="h-3 w-3" />
              {String(t('pages.status.badge'))}
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 text-white">
              {String(t('pages.status.title'))}
            </h1>

            {/* Overall Status */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">{String(t('pages.status.allOperational'))}</span>
            </div>
          </div>

          {/* Services Status */}
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-xl font-bold mb-6 text-white">{String(t('pages.status.services'))}</h2>
            <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 overflow-hidden">
              <div className="divide-y divide-[var(--landing-border)]">
                {SERVICE_KEYS.map((serviceKey) => (
                  <div key={serviceKey} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="font-medium text-white">{String(t(`pages.status.serviceList.${serviceKey}.name`))}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-[var(--landing-text-muted)]">
                        {String(t(`pages.status.serviceList.${serviceKey}.uptime`))} {String(t('pages.status.uptime'))}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                        {String(t('pages.status.operational'))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Uptime Chart */}
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-xl font-bold mb-6 text-white">{String(t('pages.status.uptimeChart.title'))}</h2>
            <div className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-6">
              <div className="flex items-end gap-1 h-16">
                {Array.from({ length: 90 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-green-500 rounded-t"
                    style={{ height: `${Math.random() * 20 + 80}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-4 text-sm text-[var(--landing-text-muted)]">
                <span>{String(t('pages.status.uptimeChart.daysAgo'))}</span>
                <span>{String(t('pages.status.uptimeChart.today'))}</span>
              </div>
            </div>
          </div>

          {/* Past Incidents */}
          <div className="max-w-3xl mx-auto mb-16">
            <h2 className="text-xl font-bold mb-6 text-white">{String(t('pages.status.incidents.title'))}</h2>
            <div className="space-y-4">
              {INCIDENT_KEYS.map((incidentKey) => (
                <div key={incidentKey} className="rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-bg-card)]/50 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-white">{String(t(`pages.status.incidents.items.${incidentKey}.title`))}</h3>
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                      {String(t('pages.status.incidents.resolved'))}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--landing-text-secondary)] mb-2">{String(t(`pages.status.incidents.items.${incidentKey}.description`))}</p>
                  <div className="flex items-center gap-2 text-xs text-[var(--landing-text-muted)]">
                    <Clock className="h-3 w-3" />
                    {String(t(`pages.status.incidents.items.${incidentKey}.date`))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subscribe */}
          <div className="max-w-xl mx-auto text-center">
            <div className="rounded-2xl border-2 border-[var(--landing-primary)] bg-gradient-to-br from-[var(--landing-primary)]/20 to-[var(--landing-purple)]/20 p-8">
              <Bell className="h-10 w-10 text-[var(--landing-cyan)] mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4 text-white">{String(t('pages.status.subscribe.title'))}</h2>
              <p className="text-[var(--landing-text-secondary)] mb-6">
                {String(t('pages.status.subscribe.subtitle'))}
              </p>
              <div className="flex gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder={String(t('pages.status.subscribe.placeholder'))}
                  className="flex-1 h-10 px-4 rounded-lg border border-[var(--landing-border)] bg-[var(--landing-bg-card)] text-white placeholder:text-[var(--landing-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--landing-primary)]"
                />
                <Button className="bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] hover:opacity-90 text-white">
                  {String(t('common.subscribe'))}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
