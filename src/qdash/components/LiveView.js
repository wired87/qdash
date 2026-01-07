import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

export const LiveView = ({ data = [], isDarkMode, onToggleDarkMode }) => {
    const mountRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Refs for Three.js objects to access them inside loops/effects without re-renders
    const sceneRef = useRef(null);
    const particlesRef = useRef([]);
    const rendererRef = useRef(null);
    const frameIdRef = useRef(null);

    // Data cycling logic
    useEffect(() => {
        if (!data || data.length === 0) return;
        const intervalId = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % data.length);
        }, 100); // Slightly faster update for smooth animation
        return () => clearInterval(intervalId);
    }, [data]);

    // Three.js Setup
    useEffect(() => {
        if (!mountRef.current) return;

        // Scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.background = new THREE.Color(isDarkMode ? 0x020617 : 0xf8fafc); // Slate-950 or Slate-50
        scene.fog = new THREE.FogExp2(isDarkMode ? 0x020617 : 0xf8fafc, 0.02);

        // Camera
        const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
        camera.position.set(0, 20, 40);
        camera.lookAt(0, 0, 0);

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0x3b82f6, 2, 100);
        pointLight.position.set(10, 20, 10);
        scene.add(pointLight);

        // Grid (Optional, for reference)
        const gridHelper = new THREE.GridHelper(100, 50, isDarkMode ? 0x1e293b : 0xcbd5e1, isDarkMode ? 0x0f172a : 0xe2e8f0);
        scene.add(gridHelper);

        // Particle System Setup
        // We'll create a fixed number of particles based on max expected channels (e.g., 64)
        // or dynamic based on data. Let's assume max 64 for now or create on fly.
        // Better: Create a group and populate it.
        const particleGroup = new THREE.Group();
        scene.add(particleGroup);

        // Animation Loop
        const animate = () => {
            frameIdRef.current = requestAnimationFrame(animate);

            // Rotate group slightly
            particleGroup.rotation.y += 0.002;

            renderer.render(scene, camera);
        };
        animate();

        // Resize Handler
        const handleResize = () => {
            if (!mountRef.current) return;
            camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(frameIdRef.current);
            window.removeEventListener('resize', handleResize);
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []); // Run once on mount

    // Update Particles based on Data and DarkMode
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        // Update background color
        scene.background.setHex(isDarkMode ? 0x020617 : 0xf8fafc);
        scene.fog.color.setHex(isDarkMode ? 0x020617 : 0xf8fafc);

        // Get current frame data
        const currentFrameData = (data && data.length > 0) ? data[currentIndex] : null;

        if (currentFrameData) {
            // First element is timestep, rest are values
            const values = currentFrameData.slice(1);
            const particleGroup = scene.children.find(c => c.type === 'Group');

            if (particleGroup) {
                // Ensure we have enough particles
                while (particleGroup.children.length < values.length) {
                    const geometry = new THREE.SphereGeometry(0.8, 16, 16);
                    const material = new THREE.MeshStandardMaterial({
                        color: 0x3b82f6,
                        roughness: 0.1,
                        metalness: 0.5
                    });
                    const mesh = new THREE.Mesh(geometry, material);

                    // Arrange in a spiral or circle
                    const i = particleGroup.children.length;
                    const angle = i * 0.5;
                    const radius = 5 + i * 0.5;
                    mesh.position.x = Math.cos(angle) * radius;
                    mesh.position.z = Math.sin(angle) * radius;

                    particleGroup.add(mesh);
                }

                // Update particles
                values.forEach((val, idx) => {
                    const particle = particleGroup.children[idx];
                    if (particle) {
                        // Map value to Y position (height)
                        // Assuming val is roughly 0-100 based on previous mock data
                        const targetY = (val / 5);

                        // Smooth lerp
                        particle.position.y += (targetY - particle.position.y) * 0.1;

                        // Scale based on value
                        const scale = 0.5 + (val / 100);
                        particle.scale.setScalar(scale);

                        // Color based on value (Blue -> Red gradient)
                        const color = new THREE.Color();
                        // Simple heatmap: Low=Blue, High=Red
                        color.setHSL(0.6 - (val / 150), 1.0, 0.5);
                        particle.material.color.lerp(color, 0.1);
                        particle.material.emissive.lerp(color, 0.1);
                        particle.material.emissiveIntensity = 0.5;
                    }
                });
            }
        }

    }, [data, currentIndex, isDarkMode]);

    const timestep = (data && data.length > 0) ? data[currentIndex][0] : "Waiting...";

    return (
        <div className="w-full h-full relative">
            {/* Three.js Canvas Container */}
            <div ref={mountRef} className="w-full h-full absolute inset-0 z-0" />

            {/* UI Overlay */}
            <div className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none flex flex-col justify-between p-6">
                {/* Header */}
                <div className="flex justify-between items-start pointer-events-auto">
                    <div className="space-y-1">
                        <h2 className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                            3D Particle Simulation
                        </h2>
                        <div className={`text-sm font-medium font-mono ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            TIMESTEP: {timestep}
                        </div>
                    </div>
                </div>

                {/* Footer / Legend */}
                <div className="pointer-events-auto">
                    {(!data || data.length === 0) && (
                        <div className="inline-block px-4 py-2 rounded-full bg-slate-100 text-slate-500 text-xs font-bold animate-pulse">
                            AWAITING DATA STREAM...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
