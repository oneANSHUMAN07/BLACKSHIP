import React, { useEffect, useRef, useState } from 'react';
import { UploadCloud, Send, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

interface StepDetail {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  deliverables: string[];
  mockUi: {
    title: string;
    badge: string;
    lines: string[];
    actionLabel: string;
  };
}

const STEPS: StepDetail[] = [
  {
    number: '01',
    title: 'Upload Brand Guidelines',
    subtitle: 'Knowledge Ingestion & Invariant Codification',
    description:
      'Connect your Figma design system, upload brand PDF books, or link your enterprise DAM. BLACKSHIP programmatically parses typography scales, color gamut boundaries, voice rules, and legal guardrails into deterministic neural invariants.',
    icon: UploadCloud,
    deliverables: [
      'Token & Gamut Extraction (RGB, CMYK, Pantone)',
      'Tone of Voice Calibration Matrix',
      'Restricted Terminology & Regulatory Dictionary',
      'Automated Figma / DAM Synchronization',
    ],
    mockUi: {
      title: 'Enterprise Guideline Parser',
      badge: 'TOKEN_INGESTION_COMPLETE',
      lines: [
        'Ingested: "Global Brand Standards v4.2.pdf" (148 pages)',
        'Extracted: 84 color invariants, 16 typography rules',
        'Calibrated: Tone spectrum: Authoritative, Restrained, Luxury',
      ],
      actionLabel: 'Rules Codified into Active Policy Engine',
    },
  },
  {
    number: '02',
    title: 'Submit Your Content',
    subtitle: 'Omnichannel Continuous Listening',
    description:
      'Seamlessly route creative assets and copy into BLACKSHIP before publication. Integrates with your team’s existing workflows—Figma, Google Workspace, Adobe Creative Cloud, Contentful, Slack, and programmatic CI/CD pipelines.',
    icon: Send,
    deliverables: [
      'Native Figma & Google Docs Plugins',
      'Automated Webhook & Pull Request Gates',
      'Pre-publish CMS Interceptor',
      'Real-Time Slack & Microsoft Teams Review Bots',
    ],
    mockUi: {
      title: 'Omnichannel Pipeline Gate',
      badge: 'INPUT_STREAM_READY',
      lines: [
        'Payload: "Q4 Keynote Presentation & Social Hero Unit"',
        'Source: Figma Enterprise Team Workspace',
        'Assets: 18 Vector Artboards, 3,400 Words Copy',
      ],
      actionLabel: 'Dispatched to Neural Semantic Auditor',
    },
  },
  {
    number: '03',
    title: 'Analyse & Detect Issues',
    subtitle: 'Sub-second Neural Semantic Audit',
    description:
      'Within 140 milliseconds, BLACKSHIP cross-evaluates every word, hex code, font size, and visual contrast ratio against your codified brand standards. Pinpoints exact semantic drift, tone hyperbole, and trademark infractions.',
    icon: ShieldAlert,
    deliverables: [
      'Context-Aware Tone Scoring',
      'Direct Regulatory & Legal Infraction Flags',
      'Visual Contrast & Logo Clearspace Measurement',
      'Competitor Language & Trademark Collision Warnings',
    ],
    mockUi: {
      title: 'Autonomous Compliance Diagnostics',
      badge: 'AUDIT_FLAG_TRIGGERED',
      lines: [
        'Line 42: "insane game-changing platform" (Tone Violation: Hyperbole)',
        'Artboard 3: Contrast ratio 3.1:1 fails enterprise AAA requirement (4.5:1 required)',
        'Slide 8: Unverified quantitative claim flagged for legal sign-off',
      ],
      actionLabel: 'Remediation Protocol Initiated',
    },
  },
  {
    number: '04',
    title: 'Review, Correct & Approve',
    subtitle: '1-Click Intelligent Remediation & Gate Sign-off',
    description:
      'Accept contextual neural suggestions with one click. Off-brand phrasing is transformed into your brand’s signature voice, visual assets are auto-adjusted, and a verified audit certificate is logged for stakeholder accountability.',
    icon: CheckCircle2,
    deliverables: [
      'Instant 1-Click Semantic Text Alignment',
      'Side-by-side Visual & Copy Diff Inspector',
      'Structured Brand Compliance Record',
      'Audit Trail for Legal & Executive Stakeholders',
    ],
    mockUi: {
      title: 'Executive Brand Assurance Approval',
      badge: 'VERIFIED_ON_BRAND',
      lines: [
        'Original: "Our insane platform will disrupt the market"',
        'Approved: "Our precision-engineered platform redefines market governance"',
        'Result: Brand Coherence Index 100/100 · Gate Passed',
      ],
      actionLabel: 'Asset Approved & Marked Ready for Publication',
    },
  },
];

export const HowItWorks: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(false);
  const [manualPause, setManualPause] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentStep = STEPS[activeStepIndex];

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, { threshold: 0.15 });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || manualPause || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const interval = window.setInterval(() => {
      setActiveStepIndex((current) => (current + 1) % STEPS.length);
    }, 2000);
    return () => window.clearInterval(interval);
  }, [isVisible, manualPause]);

  useEffect(() => () => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  }, []);

  const selectStep = (index: number) => {
    setActiveStepIndex(index);
    setManualPause(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => setManualPause(false), 2000);
  };

  return (
    <section ref={sectionRef} id="how-it-works" className="relative py-24 sm:py-32 bg-[#08080b] border-t border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="mb-16 pb-8 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-zinc-400 font-medium mb-3">
            <span>Governance Lifecycle</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>4-Step Deployment Pipeline</span>
          </div>
          <h2 className="font-editorial text-4xl sm:text-6xl lg:text-7xl font-black uppercase text-white tracking-tight leading-[0.95]">
            HOW IT WORKS.
            <br />
            <span className="text-zinc-400">PRECISION EXECUTION.</span>
          </h2>
        </div>

        {/* Step Navigation Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {STEPS.map((step, index) => {
            const isActive = activeStepIndex === index;
            return (
              <button
                key={step.number}
                type="button"
                onClick={() => selectStep(index)}
                aria-pressed={isActive}
                className={`text-left p-5 rounded-lg border transition-all duration-300 relative overflow-hidden group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white cursor-pointer ${
                  isActive
                    ? 'border-white/40 bg-[#121318] shadow-[0_10px_30px_rgba(0,0,0,0.6)]'
                    : 'border-white/10 bg-[#0c0d11]/70 hover:border-white/20 hover:bg-[#121318]/50'
                }`}
              >
                {/* Active Indicator Top Border */}
                {isActive && (
                  <span className="absolute top-0 left-0 right-0 h-[2px] bg-white" />
                )}

                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`font-mono text-sm tracking-widest font-bold ${
                      isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'
                    }`}
                  >
                    {step.number}
                  </span>
                  <div
                    className={`p-1.5 rounded ${
                      isActive ? 'bg-white text-black' : 'text-zinc-400 group-hover:text-white'
                    }`}
                  >
                    <step.icon className="w-4 h-4" />
                  </div>
                </div>

                <h3
                  className={`font-editorial text-lg font-bold uppercase tracking-wide transition-colors ${
                    isActive ? 'text-white' : 'text-zinc-300 group-hover:text-white'
                  }`}
                >
                  {step.title}
                </h3>
              </button>
            );
          })}
        </div>

        {/* Active Step Deep Inspector */}
        <div className="rounded-xl border border-white/15 bg-[#0b0c10] p-6 sm:p-10 shadow-2xl relative overflow-hidden transition-all duration-300">
          {/* Subtle background light */}
          <div
            className="absolute top-0 right-0 w-80 h-80 bg-white/[0.03] blur-3xl pointer-events-none rounded-full"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Info Column */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-400 block mb-2">
                  Step {currentStep.number} — {currentStep.subtitle}
                </span>
                <h3 className="font-editorial text-3xl sm:text-4xl font-bold uppercase text-white mb-4">
                  {currentStep.title}
                </h3>
                <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  {currentStep.description}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-xs uppercase font-mono tracking-wider text-zinc-400 block">
                  Core Technical Deliverables:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentStep.deliverables.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-2 text-xs text-zinc-300 font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    const next = (activeStepIndex + 1) % STEPS.length;
                    setActiveStepIndex(next);
                  }}
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold text-white bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 px-4 py-2.5 rounded transition-all cursor-pointer"
                >
                  <span>Next Stage: {STEPS[(activeStepIndex + 1) % STEPS.length].title}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right Interface Mock Telemetry Console */}
            <div className="lg:col-span-6">
              <div className="rounded-lg border border-white/15 bg-black/90 p-5 sm:p-6 font-mono text-xs shadow-inner">
                {/* Window Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
                    <span className="ml-2 text-zinc-400 text-[11px] font-sans">
                      {currentStep.mockUi.title}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border border-white/15 bg-white/5 text-zinc-300">
                    {currentStep.mockUi.badge}
                  </span>
                </div>

                {/* Terminal Execution Lines */}
                <div className="space-y-3 mb-6">
                  {currentStep.mockUi.lines.map((line, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded bg-white/[0.02] border border-white/[0.04] text-zinc-300 leading-relaxed text-[11px]"
                    >
                      <span className="text-zinc-400 mr-2">$</span>
                      {line}
                    </div>
                  ))}
                </div>

                {/* Action Banner */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400">Process Status:</span>
                  <span className="text-white font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                    {currentStep.mockUi.actionLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
