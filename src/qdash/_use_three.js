import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import demoG from './demo_G.json';
import { useNCFGStore } from './ncfg_store';
import { getUniqueColor } from './get_color';


const PARTICLE_COLORS = {
    'ELECTRON': 0x3b82f6, // Blue
    'MUON': 0x60a5fa,
    'TAU': 0x93c5fd,
    'NEUTRINO': 0x10b981, // Green
    'ELECTRON_NEUTRINO': 0x10b981,
    'MUON_NEUTRINO': 0x34d399,
    'TAU_NEUTRINO': 0x6ee7b7,
    'UP_QUARK': 0xef4444, // Red
    'DOWN_QUARK': 0xf87171,
    'CHARM_QUARK': 0xfca5a5,
    'STRANGE_QUARK': 0xfecaca,
    'TOP_QUARK': 0xb91c1c,
    'BOTTOM_QUARK': 0x991b1b,
    'PHOTON': 0xeab308, // Yellow
    'W_PLUS': 0x8b5cf6, // Purple
    'W_MINUS': 0xa78bfa,
    'Z_BOSON': 0xc4b5fd,
    'GLUON': 0xec4899, // Pink
    'PHI': 0xffffff, // White
};

export const ThreeScene = ({ nodes, edges, onNodeClick, env_id }) => {
    const sceneRef = useRef();
    const cameraRef = useRef();
    const rendererRef = useRef();
    const controlsRef = useRef();
    const animationIdRef = useRef();
    const canvasRef = useRef(null);

    const [selectedNodeForGrid, setSelectedNodeForGrid] = useState(null);
    const { ncfgData } = useNCFGStore();

    const nodeHitboxesRef = useRef(new Map());
    const visibleNodesRef = useRef(new Map());
    const gridPointsRef = useRef(new Map()); // Map<posKey, Mesh>
    const currentlyHovered = useRef(null);

    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2());

    // 1. Effect: Initialization
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Scene Setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050510); // Dark navy/black background
        scene.fog = new THREE.FogExp2(0x050510, 0.02); // Fog for depth

        // Camera
        const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        camera.position.set(20, 20, 50); // Angled view

        // Renderer
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        // Controls (zoom into 3D grid)
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxDistance = 400;
        controls.minDistance = 2;
        controls.enableZoom = true;
        controls.zoomSpeed = 1.2;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x3b82f6, 2, 100); // Blueish point light
        pointLight.position.set(10, 10, 10);
        scene.add(pointLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(-10, 20, -10);
        scene.add(dirLight);

        // 3D Grid background (floor + walls) — user can zoom into it
        const gridSize = 300;
        const gridDivisions = 80;
        const gridColorCenter = 0x334155;
        const gridColorLine = 0x1e293b;

        const gridFloor = new THREE.GridHelper(gridSize, gridDivisions, gridColorCenter, gridColorLine);
        gridFloor.position.y = -15;
        gridFloor.material.transparent = true;
        gridFloor.material.opacity = 0.4;
        scene.add(gridFloor);

        const gridBack = new THREE.GridHelper(gridSize, gridDivisions, gridColorCenter, gridColorLine);
        gridBack.rotation.x = Math.PI / 2;
        gridBack.position.set(0, gridSize / 2 - 15, -gridSize / 2);
        gridBack.material.transparent = true;
        gridBack.material.opacity = 0.25;
        scene.add(gridBack);

        const gridSide = new THREE.GridHelper(gridSize, gridDivisions, gridColorCenter, gridColorLine);
        gridSide.rotation.x = -Math.PI / 2;
        gridSide.rotation.y = Math.PI / 2;
        gridSide.position.set(-gridSize / 2, gridSize / 2 - 15, 0);
        gridSide.material.transparent = true;
        gridSide.material.opacity = 0.25;
        scene.add(gridSide);

        // Optional: subtle wavy manifold overlay (kept for visual interest)
        const planeGeometry = new THREE.PlaneGeometry(120, 120, 24, 24);
        const positionAttribute = planeGeometry.attributes.position;
        for (let i = 0; i < positionAttribute.count; i++) {
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);
            const z = positionAttribute.getZ(i);
            const wave = Math.sin(x * 0.08) * 1.5 + Math.cos(y * 0.08) * 1.5;
            positionAttribute.setZ(i, z + wave);
        }
        planeGeometry.computeVertexNormals();
        const gridMaterial = new THREE.MeshBasicMaterial({
            color: 0x1e293b,
            wireframe: true,
            transparent: true,
            opacity: 0.12
        });
        const gridMesh = new THREE.Mesh(planeGeometry, gridMaterial);
        gridMesh.rotation.x = -Math.PI / 2;
        gridMesh.position.y = -10;
        scene.add(gridMesh);


        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        controlsRef.current = controls;

        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;
        controlsRef.current = controls;

        const animate = () => {
            controls.update();
            renderer.render(scene, camera);
            if (gridMesh) gridMesh.rotation.z += 0.0005;
            animationIdRef.current = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            cancelAnimationFrame(animationIdRef.current);
            renderer.dispose();
        };
    }, []);

    useEffect(() => {
        const onResize = () => {
            const canvas = canvasRef.current;
            const camera = cameraRef.current;
            const renderer = rendererRef.current;
            if (!canvas || !camera || !renderer) return;

            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // 2. Effect: Update objects (Optimized)
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        // Determine which data to use (prop or demoG)
        const activeNodes = (nodes && Object.keys(nodes).length > 0) ? nodes :
            Object.fromEntries(demoG.nodes.map((n, idx) => [n.id, {
                ...n,
                color: getUniqueColor(idx, demoG.nodes.length)
            }]));

        let graphGroup = scene.getObjectByName("graphGroup");
        if (!graphGroup) {
            graphGroup = new THREE.Group();
            graphGroup.name = "graphGroup";
            scene.add(graphGroup);
        }

        // --- Toggle Visibility based on Grid View ---
        graphGroup.visible = !selectedNodeForGrid;

        // --- NODES OPTIMIZATION ---
        const existingNodes = visibleNodesRef.current; // Map<nodeId, Mesh>
        const existingHitboxes = nodeHitboxesRef.current; // Map<nodeId, Mesh>

        const activeNodeIds = new Set(Object.keys(activeNodes));

        // 1. Remove deleted nodes
        for (const [id, mesh] of existingNodes) {
            if (!activeNodeIds.has(id)) {
                graphGroup.remove(mesh);
                mesh.geometry.dispose();
                mesh.material.dispose();
                existingNodes.delete(id);

                // Remove hitbox
                const hitbox = existingHitboxes.get(id);
                if (hitbox) {
                    graphGroup.remove(hitbox);
                    hitbox.geometry.dispose();
                    hitbox.material.dispose();
                    existingHitboxes.delete(id);
                }
            }
        }

        // 2. Update or Create nodes
        Object.entries(activeNodes).forEach(([nodeId, node]) => {
            let pos;
            if (Array.isArray(node.pos) && node.pos.length === 3) {
                pos = new THREE.Vector3(...node.pos);
            } else {
                pos = new THREE.Vector3(0, 0, 0);
            }

            let sphere = existingNodes.get(nodeId);
            let hitbox = existingHitboxes.get(nodeId);

            if (sphere) {
                // UPDATE
                // Smoothly interpolate position if needed, but for now direct set
                sphere.position.copy(pos);
                hitbox.position.copy(pos);

                // Update color if changed
                const targetColor = new THREE.Color(node.color || 0x00ffff);
                if (!sphere.material.color.equals(targetColor)) {
                    sphere.material.color.set(targetColor);
                    sphere.material.emissive.set(targetColor);
                }
            } else {
                // CREATE
                // Visual Mesh: Glowing Sphere
                const geometry = new THREE.SphereGeometry(1.2, 32, 32); // Slightly larger for demo_G
                const material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(node.color || 0x00ffff),
                    emissive: new THREE.Color(node.color || 0x00ffff),
                    emissiveIntensity: 0.5,
                    roughness: 0.1,
                    metalness: 0.8
                });
                sphere = new THREE.Mesh(geometry, material);
                sphere.position.copy(pos);
                sphere.userData = { id: nodeId }; // Store ID on visual mesh too just in case

                // Add a subtle outer glow (halo)
                const haloGeo = new THREE.SphereGeometry(1.8, 16, 16);
                const haloMat = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(node.color || 0x00ffff),
                    transparent: true,
                    opacity: 0.1,
                    side: THREE.BackSide
                });
                const halo = new THREE.Mesh(haloGeo, haloMat);
                sphere.add(halo);

                graphGroup.add(sphere);
                existingNodes.set(nodeId, sphere);

                // Hitbox (invisible)
                hitbox = new THREE.Mesh(
                    new THREE.BoxGeometry(4, 4, 4),
                    new THREE.MeshBasicMaterial({ visible: false })
                );
                hitbox.position.copy(pos);
                hitbox.userData = { id: nodeId };
                graphGroup.add(hitbox);
                existingHitboxes.set(nodeId, hitbox);
            }
        });

        // --- EDGES OPTIMIZATION ---
        // For edges, it's often simpler to recreate them if the graph is small, 
        // but for full optimization, we should track them too.
        // Let's assume edges are static for now or recreate them efficiently.
        // To properly optimize edges, we need a stable ID for edges. 
        // The input 'edges' is an object with IDs, so we can use that.

        // We need a ref to track existing edges to avoid clearing them all
        // Since we didn't have one in the original code, let's just clear edges for now 
        // OR add a new ref for edges. 
        // Adding a new ref requires changing the component state/refs which is outside this block scope.
        // However, we can attach the map to the graphGroup userData or similar.
        // For safety and minimal code change impact, let's use a simple approach:
        // Remove all lines from graphGroup and recreate. 
        // BUT, to "Optimize as much as possible", we should really track them.

        // Let's find all LINE objects in the group and remove them, then re-add.
        // This is still better than clearing the whole group (which kills nodes).

        // Better: Let's assume we can't easily track edges without a new Ref.
        // Let's try to reuse the logic but only for lines.

        // Filter out non-lines (nodes are Meshes with SphereGeometry, lines are Lines)
        // Actually, we can just tag them.

        // Strategy: Remove all children that are Lines.
        for (let i = graphGroup.children.length - 1; i >= 0; i--) {
            const child = graphGroup.children[i];
            if (child.type === 'Line') {
                graphGroup.remove(child);
                child.geometry.dispose();
                child.material.dispose();
            }
        }

        // Re-add edges
        Object.entries(edges).forEach(([edge_id, struct]) => {
            // We need positions from the nodes map we just updated/read
            const startNode = existingNodes.get(struct.src);
            const endNode = existingNodes.get(struct.trgt);

            if (startNode && endNode) {
                const start = startNode.position;
                const end = endNode.position;

                const curve = new THREE.CatmullRomCurve3([start, end]);
                const points = curve.getPoints(20);
                const geometry = new THREE.BufferGeometry().setFromPoints(points);

                const material = new THREE.LineBasicMaterial({
                    color: 0x60a5fa,
                    transparent: true,
                    opacity: 0.3,
                    linewidth: 1
                });

                const line = new THREE.Line(geometry, material);
                graphGroup.add(line);
            }
        });
    }, [nodes, edges, selectedNodeForGrid]);

    // 3. Effect: Grid Overlay Logic
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;

        let gridGroup = scene.getObjectByName("gridGroup");
        if (selectedNodeForGrid) {
            if (!gridGroup) {
                gridGroup = new THREE.Group();
                gridGroup.name = "gridGroup";
                scene.add(gridGroup);
            }
            gridGroup.visible = true;

            // Clear previous grid points
            gridGroup.clear();
            gridPointsRef.current.clear();

            // Calculate Grid dimensions
            const nodeCount = demoG.nodes.length;
            const totalPoints = nodeCount * nodeCount;
            const sideSize = Math.ceil(Math.pow(totalPoints, 1 / 3));
            const spacing = 5;

            const geometry = new THREE.SphereGeometry(0.5, 16, 16);

            for (let x = 0; x < sideSize; x++) {
                for (let y = 0; y < sideSize; y++) {
                    for (let z = 0; z < sideSize; z++) {
                        const index = x + y * sideSize + z * sideSize * sideSize;
                        if (index >= totalPoints) break;

                        const pos = new THREE.Vector3(
                            (x - sideSize / 2) * spacing,
                            (y - sideSize / 2) * spacing,
                            (z - sideSize / 2) * spacing
                        );

                        const posKey = `${pos.x},${pos.y},${pos.z}`;
                        const entry = ncfgData[selectedNodeForGrid]?.[posKey];
                        const isConfigured = entry && Array.isArray(entry[0]) && entry[0].length > 0;

                        const material = new THREE.MeshStandardMaterial({
                            color: isConfigured ? 0x3b82f6 : 0x475569,
                            emissive: isConfigured ? 0x3b82f6 : 0x000000,
                            emissiveIntensity: isConfigured ? 0.8 : 0,
                            transparent: true,
                            opacity: 0.6
                        });

                        const point = new THREE.Mesh(geometry, material);
                        point.position.copy(pos);
                        point.userData = { isGridPoint: true, pos: { x: pos.x, y: pos.y, z: pos.z } };

                        gridGroup.add(point);
                        gridPointsRef.current.set(posKey, point);
                    }
                }
            }
        } else if (gridGroup) {
            gridGroup.visible = false;
        }
    }, [selectedNodeForGrid, ncfgData]);

    // 4. Interaction Effect
    useEffect(() => {
        const canvas = canvasRef.current;
        const camera = cameraRef.current;
        const scene = sceneRef.current;
        if (!canvas || !camera || !scene) return;

        const onCanvasClick = (event) => {
            event.preventDefault();
            const rect = canvas.getBoundingClientRect();
            mouseRef.current.x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
            mouseRef.current.y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;

            raycasterRef.current.setFromCamera(mouseRef.current, camera);

            if (selectedNodeForGrid) {
                const gridGroup = scene.getObjectByName("gridGroup");
                if (gridGroup) {
                    const intersects = raycasterRef.current.intersectObjects(gridGroup.children);
                    if (intersects.length > 0) {
                        const point = intersects[0].object;
                        onNodeClick(selectedNodeForGrid, env_id, point.userData.pos);
                    } else {
                        setSelectedNodeForGrid(null);
                    }
                }
            } else {
                const intersects = raycasterRef.current.intersectObjects(Array.from(nodeHitboxesRef.current.values()));
                if (intersects.length > 0) {
                    const nodeId = intersects[0].object.userData.id;
                    setSelectedNodeForGrid(nodeId);
                    onNodeClick(nodeId, env_id);
                }
            }
        };

        const onMouseMove = (event) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current.x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
            mouseRef.current.y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;

            raycasterRef.current.setFromCamera(mouseRef.current, camera);

            if (selectedNodeForGrid) {
                const gridGroup = scene.getObjectByName("gridGroup");
                if (gridGroup) {
                    const intersects = raycasterRef.current.intersectObjects(gridGroup.children);
                    if (intersects.length > 0) {
                        const point = intersects[0].object;
                        if (currentlyHovered.current !== point) {
                            if (currentlyHovered.current && currentlyHovered.current.userData.isGridPoint) {
                                currentlyHovered.current.scale.set(1, 1, 1);
                                currentlyHovered.current.material.opacity = 0.6;
                                // Remove pattern preview if any
                                const preview = currentlyHovered.current.getObjectByName("preview");
                                if (preview) currentlyHovered.current.remove(preview);
                            }
                            point.scale.set(1.5, 1.5, 1.5);
                            point.material.opacity = 0.9;

                            // Add transparent pattern/shape preview
                            const previewGeo = new THREE.BoxGeometry(2, 2, 2);
                            const previewMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.3, wireframe: true });
                            const preview = new THREE.Mesh(previewGeo, previewMat);
                            preview.name = "preview";
                            point.add(preview);

                            currentlyHovered.current = point;
                            canvas.style.cursor = 'pointer';
                        }
                    } else {
                        if (currentlyHovered.current && currentlyHovered.current.userData.isGridPoint) {
                            currentlyHovered.current.scale.set(1, 1, 1);
                            currentlyHovered.current.material.opacity = 0.6;
                            const preview = currentlyHovered.current.getObjectByName("preview");
                            if (preview) currentlyHovered.current.remove(preview);
                        }
                        currentlyHovered.current = null;
                        canvas.style.cursor = 'default';
                    }
                }
            } else {
                const intersects = raycasterRef.current.intersectObjects(Array.from(nodeHitboxesRef.current.values()));
                if (intersects.length > 0) {
                    canvas.style.cursor = 'pointer';
                } else {
                    canvas.style.cursor = 'default';
                }
            }
        };

        canvas.addEventListener('click', onCanvasClick);
        canvas.addEventListener('mousemove', onMouseMove);
        return () => {
            canvas.removeEventListener('click', onCanvasClick);
            canvas.removeEventListener('mousemove', onMouseMove);
        }
    }, [selectedNodeForGrid, onNodeClick, env_id, raycasterRef, mouseRef]);

    return <canvas
        ref={canvasRef}
        style={{
            height: "100%",
            width: '100%',
            backgroundColor: '#050510', // Match scene background
            borderRadius: '0.75rem',
            overflow: 'hidden',
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)' // Inner shadow for depth
        }}
    />
};
