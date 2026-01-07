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
            const { status, isConnected, error } = action.payload;
            state.status = status;
            state.isConnected = isConnected;
            if (error) state.error = error; // Simplified error storage
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
