import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  Grid3X3,
  HelpCircle,
  Maximize2,
  Minimize2,
  Menu,
  RotateCcw,
  Search,
  Sparkles,
  Check,
  Music2,
  BookOpen,
  Crown,
  Info,
  CreditCard,
} from 'lucide-react';
import { INSTRUMENTS, InstrumentId, PIANO_SKINS } from '../../data/instruments';
import { ROOT_NOTES, RootNote, SCALE_CATEGORIES, ScaleCategory, WORLD_SCALES, WorldScale } from '../../data/scales';

interface StudioHeaderProps {
  currentRoute: string;
  onNavigate: (path: string) => void;
  instrument: InstrumentId;
  onSelectInstrument: (inst: InstrumentId) => void;
  pianoSkin: string;
  onSelectSkin: (skinId: string) => void;
  scale: WorldScale;
  rootNote: RootNote;
  onSelectScale: (scale: WorldScale) => void;
  onSelectRoot: (root: RootNote) => void;
  onResetStudio: () => void;
  onStartTour: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  midiConnectedCount: number;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  onNavigate,
  instrument,
  onSelectInstrument,
  pianoSkin,
  onSelectSkin,
  scale,
  rootNote,
  onSelectScale,
  onSelectRoot,
  onResetStudio,
  onStartTour,
  isFullscreen,
  onToggleFullscreen,
  midiConnectedCount,
}) => {
  const [openMenu, setOpenMenu] = useState<'nav' | 'inst' | 'scale' | 'apps' | null>(null);
  const [scaleSearch, setScaleSearch] = useState('');
  const [scaleCat, setScaleCat] = useState<'All' | ScaleCategory>('All');
  const [skinSearch, setSkinSearch] = useState('');

  useEffect(() => {
    if (!openMenu) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openMenu]);

  const filteredScales = useMemo(() => {
    const q = scaleSearch.trim().toLowerCase();
    return WORLD_SCALES.filter((s) => {
      if (scaleCat !== 'All' && s.category !== scaleCat) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    });
  }, [scaleSearch, scaleCat]);

  const filteredSkins = useMemo(() => {
    const q = skinSearch.trim().toLowerCase();
    if (!q) return PIANO_SKINS;
    return PIANO_SKINS.filter(
      (s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q) || s.tag.toLowerCase().includes(q)
    );
  }, [skinSearch]);

  return (
    <header
      data-studio-header="true"
      className="sticky top-0 z-40 h-11 sm:h-12 w-full bg-daw-surface text-daw-ink border-b border-daw-line px-3 sm:px-5 flex items-center justify-between gap-2 select-none"
    >
      {/* Left Cluster: Hamburger + Brand Logo + Flush Config Trigger + Compact Scale Badge */}
      <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setOpenMenu(openMenu === 'nav' ? null : 'nav')}
          aria-label="Toggle navigation menu"
          aria-expanded={openMenu === 'nav'}
          className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-lg hover:opacity-85 transition-opacity shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
        >
          <Menu className="w-4 h-4 text-white/55 mr-0.5" />
          <img
            src="/logo-dark.webp"
            alt="MaqAmir"
            className="h-5 sm:h-7 w-auto object-contain"
          />
          <span className="text-[17px] sm:text-[18px] font-black brand-font tracking-[-0.03em] text-white hidden sm:inline">
            MaqAmir<span className="text-[#D4AF37]">.</span>
          </span>
        </button>

        <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-white/20 shrink-0" aria-hidden="true" />

        {/* Flush Inline Instrument / Keybed Config Trigger */}
        <div className="relative min-w-0 shrink">
          <button
            type="button"
            data-testid="keyboard-config-name-label"
            onClick={() => setOpenMenu(openMenu === 'inst' ? null : 'inst')}
            className="group flex items-center gap-1 min-w-0 max-w-full px-1 sm:px-1.5 py-1 rounded-md hover:bg-white/[0.05] text-[11.5px] sm:text-[12.5px] font-semibold text-white/85 hover:text-white transition"
          >
            <span className="truncate max-w-[78px] sm:max-w-[160px]">{instrument}</span>
            <ChevronDown className="w-3.5 h-3.5 text-white/45 group-hover:text-white/80 shrink-0" />
          </button>

          {openMenu === 'inst' && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
              <div className="absolute left-0 top-9 z-50 w-[340px] sm:w-[410px] rounded-xl bg-[#101014] border border-white/15 shadow-2xl p-3 space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                      Synthesized Instruments
                    </div>
                    <div className="text-[10px] text-white/50">
                      Real-time Web Audio harmonic synthesis with microtonal engine
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-1.5 max-h-[210px] overflow-y-auto pr-1">
                  {INSTRUMENTS.map((item) => {
                    const active = item.id === instrument;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectInstrument(item.id);
                          setOpenMenu(null);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg border transition flex items-center justify-between ${
                          active
                            ? 'bg-[#D4AF37]/15 border-[#D4AF37]/60 text-white'
                            : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.07] text-white/85'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold flex items-center gap-2">
                            {item.name}
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-[#D4AF37] font-mono">
                              {item.badge}
                            </span>
                          </div>
                          <div className="text-[10px] text-white/55">{item.subtitle}</div>
                        </div>
                        {active && <Check className="w-3.5 h-3.5 text-[#D4AF37]" />}
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-white/10 pt-2 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-white/55">
                      UHD Skins ({PIANO_SKINS.length}) · {PIANO_SKINS.find((s) => s.id === pianoSkin)?.name || pianoSkin}
                    </div>
                    <input
                      type="text"
                      value={skinSearch}
                      onChange={(e) => setSkinSearch(e.target.value)}
                      placeholder="Filter skins..."
                      className="w-28 h-6 px-2 rounded bg-black/60 border border-white/10 text-[10px] text-white placeholder:text-white/35 focus:outline-none focus:border-[#D4AF37]/60"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {filteredSkins.map((skin) => (
                      <button
                        key={skin.id}
                        type="button"
                        title={`${skin.name} (${skin.tag})`}
                        onClick={() => onSelectSkin(skin.id)}
                        className={`px-2 py-1 rounded text-[10px] border transition flex items-center gap-1 ${
                          pianoSkin === skin.id
                            ? 'border-[#D4AF37] bg-[#D4AF37]/20 text-white'
                            : 'border-white/10 bg-white/[0.03] text-white/70 hover:text-white'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: skin.swatch }} />
                        <span>{skin.id}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Compact Bordered Scale / Maqam Pill matching Screenshot 1 */}
        <div className="relative min-w-0 shrink">
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === 'scale' ? null : 'scale')}
            className="h-6 px-2 sm:px-2.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.12] flex items-center gap-1 text-[10.5px] sm:text-[11px] font-medium text-white/80 transition max-w-full"
          >
            <span className="truncate max-w-[80px] sm:max-w-[190px]">
              {scale.name} · {rootNote}
            </span>
            <ChevronDown className="w-3 h-3 text-white/45 shrink-0" />
          </button>

          {openMenu === 'scale' && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
              <div className="absolute left-0 top-8 z-50 w-[340px] sm:w-[440px] rounded-xl bg-[#101014] border border-white/15 shadow-2xl p-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
                      World Scales &amp; Microtonal Maqamat ({WORLD_SCALES.length})
                    </div>
                    <div className="text-[10px] text-white/55">{scale.description}</div>
                  </div>
                </div>

                {/* Root note picker */}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/50 mb-1">
                    Tonic / Root Note
                  </div>
                  <div className="grid grid-cols-12 gap-1">
                    {ROOT_NOTES.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => onSelectRoot(r)}
                        className={`py-1 rounded text-[11px] font-semibold transition ${
                          rootNote === r
                            ? 'bg-[#D4AF37] text-black'
                            : 'bg-white/[0.05] text-white/75 hover:bg-white/[0.12]'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search + category filter */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={scaleSearch}
                      onChange={(e) => setScaleSearch(e.target.value)}
                      placeholder="Search 140+ scales (Rast, Hijaz, Bhairav, Ussak, 24-EDO...)"
                      className="w-full h-8 pl-8 pr-3 rounded-lg bg-black/50 border border-white/10 text-xs text-white placeholder:text-white/35 focus:outline-none focus:border-[#D4AF37]/60"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(['All', ...SCALE_CATEGORIES] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setScaleCat(cat)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                          scaleCat === cat
                            ? 'bg-[#D4AF37]/25 text-[#D4AF37] border border-[#D4AF37]/50'
                            : 'bg-white/[0.04] text-white/60 hover:text-white border border-transparent'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scale list */}
                <div className="max-h-[240px] overflow-y-auto space-y-1 pr-1">
                  {filteredScales.map((s) => {
                    const active = s.id === scale.id;
                    const nonZeroCents = s.centsOffsets.filter((c) => c !== 0);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          onSelectScale(s);
                          setOpenMenu(null);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg border transition flex items-center justify-between gap-2 ${
                          active
                            ? 'bg-[#D4AF37]/15 border-[#D4AF37]/60 text-white'
                            : 'bg-white/[0.025] border-white/[0.05] hover:bg-white/[0.07] text-white/85'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold flex items-center gap-2">
                            <span className="truncate">{s.name}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/65 shrink-0">
                              {s.category}
                            </span>
                            {nonZeroCents.length > 0 && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 shrink-0">
                                µ-Tonal
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-white/50 truncate">{s.description}</div>
                        </div>
                        {active && <Check className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Cluster: MIDI pill + 3x3 Apps + Reset + Help Tour + Fullscreen */}
      <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
        {midiConnectedCount > 0 && (
          <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[10px] font-semibold text-emerald-300 mr-1">
            MIDI ({midiConnectedCount})
          </span>
        )}

        {/* 3x3 App Switcher Grid */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === 'apps' ? null : 'apps')}
            title="MaqAmir Platform Apps & Pages"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white/55 hover:text-white hover:bg-white/[0.06] transition"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>

          {openMenu === 'apps' && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
              <div className="absolute right-0 top-9 z-50 w-64 rounded-xl bg-[#101014] border border-white/15 shadow-2xl p-2 space-y-1">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/45">
                  MaqAmir Platform
                </div>
                {[
                  { path: '/piano', label: 'Piano Studio', sub: 'Microtonal DAW & Realms', icon: Music2 },
                  { path: '/guides', label: 'Guides & Handbook', sub: '6-Part Musical Mastery', icon: BookOpen },
                  { path: '/about', label: 'About MaqAmir', sub: 'Heritage & Architecture', icon: Info },
                  { path: '/pro', label: 'MaqAmir Pro', sub: 'Studio Power Features', icon: Crown },
                  { path: '/pricing', label: 'Pricing & Credits', sub: 'Free Studio + AI Pack', icon: CreditCard },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => {
                        onNavigate(item.path);
                        setOpenMenu(null);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/[0.07] text-left transition"
                    >
                      <Icon className="w-4 h-4 text-[#D4AF37]" />
                      <div>
                        <div className="text-xs font-semibold text-white">{item.label}</div>
                        <div className="text-[10px] text-white/50">{item.sub}</div>
                      </div>
                    </button>
                  );
                })}
                <div className="border-t border-white/10 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onStartTour();
                      setOpenMenu(null);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#D4AF37]/10 text-left transition"
                  >
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <div className="text-xs font-semibold text-[#D4AF37]">Restart 8-Step Tutorial</div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onResetStudio}
          title="Reset Sonic Engine & Latched Notes"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white/55 hover:text-white hover:bg-white/[0.06] transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onStartTour}
          title="8-Step Interactive Onboarding Tour"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white/55 hover:text-[#D4AF37] hover:bg-white/[0.06] transition"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onToggleFullscreen}
          title="Toggle Fullscreen"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white/55 hover:text-white hover:bg-white/[0.06] transition"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Left Hamburger Nav Drawer */}
      {openMenu === 'nav' && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpenMenu(null)} />
          <div className="fixed left-0 top-11 sm:top-12 bottom-0 z-50 w-64 bg-[#0d0d10] border-r border-white/10 p-4 flex flex-col justify-between shadow-2xl">
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 px-2 mb-2">
                Navigation
              </div>
              {[
                { path: '/piano', label: 'Piano Studio' },
                { path: '/guides', label: 'Guides & Handbook' },
                { path: '/about', label: 'About MaqAmir' },
                { path: '/pro', label: 'Pro Studio' },
                { path: '/pricing', label: 'Pricing' },
              ].map((link) => (
                <button
                  key={link.path}
                  type="button"
                  onClick={() => {
                    onNavigate(link.path);
                    setOpenMenu(null);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-white/85 hover:bg-white/[0.07] hover:text-[#D4AF37] transition"
                >
                  {link.label}
                </button>
              ))}
            </div>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[11px] text-white/60 space-y-1">
              <div className="font-semibold text-[#D4AF37]">Keyboard Shortcuts</div>
              <div>White keys: A S D F G H J K L</div>
              <div>Black keys: W E · T Y U · O P</div>
              <div>Octave: Z / X · Sustain: Space</div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
