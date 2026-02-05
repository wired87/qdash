import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const PARTICLE_COUNT = 1200;
const GRID_SIZE = 80;
const GRID_DIVISIONS = 40;

/**
 * Functional 3D particle simulation + rotatable grid.
 * OrbitControls: drag to rotate, scroll to zoom. Particles drift above the grid.
 */
export const ParticleGridEngine = ({ className = '' }) => {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const gridRef = useRef(null);
    const particlesRef = useRef(null);
    const frameRef = useRef(null);
    const particleVelocitiesRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf1f5f9);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
        camera.position.set(0, 14, 22);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        rendererRef.current = renderer;
        const canvas = renderer.domElement;
        canvas.style.display = 'block';
        container.appendChild(canvas);

        const controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxDistance = 120;
        controls.minDistance = 8;
        controls.enableZoom = true;
        controls.zoomSpeed = 1.2;
        controls.target.set(0, 0, 0);
        controlsRef.current = controls;

        // Floor grid (bottom of room)
        const gridColor1 = 0xcbd5e1;
        const gridColor2 = 0x94a3b8;
        const grid = new THREE.GridHelper(GRID_SIZE, GRID_DIVISIONS, gridColor1, gridColor2);
        grid.rotation.x = -Math.PI / 2;
        grid.position.y = -0.5;
        const gridMats = Array.isArray(grid.material) ? grid.material : [grid.material];
        gridMats.forEach(m => {
            m.transparent = true;
            m.opacity = 0.1;
        });
        scene.add(grid);
        gridRef.current = grid;

        // Particle system
        const positions = new Float32Array(PARTICLE_COUNT * 3);
        const colors = new Float32Array(PARTICLE_COUNT * 3);
        const half = GRID_SIZE / 2;
        const vel = new Float32Array(PARTICLE_COUNT * 3);
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            positions[i * 3] = (Math.random() - 0.5) * GRID_SIZE * 0.9;
            positions[i * 3 + 1] = Math.random() * 12 + 0.5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * GRID_SIZE * 0.9;
            const t = Math.random();
            colors[i * 3] = 0.2 + t * 0.4;
            colors[i * 3 + 1] = 0.3 + t * 0.5;
            colors[i * 3 + 2] = 0.6 + t * 0.4;
            vel[i * 3] = (Math.random() - 0.5) * 0.02;
            vel[i * 3 + 1] = (Math.random() - 0.3) * 0.015;
            vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
        }
        particleVelocitiesRef.current = vel;

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.4,
            vertexColors: true,
            transparent: true,
            opacity: 0.85,
            sizeAttenuation: true,
        });
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);
        particlesRef.current = { points: particles, geometry: particleGeometry };

        const resize = () => {
            if (!container || !camera || !renderer) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        resize();
        window.addEventListener('resize', resize);

        const animate = () => {
            frameRef.current = requestAnimationFrame(animate);
            const pts = particlesRef.current;
            const velocities = particleVelocitiesRef.current;
            if (pts && velocities) {
                const pos = pts.geometry.attributes.position.array;
                for (let i = 0; i < PARTICLE_COUNT; i++) {
                    pos[i * 3] += velocities[i * 3];
                    pos[i * 3 + 1] += velocities[i * 3 + 1];
                    pos[i * 3 + 2] += velocities[i * 3 + 2];
                    if (pos[i * 3] < -half || pos[i * 3] > half) velocities[i * 3] *= -1;
                    if (pos[i * 3 + 1] < 0.5 || pos[i * 3 + 1] > 14) velocities[i * 3 + 1] *= -1;
                    if (pos[i * 3 + 2] < -half || pos[i * 3 + 2] > half) velocities[i * 3 + 2] *= -1;
                }
                pts.geometry.attributes.position.needsUpdate = true;
            }
            if (controlsRef.current) controlsRef.current.update();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            if (controlsRef.current) controlsRef.current.dispose();
            if (container && renderer.domElement) container.removeChild(renderer.domElement);
            renderer.dispose();
            grid.geometry?.dispose();
            const gridMat = grid.material;
            if (Array.isArray(gridMat)) gridMat.forEach(m => m.dispose());
            else gridMat?.dispose();
            const pts = particlesRef.current;
            if (pts) {
                pts.geometry.dispose();
                pts.points.material.dispose();
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className={`w-full h-full min-h-0 relative ${className}`}
            style={{ touchAction: 'none', minHeight: 0 }}
            aria-label="3D particle grid – drag to rotate, scroll to zoom"
        />
    );
};

export default ParticleGridEngine;
