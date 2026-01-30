import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Chip, Tooltip, Spinner, Switch } from "@heroui/react";
import { X, PlayCircle, Plus, Minus, Server, Box, Database, Zap, Layers, FolderGit2, Globe, ZapOff, Loader2 } from "lucide-react";
import { USER_ID_KEY, getSessionId } from "../auth";
import SessionClusterPreview from './SessionClusterPreview';
import GlobalConnectionSpinner from './GlobalConnectionSpinner';


import {
    setLoading as setSessionLoading,
    setActiveSession,
    optimisticLinkEnv,
    optimisticUnlinkEnv,
    optimisticLinkModule,
    optimisticUnlinkModule,
    optimisticLinkMethod,
    optimisticUnlinkMethod,
    optimisticLinkField,
    optimisticUnlinkField,
    assignInjection,
    unassignInjection
} from '../store/slices/sessionSlice';
import { setLoading as setEnvLoading } from '../store/slices/envSlice';
import { setLoading as setModuleLoading } from '../store/slices/moduleSlice';
import { setLoading as setFieldLoading } from '../store/slices/fieldSlice';
import { setLoading as setInjectionLoading } from '../store/slices/injectionSlice';

// Color generation function for hierarchical items
const getHierarchicalColor = (index) => {
    const baseColors = [
        { r: 255, g: 0, b: 0 },    // Red
        { r: 0, g: 255, b: 0 },    // Green
        { r: 0, g: 0, b: 255 }     // Blue
    ];

    const cycleIndex = index % 3;
    const iterationLevel = Math.floor(index / 3);
    const reduction = iterationLevel * 0.25; // 25% reduction per iteration

    const baseColor = baseColors[cycleIndex];
    const factor = Math.max(0.1, 1 - reduction); // Minimum 10% intensity

    return {
        r: Math.round(baseColor.r * factor),
        g: Math.round(baseColor.g * factor),
        b: Math.round(baseColor.b * factor)
    };
};

// Standard Model Field Definitions
const GAUGE_FIELDS = [
    "photon",  // A_μ
    // Weak interaction (SU(2)_L)
    "w_plus",  // W⁺
    "w_minus",  // W⁻
    "z_boson",  // Z⁰
    // Strong interaction (SU(3)_C)
    "gluon_0", "gluon_1", "gluon_2", "gluon_3",
    "gluon_4", "gluon_5", "gluon_6", "gluon_7"
];

const HIGGS_FIELDS = [
    "higgs"
];

const FERMION_FIELDS = [
    // Leptons
    "electron",  // ψₑ
    "muon",  // ψ_μ
    "tau",  // ψ_τ
    "electron_neutrino",  // νₑ
    "muon_neutrino",  // ν_μ
    "tau_neutrino",  // ν_τ
    // Quarks (3 colors each)
    "up_quark_0", "up_quark_1", "up_quark_2", "down_quark_0", "down_quark_1", "down_quark_2", "charm_quark_0", "charm_quark_1", "charm_quark_2", "strange_quark_0", "strange_quark_1", "strange_quark_2", "top_quark_0", "top_quark_1", "top_quark_2", "bottom_quark_0", "bottom_quark_1", "bottom_quark_2"
];

// Standard Model Modules with their fields
const SM_MODULES = {
    "GAUGE": GAUGE_FIELDS,
    "HIGGS": HIGGS_FIELDS,
    "FERMION": FERMION_FIELDS
};


// Helper for split list items
const ListItem = ({ title, subtitle, onClick, isActive, actionIcon, onAction, actionColor = "primary", showEnableSM, enableSM, onEnableSMChange, shadowColor }) => {
    const shadowStyle = shadowColor
        ? { boxShadow: `inset 0 0 0 2px rgba(${shadowColor.r}, ${shadowColor.g}, ${shadowColor.b}, 0.4), inset 0 2px 12px rgba(${shadowColor.r}, ${shadowColor.g}, ${shadowColor.b}, 0.2)` }
        : {};

    return (
        <div
            onClick={onClick}
            style={shadowStyle}
            className={`p-2 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between group
            ${isActive
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                    : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-blue-300'
                }`}
        >
            <div className="overflow-hidden flex-1">
                <div className="font-semibold text-xs truncate text-slate-700 dark:text-slate-200">{title}</div>
                {subtitle && <div className="text-[10px] text-slate-500 truncate">{subtitle}</div>}
            </div>
            <div className="flex items-center gap-2">
                {showEnableSM && (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <span className="text-[10px] text-slate-500">SM</span>
                        <Switch
                            size="sm"
                            isSelected={enableSM}
                            onValueChange={(val) => {
                                onEnableSMChange && onEnableSMChange(val);
                            }}
                            classNames={{
                                wrapper: "group-data-[selected=true]:bg-emerald-500"
                            }}
                        />
                    </div>
                )}
                {actionIcon && (
                    <Button
                        isIconOnly
                        size="sm"
                        color={actionColor}
                        variant="light"
                        className="min-w-6 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAction && onAction();
                        }}
                    >
                        {actionIcon}
                    </Button>
                )}
            </div>
        </div>
    );
};

const SessionConfig = ({ isOpen, onClose, sendMessage, user }) => {
    const dispatch = useDispatch();

    // --- Redux State ---
    const {
        sessions,
        activeSession, // We need this to get ID
        sessionData,
        loading: sessionLoading
    } = useSelector(state => state.sessions);

    const { userEnvs, loading: envLoading } = useSelector(state => state.envs);
    const { userModules, loading: moduleLoading } = useSelector(state => state.modules);
    const { userMethods } = useSelector(state => state.methods);
    const { userFields } = useSelector(state => state.fields);
    const { userInjections, activeInjection } = useSelector(state => state.injections);
    const isConnected = useSelector(state => state.websocket.isConnected);

    // --- Local UI State --- (Must be declared before useMemo hooks that use them)
    const [currentSessionId] = useState(getSessionId());
    const [activeEnv, setActiveEnv] = useState(null);
    const [activeModule, setActiveModule] = useState(null);
    const [activeField, setActiveField] = useState(null);
    const [selectedInjection, setSelectedInjection] = useState(null);
    const [detailItem, setDetailItem] = useState(null);

    // Live Workspace State
    const [highlightedPos, setHighlightedPos] = useState([0, 0, 0]);
    const [isCenterMode, setIsCenterMode] = useState(false);
    const [itemLoading, setItemLoading] = useState(false);

    // Memoized selected item (Env, Module, or Field)
    const selectedItem = useMemo(() => {
        if (activeField) {
            return userFields.find(f => (typeof f === 'string' ? f : f.id) === (typeof activeField === 'string' ? activeField : activeField.id)) || activeField;
        }
        if (activeModule) {
            return userModules.find(m => (typeof m === 'string' ? m : m.id) === (typeof activeModule === 'string' ? activeModule : activeModule.id)) || activeModule;
        }
        if (activeEnv) {
            return userEnvs.find(e => (typeof e === 'string' ? e : e.id) === (typeof activeEnv === 'string' ? activeEnv : activeEnv.id)) || activeEnv;
        }
        return null;
    }, [activeEnv, activeModule, activeField, userEnvs, userModules, userFields]);

    // Fetch Item Details on Selection
    useEffect(() => {
        if (selectedItem && !selectedInjection) {
            const itemId = typeof selectedItem === 'string' ? selectedItem : selectedItem.id;
            if (itemId) {
                setItemLoading(true);
                sendMessage({
                    type: "GET_ITEM",
                    auth: { item_id: itemId }
                });
                // Simple timeout to clear loading since we don't have a direct correlation ID for response yet
                // The store update will verify data freshness essentially, but for UI spinner:
                setTimeout(() => setItemLoading(false), 800);
            }
        }
    }, [selectedItem, selectedInjection, sendMessage]);

    // Config State for Deep Nested Structure
    const [sessionConfig, setSessionConfig] = useState({
        envs: {} // { envId: { modules: { modId: { fields: { fieldId: { injections: { pos: inj } } } } } } }
    });
    const [envEnableSM, setEnvEnableSM] = useState({}); // Track enable_sm per environment
    const [clusterKey, setClusterKey] = useState(0); // Key to force remount of ClusterPreview

    // Valid Session ID to use (either active selection or current)
    const targetSessionId = activeSession?.id || currentSessionId;

    // Derived State - Extract from hierarchical config structure
    const activeSessionData = targetSessionId ? sessionData[targetSessionId] : null;
    const sessionConfigData = useMemo(() => activeSessionData?.config?.envs || {}, [activeSessionData]);

    // Extract linked envs from config
    const activeSessionEnvs = useMemo(() => {
        if (!sessionConfigData) return [];
        return Object.keys(sessionConfigData).map(envId => {
            // Find full env object from userEnvs if available
            const fullEnv = userEnvs.find(e => (typeof e === 'string' ? e : e.id) === envId);
            return fullEnv || { id: envId };
        });
    }, [sessionConfigData, userEnvs]);

    // Extract linked modules for active env
    const activeSessionModules = useMemo(() => {
        const envId = activeEnv ? (typeof activeEnv === 'string' ? activeEnv : activeEnv.id) : null;
        if (!envId || !sessionConfigData[envId]?.modules) return [];
        return Object.keys(sessionConfigData[envId].modules);
    }, [sessionConfigData, activeEnv]);

    // Extract linked fields for active module
    const activeSessionFields = useMemo(() => {
        const envId = activeEnv ? (typeof activeEnv === 'string' ? activeEnv : activeEnv.id) : null;
        const modId = activeModule ? (typeof activeModule === 'string' ? activeModule : activeModule.id) : null;

        if (!envId || !modId || !sessionConfigData[envId]?.modules[modId]?.fields) return [];
        return Object.keys(sessionConfigData[envId].modules[modId].fields).map(fieldId => {
            // Find full field object from userFields if available
            const fullField = userFields.find(f => (typeof f === 'string' ? f : f.id) === fieldId);
            return fullField || fieldId;
        });
    }, [sessionConfigData, activeEnv, activeModule, userFields]);

    // Helper to check if session config has any data
    const hasSessionConfigData = useCallback(() => {
        // Only check if modal is open
        if (!isOpen) return false;

        // Check if there are any linked environments in the active session
        if (!activeSession?.id || !sessionData[activeSession.id]) {
            console.log('[SessionConfig] No active session or session data');
            return false;
        }

        const envs = sessionData[activeSession.id]?.config?.envs;
        if (!envs || Object.keys(envs).length === 0) {
            console.log('[SessionConfig] No environments linked');
            return false;
        }

        // Check if any environment has modules
        const hasModules = Object.values(envs).some(env => {
            const modules = env?.modules;
            return modules && Object.keys(modules).length > 0;
        });

        console.log('[SessionConfig] Has unsaved config:', hasModules);
        return hasModules;
    }, [isOpen, activeSession, sessionData]);



    // --- Data Fetching Helpers ---

    const fetchSessions = useCallback(() => {
        dispatch(setSessionLoading(true));
        sendMessage({
            type: "LIST_USERS_SESSIONS",
            auth: { user_id: localStorage.getItem(USER_ID_KEY) }
        });
    }, [sendMessage, dispatch]);

    const fetchEnvs = useCallback(() => {
        const userId = localStorage.getItem(USER_ID_KEY);
        dispatch(setEnvLoading(true));
        // User Envs
        sendMessage({ type: "GET_USERS_ENVS", auth: { user_id: userId } });
        // Session Envs
        sendMessage({ type: "GET_SESSIONS_ENVS", auth: { user_id: userId, session_id: targetSessionId } });
    }, [sendMessage, targetSessionId, dispatch]);

    const fetchModules = useCallback(() => {
        const userId = localStorage.getItem(USER_ID_KEY);
        dispatch(setModuleLoading(true));
        // User Modules
        sendMessage({ type: "LIST_USERS_MODULES", auth: { user_id: userId } });
        // User Methods (to be pasted into modules)
        sendMessage({ type: "GET_USERS_METHODS", auth: { user_id: userId } });
        // Session Modules
        sendMessage({ type: "GET_SESSIONS_MODULES", auth: { user_id: userId, session_id: targetSessionId } });
    }, [sendMessage, targetSessionId, dispatch]);

    const fetchFields = useCallback(() => {
        const userId = localStorage.getItem(USER_ID_KEY);
        dispatch(setFieldLoading(true));
        // User Fields
        sendMessage({ type: "LIST_USERS_FIELDS", auth: { user_id: userId } });
        // Session Fields
        sendMessage({ type: "SESSIONS_FIELDS", auth: { user_id: userId, session_id: targetSessionId } });
    }, [sendMessage, targetSessionId, dispatch]);

    const fetchInjections = useCallback(() => {
        dispatch(setInjectionLoading(true));
        sendMessage({ type: "GET_INJ_USER", auth: { user_id: localStorage.getItem(USER_ID_KEY) } });
    }, [sendMessage, dispatch]);


    // --- Init ---
    useEffect(() => {
        if (isOpen && isConnected) {
            fetchSessions();
        }
    }, [isOpen, isConnected, fetchSessions]);

    // Re-fetch active session details if connection restores while a session is active
    useEffect(() => {
        if (isOpen && isConnected && activeSession) {
            // Re-fetch all dependent resources
            fetchEnvs();
            fetchModules();
            fetchFields();
            fetchInjections();
        }
    }, [isConnected, isOpen, activeSession, fetchEnvs, fetchModules, fetchFields, fetchInjections]);

    // Auto-select session matching currentSessionId
    useEffect(() => {
        if (!activeSession && currentSessionId && sessions.length > 0) {
            const match = sessions.find(s => s.id === currentSessionId);
            if (match) {
                console.log("Auto-selecting session:", match.id);
                dispatch(setActiveSession(match));
            }
        }
    }, [activeSession, currentSessionId, sessions, dispatch]);

    // Fetch resources when session is selected
    useEffect(() => {
        if (activeSession) {
            setSessionConfig({ envs: {} }); // Reset local draft
            fetchEnvs();
            fetchModules();
            fetchFields();
            fetchInjections();

            // Reset Selections
            setActiveEnv(null);
            setActiveModule(null);
            setActiveField(null);
            setSelectedInjection(null);
            setDetailItem(null);
        }
    }, [activeSession, fetchEnvs, fetchModules, fetchFields, fetchInjections]);

    // Update detailItem when activeInjection changes in Redux (via WebSocket update)
    useEffect(() => {
        if (selectedInjection && activeInjection && activeInjection.id === selectedInjection.id) {
            setDetailItem(activeInjection);
        }
    }, [activeInjection, selectedInjection]);

    // Warn user before page refresh/close if there's unsaved session config
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            const hasData = hasSessionConfigData();
            console.log('[SessionConfig] beforeunload triggered, hasData:', hasData);
            if (hasData) {
                e.preventDefault();
                e.returnValue = 'You have unsaved session configuration. Are you sure you want to leave?';
                console.log('[SessionConfig] beforeunload warning shown');
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasSessionConfigData]);



    // Local state for processing items (e.g., deletions)
    const [processingEnvs, setProcessingEnvs] = useState({});

    // Handle modal close with confirmation if there's unsaved data
    const handleCloseModal = useCallback(() => {
        const hasData = hasSessionConfigData();
        console.log('[SessionConfig] Close button clicked, hasData:', hasData);
        if (hasData) {
            const confirmed = window.confirm(
                'You have unsaved session configuration. Are you sure you want to close?\n\n' +
                'Click "Start Simulation" to save your configuration before closing.'
            );
            console.log('[SessionConfig] User confirmed close:', confirmed);
            if (!confirmed) return;
        }
        onClose();
    }, [hasSessionConfigData, onClose]);


    // --- Actions ---

    const handleLinkEnv = (envId) => {
        // Optimistic update - instant UI feedback
        dispatch(optimisticLinkEnv({ sessionId: targetSessionId, envId }));
        // WebSocket disabled - config sent at simulation start
    };

    const handleUnlinkEnv = (envId) => {
        // Optimistic update - instant UI feedback
        dispatch(optimisticUnlinkEnv({ sessionId: targetSessionId, envId }));
        // WebSocket disabled - config sent at simulation start

        setProcessingEnvs(prev => ({ ...prev, [envId]: true }));
        // Clear processing state after a short delay
        setTimeout(() => {
            setProcessingEnvs(prev => {
                const newState = { ...prev };
                delete newState[envId];
                return newState;
            });
        }, 500);
    };

    const handleLinkModule = (moduleId) => {
        // Optimistic update - instant UI feedback
        if (activeEnv?.id) {
            dispatch(optimisticLinkModule({ sessionId: targetSessionId, envId: activeEnv.id, moduleId }));

            // Auto-link fields defined in the module
            const moduleData = userModules.find(m => (typeof m === 'string' ? m : m.id) === moduleId);
            if (moduleData && moduleData.fields && Array.isArray(moduleData.fields)) {
                moduleData.fields.forEach(fieldId => {
                    dispatch(optimisticLinkField({
                        sessionId: targetSessionId,
                        envId: activeEnv.id,
                        moduleId,
                        fieldId
                    }));
                });
            }
        }
        // WebSocket disabled - config sent at simulation start
    };

    const handleUnlinkModule = (moduleId) => {
        // Optimistic update - instant UI feedback
        if (activeEnv?.id) {
            dispatch(optimisticUnlinkModule({ sessionId: targetSessionId, envId: activeEnv.id, moduleId }));
        }
        // WebSocket disabled - config sent at simulation start
    };

    // Handle Standard Model toggle - auto link/unlink SM modules and fields
    const handleEnableSMToggle = (envId, enabled) => {
        setEnvEnableSM(prev => ({ ...prev, [envId]: enabled }));

        if (enabled) {
            // Link all SM modules and their fields (local only)
            Object.entries(SM_MODULES).forEach(([moduleId, fields]) => {
                // Optimistically link module
                dispatch(optimisticLinkModule({ sessionId: targetSessionId, envId, moduleId }));

                // Link all fields for this module
                fields.forEach(fieldId => {
                    // Optimistically link field
                    dispatch(optimisticLinkField({
                        sessionId: targetSessionId,
                        envId,
                        moduleId,
                        fieldId
                    }));
                });
            });
        } else {
            // Unlink all SM modules and their fields (local only)
            Object.entries(SM_MODULES).forEach(([moduleId, fields]) => {
                // Unlink all fields first
                fields.forEach(fieldId => {
                    // Optimistically unlink field
                    dispatch(optimisticUnlinkField({
                        sessionId: targetSessionId,
                        envId,
                        moduleId,
                        fieldId
                    }));
                });

                // Optimistically unlink module
                dispatch(optimisticUnlinkModule({ sessionId: targetSessionId, envId, moduleId }));
            });
        }
        // WebSocket disabled - config sent at simulation start
    };



    const handleInjectionSelect = (injection) => {
        if (selectedInjection?.id === injection.id) {
            setSelectedInjection(null);
            setDetailItem(null);
        } else {
            setSelectedInjection(injection);
            setDetailItem(injection); // Show details
            if (!injection.data || injection.data.length === 0) {
                sendMessage({
                    type: "GET_INJECTION",
                    auth: { injection_id: injection.id }
                });
            }
        }
    };

    const handleUnassignInList = (posKey, injectionId) => {
        if (!activeEnv || !activeModule || !activeField) return;

        dispatch(unassignInjection({
            sessionId: targetSessionId,
            envId: activeEnv.id,
            moduleId: typeof activeModule === 'string' ? activeModule : activeModule.id,
            fieldId: typeof activeField === 'string' ? activeField : activeField.id,
            posKey
        }));
        setClusterKey(prev => prev + 1);
    };

    // Called when user clicks a node in 3D view
    const handleNodeAssignment = (pos) => {
        if (!activeEnv || !activeModule || !activeField) {
            alert("Please complete the selection chain: Env -> Module -> Field.");
            return;
        }
        if (!selectedInjection) {
            alert("Please select an Injection first.");
            return;
        }

        const envId = activeEnv.id;
        const modId = typeof activeModule === 'string' ? activeModule : activeModule.id;
        const fieldId = typeof activeField === 'string' ? activeField : activeField.id;
        const posKey = JSON.stringify(pos);

        // Check if currently assigned
        const currentInjection = sessionConfig.envs?.[envId]?.modules?.[modId]?.fields?.[fieldId]?.injections?.[posKey];

        if (currentInjection === selectedInjection.id) {
            // Unassign
            dispatch(unassignInjection({
                sessionId: targetSessionId,
                envId,
                moduleId: modId,
                fieldId,
                posKey
            }));
        } else {
            // Assign
            dispatch(assignInjection({
                sessionId: targetSessionId,
                envId,
                moduleId: modId,
                fieldId,
                posKey,
                injectionId: selectedInjection.id
            }));

            // Close the live preview after assignment as requested
            setSelectedInjection(null);
            setDetailItem(null);
        }

        // Force remount of the 3D view
        setClusterKey(prev => prev + 1);
    };

    const handleStartSim = () => {
        if (!activeSession) return;

        // Get the complete session configuration from Redux
        const sessionId = activeSession.id;
        const fullSessionConfig = sessionData[sessionId]?.config?.envs || {};

        console.log('[SessionConfig] Starting simulation with config:', fullSessionConfig);

        const payload = {
            config: fullSessionConfig,
        };

        sendMessage({
            type: "START_SIM",
            data: payload,
            auth: {
                session_id: sessionId,
                user_id: localStorage.getItem(USER_ID_KEY)
            },
            timestamp: new Date().toISOString(),

        });

        onClose();
        alert("Simulation Started!");
    };



    // --- Render ---

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-[95vw] h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <Layers size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Session Configuration</h2>
                            <p className="text-xs text-slate-500">Orchestrate environments, modules, and injections</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            color="black"
                            variant="shadow"
                            className="font-bold text-white shadow-lg shadow-emerald-500/50"
                            startContent={<PlayCircle size={18} />}
                            onPress={handleStartSim}
                            isDisabled={!activeSession}>
                            Start Simulation
                        </Button>
                        <Button isIconOnly variant="light" onPress={handleCloseModal} className="text-slate-900 dark:text-white hover:bg-slate-200/50">
                            <X size={24} />
                        </Button>
                    </div>
                </div>

                {/* Disconnected Overlay */}
                {/* Main Layout */}
                <div className="flex flex-1 overflow-hidden relative">
                    {/* Disconnected Overlay */}
                    <GlobalConnectionSpinner inline={true} />

                    {/* LEFT: Session List */}
                    <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex flex-col">
                        <div className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Sessions
                        </div>
                        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-2 relative">
                            {sessionLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-slate-900/50 z-10">
                                    <span className="text-xs text-slate-500">Loading Sessions...</span>
                                </div>
                            )}
                            {sessions.map(sess => (
                                <div
                                    key={sess.id}
                                    onClick={() => dispatch(setActiveSession(sess))}
                                    className={`p-3 rounded-xl cursor-pointer border transition-all ${activeSession?.id === sess.id || (!activeSession && sess.id === currentSessionId)
                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                                        }`}
                                >
                                    <div className="font-bold text-sm truncate">{sess.id}</div>
                                    <div className={`text-[10px] mt-1 ${activeSession?.id === sess.id ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        {new Date(sess.created_at || Date.now()).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: Workspace */}
                    {activeSession ? (
                        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-black/20">

                            {/* Top Pane: 3 Columns (Methods removed) */}
                            <div className="h-1/2 flex border-b border-slate-200 dark:border-slate-800">

                                {/* Column 1: Environments */}
                                <div className="flex-1 basis-0 flex flex-col border-r border-slate-200 dark:border-slate-800 overflow-hidden">
                                    <div className="p-3 border-b flex items-center gap-2 bg-white dark:bg-slate-900">
                                        <Globe size={16} className="text-blue-500" />
                                        <span className="font-bold text-sm">Environments</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2 bg-white">
                                        <div className="text-[10px] text-slate-400 mb-2 uppercase font-bold text-indigo-600">Selected (Linked)</div>
                                        {activeSessionEnvs.map(env => (
                                            <ListItem
                                                key={env.id}
                                                title={env.id}
                                                isActive={activeEnv?.id === env.id}
                                                onClick={() => { setActiveEnv(env); setActiveModule(null); setActiveField(null); }}
                                                actionIcon={processingEnvs[env.id] ? <Spinner size="sm" color="danger" /> : <Minus size={14} />}
                                                actionColor="danger"
                                                onAction={() => handleUnlinkEnv(env.id)}
                                                showEnableSM={true}
                                                enableSM={envEnableSM[env.id] || false}
                                                onEnableSMChange={(val) => handleEnableSMToggle(env.id, val)}
                                            />
                                        ))}

                                        <div className="mt-4 pt-2 border-t text-[10px] text-slate-400 mb-2 uppercase font-bold">Available</div>
                                        {userEnvs.filter(ue => {
                                            const ueId = typeof ue === 'string' ? ue : ue.id;
                                            return !activeSessionEnvs.find(se => {
                                                const seId = typeof se === 'string' ? se : se.id;
                                                return seId === ueId;
                                            });
                                        }).map(env => {
                                            const envId = typeof env === 'string' ? env : env.id;
                                            return (
                                                <ListItem
                                                    key={envId}
                                                    title={envId}
                                                    actionIcon={<Plus size={14} />}
                                                    onAction={() => handleLinkEnv(envId)}
                                                // Clicking unlinked env doesn't select it for config (it must be linked first)
                                                />
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Column 2: Modules (Scoped to Active Env) */}
                                <div className={`flex-1 basis-0 flex flex-col border-r border-slate-200 dark:border-slate-800 overflow-hidden transition-opacity ${!activeEnv ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="p-3 border-b flex items-center gap-2 bg-white dark:bg-slate-900">
                                        <FolderGit2 size={16} className="text-purple-500" />
                                        <span className="font-bold text-sm">Modules</span>
                                        {activeEnv && <Chip size="sm" variant="flat" color="primary">{activeEnv.id}</Chip>}
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2 bg-white">
                                        <div className="text-[10px] text-slate-400 mb-2 uppercase font-bold text-indigo-600">Selected (Linked)</div>
                                        {activeSessionModules.map(mod => {
                                            const modId = typeof mod === 'string' ? mod : mod.id;
                                            return (
                                                <ListItem
                                                    key={modId}
                                                    title={modId}
                                                    isActive={activeModule === modId}
                                                    onClick={() => { setActiveModule(modId); setActiveField(null); }}
                                                    actionIcon={<Minus size={14} />}
                                                    actionColor="danger"
                                                    onAction={() => handleUnlinkModule(modId)}
                                                />
                                            );
                                        })}

                                        <div className="mt-4 pt-2 border-t text-[10px] text-slate-400 mb-2 uppercase font-bold">Available</div>
                                        {userModules.filter(um => {
                                            const umId = typeof um === 'string' ? um : um.id;
                                            const activeIds = activeSessionModules.map(m => typeof m === 'string' ? m : m.id);
                                            return !activeIds.includes(umId);
                                        }).map(mod => {
                                            const modId = typeof mod === 'string' ? mod : mod.id;
                                            return (
                                                <ListItem
                                                    key={modId}
                                                    title={modId}
                                                    actionIcon={<Plus size={14} />}
                                                    onAction={() => handleLinkModule(modId)}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Column 3: Fields (Scoped to Active Module) */}
                                <div className={`flex-1 basis-0 flex flex-col border-r border-slate-200 dark:border-slate-800 overflow-hidden transition-opacity ${!activeModule ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="p-3 border-b flex items-center gap-2 bg-white dark:bg-slate-900">
                                        <Database size={16} className="text-emerald-500" />
                                        <span className="font-bold text-sm">Fields</span>
                                        {activeModule && <Chip size="sm" variant="flat" color="secondary">{activeModule}</Chip>}
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2 bg-white">
                                        {/* Show Session Fields first */}
                                        <div className="text-[10px] text-slate-400 mb-2 uppercase font-bold text-indigo-600">Selected (Linked)</div>
                                        {activeSessionFields
                                            .map(field => {
                                                const fId = typeof field === 'string' ? field : field.id;
                                                return (
                                                    <ListItem
                                                        key={fId}
                                                        title={fId}
                                                        isActive={activeField === fId || activeField?.id === fId}
                                                        onClick={() => setActiveField(field)}
                                                        actionIcon={<Minus size={14} />}
                                                        actionColor="danger"
                                                        onAction={() => {
                                                            const fId = typeof field === 'string' ? field : field.id;

                                                            // Optimistic update - instant UI feedback
                                                            if (activeEnv?.id && activeModule) {
                                                                dispatch(optimisticUnlinkField({
                                                                    sessionId: targetSessionId,
                                                                    envId: activeEnv.id,
                                                                    moduleId: activeModule,
                                                                    fieldId: fId
                                                                }));
                                                            }
                                                            // WebSocket disabled - config sent at simulation start
                                                        }}
                                                    />
                                                );
                                            })}

                                        {/* Show Available User Fields */}
                                        <div className="mt-4 pt-2 border-t text-[10px] text-slate-400 mb-2 uppercase font-bold">Available</div>
                                        {userFields
                                            .filter(uf => {
                                                const fId = typeof uf === 'string' ? uf : uf.id;
                                                const linkedIds = activeSessionFields.map(sf => typeof sf === 'string' ? sf : sf.id);
                                                if (linkedIds.includes(fId)) return false;

                                                // Filter by module if property exists on field
                                                const fMod = uf.module || uf.module_id;
                                                if (fMod && activeModule && fMod !== activeModule) return false;

                                                return true;
                                            })
                                            .map(field => {
                                                const fId = typeof field === 'string' ? field : field.id;
                                                return (
                                                    <ListItem
                                                        key={fId}
                                                        title={fId}
                                                        // isActive={activeField === fId || activeField?.id === fId}
                                                        onClick={() => setActiveField(field)} // Allow selecting unlinked too?
                                                        actionIcon={<Plus size={14} />}
                                                        onAction={() => {
                                                            // Handle Link Field to Module/Session logic
                                                            const fId = typeof field === 'string' ? field : field.id;

                                                            // Optimistic update - instant UI feedback
                                                            if (activeEnv?.id && activeModule) {
                                                                dispatch(optimisticLinkField({
                                                                    sessionId: targetSessionId,
                                                                    envId: activeEnv.id,
                                                                    moduleId: activeModule,
                                                                    fieldId: fId
                                                                }));
                                                            }
                                                            // WebSocket disabled - config sent at simulation start
                                                        }}
                                                    />
                                                );
                                            })}
                                    </div>
                                </div>

                                {/* Column 4: Injections (Global Pool) */}
                                <div className={`flex-1 basis-0 flex flex-col overflow-hidden transition-opacity ${!activeField ? 'opacity-50 pointer-events-none' : ''}`}>
                                    <div className="p-3 border-b flex items-center gap-2 bg-white dark:bg-slate-900">
                                        <Zap size={16} className="text-amber-500" />
                                        <span className="font-bold text-sm">Injections</span>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2 bg-white">
                                        {/* Assigned Injections Section */}
                                        <div className="text-[10px] text-slate-400 mb-2 uppercase font-bold text-indigo-600">Selected (Linked)</div>
                                        {(() => {
                                            if (!activeEnv || !activeModule || !activeField) return <div className="text-[10px] text-slate-300 italic mb-4">Select a Field...</div>;
                                            const envId = activeEnv.id;
                                            const modId = typeof activeModule === 'string' ? activeModule : activeModule.id;
                                            const fieldId = typeof activeField === 'string' ? activeField : activeField.id;

                                            const injections = sessionConfig.envs?.[envId]?.modules?.[modId]?.fields?.[fieldId]?.injections || {};
                                            const entries = Object.entries(injections);

                                            if (entries.length === 0) return <div className="text-[10px] text-slate-300 italic mb-4">No injections assigned</div>;

                                            return (
                                                <div className="mb-4">
                                                    {entries.map(([posKey, injId]) => (
                                                        <ListItem
                                                            key={posKey}
                                                            title={injId}
                                                            subtitle={posKey}
                                                            actionIcon={<Minus size={14} />}
                                                            actionColor="danger"
                                                            onAction={() => handleUnassignInList(posKey, injId)}
                                                        />
                                                    ))}
                                                </div>
                                            );
                                        })()}

                                        <div className="mt-4 pt-2 border-t text-[10px] text-slate-400 mb-2 uppercase font-bold">Available</div>
                                        {userInjections.map(inj => (
                                            <ListItem
                                                key={inj.id}
                                                title={inj.id}
                                                subtitle={""}
                                                isActive={selectedInjection?.id === inj.id}
                                                onClick={() => handleInjectionSelect(inj)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Pane: Live View */}
                            <div className="flex-1 bg-slate-100 dark:bg-slate-900 p-4 overflow-hidden flex flex-col">
                                <div className="text-xs font-bold text-slate-500 uppercase mb-2 flex justify-between">
                                    <span>Live Workspace</span>
                                    {activeField && <span className="text-emerald-600">Active Field: {typeof activeField === 'string' ? activeField : activeField.id}</span>}
                                </div>

                                <div className="flex-1 flex gap-4 overflow-hidden">
                                    {/* LEFT SIDE */}
                                    <div className="w-1/2 flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                        {selectedInjection && detailItem && activeField && activeEnv ? (
                                            <div className="flex flex-col h-full">
                                                <div className="p-2 border-b text-[10px] font-bold text-slate-400 uppercase bg-slate-50 flex justify-between items-center">
                                                    <span>Target Position</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-slate-500">Center</span>
                                                        <Switch
                                                            size="sm"
                                                            isSelected={isCenterMode}
                                                            onValueChange={(isSelected) => {
                                                                setIsCenterMode(isSelected);
                                                                if (isSelected && activeEnv.dims) {
                                                                    const dims = Array.isArray(activeEnv.dims) ? activeEnv.dims : [8, 8, 8];
                                                                    const center = dims.map(d => Math.floor(d / 2));
                                                                    setHighlightedPos(center);
                                                                    setClusterKey(prev => prev + 1);
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                                                    {(() => {
                                                        const dims = Array.isArray(activeEnv.dims) ? activeEnv.dims : [8, 8, 8];
                                                        const dimLabels = ['X', 'Y', 'Z', 'W', 'V', 'U'];

                                                        return dims.map((maxDim, i) => (
                                                            <div key={i} className="flex flex-col gap-1">
                                                                <label className="text-xs font-bold text-slate-500 uppercase">Dimension {dimLabels[i] || i}</label>
                                                                <select
                                                                    className="p-2 rounded border border-slate-200 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                                                                    value={highlightedPos ? highlightedPos[i] : 0}
                                                                    disabled={isCenterMode}
                                                                    onChange={(e) => {
                                                                        const val = parseInt(e.target.value);
                                                                        setHighlightedPos(prev => {
                                                                            const newPos = prev ? [...prev] : new Array(dims.length).fill(0);
                                                                            newPos[i] = val;
                                                                            return newPos;
                                                                        });
                                                                        setClusterKey(prev => prev + 1);
                                                                    }}
                                                                >
                                                                    {Array.from({ length: maxDim }).map((_, idx) => (
                                                                        <option key={idx} value={idx}>{idx}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ));
                                                    })()}

                                                    <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded text-xs text-blue-700">
                                                        <p className="font-bold mb-2">Target: [{highlightedPos ? highlightedPos.join(', ') : '?'}]</p>
                                                        <Button
                                                            size="sm"
                                                            color={(() => {
                                                                const envId = activeEnv ? (typeof activeEnv === 'string' ? activeEnv : activeEnv.id) : null;
                                                                const modId = activeModule ? (typeof activeModule === 'string' ? activeModule : activeModule.id) : null;
                                                                const fieldId = activeField ? (typeof activeField === 'string' ? activeField : activeField.id) : null;
                                                                const posKey = JSON.stringify(highlightedPos);
                                                                return sessionConfigData?.[envId]?.modules?.[modId]?.fields?.[fieldId]?.injections?.[posKey] ? "danger" : "primary";
                                                            })()}
                                                            className="w-full font-bold shadow-sm"
                                                            startContent={(() => {
                                                                const envId = activeEnv ? (typeof activeEnv === 'string' ? activeEnv : activeEnv.id) : null;
                                                                const modId = activeModule ? (typeof activeModule === 'string' ? activeModule : activeModule.id) : null;
                                                                const fieldId = activeField ? (typeof activeField === 'string' ? activeField : activeField.id) : null;
                                                                const posKey = JSON.stringify(highlightedPos);
                                                                return sessionConfigData?.[envId]?.modules?.[modId]?.fields?.[fieldId]?.injections?.[posKey] ? <Minus size={16} /> : <Plus size={16} />;
                                                            })()}
                                                            onPress={() => handleNodeAssignment(highlightedPos)}
                                                        >
                                                            {(() => {
                                                                const envId = activeEnv ? (typeof activeEnv === 'string' ? activeEnv : activeEnv.id) : null;
                                                                const modId = activeModule ? (typeof activeModule === 'string' ? activeModule : activeModule.id) : null;
                                                                const fieldId = activeField ? (typeof activeField === 'string' ? activeField : activeField.id) : null;
                                                                const posKey = JSON.stringify(highlightedPos);
                                                                return sessionConfigData?.[envId]?.modules?.[modId]?.fields?.[fieldId]?.injections?.[posKey] ? "Unassign Injection" : "Assign Injection";
                                                            })()}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-slate-400 text-xs text-center p-4">
                                                {/* Render nothing as requested for non-injection left side, or maybe a placeholder? 
                                                   Prompt says "render nothing". But keeping container for layout symmetry.*/}
                                            </div>
                                        )}
                                    </div>

                                    {/* RIGHT SIDE */}
                                    <div className="w-1/2 flex flex-col bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative">
                                        {selectedInjection && detailItem && activeField ? (
                                            <SessionClusterPreview
                                                key={clusterKey}
                                                injection={detailItem}
                                                onNodeClick={handleNodeAssignment}
                                                dims={Array.isArray(activeEnv?.dims) ? activeEnv.dims : [8, 8, 8]}
                                                highlightedPos={highlightedPos}
                                                assignedConfig={
                                                    (() => {
                                                        const envId = activeEnv ? (typeof activeEnv === 'string' ? activeEnv : activeEnv.id) : null;
                                                        const modId = activeModule ? (typeof activeModule === 'string' ? activeModule : activeModule.id) : null;
                                                        const fieldId = activeField ? (typeof activeField === 'string' ? activeField : activeField.id) : null;
                                                        return sessionConfigData?.[envId]?.modules?.[modId]?.fields?.[fieldId]?.injections || {};
                                                    })()
                                                }
                                            />
                                        ) : (
                                            <div className="h-full overflow-hidden flex flex-col relative">
                                                {selectedItem ? (
                                                    <>
                                                        <div className="p-2 border-b text-[10px] font-bold text-slate-400 uppercase bg-slate-50 flex justify-between">
                                                            <span>Details: {typeof selectedItem === 'string' ? selectedItem : selectedItem.id}</span>
                                                            {itemLoading && <Loader2 size={12} className="animate-spin text-blue-500" />}
                                                        </div>
                                                        <div className="flex-1 overflow-auto p-2">
                                                            {itemLoading ? (
                                                                <div className="h-full flex items-center justify-center">
                                                                    <Spinner size="lg" color="primary" />
                                                                </div>
                                                            ) : (
                                                                <pre className="text-[10px] text-slate-600 font-mono whitespace-pre-wrap">
                                                                    {JSON.stringify(selectedItem, null, 2)}
                                                                </pre>
                                                            )}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                                        <Box size={48} strokeWidth={1} className="mb-4 text-slate-300" />
                                                        <p>Select an item to view details</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400 bg-slate-50">
                            <div className="text-center">
                                <Server size={48} strokeWidth={1} className="mx-auto mb-4 text-slate-300" />
                                <p>Select or Create a Session to begin</p>
                            </div>
                        </div>
                    )}
                </div>
            </div >
        </div >
    );
};

export default SessionConfig;