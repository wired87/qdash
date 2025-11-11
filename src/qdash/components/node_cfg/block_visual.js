import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Trash2, Zap } from 'lucide-react';

// Canvas constants for consistent drawing and data mapping
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 200;
const POINT_RADIUS = 8;
const DRAG_THRESHOLD = 15;
const MAX_ENERGY = 100;
const MAX_ITERS = 50;

// Helper function to map Y coordinate to Energy value
const mapYToEnergy = (y) => {
  const normalizedY = 1 - (y / CANVAS_HEIGHT);
  return Math.max(0, Math.round(normalizedY * MAX_ENERGY));
};

// Helper function to map X coordinate difference to Iters value
const mapDeltaXToIters = (deltaX) => {
  const normalizedDeltaX = deltaX / CANVAS_WIDTH;
  return Math.max(1, Math.round(normalizedDeltaX * MAX_ITERS));
};

const VisualBlock = ({ initialData, onDataChange }) => {
  const canvasRef = useRef(null);

  // State Initialization
  const [points, setPoints] = useState(() => {
    if (initialData && initialData.points && initialData.points.length >= 2) {
      return initialData.points;
    }
    return [
      { id: 0, x: 50, y: 150 },
      { id: 1, x: CANVAS_WIDTH - 50, y: 150 },
    ];
  });

  const [outputData, setOutputData] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPointIndex, setDraggedPointIndex] = useState(null);

  // --- Core Logic: Data Calculation ---
  const calculateOutputData = useCallback((currentPoints) => {
    const data = [];
    if (currentPoints.length < 2) {
      onDataChange({ points: currentPoints, output: data });
      setOutputData([]);
      return;
    }

    const sortedPoints = [...currentPoints].sort((a, b) => a.x - b.x);

    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const p1 = sortedPoints[i];
      const p2 = sortedPoints[i + 1];

      const energyValue = mapYToEnergy(p1.y);
      const deltaX = p2.x - p1.x;
      const itersValue = mapDeltaXToIters(deltaX);

      data.push({
        energy: energyValue,
        break_iters: 8,
        iters: itersValue,
      });
    }

    setOutputData(data);
    onDataChange({
      points: currentPoints,
      output: data
    });
  }, [onDataChange]);

  // --- Canvas Drawing Logic ---
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const sortedPoints = [...points].sort((a, b) => a.x - b.x);

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
    sortedPoints.forEach(point => {
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

  }, [points]);

  // Redraw and recalculate data whenever points change
  useEffect(() => {
    drawChart();
    calculateOutputData(points);
  }, [points, calculateOutputData, drawChart]);

  // --- Mouse Event Handlers (Logic remains the same) ---
  const getCanvasCoordinates = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y };
  };

  const getNearestPointIndex = (coords) => {
    return points.findIndex(p => {
      const distance = Math.sqrt((p.x - coords.x) ** 2 + (p.y - coords.y) ** 2);
      return distance < DRAG_THRESHOLD;
    });
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const handleMouseDown = (e) => {
    e.preventDefault();
    const { x, y } = getCanvasCoordinates(e);
    const nearestIndex = getNearestPointIndex({ x, y });

    if (nearestIndex !== -1) {
      setIsDragging(true);
      setDraggedPointIndex(nearestIndex);
    } else {
      const sortedPoints = [...points].sort((a, b) => a.x - b.x);
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
        const newPoint = {
          id: Date.now(),
          x: clamp(x, 0, CANVAS_WIDTH),
          y: clamp(y, 0, CANVAS_HEIGHT),
        };
        const newPoints = [...points, newPoint];
        setPoints(newPoints);
        setIsDragging(true);
        setDraggedPointIndex(newPoints.length - 1);
      }
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || draggedPointIndex === null) return;
    const { x: newX, y: newY } = getCanvasCoordinates(e);

    requestAnimationFrame(() => {
      setPoints(prevPoints => {
        const updatedPoints = prevPoints.map((p, index) => {
          if (index === draggedPointIndex) {
            const clampedX = clamp(newX, 0, CANVAS_WIDTH);
            const clampedY = clamp(newY, 0, CANVAS_HEIGHT);
            return { ...p, x: clampedX, y: clampedY };
          }
          return p;
        });
        return updatedPoints;
      });
      drawChart();
    });
  }, [isDragging, draggedPointIndex, drawChart]);

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedPointIndex(null);
    calculateOutputData(points);
  };

  // --- Point Management ---

  const removePoint = (idToRemove) => {
    if (points.length <= 2) {
      console.warn("Cannot remove point: Minimum two points required.");
      return;
    }
    const newPoints = points.filter(p => p.id !== idToRemove);
    setPoints(newPoints);
  };

  // Attach global listeners for move and up (unchanged)
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove]);

  return (
    <div style={{minHeight: '100vh', padding: '1rem 2rem', backgroundColor: '#f9fafb', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', fontFamily: 'sans-serif'}}>
      <div style={{width: '100%', maxWidth: '1280px', backgroundColor: 'white', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid #f3f4f6'}}>
        <h1 style={{fontSize: '1.875rem', fontWeight: '800', color: '#1f2937', marginBottom: '1.5rem', display: 'flex', alignItems: 'center'}}>
          <Zap style={{width: '1.5rem', height: '1.5rem', marginRight: '0.75rem', color: '#10b981'}} />
          Energy Profile Designer
        </h1>
        <p style={{color: '#4b5563', marginBottom: '1.5rem'}}>
          Click and drag the green points to shape the energy profile. Click on the line to add a new segment point.
        </p>

        <div style={{display: 'flex', flexDirection: 'column', gap: '2rem', '@media (min-width: 1024px)': { flexDirection: 'row' }}}>
          {/* --- Canvas Area --- */}
          <div style={{flex: '1 1 0%', minWidth: '0'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem'}}>
              <span>Energy Profile (Click and Drag)</span>
              <span>Iters (Time)</span>
            </div>
            <div
              style={{position: 'relative', borderRadius: '0.5rem', border: '4px solid #d1d5db', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)', cursor: 'crosshair', width: CANVAS_WIDTH + 'px', height: CANVAS_HEIGHT + 'px', margin: '0 auto', backgroundColor: '#f9fafb' }}
              onMouseDown={handleMouseDown}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                style={{display: 'block'}}
              />
              {/* Overlay for Y-axis labels */}
              <div style={{position: 'absolute', top: 0, left: '-60px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace'}}>
                <span style={{padding: '0.25rem'}}>High E ({MAX_ENERGY})</span>
                <span style={{padding: '0.25rem'}}>Low E (0)</span>
              </div>
            </div>

            {/* Point Management/Deletion UI */}
            <div style={{marginTop: '1rem', padding: '0.75rem', backgroundColor: 'white', borderRadius: '0.75rem', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'}}>
              <h3 style={{fontWeight: '700', color: '#374151', marginBottom: '0.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem'}}>Segment Points ({points.length} Total)</h3>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.875rem'}}>
                {[...points].sort((a, b) => a.x - b.x).map((point, index) => (
                  <div
                    key={point.id}
                    style={{display: 'flex', alignItems: 'center', backgroundColor: '#f0fff4', border: '1px solid #a7f3d0', borderRadius: '9999px', padding: '0.25rem 0.75rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'background-color 150ms ease-in-out'}}
                  >
                    <span style={{fontWeight: '500', marginRight: '0.5rem', color: '#374151'}}>P{index + 1}:</span>
                    <span style={{color: '#065f46', fontWeight: '700'}}>E:{mapYToEnergy(point.y)}</span>
                    {points.length > 2 && (
                      <button
                        onClick={() => removePoint(point.id)}
                        title="Remove Point"
                        style={{marginLeft: '0.5rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer'}}
                      >
                        <Trash2 style={{width: '1rem', height: '1rem'}} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --- Output Data List --- */}
          <div style={{width: '384px'}}>
            <h2 style={{fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem'}}>
              Calculated Output Data
            </h2>
            <div style={{maxHeight: '24rem', overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
              {outputData.map((data, index) => (
                <div
                  key={index}
                  style={{backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderLeft: '4px solid #1d4ed8', fontFamily: 'monospace', fontSize: '0.875rem'}}
                >
                  <p style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <span style={{fontWeight: '700', color: '#374151'}}>Segment {index + 1}</span>
                    <span style={{fontSize: '0.75rem', color: '#1d4ed8'}}>
                      {index === outputData.length - 1 ? 'END' : '->'}
                    </span>
                  </p>
                  <pre style={{marginTop: '0.5rem', whiteSpace: 'pre-wrap', lineHeight: '1.5'}}>
                    <span style={{display: 'block', color: '#374151'}}>
                      energy: <span style={{color: '#dc2626', fontWeight: '700'}}>{data.energy}</span>
                    </span>
                    <span style={{display: 'block', color: '#374151'}}>
                      break_iters: <span style={{color: '#2563eb'}}>{data.break_iters}</span>
                    </span>
                    <span style={{display: 'block', color: '#374151'}}>
                      iters: <span style={{color: '#9333ea', fontWeight: '700'}}>{data.iters}</span>
                    </span>
                  </pre>
                </div>
              ))}
              {outputData.length === 0 && (
                <div style={{textAlign: 'center', padding: '1.5rem', color: '#6b7280', backgroundColor: '#f3f4f6', borderRadius: '0.5rem'}}>
                  Draw at least two points to define a segment.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualBlock;