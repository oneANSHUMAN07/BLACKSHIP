import React from 'react';
import { ArrowRight } from 'lucide-react';
import { HeroRing3D } from './HeroRing3D';

interface HeroProps {
  onExploreClick: () => void;
  onSeeHowItWorksClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExploreClick, onSeeHowItWorksClick }) => {
  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden hero-studio-backdrop">
      <div className="hero-ribbon-field" aria-hidden="true">
        <div className="hero-ribbon hero-ribbon--top">
          <div className="hero-ribbon-track">
            <span>BLACKSHIP  ◆  BRAND DNA  ◆  REVIEW  ◆  REFINE  ◆  SHIP WITH CONFIDENCE  ◆  </span>
            <span>BLACKSHIP  ◆  BRAND DNA  ◆  REVIEW  ◆  REFINE  ◆  SHIP WITH CONFIDENCE  ◆  </span>
          </div>
        </div>
        <div className="hero-ribbon hero-ribbon--middle">
          <div className="hero-ribbon-track">
            <span>EVERY CLAIM CHECKED  ◆  EVERY VOICE ALIGNED  ◆  BUILT FOR BRAND TRUST  ◆  </span>
            <span>EVERY CLAIM CHECKED  ◆  EVERY VOICE ALIGNED  ◆  BUILT FOR BRAND TRUST  ◆  </span>
          </div>
        </div>
        <div className="hero-ribbon hero-ribbon--bottom">
          <div className="hero-ribbon-track">
            <span>CREATE  ◆  AUDIT  ◆  CORRECT  ◆  APPROVE  ◆  REPEAT  ◆  </span>
            <span>CREATE  ◆  AUDIT  ◆  CORRECT  ◆  APPROVE  ◆  REPEAT  ◆  </span>
          </div>
        </div>
      </div>

      <div className="hero-intro relative z-10 max-w-7xl mx-auto px-6 sm:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Headline & Copy */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Eyebrow */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs uppercase tracking-[0.25em] text-zinc-400 font-medium mb-6">
              <span>AI Brand Governance</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>Identity Systems</span>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>Real-Time Compliance</span>
            </div>

            {/* Main Headline with Realistic Metallic Light-Sweep Animation */}
            <h1 className="font-editorial text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tight leading-[0.92] mb-8 select-none">
              <span className="headline-metallic-sweep">
                YOUR BRAND.
                <br />
                NEVER OFF-BRAND.
              </span>
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-zinc-400 font-normal max-w-xl leading-relaxed mb-10">
              AI-powered brand governance that keeps every message, asset and campaign aligned with your identity.
            </p>

            {/* Luxury Split-Button CTAs matching the Northline reference */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-5">
              {/* Primary CTA: Solid White Split Button */}
              <button
                type="button"
                onClick={onExploreClick}
                className="group inline-flex items-stretch rounded border border-white bg-white text-black font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 hover:bg-zinc-100 hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white cursor-pointer"
              >
                <span className="px-5 sm:px-6 py-3.5 flex items-center justify-center font-bold tracking-widest">
                  Explore Blackship
                </span>
                <span
                  aria-hidden="true"
                  className="px-3.5 sm:px-4 py-3.5 border-l border-black/15 flex items-center justify-center bg-black/[0.04] group-hover:bg-black/[0.08] transition-colors"
                >
                  <ArrowRight className="hero-arrow-float w-4 h-4" />
                </span>
              </button>

              {/* Secondary CTA: Dark Outlined Split Button */}
              <button
                type="button"
                onClick={onSeeHowItWorksClick}
                className="group inline-flex items-stretch rounded border border-white/20 bg-zinc-950/70 backdrop-blur-sm text-zinc-200 font-medium text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 hover:border-white/60 hover:text-white hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 cursor-pointer"
              >
                <span className="px-5 sm:px-6 py-3.5 flex items-center justify-center font-medium tracking-widest">
                  See How It Works
                </span>
                <span
                  aria-hidden="true"
                  className="px-3.5 sm:px-4 py-3.5 border-l border-white/15 flex items-center justify-center bg-white/[0.02] group-hover:bg-white/[0.06] transition-colors"
                >
                  <ArrowRight className="hero-arrow-float w-4 h-4 text-zinc-400 group-hover:text-white transition-colors duration-300" />
                </span>
              </button>
            </div>
          </div>

          {/* Right Column: 3D Floating & Rocking Metallic Visual above Fixed Floor Spotlight */}
          <div className="hero-visual-intro lg:col-span-5 relative flex items-center justify-center">
            {/* Fixed wide elliptical white-silver floor spotlight directly beneath the sculpture */}
            <div
              className="absolute w-[360px] sm:w-[480px] h-[160px] sm:h-[200px] -bottom-6 left-1/2 -translate-x-1/2 sculpture-floor-spotlight rounded-full pointer-events-none"
              aria-hidden="true"
            />

            {/* Fixed subtle blurred floor reflection below the ring */}
            <div
              className="absolute w-[280px] sm:w-[380px] h-[70px] sm:h-[90px] -bottom-2 left-1/2 -translate-x-1/2 sculpture-floor-reflection rounded-full pointer-events-none"
              aria-hidden="true"
            />

            {/* Soft contact shadow grounds the sculpture in the illuminated studio floor */}
            <div
              className="absolute w-[260px] sm:w-[340px] h-[44px] sm:h-[58px] -bottom-1 left-1/2 -translate-x-1/2 sculpture-floor-shadow rounded-full pointer-events-none"
              aria-hidden="true"
            />

            {/* Seamless Container with Ring Centered */}
            <div className="relative w-full max-w-[460px] aspect-square flex items-center justify-center select-none overflow-visible">
              {/* Continuous Clockwise Rotation around Central Axis (Consistent Single Direction) */}
              <div
                role="img"
                aria-label="Twisted chrome torus-knot sculpture rotating in three dimensions"
                className="relative z-10 w-full h-full"
                style={{
                  maskImage: 'radial-gradient(circle at 50% 50%, black 50%, transparent 68%)',
                  WebkitMaskImage: 'radial-gradient(circle at 50% 50%, black 50%, transparent 68%)',
                }}
              >
                <HeroRing3D />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
