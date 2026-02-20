import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Select, SelectItem } from '@heroui/react';
import { Check, X } from 'lucide-react';
import { useSelector } from 'react-redux';
import InjectionLivePreview from './InjectionLivePreview';
import { USER_ID_KEY } from '../auth';

const InjectionSelectorModal = ({ isOpen, onClose, nodePosition, onConfirm, sendMessage, fieldOptions }) => {
    const [injections, setInjections] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedInjection, setSelectedInjection] = useState(null);
    const [selectedField, setSelectedField] = useState('');

    // Request injections and fields when modal opens
    useEffect(() => {
        if (isOpen && sendMessage) {
            setIsLoading(true);
            const userId = localStorage.getItem(USER_ID_KEY);
            sendMessage({ type: "GET_INJ_USER", auth: { user_id: userId }, timestamp: new Date().toISOString() });
            sendMessage({ type: "LIST_USERS_FIELDS", auth: { user_id: userId }, timestamp: new Date().toISOString() });
        }
    }, [isOpen, sendMessage]);

    const { userInjections } = useSelector(state => state.injections);
    const userFields = useSelector(state => state.fields.userFields) || [];
    const fieldOpts = fieldOptions ?? userFields.map(f => typeof f === 'string' ? f : (f?.id ?? f?.name ?? '')).filter(Boolean);

    // Sync from Redux
    useEffect(() => {
        if (userInjections) {
            console.log("📋 Received injections for selector:", userInjections);
            setInjections(userInjections || []);
            setIsLoading(false);
        }
    }, [userInjections]);

    const handleInjectionClick = (injection) => {
        setSelectedInjection(injection);
    };

    const handleConfirm = () => {
        if (!selectedInjection || !selectedField) {
            alert('Please select both an injection and a field');
            return;
        }

        onConfirm({
            position: nodePosition,
            injectionId: selectedInjection.id,
            injection: selectedInjection,
            field: selectedField
        });

        // Reset state
        setSelectedInjection(null);
        setSelectedField('');
        onClose();
    };

    const handleClose = () => {
        setSelectedInjection(null);
        setSelectedField('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="3xl"
            scrollBehavior="inside"
            classNames={{
                base: "max-h-[90vh]",
                wrapper: "z-[60]",
                backdrop: "z-[59]"
            }}
        >
            <ModalContent>
                <ModalHeader className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold">Select Injection Configuration</h2>
                    <p className="text-sm text-slate-500">
                        Node Position: [{nodePosition?.join(', ')}]
                    </p>
                </ModalHeader>

                <ModalBody>
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Left: Injection List */}
                        <div className="flex-1 relative">
                            <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                                Available Injections
                            </h3>

                            {isLoading ? (
                                <div className="p-4 text-center text-slate-500">Loading Injections...</div>
                            ) : injections.length > 0 ? (
                                <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                                    {injections.map((injection) => (
                                        <div
                                            key={injection.id}
                                            onClick={() => handleInjectionClick(injection)}
                                            className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedInjection?.id === injection.id
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                                                        {injection.name || injection.id}
                                                    </p>
                                                    {injection.description && (
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                            {injection.description}
                                                        </p>
                                                    )}
                                                </div>
                                                {selectedInjection?.id === injection.id && (
                                                    <Check size={20} className="text-blue-600" />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <p className="text-sm text-slate-500">No injections available</p>
                                    <p className="text-xs text-slate-400 mt-1">Create one using the Energy Designer</p>
                                </div>
                            )}
                        </div>

                        {/* Right: Live Preview & Field Selection */}
                        <div className="flex-1">
                            {/* Live Preview */}
                            <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                                Live Preview
                            </h3>
                            {selectedInjection ? (
                                <InjectionLivePreview
                                    config={selectedInjection.config}
                                    title={selectedInjection.name || "Selected Injection"}
                                />
                            ) : (
                                <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-8 text-center border border-slate-200 dark:border-slate-700">
                                    <p className="text-sm text-slate-500">Select an injection to preview</p>
                                </div>
                            )}

                            {/* Field Dropdown */}
                            <div className="mt-4">
                                <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                                    Select Field
                                </h3>
                                <Select
                                    label="Field Type"
                                    placeholder="Choose a field"
                                    selectedKeys={selectedField ? [selectedField] : []}
                                    onChange={(e) => setSelectedField(e.target.value)}
                                    classNames={{
                                        base: "max-w-full",
                                        trigger: "bg-white dark:bg-slate-800"
                                    }}
                                >
                                    {fieldOpts.map((field) => (
                                        <SelectItem key={field} value={field}>
                                            {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                        </div>
                    </div>
                </ModalBody>

                <ModalFooter>
                    <Button
                        color="default"
                        variant="light"
                        onPress={handleClose}
                        startContent={<X size={18} />}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        onPress={handleConfirm}
                        isDisabled={!selectedInjection || !selectedField}
                        startContent={<Check size={18} />}
                    >
                        Confirm Selection
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default InjectionSelectorModal;
