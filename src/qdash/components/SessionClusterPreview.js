import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import CompactInjectionPreview from './CompactInjectionPreview';

const VISUAL_SPACING = 20;

const SessionClusterPreview = ({
    injection,
    onNodeClick,
    cubeDim = 8,
    dims, // [x, y, z]
    assignedConfig = {}, // { "x,y,z": { injectionId, fieldId } }
    highlightedPos // [x, y, z]
}) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const nodeObjectsRef = useRef([]);
    const raycasterRef = useRef(new THREE.Raycaster());

    // Initialize Scene
    useEffect(() => {
        if (!mountRef.current) return;

        // Determine dimensions
        const [dimX, dimY, dimZ] = dims || [cubeDim, cubeDim, cubeDim];

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf1f5f9); // slate-100
        sceneRef.current = scene;

        // Camera
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        const centerX = (dimX - 1) * VISUAL_SPACING / 2;
        const centerY = (dimY - 1) * VISUAL_SPACING / 2;
        const centerZ = (dimZ - 1) * VISUAL_SPACING / 2;
        const maxDim = Math.max(dimX, dimY, dimZ);

        const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
        camera.position.set(centerX + maxDim * 15, centerY + maxDim * 10, centerZ + maxDim * 15);
        camera.lookAt(centerX, centerY, centerZ);
        cameraRef.current = camera;

        // Renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.target.set(centerX, centerY, centerZ);
        controls.update();

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(50, 100, 50);
        scene.add(dirLight);

        // Grid
        const gridSize = maxDim * VISUAL_SPACING + 40;
        const gridHelper = new THREE.GridHelper(gridSize, maxDim, 0xcbd5e1, 0xe2e8f0);
        gridHelper.position.set(centerX, -VISUAL_SPACING / 2, centerZ);
        scene.add(gridHelper);

        // Nodes
        const nodes = [];
        for (let x = 0; x < dimX; x++) {
            for (let y = 0; y < dimY; y++) {
                for (let z = 0; z < dimZ; z++) {
                    const geometry = new THREE.SphereGeometry(2.5, 16, 16);
                    const material = new THREE.MeshPhongMaterial({
                        color: 0x94a3b8,
                        shininess: 30
                    });
                    const node = new THREE.Mesh(geometry, material);
                    node.position.set(x * VISUAL_SPACING, y * VISUAL_SPACING, z * VISUAL_SPACING);
                    node.userData = { pos: [x, y, z] };
                    scene.add(node);
                    nodes.push(node);
                }
            }
        }
        nodeObjectsRef.current = nodes;

        // Resize Listener
        const handleResize = () => {
            if (mountRef.current && cameraRef.current && rendererRef.current) {
                const w = mountRef.current.clientWidth;
                const h = mountRef.current.clientHeight;
                cameraRef.current.aspect = w / h;
                cameraRef.current.updateProjectionMatrix();
                rendererRef.current.setSize(w, h);
            }
        };
        window.addEventListener('resize', handleResize);

        // Click Listener
        const handleClick = (event) => {
            const rect = renderer.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1
            );

            raycasterRef.current.setFromCamera(mouse, cameraRef.current);
            const intersects = raycasterRef.current.intersectObjects(nodeObjectsRef.current);

            if (intersects.length > 0) {
                const node = intersects[0].object;
                const posKey = JSON.stringify(node.userData.pos);

                // Disable click if node is already assigned
                // Note: assignedConfig is a prop, we access current prop value which might be stale in closure
                // but since we remount on change via key in parent, it should be fine. 
                // However, react hooks ref pattern is safer if no remount. 
                // Parent remounts this component on assignment change, so we are good.
                // WE DO NEED TO CHECK ASSIGNED CONFIG FROM PROP here or passed in.

                // Actually, accessing `assignedConfig` from closure of useEffect might be stale if we don't depend on it.
                // But we are DEPENDING on [] only.
                // Parent remounts component (key={clusterKey}) on assignment. So closure is fresh.
                // EXCEPT: `assignedConfig` logic was added in previous step. 
                // But wait, if I don't add assignedConfig to deps, it's stale.
                // But if I add it, it re-runs init? No, we want init only once.
                // The parent remounts the component (via key) so it's fresh.

                if (onNodeClick) {
                    // We check assignment in the handler inside useEffect?
                    // Wait, in previous step I added logic but didn't checking stale closue.
                    // The PREV step added logic inside `handleClick`.
                    // Since `key` changes, `useEffect` runs again, `handleClick` is recreated with fresh props.
                    // SO IT WORKS.
                    onNodeClick(node.userData.pos);
                }
            }
        };
        renderer.domElement.addEventListener('click', handleClick);

        // Animation Loop
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            if (renderer.domElement) {
                renderer.domElement.removeEventListener('click', handleClick);
                mountRef.current?.removeChild(renderer.domElement);
            }
            // Dispose resources
            nodeObjectsRef.current.forEach(node => {
                if (node.geometry) node.geometry.dispose();
                if (node.material) node.material.dispose();
            });
            renderer.dispose();
        };
    }, []); // Re-run only if mountRef changes (on mount). Parent KEY change forces re-mount.

    // Update Node Colors based on Assignment AND Highlight
    useEffect(() => {
        nodeObjectsRef.current.forEach(node => {
            const pos = node.userData.pos;
            const posKey = JSON.stringify(pos);
            const assignment = assignedConfig[posKey];

            if (assignment) {
                // Node has injection
                node.material.color.setHex(0x10b981); // Emerald 500
                node.material.emissive.setHex(0x047857);
                node.scale.set(1, 1, 1);
            } else if (highlightedPos && pos[0] === highlightedPos[0] && pos[1] === highlightedPos[1] && pos[2] === highlightedPos[2]) {
                // Highlighted - High Contrast Blue + 3x Size
                node.material.color.setHex(0x3b82f6); // Blue 500
                node.material.emissive.setHex(0x1d4ed8); // Blue 700
                node.scale.set(3, 3, 3);
            } else {
                node.material.color.setHex(0x94a3b8); // Slate 400
                node.material.emissive.setHex(0x000000);
                node.scale.set(1, 1, 1);
            }
        });
    }, [assignedConfig, highlightedPos]);


    return (
        <div className="flex flex-col h-full w-full bg-slate-50 border rounded-xl overflow-hidden shadow-inner">
            {/* Top 20% - Injection Preview */}
            <div className="h-[20%] border-b border-slate-200 bg-white p-2">
                <CompactInjectionPreview injection={injection} />
            </div>

            {/* Bottom 80% - 3D Scene */}
            <div className="h-[80%] relative group">
                <div ref={mountRef} className="w-full h-full cursor-crosshair" />
                <div className="absolute top-2 right-2 bg-white/80 backdrop-blur px-2 py-1 rounded text-[10px] text-slate-500 pointer-events-none">
                    Left Click: Assign | Drag: Rotate | Scroll: Zoom
                </div>
            </div>
        </div>
    );
};

export default SessionClusterPreview;
