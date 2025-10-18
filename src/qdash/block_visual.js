/*
Code me a react chart with a single line in the middle. the line can be set up bz a mouse cursor on miltiple points to change a value. for each increase of trhe line a new object gets appende to a list with the following format: energy: 10

break_iters: 8

iters: 20

the values depend on the drawing of the line (the higher the line get on a specific point (eneergy) and how long it is (iters)

the result should look like shown on the image
 */
// (-> no img was provided)

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { MinusCircle, PlusCircle, Trash2, Zap } from 'lucide-react';

// Canvas constants for consistent drawing and data mapping
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 200;
const POINT_RADIUS = 8;
const DRAG_THRESHOLD = 15;
const MAX_ENERGY = 100; // Maximum value for the 'energy' output
const MAX_ITERS = 50;  // Maximum value for the total 'iters' output span

// Helper function to map Y coordinate to Energy value (0 is top, 100 is bottom of data range)
const mapYToEnergy = (y) => {
  const normalizedY = 1 - (y / CANVAS_HEIGHT); // 0 (bottom) to 1 (top)
  return Math.max(0, Math.round(normalizedY * MAX_ENERGY));
};

// Helper function to map X coordinate difference to Iters value
const mapDeltaXToIters = (deltaX) => {
  const normalizedDeltaX = deltaX / CANVAS_WIDTH;
  return Math.max(1, Math.round(normalizedDeltaX * MAX_ITERS));
};

const VisualBlock = () => {
  const canvasRef = useRef(null);
  // Initial state with two points defining the start and end of the line
  const [points, setPoints] = useState([
    { id: 0, x: 50, y: 150 },
    { id: 1, x: CANVAS_WIDTH - 50, y: 150 },
  ]);

  const [outputData, setOutputData] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPointIndex, setDraggedPointIndex] = useState(null);

  // --- Core Logic: Data Calculation ---
  const calculateOutputData = useCallback((currentPoints) => {
    const data = [];
    if (currentPoints.length < 2) {
      setOutputData([]);
      return;
    }

    // Sort points by X-coordinate to ensure correct segment order
    const sortedPoints = [...currentPoints].sort((a, b) => a.x - b.x);

    for (let i = 0; i < sortedPoints.length - 1; i++) {
      const p1 = sortedPoints[i];
      const p2 = sortedPoints[i + 1];

      // 1. Energy is determined by the height of the starting point (p1)
      const energyValue = mapYToEnergy(p1.y);

      // 2. Iters is determined by the horizontal distance between p1 and p2
      const deltaX = p2.x - p1.x;
      const itersValue = mapDeltaXToIters(deltaX);

      // 3. break_iters is constant as requested
      data.push({
        energy: energyValue,
        break_iters: 8, // Constant value as per user request
        iters: itersValue,
      });
    }
    setOutputData(data);
  }, []);

  // --- Canvas Drawing Logic ---
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Sort points by X-coordinate for drawing the line correctly
    const sortedPoints = [...points].sort((a, b) => a.x - b.x);

    // 1. Draw Background Grid/Guides
    ctx.strokeStyle = '#e5e7eb'; // Gray-200
    ctx.lineWidth = 1;

    // Draw horizontal guides (e.g., at 25%, 50%, 75% energy)
    for (let i = 1; i < 4; i++) {
      const y = (CANVAS_HEIGHT / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // 2. Draw the Line (Energy Profile)
    ctx.beginPath();
    ctx.strokeStyle = '#3b82f6'; // Blue-500
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Start at the first point
    if (sortedPoints.length > 0) {
      ctx.moveTo(sortedPoints[0].x, sortedPoints[0].y);
    }

    // Draw lines to subsequent points
    for (let i = 1; i < sortedPoints.length; i++) {
      ctx.lineTo(sortedPoints[i].x, sortedPoints[i].y);
    }
    ctx.stroke();

    // 3. Draw the Interactive Points
    sortedPoints.forEach(point => {
      // Circle fill
      ctx.beginPath();
      ctx.arc(point.x, point.y, POINT_RADIUS, 0, 2 * Math.PI);
      ctx.fillStyle = '#2563eb'; // Blue-600
      ctx.fill();

      // Circle outline
      ctx.strokeStyle = '#ffffff'; // White outline
      ctx.lineWidth = 2;
      ctx.stroke();
    });

  }, [points]);

  // Redraw and recalculate data whenever points change
  useEffect(() => {
    drawChart();
    calculateOutputData(points);
  }, [points, drawChart, calculateOutputData]);

  // --- Mouse Event Handlers ---

  const getCanvasCoordinates = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y };
  };

  const getNearestPointIndex = (coords) => {
    // Find if a point is being clicked/dragged
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
      // Start dragging an existing point
      setIsDragging(true);
      setDraggedPointIndex(nearestIndex);
    } else {
      // Add a new point if click is near the line path (approximate check)
      const sortedPoints = [...points].sort((a, b) => a.x - b.x);
      let isNearLine = false;

      // Simple check: check if the click is between two existing points horizontally
      for (let i = 0; i < sortedPoints.length - 1; i++) {
        const p1 = sortedPoints[i];
        const p2 = sortedPoints[i + 1];

        if (x > p1.x && x < p2.x) {
          // Calculate linear interpolation (y-value on the line)
          const slope = (p2.y - p1.y) / (p2.x - p1.x);
          const expectedY = p1.y + slope * (x - p1.x);

          // Check if click is close to the line
          if (Math.abs(y - expectedY) < DRAG_THRESHOLD) {
            isNearLine = true;
            break;
          }
        }
      }

      if (isNearLine) {
        // Create a new point
        const newPoint = {
          id: Date.now(),
          x: clamp(x, 0, CANVAS_WIDTH),
          y: clamp(y, 0, CANVAS_HEIGHT),
        };
        const newPoints = [...points, newPoint];
        setPoints(newPoints);
        // Start dragging the new point immediately
        setIsDragging(true);
        setDraggedPointIndex(newPoints.length - 1);
      }
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || draggedPointIndex === null) return;
    const { x: newX, y: newY } = getCanvasCoordinates(e);

    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      setPoints(prevPoints => {
        const updatedPoints = prevPoints.map((p, index) => {
          if (index === draggedPointIndex) {
            // Clamp X and Y coordinates to stay within canvas bounds
            // X only needs to be clamped if it's the first or last point
            const clampedX = clamp(newX, 0, CANVAS_WIDTH);
            const clampedY = clamp(newY, 0, CANVAS_HEIGHT);

            return { ...p, x: clampedX, y: clampedY };
          }
          return p;
        });
        return updatedPoints;
      });
      drawChart(); // Redraw during drag
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedPointIndex(null);
    // Ensure the final data is calculated after drag
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

  // --- Render ---

  // Attach global listeners for move and up to ensure dragging continues outside canvas
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, draggedPointIndex, handleMouseMove]); // Added dependencies to satisfy ESLint

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50 flex items-start justify-center font-sans">
      <div className="w-full max-w-5xl bg-white shadow-2xl rounded-xl p-6 border border-gray-100">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6 flex items-center">
          <Zap className="w-6 h-6 mr-3 text-blue-600" />
          Energy Profile Designer
        </h1>
        <p className="text-gray-600 mb-6">
          Click and drag the blue points to shape the energy profile. Click on the line to add a new segment point.
        </p>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* --- Canvas Area --- */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center text-sm font-semibold text-gray-700 mb-2">
              <span>Energy Profile (Click and Drag)</span>
              <span>Iters (Time)</span>
            </div>
            <div
              className="relative rounded-lg border-4 border-gray-200 shadow-inner cursor-crosshair"
              style={{ width: CANVAS_WIDTH + 'px', height: CANVAS_HEIGHT + 'px', margin: '0 auto' }}
              onMouseDown={handleMouseDown}
            >
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="block"
              />
              {/* Overlay for Y-axis labels */}
              <div className="absolute top-0 left-[-60px] h-full flex flex-col justify-between text-xs text-gray-500 font-mono">
                <span className="p-1">High E ({MAX_ENERGY})</span>
                <span className="p-1">Low E (0)</span>
              </div>
            </div>

            {/* Point Management/Deletion UI */}
            <div className="mt-4 p-3 bg-gray-100 rounded-lg shadow-sm">
              <h3 className="font-bold text-gray-700 mb-2">Segment Points ({points.length} Total)</h3>
              <div className="flex flex-wrap gap-2 text-sm">
                {[...points].sort((a, b) => a.x - b.x).map((point, index) => (
                  <div
                    key={point.id}
                    className="flex items-center bg-white border border-gray-300 rounded-full px-3 py-1 shadow-md hover:bg-red-50 transition duration-150"
                  >
                    <span className="font-medium mr-2">P{index + 1}:</span>
                    <span className="text-blue-700">E:{mapYToEnergy(point.y)}</span>
                    {points.length > 2 && (
                      <button
                        onClick={() => removePoint(point.id)}
                        title="Remove Point"
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --- Output Data List --- */}
          <div className="lg:w-96">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b pb-2">
              Calculated Output Data
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {outputData.map((data, index) => (
                <div
                  key={index}
                  className="bg-blue-50 p-4 rounded-lg shadow-md border-l-4 border-blue-600 font-mono text-sm"
                >
                  <p className="flex justify-between items-center">
                    <span className="font-bold text-gray-700">Segment {index + 1}</span>
                    <span className="text-xs text-blue-600">
                      {index === outputData.length - 1 ? 'END' : '->'}
                    </span>
                  </p>
                  <pre className="mt-2 space-y-1">
                    <span className="block text-gray-800">
                      energy: <span className="text-red-600 font-bold">{data.energy}</span>
                    </span>
                    <span className="block text-gray-800">
                      break_iters: <span className="text-green-600">{data.break_iters}</span>
                    </span>
                    <span className="block text-gray-800">
                      iters: <span className="text-purple-600 font-bold">{data.iters}</span>
                    </span>
                  </pre>
                </div>
              ))}
              {outputData.length === 0 && (
                <div className="text-center p-6 text-gray-500 bg-gray-100 rounded-lg">
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
