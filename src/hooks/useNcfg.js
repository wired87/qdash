import React, { useState, useCallback, useMemo } from 'react';
// Assuming the use of a library like HeroUI/NextUI which provides these components
import { Button, Input, Accordion, AccordionItem, Modal } from '@heroui/react';

// NOTE: Custom components (Button, AccordionItem, Input) are REMOVED,
// as the HeroUI components will be imported and used directly.

// --- PHASE MODAL MANAGEMENT HOOK ---

const defaultPhase = {
    name: '',
    duration: 100,
    strength_factor: 1.0,
};

/**
 * Manages the state and UI for creating a new Phase object in a modal.
 */
const usePhaseModal = () => {
    // The modal state is now managed externally by the HeroUI Modal component
    const [phase, setPhase] = useState(defaultPhase);
    const [onSubmitCallback, setOnSubmitCallback] = useState(null);
    const [modalOpen, setModalOpen] = useState(false); // New state for modal

    const openModal = useCallback((callback) => {
        setPhase(defaultPhase);
        setOnSubmitCallback(() => callback);
        setModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setModalOpen(false);
        setOnSubmitCallback(null);
    }, []);

    const handleInputChange = useCallback((field, value) => {
        setPhase(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    const handleSubmit = useCallback(() => {
        if (phase.name && onSubmitCallback) {
            // Return the newly created phase object via the callback
            onSubmitCallback(phase);
            closeModal();
        }
    }, [phase, onSubmitCallback, closeModal]);

    // The Modal Component is now a standard HeroUI Modal
    const PhaseModalComponent = (
        <Modal 
            isOpen={modalOpen} // Use the new state
            onClose={closeModal} 
            title="Create New Phase Section" 
            size="md" // Use a HeroUI prop for size
        >
            <div className="space-y-4 pt-4"> {/* Added padding for separation */}
                <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Phase Name</label>
                    <Input
                        value={phase.name}
                        onValueChange={(val) => handleInputChange('name', val)}
                        placeholder="e.g., Ramp Up, Steady State"
                        fullWidth // Common HeroUI prop
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Duration (Iters)</label>
                    <Input
                        value={phase.duration}
                        onValueChange={(val) => handleInputChange('duration', val)}
                        type="number"
                        fullWidth
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Strength Factor</label>
                    <Input
                        value={phase.strength_factor}
                        onValueChange={(val) => handleInputChange('strength_factor', val)}
                        type="number"
                        fullWidth
                    />
                </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
                <Button color="secondary" onPress={closeModal}>Cancel</Button>
                <Button color="success" onPress={handleSubmit} disabled={!phase.name}>Add Phase</Button>
            </div>
        </Modal>
    );

    return {
        modalOpen, // Renamed from isOpen for clarity
        phase,
        openModal,
        closeModal,
        handleInputChange,
        handleSubmit,
        PhaseModal: PhaseModalComponent, // Return the pre-rendered modal
    };
};

// --- DATA MODEL MANAGEMENT HOOK (useNcfgManager) ---
// (No changes here, as the logic is sound)

/**
 * Manages the state and operations for the nested configuration:
 * NCFG Type -> NCFG Section -> Block -> Phase Data
 */
const useNcfgManager = (initialNcfg = []) => {
    // ... (All management functions remain the same)
    const [ncfg, setNcfg] = useState(initialNcfg);
    const [nextTypeId, setNextTypeId] = useState(1);
    const [nextSectionId, setNextSectionId] = useState(1);
    
    // --- NCFG TYPE (Top Level) Management ---

    const addNcfgType = useCallback(() => {
        const newId = `Type-${nextTypeId}`;
        const defaultType = {
            id: newId,
            sections: [] // Array of NCFG Sections
        };
        setNcfg(prevNcfg => [...prevNcfg, defaultType]);
        setNextTypeId(prevId => prevId + 1);
    }, [nextTypeId]);

    const deleteNcfgType = useCallback((typeIndex) => {
        setNcfg(prevNcfg => prevNcfg.filter((_, index) => index !== typeIndex));
    }, []);

    // --- NCFG SECTION (Middle Level) Management ---

    const addNcfgSection = useCallback((typeIndex) => {
        const newId = `Sec-${nextSectionId}`;
        const defaultSection = {
            id: newId,
            blocks: [] // Array of Blocks
        };
        setNcfg(prevNcfg => prevNcfg.map((type, tIndex) => {
            if (tIndex === typeIndex) {
                return { ...type, sections: [...type.sections, defaultSection] };
            }
            return type;
        }));
        setNextSectionId(prevId => prevId + 1);
    }, [nextSectionId]);

    const deleteNcfgSection = useCallback((typeIndex, sectionIndex) => {
        setNcfg(prevNcfg => prevNcfg.map((type, tIndex) => {
            if (tIndex === typeIndex) {
                return {
                    ...type,
                    sections: type.sections.filter((_, sIndex) => sIndex !== sectionIndex)
                };
            }
            return type;
        }));
    }, []);

    // --- BLOCK (Lowest Level) Management ---

    const addBlockToNcfg = useCallback((typeIndex, sectionIndex) => {
        const newBlock = {
            id: (Math.random() * 1000).toFixed(0), // Simple ID
            block_break_duration_iters: 10,
            multiplier: 1.0,
            sets_iter: 5,
            phase_data: [], // NEW: List of phase objects
        };

        setNcfg(prevNcfg => prevNcfg.map((type, tIndex) => {
            if (tIndex === typeIndex) {
                return {
                    ...type,
                    sections: type.sections.map((section, sIndex) => {
                        if (sIndex === sectionIndex) {
                            return {
                                ...section,
                                blocks: [...section.blocks, newBlock]
                            };
                        }
                        return section;
                    })
                };
            }
            return type;
        }));
    }, []);

    const deleteBlockFromNcfg = useCallback((typeIndex, sectionIndex, blockIndex) => {
        setNcfg(prevNcfg => prevNcfg.map((type, tIndex) => {
            if (tIndex === typeIndex) {
                return {
                    ...type,
                    sections: type.sections.map((section, sIndex) => {
                        if (sIndex === sectionIndex) {
                            return {
                                ...section,
                                blocks: section.blocks.filter((_, bIndex) => bIndex !== blockIndex)
                            };
                        }
                        return section;
                    })
                };
            }
            return type;
        }));
    }, []);

    const updateBlockFieldInNcfg = useCallback((typeIndex, sectionIndex, blockIndex, field, value) => {
        setNcfg(prevNcfg => prevNcfg.map((type, tIndex) => {
            if (tIndex === typeIndex) {
                return {
                    ...type,
                    sections: type.sections.map((section, sIndex) => {
                        if (sIndex === sectionIndex) {
                            return {
                                ...section,
                                blocks: section.blocks.map((block, bIndex) => {
                                    if (bIndex === blockIndex) {
                                        // Attempt to parse to number if possible
                                        const parsedValue = (!isNaN(parseFloat(value))) ? parseFloat(value) : value;
                                        return {
                                            ...block,
                                            [field]: parsedValue,
                                        };
                                    }
                                    return block;
                                })
                            };
                        }
                        return section;
                    })
                };
            }
            return type;
        }));
    }, []);

    // --- PHASE DATA Management (New functionality) ---

    const addPhaseToBlock = useCallback((typeIndex, sectionIndex, blockIndex, newPhase) => {
        setNcfg(prevNcfg => prevNcfg.map((type, tIndex) => {
            if (tIndex === typeIndex) {
                return {
                    ...type,
                    sections: type.sections.map((section, sIndex) => {
                        if (sIndex === sectionIndex) {
                            return {
                                ...section,
                                blocks: section.blocks.map((block, bIndex) => {
                                    if (bIndex === blockIndex) {
                                        return {
                                            ...block,
                                            phase_data: [...block.phase_data, newPhase] // Append new phase
                                        };
                                    }
                                    return block;
                                })
                            };
                        }
                        return section;
                    })
                };
            }
            return type;
        }));
    }, []);

    const deletePhaseFromBlock = useCallback((typeIndex, sectionIndex, blockIndex, phaseIndex) => {
        setNcfg(prevNcfg => prevNcfg.map((type, tIndex) => {
            if (tIndex === typeIndex) {
                return {
                    ...type,
                    sections: type.sections.map((section, sIndex) => {
                        if (sIndex === sectionIndex) {
                            return {
                                ...section,
                                blocks: section.blocks.map((block, bIndex) => {
                                    if (bIndex === blockIndex) {
                                        return {
                                            ...block,
                                            phase_data: block.phase_data.filter((_, pIndex) => pIndex !== phaseIndex)
                                        };
                                    }
                                    return block;
                                })
                            };
                        }
                        return section;
                    })
                };
            }
            return type;
        }));
    }, []);

    return {
        ncfg,
        addNcfgType,
        deleteNcfgType,
        addNcfgSection,
        deleteNcfgSection,
        addBlockToNcfg,
        deleteBlockFromNcfg,
        updateBlockFieldInNcfg,
        addPhaseToBlock,
        deletePhaseFromBlock,
    };
};

// --- RENDER COMPONENTS (Nested Structure) ---

/**
 * Renders the input fields for a single Block.
 */
const BlockRenderer = React.memo(({
    typeIndex,
    sectionIndex,
    block,
    blockIndex,
    updateBlockFieldInNcfg,
    deleteBlockFromNcfg,
    addPhaseToBlock,
    deletePhaseFromBlock
}) => {
    // Use the custom hook to manage the modal state
    const { openModal, PhaseModal } = usePhaseModal();

    const handleAddPhaseClick = (e) => {
        // e.stopPropagation(); is handled by HeroUI Button/Modal
        openModal((newPhase) => {
            // Callback executed when modal is successfully submitted
            addPhaseToBlock(typeIndex, sectionIndex, blockIndex, newPhase);
        });
    };

    return (
        <div className="border border-gray-300 rounded-xl p-4 mb-3 bg-white shadow-sm">
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-base font-semibold text-gray-700">Block {blockIndex + 1} (ID: {block.id})</h4>
                {/* HeroUI Button: color="danger" variant="flat" */}
                <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    onPress={() => deleteBlockFromNcfg(typeIndex, sectionIndex, blockIndex)}
                >
                    Delete Block
                </Button>
            </div>

            {/* Block Fields */}
            <div className="grid grid-cols-2 gap-4 mb-4 border-b pb-4">
                {['id', 'block_break_duration_iters', 'multiplier', 'sets_iter'].map((key) => (
                    <div key={key}>
                        <label className="text-xs font-medium text-gray-500 block mb-1">{key.replace(/_/g, ' ').toUpperCase()}</label>
                        {/* HeroUI Input */}
                        <Input
                            value={block[key]}
                            onValueChange={(val) => updateBlockFieldInNcfg(typeIndex, sectionIndex, blockIndex, key, val)}
                            size="sm"
                            type={key.includes('id') ? 'text' : 'number'}
                            fullWidth
                            className="text-xs"
                        />
                    </div>
                ))}
            </div>

            {/* Phase Data Section */}
            <div className="bg-indigo-50 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                    <h5 className="text-sm font-bold text-indigo-700">Phase Data ({block.phase_data.length})</h5>
                    {/* HeroUI Button: color="primary" variant="solid" */}
                    <Button size="sm" color="primary" onPress={handleAddPhaseClick}>
                        + Add Phase
                    </Button>
                </div>

                {/* Render Phase List */}
                {block.phase_data.length === 0 ? (
                    <p className="text-xs text-indigo-500 italic">No phases defined for this block.</p>
                ) : (
                    <ul className="space-y-1 mt-2">
                        {block.phase_data.map((phase, phaseIndex) => (
                            // Use key={phase.name + phaseIndex} if 'phaseIndex' is unstable
                            <li key={phaseIndex} className="flex justify-between items-center text-xs p-2 bg-indigo-100 rounded">
                                <span>
                                    **{phase.name}** | Duration: {phase.duration} | Factor: {phase.strength_factor}
                                </span>
                                {/* HeroUI Button */}
                                <Button
                                    size="sm"
                                    color="danger"
                                    variant="flat"
                                    className="ml-2 text-xs h-6 p-1"
                                    onPress={() => deletePhaseFromBlock(typeIndex, sectionIndex, blockIndex, phaseIndex)}
                                >
                                    Remove
                                </Button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Renders the modal hook's component */}
            {PhaseModal}
        </div>
    );
});


/**
 * Renders a single NCFG Section, which contains multiple Blocks. (Middle Level)
 * FIX: Using HeroUI's AccordionItem and passing the header and content correctly.
 */
const NcfgSectionRenderer = ({
    typeIndex,
    section,
    sectionIndex,
    deleteNcfgSection,
    addBlockToNcfg,
    ...blockProps // Pass through block management props
}) => {
    const blockCount = section.blocks.length;

    // Use HeroUI AccordionItem/Accordion structure
    // We are wrapping it in a parent Accordion component in the parent
    return (
        <AccordionItem
            key={section.id} // HeroUI/NextUI AccordionItems typically require a key/value
            title={
                <div className="flex items-center justify-between w-full">
                    <span className="text-md font-bold text-gray-700">
                        Section: **{section.id}** ({blockCount} Blocks)
                    </span>
                    {/* HeroUI Button */}
                    <Button
                        size="sm"
                        color="danger"
                        onPress={(e) => {
                            // Stop propagation so the accordion doesn't toggle
                            e.stopPropagation(); 
                            deleteNcfgSection(typeIndex, sectionIndex);
                        }}
                        className="ml-4"
                    >
                        Delete Section
                    </Button>
                </div>
            }
        >
            {/* THIS IS THE CHILDREN/CONTENT of the AccordionItem */}
            <div className="space-y-4 border border-dashed border-gray-300 p-4 rounded-xl bg-gray-50 mt-4">
                {/* Render all blocks for this NCFG Section */}
                {section.blocks.map((block, blockIndex) => (
                    <BlockRenderer
                        key={blockIndex}
                        typeIndex={typeIndex}
                        sectionIndex={sectionIndex}
                        block={block}
                        blockIndex={blockIndex}
                        {...blockProps}
                    />
                ))}

                {/* HeroUI Button */}
                <Button
                    color="secondary"
                    onPress={() => addBlockToNcfg(typeIndex, sectionIndex)}
                    className="w-full mt-2"
                >
                    + Add Block to Section {section.id}
                </Button>
            </div>
        </AccordionItem>
    );
};

/**
 * Renders a single NCFG Type, which contains multiple NCFG Sections. (Top Level)
 * FIX: Using HeroUI's Accordion and AccordionItem for the nested structure.
 */
const NcfgTypeRenderer = ({
    ncfgType,
    typeIndex,
    deleteNcfgType,
    addNcfgSection,
    ...sectionProps // Pass through section/block management props
}) => {
    const sectionCount = ncfgType.sections.length;

    // Use a top-level Accordion to contain the AccordionItems
    return (
        <Accordion selectionMode="multiple" isCompact>
             <AccordionItem
                key={ncfgType.id} // HeroUI/NextUI AccordionItems typically require a key/value
                title={
                    <div className="flex items-center justify-between w-full">
                        <span className="text-xl font-extrabold text-indigo-700">
                            NCFG Type: {ncfgType.id} ({sectionCount} Sections)
                        </span>
                        {/* HeroUI Button */}
                        <Button
                            size="sm"
                            color="danger"
                            onPress={(e) => {
                                // Stop propagation so the accordion doesn't toggle
                                e.stopPropagation(); 
                                deleteNcfgType(typeIndex);
                            }}
                            className="ml-4"
                        >
                            Delete Type
                        </Button>
                    </div>
                }
            >
                {/* THIS IS THE CHILDREN/CONTENT of the AccordionItem */}
                <div className="flex flex-col gap-6 pt-4"> 
                    {/* Use a nested Accordion to render all NCFG Sections for this NCFG Type */}
                    <Accordion selectionMode="multiple" isCompact>
                        {ncfgType.sections.map((section, sectionIndex) => (
                            <NcfgSectionRenderer
                                key={sectionIndex}
                                typeIndex={typeIndex}
                                section={section}
                                sectionIndex={sectionIndex}
                                deleteNcfgSection={sectionProps.deleteNcfgSection}
                                addBlockToNcfg={sectionProps.addBlockToNcfg}
                                {...sectionProps}
                            />
                        ))}
                    </Accordion>
                    
                    {/* HeroUI Button: color="primary" variant="flat" */}
                    <Button
                        color="primary"
                        variant="flat"
                        onPress={() => addNcfgSection(typeIndex)}
                        className="w-full border-2 border-indigo-200"
                    >
                        + Add NCFG Section to Type {ncfgType.id}
                    </Button>
                </div>
            </AccordionItem>
        </Accordion>
    );
};


// --- MAIN APPLICATION COMPONENT ---

const useNcfg = () => {
    // Use the custom hook to manage all NCFG state
    const {
        ncfg,
        addNcfgType,
        deleteNcfgType,
        addNcfgSection,
        deleteNcfgSection,
        addBlockToNcfg,
        deleteBlockFromNcfg,
        updateBlockFieldInNcfg,
        addPhaseToBlock,
        deletePhaseFromBlock,
    } = useNcfgManager();

    // Prepare a single props object to pass down through the nesting
    const managementProps = useMemo(() => ({
        deleteNcfgSection,
        addBlockToNcfg,
        deleteBlockFromNcfg,
        updateBlockFieldInNcfg,
        addPhaseToBlock,
        deletePhaseFromBlock,
    }), [
        deleteNcfgSection,
        addBlockToNcfg,
        deleteBlockFromNcfg,
        updateBlockFieldInNcfg,
        addPhaseToBlock,
        deletePhaseFromBlock,
    ]);

    const get_ncfg_section = () => {
        return (
            <div className="p-8 max-w-5xl mx-auto font-[Inter] bg-gray-50 min-h-screen">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-6 border-b pb-2">
                    Nested NCFG & Phase Editor
                </h1>

                <div className="space-y-6">
                    {/* Renders the top-level NCFG Types */}
                    {ncfg.map((ncfgType, typeIndex) => (
                        <NcfgTypeRenderer
                            key={typeIndex}
                            ncfgType={ncfgType}
                            typeIndex={typeIndex}
                            deleteNcfgType={deleteNcfgType}
                            addNcfgSection={addNcfgSection}
                            {...managementProps}
                        />
                    ))}
                </div>

                <div className="mt-8 pt-4 border-t">
                    {/* HeroUI Button */}
                    <Button
                        color="primary"
                        onPress={addNcfgType}
                        className="w-full"
                        size="lg"
                    >
                        + Add New NCFG Type
                    </Button>
                </div>

                <div className="mt-10 p-6 bg-gray-100 rounded-xl shadow-inner">
                    <h2 className="text-xl font-semibold mb-2 text-gray-700">Final Configuration State</h2>
                    <pre className="text-xs p-3 bg-white rounded-lg overflow-x-auto border border-gray-300 max-h-96">
                        {JSON.stringify(ncfg, null, 2)}
                    </pre>
                </div>
            </div>
        );
    }

    return {
        ncfg,
        get_ncfg_section: get_ncfg_section
    }
};

export default useNcfg;