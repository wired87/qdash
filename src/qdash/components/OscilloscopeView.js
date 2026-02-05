import React, { useRef, useEffect, useCallback } from 'react';

/**
 * Oscilloscope-style visualization for simulation data streams.
 * Renders time-series / n-D param values as rolling waveforms with a retro CRT look:
 * dark background, phosphor-style traces, grid overlay.
 * Data shape: array of [timestep, value1, value2, ...] — first element is time/index, rest are channels.
 */
const PHOSPHOR_COLORS = [
  'rgba(57, 255, 20, 0.9)',   // classic green
  'rgba(255, 176, 0, 0.9)',   // amber
  'rgba(0, 212, 255, 0.9)',   // cyan
  'rgba(255, 85, 85, 0.9)',   // red
];
const GRID_COLOR = 'rgba(57, 255, 20, 0.12)';
const GRID_MAJOR_COLOR = 'rgba(57, 255, 20, 0.2)';
const GLOW_COLOR = 'rgba(57, 255, 20, 0.15)';
const MAX_SAMPLES = 120; // rolling window length

export const OscilloscopeView = ({
  data = [],
  isDarkMode = true,
  maxSamples = MAX_SAMPLES,
  showGrid = true,
  showGlow = true,
  height = 200,
  className = '',
}) => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const padding = { top: 16, right: 16, bottom: 24, left: 48 };
    const plotW = w - padding.left - padding.right;
    const plotH = h - padding.top - padding.bottom;

    // Clear with dark background
    ctx.fillStyle = isDarkMode ? '#0a0e14' : '#1a1e24';
    ctx.fillRect(0, 0, w, h);

    if (!data || data.length === 0) {
      ctx.fillStyle = isDarkMode ? 'rgba(57, 255, 20, 0.4)' : 'rgba(0,0,0,0.6)';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('AWAITING DATA STREAM...', w / 2, h / 2);
      return;
    }

    const samples = data.slice(-maxSamples);
    const numChannels = samples[0] ? samples[0].length - 1 : 0;
    if (numChannels === 0) return;

    // Value range across all channels (index 0 is timestep)
    let minVal = Infinity;
    let maxVal = -Infinity;
    samples.forEach((row) => {
      for (let i = 1; i < row.length; i++) {
        const v = Number(row[i]);
        if (!Number.isNaN(v)) {
          minVal = Math.min(minVal, v);
          maxVal = Math.max(maxVal, v);
        }
      }
    });
    if (minVal === Infinity) minVal = 0;
    if (maxVal === minVal) maxVal = minVal + 1;
    const range = maxVal - minVal;
    const margin = range * 0.05 || 1;
    const yMin = minVal - margin;
    const yMax = maxVal + margin;
    const yRange = yMax - yMin;

    const xScale = (i) => padding.left + (i / (samples.length - 1 || 1)) * plotW;
    const yScale = (val) => padding.top + plotH - ((Number(val) - yMin) / yRange) * plotH;

    // Grid
    if (showGrid) {
      const majorStepY = yRange / 5;
      const minorStepY = majorStepY / 5;
      for (let v = Math.floor(yMin / minorStepY) * minorStepY; v <= yMax; v += minorStepY) {
        const y = yScale(v);
        if (y < padding.top || y > padding.top + plotH) continue;
        ctx.strokeStyle = Math.abs((v - yMin) % majorStepY) < minorStepY / 2 ? GRID_MAJOR_COLOR : GRID_COLOR;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + plotW, y);
        ctx.stroke();
      }
      for (let i = 0; i <= 10; i++) {
        const x = padding.left + (i / 10) * plotW;
        ctx.strokeStyle = i % 5 === 0 ? GRID_MAJOR_COLOR : GRID_COLOR;
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + plotH);
        ctx.stroke();
      }
    }

    // Traces per channel
    for (let ch = 0; ch < numChannels; ch++) {
      const color = PHOSPHOR_COLORS[ch % PHOSPHOR_COLORS.length];
      const points = [];
      samples.forEach((row, i) => {
        const val = row[ch + 1];
        if (val === undefined || Number.isNaN(Number(val))) return;
        points.push({ x: xScale(i), y: yScale(Number(val)) });
      });
      if (points.length < 2) continue;

      // Glow (wider, faded line behind)
      if (showGlow) {
        ctx.strokeStyle = GLOW_COLOR;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
        ctx.stroke();
      }

      // Main trace
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    }

    // Axis labels (optional, minimal)
    ctx.fillStyle = GRID_MAJOR_COLOR;
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(String(yMin.toFixed(1)), padding.left - 6, padding.top + plotH + 4);
    ctx.fillText(String(yMax.toFixed(1)), padding.left - 6, padding.top + 4);
  }, [data, isDarkMode, maxSamples, showGrid, showGlow]);

  useEffect(() => {
    const run = () => {
      draw();
      rafRef.current = requestAnimationFrame(run);
    };
    rafRef.current = requestAnimationFrame(run);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => draw());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw]);

  return (
    <div className={`relative overflow-hidden rounded-lg border border-slate-700/50 ${className}`} style={{ height }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      {data && data[0] && data[0].length > 1 && (
        <div className="absolute bottom-2 left-2 flex gap-2 flex-wrap pointer-events-none">
          {Array.from({ length: data[0].length - 1 }).map((_, ch) => (
            <span
              key={ch}
              className="text-[10px] font-mono text-emerald-400/90"
              style={{ textShadow: '0 0 6px currentColor' }}
            >
              Ch{ch + 1}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default OscilloscopeView;
