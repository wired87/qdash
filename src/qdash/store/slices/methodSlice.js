import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    userMethods: [],
    loading: false,
    error: null
};

const methodSlice = createSlice({
    name: 'methods',
    initialState,
    reducers: {
        setUserMethods: (state, action) => {
            state.userMethods = action.payload;
            state.loading = false;
        },
        addMethod: (state, action) => {
            const existing = state.userMethods.find(m => (typeof m === 'string' ? m : m.id) === action.payload.id);
            if (!existing) {
                state.userMethods.push(action.payload);
            } else {
                const index = state.userMethods.indexOf(existing);
                state.userMethods[index] = action.payload; // Update if exists
            }
        },
        removeMethod: (state, action) => {
            state.userMethods = state.userMethods.filter(m => (typeof m === 'string' ? m : m.id) !== action.payload);
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        }
    },
});

export const { setUserMethods, addMethod, removeMethod, setLoading, setError } = methodSlice.actions;
export default methodSlice.reducer;
