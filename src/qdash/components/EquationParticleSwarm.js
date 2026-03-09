import React, { useRef, useEffect } from 'react';

/**
 * Default equation-based matplot-style visualization.
 *
 * Renders a yellow particle swarm moving along a parametric curve (Lissajous /
 * figure‑8 style) on a white background. Intended as a lightweight, CPU‑cheap
 * placeholder when no LIVE_DATA is available in the Engine Control Center.
 */
const EquationParticleSwarm = ({ className = '', width, height = 220 }) => {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = width || canvas.parentElement?.clientWidth || 480;
    const cssHeight = height;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = cssWidth;
    const H = cssHeight;

    // Precompute a parametric curve path (Lissajous / figure‑8).
    const NUM_SAMPLES = 800;
    const path = [];
    const a = 3;
    const b = 2;
    const delta = Math.PI / 2.7;
    const radius = Math.min(W, H) * 0.35;

    for (let i = 0; i < NUM_SAMPLES; i++) {
      const t = (i / NUM_SAMPLES) * Math.PI * 4;
      const x = Math.sin(a * t);
      const y = Math.sin(b * t + delta);
      path.push({
        x: W / 2 + x * radius,
        y: H / 2 + y * radius * 0.8,
      });
    }

    // Particle swarm: each particle moves along the curve with phase offset.
    const NUM_PARTICLES = 90;
    const particles = new Array(NUM_PARTICLES).fill(0).map((_, i) => ({
      offset: (i / NUM_PARTICLES) * NUM_SAMPLES,
      jitter: (Math.random() - 0.5) * 0.5,
    }));

    let time = 0;

    const draw = () => {
      time += 0.015;

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // Soft grid lines (matplot vibe)
      ctx.save();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.lineWidth = 0.5;
      const gridStep = 40;
      for (let x = gridStep; x < W; x += gridStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = gridStep; y < H; y += gridStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.restore();

      // Faint full curve as context.
      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.35)'; // yellow-400-ish
      for (let i = 0; i < path.length; i++) {
        const p = path[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.restore();

      // Particle swarm moving along the curve.
      ctx.save();
      ctx.fillStyle = '#facc15'; // yellow-400
      ctx.strokeStyle = 'rgba(202, 138, 4, 0.75)'; // darker outline
      ctx.lineWidth = 1;

      particles.forEach((p, idx) => {
        const speed = 1.2 + 0.4 * Math.sin(time * 0.6 + idx * 0.07);
        const idxOnCurve = (p.offset + time * speed * 120) % NUM_SAMPLES;
        const i0 = Math.floor(idxOnCurve);
        const i1 = (i0 + 1) % NUM_SAMPLES;
        const t = idxOnCurve - i0;
        const p0 = path[i0];
        const p1 = path[i1];
        const x = p0.x * (1 - t) + p1.x * t;
        const y = p0.y * (1 - t) + p1.y * t;

        const jitterX = Math.sin(time * 8 + idx * 0.37) * 2.0 * (0.5 + Math.abs(p.jitter));
        const jitterY = Math.cos(time * 9 + idx * 0.21) * 2.0 * (0.5 + Math.abs(p.jitter));

        const px = x + jitterX;
        const py = y + jitterY;

        // Trailing effect: small radial gradient per particle.
        const r = 3.2;
        const grad = ctx.createRadialGradient(px, py, 0, px, py, r * 2);
        grad.addColorStop(0, 'rgba(250, 204, 21, 0.9)');
        grad.addColorStop(1, 'rgba(250, 204, 21, 0.0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, r * 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      // Small label
      ctx.save();
      ctx.font = '10px monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Equation · particle swarm', 12, 16);
      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: width || '100%', height, display: 'block' }}
      aria-label="Equation-based particle swarm visualization"
    />
  );
};

export default EquationParticleSwarm;

