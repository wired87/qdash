import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const DEFAULT_DIMS = 3;
const DEFAULT_AMOUNT_OF_NODES = 64;
const NODE_SPACING = 2.2;
const LERP_SPEED = 0.028;
const SCATTER_RANGE = 32;
const DRIFT_AMOUNT = 0.12;
const IDLE_PARTICLE_COUNT = 320;

/** Minimal: single soft white/gray for all vertices. */
function buildMinimalColors(count) {
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const t = i / Math.max(1, count);
        colors[i * 3] = 0.92 + t * 0.06;
        colors[i * 3 + 1] = 0.94 + t * 0.04;
        colors[i * 3 + 2] = 0.98;
    }
    return colors;
}

/** nD grid target positions from amount_of_nodes and dims (live from selected env). */
function buildNodeGridPositions(dims, amountOfNodes) {
    const D = Math.max(1, Math.min(6, Math.round(dims)));
    const N = Math.max(1, Math.min(5000, Math.round(amountOfNodes)));
    const perDim = Math.max(1, Math.round(Math.pow(N, 1 / D)));
    const positions = [];
    const total = Math.pow(perDim, D);
    const half = (perDim - 1) / 2;
    for (let idx = 0; idx < total; idx++) {
        const coords = [];
        let n = idx;
        for (let d = 0; d < D; d++) {
            coords.push(n % perDim);
            n = Math.floor(n / perDim);
        }
        const x = (coords[0] ?? 0) - half;
        const y = D >= 3 ? (coords[1] ?? 0) - half : 0;
        const z = D >= 2 ? (coords[D >= 3 ? 2 : 1] ?? 0) - half : 0;
        positions.push(x * NODE_SPACING, y * NODE_SPACING, z * NODE_SPACING);
    }
    const posArray = new Float32Array(positions);
    return { positions: posArray, colors: buildMinimalColors(posArray.length / 3), count: posArray.length / 3 };
}

/** Scatter positions (random on screen) for reform-in transition. */
function buildScatterPositions(targetPositions) {
    const out = new Float32Array(targetPositions.length);
    for (let i = 0; i < targetPositions.length; i += 3) {
        out[i] = (Math.random() - 0.5) * 2 * SCATTER_RANGE;
        out[i + 1] = (Math.random() - 0.5) * 2 * SCATTER_RANGE;
        out[i + 2] = (Math.random() - 0.5) * 2 * SCATTER_RANGE;
    }
    return out;
}

/** Idle drift: random positions + velocities for no-env mode. */
function buildIdleParticles(count) {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 2 * SCATTER_RANGE;
        velocities[i] = (Math.random() - 0.5) * 2 * DRIFT_AMOUNT;
    }
    return { positions, velocities, colors: buildMinimalColors(count) };
}

/** Create a mesh for a given form type (cube, sphere, etc.) */
function createFormMesh(formType, id) {
    let geometry;
    const color = new THREE.Color().setHSL(Math.random() * 0.15 + 0.1, 0.6, 0.5);
    const material = new THREE.MeshPhongMaterial({
        color,
        shininess: 40,
        flatShading: true,
    });
    switch (formType) {
        case 'sphere':
            geometry = new THREE.SphereGeometry(1.2, 12, 10);
            break;
        case 'cylinder':
            geometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 12);
            break;
        case 'torus':
            geometry = new THREE.TorusGeometry(1, 0.4, 8, 16);
            break;
        case 'cone':
            geometry = new THREE.ConeGeometry(1, 2, 12);
            break;
        case 'dodecahedron':
            geometry = new THREE.DodecahedronGeometry(1.2, 0);
            break;
        case 'cube':
        default:
            geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
            break;
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = { formId: id, formType };
    return mesh;
}

/**
 * nD node grid engine: amount_of_nodes grid in dims dimensions (set live from env cfg).
 * OrbitControls: drag to rotate, scroll to zoom. Optional droppedForms for draggable shapes.
 */
export const ParticleGridEngine = ({
    className = '',
    droppedForms = [],
    envConfig = null,
}) => {
    const containerRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);
    const nodeGridRef = useRef(null);
    const frameRef = useRef(null);
    const droppedMeshesRef = useRef(new Map());
    const currentPositionsRef = useRef(null);
    const targetPositionsRef = useRef(null);
    const idleVelocitiesRef = useRef(null);
    const dimsRaw = envConfig?.dims ?? DEFAULT_DIMS;
    const dims = Array.isArray(dimsRaw) ? dimsRaw.length : dimsRaw;
    const amountOfNodes = envConfig?.amount_of_nodes ?? envConfig?.cluster_dim ?? DEFAULT_AMOUNT_OF_NODES;

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x020617);
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambient);
        const dir = new THREE.DirectionalLight(0xffffff, 0.5);
        dir.position.set(10, 20, 10);
        scene.add(dir);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 500);
        camera.position.set(0, 14, 22);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x020617, 1);
        rendererRef.current = renderer;
        const canvas = renderer.domElement;
        canvas.style.display = 'block';
        container.appendChild(canvas);

        const controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxDistance = 120;
        controls.minDistance = 8;
        controls.enableZoom = true;
        controls.zoomSpeed = 1.2;
        controls.target.set(0, 0, 0);
        controlsRef.current = controls;

        const resize = () => {
            if (!container || !camera || !renderer) return;
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        };
        resize();
        window.addEventListener('resize', resize);

        const animate = () => {
            frameRef.current = requestAnimationFrame(animate);
            if (controlsRef.current) controlsRef.current.update();
            const points = nodeGridRef.current;
            if (points) {
                const attr = points.geometry.getAttribute('position');
                const cur = currentPositionsRef.current;
                const tar = targetPositionsRef.current;
                const vel = idleVelocitiesRef.current;
                if (vel && cur && cur.length === vel.length) {
                    for (let i = 0; i < cur.length; i += 3) {
                        cur[i] += vel[i];
                        cur[i + 1] += vel[i + 1];
                        cur[i + 2] += vel[i + 2];
                        if (cur[i] < -SCATTER_RANGE || cur[i] > SCATTER_RANGE) vel[i] *= -1;
                        if (cur[i + 1] < -SCATTER_RANGE || cur[i + 1] > SCATTER_RANGE) vel[i + 1] *= -1;
                        if (cur[i + 2] < -SCATTER_RANGE || cur[i + 2] > SCATTER_RANGE) vel[i + 2] *= -1;
                    }
                    attr.needsUpdate = true;
                } else if (cur && tar && cur.length === tar.length) {
                    for (let i = 0; i < cur.length; i++) {
                        cur[i] += (tar[i] - cur[i]) * LERP_SPEED;
                    }
                    attr.needsUpdate = true;
                }
            }
            renderer.render(scene, camera);
        };
        animate();

        const meshesRef = droppedMeshesRef;
        return () => {
            window.removeEventListener('resize', resize);
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
            if (controlsRef.current) controlsRef.current.dispose();
            if (container && renderer.domElement) container.removeChild(renderer.domElement);
            renderer.dispose();
            const map = meshesRef.current;
            if (map) {
                map.forEach((mesh) => {
                    scene.remove(mesh);
                    mesh.geometry?.dispose();
                    mesh.material?.dispose();
                });
                map.clear();
            }
        };
    }, []);

    // Particles: idle drift (no env) or reform to nD grid from selected env (dims, amount_of_nodes). Remount on change.
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;
        const prev = nodeGridRef.current;
        if (prev) {
            scene.remove(prev);
            prev.geometry?.dispose();
            prev.material?.dispose();
            nodeGridRef.current = null;
        }
        currentPositionsRef.current = null;
        targetPositionsRef.current = null;
        idleVelocitiesRef.current = null;

        const material = new THREE.PointsMaterial({
            size: 0.26,
            vertexColors: true,
            transparent: true,
            opacity: 0.82,
            sizeAttenuation: true,
            depthWrite: false,
        });

        if (!envConfig) {
            const { positions, velocities, colors } = buildIdleParticles(IDLE_PARTICLE_COUNT);
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            const points = new THREE.Points(geometry, material);
            scene.add(points);
            nodeGridRef.current = points;
            currentPositionsRef.current = positions;
            idleVelocitiesRef.current = velocities;
            return () => {
                scene.remove(points);
                geometry.dispose();
                material.dispose();
                nodeGridRef.current = null;
                currentPositionsRef.current = null;
                idleVelocitiesRef.current = null;
            };
        }

        const { positions: targetPositions, colors } = buildNodeGridPositions(dims, amountOfNodes);
        const currentPositions = buildScatterPositions(targetPositions);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const points = new THREE.Points(geometry, material);
        scene.add(points);
        nodeGridRef.current = points;
        currentPositionsRef.current = currentPositions;
        targetPositionsRef.current = targetPositions;

        return () => {
            scene.remove(points);
            geometry.dispose();
            material.dispose();
            nodeGridRef.current = null;
            currentPositionsRef.current = null;
            targetPositionsRef.current = null;
        };
    }, [envConfig, dims, amountOfNodes]);

    // Sync dropped forms into the scene (droppable env)
    useEffect(() => {
        const scene = sceneRef.current;
        if (!scene) return;
        const map = droppedMeshesRef.current;
        const existingIds = new Set(map.keys());
        const formIds = new Set((droppedForms || []).map((f) => f.id));

        // Remove meshes no longer in list
        existingIds.forEach((id) => {
            if (!formIds.has(id)) {
                const mesh = map.get(id);
                if (mesh) {
                    scene.remove(mesh);
                    mesh.geometry?.dispose();
                    mesh.material?.dispose();
                    map.delete(id);
                }
            }
        });

        // Add new meshes (existing ones keep their position)
        (droppedForms || []).forEach((form, index) => {
            if (!form.id || !form.type) return;
            if (map.has(form.id)) return;
            const spacing = 5;
            const row = Math.floor(index / 4);
            const col = index % 4;
            const x = (col - 1.5) * spacing + (Math.random() - 0.5) * 2;
            const z = (row - 0.5) * spacing + (Math.random() - 0.5) * 2;
            const y = 1.5 + Math.random() * 2;
            const mesh = createFormMesh(form.type, form.id);
            mesh.position.set(x, y, z);
            mesh.rotation.set(
                Math.random() * 0.3,
                Math.random() * Math.PI * 2,
                Math.random() * 0.2
            );
            scene.add(mesh);
            map.set(form.id, mesh);
        });
    }, [droppedForms]);

    return (
        <div
            ref={containerRef}
            className={`w-full h-full min-h-0 relative ${className}`}
            style={{ touchAction: 'none', minHeight: 0 }}
            aria-label="3D particle grid – drag to rotate, scroll to zoom"
        />
    );
};

export default ParticleGridEngine;
