import React, { useMemo, useState } from 'react';
import { Check, Copy, ExternalLink, Share2, Users, X } from 'lucide-react';
import { CANONICAL_ORIGIN } from '../../lib/seoMeta';
import { trackEvent } from '../../lib/analytics';

interface ShareStudioModalProps {
  open: boolean;
  onClose: () => void;
  sharePath?: string;
  shareTitle?: string;
  shareContextLabel?: string;
}

export const ShareStudioModal: React.FC<ShareStudioModalProps> = ({
  open,
  onClose,
  sharePath = '/',
  shareTitle = 'MAQAMIR — Interactive Online Piano Studio & Microtonal Music Workstation',
  shareContextLabel = 'Share this studio setup or guide',
}) => {
  const [copiedType, setCopiedType] = useState<'url' | 'invite' | null>(null);

  const canonicalShareUrl = useMemo(() => {
    const clean = sharePath.startsWith('/') ? sharePath : `/${sharePath}`;
    return `${CANONICAL_ORIGIN}${clean === '/' ? '' : clean}`;
  }, [sharePath]);

  const inviteSnippet = useMemo(
    () =>
      `Play and explore ${shareTitle} directly in your browser — free online virtual piano, 140+ world scales & microtonal Maqamat, and 52-parameter Sonic Engine: ${canonicalShareUrl}`,
    [shareTitle, canonicalShareUrl]
  );

  if (!open) return null;

  const copyText = async (type: 'url' | 'invite', text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      trackEvent('share_clicked', { method: `copy_${type}`, path: sharePath });
      setTimeout(() => setCopiedType(null), 1800);
    } catch {
      // clipboard blocked
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return;
    try {
      await navigator.share({
        title: shareTitle,
        text: 'Play virtual piano, world scales, and microtonal instruments online in MAQAMIR.',
        url: canonicalShareUrl,
      });
      trackEvent('share_clicked', { method: 'web_share_api', path: sharePath });
    } catch {
      // user cancelled
    }
  };

  const encodedUrl = encodeURIComponent(canonicalShareUrl);
  const encodedTitle = encodeURIComponent(shareTitle);

  const socialTargets = [
    {
      id: 'x',
      label: 'Share on X',
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`${shareTitle} ${canonicalShareUrl}`)}`,
    },
    {
      id: 'facebook',
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      id: 'reddit',
      label: 'Reddit',
      href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ];

  const supportsWebShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-[#0e0e13] border border-[#D4AF37]/40 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Share2 className="w-4 h-4 text-[#FACC15]" />
            <div>
              <h3 className="text-sm font-extrabold text-white">Share MAQAMIR</h3>
              <p className="text-[11px] text-white/55">{shareContextLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close share dialog"
            className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/15 flex items-center justify-center text-white/75"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Canonical URL Copy Box */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-white/55 block">
              Canonical Link
            </label>
            <div className="flex items-center gap-2 rounded-xl bg-black/55 border border-white/12 px-3 py-2">
              <span className="text-xs font-mono text-white/85 truncate flex-1 select-all">
                {canonicalShareUrl}
              </span>
              <button
                type="button"
                onClick={() => void copyText('url', canonicalShareUrl)}
                className="px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#FACC15] text-black text-[11px] font-extrabold flex items-center gap-1.5 shrink-0"
              >
                {copiedType === 'url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'url' ? 'Copied' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Native + Social Share Actions */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/55">
              Share to Community &amp; Social Networks
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {supportsWebShare && (
                <button
                  type="button"
                  onClick={() => void handleNativeShare()}
                  className="px-3 py-2.5 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 border border-[#D4AF37]/40 text-xs font-bold text-[#FACC15] flex items-center justify-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Device Share</span>
                </button>
              )}
              {socialTargets.map((target) => (
                <a
                  key={target.id}
                  href={target.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackEvent('share_clicked', { method: target.id, path: sharePath })
                  }
                  className="px-3 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-white/85 flex items-center justify-center gap-1.5 transition"
                >
                  <span>{target.label}</span>
                  <ExternalLink className="w-3 h-3 text-white/45" />
                </a>
              ))}
            </div>
          </div>

          {/* Invite a Musician / Student Message */}
          <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Invite a Musician or Student</span>
              </div>
              <button
                type="button"
                onClick={() => void copyText('invite', inviteSnippet)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-white flex items-center gap-1"
              >
                {copiedType === 'invite' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedType === 'invite' ? 'Copied' : 'Copy Invite'}</span>
              </button>
            </div>
            <p className="text-[11px] text-white/60 leading-relaxed select-all">
              {inviteSnippet}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
