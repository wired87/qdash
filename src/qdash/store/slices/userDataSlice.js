/**
 * userDataSlice.js
 *
 * Redux slice that holds the initial user data bundle fetched from the backend
 * on the first WebSocket connection (via the USER_DATA message type).
 *
 * Shape of the data received from the backend:
 *   {
 *     envs:       Array<Env>      – user's saved simulation environments
 *     sessions:   Array<Session>  – user's existing sessions
 *     modules:    Array<Module>   – user's uploaded Python modules
 *     method_ids: Array<string>   – IDs of user's available methods / equations
 *     param_ids:  Array<string>   – IDs of user's configurable parameter sets
 *   }
 *
 * After this payload is stored here the individual feature slices
 * (envSlice, sessionSlice, moduleSlice …) are also seeded so the whole
 * UI can render without additional round-trips.
 */

import { createSlice } from '@reduxjs/toolkit';

// ─── Initial State ─────────────────────────────────────────────────────────────

const initialState = {
    // Flag: true once the backend has responded to USER_DATA
    isLoaded: false,

    // Raw user data bundle as returned by the backend
    envs: [],        // user's simulation environments
    sessions: [],    // user's sessions
    modules: [],     // user's Python modules
    method_ids: [],  // IDs of available methods / equations
    param_ids: [],   // IDs of available parameter sets

    // Request lifecycle
    loading: false,
    error: null,
};

// ─── Slice ────────────────────────────────────────────────────────────────────

const userDataSlice = createSlice({
    name: 'userData',
    initialState,
    reducers: {
        /**
         * Called when the USER_DATA response arrives from the backend.
         * Stores the full initial data bundle and marks loading as complete.
         *
         * Expected action.payload shape:
         *   { envs, sessions, modules, method_ids, param_ids }
         */
        setUserData: (state, action) => {
            const { envs, sessions, modules, method_ids, param_ids } = action.payload || {};

            state.envs       = Array.isArray(envs)       ? envs       : [];
            state.sessions   = Array.isArray(sessions)   ? sessions   : [];
            state.modules    = Array.isArray(modules)    ? modules    : [];
            state.method_ids = Array.isArray(method_ids) ? method_ids : [];
            state.param_ids  = Array.isArray(param_ids)  ? param_ids  : [];

            state.isLoaded = true;
            state.loading  = false;
            state.error    = null;
        },

        /** Mark that a USER_DATA request is in-flight. */
        setLoading: (state, action) => {
            state.loading = action.payload;
        },

        /** Store an error that occurred during the initial fetch. */
        setError: (state, action) => {
            state.error   = action.payload;
            state.loading = false;
        },

        /** Reset the slice back to its initial state (e.g. on sign-out). */
        clearUserData: () => initialState,
    },
});

// ─── Exports ──────────────────────────────────────────────────────────────────

export const { setUserData, setLoading, setError, clearUserData } = userDataSlice.actions;

// Selectors – convenient read-only access to this slice
export const selectUserDataLoaded   = (state) => state.userData?.isLoaded ?? false;
export const selectUserDataLoading  = (state) => state.userData?.loading  ?? false;
export const selectUserDataEnvs     = (state) => state.userData?.envs     ?? [];
export const selectUserDataSessions = (state) => state.userData?.sessions ?? [];
export const selectUserDataModules  = (state) => state.userData?.modules  ?? [];
export const selectMethodIds        = (state) => state.userData?.method_ids ?? [];
export const selectParamIds         = (state) => state.userData?.param_ids  ?? [];

export default userDataSlice.reducer;
