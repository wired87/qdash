import React, { useState, useEffect } from 'react';
import VisualBlock from "./block_visual";

// Mock configuration data (unchanged)
const MOCK_CFG_SCHEMA = {
    env_id: "",
    cluster_cfg: {
        sim_time_s: 300,
        cluster_dim: [2, 2, 2],
        device: "cpu",
        num_cores: 2,
        num_gpus: 0,
        memory_limit_gb: 8
    },
    phase_cfg: [
        {
            phase_id: "",
            data: {
                param1: 1,
                param2: "value"
            }
        }
    ],
    visual_data: { points: [], output: [] }
};

export const NodeConfigForm = () => {
    const [formBlocks, setFormBlocks] = useState([]);
    const [openBlocks, setOpenBlocks] = useState({});
    const [selectedBlockIndex, setSelectedBlockIndex] = useState(null);

    useEffect(() => {
        setFormBlocks([{
            block_data: { ...MOCK_CFG_SCHEMA },
            phases: [{ ...MOCK_CFG_SCHEMA.phase_cfg[0] }],
            visual_data: { points: [], output: [] }
        }]);
    }, []);

    const handleAddBlock = () => {
        const newBlock = {
            block_data: { ...MOCK_CFG_SCHEMA },
            phases: [{ ...MOCK_CFG_SCHEMA.phase_cfg[0] }],
            visual_data: { points: [], output: [] }
        };
        setFormBlocks([...formBlocks, newBlock]);
    };

    const handleInputChange = (e, blockIndex, key, isPhase, phaseIndex) => {
        const { value } = e.target;
        const newFormBlocks = [...formBlocks];
        let parsedValue = value;
        try {
            parsedValue = JSON.parse(value);
        } catch (error) {
            // If parsing fails, keep the value as a string
        }

        if (isPhase) {
            newFormBlocks[blockIndex].phases[phaseIndex][key] = parsedValue;
        } else {
            newFormBlocks[blockIndex].block_data[key] = parsedValue;
        }
        setFormBlocks(newFormBlocks);
    };

    const handleAccordionToggle = (blockIndex) => {
        setOpenBlocks(prev => ({
            ...prev,
            [blockIndex]: !prev[blockIndex]
        }));
    };

    const handleVisualDataChange = (data) => {
        if (selectedBlockIndex !== null) {
            const newFormBlocks = [...formBlocks];
            newFormBlocks[selectedBlockIndex].visual_data = data;
            setFormBlocks(newFormBlocks);
        }
    };

    // RENDER: Conditional rendering based on selectedBlockIndex
    if (selectedBlockIndex !== null) {
        const currentBlock = formBlocks[selectedBlockIndex];
        return (
            <div style={{maxWidth: '1280px', margin: '0 auto', padding: '2rem'}}>
                <button
                    onClick={() => setSelectedBlockIndex(null)}
                    style={{marginBottom: '1rem', padding: '0.5rem 1rem', backgroundColor: '#e5e7eb', color: '#1f2937', borderRadius: '0.375rem', cursor: 'pointer', border: 'none'}}
                >
                    &larr; Back to Block List
                </button>
                <VisualBlock
                    initialData={currentBlock.visual_data}
                    onDataChange={handleVisualDataChange}
                />
            </div>
        );
    }

    // RENDER: Main Block List View
    return (
        <div style={{maxWidth: '56rem', margin: '0 auto', backgroundColor: 'white', padding: '2rem', borderRadius: '0.75rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'}}>
            <h1 style={{fontSize: '1.875rem', fontWeight: '700', color: '#1f2937', marginBottom: '1.5rem', textAlign: 'center'}}>Dynamic Config Form</h1>
            <h2 style={{fontSize: '1.25rem', fontWeight: '600', color: '#374151', marginBottom: '1rem'}}>Configuration Blocks List</h2>

            <div id="form-blocks-container" style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                {formBlocks.map((block, blockIndex) => (
                    <div key={blockIndex} style={{backgroundColor: '#f9fafb', borderRadius: '0.5rem', padding: '1rem', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'}}>
                        <h3 style={{fontSize: '1.125rem', fontWeight: '700', color: '#374151'}}>Block {blockIndex + 1}</h3>
                        <div style={{display: 'flex', gap: '0.5rem'}}>
                            <button
                                type="button"
                                style={{padding: '0.25rem 0.75rem', backgroundColor: '#10b981', color: 'white', borderRadius: '0.375rem', fontSize: '0.875rem', cursor: 'pointer', border: 'none'}}
                                onClick={() => setSelectedBlockIndex(blockIndex)}
                            >
                                Edit / Visualize
                            </button>
                            <button
                                type="button"
                                style={{color: '#6b7280', border: 'none', background: 'none', cursor: 'pointer', transform: openBlocks[blockIndex] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s'}}
                                onClick={() => handleAccordionToggle(blockIndex)}
                            >
                                <svg style={{width: '1.25rem', height: '1.25rem'}} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button type="button" onClick={handleAddBlock} style={{marginTop: '2rem', width: '100%', padding: '0.75rem 1.5rem', backgroundColor: '#2563eb', color: 'white', borderRadius: '0.5rem', fontWeight: '600', fontSize: '1.125rem', cursor: 'pointer', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}>
                Add New Configuration Block
            </button>
        </div>
    );
};