
import React from 'react';
import { ArtStyle } from '../types';

interface ControlsProps {
  selectedStyle: ArtStyle;
  onStyleChange: (style: ArtStyle) => void;
  onRegenerate: () => void;
  disabled: boolean;
}

const Controls: React.FC<ControlsProps> = ({ selectedStyle, onStyleChange, onRegenerate, disabled }) => {
  return (
    <section className="text-center space-y-6">
      <h2 className="text-2xl font-semibold">2. AI Regeneration</h2>
      
      <p className="text-gray-400 max-w-md mx-auto">
        Select an artistic style, then regenerate your frames to see them in a completely new light.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
         <div className="relative w-full sm:w-64">
             <select
              value={selectedStyle}
              onChange={(e) => onStyleChange(e.target.value as ArtStyle)}
              disabled={disabled}
              className="w-full appearance-none bg-gray-700 border border-gray-600 rounded-md px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Select artistic style"
            >
              {Object.values(ArtStyle).map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
         </div>
        <button
          onClick={onRegenerate}
          disabled={disabled}
          className="w-full sm:w-auto px-8 py-3 font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-md shadow-lg transform hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          Regenerate All Frames
        </button>
      </div>
       <p className="text-sm text-gray-500 -mt-2">
        This will apply the selected style to all original frames.
      </p>
    </section>
  );
};

export default Controls;
