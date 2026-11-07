import React from 'react';
import { SpinningBorderButton } from './SpinningBorderButton';
import { Shield } from 'lucide-react';

export const CtaSection: React.FC = () => {
  return (
    <section id="cta-section" className="relative py-28 sm:py-36 bg-[#060608] border-t border-white/[0.08] overflow-hidden">
      {/* Background ambient metallic glow */}
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[420px] spotlight-radial opacity-40"
        aria-hidden="true"
      />

      <div className="max-w-5xl mx-auto px-6 sm:px-8 relative z-10 text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-zinc-400 font-medium mb-6">
          <Shield className="w-3.5 h-3.5 text-zinc-300" />
          <span>Enterprise Brand Governance Platform</span>
        </div>

        {/* Closing Headline */}
        <h2 className="font-editorial text-5xl sm:text-7xl lg:text-8xl font-black uppercase text-white tracking-tight leading-[0.92] mb-8">
          KEEP EVERY BRAND
          <br />
          <span className="text-zinc-400">DECISION ON TRACK.</span>
        </h2>

        {/* Supporting Copy */}
        <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-12">
          Autonomous governance that protects your enterprise identity at scale. Ensure every campaign, asset, and communication remains impeccably on-brand.
        </p>

        {/* Action Form or Status */}
        <div className="flex justify-center">
          <SpinningBorderButton type="button" size="md" onClick={() => window.location.assign('/login')}>
            <span className="font-bold uppercase tracking-wider text-xs">Sign In to Workspace</span>
          </SpinningBorderButton>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[11px] uppercase tracking-widest text-zinc-500 font-mono">
          <span>Deterministic Invariants</span>
          <span aria-hidden="true">·</span>
          <span>Interactive Preview</span>
          <span aria-hidden="true">·</span>
          <span>Rule-Based Remediation</span>
        </div>
      </div>
    </section>
  );
};
