import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, Button } from '@heroui/react';
import { X } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import demoGraph from '../demo_G.json';
import EnergyDesignerWithViz from './EnergyDesignerWithViz';

// Store node configurations globally
const nodeConfigStore = {};

export const DualPaneView = ({ isOpen, onClose, envData, env_id, sendMessage }) => {
    const leftCanvasRef = useRef(null);
    const rightCanvasRef = useRef(null);
    const leftSceneRef = useRef(null);
    const rightSceneRef = useRef(null);
    const [selectedFieldNode, setSelectedFieldNode] = useState(null);
    const [hoveredFieldNode, setHoveredFieldNode] = useState(null);
    const [clickedClusterNode, setClickedClusterNode] = useState(null);
    const [isEnergyModalOpen, setIsEnergyModalOpen] = useState(false);
    const [clusterDimensions] = useState([5, 5, 5]); // 3D cluster cube dimensions
    const [blockVisualData, setBlockVisualData] = useState({
        blocks: [{
            id: Date.now(),
            points: [
                { id: 0, x: 50, y: 150 },
                { id: 1, x: 550, y: 150 },
            ],
            output: [],
            selectedTools: []
        }]
    });
    const draggedPlaneRef = useRef(null);
    const isDraggingRef = useRef(false);

    // Helper: Get unique color for field type
    const getFieldColor = (fieldType) => {
        const colors = {
            'ELECTRON': 0x00ffff,
            'MUON': 0xff00ff,
            'TAU': 0xffff00,
            'ELECTRON_NEUTRINO': 0x00ff00,
            'MUON_NEUTRINO': 0x0088ff,
            'TAU_NEUTRINO': 0x88ff00,
            'UP_QUARK': 0xff0088,
            'DOWN_QUARK': 0xff8800,
            'CHARM_QUARK': 0x88ff88,
            'STRANGE_QUARK': 0x8888ff,
            'TOP_QUARK': 0xff8888,
            'BOTTOM_QUARK': 0x88ffff,
            'PHOTON': 0xffffff,
            'W_PLUS': 0xff0000,
            'W_MINUS': 0x0000ff,
            'Z_BOSON': 0x00ff00,
            'GLUON': 0xff00ff,
            'PHI': 0xffaa00,
            'PIXEL': 0x444444,
            'ENV': 0x222222
        };
        return colors[fieldType] || 0x888888;
    };

    // Initialize left scene (demo_G graph)
    useEffect(() => {
        if (!isOpen || !leftCanvasRef.current) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        camera.position.z = 50;

        const renderer = new THREE.WebGLRenderer({ canvas: leftCanvasRef.current, antialias: true });
        renderer.setSize(leftCanvasRef.current.parentElement.clientWidth, leftCanvasRef.current.parentElement.clientHeight);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(10, 10, 10);
        scene.add(pointLight);

        // Create nodes from demo_G
        const nodeObjects = {};
        demoGraph.nodes.forEach((node) => {
            if (node.type === 'PIXEL' || node.type === 'ENV') return; // Skip non-field nodes

            const geometry = new THREE.SphereGeometry(0.8, 16, 16);
            const material = new THREE.MeshPhongMaterial({ color: getFieldColor(node.type) });
            const sphere = new THREE.Mesh(geometry, material);

            // Use position from demo_G
            const pos = node.pos || [0, 0, 0];
            sphere.position.set(pos[0], pos[1], pos[2]);
            sphere.userData = { nodeId: node.id, fieldType: node.type, originalColor: material.color.getHex() };

            scene.add(sphere);
            nodeObjects[node.id] = sphere;
        });

        // Create edges
        demoGraph.links.forEach((link) => {
            const sourceNode = nodeObjects[link.source];
            const targetNode = nodeObjects[link.target];

            if (sourceNode && targetNode) {
                const points = [sourceNode.position, targetNode.position];
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({ color: 0x333333, opacity: 0.3, transparent: true });
                const line = new THREE.Line(geometry, material);
                scene.add(line);
            }
        });

        // Raycaster for hover and click detection
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onMouseMove = (event) => {
            const rect = leftCanvasRef.current.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(Object.values(nodeObjects));

            // Reset all colors
            Object.values(nodeObjects).forEach(obj => {
                obj.material.color.setHex(obj.userData.originalColor);
            });

            if (intersects.length > 0) {
                const hoveredObj = intersects[0].object;
                hoveredObj.material.color.setHex(0xffffff);
                setHoveredFieldNode(hoveredObj.userData.nodeId);
            } else {
                setHoveredFieldNode(null);
            }
        };

        const onClick = (event) => {
            const rect = leftCanvasRef.current.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(Object.values(nodeObjects));

            if (intersects.length > 0) {
                const clicked = intersects[0].object.userData;
                setSelectedFieldNode(clicked.fieldType);
            }
        };

        leftCanvasRef.current.addEventListener('mousemove', onMouseMove);
        leftCanvasRef.current.addEventListener('click', onClick);

        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        leftSceneRef.current = { scene, camera, renderer, controls, nodeObjects };

        return () => {
            leftCanvasRef.current?.removeEventListener('mousemove', onMouseMove);
            leftCanvasRef.current?.removeEventListener('click', onClick);
            controls.dispose();
            renderer.dispose();
        };
    }, [isOpen]);

    // Initialize right scene (3D cluster cube)
    useEffect(() => {
        console.log('[DualPane] Right scene effect triggered', { isOpen, rightCanvasRef: !!rightCanvasRef.current, selectedFieldNode });

        if (!isOpen || !rightCanvasRef.current || !selectedFieldNode) {
            console.log('[DualPane] Right scene conditions not met, skipping');
            return;
        }

        console.log('[DualPane] Initializing right scene for field:', selectedFieldNode);

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111111);
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        camera.position.set(15, 15, 15);

        const renderer = new THREE.WebGLRenderer({ canvas: rightCanvasRef.current, antialias: true });
        renderer.setSize(rightCanvasRef.current.parentElement.clientWidth, rightCanvasRef.current.parentElement.clientHeight);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const pointLight = new THREE.PointLight(0xffffff, 0.8);
        pointLight.position.set(10, 10, 10);
        scene.add(pointLight);

        // Create 3D cluster cube
        const [xDim, yDim, zDim] = clusterDimensions;
        const spacing = 2.5;
        const cubeNodes = [];
        const planeGroups = { x: {}, y: {}, z: {} };

        console.log('[DualPane] Creating cluster cube with dimensions:', clusterDimensions);

        for (let x = 0; x < xDim; x++) {
            for (let y = 0; y < yDim; y++) {
                for (let z = 0; z < zDim; z++) {
                    const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
                    const material = new THREE.MeshPhongMaterial({
                        color: getFieldColor(selectedFieldNode),
                        transparent: true,
                        opacity: 0.7
                    });
                    const cube = new THREE.Mesh(geometry, material);

                    const posX = (x - xDim / 2) * spacing;
                    const posY = (y - yDim / 2) * spacing;
                    const posZ = (z - zDim / 2) * spacing;

                    cube.position.set(posX, posY, posZ);
                    cube.userData = { x, y, z, fieldType: selectedFieldNode };

                    scene.add(cube);
                    cubeNodes.push(cube);

                    // Group by planes for dragging
                    if (!planeGroups.x[x]) planeGroups.x[x] = [];
                    if (!planeGroups.y[y]) planeGroups.y[y] = [];
                    if (!planeGroups.z[z]) planeGroups.z[z] = [];

                    planeGroups.x[x].push(cube);
                    planeGroups.y[y].push(cube);
                    planeGroups.z[z].push(cube);
                }
            }
        }

        console.log('[DualPane] Created', cubeNodes.length, 'cluster nodes');

        // Raycaster for click detection
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const onClick = (event) => {
            console.log('[DualPane] Canvas click detected!', event);

            const rect = rightCanvasRef.current.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            console.log('[DualPane] Mouse coordinates:', { x: mouse.x, y: mouse.y });

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(cubeNodes);

            console.log('[DualPane] Raycaster intersects:', intersects.length, 'objects');

            if (intersects.length > 0) {
                const clicked = intersects[0].object.userData;
                console.log('[DualPane] ✅ Cluster node clicked!', clicked);

                setClickedClusterNode(clicked);

                // Initialize or load existing block data for this node
                const nodeKey = `${selectedFieldNode}:${clicked.x},${clicked.y},${clicked.z}`;
                console.log('[DualPane] Looking for existing config with key:', nodeKey);

                const existingConfig = nodeConfigStore[nodeKey];
                console.log('[DualPane] Existing config:', existingConfig);

                if (existingConfig && existingConfig.blocks) {
                    console.log('[DualPane] Loading existing block data');
                    setBlockVisualData(existingConfig);
                } else {
                    console.log('[DualPane] Initializing new block data');
                    // Initialize with default block structure
                    setBlockVisualData({
                        blocks: [{
                            id: Date.now(),
                            points: [
                                { id: 0, x: 50, y: 150 },
                                { id: 1, x: 550, y: 150 },
                            ],
                            output: [],
                            selectedTools: []
                        }]
                    });
                }

                console.log('[DualPane] Opening Energy Designer');
                setIsEnergyModalOpen(true);
            } else {
                console.log('[DualPane] ❌ No cluster node hit');
            }
        };

        console.log('[DualPane] Attaching click event listener to canvas');
        rightCanvasRef.current.addEventListener('click', onClick);

        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        rightSceneRef.current = { scene, camera, renderer, controls, cubeNodes, planeGroups };

        return () => {
            console.log('[DualPane] Cleaning up right scene');
            if (rightCanvasRef.current) {
                rightCanvasRef.current.removeEventListener('click', onClick);
            }
            controls.dispose();
            renderer.dispose();
        };
    }, [isOpen, selectedFieldNode]);

    // Save node configuration from Energy Designer
    const handleSaveNodeConfig = useCallback((data) => {
        if (!clickedClusterNode) return;

        const key = `${selectedFieldNode}:${clickedClusterNode.x},${clickedClusterNode.y},${clickedClusterNode.z}`;

        // Extract time and energy entries from all blocks
        const timeEntries = data.blocks?.flatMap(block =>
            block.output?.map(point => point.x) || []
        ) || [];

        const energyEntries = data.blocks?.flatMap(block =>
            block.output?.map(point => point.y) || []
        ) || [];

        // Store complete configuration
        nodeConfigStore[key] = {
            object: selectedFieldNode,
            field_name: selectedFieldNode,
            position_3d: `${clickedClusterNode.x},${clickedClusterNode.y},${clickedClusterNode.z}`,
            time_entries: timeEntries,
            energy_entries: energyEntries,
            blocks: data.blocks, // Store complete block data for reloading
            block_count: data.blocks?.length || 0,
            phase: 0 // Can be extended based on blocks
        };

        console.log('Saved node config:', key, nodeConfigStore[key]);
        console.log('Total configs stored:', Object.keys(nodeConfigStore).length);

        // Do not close the modal automatically after save
        // setIsEnergyModalOpen(false);
        // setClickedClusterNode(null);
    }, [selectedFieldNode, clickedClusterNode]);

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                size="full"
                classNames={{ base: "bg-black m-0 max-w-none h-screen rounded-none" }}
            >
                <ModalContent>
                    <ModalHeader className="flex items-center justify-between border-b border-gray-800 px-6">
                        <h2 className="text-white text-xl font-bold">Field Configuration - {env_id}</h2>
                        <Button
                            isIconOnly
                            variant="light"
                            onPress={onClose}
                            className="text-white"
                        >
                            <X size={24} />
                        </Button>
                    </ModalHeader>
                    <ModalBody className="p-0 flex flex-row h-full">
                        {/* Left Pane - demo_G Graph */}
                        <div className="w-1/2 relative border-r border-gray-800">
                            <div className="absolute top-4 left-4 z-10 bg-blue-600/90 backdrop-blur px-3 py-2 rounded-lg">
                                <p className="text-white text-sm font-bold">Field Graph</p>
                                {hoveredFieldNode && (
                                    <p className="text-white text-xs mt-1">Hover: {hoveredFieldNode}</p>
                                )}
                                {selectedFieldNode && (
                                    <p className="text-yellow-300 text-xs mt-1">Selected: {selectedFieldNode}</p>
                                )}
                            </div>
                            <canvas ref={leftCanvasRef} className="w-full h-full" />
                        </div>

                        {/* Right Pane - 3D Cluster Cube */}
                        <div className="w-1/2 relative">
                            <div className="absolute top-4 left-4 z-10 bg-purple-600/90 backdrop-blur px-3 py-2 rounded-lg">
                                <p className="text-white text-sm font-bold">3D Cluster Cube</p>
                                {selectedFieldNode ? (
                                    <>
                                        <p className="text-white text-xs mt-1">Field: {selectedFieldNode}</p>
                                        <p className="text-gray-300 text-xs">Click nodes to configure energy patterns</p>
                                    </>
                                ) : (
                                    <p className="text-gray-300 text-xs">Select a field from left pane</p>
                                )}
                            </div>
                            <canvas ref={rightCanvasRef} className="w-full h-full" />
                        </div>
                    </ModalBody>
                </ModalContent>
            </Modal>

            {/* Modern Energy Designer - Bottom-to-top slider */}
            {isEnergyModalOpen && clickedClusterNode && (
                <EnergyDesignerWithViz
                    initialData={blockVisualData}
                    onClose={() => {
                        console.log('[DualPane] Energy Designer closed');
                        setIsEnergyModalOpen(false);
                        setClickedClusterNode(null);
                    }}
                    onSend={handleSaveNodeConfig}
                    sendMessage={sendMessage}
                />
            )}
        </>
    );
};

export default DualPaneView;
