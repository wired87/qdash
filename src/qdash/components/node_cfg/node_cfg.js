import React, { useState, useEffect } from 'react';

// Mock configuration data
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
    ]
};

export const NodeConfigForm = () => {
    // State to hold all form blocks and their data
    const [formBlocks, setFormBlocks] = useState([]);
    // State to manage which accordion blocks are open
    const [openBlocks, setOpenBlocks] = useState({});

    // Add an initial block when the component mounts
    useEffect(() => {
        setFormBlocks([{
            block_data: { ...MOCK_CFG_SCHEMA },
            phases: [{ ...MOCK_CFG_SCHEMA.phase_cfg[0] }]
        }]);
    }, []);

    // Handler to add a new configuration block
    const handleAddBlock = () => {
        const newBlock = {
            block_data: { ...MOCK_CFG_SCHEMA },
            phases: [{ ...MOCK_CFG_SCHEMA.phase_cfg[0] }]
        };
        setFormBlocks([...formBlocks, newBlock]);
    };

    // Handler to add a new phase to a specific block
    const handleAddPhase = (blockIndex) => {
        if (formBlocks[blockIndex].phases.length < 10) {
            const newFormBlocks = [...formBlocks];
            newFormBlocks[blockIndex].phases.push({ ...MOCK_CFG_SCHEMA.phase_cfg[0] });
            setFormBlocks(newFormBlocks);
        } else {
            // Using a simple alert, but for a real app, a modal would be better
            alert("You can't add more than 10 phases.");
        }
    };

    // Handler for changes in the input fields
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

    // Handler to toggle the accordion state of a block
    const handleAccordionToggle = (blockIndex) => {
        setOpenBlocks(prev => ({
            ...prev,
            [blockIndex]: !prev[blockIndex]
        }));
    };

    return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Dynamic Config Form</h1>
            <form id="main-form">
                <div id="form-blocks-container" className="space-y-6">
                    {formBlocks.map((block, blockIndex) => (
                        <div key={blockIndex} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                            <div className="flex justify-between items-center cursor-pointer" onClick={() => handleAccordionToggle(blockIndex)}>
                                <h2 className="text-xl font-bold text-gray-700">Block {blockIndex + 1}</h2>
                                <button type="button" className={`text-gray-500 hover:text-gray-700 transition-transform ${openBlocks[blockIndex] ? 'rotate-180' : 'rotate-0'}`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </button>
                            </div>
                            <div className={`accordion-content ${openBlocks[blockIndex] ? 'open' : ''} mt-4`}>
                                {/* Input fields for top-level keys */}
                                {Object.keys(block.block_data).filter(key => key !== 'phase_cfg').map(key => (
                                    <div key={key}>
                                        <label className="block text-sm font-medium text-gray-700 mt-4">{key}</label>
                                        <input
                                            type="text"
                                            name={key}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                                            value={JSON.stringify(block.block_data[key])}
                                            onChange={(e) => handleInputChange(e, blockIndex, key, false)}
                                        />
                                    </div>
                                ))}

                                {/* Phases section */}
                                <div className="mt-6 border-t border-gray-300 pt-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold text-gray-700">Phases</h3>
                                        <button
                                            type="button"
                                            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                                            onClick={() => handleAddPhase(blockIndex)}
                                        >
                                            + Add Phase
                                        </button>
                                    </div>
                                    {block.phases.map((phase, phaseIndex) => (
                                        <div key={phaseIndex} className="phase-item p-4 bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                                            <p className="font-semibold text-sm mb-2">Phase {phaseIndex + 1}</p>
                                            {Object.keys(phase).map(key => (
                                                <div key={key}>
                                                    <label className="block text-xs font-medium text-gray-600 mt-2">{key}</label>
                                                    <input
                                                        type="text"
                                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-1"
                                                        value={JSON.stringify(phase[key])}
                                                        onChange={(e) => handleInputChange(e, blockIndex, key, true, phaseIndex)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <button type="button" onClick={handleAddBlock} className="mt-8 w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-md">
                    Add New Configuration Block
                </button>
            </form>
        </div>
    );
};

