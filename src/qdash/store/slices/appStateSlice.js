import { createSlice } from '@reduxjs/toolkit';

/**
 * Global app state / knowledge base for the local agent.
 * Holds current env, user history, and current edits so the agent can reason about context.
 */
const initialState = {
    currentEnv: null,       // full env object when user selects an env (serializable snapshot)
    selectedGeometry: null, // 'rect' | 'triangle' | 'box' when user selects a geometry in right sidebar
    userHistory: [],       // recent actions for agent context { type, payload, timestamp }
    currentEdits: {},      // keyed by entity id, e.g. { env_xyz: { field: value } }
};

const MAX_HISTORY = 50;

const appStateSlice = createSlice({
    name: 'appState',
    initialState,
    reducers: {
        setCurrentEnv: (state, action) => {
            const env = action.payload;
            state.currentEnv = env == null ? null : serializeEnv(env);
            state.userHistory = [
                ...state.userHistory.slice(-(MAX_HISTORY - 1)),
                { type: 'SELECT_ENV', payload: { envId: env?.id ?? env?.env_id }, timestamp: new Date().toISOString() },
            ];
        },
        pushHistory: (state, action) => {
            const { type, payload } = action.payload || {};
            if (type) {
                state.userHistory = [
                    ...state.userHistory.slice(-(MAX_HISTORY - 1)),
                    { type, payload: payload ?? {}, timestamp: new Date().toISOString() },
                ];
            }
        },
        setCurrentEdits: (state, action) => {
            const { key, edits } = action.payload || {};
            if (key != null) {
                if (edits == null) {
                    delete state.currentEdits[key];
                } else {
                    state.currentEdits[key] = edits;
                }
            }
        },
        clearCurrentEnv: (state) => {
            state.currentEnv = null;
        },
        setSelectedGeometry: (state, action) => {
            state.selectedGeometry = action.payload ?? null;
        },
    },
});

/** Return a plain serializable env object (no non-serializable values). */
function serializeEnv(env) {
    if (env == null) return null;
    return {
        id: env.id ?? env.env_id,
        env_id: env.env_id ?? env.id,
        amount_of_nodes: env.amount_of_nodes,
        cluster_dim: env.cluster_dim,
        dims: env.dims,
        sim_time: env.sim_time,
        distance: env.distance ?? 0,
        status: env.status ?? env.state,
        state: env.state ?? env.status,
        field_id: env.field_id ?? env.field,
        field: env.field ?? env.field_id,
        enable_sm: env.enable_sm,
        particle: env.particle,
    };
}

export const { setCurrentEnv, pushHistory, setCurrentEdits, clearCurrentEnv, setSelectedGeometry } = appStateSlice.actions;

export const selectCurrentEnv = (state) => state.appState?.currentEnv ?? null;
export const selectSelectedGeometry = (state) => state.appState?.selectedGeometry ?? null;
export const selectUserHistory = (state) => state.appState?.userHistory ?? [];
export const selectCurrentEdits = (state) => state.appState?.currentEdits ?? {};

export default appStateSlice.reducer;
