import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { X, Plus, Trash2, ZapOff } from 'lucide-react';
import { USER_ID_KEY } from '../auth';
import GlobalConnectionSpinner from './GlobalConnectionSpinner';

const G_FIELDS = [
    "photon",
    "w_plus",
    "w_minus",
    "z_boson",
    ...Array.from({ length: 8 }, (_, i) => `gluon_${i}`)
];

const H = ["higgs"];

const FERMIONS = [
    "electron", "muon", "tau",
    "electron_neutrino", "muon_neutrino", "tau_neutrino",
    ...Array.from({ length: 3 }, (_, i) => `up_quark_${i + 1}`),
    ...Array.from({ length: 3 }, (_, i) => `down_quark_${i + 1}`),
    ...Array.from({ length: 3 }, (_, i) => `charm_quark_${i + 1}`),
    ...Array.from({ length: 3 }, (_, i) => `strange_quark_${i + 1}`),
    ...Array.from({ length: 3 }, (_, i) => `top_quark_${i + 1}`),
    ...Array.from({ length: 3 }, (_, i) => `bottom_quark_${i + 1}`)
];

const ALL_SUBS = [
    ...FERMIONS.map(f => f.toUpperCase()),
    ...G_FIELDS.map(g => g.toUpperCase()),
    ...H.map(h => h.toUpperCase())
];

// Canvas constants
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 200;
const POINT_RADIUS = 8;
const MAX_ENERGY = 100; // Changed to 0-100 range

const EnergyDesignerWithViz = ({ initialData, onClose, onSend, sendMessage, envData }) => {
    const { userInjections: injections } = useSelector(state => state.injections);
    const [isLoading, setIsLoading] = useState(false); // Deprecated, using Redux data directly or could use state.injections.loading

    const [currentInjection, setCurrentInjection] = useState(null);
    const [selectedInjId, setSelectedInjId] = useState(null);

    const isConnected = useSelector(state => state.websocket.isConnected);

    // Get sim_time from env config (world_cfg)
    const simTime = envData?.config?.sim_time || envData?.sim_time || 100; // Default to 100 if not found

    // Canvas refs for single block
    const canvasRef = useRef(null);
    const [points, setPoints] = useState([
        { id: 0, x: 50, y: 150 },
        { id: 1, x: CANVAS_WIDTH - 50, y: 150 },
    ]);
    const [draggingPoint, setDraggingPoint] = useState(null);

    // Request user injections on mount
    useEffect(() => {
        if (sendMessage) {
            const userId = localStorage.getItem(USER_ID_KEY);
            sendMessage({
                auth: {
                    user_id: userId
                },
                data: {}, // Empty data for get_inj_user
                type: "GET_INJ_USER",
                status: {
                    error: null,
                    state: "pending",
                    message: "Requesting user injections",
                    code: null
                }
            });
        }
    }, [sendMessage]);

    // Listen for injection responses
    useEffect(() => {
        const handleMessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === "SET_INJ_SUCCESS") {
                    // Refresh list after save
                    const userId = localStorage.getItem(USER_ID_KEY);
                    if (sendMessage) {
                        sendMessage({
                            auth: {
                                user_id: userId
                            },
                            data: {}, // Empty data for get_inj_user
                            type: "GET_INJ_USER",
                            status: {
                                error: null,
                                state: "pending",
                                message: "Refreshing injection list",
                                code: null
                            }
                        });
                    }
                }
            } catch (error) {
                console.error("Error parsing WebSocket message:", error);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [sendMessage]);

    // Draw canvas
    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Clear canvas
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw grid
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;

        // Vertical grid lines (time)
        for (let i = 0; i <= 10; i++) {
            const x = (i / 10) * CANVAS_WIDTH;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CANVAS_HEIGHT);
            ctx.stroke();
        }

        // Horizontal grid lines (energy)
        for (let i = 0; i <= 10; i++) {
            const y = (i / 10) * CANVAS_HEIGHT;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_WIDTH, y);
            ctx.stroke();
        }

        // Draw axes labels
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px monospace';

        // X-axis label (time) - show sim_time range
        ctx.fillText(`Time: 0 → ${simTime}`, 10, CANVAS_HEIGHT - 5);

        // Y-axis labels (energy 0-100)
        ctx.fillText('100', 5, 15);
        ctx.fillText('50', 5, CANVAS_HEIGHT / 2 + 5);
        ctx.fillText('0', 5, CANVAS_HEIGHT - 5);
        // Draw line connecting points
        if (points.length > 0) {
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            points.forEach(point => ctx.lineTo(point.x, point.y));
            ctx.stroke();
        }

        // Draw points with value labels
        points.forEach((point, index) => {
            // Calculate time and energy values
            const time = Math.round((point.x / CANVAS_WIDTH) * simTime);
            const energy = Math.round((1 - (point.y / CANVAS_HEIGHT)) * MAX_ENERGY);

            // Draw point circle
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.arc(point.x, point.y, POINT_RADIUS, 0, 2 * Math.PI);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw value label
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'center';

            // Position label above or below point based on y position
            const labelY = point.y < CANVAS_HEIGHT / 2 ? point.y + POINT_RADIUS + 20 : point.y - POINT_RADIUS - 10;

            // Draw label background for better readability
            const labelText = `T:${time} E:${energy}`;
            const metrics = ctx.measureText(labelText);
            const padding = 4;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.fillRect(
                point.x - metrics.width / 2 - padding,
                labelY - 10,
                metrics.width + padding * 2,
                14
            );

            // Draw border around label
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1;
            ctx.strokeRect(
                point.x - metrics.width / 2 - padding,
                labelY - 10,
                metrics.width + padding * 2,
                14
            );

            // Draw text
            ctx.fillStyle = '#1f2937';
            ctx.fillText(labelText, point.x, labelY);
        });
    }, [points, simTime]);

    // Canvas mouse handlers
    const handleCanvasMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if clicking on existing point
        const clickedPoint = points.find(p =>
            Math.hypot(p.x - x, p.y - y) < POINT_RADIUS + 5
        );

        if (clickedPoint) {
            setDraggingPoint(clickedPoint.id);
        }
    };

    const handleCanvasMouseMove = (e) => {
        if (draggingPoint === null) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(CANVAS_WIDTH, e.clientX - rect.left));
        const y = Math.max(0, Math.min(CANVAS_HEIGHT, e.clientY - rect.top));

        setPoints(prev => prev.map(p =>
            p.id === draggingPoint ? { ...p, x, y } : p
        ));
    };

    const handleCanvasMouseUp = () => {
        setDraggingPoint(null);
    };

    const addPoint = () => {
        const lastPoint = points[points.length - 1];
        const newX = Math.min(CANVAS_WIDTH - 50, lastPoint.x + 50);
        // Add slight vertical variation (±20-40px) to avoid overlapping
        const yVariation = (Math.random() - 0.5) * 60; // Random -30 to +30
        const newY = Math.max(20, Math.min(CANVAS_HEIGHT - 20, lastPoint.y + yVariation));
        setPoints(prev => [...prev, {
            id: prev.length,
            x: newX,
            y: newY
        }]);
    };

    const removePoint = () => {
        if (points.length > 2) {
            setPoints(prev => prev.slice(0, -1));
        }
    };

    // Create new injection
    const createNewInjection = () => {
        const newInj = {
            id: '',
            description: '',
            data: [[], []],
        };
        setCurrentInjection(newInj);
        setSelectedInjId(null);
        // Reset canvas
        setPoints([
            { id: 0, x: 50, y: 150 },
            { id: 1, x: CANVAS_WIDTH - 50, y: 150 },
        ]);
    };

    // Load injection into editor
    const loadInjection = (inj) => {
        setCurrentInjection(inj);
        setSelectedInjId(inj.id);

        // Convert [[times], [energies]] to canvas points
        const [times, energies] = inj.data;
        if (times.length > 0 && energies.length > 0) {
            const newPoints = times.map((time, i) => {
                // Map time to x (0-50 range to canvas width)
                const x = (time / 50) * CANVAS_WIDTH;
                // Map energy to y (0-99 range to canvas height, inverted)
                const y = CANVAS_HEIGHT - ((energies[i] / MAX_ENERGY) * CANVAS_HEIGHT);
                return { id: i, x, y };
            });
            setPoints(newPoints);
        }
    };

    // Delete injection
    const deleteInjection = (injId) => {
        if (window.confirm('Delete this injection?')) {
            if (sendMessage) {
                const userId = localStorage.getItem(USER_ID_KEY);
                sendMessage({
                    auth: {
                        injection_id: injId,
                        user_id: userId
                    },
                    type: "DEL_INJ"
                });
            }
            // Injections list updates via Redux/WebSocket cycle

            if (selectedInjId === injId) {
                setCurrentInjection(null);
                setSelectedInjId(null);
            }
        }
    };

    // Confirm and save injection
    const handleConfirm = () => {
        if (!currentInjection) return;

        // Generate ID if empty
        const finalId = currentInjection.id.trim() ||
            `inj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Extract energy values mapped to discrete time steps (0 to sim_time)
        // X-axis: 0 to sim_time, Y-axis: 0 to 100 (energy)
        const energyMap = {}; // Map time -> energy

        points.forEach(point => {
            // Map x position to time (0 to simTime)
            const time = Math.round((point.x / CANVAS_WIDTH) * simTime);
            // Map y to energy (0-100 range, inverted because canvas y increases downward)
            const energy = Math.round((1 - (point.y / CANVAS_HEIGHT)) * MAX_ENERGY);

            // Only one point per time step - last one wins if duplicates
            energyMap[time] = Math.max(0, Math.min(MAX_ENERGY, energy));
        });

        // Create sparse time series - only include non-zero energy values
        const times = [];
        const energies = [];

        for (let t = 0; t <= simTime; t++) {
            const energy = energyMap[t];
            // Only include time steps with non-zero energy
            if (energy !== undefined && energy !== 0) {
                times.push(t);
                energies.push(energy);
            }
        }

        const injectionData = {
            id: finalId,
            description: currentInjection.description || "",
            data: [[...times], [...energies]], // Nested array format
        };

        // Send to backend
        if (sendMessage) {
            const userId = localStorage.getItem(USER_ID_KEY);
            sendMessage({
                auth: {
                    user_id: userId
                },
                data: {
                    id: finalId,
                    description: currentInjection.description || "",
                    data: [[...times], [...energies]], // Nested array format
                },
                type: "SET_INJ",
                status: {
                    error: null,
                    state: "pending",
                    message: "Saving injection",
                    code: null
                }
            });
        }

        // Call onSend callback
        if (onSend) {
            onSend(injectionData);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '90vh',
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

            {/* Header Bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.5rem 2rem',
                borderBottom: '2px solid #e5e7eb',
                backgroundColor: '#f8fafc'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.25rem'
                    }}>⚡</div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>
                            Energy Profile Designer
                        </h2>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                            Single-block injection configuration
                        </p>
                    </div>
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

            {/* Disconnected Overlay */}
            {/* Main Content - Full height 30/70 split */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
                {/* Disconnected Overlay */}
                <GlobalConnectionSpinner inline={true} />
                {/* Left Panel - 30% - Injection List */}
                <div style={{
                    width: '30%',
                    borderRight: '2px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#f9fafb'
                }}>
                    {/* Create New Button */}
                    <div style={{ padding: '1rem' }}>
                        <button
                            onClick={createNewInjection}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                backgroundColor: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Plus size={16} />
                            New Injection
                        </button>
                    </div>

                    {/* Injection List */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem 1rem', position: 'relative' }}>
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-500">Loading Injections...</div>
                        ) : injections.length > 0 ? (
                            injections.map(inj => (
                                <div
                                    key={inj.id}
                                    onClick={() => loadInjection(inj)}
                                    style={{
                                        padding: '0.75rem',
                                        marginBottom: '0.5rem',
                                        backgroundColor: selectedInjId === inj.id ? '#dbeafe' : '#ffffff',
                                        border: `2px solid ${selectedInjId === inj.id ? '#3b82f6' : '#e5e7eb'}`,
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#1f2937' }}>
                                                {inj.id}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                                {inj.data[0]?.length || 0} points
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteInjection(inj.id);
                                            }}
                                            style={{
                                                padding: '0.5rem',
                                                backgroundColor: '#fee2e2',
                                                border: 'none',
                                                borderRadius: '6px',
                                                color: '#dc2626',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
                                <div style={{ fontSize: '0.875rem' }}>No injections yet</div>
                                <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Click + to create one</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - 70% - Single Block Editor */}
                <div style={{ width: '70%', display: 'flex', flexDirection: 'column', padding: '1.5rem', overflow: 'auto' }}>
                    {currentInjection ? (
                        <>
                            {/* ID Input */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                                    Injection ID (auto-generated if empty)
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter ID or leave empty"
                                    value={currentInjection.id}
                                    onChange={(e) => setCurrentInjection({ ...currentInjection, id: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '0.875rem'
                                    }}
                                />
                            </div>

                            {/* Description Input */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                                    Description
                                </label>
                                <textarea
                                    placeholder="Enter generic description..."
                                    value={currentInjection.description || ''}
                                    onChange={(e) => setCurrentInjection({ ...currentInjection, description: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '0.875rem',
                                        minHeight: '80px',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>



                            {/* Canvas */}
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                                        Energy Profile
                                    </label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={addPoint}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                backgroundColor: '#10b981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            + Point
                                        </button>
                                        <button
                                            onClick={removePoint}
                                            disabled={points.length <= 2}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                backgroundColor: points.length <= 2 ? '#d1d5db' : '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                cursor: points.length <= 2 ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            - Point
                                        </button>
                                    </div>
                                </div>
                                <canvas
                                    ref={canvasRef}
                                    width={CANVAS_WIDTH}
                                    height={CANVAS_HEIGHT}
                                    onMouseDown={handleCanvasMouseDown}
                                    onMouseMove={handleCanvasMouseMove}
                                    onMouseUp={handleCanvasMouseUp}
                                    onMouseLeave={handleCanvasMouseUp}
                                    style={{
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '8px',
                                        cursor: draggingPoint !== null ? 'grabbing' : 'grab',
                                        display: 'block',
                                        width: '100%',
                                        maxWidth: '600px'
                                    }}
                                />
                            </div>

                            {/* Confirm Button */}
                            <button
                                onClick={handleConfirm}
                                style={{
                                    padding: '1rem',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    marginTop: 'auto'
                                }}
                            >
                                Confirm & Save
                            </button>
                        </>
                    ) : (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flex: 1,
                            flexDirection: 'column',
                            color: '#6b7280'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
                            <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>No injection selected</div>
                            <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                Select an existing injection or create a new one
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default EnergyDesignerWithViz;
