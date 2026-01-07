import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2 } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useSelector } from 'react-redux';
import CompactInjectionPreview from './CompactInjectionPreview';
import { USER_ID_KEY } from '../auth';


/**
 * Bottom-to-top cluster injection modal with drag-and-drop
 * - Left 60%: Interactive 3D cube
 * - Right 40%: Top 20% preview + Bottom 80% injection list
 */
const ClusterInjectionModal = ({ isOpen, onClose, envId, envData, sendMessage }) => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const nodeObjectsRef = useRef([]);
    const raycasterRef = useRef(new THREE.Raycaster());

    const [injections, setInjections] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [previewInjection, setPreviewInjection] = useState(null);
    const [nodeConfig, setNodeConfig] = useState({}); // {[x,y,z]: [inj_items]}
    const [selectedNode, setSelectedNode] = useState(null);
    const [draggingInjection, setDraggingInjection] = useState(null);
    const [dragStartPos, setDragStartPos] = useState(null);

    const cubeDim = envData?.amount_of_nodes || envData?.config?.amount_of_nodes || 8;
    const VISUAL_SPACING = 20;

    // Request injections
    useEffect(() => {
        if (isOpen && sendMessage) {
            const userId = localStorage.getItem(USER_ID_KEY);
            setIsLoading(true);
            sendMessage({
                auth: {
                    user_id: userId,

                },
                data: {},
                type: "GET_INJ_USER",
                status: {
                    error: null,
                    state: "pending",
                    message: "Loading injections for cluster",
                    code: null
                }
            });
        }
    }, [isOpen, sendMessage]);

    const { userInjections } = useSelector(state => state.injections);

    // Sync from Redux
    useEffect(() => {
        if (userInjections) {
            const items = Array.isArray(userInjections)
                ? userInjections.map(inj => ({
                    id: inj.id,
                    data: inj.data || ((inj.times && inj.energies) ? [[...inj.times], [...inj.energies]] : [[], []]),
                    ...inj
                }))
                : [];
            setInjections(items);
            setIsLoading(false);
        }
    }, [userInjections]);

    // 3D Scene setup
    useEffect(() => {
        if (!isOpen || !mountRef.current) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf8fafc);
        sceneRef.current = scene;

        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
        const centerOffset = (cubeDim - 1) * VISUAL_SPACING / 2;
        camera.position.set(centerOffset + 100, centerOffset + 100, centerOffset + 150);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.target.set(centerOffset, centerOffset, centerOffset);
        controls.update();
        controlsRef.current = controls;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 100, 50);
        scene.add(directionalLight);

        // Create nodes
        const nodeObjects = [];
        for (let x = 0; x < cubeDim; x++) {
            for (let y = 0; y < cubeDim; y++) {
                for (let z = 0; z < cubeDim; z++) {
                    const geometry = new THREE.SphereGeometry(3, 16, 16);
                    const material = new THREE.MeshPhongMaterial({
                        color: 0x3b82f6,
                        emissive: 0x3b82f6,
                        emissiveIntensity: 0.2
                    });
                    const sphere = new THREE.Mesh(geometry, material);
                    sphere.position.set(x * VISUAL_SPACING, y * VISUAL_SPACING, z * VISUAL_SPACING);
                    sphere.userData = { realPos: [x, y, z] };
                    scene.add(sphere);
                    nodeObjects.push(sphere);
                }
            }
        }
        nodeObjectsRef.current = nodeObjects;

        // Grid
        const gridHelper = new THREE.GridHelper(cubeDim * VISUAL_SPACING, cubeDim, 0xcccccc, 0xeeeeee);
        gridHelper.position.set(centerOffset, 0, centerOffset);
        scene.add(gridHelper);

        // Animation
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // Click handler
        const handleClick = (event) => {
            const rect = renderer.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1
            );

            raycasterRef.current.setFromCamera(mouse, camera);
            const intersects = raycasterRef.current.intersectObjects(nodeObjects);

            if (intersects.length > 0) {
                const clickedNode = intersects[0].object;
                setSelectedNode(clickedNode.userData.realPos);
            }
        };

        // Drop handler
        const handleDrop = (event) => {
            event.preventDefault();
            if (!draggingInjection) return;

            const rect = renderer.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((event.clientX - rect.left) / rect.width) * 2 - 1,
                -((event.clientY - rect.top) / rect.height) * 2 + 1
            );

            raycasterRef.current.setFromCamera(mouse, camera);
            const intersects = raycasterRef.current.intersectObjects(nodeObjects);

            if (intersects.length > 0) {
                const node = intersects[0].object;
                const position = node.userData.realPos;
                addInjectionToNode(position, draggingInjection);
            }

            setDraggingInjection(null);
        };

        renderer.domElement.addEventListener('click', handleClick);
        renderer.domElement.addEventListener('drop', handleDrop);
        renderer.domElement.addEventListener('dragover', (e) => e.preventDefault());

        return () => {
            renderer.domElement.removeEventListener('click', handleClick);
            renderer.domElement.removeEventListener('drop', handleDrop);
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
            controls.dispose();
        };
    }, [isOpen, cubeDim, draggingInjection]);

    // Update node colors
    useEffect(() => {
        if (!nodeObjectsRef.current.length) return;

        nodeObjectsRef.current.forEach(node => {
            const posKey = JSON.stringify(node.userData.realPos);
            const hasInjections = nodeConfig[posKey]?.length > 0;

            if (hasInjections) {
                node.material.color.setHex(0x10b981); // Green
                node.material.emissive.setHex(0x10b981);
                node.material.emissiveIntensity = 0.4;
            } else {
                node.material.color.setHex(0x3b82f6); // Blue
                node.material.emissive.setHex(0x3b82f6);
                node.material.emissiveIntensity = 0.2;
            }
        });
    }, [nodeConfig]);

    // Interactive rotation/zoom during drag
    useEffect(() => {
        const handleMouseMove = (event) => {
            if (!draggingInjection || !cameraRef.current) return;

            if (!dragStartPos) {
                setDragStartPos({ x: event.clientX, y: event.clientY });
                return;
            }

            const deltaX = event.clientX - dragStartPos.x;
            const deltaY = event.clientY - dragStartPos.y;

            // Rotate camera
            if (controlsRef.current) {
                const rotationSpeed = 0.003;
                controlsRef.current.rotateLeft(deltaX * rotationSpeed);
                controlsRef.current.rotateUp(deltaY * rotationSpeed);
            }

            setDragStartPos({ x: event.clientX, y: event.clientY });
        };

        const handleWheel = (event) => {
            if (draggingInjection && cameraRef.current) {
                event.preventDefault();
                const zoomSpeed = 5;
                cameraRef.current.position.z += event.deltaY * 0.01 * zoomSpeed;
                cameraRef.current.position.z = Math.max(100, Math.min(500, cameraRef.current.position.z));
            }
        };

        if (draggingInjection) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('wheel', handleWheel, { passive: false });
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('wheel', handleWheel);
        };
    }, [draggingInjection, dragStartPos]);

    const addInjectionToNode = (position, injection) => {
        const posKey = JSON.stringify(position);
        setNodeConfig(prev => ({
            ...prev,
            [posKey]: [...(prev[posKey] || []), injection]
        }));
    };

    const removeInjectionFromNode = (position, injectionId) => {
        const posKey = JSON.stringify(position);
        setNodeConfig(prev => {
            const updated = { ...prev };
            updated[posKey] = (updated[posKey] || []).filter(inj => inj.id !== injectionId);
            if (updated[posKey].length === 0) {
                delete updated[posKey];
            }
            return updated;
        });
    };

    const handleConfirm = () => {
        if (sendMessage) {
            const userId = localStorage.getItem(USER_ID_KEY);
            sendMessage({
                auth: {
                    user_id: userId,
                    env_id: envId
                },
                data: {
                    config: nodeConfig
                },
                type: "SET_CLUSTER_INJECTION",
                status: {
                    error: null,
                    state: "pending",
                    message: "Applying cluster configuration",
                    code: null
                }
            });
        }
        setNodeConfig({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '85vh',
            backgroundColor: '#ffffff',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            animation: 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden'
        }}>
            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>

            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.5rem 2rem',
                borderBottom: '2px solid #e5e7eb',
                backgroundColor: '#f8fafc'
            }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                        Apply Injections to Cluster
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                        Drag injections to 3D nodes | Env: {envId}
                    </p>
                </div>
                <button onClick={onClose} style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb',
                    backgroundColor: '#ffffff',
                    color: '#6b7280',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <X size={20} />
                </button>
            </div>

            {/* Main Content */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left 60% - 3D Cube */}
                <div style={{ width: '60%', position: 'relative', backgroundColor: '#f8fafc' }}>
                    <div ref={mountRef} style={{ width: '100%', height: '100%' }} />

                    {/* Dropdown for selected node */}
                    {selectedNode && (
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: 'white',
                            padding: '1rem',
                            borderRadius: '12px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                            minWidth: '250px',
                            zIndex: 10
                        }}>
                            <div style={{ fontWeight: '700', marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                                Node [{selectedNode.join(', ')}]
                            </div>
                            {(nodeConfig[JSON.stringify(selectedNode)] || []).length > 0 ? (
                                <div>
                                    {nodeConfig[JSON.stringify(selectedNode)].map(inj => (
                                        <div key={inj.id} style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '0.5rem',
                                            marginBottom: '0.5rem',
                                            backgroundColor: '#f3f4f6',
                                            borderRadius: '6px',
                                            fontSize: '0.75rem'
                                        }}>
                                            <span>{inj.id}</span>
                                            <button
                                                onClick={() => removeInjectionFromNode(selectedNode, inj.id)}
                                                style={{
                                                    padding: '0.25rem 0.5rem',
                                                    backgroundColor: '#fee2e2',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    color: '#dc2626',
                                                    cursor: 'pointer',
                                                    fontSize: '0.65rem'
                                                }}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center', padding: '1rem' }}>
                                    No injections assigned
                                </div>
                            )}
                            <button
                                onClick={() => setSelectedNode(null)}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    marginTop: '0.75rem',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: '600'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>

                {/* Right 40% - Preview + List */}
                <div style={{ width: '40%', display: 'flex', flexDirection: 'column', borderLeft: '2px solid #e5e7eb' }}>
                    {/* Top 20% - Preview */}
                    <div style={{ height: '20%', borderBottom: '2px solid #e5e7eb' }}>
                        <CompactInjectionPreview injection={previewInjection} />
                    </div>

                    {/* Bottom 80% - Injection List */}
                    <div style={{ height: '80%', overflowY: 'auto', padding: '1rem', position: 'relative' }}>
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-500">Loading Injections...</div>
                        ) : injections.length > 0 ? (
                            injections.map(inj => (
                                <div
                                    key={inj.id}
                                    draggable
                                    onDragStart={() => {
                                        setDraggingInjection(inj);
                                        setDragStartPos(null);
                                    }}
                                    onDragEnd={() => {
                                        setDraggingInjection(null);
                                        setDragStartPos(null);
                                    }}
                                    onClick={() => setPreviewInjection(inj)}
                                    style={{
                                        padding: '0.75rem',
                                        marginBottom: '0.5rem',
                                        backgroundColor: previewInjection?.id === inj.id ? '#dbeafe' : '#ffffff',
                                        border: `2px solid ${previewInjection?.id === inj.id ? '#3b82f6' : '#e5e7eb'}`,
                                        borderRadius: '8px',
                                        cursor: 'grab',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#1f2937' }}>
                                        {inj.id}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                        {inj.data[0]?.length || 0} points
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
                                <div>No injections available</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                padding: '1rem 2rem',
                borderTop: '2px solid #e5e7eb',
                display: 'flex',
                justifyContent: 'space-between',
                backgroundColor: '#f8fafc'
            }}>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {Object.keys(nodeConfig).length} nodes configured
                </div>
                <button
                    onClick={handleConfirm}
                    disabled={Object.keys(nodeConfig).length === 0}
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: Object.keys(nodeConfig).length > 0 ? '#3b82f6' : '#d1d5db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: Object.keys(nodeConfig).length > 0 ? 'pointer' : 'not-allowed'
                    }}
                >
                    Apply Configuration
                </button>
            </div>
        </div>
    );
};

export default ClusterInjectionModal;
