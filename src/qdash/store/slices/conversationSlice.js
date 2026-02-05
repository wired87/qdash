import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    models: [], // Array of env_ids
};

const conversationSlice = createSlice({
    name: 'conversation',
    initialState,
    reducers: {
        addModelEnv: (state, action) => {
            // action.payload is env_id
            if (!state.models.includes(action.payload)) {
                state.models.push(action.payload);
            }
        },
        removeModelEnv: (state, action) => {
            state.models = state.models.filter(id => id !== action.payload);
        }
    },
});

export const { addModelEnv, removeModelEnv } = conversationSlice.actions;
export default conversationSlice.reducer;
