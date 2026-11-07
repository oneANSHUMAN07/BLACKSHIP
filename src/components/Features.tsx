import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SpotlightCard } from './SpotlightCard';
import { ShieldCheck, Cpu, Layers, Sparkles, BarChart3, Grid, ChevronRight } from 'lucide-react';

interface FeatureData {
  id: string;
  number: string;
  title: string;
  tagline: string;
  description: string;
  metric: string;
  metricLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  capabilities: string[];
  mockData: {
    rule: string;
    status: string;
    sample: string;
  };
}

const FEATURES: FeatureData[] = [
  {
    id: 'identity',
    number: '01',
    title: 'Brand Identity Management',
    tagline: 'Deterministic Invariant Governance',
    description:
      'Ingest and codify your complete brand guidelines into programmatic neural rules—from exact CMYK/RGB gamut bounds to strict typographic hierarchies.',
    metric: 'Codified',
    metricLabel: 'Guideline Invariants',
    icon: Layers,
    capabilities: ['Dynamic Token Registry', 'Asset Lockdowns', 'Multi-Locale Variants', 'Figma & DAM Sync'],
    mockData: {
      rule: 'PRIMARY_PALETTE_VERIFICATION',
      status: 'VERIFIED',
      sample: 'Obsidian #09090B · Titanium #F4F4F5 · Gamut Delta E < 0.8',
    },
  },
  {
    id: 'analysis',
    number: '02',
    title: 'AI Content Analysis',
    tagline: 'Sub-second Multi-Modal Inspection',
    description:
      'Evaluate marketing collateral, social campaigns, executive speeches, and product copy before publication with real-time neural semantic scanning.',
    metric: '<140ms',
    metricLabel: 'Evaluation Latency',
    icon: Cpu,
    capabilities: ['Sentiment & Tone Scoring', 'Terminology Verification', 'Visual Contrast Audit', 'Hallucination Filtering'],
    mockData: {
      rule: 'SEMANTIC_TONE_SPECTRUM',
      status: 'COMPLIANT',
      sample: 'Executive Luxury Tone · 0.94 Confidence Index · Zero Slang',
    },
  },
  {
    id: 'compliance',
    number: '03',
    title: 'Brand Compliance',
    tagline: 'Policy Enforcement Gate',
    description:
      'Block unauthorized claims, competitor comparisons, and regulatory infractions with automated gatekeeping integrated directly into your publishing pipeline.',
    metric: 'Automated',
    metricLabel: 'Policy Gate Check',
    icon: ShieldCheck,
    capabilities: ['Regulatory Guardrails', 'Trademark Enforcement', 'Executive Sign-off Routing', 'Automated PR Risk Audits'],
    mockData: {
      rule: 'COMPLIANCE_GATE_STATUS',
      status: 'ENFORCED',
      sample: 'Global Trademark Rules Active · 4 Legal Guardrails Satisfied',
    },
  },
  {
    id: 'corrections',
    number: '04',
    title: 'Smart Corrections',
    tagline: 'Neural In-Line Remediation',
    description:
      'Transform off-brand drafts into refined brand-approved prose instantly with intelligent contextual suggestions and deterministic tone alignment.',
    metric: 'Accelerated',
    metricLabel: 'Approval Velocity',
    icon: Sparkles,
    capabilities: ['1-Click Auto-Remediation', 'Voice Synthesizer', 'Terminology Substitution', 'Style-Guide Alignment'],
    mockData: {
      rule: 'AUTO_REMEDIATION_DIFF',
      status: 'ALIGNED',
      sample: 'Replaced hyperbolic cliches with measured enterprise vernacular.',
    },
  },
  {
    id: 'performance',
    number: '05',
    title: 'Brand Performance Reports',
    tagline: 'Longitudinal Coherence Intelligence',
    description:
      'Quantify brand health across internal teams, creative agencies, and regional divisions with comprehensive governance analytics and drift heatmaps.',
    metric: 'Real-Time',
    metricLabel: 'Consistency Scoring',
    icon: BarChart3,
    capabilities: ['Team Drift Heatmaps', 'Vendor Quality Index', 'Violation Trend Analysis', 'Executive PDF Briefs'],
    mockData: {
      rule: 'GOVERNANCE_INDEX_DEMO',
      status: 'ACTIVE',
      sample: 'Overall Brand Consistency Score: 98.4 / 100 across 12 markets.',
    },
  },
];

const CARD_TINTS = [
  { active: '#141a21', idle: '#0c1015', border: 'rgba(148, 163, 184, 0.16)', activeBorder: 'rgba(203, 213, 225, 0.46)', glow: 'rgba(186, 214, 235, 0.10)' },
  { active: '#141a21', idle: '#0c1015', border: 'rgba(148, 163, 184, 0.16)', activeBorder: 'rgba(203, 213, 225, 0.46)', glow: 'rgba(186, 214, 235, 0.10)' },
  { active: '#141a21', idle: '#0c1015', border: 'rgba(148, 163, 184, 0.16)', activeBorder: 'rgba(203, 213, 225, 0.46)', glow: 'rgba(186, 214, 235, 0.10)' },
  { active: '#141a21', idle: '#0c1015', border: 'rgba(148, 163, 184, 0.16)', activeBorder: 'rgba(203, 213, 225, 0.46)', glow: 'rgba(186, 214, 235, 0.10)' },
  { active: '#141a21', idle: '#0c1015', border: 'rgba(148, 163, 184, 0.16)', activeBorder: 'rgba(203, 213, 225, 0.46)', glow: 'rgba(186, 214, 235, 0.10)' },
];

export const Features: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hand' | 'grid'>('hand');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const touchStartX = useRef<number | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeFeature = FEATURES[selectedIndex];

  // Detect when the Features section / gallery becomes visible in viewport
  useEffect(() => {
    if (activeTab !== 'hand') {
      setIsVisible(false);
      return;
    }

    const el = galleryRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeTab]);

  // Automatic sequence cycling: 01 -> 02 -> 03 -> 04 -> 05 -> 01 every ~1.85s (1.5x faster)
  useEffect(() => {
    if (activeTab !== 'hand' || !isVisible || isHovered) return;

    // Respect user's prefers-reduced-motion preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const interval = setInterval(() => {
      setSelectedIndex((prev) => (prev + 1) % FEATURES.length);
      setExpandedIndex(null);
    }, 1850);

    return () => clearInterval(interval);
  }, [activeTab, isVisible, isHovered]);

  // Pause cycling briefly only during explicit interaction (click or swipe), then resume
  const pauseCyclingTemporarily = useCallback((durationMs = 2500) => {
    setIsHovered(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      setIsHovered(false);
    }, durationMs);
  }, []);

  // Mobile Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsHovered(true);
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current !== null) {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX;

      if (Math.abs(diff) > 35) {
        setExpandedIndex(null);
        if (diff > 0) {
          // Swiped Left -> Advance to Next Card
          setSelectedIndex((prev) => (prev + 1) % FEATURES.length);
        } else {
          // Swiped Right -> Previous Card
          setSelectedIndex((prev) => (prev - 1 + FEATURES.length) % FEATURES.length);
        }
      }
    }
    touchStartX.current = null;
    pauseCyclingTemporarily(5000);
  };

  return (
    <section id="features" className="relative py-24 sm:py-32 bg-[#060608] overflow-hidden">
      {/* Background ambient spotlight */}
      <div
        className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[500px] spotlight-radial opacity-40"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 pb-8 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-zinc-400 font-medium mb-3">
              <span>Core System Architecture</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>5 Fundamental Pillars</span>
            </div>
            <h2 className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-black uppercase text-white tracking-tight leading-[0.95]">
              BRAND CONTROL.
              <br />
              <span className="text-zinc-400">WITHOUT COMPROMISE.</span>
            </h2>
          </div>

          {/* View Mode Toggle (Card Hand Gallery vs Grid) */}
          <div className="flex items-center gap-2 p-1 rounded-md border border-white/10 bg-[#0d0e12]">
            <button
              type="button"
              onClick={() => setActiveTab('hand')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-all duration-200 cursor-pointer ${
                activeTab === 'hand'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Card Hand</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('grid')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider rounded transition-all duration-200 cursor-pointer ${
                activeTab === 'grid'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Matrix Grid</span>
            </button>
          </div>
        </div>

        {/* View Mode 1: Interactive Card Hand Gallery (Inspired by Ruixen UI Card Hand) */}
        {activeTab === 'hand' && (
          <div ref={galleryRef} className="space-y-10 group-hand-gallery">
            {/* The Interactive Card Hand Showcase with perspective and continuous floating movement */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              style={{ perspective: '1200px' }}
              className="relative pt-6 pb-12 flex items-center justify-center min-h-[400px] sm:min-h-[460px] select-none"
            >
              {/* Floor Shadow Reflection */}
              <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 w-3/4 max-w-xl h-16 bg-white/[0.03] blur-2xl rounded-full pointer-events-none"
                aria-hidden="true"
              />

              <div className="relative w-full max-w-4xl h-[380px] flex items-center justify-center">
                {FEATURES.map((feature, idx) => {
                  const total = FEATURES.length;
                  let signedOffset = ((idx - selectedIndex) % total + total) % total;
                  if (signedOffset > total / 2) signedOffset -= total; // -2, -1, 0, 1, 2
                  const isSelected = signedOffset === 0;
      const isExpanded = expandedIndex === idx;

                  // Fluid, responsive fan coordinates:
                  // 0: Active foreground center, elevated (-28px)
                  // +1: Next card stepping forward
                  // +2: Far right back
                  // -1: Previous card moving back naturally
                  // -2: Far left back
                  const rotation = signedOffset * 5.8;
                  const xTranslate = signedOffset * 76;
      const yTranslate = isSelected ? (isExpanded ? -34 : -28) : Math.abs(signedOffset) * 10;
      const scale = isSelected ? (isExpanded ? 1.12 : 1.05) : 0.94 - Math.abs(signedOffset) * 0.04;
                  const zIndex = isSelected ? 50 : 35 - Math.abs(signedOffset) * 8;
                  const opacity = isSelected ? 1 : Math.max(0.65, 0.9 - Math.abs(signedOffset) * 0.12);
                  const cardTint = CARD_TINTS[idx];

                  return (
                    <div
                      key={feature.id}
                      style={{
                        transform: `translate3d(${xTranslate}px, ${yTranslate}px, 0px) rotate(${rotation}deg) scale(${scale})`,
                        zIndex,
                        opacity,
                        transition: 'transform 0.42s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.32s ease',
                      }}
                      onClick={() => {
                        setSelectedIndex(idx);
                        setExpandedIndex(idx);
                        pauseCyclingTemporarily(2500);
                      }}
                      className="absolute cursor-pointer w-[260px] sm:w-[310px] select-none will-change-transform"
                    >
                      {/* Inner continuous automatic floating wrapper */}
                      <div className={`w-full card-float-${idx} transition-transform duration-300 hover:-translate-y-2 hover:scale-[1.02]`}>
                        <SpotlightCard
                          spotlightColor={cardTint.glow}
                          style={{
                            backgroundColor: isSelected ? cardTint.active : cardTint.idle,
                            borderColor: isSelected ? cardTint.activeBorder : cardTint.border,
                          }}
                          className={`transition-all duration-300 ${
                            isSelected
                              ? 'shadow-[0_20px_45px_rgba(0,0,0,0.85),0_0_30px_rgba(255,255,255,0.08)]'
                              : 'hover:brightness-110'
                          }`}
                        >
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-xs font-mono tracking-widest text-zinc-400">
                                {feature.number}
                              </span>
                              <div
                                className={`p-2 rounded border ${
                                  isSelected
                                    ? 'border-white/30 bg-white/10 text-white'
                                    : 'border-white/10 bg-white/[0.03] text-zinc-400'
                                }`}
                              >
                                <feature.icon className="w-4 h-4" />
                              </div>
                            </div>

                            <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block mb-1">
                              {feature.tagline}
                            </span>
                            <h3 className="font-editorial text-xl sm:text-2xl font-bold uppercase text-white tracking-wide mb-3">
                              {feature.title}
                            </h3>
                            <p className={`text-xs text-zinc-400 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                              {feature.description}
                            </p>
                          </div>

                          <div className="pt-6 mt-4 border-t border-white/[0.06] flex items-center justify-between">
                            <div>
                              <span className="text-base font-bold text-white tracking-tight font-sans">
                                {feature.metric}
                              </span>
                              <span className="block text-[10px] text-zinc-400 font-mono uppercase">
                                {feature.metricLabel}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${
                                isSelected
                                  ? 'border-white/40 text-white bg-white/10'
                                  : 'border-white/10 text-zinc-400'
                              }`}
                            >
                              {isSelected ? 'Active' : 'Inspect'}
                            </span>
                          </div>
                        </div>
                      </SpotlightCard>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Card Hand Sequence Indicator: 01 -> 02 -> 03 -> 04 -> 05 */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mr-1">
                Sequence:
              </span>
              {FEATURES.map((feat, i) => (
                <button
                  key={feat.id}
                  type="button"
                  onClick={() => {
                    setSelectedIndex(i);
                    setExpandedIndex(null);
                    pauseCyclingTemporarily(5000);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono transition-all duration-300 cursor-pointer ${
                    selectedIndex === i
                      ? 'bg-white text-black font-bold shadow-[0_0_15px_rgba(255,255,255,0.3)] scale-105'
                      : 'text-zinc-500 hover:text-zinc-300 bg-white/[0.03] border border-white/10'
                  }`}
                  aria-label={`Jump to Pillar ${feat.number}: ${feat.title}`}
                >
                  {feat.number}
                </button>
              ))}
            </div>

            {/* Mobile swipe hint */}
            <div className="sm:hidden text-center text-[10px] uppercase font-mono tracking-widest text-zinc-500">
              Swipe left or right to cycle cards
            </div>

            {/* Selected Feature Deep Technical Inspection Panel */}
            <div className="rounded-xl border border-white/15 bg-[#0a0a0d] p-6 sm:p-10 shadow-2xl transition-all duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7">
                  <div className="flex items-center gap-3 text-xs uppercase font-mono tracking-widest text-zinc-400 mb-2">
                    <span>Pillar {activeFeature.number}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-white">{activeFeature.tagline}</span>
                  </div>
                  <h3 className="font-editorial text-3xl sm:text-4xl font-bold uppercase text-white mb-4">
                    {activeFeature.title}
                  </h3>
                  <p className="text-sm sm:text-base text-zinc-400 leading-relaxed mb-6">
                    {activeFeature.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {activeFeature.capabilities.map((cap) => (
                      <div
                        key={cap}
                        className="flex items-center gap-2 text-xs text-zinc-300 font-medium"
                      >
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Telemetry Box */}
                <div className="lg:col-span-5 rounded-lg border border-white/10 bg-black/60 p-5 font-mono text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                    <span className="text-zinc-400 uppercase tracking-wider text-[11px]">
                      Neural Gate Specification
                    </span>
                    <span className="text-zinc-200 bg-white/10 px-2 py-0.5 rounded font-semibold tracking-wider text-[10px]">
                      {activeFeature.mockData.status}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-zinc-400 text-[10px] uppercase block mb-1">
                        Active Invariant Rule:
                      </span>
                      <code className="text-zinc-200 bg-white/[0.05] px-2 py-1 rounded block">
                        {activeFeature.mockData.rule}
                      </code>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-[10px] uppercase block mb-1">
                        Telemetry Output:
                      </span>
                      <p className="text-zinc-300 bg-white/[0.02] p-2 rounded border border-white/[0.06] text-[11px] leading-relaxed">
                        {activeFeature.mockData.sample}
                      </p>
                    </div>
                    <div className="pt-2 flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">Governance Index:</span>
                      <span className="text-white font-bold">{activeFeature.metric}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Mode 2: Matrix Grid View */}
        {activeTab === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, index) => (
              <SpotlightCard
                key={feature.id}
                spotlightColor={CARD_TINTS[index].glow}
                style={{ backgroundColor: CARD_TINTS[index].idle, borderColor: CARD_TINTS[index].border }}
                className="flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono tracking-widest text-zinc-400">
                      {feature.number}
                    </span>
                    <div className="p-2 rounded border border-white/10 bg-white/[0.03] text-zinc-300">
                      <feature.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400 block mb-1">
                    {feature.tagline}
                  </span>
                  <h3 className="font-editorial text-2xl font-bold uppercase text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                    {feature.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                  <div>
                    <span className="text-base font-bold text-white tracking-tight font-sans">
                      {feature.metric}
                    </span>
                    <span className="block text-[10px] text-zinc-400 font-mono uppercase">
                      {feature.metricLabel}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-w-[160px] justify-end">
                    {feature.capabilities.slice(0, 2).map((cap) => (
                      <span
                        key={cap}
                        className="text-[9px] uppercase tracking-wider text-zinc-400 bg-white/[0.03] border border-white/[0.06] px-1.5 py-0.5 rounded"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              </SpotlightCard>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
