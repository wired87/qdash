import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { X, Plus, Trash2 } from 'lucide-react';
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
const MAX_ENERGY = 100;

const WAVEFORMS = [
    { id: 'sine', label: 'Sine' },
    { id: 'square', label: 'Square' },
    { id: 'saw', label: 'Saw' },
    { id: 'triangle', label: 'Triangle' },
];

/** Generate waveform value at phase (0..1 within one cycle). Returns 0..1. */
function waveformValue(phase, type) {
    const p = phase % 1;
    const x = p * 2 * Math.PI;
    switch (type) {
        case 'sine': return 0.5 + 0.5 * Math.sin(x);
        case 'square': return Math.sin(x) >= 0 ? 1 : 0;
        case 'saw': return p;
        case 'triangle': return 0.5 + 0.5 * (2 * Math.abs(2 * p - 1) - 1); // -1..1 → 0..1
        default: return 0.5 + 0.5 * Math.sin(x);
    }
}

const EnergyDesignerWithViz = ({ initialData, onClose, onSend, sendMessage, envData }) => {
    const { userInjections: injections } = useSelector(state => state.injections);
    const [isLoading, setIsLoading] = useState(false);

    const [currentInjection, setCurrentInjection] = useState(null);
    const [selectedInjId, setSelectedInjId] = useState(null);

    const isConnected = useSelector(state => state.websocket.isConnected);

    // Get sim_time from env config (world_cfg)
    const simTime = envData?.config?.sim_time || envData?.sim_time || 100;

    // Frequency controller params
    const [frequency, setFrequency] = useState(1);
    const [amplitude, setAmplitude] = useState(50);
    const [waveform, setWaveform] = useState('sine');

    const canvasRef = useRef(null);

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

    /** Generate [[times], [energies]] from frequency controller params */
    const generateWaveformData = useCallback(() => {
        const times = [];
        const energies = [];
        const samples = Math.min(256, Math.max(20, Math.floor(simTime / 2)));
        for (let i = 0; i <= samples; i++) {
            const t = i / samples;
            const time = Math.round(t * simTime);
            // Phase: frequency cycles over normalized time 0..1
            const phase = t * frequency;
            const val = waveformValue(phase, waveform);
            const energy = Math.round(val * amplitude);
            times.push(time);
            energies.push(Math.max(0, Math.min(MAX_ENERGY, energy)));
        }
        return [times, energies];
    }, [simTime, frequency, amplitude, waveform]);

    // Draw waveform preview canvas
    useEffect(() => {
        if (!canvasRef.current || !currentInjection) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Grid
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 10; i++) {
            const x = (i / 10) * CANVAS_WIDTH;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, CANVAS_HEIGHT);
            ctx.stroke();
        }
        for (let i = 0; i <= 10; i++) {
            const y = (i / 10) * CANVAS_HEIGHT;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_WIDTH, y);
            ctx.stroke();
        }

        ctx.fillStyle = '#6b7280';
        ctx.font = '12px monospace';
        ctx.fillText(`Time: 0 → ${simTime}`, 10, CANVAS_HEIGHT - 5);
        ctx.fillText(`${amplitude}`, 5, 15);
        ctx.fillText('0', 5, CANVAS_HEIGHT - 5);

        // Draw waveform
        const [times, energies] = generateWaveformData();
        if (times.length > 0) {
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, CANVAS_HEIGHT - (energies[0] / MAX_ENERGY) * CANVAS_HEIGHT);
            for (let i = 1; i < times.length; i++) {
                const x = (times[i] / simTime) * CANVAS_WIDTH;
                const y = CANVAS_HEIGHT - (energies[i] / MAX_ENERGY) * CANVAS_HEIGHT;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
    }, [currentInjection, simTime, frequency, amplitude, waveform, generateWaveformData]);

    // Create new injection
    const createNewInjection = () => {
        const newInj = {
            id: '',
            description: '',
            data: [[], []],
        };
        setCurrentInjection(newInj);
        setSelectedInjId(null);
        setFrequency(1);
        setAmplitude(50);
        setWaveform('sine');
    };

    // Load injection into editor
    const loadInjection = (inj) => {
        setCurrentInjection(inj);
        setSelectedInjId(inj.id);

        // Prefer freq ctrl params if stored
        if (inj.frequency != null) setFrequency(Number(inj.frequency));
        if (inj.amplitude != null) setAmplitude(Number(inj.amplitude));
        if (inj.waveform) setWaveform(inj.waveform);

        // Infer from data if no freq params
        const [times, energies] = inj.data || [[], []];
        if (times.length > 0 && energies.length > 0 && inj.frequency == null) {
            const maxE = Math.max(...energies);
            setAmplitude(Math.max(1, Math.min(MAX_ENERGY, maxE)));
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

        const finalId = currentInjection.id.trim() ||
            `inj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const [times, energies] = generateWaveformData();

        const injectionData = {
            id: finalId,
            description: currentInjection.description || "",
            data: [[...times], [...energies]],
            frequency,
            amplitude,
            waveform,
        };

        if (sendMessage) {
            const userId = localStorage.getItem(USER_ID_KEY);
            sendMessage({
                auth: { user_id: userId },
                data: {
                    id: finalId,
                    description: currentInjection.description || "",
                    data: [[...times], [...energies]],
                    frequency,
                    amplitude,
                    waveform,
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
                            Frequency Controller
                        </h2>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                            Control injection frequency, amplitude, and waveform
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
                                                {inj.frequency != null
                                                    ? `${inj.frequency} Hz · ${inj.amplitude ?? '?'} amp`
                                                    : `${inj.data?.[0]?.length || 0} points`}
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



                            {/* Frequency Controller */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                                    Frequency (Hz)
                                </label>
                                <input
                                    type="number"
                                    min={0.01}
                                    max={100}
                                    step={0.1}
                                    value={frequency}
                                    onChange={(e) => setFrequency(parseFloat(e.target.value) || 1)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '8px',
                                        fontSize: '0.875rem'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                                    Amplitude (0–{MAX_ENERGY})
                                </label>
                                <input
                                    type="range"
                                    min={0}
                                    max={MAX_ENERGY}
                                    value={amplitude}
                                    onChange={(e) => setAmplitude(Number(e.target.value))}
                                    style={{ width: '100%', accentColor: '#3b82f6' }}
                                />
                                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>{amplitude}</span>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                                    Waveform
                                </label>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {WAVEFORMS.map((w) => (
                                        <button
                                            key={w.id}
                                            type="button"
                                            onClick={() => setWaveform(w.id)}
                                            style={{
                                                padding: '0.5rem 1rem',
                                                backgroundColor: waveform === w.id ? '#3b82f6' : '#e5e7eb',
                                                color: waveform === w.id ? 'white' : '#374151',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {w.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem', display: 'block' }}>
                                    Preview
                                </label>
                                <canvas
                                    ref={canvasRef}
                                    width={CANVAS_WIDTH}
                                    height={CANVAS_HEIGHT}
                                    style={{
                                        border: '2px solid #e5e7eb',
                                        borderRadius: '8px',
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
