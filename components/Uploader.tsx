
import React, { useRef } from 'react';

interface UploaderProps {
  onUpload: (base64: string) => void;
  disabled?: boolean;
}

const Uploader: React.FC<UploaderProps> = ({ onUpload, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        // Strip prefix for Gemini but keep it for preview if needed
        const base64Data = result.split(',')[1];
        onUpload(base64Data);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/20 rounded-2xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
         onClick={() => fileInputRef.current?.click()}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
        disabled={disabled}
      />
      <div className="text-4xl mb-4">🖼️</div>
      <h3 className="text-xl font-semibold mb-2">Drop a masterpiece</h3>
      <p className="text-sm text-gray-400 text-center max-w-xs">
        Upload any painting, photo, or sketch to transform it into a 3D Gaussian Splat world.
      </p>
      {disabled && (
        <div className="mt-4 text-xs font-bold text-yellow-500 uppercase tracking-widest">
          Processing...
        </div>
      )}
    </div>
  );
};

export default Uploader;
