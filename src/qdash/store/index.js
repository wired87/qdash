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
    },
});
