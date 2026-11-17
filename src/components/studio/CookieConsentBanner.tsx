import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface CookieConsentBannerProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onLearnMore: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  visible,
  onAccept,
  onDecline,
  onLearnMore,
}) => {
  if (!visible) return null;

  return (
    <div className="fixed bottom-3 inset-x-0 mx-auto z-50 w-[94%] max-w-[540px] rounded-xl bg-[#0f0f13]/95 backdrop-blur-xl border border-white/15 px-4 py-2.5 shadow-2xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 text-xs text-white/80">
        <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
        <span>
          We use analytics to improve your experience.{' '}
          <button
            type="button"
            onClick={onLearnMore}
            className="text-[#D4AF37] hover:underline font-medium"
          >
            Learn more
          </button>
        </span>
      </div>
      <div className="flex items-center gap-2 ml-auto shrink-0">
        <button
          type="button"
          onClick={onDecline}
          className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[11px] font-bold uppercase tracking-wider text-white/75"
        >
          Decline
        </button>
        <button
          type="button"
          onClick={onAccept}
          className="px-3.5 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#FACC15] text-[11px] font-extrabold uppercase tracking-wider text-black"
        >
          Accept
        </button>
      </div>
    </div>
  );
};
