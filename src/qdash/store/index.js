/**
 * store/index.js
 *
 * Central Redux store configuration for QDash.
 *
 * Slices and their responsibilities:
 *   sessions     – active session, per-session env/module/field/injection links
 *   envs         – user environments (spatial containers), logs, vis data
 *   modules      – user Python modules
 *   fields       – user data-layer fields
 *   injections   – user injection patterns
 *   websocket    – WebSocket connection status (connected / disconnected / error)
 *   conversation – terminal conversation context (env_ids "in conversation")
 *   methods      – user method / equation definitions
 *   appState     – local agent knowledge base (current env, geometry selection, history …)
 *   userData     – initial user data bundle fetched on first WebSocket connect (USER_DATA)
 */

import { configureStore } from '@reduxjs/toolkit';
import sessionReducer from './slices/sessionSlice';
import envReducer from './slices/envSlice';
import moduleReducer from './slices/moduleSlice';
import fieldReducer from './slices/fieldSlice';
import injectionReducer from './slices/injectionSlice';
import websocketReducer from './slices/websocketSlice';
import conversationReducer from './slices/conversationSlice';
import methodReducer from './slices/methodSlice';
import appStateReducer from './slices/appStateSlice';
import userDataReducer from './slices/userDataSlice';

export const store = configureStore({
    reducer: {
        sessions: sessionReducer,
        envs: envReducer,
        modules: moduleReducer,
        fields: fieldReducer,
        injections: injectionReducer,
        websocket: websocketReducer,
        conversation: conversationReducer,
        methods: methodReducer,
        appState: appStateReducer,
        // Initial user data bundle (envs, sessions, modules, method_ids, param_ids)
        // populated by the USER_DATA WebSocket response on first connect.
        userData: userDataReducer,
    },
});
