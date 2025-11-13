import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Trash2, Zap, X } from 'lucide-react';

// Canvas constants for consistent drawing and data mapping
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 200;
const POINT_RADIUS = 8;
const DRAG_THRESHOLD = 15;
const MAX_ENERGY = 99; // Adjusted to requested 0-99 range
const MAX_ITERS = 50;

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

const EnergyProfileModal = ({
  initialData = {
    points: [
      { id: 0, x: 50, y: 150 },
      { id: 1, x: CANVAS_WIDTH - 50, y: 150 },
    ],
    output: [],
  },
  // Mock handler for data change and modal close
  onClose = () => console.log('Modal closed'),
  onSend = (data) => console.log('Sending data:', data),
}) => {
  const canvasRef = useRef(null);

  // State Initialization
  const [points, setPoints] = useState(
    initialData.points && initialData.points.length >= 2
      ? initialData.points
      : [
          { id: 0, x: 50, y: 150 },
          { id: 1, x: CANVAS_WIDTH - 50, y: 150 },
        ]
  );
  const [outputData, setOutputData] = useState(initialData.output || []);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPointIndex, setDraggedPointIndex] = useState(null);

  // --- Core Logic: Data Calculation ---
  const calculateOutputData = useCallback((currentPoints) => {
    const data = [];
    if (currentPoints.length < 2) {
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
        break_iters: 8, // Static value from original code
        iters: itersValue,
      });
    }

    setOutputData(data);
  }, []);

  // --- Canvas Drawing Logic ---
  const drawChart = useCallback(
    (currentPoints) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      const sortedPoints = [...currentPoints].sort((a, b) => a.x - b.x);

      // 1. Draw Background Grid/Guides (Simplified)
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
    [] // No dependency needed for drawChart itself
  );

  // Effect to redraw and recalculate data whenever points change
  useEffect(() => {
    drawChart(points);
    calculateOutputData(points);
  }, [points, calculateOutputData, drawChart]);

  // --- Mouse Event Handlers ---
  const getCanvasCoordinates = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y };
  };

  const getNearestPointIndex = (coords) => {
    return points.findIndex((p) => {
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
      // Start dragging existing point
      setIsDragging(true);
      setDraggedPointIndex(nearestIndex);
    } else {
      // Check if near the line to add a new point
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
        // Add new point and start dragging it
        const newPoint = {
          id: Date.now(),
          x: clamp(x, 0, CANVAS_WIDTH),
          y: clamp(y, 0, CANVAS_HEIGHT),
        };
        setPoints((prevPoints) => {
          const newPoints = [...prevPoints, newPoint];
          setIsDragging(true);
          setDraggedPointIndex(newPoints.length - 1);
          return newPoints;
        });
      }
    }
  };

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || draggedPointIndex === null) return;
      const { x: newX, y: newY } = getCanvasCoordinates(e);

      requestAnimationFrame(() => {
        setPoints((prevPoints) => {
          const updatedPoints = prevPoints.map((p, index) => {
            if (index === draggedPointIndex) {
              const clampedX = clamp(newX, 0, CANVAS_WIDTH);
              const clampedY = clamp(newY, 0, CANVAS_HEIGHT);
              return { ...p, x: clampedX, y: clampedY };
            }
            return p;
          });
          drawChart(updatedPoints); // Draw with updated points immediately
          return updatedPoints;
        });
      });
    },
    [isDragging, draggedPointIndex, drawChart]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedPointIndex(null);
    // Data calculation runs via useEffect on points change
  };

  // --- Point Management ---
  const removePoint = (idToRemove) => {
    if (points.length <= 2) {
      console.warn('Cannot remove point: Minimum two points required.');
      return;
    }
    const newPoints = points.filter((p) => p.id !== idToRemove);
    setPoints(newPoints);
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
    onSend({ points, output: outputData });
    // Optionally close modal after sending
    // onClose();
  };

  // --- Component Render: Modal Wrapper ---
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Backdrop
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          width: '90%',
          maxWidth: '1280px',
          backgroundColor: 'white',
          boxShadow:
            '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
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
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
            }}
            title="Close"
          >
            <X style={{ width: '1.5rem', height: '1.5rem' }} />
          </button>
        </div>

        <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>
          Click and drag the green points to shape the energy profile (0-99).
          Click on the line to add a new point.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem',
            '@media (min-width: 1024px)': { flexDirection: 'row' },
          }}
        >
          {/* --- Canvas Area and Point Management --- */}
          <div style={{ flex: '1 1 0%', minWidth: '0' }}>
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
              <span>Energy Profile (Click and Drag)</span>
              <span>Iters (Time)</span>
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
                ref={canvasRef}
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

            {/* Point Management/Deletion UI */}
            <div
              style={{
                marginTop: '1rem',
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
                Segment Points ({points.length} Total)
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

            {/* Send Message Button */}
            <button
              onClick={handleSend}
              style={{
                marginTop: '1.5rem',
                width: '100%',
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '700',
                color: 'white',
                backgroundColor: '#10b981',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                transition: 'background-color 150ms ease-in-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#10b981')}
            >
              Send Message
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnergyProfileModal;