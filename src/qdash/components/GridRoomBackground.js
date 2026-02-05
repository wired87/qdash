import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * 3D room background: only the bottom (floor grid) is visible.
 * Renders a subtle grid floor as the "bottom" of a room, used as background for the Engine Control Center.
 */
export const GridRoomBackground = ({ className = '' }) => {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const gridRef = useRef(null);
    const frameRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf8fafc);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
        camera.position.set(0, 12, 18);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        rendererRef.current = renderer;
        const canvas = renderer.domElement;
        canvas.style.pointerEvents = 'none';
        container.appendChild(canvas);

        const gridSize = 80;
        const gridDivisions = 40;
        const gridColor1 = 0xe2e8f0;
        const gridColor2 = 0xcbd5e1;
        const grid = new THREE.GridHelper(gridSize, gridDivisions, gridColor1, gridColor2);
        grid.rotation.x = -Math.PI / 2;
        grid.position.y = -0.5;
        const materials = Array.isArray(grid.material) ? grid.material : [grid.material];
        materials.forEach(m => {
            m.transparent = true;
            m.opacity = 0.35;
        });
        scene.add(grid);
        gridRef.current = grid;

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
            if (gridRef.current) gridRef.current.rotation.z += 0.0002;
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            if (container && renderer.domElement) container.removeChild(renderer.domElement);
            renderer.dispose();
            grid.geometry?.dispose();
            const mat = grid.material;
            if (Array.isArray(mat)) mat.forEach(m => m.dispose());
            else mat?.dispose();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className={`absolute inset-0 w-full h-full pointer-events-none overflow-hidden ${className}`}
            style={{ zIndex: 0 }}
            aria-hidden
        />
    );
};

export default GridRoomBackground;
