import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    userModules: [],
    activeModuleFields: [],
    loading: false,
};

const moduleSlice = createSlice({
    name: 'modules',
    initialState,
    reducers: {
        setUserModules: (state, action) => {
            state.userModules = action.payload;
            state.loading = false;
        },
        setActiveModuleFields: (state, action) => {
            state.activeModuleFields = action.payload;
        },
        updateModule: (state, action) => {
            const index = state.userModules.findIndex(m => (typeof m === 'string' ? m : m.id) === action.payload.id);
            if (index !== -1) {
                if (typeof state.userModules[index] === 'string') {
                    // Convert string to object if needed
                    state.userModules[index] = { id: state.userModules[index], ...action.payload };
                } else {
                    state.userModules[index] = { ...state.userModules[index], ...action.payload };
                }
            }
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        }
    },
});

export const { setUserModules, setActiveModuleFields, updateModule, setLoading } = moduleSlice.actions;
export default moduleSlice.reducer;
