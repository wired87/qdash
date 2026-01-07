import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    userInjections: [],
    activeInjection: null, // Detailed view
    loading: false,
};

const injectionSlice = createSlice({
    name: 'injections',
    initialState,
    reducers: {
        setUserInjections: (state, action) => {
            // payload: list of injection objects
            state.userInjections = action.payload;
            state.loading = false;
        },
        setActiveInjection: (state, action) => {
            state.activeInjection = action.payload;
        },
        updateInjectionDetail: (state, action) => {
            // updates the active injection detail with more data (e.g. data points)
            if (state.activeInjection && state.activeInjection.id === action.payload.id) {
                state.activeInjection = { ...state.activeInjection, ...action.payload };
            }
            // Also update in list if present
            const idx = state.userInjections.findIndex(i => i.id === action.payload.id);
            if (idx !== -1) {
                state.userInjections[idx] = { ...state.userInjections[idx], ...action.payload };
            }
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        }
    },
});

export const { setUserInjections, setActiveInjection, updateInjectionDetail, setLoading } = injectionSlice.actions;
export default injectionSlice.reducer;
