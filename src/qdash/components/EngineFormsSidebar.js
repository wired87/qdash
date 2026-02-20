import React, { useRef } from 'react';
import { ImagePlus } from 'lucide-react';

const GEOMS = [
  { id: 'rect', label: 'Rect' },
  { id: 'triangle', label: 'Triangle' },
  { id: 'box', label: 'Box' },
  { id: 'image_3d', label: 'Image to 3D' },
];

const DRAG_DATA_TYPE = 'application/x-qdash-form';

const EngineFormsSidebar = ({ className = '', selectedGeometry, onSelectType, onHoverType, onOpenImageModal }) => {
  const isDraggingRef = useRef(false);

  const handleDragStart = (e, g) => {
    isDraggingRef.current = true;
    e.dataTransfer.setData(DRAG_DATA_TYPE, g.id);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', g.id); 
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
  };
  
  const handleClick = (g, isSelected) => {
    if (isDraggingRef.current) return;
    if (g.id === 'image_3d') {
      onOpenImageModal?.();
      return;
    }
    onSelectType?.(isSelected ? null : g.id);
  };

  return (
    <div className={`flex flex-col h-full overflow-visible ${className}`}>
      {/* Just geometry items – no container */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0">
        <div className="flex flex-col items-center gap-4 max-h-full overflow-visible">
          {GEOMS.map((g) => {
            const isSelected = selectedGeometry === g.id;
            return (
              <button
                key={g.id}
                type="button"
                draggable
                title={g.id === 'image_3d' ? 'Click to upload image and convert to 3D' : `Drag to engine or click to select ${g.label}`}
                className="group flex flex-col items-center gap-1 focus:outline-none cursor-grab active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-2xl p-1 transition-transform duration-200 ease-out hover:scale-125 origin-center"
                onClick={() => handleClick(g, isSelected)}
                onDragStart={(e) => handleDragStart(e, g)}
                onDragEnd={handleDragEnd}
                onMouseEnter={() => {
                  console.log('[EngineFormsSidebar] hover enter:', g.id, g.label);
                  onHoverType?.(g.id);
                }}
                onMouseLeave={() => {
                  console.log('[EngineFormsSidebar] hover leave:', g.id, g.label);
                  onHoverType?.(null);
                }}
              >
                <div
                  className={`
                    flex items-center justify-center
                    w-10 h-10 sm:w-12 sm:h-12 rounded-2xl
                    transition-all duration-200
                    ring-2 ring-transparent
                    ${isSelected
                      ? 'bg-cyan-500/50 ring-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.6)]'
                      : 'bg-slate-800/60 group-hover:bg-slate-700/80 group-hover:ring-slate-500'
                    }
                  `}
                >
                  {g.id === 'rect' && (
                    <div className={`w-8 h-3 rounded-full ${isSelected ? 'bg-cyan-300' : 'bg-cyan-400/90'}`} />
                  )}
                  {g.id === 'triangle' && (
                    <div
                      className="w-0 h-0"
                      style={{
                        borderLeft: '10px solid transparent',
                        borderRight: '10px solid transparent',
                        borderBottom: `18px solid ${isSelected ? '#67e8f9' : '#fb923c'}`,
                      }}
                    />
                  )}
                  {g.id === 'box' && (
                    <div className={`w-7 h-7 rounded-md ${isSelected ? 'bg-violet-300' : 'bg-violet-400/80'}`} />
                  )}
                  {g.id === 'image_3d' && (
                    <ImagePlus className={`w-5 h-5 ${isSelected ? 'text-cyan-300' : 'text-emerald-400/90'}`} strokeWidth={2} />
                  )}
                </div>
                <span className={`text-[10px] font-mono uppercase tracking-widest transition-colors ${isSelected ? 'text-cyan-200' : 'text-slate-300 group-hover:text-slate-100'}`}>
                  {g.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EngineFormsSidebar;
