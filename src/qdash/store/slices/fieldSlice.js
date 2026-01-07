import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    userFields: [],
    fieldInjections: [],
    loading: false,
};

const fieldSlice = createSlice({
    name: 'fields',
    initialState,
    reducers: {
        setUserFields: (state, action) => {
            state.userFields = action.payload;
            state.loading = false;
        },
        setFieldInjections: (state, action) => {
            state.fieldInjections = action.payload;
        },
        updateField: (state, action) => {
            const index = state.userFields.findIndex(f => (typeof f === 'string' ? f : f.id) === action.payload.id);
            if (index !== -1) {
                if (typeof state.userFields[index] === 'string') {
                    state.userFields[index] = { id: state.userFields[index], ...action.payload };
                } else {
                    state.userFields[index] = { ...state.userFields[index], ...action.payload };
                }
            }
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        }
    },
});

export const { setUserFields, setFieldInjections, updateField, setLoading } = fieldSlice.actions;
export default fieldSlice.reducer;
