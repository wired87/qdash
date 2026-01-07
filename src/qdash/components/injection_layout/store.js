import { create } from 'zustand';

export const useNodeStore = create((set) => ({
    nodes: [],
    setNodes: (nodes) => set({ nodes }),
    updateNodeSOA: (id, soa) => set((state) => ({
        nodes: state.nodes.map((n) => (n.id === id ? { ...n, soa } : n)),
    })),
    updateNodeColor: (id, color) => set((state) => ({
        nodes: state.nodes.map((n) => (n.id === id ? { ...n, color } : n)),
    })),
    updateNodeField: (id, field) => set((state) => ({
        nodes: state.nodes.map((n) => (n.id === id ? { ...n, field } : n)),
    })),
    updateNodeNcfg: (id, ncfg) => set((state) => ({
        nodes: state.nodes.map((n) => (n.id === id ? { ...n, ncfg } : n)),
    })),
}));
