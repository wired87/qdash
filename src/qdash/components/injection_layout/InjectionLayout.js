import React, { useEffect, useState } from 'react';
import { ThreeGrid } from './ThreeGrid';
import EnergyProfileModal from '../node_cfg/block_visual';
import { useNodeStore } from './store';

const InjectionLayout = ({ env }) => {
    const { nodes, setNodes, updateNodeNcfg, updateNodeColor, updateNodeField } = useNodeStore();
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        console.log("InjectionLayout: Env updated", env);
        if (env) {
            let dims = [4, 4, 4]; // Default
            if (env.cluster_cfg && env.cluster_cfg.amount_of_nodes) {
                const cd = env.cluster_cfg.amount_of_nodes;
                if (Array.isArray(cd)) dims = cd;
                else if (typeof cd === 'number') {
                    const d = Math.round(Math.pow(cd, 1 / 3));
                    dims = [d, d, d];
                }
            }
            console.log("InjectionLayout: Dims", dims);

            const newNodes = [];
            let idx = 0;
            const spacing = 50;
            const offset = {
                x: (dims[0] * spacing) / 2,
                y: (dims[1] * spacing) / 2,
                z: (dims[2] * spacing) / 2
            };

            for (let x = 0; x < dims[0]; x++) {
                for (let y = 0; y < dims[1]; y++) {
                    for (let z = 0; z < dims[2]; z++) {
                        newNodes.push({
                            id: `node_${idx}`,
                            pos: { x: 0, y: 0, z: 0 }, // Physical pos
                            gridPos: {
                                x: x * spacing - offset.x,
                                y: y * spacing - offset.y,
                                z: z * spacing - offset.z
                            },
                            field: null,
                            soa: { time: [], energy: [] },
                            color: '#ffffff',
                            ncfg: null
                        });
                        idx++;
                    }
                }
            }
            console.log(`InjectionLayout: Generated ${newNodes.length} nodes`);
            setNodes(newNodes);
        }
    }, [env, setNodes]);

    const handleNodeClick = (id) => {
        console.log("InjectionLayout: Node clicked", id);
        setSelectedNodeId(id);
        setIsModalOpen(true);
    };

    const handleSendNcfg = (data) => {
        if (selectedNodeId) {
            updateNodeNcfg(selectedNodeId, data);

            // Visual feedback: Update color and field based on the first block's first tool
            if (data.blocks && data.blocks.length > 0 && data.blocks[0].tools && data.blocks[0].tools.length > 0) {
                const firstTool = data.blocks[0].tools[0];
                updateNodeField(selectedNodeId, firstTool);

                // Simplified color map for injection visualization
                const colorMap = {
                    photon: '#FFFF00',
                    electron: '#0000FF',
                    w_plus: '#FF00FF',
                    w_minus: '#8A2BE2',
                    z_boson: '#00FFFF',
                    gluon: '#FFA500',
                    higgs: '#FFFFFF'
                };

                if (colorMap[firstTool]) {
                    updateNodeColor(selectedNodeId, colorMap[firstTool]);
                } else {
                    updateNodeColor(selectedNodeId, '#00FF00'); // Default tool color
                }
            }
        }
        setIsModalOpen(false);
    };

    return (
        <div className="w-full h-full bg-black relative">
            <ThreeGrid onNodeClick={handleNodeClick} />
            {isModalOpen && selectedNodeId && (
                <EnergyProfileModal
                    initialData={nodes.find(n => n.id === selectedNodeId)?.ncfg || {
                        blocks: [{
                            id: Date.now(),
                            points: [
                                { id: 0, x: 50, y: 150 },
                                { id: 1, x: 550, y: 150 },
                            ],
                            output: [],
                            selectedTools: []
                        }]
                    }}
                    onClose={() => setIsModalOpen(false)}
                    onSend={handleSendNcfg}
                />
            )}
        </div>
    );
};

export default InjectionLayout;
