// src/components/ThreeScene.jsx
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { getEdgeColor, getNodeColor } from "../../../../brainmaster_client/src/get_color";

export const ThreeScene = ({ nodes, edges, onNodeClick }) => {
  const canvasRef = useRef(null);
  const sceneRef = useRef();
  const cameraRef = useRef();
  const rendererRef = useRef();
  const controlsRef = useRef();
  const animationIdRef = useRef();

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
            onNodeClick(nodeId);
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
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !nodes || !edges) return;

    // Clear previous objects
    while(scene.children.length > 0){
        const obj = scene.children[0];
        // Dispose logic for groups
        if (obj.isGroup) {
            obj.children.forEach(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        } else { // For lines
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        }
        scene.remove(obj);
    }
    nodeHitboxesRef.current.clear();
    visibleNodesRef.current.clear();

    const nodePositions = new Map(
      nodes.map(node => [node.id, new THREE.Vector3(...node.pos)])
    );

    nodes.forEach((item) => {
      const pos = nodePositions.get(item.id);
      if (!pos) return;

      // 1. Erstelle einen Container (Group) für jedes Node-Objekt
      const group = new THREE.Group();

      // 2. Erstelle den sichtbaren Würfel und füge ihn zur Gruppe hinzu
      const cube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshBasicMaterial({ color: item.color })
      );
      // Die Position wird auf der Gruppe gesetzt, nicht hier!
      group.add(cube);

      // 3. Erstelle die unsichtbare Hitbox und füge sie zur Gruppe hinzu
      const hitbox = new THREE.Mesh(
        new THREE.BoxGeometry(4, 4, 4),
        new THREE.MeshBasicMaterial({ visible: false, depthWrite: false })
      );
      hitbox.userData = { id: item.id }; // Wichtige Daten an der Hitbox speichern
      group.add(hitbox);

      // 4. Positioniere die gesamte Gruppe
      group.position.copy(pos);

      // 5. Füge die Gruppe (enthält Würfel und Hitbox) zur Szene hinzu
      scene.add(group);

      // Speichere Referenzen auf die einzelnen Teile für Interaktionen
      visibleNodesRef.current.set(item.id, cube); // Zum Skalieren
      nodeHitboxesRef.current.set(item.id, hitbox); // Für den Raycaster
    });

    edges.forEach(({ src, trgt }) => {
      const start = nodePositions.get(src);
      const end = nodePositions.get(trgt);
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