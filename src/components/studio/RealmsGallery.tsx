import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { REALMS, RealmDefinition, RealmId } from '../../data/realms';

interface RealmsGalleryProps {
  activeRealm: RealmId;
  onSelectRealm: (realm: RealmDefinition) => void;
}

export const RealmsGallery: React.FC<RealmsGalleryProps> = ({ activeRealm, onSelectRealm }) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const current = REALMS.find((r) => r.id === activeRealm) || REALMS[0];

  return (
    <section className="w-full px-3 sm:px-4 py-1.5 bg-[#050505] select-none">
      {/* Header Row matching Screenshot 1 */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase">
          <span className="w-5 h-5 rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] text-[10px]">
            ✦
          </span>
          <span className="text-white/85">REALMS</span>
          <span className="text-white/35">·</span>
          <span className="text-[#D4AF37] font-semibold normal-case tracking-normal text-[12px]">
            {current.name}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Scroll Realms Left"
            onClick={() => scrollRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
            className="w-6 h-6 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            aria-label="Scroll Realms Right"
            onClick={() => scrollRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
            className="w-6 h-6 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Horizontal Realm Cards matching cleaned-piano.html (148x94px, rounded-[8px]) */}
      <div
        ref={scrollRef}
        className="flex items-center overflow-x-auto snap-x snap-mandatory no-scrollbar p-1 scroll-px-1 gap-2.5"
      >
        {REALMS.map((realm) => {
          const isActive = realm.id === activeRealm;
          return (
            <button
              key={realm.id}
              id={`realm-card-${realm.queryParam}`}
              type="button"
              data-realm-card={realm.queryParam}
              aria-pressed={isActive}
              onClick={() => onSelectRealm(realm)}
              title={realm.interactionHint}
              style={{ width: '148px', height: '88px', flexShrink: 0 }}
              className={`group relative rounded-[8px] overflow-hidden snap-start text-left border transition-all duration-150 focus:outline-none active:scale-[0.98] ${
                isActive
                  ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/60 shadow-[0_0_20px_rgba(212,175,55,0.28)]'
                  : 'border-white/[0.12] hover:border-white/35'
              }`}
            >
              <img
                src={realm.image}
                alt={realm.name}
                loading="lazy"
                decoding="async"
                draggable={false}
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition duration-300"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-2.5 pt-4 pb-1.5 flex flex-col justify-end pointer-events-none">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-montserrat font-bold text-[11px] tracking-[-0.02em] text-white truncate">
                    {realm.name}
                  </span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" />
                  )}
                </div>
                <span className="text-[9.5px] font-medium text-white/75 truncate">
                  {realm.subtitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
