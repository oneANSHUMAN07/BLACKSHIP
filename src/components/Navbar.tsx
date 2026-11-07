import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { SpinningBorderButton } from './SpinningBorderButton';

interface NavbarProps {
  onExploreClick?: () => void;
  onHowItWorksClick?: () => void;
  onGetStartedClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onExploreClick, onHowItWorksClick, onGetStartedClick }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Product', href: '#features' },
    { label: 'Solutions', href: '/login' },
    { label: 'How It Works', href: '#how-it-works', onClick: onHowItWorksClick },
    { label: 'About', href: '#about' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#060608]/92 backdrop-blur-md border-b border-white/[0.08] py-3.5'
          : 'bg-transparent border-b border-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-5 lg:px-8 flex items-center justify-between gap-3 md:gap-4 lg:gap-8">
        {/* Zone 1: Official BLACKSHIP Logo & Wordmark (220px desktop, 175px mobile) */}
        <a
          href="#"
          className="group flex items-center shrink-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
        >
          <img
            src="/assets/aistudio/blackship_nav_logo.svg"
            alt="BLACKSHIP — Autonomous Brand Governance"
            className="w-[130px] md:w-[150px] lg:w-[190px] xl:w-[220px] h-auto object-contain shrink-0 transition-opacity duration-300 group-hover:opacity-95"
            loading="eager"
          />
        </a>

        {/* Zone 2: Navigation Links (Desktop) with Animated Spinning Metallic Border */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-1.5 lg:gap-4"
        >
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => {
                if (link.onClick) {
                  e.preventDefault();
                  link.onClick();
                }
              }}
              className="group relative inline-flex items-center justify-center overflow-hidden rounded p-[1px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
            >
              {/* Subtle spinning metallic silver border */}
              <span
                aria-hidden="true"
                className="absolute inset-[-140%] animate-spin-border bg-[conic-gradient(from_90deg_at_50%_50%,#18181b_0%,#a1a1aa_50%,#ffffff_75%,#18181b_100%)] opacity-40 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
              />
              {/* Content surface */}
              <span className="relative inline-flex items-center justify-center overflow-hidden rounded-[3px] px-2 md:px-2.5 lg:px-3.5 py-1.5 bg-[#060608]/90 text-[9px] md:text-[10px] lg:text-xs uppercase tracking-wider lg:tracking-widest font-medium text-zinc-300 transition-colors duration-[600ms] group-hover:text-[#08090b] whitespace-nowrap shrink-0">
                <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-100 opacity-0 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:h-[220px] group-hover:w-[220px] group-hover:opacity-100 motion-reduce:transition-none" />
                <span className="relative z-10 transition-transform duration-[600ms] ease-out group-hover:scale-[1.03] motion-reduce:transition-none">{link.label}</span>
              </span>
            </a>
          ))}
        </nav>

        {/* Zone 3: Workspace & Get Started with Animated Spinning Metallic Border */}
        <div className="hidden md:flex items-center gap-2 lg:gap-3.5 shrink-0">
          {/* OPEN APP with animated spinning border */}
          <a
            href="/login"
            className="group relative inline-flex items-center justify-center overflow-hidden rounded p-[1px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
          >
            <span
              aria-hidden="true"
              className="absolute inset-[-140%] animate-spin-border bg-[conic-gradient(from_90deg_at_50%_50%,#18181b_0%,#a1a1aa_50%,#ffffff_75%,#18181b_100%)] opacity-40 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            />
            <span className="relative inline-flex items-center justify-center overflow-hidden rounded-[3px] px-2 md:px-2.5 lg:px-3.5 py-1.5 bg-[#060608]/90 text-[9px] md:text-[10px] lg:text-xs uppercase tracking-wider lg:tracking-widest font-medium text-zinc-300 transition-colors duration-[600ms] group-hover:text-[#08090b] whitespace-nowrap">
              <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-100 opacity-0 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:h-[220px] group-hover:w-[220px] group-hover:opacity-100 motion-reduce:transition-none" />
              <span className="relative z-10 transition-transform duration-[600ms] ease-out group-hover:scale-[1.03] motion-reduce:transition-none">Sign In</span>
            </span>
          </a>

          {/* GET STARTED CTA with original animated spinning metallic border */}
          <SpinningBorderButton
            onClick={() => {
              if (onGetStartedClick) onGetStartedClick();
              else document.getElementById('cta-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            type="button"
            size="sm"
            className="text-[10px] lg:text-xs"
          >
            <span className="whitespace-nowrap text-xs uppercase tracking-widest font-semibold">Get Started</span>
          </SpinningBorderButton>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label="Toggle navigation menu"
          className="md:hidden p-2 text-zinc-400 hover:text-white rounded border border-white/10 bg-white/[0.02]"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[65px] bg-[#09090b]/98 backdrop-blur-xl border-b border-white/10 px-6 py-8 shadow-2xl transition-all">
          <nav className="flex flex-col gap-4 text-xs uppercase tracking-widest text-zinc-300">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => {
                  setMobileMenuOpen(false);
                  link.onClick?.();
                }}
                className="group relative inline-flex items-center justify-between overflow-hidden rounded p-[1px] transition-all"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-[-140%] animate-spin-border bg-[conic-gradient(from_90deg_at_50%_50%,#18181b_0%,#a1a1aa_50%,#ffffff_75%,#18181b_100%)] opacity-40 group-hover:opacity-100 pointer-events-none"
                />
                <span className="relative w-full py-3 px-4 rounded-[3px] bg-[#0c0d12] text-zinc-200 group-hover:text-white flex items-center justify-between">
                  <span>{link.label}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
                </span>
              </a>
            ))}

            <div className="flex flex-col gap-3 pt-4 mt-2 border-t border-white/10">
              <SpinningBorderButton
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (onGetStartedClick) onGetStartedClick();
                  else document.getElementById('cta-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                type="button"
                size="md"
                className="w-full"
              >
                <span className="whitespace-nowrap text-[10px] lg:text-xs uppercase tracking-wider lg:tracking-widest font-semibold">Get Started</span>
              </SpinningBorderButton>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  window.location.assign('/login');
                }}
                className="w-full py-3 text-center text-xs uppercase tracking-widest text-zinc-400 hover:text-white border border-white/10 rounded bg-[#060608] transition-colors"
              >
                Sign In
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
