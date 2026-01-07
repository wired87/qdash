import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const BackgroundGraphScene = React.memo(() => {
    const mountRef = useRef(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // Scene Setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xF5F5DC); // Creme White

        // Camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 50;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);

        // Particles (Quantum Nodes)
        const particleCount = 32; // Increased count for larger life form
        const particles = [];
        const geometry = new THREE.CircleGeometry(0.15, 16); // Smaller nodes
        const material = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF, // Fully white
            transparent: true,
            opacity: 0.7, // Glasomorph
        });

        // Initialize particles in a larger cluster
        const clusterCenter = new THREE.Vector3(0, 0, 0);

        for (let i = 0; i < particleCount; i++) {
            const mesh = new THREE.Mesh(geometry, material);

            // Larger spread (approx 20-25% of screen height)
            mesh.position.x = (Math.random() - 0.5) * 15;
            mesh.position.y = (Math.random() - 0.5) * 15;
            mesh.position.z = 0;

            // Quantum state (velocity/phase)
            const velocity = new THREE.Vector3(0, 0, 0);
            const phase = Math.random() * Math.PI * 2;

            scene.add(mesh);
            particles.push({ mesh, velocity, phase, originalPos: mesh.position.clone() });
        }

        // Edges (Probability Lines)
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xFFFFFF, // Fully white edges
            transparent: true,
            opacity: 0.2 // Thin/Faint
        });

        const maxConnections = particleCount * particleCount;
        const lineGeometry = new THREE.BufferGeometry();
        const linePositions = new Float32Array(maxConnections * 6);
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(linesMesh);

        // Global movement (Intelligent Wandering)
        let wanderAngle = 0;
        const speed = 0.2;
        const globalVelocity = new THREE.Vector3(speed, 0, 0);
        let time = 0;

        // Animation Loop
        let animationId;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            time += 0.05; // Faster time for quantum jitter

            // Intelligent Wandering Logic
            // Change angle slightly each frame (simulating steering)
            wanderAngle += (Math.random() - 0.5) * 0.1;

            // Calculate velocity vector from angle
            globalVelocity.x = Math.cos(wanderAngle) * speed;
            globalVelocity.y = Math.sin(wanderAngle) * speed;

            // Move Cluster Center
            clusterCenter.add(globalVelocity);

            // Screen wrapping (Toroidal topology)
            if (clusterCenter.x > 70) clusterCenter.x = -70;
            if (clusterCenter.x < -70) clusterCenter.x = 70;
            if (clusterCenter.y > 40) clusterCenter.y = -40;
            if (clusterCenter.y < -40) clusterCenter.y = 40;

            // Quantum Dynamics
            particles.forEach((p, i) => {
                // 1. Cohesion (The "Life Form" constraint)
                const toCenter = new THREE.Vector3().subVectors(clusterCenter, p.mesh.position);
                // Non-linear attraction: weak when close, strong when far
                const distToCenter = toCenter.length();
                if (distToCenter > 12) { // Allow larger size before strong pull
                    toCenter.normalize().multiplyScalar(0.08); // Strong pull back
                    p.velocity.add(toCenter);
                } else {
                    toCenter.multiplyScalar(0.002); // Gentle hold
                    p.velocity.add(toCenter);
                }

                // 2. Quantum Jitter (Superposition simulation)
                // Rapid small movements
                p.mesh.position.x += Math.sin(time * 10 + p.phase) * 0.05;
                p.mesh.position.y += Math.cos(time * 15 + p.phase) * 0.05;

                // 3. Tunneling (Random jumps)
                if (Math.random() < 0.003) { // Lower chance per frame
                    p.mesh.position.copy(clusterCenter).add(
                        new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, 0)
                    );
                }

                // 4. Repulsion (Pauli Exclusion Principle - ish)
                particles.forEach((other, j) => {
                    if (i !== j) {
                        const dist = p.mesh.position.distanceTo(other.mesh.position);
                        if (dist < 2.0) { // Increased repulsion distance
                            const repulsion = new THREE.Vector3().subVectors(p.mesh.position, other.mesh.position);
                            repulsion.normalize().multiplyScalar(0.03);
                            p.velocity.add(repulsion);
                        }
                    }
                });

                // Damping
                p.velocity.multiplyScalar(0.94); // Less damping for more flow

                // Apply velocity
                p.mesh.position.add(p.velocity);
            });

            // Update Edges (Entanglement)
            let vertexIndex = 0;
            const connectionDistance = 10; // Longer range connections

            for (let i = 0; i < particleCount; i++) {
                for (let j = i + 1; j < particleCount; j++) {
                    const p1 = particles[i].mesh.position;
                    const p2 = particles[j].mesh.position;
                    const dist = p1.distanceTo(p2);

                    if (dist < connectionDistance) {
                        linePositions[vertexIndex++] = p1.x;
                        linePositions[vertexIndex++] = p1.y;
                        linePositions[vertexIndex++] = p1.z;

                        linePositions[vertexIndex++] = p2.x;
                        linePositions[vertexIndex++] = p2.y;
                        linePositions[vertexIndex++] = p2.z;
                    }
                }
            }

            linesMesh.geometry.setDrawRange(0, vertexIndex / 3);
            linesMesh.geometry.attributes.position.needsUpdate = true;

            // Pulse line opacity (simulating wave function collapse/flux)
            lineMaterial.opacity = 0.15 + Math.sin(time * 1.5) * 0.1;

            renderer.render(scene, camera);
        };

        animate();

        // Handle Resize
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            geometry.dispose();
            material.dispose();
            lineGeometry.dispose();
            lineMaterial.dispose();
            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={mountRef}
            className="absolute inset-0 z-0 pointer-events-none"
            style={{ background: '#F5F5DC' }}
        />
    );
});
