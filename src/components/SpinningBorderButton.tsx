import React from 'react';
import { ArrowRight } from 'lucide-react';

interface SpinningBorderButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'solid' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const SpinningBorderButton: React.FC<SpinningBorderButtonProps> = ({
  children,
  variant = 'solid',
  size = 'md',
  className = '',
  ...props
}) => {
  const sizeClasses = {
    sm: 'py-2 px-6 lg:px-10 text-xs',
    md: 'py-3 px-10 text-xs sm:text-sm',
    lg: 'py-4 px-12 text-sm sm:text-base'
  }[size];

  return (
    <button
      {...props}
      className={`group relative inline-flex items-center justify-center overflow-hidden rounded-full p-[1px] font-medium transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 active:scale-[0.98] ${className}`}
    >
      {/* Animated rotating metallic gradient border */}
      <span
        aria-hidden="true"
        className="absolute inset-[-100%] animate-spin-border bg-[conic-gradient(from_90deg_at_50%_50%,#18181b_0%,#a1a1aa_50%,#ffffff_75%,#18181b_100%)] opacity-80 group-hover:opacity-100 transition-opacity duration-300"
      />

      {/* Button content surface */}
      <span
        className={`relative inline-flex h-full w-full items-center justify-center overflow-hidden gap-2 rounded-full transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:rounded-[7px] group-hover:text-[#08090b] ${sizeClasses} ${
          variant === 'solid'
            ? 'bg-[#09090b] text-white'
            : 'bg-[#0c0d11]/90 backdrop-blur-md text-[#f4f4f5]'
        }`}
      >
        <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-100 opacity-0 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:h-[260px] group-hover:w-[260px] group-hover:opacity-100 motion-reduce:transition-none" />
        <ArrowRight aria-hidden="true" className="absolute left-[-25%] z-10 h-4 w-4 stroke-current transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:left-4 motion-reduce:transition-none" />
        <span className="relative z-10 -translate-x-2 transition-transform duration-[800ms] ease-out group-hover:translate-x-2 motion-reduce:transition-none">{children}</span>
        <ArrowRight aria-hidden="true" className="absolute right-4 z-10 h-4 w-4 stroke-current transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:right-[-25%] motion-reduce:transition-none" />
      </span>
    </button>
  );
};
