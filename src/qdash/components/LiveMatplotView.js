/**
 * Live matplot-style view: consumes LIVE_DATA data (dict of keys -> arrays)
 * from latestFrameRef. Renders via requestAnimationFrame; no render inside
 * WebSocket callback. Double-buffer / rAF for seamless animation in control engine.
 */
import React, { useRef, useEffect } from 'react';

const ensureArray = (v) => {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'number') return [v];
  if (typeof v === 'object' && typeof v.length === 'number') return Array.from(v);
  return [];
};

export const LiveMatplotView = ({
  latestFrameRef,
  selectedEnvId,
  isVisible,
  className = '',
  width,
  height = 160,
  fillParent = false,
}) => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!isVisible || !canvasRef.current || !latestFrameRef) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    let w;
    let h;

    if (fillParent && parent) {
      w = parent.clientWidth || width || 400;
      h = parent.clientHeight || height || 160;
    } else {
      w = width || parent?.clientWidth || 400;
      h = height || 160;
    }

    canvas.width = w;
    canvas.height = h;

    const draw = () => {
      const frame = latestFrameRef?.current;
      const data = frame?.data;
      const envId = frame?.env_id;
      if (selectedEnvId != null && envId != null && String(envId) !== String(selectedEnvId)) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      w = canvas.width;
      h = canvas.height;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1;
      ctx.font = '10px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('LIVE', 16, 12);

      if (!data || typeof data !== 'object') {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const keys = Object.keys(data).filter((k) => data[k] != null);
      if (keys.length === 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const padding = { top: 16, right: 16, bottom: 24, left: 40 };
      const plotW = w - padding.left - padding.right;
      const plotH = h - padding.top - padding.bottom;

      const colors = ['#22d3ee', '#a78bfa', '#34d399', '#fbbf24', '#f472b6', '#94a3b8'];
      let globalMin = Infinity;
      let globalMax = -Infinity;
      const series = keys.map((k) => {
        const arr = ensureArray(data[k]);
        const nums = arr.map((x) => (typeof x === 'number' ? x : Number(x)));
        if (nums.length) {
          const mn = Math.min(...nums);
          const mx = Math.max(...nums);
          if (mn < globalMin) globalMin = mn;
          if (mx > globalMax) globalMax = mx;
        }
        return { key: k, values: nums };
      });
      if (globalMin === Infinity) globalMin = 0;
      if (globalMax === -Infinity) globalMax = 1;
      const range = globalMax - globalMin || 1;

      series.forEach((s, i) => {
        const vals = s.values;
        if (vals.length < 2) return;
        const color = colors[i % colors.length];
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const step = plotW / (vals.length - 1) || 0;
        for (let j = 0; j < vals.length; j++) {
          const x = padding.left + j * step;
          const n = (vals[j] - globalMin) / range;
          const y = padding.top + plotH - n * plotH;
          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isVisible, latestFrameRef, selectedEnvId, width, height]);

  if (!isVisible) return null;

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: width || '100%',
        height: fillParent ? '100%' : height,
        display: 'block',
      }}
      aria-label="Live simulation data"
    />
  );
};

export default LiveMatplotView;
