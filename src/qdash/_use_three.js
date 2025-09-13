// src/components/ThreeScene.jsx
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {getEdgeColor} from "./get_color";

export const ThreeScene = ({ nodes, edges, onNodeClick, env_id, }) => {
  console.log("nodes, edges", nodes, edges)
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const controlsRef = useRef();
  const animationIdRef = useRef();
  const canvasRef = useRef(null);

  const nodeHitboxesRef = useRef(new Map());
  const visibleNodesRef = useRef(new Map());
  const currentlyHovered = useRef(null);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  // 1. Effect: Initialization (runs only once) - KEINE ÄNDERUNGEN HIER
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
    camera.position.z = 50;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    const onResize = () => {
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    };
    window.addEventListener('resize', onResize);

    const getMousePos = (event) => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;
    };

    const onCanvasClick = (event) => {
        event.preventDefault();
        getMousePos(event);
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(Array.from(nodeHitboxesRef.current.values()));
        if (intersects.length > 0) {
            const nodeId = intersects[0].object.userData.id;
            onNodeClick(nodeId, env_id);
        }
    };

    const onMouseMove = (event) => {
        getMousePos(event);
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(Array.from(nodeHitboxesRef.current.values()));

        if (intersects.length > 0) {
            const hoveredNodeId = intersects[0].object.userData.id;
            if (currentlyHovered.current !== hoveredNodeId) {
                if (currentlyHovered.current) {
                    const oldNode = visibleNodesRef.current.get(currentlyHovered.current);
                    if (oldNode) oldNode.scale.set(1, 1, 1);
                }
                const newNode = visibleNodesRef.current.get(hoveredNodeId);
                if (newNode) newNode.scale.set(1.5, 1.5, 1.5);
                currentlyHovered.current = hoveredNodeId;
                canvas.style.cursor = 'pointer';
            }
        } else {
            if (currentlyHovered.current) {
                const oldNode = visibleNodesRef.current.get(currentlyHovered.current);
                if (oldNode) oldNode.scale.set(1, 1, 1);
            }
            currentlyHovered.current = null;
            canvas.style.cursor = 'default';
        }
    };

    canvas.addEventListener('click', onCanvasClick, false);
    canvas.addEventListener('mousemove', onMouseMove, false);

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      scene.rotation.y += 0.002;
      animationIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationIdRef.current);
      window.removeEventListener('resize', onResize);
      if (canvas) {
        canvas.removeEventListener('click', onCanvasClick, false);
        canvas.removeEventListener('mousemove', onMouseMove, false);
      }
      renderer.dispose();
    };
  }, [onNodeClick]);

  // 2. Effect: Update objects (runs on data change) - ALLE ÄNDERUNGEN SIND HIER
    // Corrected useEffect: Update objects (runs on data change)
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene || !nodes || !edges) return;

        // Clear previous objects
        while (scene.children.length > 0) {
            const obj = scene.children[0];
            if (obj.isGroup) {
                obj.children.forEach(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
            } else {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) obj.material.dispose();
            }
            scene.remove(obj);
        }
        nodeHitboxesRef.current.clear();
        visibleNodesRef.current.clear();

        // Correctly create the Map of node positions using .map()
        const nodePositions = new Map(
            Object.entries(nodes).map(([nodeId, node]) => {
                if (Array.isArray(node.pos) && node.pos.length === 3) {
                    return [nodeId, new THREE.Vector3(...node.pos)];
                } else {
                    console.warn(`Node ${node.id} has invalid pos:`, node.pos);
                    return [nodeId, new THREE.Vector3(0, 0, 0)]; // fallback
                }
            })
        );

        // Filter nodes with invalid positions to avoid errors
        const validNodes = Object.entries(nodes).filter(([nodeId, node]) =>
            nodePositions.has(nodeId) && nodePositions.get(nodeId)
        );

        // Add nodes and their hitboxes to the scene
        validNodes.forEach(([nodeId, node]) => {
            const pos = nodePositions.get(nodeId);

            const group = new THREE.Group();
            const cube = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 1),
                new THREE.MeshBasicMaterial({ color: new THREE.Color(node.color) })
            );
            group.add(cube);

            const hitbox = new THREE.Mesh(
                new THREE.BoxGeometry(4, 4, 4),
                new THREE.MeshBasicMaterial({ visible: false, depthWrite: false })
            );
            hitbox.userData = { id: nodeId };
            group.add(hitbox);

            group.position.copy(pos);
            scene.add(group);

            visibleNodesRef.current.set(nodeId, cube);
            nodeHitboxesRef.current.set(nodeId, hitbox);
        });

        // Add edges to the scene
        Object.entries(edges).forEach(([edge_id, struct]) => {
            const start = nodePositions.get(struct.src);
            const end = nodePositions.get(struct.trgt);

            if (start && end) {
                const line = new THREE.Line(
                    new THREE.BufferGeometry().setFromPoints([start, end]),
                    new THREE.LineBasicMaterial({ color: getEdgeColor() })
                );
                scene.add(line);
            }
        });
    }, [nodes, edges]);

  return (
    <canvas ref={canvasRef} style={{ width: '100%', height: "90vh", display: 'block' }} />
  );
};