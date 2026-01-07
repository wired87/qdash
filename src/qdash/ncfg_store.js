import { create } from 'zustand';

export const useNCFGStore = create((set) => ({
    // Structure: { [nodeId]: { [posStr]: [timeSteps[], strengths[]] } }
    ncfgData: {},

    setGridNCFG: (nodeId, pos, timeSteps, strengths) => set((state) => {
        const posStr = `${pos.x},${pos.y},${pos.z}`;
        const nodeData = state.ncfgData[nodeId] || {};

        return {
            ncfgData: {
                ...state.ncfgData,
                [nodeId]: {
                    ...nodeData,
                    [posStr]: [timeSteps, strengths]
                }
            }
        };
    }),

    clearGridNCFG: (nodeId, pos) => set((state) => {
        const posStr = `${pos.x},${pos.y},${pos.z}`;
        const nodeData = { ...(state.ncfgData[nodeId] || {}) };
        delete nodeData[posStr];

        return {
            ncfgData: {
                ...state.ncfgData,
                [nodeId]: nodeData
            }
        };
    })
}));
