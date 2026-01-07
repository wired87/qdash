import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { DragControls } from 'three/examples/jsm/controls/DragControls';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useNodeStore } from './store';

export const ThreeGrid = ({ onNodeClick }) => {
    const mountRef = useRef(null);
    const { nodes } = useNodeStore();
    const [scene, setScene] = useState(null);
    const [camera, setCamera] = useState(null);
    const [renderer, setRenderer] = useState(null);
    const [objects, setObjects] = useState([]);
    const controlsRef = useRef(null); // For DragControls
    const orbitRef = useRef(null); // For OrbitControls

    // Init Scene
    useEffect(() => {
        console.log("ThreeGrid: Init Scene");
        if (!mountRef.current) return;

        const w = mountRef.current.clientWidth;
        const h = mountRef.current.clientHeight;
        console.log(`ThreeGrid: Dimensions ${w}x${h}`);

        const _scene = new THREE.Scene();
        _scene.background = new THREE.Color(0x111111);

        const _camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
        _camera.position.set(200, 200, 200);
        _camera.lookAt(0, 0, 0);

        const _renderer = new THREE.WebGLRenderer({ antialias: true });
        _renderer.setSize(w, h);
        mountRef.current.appendChild(_renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        _scene.add(ambientLight);
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(100, 100, 100);
        _scene.add(dirLight);

        // Orbit Controls
        const _orbit = new OrbitControls(_camera, _renderer.domElement);
        _orbit.enableDamping = true;
        orbitRef.current = _orbit;

        setScene(_scene);
        setCamera(_camera);
        setRenderer(_renderer);

        // Animation Loop
        let animationId;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            _orbit.update();
            _renderer.render(_scene, _camera);
        };
        animate();

        return () => {
            console.log("ThreeGrid: Cleanup Scene");
            cancelAnimationFrame(animationId);
            if (mountRef.current) {
                mountRef.current.removeChild(_renderer.domElement);
            }
            _renderer.dispose();
            _orbit.dispose(); // Dispose OrbitControls on cleanup
        };
    }, []);

    // Render Nodes & Setup DragControls
    useEffect(() => {
        if (!scene || !camera || !renderer) return;
        console.log(`ThreeGrid: Updating Nodes. Count: ${nodes.length}`);

        // Clear previous group if exists
        const existingGroup = scene.getObjectByName("nodeGroup");
        if (existingGroup) {
            scene.remove(existingGroup);
        }

        if (nodes.length === 0) {
            // If no nodes, ensure drag controls are disposed and objects cleared
            if (controlsRef.current) {
                controlsRef.current.dispose();
                controlsRef.current = null;
            }
            setObjects([]);
            return;
        }

        const group = new THREE.Group();
        group.name = "nodeGroup";
        scene.add(group);

        const newObjects = [];

        nodes.forEach(node => {
            const geometry = new THREE.SphereGeometry(5, 16, 16); // Increased size
            const material = new THREE.MeshPhongMaterial({
                color: node.color || 0xffffff,
                shininess: 100,
                emissive: node.color || 0x000000,
                emissiveIntensity: 0.2
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(node.gridPos.x, node.gridPos.y, node.gridPos.z);
            mesh.userData = { id: node.id };

            group.add(mesh);
            newObjects.push(mesh);
        });

        // Setup DragControls
        if (controlsRef.current) {
            controlsRef.current.dispose();
        }

        const _controls = new DragControls(newObjects, camera, renderer.domElement);

        let dragStartPos = new THREE.Vector3();
        _controls.addEventListener('dragstart', (e) => {
            if (orbitRef.current) orbitRef.current.enabled = false; // Disable orbit while dragging
            dragStartPos.copy(e.object.position);
            e.object.material.emissiveIntensity = 0.8;
        });

        _controls.addEventListener('dragend', (e) => {
            if (orbitRef.current) orbitRef.current.enabled = true; // Re-enable orbit
            e.object.material.emissiveIntensity = 0.2;

            // Check for click (minimal movement)
            if (e.object.position.distanceTo(dragStartPos) < 1) {
                console.log("Node Clicked:", e.object.userData.id);
                onNodeClick(e.object.userData.id);
            }
        });

        controlsRef.current = _controls;
        setObjects(newObjects);

        return () => {
            console.log("ThreeGrid: Cleanup DragControls and Node Group");
            if (controlsRef.current) {
                controlsRef.current.dispose();
                controlsRef.current = null;
            }
            if (group && scene) {
                scene.remove(group);
            }
        };
    }, [scene, camera, renderer, nodes, onNodeClick]); // Re-run when nodes change

    // Update Colors efficiently
    useEffect(() => {
        if (objects.length === 0) return;
        console.log("ThreeGrid: Updating node colors");
        objects.forEach(mesh => {
            const node = nodes.find(n => n.id === mesh.userData.id);
            if (node && node.color) {
                mesh.material.color.set(node.color);
                mesh.material.emissive.set(node.color);
            }
        });
    }, [nodes, objects]);

    return <div ref={mountRef} style={{ width: '100%', height: '100%', minHeight: '600px', border: '1px solid red' }} />;
};
