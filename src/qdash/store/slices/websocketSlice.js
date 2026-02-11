import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    isConnected: false,
    status: 'disconnected', // 'connected', 'disconnected', 'error', 'connecting'
    error: null,
    lastConnected: null
};

const websocketSlice = createSlice({
    name: 'websocket',
    initialState,
    reducers: {
        setConnectionStatus: (state, action) => {
            const { status, isConnected, error } = action.payload || {};
            state.status = status;
            state.isConnected = isConnected;
            // Store only a serializable snapshot of the error (no DOM/Event objects)
            if (error) {
                if (typeof error === 'string') {
                    state.error = error;
                } else if (typeof error === 'object') {
                    state.error = {
                        message: error.message || String(error.type || 'WebSocketError'),
                        code: error.code ?? error.statusCode ?? undefined,
                    };
                } else {
                    state.error = String(error);
                }
            }
            if (isConnected) {
                state.lastConnected = new Date().toISOString();
                state.error = null;
            }
        },
        setConnecting: (state) => {
            state.status = 'connecting';
        }
    }
});

export const { setConnectionStatus, setConnecting } = websocketSlice.actions;
export default websocketSlice.reducer;
