
import React from 'react';

interface ObjectTooltipProps {
  name: string;
  description: string;
  historicalContext?: string;
  mousePos: { x: number; y: number };
}

const ObjectTooltip: React.FC<ObjectTooltipProps> = ({ name, description, historicalContext, mousePos }) => {
  if (!name) return null;

  return (
    <div 
      className="fixed pointer-events-none z-50 w-72 md:w-80 bg-black/90 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 overflow-hidden"
      style={{ 
        left: Math.min(window.innerWidth - 340, mousePos.x + 24), 
        top: Math.min(window.innerHeight - 300, mousePos.y + 24),
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
            <h4 className="text-[11px] font-black text-white uppercase tracking-widest">{name}</h4>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Description Section */}
        <section>
          <h5 className="text-[9px] text-gray-500 uppercase font-black mb-1.5 tracking-widest">Observations</h5>
          <p className="text-xs text-gray-200 leading-relaxed font-medium">
            {description}
          </p>
        </section>

        {/* Historical Context Section */}
        {historicalContext && (
          <section className="pt-3 border-t border-white/5">
            <h5 className="text-[9px] text-blue-400/80 uppercase font-black mb-1.5 tracking-widest">Historical Context</h5>
            <p className="text-[11px] text-gray-400 leading-relaxed italic font-serif">
              {historicalContext}
            </p>
          </section>
        )}
      </div>

      {/* Footer Decoration */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50" />
    </div>
  );
};

export default ObjectTooltip;
