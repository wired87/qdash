import React, { useRef } from 'react';
import { ImagePlus, Box } from 'lucide-react';

const GEOMS = [
  { id: 'rect', label: 'Rect' },
  { id: 'triangle', label: 'Triangle' },
  { id: 'box', label: 'Box' },
  { id: 'image_3d', label: 'Image to 3D' },
];

/** Hyperdimensions webtoy animations (https://github.com/MaxRobinsonTheGreat/hyperdimensions) – drag to engine to place under Recognizes (n-dims) pos. */
const HYPERDIMENSIONS_BASE = 'https://cdn.jsdelivr.net/gh/MaxRobinsonTheGreat/hyperdimensions@main';
const HYPERDIMENSIONS = [
  { id: 'index', label: 'Functions', url: `${HYPERDIMENSIONS_BASE}/index.html` },
  { id: 'biomorphs', label: 'Biomorphs', url: `${HYPERDIMENSIONS_BASE}/biomorphs.html` },
  { id: 'picbreeder', label: 'Picbreeder', url: `${HYPERDIMENSIONS_BASE}/picbreeder.html` },
  { id: 'tree_viewer', label: 'Tree', url: `${HYPERDIMENSIONS_BASE}/tree_viewer.html` },
  // Experimental: mathematical equation view (m/eq) rendered via hyperdimensions index with mode flag.
  { id: 'equation', label: 'Equation (m/eq)', url: `${HYPERDIMENSIONS_BASE}/index.html?mode=equation` },
];

const DRAG_DATA_TYPE = 'application/x-qdash-form';
const DRAG_DATA_HYPERDIMENSIONS = 'application/x-qdash-hyperdimensions';
const DRAG_DATA_OBJECT = 'application/x-qdash-object';

const EngineFormsSidebar = ({
  className = '',
  selectedGeometry,
  selectedEngineObject = null,
  onSelectType,
  onHoverType,
  onOpenImageModal,
  availableObjects = [],
}) => {
  const isDraggingRef = useRef(false);

  const handleDragStart = (e, g) => {
    isDraggingRef.current = true;
    try {
      e.dataTransfer.setData(DRAG_DATA_TYPE, g.id);
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', g.id);
      // Lightweight instrumentation to help debug drag behaviour in the engine.
      console.debug('[EngineFormsSidebar] dragstart geometry', {
        id: g.id,
        label: g.label,
        types: e.dataTransfer.types,
      });
    } catch (err) {
      console.warn('[EngineFormsSidebar] dragstart geometry failed', err);
    }
  };

  const handleHyperdimensionsDragStart = (e, item) => {
    isDraggingRef.current = true;
    try {
      const payload = { id: item.id, label: item.label, url: item.url };
      e.dataTransfer.setData(DRAG_DATA_HYPERDIMENSIONS, JSON.stringify(payload));
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', `hyperdimensions:${item.id}`);
      console.debug('[EngineFormsSidebar] dragstart hyperdimensions', {
        id: item.id,
        label: item.label,
        types: e.dataTransfer.types,
      });
    } catch (err) {
      console.warn('[EngineFormsSidebar] dragstart hyperdimensions failed', err);
    }
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
    console.debug('[EngineFormsSidebar] dragend');
  };
  
  const handleClick = (g, isSelected) => {
    if (isDraggingRef.current) return;
    if (g.id === 'image_3d') {
      onOpenImageModal?.();
      return;
    }
    onSelectType?.(isSelected ? null : g.id);
  };

  const handleObjectDragStart = (e, obj) => {
    isDraggingRef.current = true;
    try {
      const payload = {
        object_id: obj.id,
        id: obj.id,
        label: obj.label,
        type: obj.type,
        visual: obj.visual || {},
      };
      e.dataTransfer.setData(DRAG_DATA_OBJECT, JSON.stringify(payload));
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('text/plain', obj.label || obj.id);
      console.debug('[EngineFormsSidebar] dragstart object', {
        id: obj.id,
        label: obj.label,
        type: obj.type,
        types: e.dataTransfer.types,
      });
    } catch (err) {
      console.warn('[EngineFormsSidebar] dragstart object failed', err);
    }
  };

  return (
    <div className={`flex flex-col h-full overflow-visible ${className}`}>
          {GEOMS.map((g) => {
            const isSelected = selectedGeometry === g.id || (selectedEngineObject?.formType === g.id && !selectedEngineObject?.objectId);
            return (
              <button
                key={g.id}
                type="button"
                title={g.id === 'image_3d' ? 'Click to upload image and convert to 3D' : `Drag to engine or click to select ${g.label}`}
                className="group flex flex-col items-center gap-1 focus:outline-none cursor-default focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-2xl p-1 transition-transform duration-200 ease-out hover:scale-125 origin-center"
                onClick={() => handleClick(g, isSelected)}
                onMouseEnter={() => {
                  onHoverType?.(g.id);
                }}
                onMouseLeave={() => {
                  onHoverType?.(null);
                }}
              >
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, g)}
                  onDragEnd={handleDragEnd}
                  className={`
                    flex items-center justify-center
                    w-10 h-10 sm:w-12 sm:h-12 rounded-2xl
                    transition-all duration-200
                    ring-2 ring-transparent
                    cursor-grab active:cursor-grabbing
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
          {/* Spawnable objects from backend */}
          {Array.isArray(availableObjects) && availableObjects.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-600/60 w-full">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 block mb-2 text-center">
                Spawnable Objects
              </span>
              <div className="flex flex-col items-center gap-2 max-h-40 overflow-y-auto">
                {availableObjects.map((obj) => {
                  const isObjSelected = selectedEngineObject?.objectId === obj.id;
                  return (
                  <button
                    key={obj.id}
                    type="button"
                    title={`Drag to engine to spawn ${obj.label || obj.id}${isObjSelected ? ' (selected in engine)' : ''}`}
                    className="group flex flex-col items-center gap-0.5 focus:outline-none cursor-default focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-xl p-1.5 transition-transform duration-200 hover:scale-110 origin-center"
                  >
                    <div
                      draggable
                      onDragStart={(e) => handleObjectDragStart(e, obj)}
                      onDragEnd={handleDragEnd}
                      className={`flex items-center justify-center w-9 h-9 rounded-xl ring-2 cursor-grab active:cursor-grabbing
                        ${isObjSelected
                          ? 'bg-cyan-500/50 ring-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)]'
                          : 'bg-slate-800/80 group-hover:bg-slate-700/90 ring-transparent group-hover:ring-cyan-400/70'
                        }`}
                    >
                      <Box className="w-4 h-4 text-cyan-300/90" strokeWidth={2} />
                    </div>
                    <span className={`text-[9px] font-mono uppercase tracking-widest max-w-[120px] truncate ${isObjSelected ? 'text-cyan-200' : 'text-slate-300 group-hover:text-slate-50'}`}>
                      {obj.label || obj.id}
                    </span>
                  </button>
                );})}
              </div>
            </div>
          )}

          {/* Hyperdimensions animations – drag to engine to place under Recognizes (n-dims) pos */}
          <div className="mt-4 pt-4 border-t border-slate-600/60 w-full">
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 block mb-2 text-center">Hyperdimensions</span>
            <div className="flex flex-col items-center gap-2">
              {HYPERDIMENSIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  title={`Drag to engine: ${item.label} (n-dims pos)`}
                  className="group flex flex-col items-center gap-0.5 focus:outline-none cursor-default focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-xl p-1.5 transition-transform duration-200 hover:scale-110 origin-center"
                >
                  <div
                    draggable
                    onDragStart={(e) => handleHyperdimensionsDragStart(e, item)}
                    onDragEnd={handleDragEnd}
                    className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-700/80 group-hover:bg-slate-600/90 ring-2 ring-transparent group-hover:ring-slate-500 cursor-grab active:cursor-grabbing"
                  >
                    <Box className="w-4 h-4 text-amber-300/90" strokeWidth={2} />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 group-hover:text-slate-200 max-w-[72px] truncate">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

    </div>
  );
};

export default EngineFormsSidebar;
