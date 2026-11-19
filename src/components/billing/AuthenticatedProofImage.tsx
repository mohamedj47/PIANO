import React, { useEffect, useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthenticatedProofImageProps {
  proofImageUrl: string;
  requestId: string;
  alt?: string;
  className?: string;
}

export const AuthenticatedProofImage: React.FC<AuthenticatedProofImageProps> = ({
  proofImageUrl,
  requestId,
  alt = 'InstaPay Transfer Proof',
  className = 'max-h-[78vh] w-auto rounded-xl object-contain',
}) => {
  const { getIdToken } = useAuth();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    async function loadPrivateImage() {
      setLoading(true);
      setError(null);
      setObjectUrl(null);
      try {
        const token = await getIdToken();
        const sep = proofImageUrl.includes('?') ? '&' : '?';
        const url = `${proofImageUrl}${sep}requestId=${encodeURIComponent(requestId)}`;
        const resp = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!resp.ok) {
          let errMsg = `HTTP ${resp.status}`;
          try {
            const j = (await resp.json()) as { error?: string };
            if (j?.error) errMsg = j.error;
          } catch {
            // ignore non-json error body
          }
          throw new Error(errMsg);
        }
        const blob = await resp.blob();
        createdUrl = URL.createObjectURL(blob);
        if (active) {
          setObjectUrl(createdUrl);
        } else {
          URL.revokeObjectURL(createdUrl);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load private proof image.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (proofImageUrl && requestId) {
      void loadPrivateImage();
    } else {
      setLoading(false);
      setError('Missing proof image reference.');
    }

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [proofImageUrl, requestId, getIdToken]);

  if (loading) {
    return (
      <div className="min-w-[260px] min-h-[200px] flex flex-col items-center justify-center gap-2 text-xs text-white/65 p-6">
        <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
        <span>جاري فك تشفير وتحميل صورة الإيصال الخاصة...</span>
      </div>
    );
  }

  if (error || !objectUrl) {
    return (
      <div className="min-w-[260px] max-w-md rounded-xl bg-red-500/15 border border-red-500/40 p-5 flex items-start gap-2.5 text-xs text-red-200">
        <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
        <div>
          <div className="font-bold">تعذر عرض الإيصال المحمي</div>
          <div className="text-red-200/80 mt-1">{error || 'Unauthorized proof access.'}</div>
        </div>
      </div>
    );
  }

  return <img src={objectUrl} alt={alt} className={className} />;
};
