import React from 'react';
import {
  Activity,
  Repeat,
  Piano,
  Sparkles,
  Mic,
  FolderOpen,
  Crown,
  Undo2,
  Redo2,
  Bluetooth,
  Cable,
  Settings,
} from 'lucide-react';

export type DrawerTabId = 'beat' | 'loop' | 'inst' | 'sounds' | 'rec' | 'library' | 'pro' | 'ask-amir' | null;

interface TransportBottomBarProps {
  activeDrawer: DrawerTabId;
  onToggleDrawer: (tab: Exclude<DrawerTabId, null>) => void;
  beatPlaying: boolean;
  isRecording: boolean;
  recordingsCount: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  midiCount: number;
  onScanBluetoothMidi: () => void;
}

export const TransportBottomBar: React.FC<TransportBottomBarProps> = ({
  activeDrawer,
  onToggleDrawer,
  beatPlaying,
  isRecording,
  recordingsCount,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  midiCount,
  onScanBluetoothMidi,
}) => {
  return (
    <footer className="transport-bar-themed w-full bg-[#060608]/95 border-t border-white/[0.08] px-2 sm:px-4 pt-1 pb-1.5 select-none z-30">
      {/* Subtle Telemetry & Command Center trigger above dock matching Screenshot 8 */}
      <div className="flex items-center justify-center gap-3 text-[10px] text-white/40 pb-1">
        <button
          type="button"
          onClick={() => onToggleDrawer('pro')}
          title="Open Hardware MIDI & Command Center"
          className={`inline-flex items-center gap-1 transition ${
            midiCount > 0 ? 'text-emerald-400 font-semibold' : 'text-white/55 hover:text-[#D4AF37]'
          }`}
        >
          <Cable className="w-3 h-3" />
          <span>MIDI {midiCount > 0 ? `(${midiCount})` : ''}</span>
        </button>
        <span className="w-[1px] h-2.5 bg-white/15" aria-hidden="true" />
        <button
          type="button"
          onClick={onScanBluetoothMidi}
          title="Scan for Wireless Bluetooth MIDI Controller"
          className="inline-flex items-center gap-1 text-white/55 hover:text-sky-300 transition"
        >
          <Bluetooth className="w-3 h-3" />
          <span>Bluetooth</span>
        </button>
        <span className="w-[1px] h-2.5 bg-white/15" aria-hidden="true" />
        <button
          type="button"
          onClick={() => onToggleDrawer('pro')}
          className="inline-flex items-center gap-1 text-white/60 hover:text-[#D4AF37] transition"
        >
          <Settings className="w-3 h-3" />
          <span>Command Center</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-1 sm:gap-2 max-w-[1440px] mx-auto">
        {/* Left: BEAT & LOOP with colored bottom pills */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onToggleDrawer('beat')}
            className={`group relative w-9 sm:w-11 h-10 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition ${
              activeDrawer === 'beat' || beatPlaying
                ? 'bg-sky-500/15 border-sky-400/50 text-sky-300'
                : 'border-white/10 text-white/60 hover:text-white hover:border-white/25'
            }`}
          >
            <Activity className={`w-3.5 sm:w-4 h-3.5 sm:h-4 text-brand-edu ${beatPlaying ? 'animate-pulse' : ''}`} />
            <span className="text-[7px] sm:text-[8px] font-bold tracking-wider uppercase">BEAT</span>
            <span className="absolute bottom-0.5 inset-x-0 mx-auto w-4 h-0.5 rounded-full bg-brand-edu opacity-45" />
          </button>

          <button
            type="button"
            onClick={() => onToggleDrawer('loop')}
            className={`group relative w-9 sm:w-11 h-10 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition ${
              activeDrawer === 'loop'
                ? 'bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#FACC15]'
                : 'border-white/10 text-white/60 hover:text-white hover:border-white/25'
            }`}
          >
            <Repeat className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#D4AF37]" />
            <span className="text-[7px] sm:text-[8px] font-bold tracking-wider uppercase">LOOP</span>
            <span className="absolute bottom-0.5 inset-x-0 mx-auto w-4 h-0.5 rounded-full bg-[#D4AF37] opacity-45" />
          </button>
        </div>

        {/* Center: INST · SOUNDS · REC · LIBRARY · PRO */}
        <div className="min-w-0 flex-1 flex items-center justify-start sm:justify-center gap-1 sm:gap-2.5 overflow-x-auto scrollbar-hide">
          {[
            { id: 'inst' as const, label: 'INST', icon: Piano, barColor: 'bg-[#D4AF37]' },
            { id: 'sounds' as const, label: 'SOUNDS', icon: Sparkles, barColor: 'bg-purple-400' },
            {
              id: 'rec' as const,
              label: isRecording ? 'REC ●' : 'REC',
              icon: Mic,
              barColor: 'bg-red-500',
              extraClass: isRecording ? 'bg-red-500/20 border-red-500 text-red-400' : '',
            },
            {
              id: 'library' as const,
              label: recordingsCount > 0 ? `LIB (${recordingsCount})` : 'LIBRARY',
              icon: FolderOpen,
              barColor: 'bg-emerald-400',
            },
            { id: 'pro' as const, label: 'PRO', icon: Crown, barColor: 'bg-amber-400' },
          ].map((item) => {
            const Icon = item.icon;
            const active = activeDrawer === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToggleDrawer(item.id)}
                className={`group relative w-9 sm:w-11 h-10 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition shrink-0 ${
                  active
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37]/60 text-[#FACC15]'
                    : item.extraClass || 'border-white/10 text-white/60 hover:text-white hover:border-white/25'
                }`}
              >
                <Icon className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                <span className="text-[7px] sm:text-[8px] font-bold tracking-wider uppercase">{item.label}</span>
                <span className={`absolute bottom-0.5 inset-x-0 mx-auto w-4 h-0.5 rounded-full ${item.barColor} opacity-45`} />
              </button>
            );
          })}
        </div>

        {/* Right: Gold-bordered Undo | Redo capsule */}
        <div className="flex items-center rounded-xl border border-[#D4AF37]/50 bg-gradient-to-b from-[#17130a] to-[#0c0c10] overflow-hidden shrink-0">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            title="Undo Studio Change"
            className="flex items-center gap-1 px-2 sm:px-2.5 py-2 text-[10px] font-semibold text-white/80 hover:text-white disabled:opacity-35 transition border-r border-white/10"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={onRedo}
            title="Redo Studio Change"
            className="flex items-center gap-1 px-2 sm:px-2.5 py-2 text-[10px] font-semibold text-white/80 hover:text-white disabled:opacity-35 transition"
          >
            <Redo2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Redo</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
