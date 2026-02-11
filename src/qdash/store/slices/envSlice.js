import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    userEnvs: [],
    selectedEnvId: null, // global selected env for engine, injections, etc.
    loading: false,
    error: null,
    logs: {}, // env_id -> list of log objects
    visData: {}, // env_id -> dict of values
};

const envSlice = createSlice({
    name: 'envs',
    initialState,
    reducers: {
        setUserEnvs: (state, action) => {
            state.userEnvs = action.payload;
            state.loading = false;
        },
        addEnv: (state, action) => {
            const existing = state.userEnvs.find(e => e.id === action.payload.id);
            if (!existing) {
                state.userEnvs.push(action.payload);
            } else {
                const index = state.userEnvs.indexOf(existing);
                state.userEnvs[index] = action.payload;
            }
        },
        removeEnv: (state, action) => {
            state.userEnvs = state.userEnvs.filter(e => e.id !== action.payload);
            if (state.selectedEnvId === action.payload) {
                state.selectedEnvId = null;
            }
        },
        setSelectedEnv: (state, action) => {
            state.selectedEnvId = action.payload ?? null;
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        updateLogs: (state, action) => {
            // payload: { envId, logs: [] }
            const { envId, logs } = action.payload;
            state.logs[envId] = logs;
        },
        updateVisData: (state, action) => {
            // payload: { envId, data: {} }
            const { envId, data } = action.payload;
            state.visData[envId] = data;
        }
    },
});

export const { setUserEnvs, addEnv, removeEnv, setSelectedEnv, setLoading, updateLogs, updateVisData } = envSlice.actions;

/** Selector: get full selected env object from userEnvs */
export const selectSelectedEnv = (state) => {
    const id = state.envs?.selectedEnvId;
    if (!id) return null;
    return (state.envs?.userEnvs || []).find((e) => e.id === id) ?? null;
};

export default envSlice.reducer;
