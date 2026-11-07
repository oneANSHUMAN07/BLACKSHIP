import React from 'react';

export const TrustStrip: React.FC = () => {
  const capabilities = [
    'Brand Identity',
    'Content Governance',
    'Smart Corrections',
    'Brand Memory',
  ];

  return (
    <section className="border-y border-white/[0.08] bg-[#070709] py-6 sm:py-7">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-6 sm:gap-x-10 gap-y-3">
          {capabilities.map((item, index) => (
            <React.Fragment key={item}>
              <span className="font-editorial text-sm sm:text-base uppercase tracking-[0.2em] font-bold text-zinc-300 hover:text-white transition-colors duration-200">
                {item}
              </span>
              {index < capabilities.length - 1 && (
                <span
                  aria-hidden="true"
                  className="text-zinc-600 text-xs select-none"
                >
                  ·
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};
