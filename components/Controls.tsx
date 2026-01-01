import React, { useState } from 'react';
import { Loader2, Sparkles, Download, Plus } from 'lucide-react';
import { CATEGORY_COLORS } from '../types';

interface ControlsProps {
  onAddManual: (title: string, duration: number, category: string) => void;
  onGenerateAI: (input: string) => Promise<void>;
  onDownload: () => void;
  isGenerating: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ 
  onAddManual, 
  onGenerateAI, 
  onDownload,
  isGenerating 
}) => {
  const [brainDump, setBrainDump] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualDuration, setManualDuration] = useState(30);
  const [manualCategory, setManualCategory] = useState('work');
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;
    onAddManual(manualTitle, manualDuration, manualCategory);
    setManualTitle('');
  };

  const handleAISubmit = async () => {
    if (!brainDump.trim()) return;
    await onGenerateAI(brainDump);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 tracking-tight">Plan Your Day</h2>
        <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'ai' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            AI Magic
          </button>
          <button 
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'manual' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Manual
          </button>
        </div>
      </div>

      <div className="flex-grow flex flex-col space-y-4">
        {activeTab === 'ai' ? (
          <div className="flex flex-col space-y-3 h-full">
            <label className="text-sm font-medium text-gray-600">Brain Dump</label>
            <textarea
              className="w-full flex-grow p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none text-sm transition-all"
              placeholder="e.g. 9am team meeting, gym at lunch, finish React project in the evening..."
              value={brainDump}
              onChange={(e) => setBrainDump(e.target.value)}
            />
            <button
              onClick={handleAISubmit}
              disabled={isGenerating || !brainDump.trim()}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-medium shadow-md transition-all transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Auto-Schedule</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4">
             <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Task Name</label>
              <input 
                type="text" 
                value={manualTitle}
                onChange={(e) => setManualTitle(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                placeholder="Meeting..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Duration (min)</label>
                <select 
                  value={manualDuration}
                  onChange={(e) => setManualDuration(Number(e.target.value))}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                >
                  {[30, 60, 90, 120, 180, 240].map(m => (
                    <option key={m} value={m}>{m} mins</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                <select 
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                >
                  {Object.keys(CATEGORY_COLORS).map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add to Schedule</span>
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              Note: Click a slot on the right to place manually.
            </p>
          </form>
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-100">
        <button
          onClick={onDownload}
          className="w-full py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Save as Image</span>
        </button>
      </div>
    </div>
  );
};