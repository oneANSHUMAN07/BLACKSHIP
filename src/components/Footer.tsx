import React, { useState } from 'react';
import { X, Shield, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  const [modalContent, setModalContent] = useState<'privacy' | 'terms' | null>(null);

  return (
    <footer className="border-t border-white/[0.08] bg-[#040406] text-zinc-400 py-16 sm:py-20 text-xs">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 lg:gap-12 mb-16">
          {/* Brand Column with Official BLACKSHIP Logo */}
          <div className="col-span-2 space-y-4">
            <a
              href="#"
              className="inline-block group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
            >
              <img
                src="/assets/aistudio/blackship_official_logo.svg"
                alt="BLACKSHIP — Autonomous Brand Governance"
                className="w-[220px] max-w-full h-auto object-contain select-none transition-opacity duration-300 group-hover:opacity-95"
                loading="lazy"
              />
            </a>
            <p className="text-zinc-500 max-w-sm text-xs leading-relaxed">
              AI-powered autonomous brand governance. Codifying identity standards into real-time deterministic safeguards for modern brand teams.
            </p>
            <div className="pt-2 flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
              <span>Interactive Governance Prototype</span>
            </div>
            <p className="pt-1 text-xs text-zinc-500">
              Built by <span className="text-zinc-300">ANSHUMAN SINGH</span> &amp; <span className="text-zinc-300">SATYAM KUMAR</span>
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="font-mono uppercase tracking-widest text-zinc-200 text-[11px] mb-4 font-semibold">
              Product
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Identity Management
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  AI Content Analysis
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Brand Compliance
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Smart Corrections
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Performance Reports
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="font-mono uppercase tracking-widest text-zinc-200 text-[11px] mb-4 font-semibold">
              Resources
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="/login" className="hover:text-white transition-colors">
                  Sign In to Workspace
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  Governance Invariants
                </a>
              </li>
              <li>
                <a href="#cta-section" className="hover:text-white transition-colors">
                  Executive Briefing
                </a>
              </li>
            </ul>
          </div>

          {/* About & Legal Column */}
          <div>
            <h4 className="font-mono uppercase tracking-widest text-zinc-200 text-[11px] mb-4 font-semibold">
              About & Legal
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  About BLACKSHIP
                </a>
              </li>
              <li>
                <a href="#cta-section" className="hover:text-white transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setModalContent('privacy')}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setModalContent('terms')}
                  className="hover:text-white transition-colors text-left cursor-pointer"
                >
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-600 font-mono">
          <div>
            &copy; {new Date().getFullYear()} BLACKSHIP TECHNOLOGIES INC. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-6">
            <span>Deterministic Rule Engine</span>
            <span>·</span>
            <span>Interactive Preview</span>
            <span>·</span>
            <span>Component Showcase</span>
          </div>
        </div>
      </div>

      {/* Accessible Privacy / Terms Modal */}
      {modalContent && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-lg rounded-xl border border-white/20 bg-[#0c0d12] p-6 sm:p-8 shadow-2xl text-zinc-300">
            <button
              onClick={() => setModalContent(null)}
              aria-label="Close dialog"
              className="absolute top-5 right-5 p-1 rounded text-zinc-400 hover:text-white border border-white/10 bg-white/[0.04] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-4 text-white">
              {modalContent === 'privacy' ? (
                <Lock className="w-5 h-5 text-zinc-300" />
              ) : (
                <Shield className="w-5 h-5 text-zinc-300" />
              )}
              <h3 className="font-editorial text-2xl uppercase tracking-wider text-white">
                {modalContent === 'privacy' ? 'Privacy & Data Sovereignty' : 'Terms of Governance Service'}
              </h3>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-zinc-400 border-t border-white/10 pt-4">
              {modalContent === 'privacy' ? (
                <>
                  <p>
                    BLACKSHIP is designed on a principle of zero-retention IP isolation. Enterprise brand guidelines, internal memos, draft campaigns, and design tokens processed by the governance engine are strictly isolated.
                  </p>
                  <p>
                    Proprietary brand assets are never stored in shared data pools, never indexed by public search, and never used to train generalized foundation models.
                  </p>
                  <p>
                    All policy evaluations run within secure single-tenant isolation boundaries.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Use of the BLACKSHIP Brand Governance platform is subject to deterministic policy execution agreements.
                  </p>
                  <p>
                    The platform evaluates and flags content based on the customer’s uploaded invariants and policies. Suggested corrections are advisory neural alignments that require human editorial confirmation before release.
                  </p>
                  <p>
                    Demonstration features on this public landing page use simulated rules and sample data for evaluation purposes.
                  </p>
                </>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setModalContent(null)}
                className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-black bg-white rounded hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
