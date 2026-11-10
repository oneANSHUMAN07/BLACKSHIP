import React, { useEffect, useState } from 'react';

interface AppOpeningProps {
  onComplete: () => void;
}

const OPENING_DURATION = 1800;

export const AppOpening: React.FC<AppOpeningProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    let progressTimer = 0;
    let finishTimer = 0;

    progressTimer = window.setInterval(() => {
      const nextProgress = Math.min(100, Math.round(((Date.now() - startedAt) / OPENING_DURATION) * 100));
      setProgress(nextProgress);

      if (nextProgress >= 100) {
        window.clearInterval(progressTimer);
        finishTimer = window.setTimeout(onComplete, 320);
      }
    }, 32);
    return () => {
      window.clearInterval(progressTimer);
      window.clearTimeout(finishTimer);
    };
  }, [onComplete]);

  return (
    <div className={`app-opening-screen${progress >= 100 ? ' app-opening-screen--closing' : ''}`} role="status" aria-label="Opening your BLACKSHIP workspace">
      <div className="app-opening-topline">
        <span className="app-opening-mark" aria-hidden="true">B</span>
        <span>BLACKSHIP <span className="app-opening-slash">//</span> BRAND GOVERNANCE</span>
      </div>

      <div className="app-opening-title" aria-hidden="true">
        <span className="app-opening-word app-opening-word--one">BRAND</span>
        <span className="app-opening-word app-opening-word--two">IN</span>
        <span className="app-opening-word app-opening-word--three">CONTROL</span>
      </div>

      <div className="app-opening-footer">
        <div className="app-opening-progress-copy">
          <span className="app-opening-counter">{String(progress).padStart(2, '0')}</span>
          <span className="app-opening-caption">Preparing your workspace</span>
        </div>
        <span className="app-opening-status">POLICY · MEMORY · AUDIT</span>
        <div className="app-opening-progress-track" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
      </div>
    </div>
  );
};
