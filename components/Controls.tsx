
import React from 'react';

interface ControlsProps {
  splatScale: number;
  setSplatScale: (v: number) => void;
  depthIntensity: number;
  setDepthIntensity: (v: number) => void;
  pointSize: number;
  setPointSize: (v: number) => void;
  onReset: () => void;
}

const Controls: React.FC<ControlsProps> = ({ 
  splatScale, setSplatScale, 
  depthIntensity, setDepthIntensity,
  pointSize, setPointSize,
  onReset 
}) => {
  return (
    <div className="absolute bottom-6 left-6 right-6 md:left-auto md:w-80 p-6 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col gap-6 select-none z-10">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold tracking-tight">World Config</h2>
        <button 
            onClick={onReset}
            className="text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors"
        >
            New Art
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400 uppercase font-bold">
            <span>Splat Scale</span>
            <span>{splatScale.toFixed(1)}x</span>
          </div>
          <input 
            type="range" min="0.1" max="5" step="0.1" 
            value={splatScale} 
            onChange={(e) => setSplatScale(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400 uppercase font-bold">
            <span>Depth Variance</span>
            <span>{depthIntensity.toFixed(1)}x</span>
          </div>
          <input 
            type="range" min="0" max="10" step="0.5" 
            value={depthIntensity} 
            onChange={(e) => setDepthIntensity(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400 uppercase font-bold">
            <span>Particle Size</span>
            <span>{pointSize.toFixed(1)}</span>
          </div>
          <input 
            type="range" min="0.5" max="15" step="0.5" 
            value={pointSize} 
            onChange={(e) => setPointSize(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>
      </div>

      <div className="text-[10px] text-gray-500 leading-relaxed italic">
        Tip: Depth is estimated using AI scene analysis. Brighter pixels are naturally pushed forward.
      </div>
    </div>
  );
};

export default Controls;
