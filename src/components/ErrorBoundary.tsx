import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  declare props: { children: React.ReactNode };
  declare state: ErrorBoundaryState;

  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Unexpected error occurred.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Application ErrorBoundary caught:', error, info);
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    let friendlyText = this.state.message;
    try {
      const parsed = JSON.parse(this.state.message);
      if (parsed?.error) {
        friendlyText = parsed.error;
      }
    } catch {
      // keep raw message
    }

    return (
      <div className="min-h-screen bg-[#050505] text-[#F6F4EE] flex items-center justify-center p-6">
        <div className="max-w-lg w-full rounded-2xl bg-[#0e0e13] border border-red-500/40 p-6 space-y-4">
          <div className="flex items-center gap-3 text-red-400">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <h2 className="text-lg font-extrabold">Studio Service Notice</h2>
          </div>
          <p className="text-sm text-white/75 break-words">{friendlyText}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#FACC15] text-black text-xs font-extrabold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reload Studio</span>
          </button>
        </div>
      </div>
    );
  }
}
