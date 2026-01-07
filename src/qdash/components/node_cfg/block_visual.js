import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Trash2, Zap, X, Plus, Minus, ChevronDown, Check } from 'lucide-react';

// Canvas constants for consistent drawing and data mapping
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 200;
const POINT_RADIUS = 8;
const DRAG_THRESHOLD = 15;
const MAX_ENERGY = 99; // Adjusted to requested 0-99 range
const MAX_ITERS = 50;
const DESKTOP_BREAKPOINT = 1024; // Define the breakpoint constant






// Helper function to map Y coordinate to Energy value
const mapYToEnergy = (y) => {
  // Y=0 (top) maps to MAX_ENERGY (99), Y=200 (bottom) maps to 0.
  const normalizedY = 1 - (y / CANVAS_HEIGHT);
  return Math.max(0, Math.min(MAX_ENERGY, Math.round(normalizedY * MAX_ENERGY)));
};

// Helper function to map X coordinate difference to Iters value
const mapDeltaXToIters = (deltaX) => {
  const normalizedDeltaX = deltaX / CANVAS_WIDTH;
  return Math.max(1, Math.round(normalizedDeltaX * MAX_ITERS));
};

// Main Component: Merged VisualBlock and Modal wrapper with multi-block support
const EnergyProfileModal = ({
  initialData = {
    blocks: [{
      id: 0,
      points: [
        { id: 0, x: 50, y: 150 },
        { id: 1, x: CANVAS_WIDTH - 50, y: 150 },
      ],
      output: [],
      selectedTools: [],
    }],
  },
  // Mock handler for modal close
  onClose = () => console.log('Modal closed'),
  // Mock handler for data send
  onSend = (data) => console.log('Sending data:', data),
}) => {
  const canvasRefs = useRef({});

  // --- Responsive State (FIX for "@media" inline style error) ---
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= DESKTOP_BREAKPOINT);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= DESKTOP_BREAKPOINT);
    };

    // Set initial state and listen for resize events
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // --- End Responsive State ---

  // Multi-block state management
  const [blocks, setBlocks] = useState(() => {
    if (initialData.blocks && Array.isArray(initialData.blocks)) {
      return initialData.blocks;
    } else if (initialData.points) {
      // Legacy format: single block
      return [{
        id: Date.now(),
        points: initialData.points.length >= 2 ? initialData.points : [
          { id: 0, x: 50, y: 150 },
          { id: 1, x: CANVAS_WIDTH - 50, y: 150 },
        ],
        output: initialData.output || [],
        selectedTools: initialData.selectedTools || [],
      }];
    }
    return [{
      id: Date.now(),
      points: [
        { id: 0, x: 50, y: 150 },
        { id: 1, x: CANVAS_WIDTH - 50, y: 150 },
      ],
      output: [],
    }];
  });

  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPointIndex, setDraggedPointIndex] = useState(null);

  // Block management functions
  const addBlock = () => {
    const newBlock = {
      id: Date.now(),
      points: [
        { id: 0, x: 50, y: 150 },
        { id: 1, x: CANVAS_WIDTH - 50, y: 150 },
      ],
      output: [],
    };
    setBlocks(prev => [...prev, newBlock]);
  };

  const removeBlock = (blockId) => {
    if (blocks.length <= 1) {
      console.warn('Cannot remove block: At least one block is required.');
      return;
    }
    setBlocks(prev => prev.filter(b => b.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const updateBlock = useCallback((blockId, updates) => {
    setBlocks(prev => prev.map(block =>
      block.id === blockId ? { ...block, ...updates } : block
    ));
  }, []);

  const getCurrentBlock = () => {
    if (selectedBlockId === null) return null;
    return blocks.find(b => b.id === selectedBlockId);
  };

  const currentBlock = getCurrentBlock();
  const points = currentBlock ? currentBlock.points : [];
  const outputData = currentBlock ? currentBlock.output : [];
  const selectedTools = currentBlock ? currentBlock.selectedTools : [];

  /* Removed handleItemToggle and toggleDropdown */


  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.tool-dropdown-container')) {
        setOpenDropdowns({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // --- Core Logic: Data Calculation ---
  const calculateOutputData = useCallback((blockId, currentPoints) => {
    if (!blockId || !currentPoints) return [];

    const data = [];
    if (currentPoints.length < 2) {
      updateBlock(blockId, { output: [] });
      return [];
    }

    // Sort points by X coordinate for sequential segment calculation
    const sortedPoints = [...currentPoints].sort((a, b) => a.x - b.x);

    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const p1 = sortedPoints[i];
      const p2 = sortedPoints[i + 1];

      const energyValue = mapYToEnergy(p1.y);
      const deltaX = p2.x - p1.x;
      const itersValue = mapDeltaXToIters(deltaX);

      data.push({
        energy: energyValue,
        break_iters: 8, // Static value from original code
        iters: itersValue,
      });
    }

    updateBlock(blockId, { output: data });
    return data;
  }, [updateBlock]);

  // --- Canvas Drawing Logic ---
  const drawChart = useCallback(
    (blockId, currentPoints) => {
      const canvas = canvasRefs.current[blockId];
      if (!canvas || !currentPoints) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const sortedPoints = [...currentPoints].sort((a, b) => a.x - b.x);

      // 1. Draw Background Grid/Guides
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const y = (CANVAS_HEIGHT / 4) * i;
        ctx.beginPath();
        ctx.setLineDash([5, 5]);
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_WIDTH, y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // 2. Draw the Line (Energy Profile)
      ctx.beginPath();
      ctx.strokeStyle = '#10b981'; // Green-500
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (sortedPoints.length > 0) {
        ctx.moveTo(sortedPoints[0].x, sortedPoints[0].y);
      }
      for (let i = 1; i < sortedPoints.length; i++) {
        ctx.lineTo(sortedPoints[i].x, sortedPoints[i].y);
      }
      ctx.stroke();

      // 3. Draw the Interactive Points
      sortedPoints.forEach((point) => {
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#10b981';

        ctx.beginPath();
        ctx.arc(point.x, point.y, POINT_RADIUS, 0, 2 * Math.PI);
        ctx.fillStyle = '#10b981';
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    },
    []
  );

  // Redraw and recalculate data whenever points change for selected block
  useEffect(() => {
    if (selectedBlockId && currentBlock) {
      drawChart(selectedBlockId, currentBlock.points);
      calculateOutputData(selectedBlockId, currentBlock.points);
    }
  }, [selectedBlockId, currentBlock?.points, calculateOutputData, drawChart]);

  // --- Utility Functions ---
  const getCanvasCoordinates = (e, blockId) => {
    const canvas = canvasRefs.current[blockId];
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y };
  };

  const getNearestPointIndex = (coords, currentPoints) => {
    if (!currentPoints) return -1;
    return currentPoints.findIndex((p) => {
      const distance = Math.sqrt((p.x - coords.x) ** 2 + (p.y - coords.y) ** 2);
      return distance < DRAG_THRESHOLD;
    });
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  // --- Point Management ---

  // Add a new point near the center with a slight random offset
  const addPoint = () => {
    if (!selectedBlockId) return;
    const block = blocks.find(b => b.id === selectedBlockId);
    if (!block) return;

    const newPoint = {
      id: Date.now(),
      // Add a slight random offset to prevent overlap
      x: CANVAS_WIDTH / 2 + Math.random() * 50 - 25,
      y: CANVAS_HEIGHT / 2 + Math.random() * 50 - 25,
    };
    const newPoints = [...block.points, newPoint];
    updateBlock(selectedBlockId, { points: newPoints });
  };

  // Remove the most recently added point (highest ID > 1) or the last point in array as fallback
  const removeLastAddedPoint = () => {
    if (!selectedBlockId) return;
    const block = blocks.find(b => b.id === selectedBlockId);
    if (!block || block.points.length <= 2) {
      console.warn("Cannot remove point: Minimum two points required.");
      return;
    }

    // Filter out initial points (id 0 and 1)
    const nonInitialPoints = block.points.filter(p => p.id > 1);

    if (nonInitialPoints.length > 0) {
      // Find the point with the highest ID (most recently added)
      const pointToRemove = nonInitialPoints.reduce((latest, current) =>
        current.id > latest.id ? current : latest, nonInitialPoints[0]
      );
      const newPoints = block.points.filter(p => p.id !== pointToRemove.id);
      updateBlock(selectedBlockId, { points: newPoints });
    } else {
      // Fallback: if only initial points or points added without unique IDs remain (unlikely)
      const newPoints = block.points.slice(0, -1);
      updateBlock(selectedBlockId, { points: newPoints });
    }
  };

  // Remove specific point (used by list UI)
  const removePoint = (idToRemove) => {
    if (!selectedBlockId) return;
    const block = blocks.find(b => b.id === selectedBlockId);
    if (!block || block.points.length <= 2) {
      console.warn("Cannot remove point: Minimum two points required.");
      return;
    }
    const newPoints = block.points.filter(p => p.id !== idToRemove);
    updateBlock(selectedBlockId, { points: newPoints });
  };

  // --- Mouse Event Handlers (Canvas Interaction) ---

  const handleMouseDown = (e) => {
    if (!selectedBlockId) return;
    e.preventDefault();
    const { x, y } = getCanvasCoordinates(e, selectedBlockId);
    const currentPoints = currentBlock?.points || [];
    const nearestIndex = getNearestPointIndex({ x, y }, currentPoints);

    if (nearestIndex !== -1) {
      // Start dragging existing point
      setIsDragging(true);
      setDraggedPointIndex(nearestIndex);
    } else {
      // Check if near the line to add a new point
      const sortedPoints = [...currentPoints].sort((a, b) => a.x - b.x);
      let isNearLine = false;

      for (let i = 0; i < sortedPoints.length - 1; i++) {
        const p1 = sortedPoints[i];
        const p2 = sortedPoints[i + 1];

        if (x > p1.x && x < p2.x) {
          const slope = (p2.y - p1.y) / (p2.x - p1.x);
          const expectedY = p1.y + slope * (x - p1.x);

          if (Math.abs(y - expectedY) < DRAG_THRESHOLD) {
            isNearLine = true;
            break;
          }
        }
      }

      if (isNearLine) {
        // Add new point at click location and start dragging it
        const newPoint = {
          id: Date.now(),
          x: clamp(x, 0, CANVAS_WIDTH),
          y: clamp(y, 0, CANVAS_HEIGHT),
        };
        const newPoints = [...currentPoints, newPoint];
        updateBlock(selectedBlockId, { points: newPoints });
        setIsDragging(true);
        setDraggedPointIndex(newPoints.length - 1);
      }
    }
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || draggedPointIndex === null || !selectedBlockId || !currentBlock) return;
      const { x: newX, y: newY } = getCanvasCoordinates(e, selectedBlockId);

      requestAnimationFrame(() => {
        const updatedPoints = currentBlock.points.map((p, index) => {
          if (index === draggedPointIndex) {
            const clampedX = clamp(newX, 0, CANVAS_WIDTH);
            const clampedY = clamp(newY, 0, CANVAS_HEIGHT);
            return { ...p, x: clampedX, y: clampedY };
          }
          return p;
        });
        updateBlock(selectedBlockId, { points: updatedPoints });
        drawChart(selectedBlockId, updatedPoints);
      });
    },
    [isDragging, draggedPointIndex, selectedBlockId, currentBlock, drawChart]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedPointIndex(null);
  };

  // Attach global listeners for move and up
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove]);

  // --- Send Message Handler ---
  const handleSend = () => {
    // Send all blocks data
    onSend({
      blocks: blocks.map(block => ({
        id: block.id,
        points: block.points,
        output: block.output,
      })),
    });
  };


  // --- Component Render: Direct Content (No Modal Wrapper) ---
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        fontFamily: 'sans-serif',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Modal Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '1rem',
          marginBottom: '1rem',
        }}
      >
        <h2
          style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Zap
            style={{
              width: '1.5rem',
              height: '1.5rem',
              marginRight: '0.75rem',
              color: '#10b981',
            }}
          />
          Energy Profile Designer
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              padding: '0.5rem',
            }}
            title="Close"
          >
            <X style={{ width: '1.5rem', height: '1.5rem' }} />
          </button>
        )}
      </div>

      {selectedBlockId === null ? (
        // List View - Show all blocks
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <p style={{ color: '#4b5563', margin: 0 }}>
              Manage configuration blocks. Click "Edit / Visualize" to edit a block, or add a new block.
            </p>
            <button
              onClick={addBlock}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: '600',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'background-color 150ms',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
            >
              <Plus style={{ width: '1.25rem', height: '1.25rem' }} />
              Add Block
            </button>
          </div>

          {/* Blocks List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {blocks.map((block, index) => (
              <div
                key={block.id}
                style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.75rem',
                  padding: '1.5rem',
                  border: '2px solid #e5e7eb',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  transition: 'border-color 150ms, box-shadow 150ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                    Block {index + 1}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setSelectedBlockId(block.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontWeight: '600',
                        borderRadius: '0.5rem',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 150ms',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
                      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#10b981')}
                    >
                      <Zap style={{ width: '1rem', height: '1rem' }} />
                      Edit / Visualize
                    </button>
                    {blocks.length > 1 && (
                      <button
                        onClick={() => removeBlock(block.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0.5rem 1rem',
                          backgroundColor: '#ef4444',
                          color: 'white',
                          fontWeight: '600',
                          borderRadius: '0.5rem',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background-color 150ms',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#dc2626')}
                        onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ef4444')}
                      >
                        <Trash2 style={{ width: '1rem', height: '1rem' }} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tools Dropdown Removed */}

                {/* Block Summary */}
                <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#ffffff', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    <span>Points: <strong style={{ color: '#374151' }}>{block.points.length}</strong></span>
                    <span>Output Segments: <strong style={{ color: '#374151' }}>{block.output.length}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Send Button */}
          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                color: '#6b7280',
                backgroundColor: '#f3f4f6',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'background-color 150ms',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={blocks.length === 0}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '700',
                color: 'white',
                backgroundColor: blocks.length === 0 ? '#9ca3af' : '#10b981',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: blocks.length === 0 ? 'not-allowed' : 'pointer',
                transition: 'background-color 150ms',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              onMouseOver={(e) => {
                if (blocks.length > 0) e.currentTarget.style.backgroundColor = '#059669';
              }}
              onMouseOut={(e) => {
                if (blocks.length > 0) e.currentTarget.style.backgroundColor = '#10b981';
              }}
            >
              Send Configuration
            </button>
          </div>
        </div>
      ) : (
        // Visual Editor View - Show when a block is selected
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <p style={{ color: '#4b5563', margin: 0 }}>
              Editing Block {blocks.findIndex(b => b.id === selectedBlockId) + 1}. Click and drag the green points to shape the energy profile (0-{MAX_ENERGY}). Click on the line to add a new point.
            </p>
            <button
              onClick={() => setSelectedBlockId(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#6b7280',
                color: 'white',
                fontWeight: '600',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 150ms',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#4b5563')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6b7280')}
            >
              ← Back to Blocks
            </button>
          </div>

          {/* --- Tool Selection Dropdown Removed --- */}


          <div
            style={{
              display: 'flex',
              gap: '1.5rem',
              // FIX: Use dynamic property instead of invalid @media inline style
              flexDirection: isDesktop ? 'row' : 'column',
              flex: 1,
              overflow: 'hidden',
            }}
          >
            {/* --- LEFT: Canvas Area and Interactive Controls --- */}
            <div style={{ flex: '1 1 60%', minWidth: '0', display: 'flex', flexDirection: 'column' }}>
              {/* Control Buttons for Points */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                  justifyContent: 'center',
                }}
              >
                <button
                  onClick={addPoint}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: '#22c55e', // Green-500
                    color: 'white',
                    fontWeight: '600',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'background-color 150ms',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#16a34a')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#22c55e')}
                >
                  <Plus style={{ width: '1.25rem', height: '1.25rem' }} /> Add Data Point
                </button>
                <button
                  onClick={removeLastAddedPoint}
                  disabled={points.length <= 2}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    padding: '0.5rem 1rem',
                    backgroundColor: points.length <= 2 ? '#9ca3af' : '#ef4444', // Red-500 or gray
                    color: 'white',
                    fontWeight: '600',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: points.length <= 2 ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    transition: 'background-color 150ms',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = points.length <= 2 ? '#9ca3af' : '#dc2626')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = points.length <= 2 ? '#9ca3af' : '#ef4444')}
                >
                  <Minus style={{ width: '1.25rem', height: '1.25rem' }} /> Remove Last Added
                </button>
              </div>

              {/* Chart */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '0.5rem',
                }}
              >
                <span>Energy Profile (Y-Axis)</span>
                <span>Iters (X-Axis)</span>
              </div>
              <div
                style={{
                  position: 'relative',
                  borderRadius: '0.5rem',
                  border: '4px solid #d1d5db',
                  boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
                  cursor: 'crosshair',
                  width: CANVAS_WIDTH + 'px',
                  height: CANVAS_HEIGHT + 'px',
                  margin: '0 auto',
                  backgroundColor: '#f9fafb',
                }}
                onMouseDown={handleMouseDown}
              >
                <canvas
                  ref={(ref) => {
                    if (ref && selectedBlockId) {
                      canvasRefs.current[selectedBlockId] = ref;
                    }
                  }}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  style={{ display: 'block' }}
                />
                {/* Overlay for Y-axis labels */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '-60px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    fontFamily: 'monospace',
                  }}
                >
                  <span style={{ padding: '0.25rem' }}>High E ({MAX_ENERGY})</span>
                  <span style={{ padding: '0.25rem' }}>Low E (0)</span>
                </div>
              </div>

              {/* Point Management/Deletion UI List */}
              <div
                style={{
                  marginTop: '1.5rem',
                  padding: '0.75rem',
                  backgroundColor: 'white',
                  borderRadius: '0.75rem',
                  border: '1px solid #e5e7eb',
                  boxShadow:
                    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                }}
              >
                <h3
                  style={{
                    fontWeight: '700',
                    color: '#374151',
                    marginBottom: '0.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    paddingBottom: '0.5rem',
                  }}
                >
                  Individual Segment Points ({points.length} Total)
                </h3>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                  }}
                >
                  {[...points]
                    .sort((a, b) => a.x - b.x)
                    .map((point, index) => (
                      <div
                        key={point.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: '#f0fff4',
                          border: '1px solid #a7f3d0',
                          borderRadius: '9999px',
                          padding: '0.25rem 0.75rem',
                          boxShadow:
                            '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                          transition: 'background-color 150ms ease-in-out',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: '500',
                            marginRight: '0.5rem',
                            color: '#374151',
                          }}
                        >
                          P{index + 1}:
                        </span>
                        <span style={{ color: '#065f46', fontWeight: '700' }}>
                          E:{mapYToEnergy(point.y)}
                        </span>
                        {/* Only allow removal if there are more than 2 points */}
                        {points.length > 2 && (
                          <button
                            onClick={() => removePoint(point.id)}
                            title="Remove Point"
                            style={{
                              marginLeft: '0.5rem',
                              color: '#ef4444',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <Trash2 style={{ width: '1rem', height: '1rem' }} />
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* --- Output Data List & Send Button --- */}
            <div style={{ width: '384px' }}>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '1rem',
                  borderBottom: '1px solid #e5e7eb',
                  paddingBottom: '0.5rem',
                }}
              >
                Calculated Output Data
              </h2>
              <div
                style={{
                  maxHeight: '20rem',
                  overflowY: 'auto',
                  paddingRight: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                {outputData.map((data, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: '#eff6ff',
                      padding: '1rem',
                      borderRadius: '0.5rem',
                      boxShadow:
                        '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      borderLeft: '4px solid #1d4ed8',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                    }}
                  >
                    <p
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontWeight: '700', color: '#374151' }}>
                        Segment {index + 1}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#1d4ed8' }}>
                        {index === outputData.length - 1 ? 'END' : '->'}
                      </span>
                    </p>
                    <pre style={{ marginTop: '0.5rem', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                      <span style={{ display: 'block', color: '#374151' }}>
                        energy: <span style={{ color: '#dc2626', fontWeight: '700' }}>{data.energy}</span>
                      </span>
                      <span style={{ display: 'block', color: '#374151' }}>
                        break_iters: <span style={{ color: '#2563eb' }}>{data.break_iters}</span>
                      </span>
                      <span style={{ display: 'block', color: '#374151' }}>
                        iters: <span style={{ color: '#9333ea', fontWeight: '700' }}>{data.iters}</span>
                      </span>
                    </pre>
                  </div>
                ))}
                {outputData.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '1.5rem',
                      color: '#6b7280',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '0.5rem',
                    }}
                  >
                    Draw at least two points to define a segment.
                  </div>
                )}
              </div>

              {/* Save and Back Button */}
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setSelectedBlockId(null)}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    transition: 'background-color 150ms',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#e5e7eb')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                >
                  Save & Back to Blocks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnergyProfileModal;