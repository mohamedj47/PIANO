import React, { useEffect, useState } from 'react';
import { HelpCircle, Sparkles, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { TUTORIAL_STEPS } from '../../data/tutorialSteps';

interface OnboardingTutorialProps {
  stepIndex: number; // 0..7
  onStepChange: (nextIdx: number) => void;
  onClose: () => void;
  onOpenGuides: () => void;
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  stepIndex,
  onStepChange,
  onClose,
  onOpenGuides,
}) => {
  const step = TUTORIAL_STEPS[stepIndex] || TUTORIAL_STEPS[0];
  const progressPct = ((stepIndex + 1) / TUTORIAL_STEPS.length) * 100;
  const [spotlightRect, setSpotlightRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const updateRect = () => {
      const sel =
        stepIndex === 7
          ? '[data-tour-target="sonic-engine-container"]'
          : step.highlightSelector;
      if (!sel) {
        setSpotlightRect(null);
        return;
      }
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) {
        setSpotlightRect(null);
        return;
      }
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) {
        setSpotlightRect(null);
        return;
      }
      setSpotlightRect({
        top: r.top - 4,
        left: r.left - 4,
        width: r.width + 8,
        height: r.height + 8,
      });
    };

    const t = window.setTimeout(updateRect, 60);
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [stepIndex, step.highlightSelector]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (stepIndex < TUTORIAL_STEPS.length - 1) onStepChange(stepIndex + 1);
        else onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (stepIndex > 0) onStepChange(stepIndex - 1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [stepIndex, onStepChange, onClose]);

  // Card placement: Step 5 top-right (Mandala), Step 8 top-center above XY pad, others centered cleanly
  const cardPlacementClass =
    step.cardPosition === 'top-right'
      ? 'md:ml-auto md:mb-auto md:mt-16 md:mr-4'
      : stepIndex === 7
      ? 'md:mb-auto md:mt-14'
      : '';

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4">
      {/* Dynamic Target Spotlight Cutout Ring */}
      {spotlightRect && (
        <div
          className="fixed rounded-xl border-2 border-[#D4AF37] pointer-events-none transition-all duration-200"
          style={{
            top: `${spotlightRect.top}px`,
            left: `${spotlightRect.left}px`,
            width: `${spotlightRect.width}px`,
            height: `${spotlightRect.height}px`,
            boxShadow: '0 0 0 9999px rgba(5, 5, 5, 0.56), 0 0 24px rgba(212, 175, 55, 0.55)',
          }}
        />
      )}

      <div
        className={`relative z-10 pointer-events-auto w-full max-w-[360px] rounded-2xl bg-[#0d0d11]/95 backdrop-blur-xl border border-[#D4AF37]/50 shadow-[0_20px_60px_rgba(0,0,0,0.88)] p-5 text-left transition-all ${cardPlacementClass}`}
      >
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold tracking-widest uppercase text-[#FACC15]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              STEP {step.step} OF {TUTORIAL_STEPS.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenGuides}
              title="Open Full 6-Part Handbook"
              className="w-6 h-6 rounded-full flex items-center justify-center text-white/55 hover:text-white hover:bg-white/10"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close Tour"
              className="w-6 h-6 rounded-full flex items-center justify-center text-white/55 hover:text-white hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-[#D4AF37] to-[#FACC15] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Title & Body */}
        <h3 className="text-[15px] font-extrabold text-white mb-2 leading-snug">{step.title}</h3>
        <p className="text-[12.5px] leading-relaxed text-white/75 mb-5">{step.body}</p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={() => onStepChange(Math.max(0, stepIndex - 1))}
            className="inline-flex items-center gap-1 text-xs font-semibold text-white/60 hover:text-white disabled:opacity-30 transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          {stepIndex < TUTORIAL_STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => onStepChange(stepIndex + 1)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#FACC15] text-black text-xs font-extrabold transition shadow"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-[#D4AF37] hover:bg-[#FACC15] text-black text-xs font-extrabold transition shadow"
            >
              <span>Finish</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
