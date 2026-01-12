
import React, { useRef, useEffect } from 'react';

interface SceneObject {
  name: string;
  depth: number;
  description: string;
  historicalContext?: string;
}

interface DiscoverySliderProps {
  objects: SceneObject[];
  selectedName: string | null;
  onSelect: (name: string | null) => void;
}

const DiscoverySlider: React.FC<DiscoverySliderProps> = ({ objects, selectedName, onSelect }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to selected element
  useEffect(() => {
    if (selectedName && scrollRef.current) {
      const selectedEl = scrollRef.current.querySelector(`[data-name="${selectedName}"]`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [selectedName]);

  return (
    <div className="absolute bottom-6 left-6 right-6 md:right-96 md:bottom-6 pointer-events-none z-20 flex flex-col items-start gap-4 transition-all duration-500">
      
      {/* Detail Panel - Appears above slider when an item is selected */}
      {selectedName && (
        <div className="w-full md:max-w-xl pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-500">
          <div className="bg-black/80 backdrop-blur-2xl border border-white/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
            {/* Decorative background pulse */}
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            {objects.filter(o => o.name === selectedName).map(obj => (
              <div key={obj.name} className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1 block">Selected Segment</span>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">{obj.name}</h2>
                  </div>
                  <button 
                    onClick={() => onSelect(null)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Observations</h4>
                    <p className="text-xs text-white/70 leading-relaxed font-medium">{obj.description}</p>
                  </div>
                  {obj.historicalContext && (
                    <div className="border-l border-white/10 pl-6">
                      <h4 className="text-[9px] font-black uppercase tracking-widest text-blue-400/60 mb-2">Contextual Archive</h4>
                      <p className="text-[10px] text-white/40 leading-relaxed font-serif italic">{obj.historicalContext}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* The Horizontal Slider */}
      <div className="w-full flex flex-col pointer-events-auto">
        <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">Discovery Carousel</span>
            <div className="h-[1px] flex-1 bg-white/5" />
        </div>
        
        <div 
          ref={scrollRef}
          className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-1 mask-linear-horizontal"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {objects.map((obj, idx) => {
            const isSelected = selectedName === obj.name;
            return (
              <button
                key={`${obj.name}-${idx}`}
                data-name={obj.name}
                onClick={() => onSelect(isSelected ? null : obj.name)}
                className={`flex-shrink-0 flex items-center gap-4 px-5 py-3 rounded-xl transition-all duration-300 border scroll-snap-align-center group ${
                  isSelected 
                    ? 'bg-blue-600/20 border-blue-500/50 scale-105 shadow-[0_0_30px_rgba(59,130,246,0.2)]' 
                    : 'bg-black/40 backdrop-blur-md border-white/5 hover:border-white/20 hover:bg-black/60'
                }`}
              >
                <div className={`text-[10px] font-mono font-bold ${isSelected ? 'text-blue-400' : 'text-white/20'}`}>
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div className="flex flex-col items-start">
                    <span className={`text-xs font-black uppercase tracking-wider whitespace-nowrap ${isSelected ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}>
                    {obj.name}
                    </span>
                    <div className={`h-0.5 mt-1 transition-all duration-500 bg-blue-500 ${isSelected ? 'w-full' : 'w-0 group-hover:w-4'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scroll-snap-align-center {
          scroll-snap-align: center;
        }
        .mask-linear-horizontal {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
      `}</style>
    </div>
  );
};

export default DiscoverySlider;
