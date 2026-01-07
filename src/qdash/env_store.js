import { create } from 'zustand';

export const useEnvStore = create((set) => ({
    // Global environment store
    envs: {},

    // Action to add/update environments
    addEnvs: (newEnvs) => set((state) => ({
        envs: { ...state.envs, ...newEnvs }
    })),

    // Action to set the entire environment list (replacing)
    setEnvs: (envs) => set({ envs }),

    // Action to clear environments
    clearEnvs: () => set({ envs: {} }),

    // Action to remove a specific environment
    removeEnv: (envId) => set((state) => {
        const newEnvs = { ...state.envs };
        delete newEnvs[envId];
        return { envs: newEnvs };
    })
}));
