import { Check, ChevronDown } from "lucide-react";
import React, { useState } from "react";

const ParticleChoice = ({
    fieldOptions = [],
    updateIsDropdownOpen,
    isDropdownOpen,
    updateSelectedTools
}) => {
    // State to manage selected particles
    const [selectedTools, setSelectedTools] = useState([]);

    // Method to toggle selection of an item
    const handleItemToggle = (tool) => {
        const newTools = selectedTools.includes(tool)
            ? selectedTools.filter(t => t !== tool)
            : [...selectedTools, tool];
        setSelectedTools(newTools);
        if (updateSelectedTools) {
            updateSelectedTools(newTools);
        }
    };

    return (
        <div
            style={{
                position: 'relative',
                maxWidth: '300px',
                fontFamily: 'sans-serif'
            }}
        >
            {/* Dropdown Toggle Button */}
            <button
                onClick={() => updateIsDropdownOpen()}
                style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: '#374151',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                {selectedTools.length > 0 ? `${selectedTools.length} Particle(s) Selected` : 'Select Particles...'}
                <ChevronDown
                    style={{
                        width: '1.25rem',
                        height: '1.25rem',
                        transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                    }}
                />
            </button>

            {/* Dropdown Content */}
            {isDropdownOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        width: '100%',
                        marginTop: '0.25rem',
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        zIndex: 10,
                        maxHeight: '200px',
                        overflowY: 'auto',
                    }}
                >
                    {fieldOptions.map((tool) => {
                        const isSelected = selectedTools.includes(tool);
                        return (
                            <div
                                key={tool}
                                onClick={() => handleItemToggle(tool)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: isSelected ? '#ecfdf5' : 'white',
                                    color: isSelected ? '#065f46' : '#374151',
                                    fontWeight: isSelected ? '600' : '400',
                                    borderBottom: '1px solid #f3f4f6',
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = isSelected ? '#d1fae5' : '#f9fafb')}
                                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = isSelected ? '#ecfdf5' : 'white')}
                            >
                                {tool}
                                {isSelected && <Check style={{ width: '1rem', height: '1rem', color: '#059669' }} />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ParticleChoice;