import React from 'react';
import { ScheduledBlock, CATEGORY_COLORS, TrackerCell } from '../types';
import { Plus, X } from 'lucide-react';

interface TimeSlotProps {
  time: string;
  block?: ScheduledBlock;
  isCovered?: boolean;
  onClick: () => void;
  onDelete?: (id: string) => void;
  onEdit?: (block: ScheduledBlock) => void;
  isHour: boolean;
  manualPlanText: string;
  onChangeManualPlan: (text: string) => void;
  trackerData?: TrackerCell[];
  onTrackerDoubleColor: (index: number) => void;
  onTrackerTextChange: (index: number, text: string) => void;
}

export const TimeSlot: React.FC<TimeSlotProps> = ({ 
  time, 
  block, 
  isCovered,
  onClick, 
  onDelete,
  onEdit,
  isHour,
  manualPlanText,
  onChangeManualPlan,
  trackerData = [],
  onTrackerDoubleColor,
  onTrackerTextChange
}) => {
  return (
    // Reduced base height (min-h-[44px]) to save vertical space, but allows expansion
    <div className="flex min-h-[44px] border-b border-gray-300 relative group">
      
      {/* 1. PLAN COLUMN (Left) - Wide for input (55%), narrow for capture (23%) */}
      <div className="w-[55%] plan-column border-r border-gray-300 relative bg-white flex flex-col justify-center group/plan">
         {/* Render Manual Input (Textarea) if no block here and not covered */}
         {!block && !isCovered && (
            <>
             <textarea 
                value={manualPlanText}
                onChange={(e) => onChangeManualPlan(e.target.value)}
                placeholder=""
                className="w-full h-full p-1 md:p-1.5 font-pen text-base md:text-lg bg-transparent outline-none text-gray-800 placeholder-gray-300 focus:bg-gray-50 transition-colors resize-none leading-tight overflow-hidden z-10"
                style={{ minHeight: '100%', whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
             />
             {/* Hidden div for image capture with proper text rendering */}
             <div 
               className="hidden print:block absolute inset-0 p-1 md:p-1.5 font-pen text-base md:text-lg text-gray-800 pointer-events-none leading-tight"
               style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
             >
               {manualPlanText}
             </div>
             {/* Hover button to create a block (Merge slots) */}
             <button
                onClick={onClick}
                className="absolute right-1 top-1 z-20 opacity-0 group-hover/plan:opacity-100 p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-900 transition-all"
                title="Create Block (Merge Time)"
             >
                <Plus className="w-3 h-3" />
             </button>
            </>
         )}

         {/* Render Block (Absolute overlay but with text wrapping support) */}
         {block && (
            <div
                className={`absolute left-0 right-0 top-0 m-0.5 px-2 py-2 cursor-pointer transition-all hover:brightness-95 z-20 shadow-md border-2 md:border group/block ${CATEGORY_COLORS[block.color as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.other}`}
                style={{ 
                  height: `calc(100% * ${block.duration / 30} - 4px)`,
                  maxHeight: `calc(100% * ${block.duration / 30} - 4px)`,
                  minHeight: `calc(100% * ${block.duration / 30} - 4px)`,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onEdit) onEdit(block);
                }}
            >
                {/* Text styling: natural wrapping with adequate space */}
                <div 
                  className="font-pen text-gray-900 text-center select-none px-2 py-1"
                  style={{
                    fontSize: window.innerWidth < 768 ? '0.8rem' : '0.9rem',
                    lineHeight: '1.3',
                    wordBreak: 'keep-all',
                    overflowWrap: 'anywhere',
                    whiteSpace: 'normal',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {block.title}
                </div>

                {/* Separate Delete Button - Enhanced for touch/click robustness */}
                <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (onDelete) onDelete(block.id);
                    }}
                    onPointerDown={(e) => e.stopPropagation()} 
                    className="absolute top-0 right-0 w-7 h-7 md:w-8 md:h-8 flex items-center justify-center text-black/40 hover:text-red-600 hover:bg-white/50 rounded-bl-lg transition-all z-30"
                    title="Remove Block"
                >
                    <X className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
            </div>
         )}
      </div>

      {/* 2. TIME COLUMN (Middle) - Compact fixed width */}
      <div className="w-10 md:w-12 flex-shrink-0 border-r border-gray-300 bg-gray-50 flex items-center justify-center font-russo text-gray-500 text-[10px] md:text-xs select-none relative">
        {time}
        {/* Helper line for half hour */}
        {!isHour && <div className="absolute top-0 w-full border-t border-gray-300 opacity-50"></div>}
      </div>

      {/* 3. DO COLUMN (Right) - 3 cells on mobile, 4 on desktop */}
      <div className="flex-grow flex bg-white relative">
        {!isHour && <div className="absolute inset-0 border-t border-gray-200 border-dashed pointer-events-none"></div>}
        
        {/* Render 3 Tracker Cells on mobile, 4 on desktop */}
        {[0, 1, 2, 3].map((idx) => {
            // Hide 4th cell on mobile
            if (idx === 3) {
              const cellData = trackerData[idx] || { color: '', text: '' };
              return (
                <div 
                    key={idx}
                    className={`hidden md:flex flex-1 border-r border-gray-100 last:border-r-0 relative group transition-colors ${cellData.color}`}
                >
                    <textarea 
                        value={cellData.text}
                        onChange={(e) => onTrackerTextChange(idx, e.target.value)}
                        onDoubleClick={() => onTrackerDoubleColor(idx)}
                        className="w-full h-full bg-transparent text-center font-pen text-sm outline-none p-1 text-gray-800 placeholder-gray-400/50 resize-none leading-tight flex flex-col justify-center"
                        placeholder="" 
                        rows={1}
                        style={{ overflow: 'hidden', whiteSpace: 'pre-wrap' }}
                    />
                    <div 
                      className="hidden print:block absolute inset-0 text-center font-pen text-sm p-1 text-gray-800 pointer-events-none leading-tight flex flex-col justify-center"
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {cellData.text}
                    </div>
                </div>
              );
            }
            // Show first 3 cells normally
            const cellData = trackerData[idx] || { color: '', text: '' };
            return (
                <div 
                    key={idx}
                    className={`flex-1 border-r border-gray-100 last:border-r-0 relative group transition-colors ${cellData.color}`}
                >
                    <textarea 
                        value={cellData.text}
                        onChange={(e) => onTrackerTextChange(idx, e.target.value)}
                        onDoubleClick={() => onTrackerDoubleColor(idx)}
                        className="w-full h-full bg-transparent text-center font-pen text-xs md:text-sm outline-none p-0.5 md:p-1 text-gray-800 placeholder-gray-400/50 resize-none leading-tight flex flex-col justify-center"
                        placeholder="" 
                        rows={1}
                        style={{ overflow: 'hidden', whiteSpace: 'pre-wrap' }}
                    />
                    <div 
                      className="hidden print:block absolute inset-0 text-center font-pen text-xs md:text-sm p-0.5 md:p-1 text-gray-800 pointer-events-none leading-tight flex flex-col justify-center"
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {cellData.text}
                    </div>
                </div>
            );
        })}
      </div>
      
    </div>
  );
};