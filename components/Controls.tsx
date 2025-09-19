
import React from 'react';
import { ArtStyle, RegenerationModel } from '../types';

interface ControlsProps {
  selectedStyle: ArtStyle;
  onStyleChange: (style: ArtStyle) => void;
  onRegenerate: () => void;
  regenerationModel: RegenerationModel;
  onModelChange: (model: RegenerationModel) => void;
  disabled: boolean;
}

const ModelOption: React.FC<{
  value: RegenerationModel;
  current: RegenerationModel;
  onSelect: (model: RegenerationModel) => void;
  title: string;
  description: string;
  disabled: boolean;
}> = ({ value, current, onSelect, title, description, disabled }) => {
  const isSelected = value === current;
  return (
    <label className={`
      flex-1 p-4 border rounded-lg cursor-pointer transition-all duration-200
      ${isSelected ? 'bg-purple-500/20 border-purple-500' : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `}>
      <input 
        type="radio" 
        name="regeneration-model"
        value={value}
        checked={isSelected}
        onChange={() => onSelect(value)}
        className="sr-only"
        disabled={disabled}
      />
      <span className="font-semibold text-white">{title}</span>
      <p className="text-xs text-gray-400 mt-1">{description}</p>
    </label>
  );
};


const Controls: React.FC<ControlsProps> = ({ 
  selectedStyle, 
  onStyleChange, 
  onRegenerate, 
  regenerationModel,
  onModelChange,
  disabled 
}) => {
  return (
    <section className="text-center space-y-6">
      <h2 className="text-2xl font-semibold">2. AI Regeneration</h2>
      
      <p className="text-gray-400 max-w-lg mx-auto">
        Select an artistic style and an AI model, then regenerate your frames to see them in a completely new light.
      </p>

      {/* Style and Model Selection */}
      <div className="space-y-6 max-w-lg mx-auto">
        {/* Style Dropdown */}
        <div>
            <label htmlFor="style-select" className="block text-sm font-medium text-gray-300 mb-2 text-left">Artistic Style</label>
            <div className="relative">
                <select
                    id="style-select"
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
        </div>

        {/* Model Selection */}
        <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 text-left">Regeneration Engine</label>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <ModelOption
                    value="gemini"
                    current={regenerationModel}
                    onSelect={onModelChange}
                    title="Gemini"
                    description="Fast, direct image-to-image editing. Great for preserving composition."
                    disabled={disabled}
                />
                <ModelOption
                    value="imagen"
                    current={regenerationModel}
                    onSelect={onModelChange}
                    title="Imagen"
                    description="Creates a new image from a text description. Good for new interpretations."
                    disabled={disabled}
                />
            </div>
        </div>
      </div>
      
      {/* Action Button */}
      <div className="pt-4">
        <button
          onClick={onRegenerate}
          disabled={disabled}
          className="w-full sm:w-auto px-8 py-3 font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-md shadow-lg transform hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          Regenerate All Frames
        </button>
        <p className="text-sm text-gray-500 mt-2">
            This will apply the selected style to all original frames.
        </p>
      </div>

    </section>
  );
};

export default Controls;
