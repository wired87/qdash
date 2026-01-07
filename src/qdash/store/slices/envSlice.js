import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    userEnvs: [],
    loading: false,
    error: null,
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
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        }
    },
});

export const { setUserEnvs, addEnv, removeEnv, setLoading } = envSlice.actions;
export default envSlice.reducer;
