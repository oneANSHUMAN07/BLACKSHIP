import React from 'react';
import { Shield, Eye, Lock } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const pillars = [
    {
      icon: Shield,
      title: 'Continuous Coherence',
      description:
        'In an era where thousands of assets are generated weekly, manual oversight fails. BLACKSHIP provides continuous automated assurance so every touchpoint stays flawlessly aligned.',
    },
    {
      icon: Eye,
      title: 'Codified Determinism',
      description:
        'We replace ambiguous creative briefs and endless revision committees with programmatic neural invariants that enforce exact color bounds, typographic scales, and tone parameters.',
    },
    {
      icon: Lock,
      title: 'Brand Privacy & Protection',
      description:
        'Designed for brand sensitivity. In our prototype architecture, brand guidelines and marketing drafts remain isolated and protected without third-party exposure.',
    },
  ];

  return (
    <section id="about" className="relative py-24 sm:py-32 bg-[#060608] border-t border-white/[0.08] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Editorial Philosophy */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-zinc-400 font-medium mb-4">
              <span>Enterprise Philosophy</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>The Invariant Mandate</span>
            </div>

            <h2 className="font-editorial text-4xl sm:text-6xl font-black uppercase text-white tracking-tight leading-[0.95] mb-6">
              BUILT FOR BRANDS
              <br />
              <span className="text-zinc-400">THAT REFUSE TO COMPROMISE.</span>
            </h2>

            <p className="text-base text-zinc-400 leading-relaxed mb-8 max-w-xl">
              A brand is not a logo—it is an unbroken chain of trust forged through unwavering consistency. When autonomous generative tools flood every channel, brand erosion accelerates exponentially. BLACKSHIP is the immutable defense system for modern enterprise identity.
            </p>

            {/* Three Institutional Pillars */}
            <div className="space-y-6">
              {pillars.map((pillar) => (
                <div key={pillar.title} className="flex gap-4 items-start">
                  <div className="p-2 rounded border border-white/10 bg-white/[0.02] text-zinc-300 mt-1 shrink-0">
                    <pillar.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-editorial text-lg uppercase tracking-wide text-white mb-1">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Faceted Chrome Emblem Artwork */}
          <div className="lg:col-span-5 flex items-center justify-center relative">
            <div
              className="absolute w-72 h-72 rounded-full bg-white/[0.05] blur-3xl pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="relative w-full max-w-[380px] aspect-square rounded-2xl border border-white/10 bg-black/60 p-6 flex flex-col items-center justify-center shadow-2xl backdrop-blur-sm"
              style={{
                maskImage: 'radial-gradient(circle at 50% 50%, black 80%, transparent 100%)',
                WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 80%, transparent 100%)',
              }}
            >
              <img
                src="/src/assets/images/brand_feature_shield_1793811015911.jpg"
                alt="BLACKSHIP Faceted Metallic Seal of Brand Invariance"
                className="w-4/5 h-4/5 object-contain filter drop-shadow-[0_15px_35px_rgba(0,0,0,0.9)]"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="mt-4 text-center">
                <span className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block">
                  Immutable Governance Standard
                </span>
                <span className="font-editorial text-sm uppercase text-white font-bold tracking-wider">
                  The Blackship Protocol
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
