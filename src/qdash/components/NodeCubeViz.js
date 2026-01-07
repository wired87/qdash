import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const NodeCubeViz = () => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const animationIdRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0f172a); // slate-900
        sceneRef.current = scene;

        // Camera setup
        const camera = new THREE.PerspectiveCamera(
            75,
            mountRef.current.clientWidth / mountRef.current.clientHeight,
            0.1,
            1000
        );
        camera.position.set(4, 4, 4);
        camera.lookAt(0, 0, 0);

        // Renderer setup
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Create 3x3x3 cube of nodes
        const spacing = 1.2;
        const nodeGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const centerNodeMaterial = new THREE.MeshPhongMaterial({
            color: 0xef4444, // red-500
            emissive: 0xff0000,
            emissiveIntensity: 0.5
        });
        const normalNodeMaterial = new THREE.MeshPhongMaterial({
            color: 0x3b82f6, // blue-500
            emissive: 0x1e40af,
            emissiveIntensity: 0.2
        });

        const nodes = [];
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const isCenterNode = (x === 0 && y === 0 && z === 0);
                    const material = isCenterNode ? centerNodeMaterial : normalNodeMaterial;
                    const node = new THREE.Mesh(nodeGeometry, material);
                    node.position.set(x * spacing, y * spacing, z * spacing);
                    scene.add(node);
                    nodes.push(node);

                    // Add glowing effect for center node
                    if (isCenterNode) {
                        const glowGeometry = new THREE.SphereGeometry(0.25, 16, 16);
                        const glowMaterial = new THREE.MeshBasicMaterial({
                            color: 0xff0000,
                            transparent: true,
                            opacity: 0.3
                        });
                        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
                        node.add(glow);
                    }
                }
            }
        }

        // Add connections between nodes
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x475569, // slate-600
            opacity: 0.3,
            transparent: true
        });

        // Connect each node to its neighbors
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const currentPos = new THREE.Vector3(x * spacing, y * spacing, z * spacing);

                    // Connect to neighbors (right, up, forward)
                    if (x < 1) {
                        const points = [
                            currentPos,
                            new THREE.Vector3((x + 1) * spacing, y * spacing, z * spacing)
                        ];
                        const geometry = new THREE.BufferGeometry().setFromPoints(points);
                        const line = new THREE.Line(geometry, lineMaterial);
                        scene.add(line);
                    }
                    if (y < 1) {
                        const points = [
                            currentPos,
                            new THREE.Vector3(x * spacing, (y + 1) * spacing, z * spacing)
                        ];
                        const geometry = new THREE.BufferGeometry().setFromPoints(points);
                        const line = new THREE.Line(geometry, lineMaterial);
                        scene.add(line);
                    }
                    if (z < 1) {
                        const points = [
                            currentPos,
                            new THREE.Vector3(x * spacing, y * spacing, (z + 1) * spacing)
                        ];
                        const geometry = new THREE.BufferGeometry().setFromPoints(points);
                        const line = new THREE.Line(geometry, lineMaterial);
                        scene.add(line);
                    }
                }
            }
        }

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffffff, 1, 100);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 100);
        pointLight2.position.set(-5, -5, -5);
        scene.add(pointLight2);

        // Animation loop
        const animate = () => {
            animationIdRef.current = requestAnimationFrame(animate);

            // Rotate the entire scene
            scene.rotation.y += 0.003;
            scene.rotation.x += 0.001;

            renderer.render(scene, camera);
        };
        animate();

        // Handle resize
        const handleResize = () => {
            if (!mountRef.current) return;
            const width = mountRef.current.clientWidth;
            const height = mountRef.current.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
            }
            if (mountRef.current && rendererRef.current) {
                mountRef.current.removeChild(rendererRef.current.domElement);
            }
            if (rendererRef.current) {
                rendererRef.current.dispose();
            }
        };
    }, []);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

            {/* Info overlay */}
            <div style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                right: '1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.95)',
                color: 'white',
                padding: '1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                textAlign: 'center'
            }}>
                <div style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>🔴 Center Node Configuration</div>
                <div>You are setting the energy profile for the <strong>red marked center node</strong> in this 3×3×3 cube (27 nodes)</div>
            </div>

            {/* Legend */}
            <div style={{
                position: 'absolute',
                bottom: '1rem',
                left: '1rem',
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                    <span>Center Node (Target)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3b82f6' }}></div>
                    <span>Neighbor Nodes (26)</span>
                </div>
            </div>
        </div>
    );
};

export default NodeCubeViz;
