'use client';

import {
  Layers,
  Network,
  FileStack,
  Quote,
  Shield,
  Code,
  Zap,
  Brain,
} from 'lucide-react';
import { useTranslation } from '@/i18n';

const QUERY_MODES = [
  { name: 'Naive', active: false },
  { name: 'Local', active: false },
  { name: 'Global', active: false },
  { name: 'Hybrid', active: false },
  { name: 'Mix', active: true, recommended: true },
];

const SMALL_FEATURES = [
  {
    icon: FileStack,
    title: 'Multi-Modal Support',
    description: 'PDF, DOCX, PPTX, images, audio, video - all in one unified platform.',
  },
  {
    icon: Quote,
    title: 'Accurate Citations',
    description: 'Every answer includes source references with exact page numbers.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'SOC2 compliant, encryption at rest and in transit.',
  },
  {
    icon: Code,
    title: 'Full API Access',
    description: 'REST API for seamless integration.',
  },
  {
    icon: Zap,
    title: 'Real-time Processing',
    description: 'Lightning fast document analysis and instant responses.',
  },
  {
    icon: Brain,
    title: 'Context-Aware AI',
    description: 'Understands context across multiple documents for comprehensive answers.',
  },
];

export function LandingFeatures() {
  const { t } = useTranslation();

  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 rounded-full bg-[var(--landing-primary)]/20 text-[var(--landing-primary)] text-sm font-medium mb-6">
            Features
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Everything You Need for
            <br />
            <span className="text-[var(--landing-cyan)]">Document Intelligence</span>
          </h2>
          <p className="text-[var(--landing-text-secondary)] text-lg max-w-2xl mx-auto">
            Powerful features designed to transform how you interact with your documents
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Large Card - 5 Query Modes */}
          <div className="lg:col-span-2 lg:row-span-2 p-8 rounded-2xl bg-[var(--landing-bg-card)]/50 border border-[var(--landing-border)] hover:border-[var(--landing-cyan)]/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-[var(--landing-cyan)]/20 flex items-center justify-center mb-6">
              <Layers className="w-6 h-6 text-[var(--landing-cyan)]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">5 Query Modes</h3>
            <p className="text-[var(--landing-text-secondary)] mb-6">
              From simple search to complex reasoning. Naive, Local, Global, Hybrid, Mix modes for every use case.
            </p>

            {/* Query Modes List */}
            <div className="space-y-2">
              {QUERY_MODES.map((mode) => (
                <div
                  key={mode.name}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    mode.active
                      ? 'bg-gradient-to-r from-[var(--landing-primary)] to-[var(--landing-purple)] text-white'
                      : 'bg-[var(--landing-bg-primary)]/50 text-[var(--landing-text-secondary)] hover:bg-[var(--landing-bg-primary)]/80'
                  }`}
                >
                  <span className="font-medium">{mode.name}</span>
                  {mode.recommended && (
                    <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Recommended</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Large Card - Knowledge Graph */}
          <div className="lg:col-span-2 lg:row-span-2 p-8 rounded-2xl bg-[var(--landing-bg-card)]/50 border border-[var(--landing-border)] hover:border-[var(--landing-purple)]/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-[var(--landing-purple)]/20 flex items-center justify-center mb-6">
              <Network className="w-6 h-6 text-[var(--landing-purple)]" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Knowledge Graph</h3>
            <p className="text-[var(--landing-text-secondary)] mb-6">
              Automatically extracts entities and relationships for deeper understanding of your documents.
            </p>

            {/* Graph Visualization */}
            <div className="relative h-48">
              <KnowledgeGraphVisual />
            </div>
          </div>

          {/* Small Feature Cards */}
          {SMALL_FEATURES.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-[var(--landing-bg-card)]/50 border border-[var(--landing-border)] hover:border-[var(--landing-cyan)]/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--landing-cyan)]/10 flex items-center justify-center mb-4 group-hover:bg-[var(--landing-cyan)]/20 transition-colors">
                <feature.icon className="w-5 h-5 text-[var(--landing-cyan)]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-[var(--landing-text-secondary)]">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function KnowledgeGraphVisual() {
  return (
    <svg className="w-full h-full" viewBox="0 0 300 150">
      {/* Connections */}
      <line x1="60" y1="75" x2="150" y2="50" stroke="url(#gradient1)" strokeWidth="2" />
      <line x1="150" y1="50" x2="240" y2="40" stroke="url(#gradient1)" strokeWidth="2" />
      <line x1="150" y1="50" x2="200" y2="110" stroke="url(#gradient2)" strokeWidth="2" />
      <line x1="60" y1="75" x2="120" y2="120" stroke="url(#gradient2)" strokeWidth="2" />
      <line x1="120" y1="120" x2="200" y2="110" stroke="url(#gradient1)" strokeWidth="2" />

      {/* Nodes */}
      <circle cx="60" cy="75" r="12" fill="#00D4FF" className="animate-pulse" />
      <circle cx="150" cy="50" r="14" fill="#0066FF" />
      <circle cx="240" cy="40" r="10" fill="#7B61FF" className="animate-pulse" />
      <circle cx="120" cy="120" r="10" fill="#00CED1" />
      <circle cx="200" cy="110" r="8" fill="#FFB800" className="animate-pulse" />

      {/* Center label */}
      <text x="150" y="85" textAnchor="middle" fill="#8B95A5" fontSize="10">
        Central Entity
      </text>

      {/* Gradients */}
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#0066FF" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0066FF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#7B61FF" stopOpacity="0.5" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default LandingFeatures;
