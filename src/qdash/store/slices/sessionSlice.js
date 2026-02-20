import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    sessions: [],
    activeSessionId: null,
    activeSession: null,

    // Session Context Data - now keyed by session ID
    sessionData: {}, // { [sessionId]: { envs: [], modules: [], fields: [], config: {} } }

    loading: false,
    error: null,
};

const sessionSlice = createSlice({
    name: 'sessions',
    initialState,
    reducers: {
        setSessions: (state, action) => {
            state.sessions = action.payload;
            state.loading = false;
        },
        addSession: (state, action) => {
            const session = action.payload;
            if (session?.id && !state.sessions.some(s => (typeof s === 'string' ? s : s.id) === session.id)) {
                state.sessions = [...state.sessions, session];
                state.loading = false;
            }
        },
        setActiveSession: (state, action) => {
            state.activeSession = action.payload;
            state.activeSessionId = action.payload ? action.payload.id : null;

            // Initialize data structure for this session if not exists
            if (state.activeSessionId && !state.sessionData[state.activeSessionId]) {
                state.sessionData[state.activeSessionId] = {
                    envs: [],
                    modules: [],
                    fields: [],
                    config: { envs: {} }
                };
            }
        },
        setActiveSessionEnvs: (state, action) => {
            if (state.activeSessionId) {
                if (!state.sessionData[state.activeSessionId]) state.sessionData[state.activeSessionId] = { envs: [], modules: [], fields: [], config: {} };
                state.sessionData[state.activeSessionId].envs = action.payload;
            }
        },
        setActiveSessionModules: (state, action) => {
            if (state.activeSessionId) {
                if (!state.sessionData[state.activeSessionId]) state.sessionData[state.activeSessionId] = { envs: [], modules: [], fields: [], config: {} };
                state.sessionData[state.activeSessionId].modules = action.payload;
            }
        },
        setActiveSessionFields: (state, action) => {
            if (state.activeSessionId) {
                if (!state.sessionData[state.activeSessionId]) state.sessionData[state.activeSessionId] = { envs: [], modules: [], fields: [], config: {} };
                state.sessionData[state.activeSessionId].fields = action.payload;
            }
        },
        setSessionConfig: (state, action) => {
            if (state.activeSessionId) {
                if (!state.sessionData[state.activeSessionId]) state.sessionData[state.activeSessionId] = { envs: [], modules: [], fields: [], config: {} };
                state.sessionData[state.activeSessionId].config = action.payload;
            }
        },
        mergeEnableSM: (state, action) => {
            // Merge ENABLE_SM data structure into session config
            // Expected payload: { session_id: { env_id: { module_id: [field_id, ...] } } }
            const smData = action.payload;

            Object.entries(smData).forEach(([sessionId, sessionSM]) => {
                // Initialize session data if not exists
                if (!state.sessionData[sessionId]) {
                    state.sessionData[sessionId] = {
                        envs: [],
                        modules: [],
                        fields: [],
                        config: { envs: {} },
                        enableSM: {}
                    };
                }

                // Merge SM data into enableSM field
                if (!state.sessionData[sessionId].enableSM) {
                    state.sessionData[sessionId].enableSM = {};
                }

                // Deep merge the SM structure
                Object.entries(sessionSM).forEach(([envId, envSM]) => {
                    if (!state.sessionData[sessionId].enableSM[envId]) {
                        state.sessionData[sessionId].enableSM[envId] = {};
                    }

                    Object.entries(envSM).forEach(([moduleId, fieldIds]) => {
                        state.sessionData[sessionId].enableSM[envId][moduleId] = fieldIds;
                    });
                });
            });
        },
        mergeLinkData: (state, action) => {
            // Merge hierarchical link data into session config
            // Can receive: { sessions: { session_id: {...} } } OR direct { session_id: {...} }
            const linkData = action.payload;

            // Determine if sessions are wrapped or at root
            let sessionsData = null;
            if (linkData?.sessions && typeof linkData.sessions === 'object') {
                sessionsData = linkData.sessions;
            } else if (linkData && typeof linkData === 'object' && !Array.isArray(linkData)) {
                // Check if this looks like a sessions object (has session_id keys with envs inside)
                const firstKey = Object.keys(linkData)[0];
                if (firstKey && linkData[firstKey]?.envs) {
                    sessionsData = linkData;
                }
            }

            if (sessionsData) {
                Object.entries(sessionsData).forEach(([sessionId, sessionData]) => {
                    // Skip if sessionData is not an object or is an array
                    if (!sessionData || typeof sessionData !== 'object' || Array.isArray(sessionData)) {
                        return;
                    }

                    // Initialize session data if not exists
                    if (!state.sessionData[sessionId]) {
                        state.sessionData[sessionId] = {
                            envs: [],
                            modules: [],
                            fields: [],
                            config: { envs: {} },
                            enableSM: {}
                        };
                    }

                    // Initialize config.envs if not exists
                    if (!state.sessionData[sessionId].config) {
                        state.sessionData[sessionId].config = { envs: {} };
                    }
                    if (!state.sessionData[sessionId].config.envs) {
                        state.sessionData[sessionId].config.envs = {};
                    }

                    // Deep merge envs structure
                    if (sessionData.envs) {
                        // If envs is an empty object, clear all envs
                        if (typeof sessionData.envs === 'object' && Object.keys(sessionData.envs).length === 0) {
                            state.sessionData[sessionId].config.envs = {};
                        } else {
                            Object.entries(sessionData.envs).forEach(([envId, envData]) => {
                                // Initialize env if not exists
                                if (!state.sessionData[sessionId].config.envs[envId]) {
                                    state.sessionData[sessionId].config.envs[envId] = { modules: [], injections: {} };
                                }

                                // Merge modules: env item carries modules: list[str] (selected module IDs only)
                                if (envData.modules !== undefined) {
                                    if (Array.isArray(envData.modules)) {
                                        state.sessionData[sessionId].config.envs[envId].modules = [...new Set(envData.modules)];
                                    } else if (typeof envData.modules === 'object') {
                                        // Legacy: object format -> extract module IDs
                                        state.sessionData[sessionId].config.envs[envId].modules = Object.keys(envData.modules);
                                    } else {
                                        state.sessionData[sessionId].config.envs[envId].modules = [];
                                    }
                                }
                                // Merge injections
                                if (envData.injections !== undefined) {
                                    if (!state.sessionData[sessionId].config.envs[envId].injections) {
                                        state.sessionData[sessionId].config.envs[envId].injections = {};
                                    }
                                    state.sessionData[sessionId].config.envs[envId].injections = {
                                        ...state.sessionData[sessionId].config.envs[envId].injections,
                                        ...envData.injections
                                    };
                                }
                            });
                        }
                    }
                });
            }
        },
        // Optimistic Link Env to Session (instant UI update)
        optimisticLinkEnv: (state, action) => {
            const { sessionId, envId } = action.payload;
            if (!state.sessionData[sessionId]) {
                state.sessionData[sessionId] = { envs: [], modules: [], fields: [], config: { envs: {} } };
            }
            if (!state.sessionData[sessionId].config) {
                state.sessionData[sessionId].config = { envs: {} };
            }
            if (!state.sessionData[sessionId].config.envs) {
                state.sessionData[sessionId].config.envs = {};
            }
            // Add env with modules: list[str], injections: {}
            if (!state.sessionData[sessionId].config.envs[envId]) {
                state.sessionData[sessionId].config.envs[envId] = { modules: [], injections: {} };
            }
        },
        // Optimistic Unlink Env from Session (instant UI update)
        optimisticUnlinkEnv: (state, action) => {
            const { sessionId, envId } = action.payload;
            if (state.sessionData[sessionId]?.config?.envs) {
                delete state.sessionData[sessionId].config.envs[envId];
            }
        },
        // Remove Env from Session
        removeSessionEnv: (state, action) => {
            const { sessionId, envId } = action.payload;
            if (state.sessionData[sessionId]?.config?.envs) {
                delete state.sessionData[sessionId].config.envs[envId];
            }
        },
        // Optimistic Link Module to Env (instant UI update) - modules: list[str]
        optimisticLinkModule: (state, action) => {
            const { sessionId, envId, moduleId } = action.payload;
            if (!state.sessionData[sessionId]?.config?.envs?.[envId]) return;
            const mods = state.sessionData[sessionId].config.envs[envId].modules;
            if (!Array.isArray(mods)) state.sessionData[sessionId].config.envs[envId].modules = [];
            if (!state.sessionData[sessionId].config.envs[envId].modules.includes(moduleId)) {
                state.sessionData[sessionId].config.envs[envId].modules.push(moduleId);
            }
        },
        // Optimistic Unlink Module from Env (instant UI update)
        optimisticUnlinkModule: (state, action) => {
            const { sessionId, envId, moduleId } = action.payload;
            const mods = state.sessionData[sessionId]?.config?.envs?.[envId]?.modules;
            if (Array.isArray(mods)) {
                state.sessionData[sessionId].config.envs[envId].modules = mods.filter(id => id !== moduleId);
            }
        },
        // Remove Module from Env in Session
        removeSessionModule: (state, action) => {
            const { sessionId, envId, moduleId } = action.payload;
            const mods = state.sessionData[sessionId]?.config?.envs?.[envId]?.modules;
            if (Array.isArray(mods)) {
                state.sessionData[sessionId].config.envs[envId].modules = mods.filter(id => id !== moduleId);
            }
        },
        // Optimistic Link Method to Module - no-op (env struct: modules is list[str] only)
        optimisticLinkMethod: () => {},
        // Optimistic Unlink Method from Module - no-op
        optimisticUnlinkMethod: () => {},
        // Optimistic Link Field to Module - no-op (env struct: modules is list[str] only)
        optimisticLinkField: () => {},
        // Optimistic Unlink Field from Module - no-op
        optimisticUnlinkField: () => {},
        // Remove Field from Module in Session - no-op
        removeSessionField: () => {},
        // Assign Injection to Environment Position
        assignInjection: (state, action) => {
            const { sessionId, envId, fieldId, posKey, injectionId } = action.payload;
            // Ensure path exists
            if (!state.sessionData[sessionId]) state.sessionData[sessionId] = { envs: [], modules: [], fields: [], config: { envs: {} } };
            if (!state.sessionData[sessionId].config.envs[envId]) state.sessionData[sessionId].config.envs[envId] = { modules: [], injections: {} };
            if (!state.sessionData[sessionId].config.envs[envId].injections) state.sessionData[sessionId].config.envs[envId].injections = {};
            if (!state.sessionData[sessionId].config.envs[envId].injections[fieldId]) state.sessionData[sessionId].config.envs[envId].injections[fieldId] = {};

            // Assign
            state.sessionData[sessionId].config.envs[envId].injections[fieldId][posKey] = injectionId;
        },
        // Unassign Injection from Environment Position
        unassignInjection: (state, action) => {
            const { sessionId, envId, fieldId, posKey } = action.payload;
            if (state.sessionData[sessionId]?.config?.envs?.[envId]?.injections?.[fieldId]) {
                delete state.sessionData[sessionId].config.envs[envId].injections[fieldId][posKey];
            }
        },
        // Remove Injection from all Sessions (when injection is deleted globally)
        removeInjectionFromAllSessions: (state, action) => {
            const { injectionId } = action.payload;
            // Iterate through all sessions
            Object.keys(state.sessionData).forEach(sessionId => {
                const envs = state.sessionData[sessionId]?.config?.envs;
                if (envs) {
                    Object.keys(envs).forEach(envId => {
                        const injections = envs[envId]?.injections;
                        if (injections) {
                            Object.keys(injections).forEach(fieldId => {
                                const fieldInjections = injections[fieldId];
                                if (fieldInjections) {
                                    Object.keys(fieldInjections).forEach(key => {
                                        if (fieldInjections[key] === injectionId) {
                                            delete fieldInjections[key];
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        }
    },
});

export const {
    setSessions, addSession, setActiveSession,
    setActiveSessionEnvs, setActiveSessionModules, setActiveSessionFields, setSessionConfig,
    mergeEnableSM, mergeLinkData,
    optimisticLinkEnv, optimisticUnlinkEnv,
    optimisticLinkModule, optimisticUnlinkModule,
    optimisticLinkMethod, optimisticUnlinkMethod,
    optimisticLinkField, optimisticUnlinkField,
    removeSessionEnv, removeSessionModule, removeSessionField,
    removeInjectionFromAllSessions,
    assignInjection, unassignInjection,
    setLoading, setError
} = sessionSlice.actions;
export default sessionSlice.reducer;
