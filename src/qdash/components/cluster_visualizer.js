import React, { useRef, useEffect, useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";

const ClusterVisualizer = ({ data }) => {
    const mountRef = useRef(null);
    const [uiFrame, setUiFrame] = useState(0);
    const THREE = window.THREE;

    useEffect(() => {
        if (!THREE || !data || data.length === 0) {
            console.error("THREE.js is not loaded or no data is available.");
            return;
        }

        let animationId;
        let currentFrame = 0;
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0d0e13);

        const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
        camera.position.z = 30;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        mountRef.current.appendChild(renderer.domElement);

        const geometry = new THREE.BufferGeometry();
        const initialPositions = new Float32Array(data[0].flat());
        geometry.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x66ccff,
            size: 0.15,
            blending: THREE.AdditiveBlending,
            transparent: true,
            sizeAttenuation: true
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const setupControls = (container) => {
            const handleMouseDown = (e) => {
                isDragging = true;
                previousMousePosition.x = e.clientX;
                previousMousePosition.y = e.clientY;
            };

            const handleMouseMove = (e) => {
                if (!isDragging) return;
                const deltaX = e.clientX - previousMousePosition.x;
                const deltaY = e.clientY - previousMousePosition.y;
                points.rotation.y += deltaX * 0.005;
                points.rotation.x += deltaY * 0.005;
                previousMousePosition.x = e.clientX;
                previousMousePosition.y = e.clientY;
            };

            const handleMouseUp = () => { isDragging = false; };

            container.addEventListener('mousedown', handleMouseDown);
            container.addEventListener('mousemove', handleMouseMove);
            container.addEventListener('mouseup', handleMouseUp);

            return () => {
                container.removeEventListener('mousedown', handleMouseDown);
                container.removeEventListener('mousemove', handleMouseMove);
                container.removeEventListener('mouseup', handleMouseUp);
            };
        };

        const cleanupControls = setupControls(renderer.domElement);

        const animate = () => {
            currentFrame = (currentFrame + 1) % data.length;
            setUiFrame(currentFrame);

            const nextFrameData = new Float32Array(data[currentFrame].flat());
            points.geometry.attributes.position.array.set(nextFrameData);
            points.geometry.attributes.position.needsUpdate = true;

            if (!isDragging) {
                scene.rotation.y += 0.001;
            }

            renderer.render(scene, camera);
            animationId = requestAnimationFrame(animate);
        };

        const onWindowResize = () => {
            camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };

        window.addEventListener('resize', onWindowResize, false);
        animate();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', onWindowResize);
            if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
            cleanupControls();
        };
    }, [data, THREE]);

    return (
        <div className="relative w-full h-full bg-gray-900 overflow-hidden font-sans">
            <div ref={mountRef} className="w-full h-full" />
            <div className="absolute top-0 left-0 w-full p-4 text-white text-center bg-gray-800 bg-opacity-50 rounded-b-lg shadow-xl">
                <h1 className="text-xl font-bold text-cyan-300">Cluster Data Visualization</h1>
                <p className="text-sm text-gray-300">(Click and drag to rotate)</p>
                <div className="mt-2 text-base">
                    Frame: <span className="font-mono text-lg text-yellow-400">{uiFrame}</span> / {data ? data.length - 1 : 0}
                </div>
            </div>
        </div>
    );
};


export const ClusterVisualizerModal = ({ isOpen, onClose, data }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="5xl" className="bg-gray-800 rounded-lg">
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1 text-white">
                    <h3 className="text-2xl font-bold">Cluster Visualization</h3>
                </ModalHeader>
                <ModalBody className="p-0">
                    <div className="h-[70vh] relative">
                        {isOpen && data && data.length > 0 ? (
                            <ClusterVisualizer data={data} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-white">
                                <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="ml-4">Loading cluster data...</p>
                            </div>
                        )}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose} size="lg">
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
