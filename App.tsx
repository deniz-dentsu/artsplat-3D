
import React, { useState, useCallback } from 'react';
import { analyzePainting } from './services/geminiService';
import { AppStatus, SceneAnalysis, SplatData } from './types';
import Uploader from './components/Uploader';
import Viewer3D from './components/Viewer3D';
import Controls from './components/Controls';
import ObjectTooltip from './components/ObjectTooltip';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<SceneAnalysis | null>(null);
  const [splatData, setSplatData] = useState<SplatData | null>(null);
  
  // Hover State
  const [hoveredObj, setHoveredObj] = useState<{ name: string; description: string; historicalContext?: string } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Settings
  const [splatScale, setSplatScale] = useState(1.5);
  const [depthIntensity, setDepthIntensity] = useState(4.0);
  const [pointSize, setPointSize] = useState(6.0);

  const processImageToSplat = useCallback(async (base64: string, aiAnalysis: SceneAnalysis) => {
    setStatus(AppStatus.GENERATING);
    
    const img = new Image();
    img.src = `data:image/jpeg;base64,${base64}`;
    await new Promise((resolve) => { img.onload = resolve; });

    let width = Math.max(1, img.width);
    let height = Math.max(1, img.height);
    
    const MAX_SIZE = 384; 
    if (width > MAX_SIZE || height > MAX_SIZE) {
      const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
      width = Math.max(1, Math.floor(width * ratio));
      height = Math.max(1, Math.floor(height * ratio));
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    const count = width * height;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    const sanitizedObjects = (aiAnalysis.objects || []).map(obj => ({
        ...obj,
        depth: typeof obj.depth === 'number' && !isNaN(obj.depth) ? obj.depth : 0,
        boundingBox: (Array.isArray(obj.boundingBox) && obj.boundingBox.length === 4) 
            ? obj.boundingBox.map(v => typeof v === 'number' && !isNaN(v) ? v : 0) as [number, number, number, number]
            : undefined
    }));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x);
        const pi = i * 4;

        colors[i * 3] = (pixels[pi] || 0) / 255;
        colors[i * 3 + 1] = (pixels[pi + 1] || 0) / 255;
        colors[i * 3 + 2] = (pixels[pi + 2] || 0) / 255;

        positions[i * 3] = x - width / 2;
        positions[i * 3 + 1] = -(y - height / 2);

        const brightness = ((pixels[pi] || 0) + (pixels[pi + 1] || 0) + (pixels[pi + 2] || 0)) / 3;
        const normX = (x / width) * 100;
        const normY = (y / height) * 100;
        
        let aiDepthOffset = 0;
        for (const obj of sanitizedObjects) {
            if (obj.boundingBox) {
                const [ymin, xmin, ymax, xmax] = obj.boundingBox;
                if (normX >= xmin && normX <= xmax && normY >= ymin && normY <= ymax) {
                    aiDepthOffset = obj.depth;
                    break;
                }
            }
        }

        const baseDepth = (brightness / 255) * 50 + aiDepthOffset + (y / height) * 20;
        positions[i * 3 + 2] = isNaN(baseDepth) ? 0 : baseDepth; 
        sizes[i] = 1.0;
      }
    }

    setSplatData({ positions, colors, sizes, count });
    setStatus(AppStatus.VIEWING);
  }, []);

  const handleUpload = async (base64: string) => {
    setError(null);
    setStatus(AppStatus.ANALYZING);
    try {
      const result = await analyzePainting(base64);
      setAnalysis(result);
      await processImageToSplat(base64, result);
    } catch (err) {
      console.error(err);
      setError("Analysis process failed. Please try another image.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleReset = () => {
    setSplatData(null);
    setAnalysis(null);
    setStatus(AppStatus.IDLE);
    setError(null);
    setHoveredObj(null);
  };

  const handleHover = useCallback((obj: { name: string; description: string; historicalContext?: string } | null, x: number, y: number) => {
    setHoveredObj(obj);
    setMousePos({ x, y });
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#08080a] overflow-hidden flex flex-col items-center justify-center">
      
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-10">
          <div className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] bg-blue-600/30 blur-[180px] rounded-full" />
          <div className="absolute -bottom-[20%] -right-[20%] w-[60%] h-[60%] bg-purple-600/30 blur-[180px] rounded-full" />
      </div>

      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20 pointer-events-none">
        <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase flex items-center gap-2 pointer-events-auto">
              <span className="bg-white text-black px-1.5 py-0.5 rounded">ART</span>
              SPLAT 3D
            </h1>
            <p className="text-[10px] text-gray-500 font-medium tracking-[0.2em] uppercase">
                {analysis?.artisticStyle ? `${analysis.artisticStyle} Reconstruction` : 'Volumetric Reconstruction'}
            </p>
        </div>
        
        {status === AppStatus.VIEWING && analysis && (
            <div className="hidden md:flex flex-col items-end pointer-events-auto">
                <span className="text-[10px] text-gray-400 uppercase font-bold mb-1">Atmosphere</span>
                <p className="text-xs text-white/70 max-w-xs text-right italic font-serif">"{analysis.overallAtmosphere}"</p>
            </div>
        )}
      </div>

      <div className="w-full h-full flex items-center justify-center">
        {status === AppStatus.IDLE && (
          <div className="max-w-xl w-full px-6 animate-in fade-in zoom-in duration-700">
            <Uploader onUpload={handleUpload} />
          </div>
        )}

        {status === AppStatus.ANALYZING && (
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 border-4 border-white/5 border-t-white rounded-full animate-spin" />
            <div className="text-center">
                <h3 className="text-xl font-bold mb-1 uppercase tracking-tight">Spectral Semantic Analysis</h3>
                <p className="text-gray-400 text-xs animate-pulse tracking-widest uppercase">Initializing Depth Mapping Vectors...</p>
            </div>
          </div>
        )}

        {status === AppStatus.GENERATING && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-white/5 border-t-blue-400 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm uppercase tracking-widest font-bold">Instancing Particles...</p>
          </div>
        )}

        {status === AppStatus.VIEWING && (
          <div className="w-full h-full animate-in fade-in duration-1000">
            <Viewer3D 
              splatData={splatData} 
              analysis={analysis} 
              settings={{ splatScale, depthIntensity, pointSize }} 
              onHover={handleHover}
            />
            {hoveredObj && (
              <ObjectTooltip 
                name={hoveredObj.name} 
                description={hoveredObj.description} 
                historicalContext={hoveredObj.historicalContext}
                mousePos={mousePos} 
              />
            )}
            <Controls 
              splatScale={splatScale} setSplatScale={setSplatScale}
              depthIntensity={depthIntensity} setDepthIntensity={setDepthIntensity}
              pointSize={pointSize} setPointSize={setPointSize}
              onReset={handleReset}
            />
          </div>
        )}

        {status === AppStatus.ERROR && (
          <div className="text-center p-10 bg-red-500/5 border border-red-500/10 rounded-3xl max-w-sm mx-auto backdrop-blur-md">
            <div className="text-5xl mb-4">🎨</div>
            <h3 className="text-xl font-bold text-red-400 mb-2">Restoration Failed</h3>
            <p className="text-sm text-red-300/60 mb-8">{error}</p>
            <button 
              onClick={handleReset}
              className="px-8 py-3 bg-white text-black font-black uppercase text-xs tracking-widest rounded-full hover:bg-gray-200 transition-all hover:scale-105"
            >
              Restart Session
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in-out {
          0% { opacity: 0; transform: translate(-50%, 30px); }
          15% { opacity: 1; transform: translate(-50%, 0); }
          85% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -30px); }
        }
      `}</style>

    </div>
  );
};

export default App;
