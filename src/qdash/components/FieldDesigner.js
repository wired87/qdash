import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Button, Input, Select, SelectItem, Switch, Textarea } from "@heroui/react";
import { Plus, Trash2, Database, Save, X } from "lucide-react";
import { USER_ID_KEY } from "../auth";
import GlobalConnectionSpinner from './GlobalConnectionSpinner';


const FieldDesigner = ({ isOpen, onClose, sendMessage, user }) => {
    const [fields, setFields] = useState([]);
    const [params, setParams] = useState([]);
    const [currentField, setCurrentField] = useState(null);
    const [paramPairs, setParamPairs] = useState([]); // Array of { id, paramId, value }
    const [originalId, setOriginalId] = useState(null); // Track original field ID for edits
    const [linkedFields, setLinkedFields] = useState(new Set());
    const [selectedModuleId, setSelectedModuleId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const userFields = useSelector(state => state.fields.userFields);
    const userModules = useSelector(state => state.modules.userModules);

    const isConnected = useSelector(state => state.websocket.isConnected);

    // WebSocket Listener
    useEffect(() => {
        const handleMessage = (event) => {
            const msg = event.detail;
            if (!msg) return;

            if (msg.type === "list_field_user" || msg.type === "LIST_USERS_FIELDS") {
                setFields(msg.data?.fields || []);
                setIsLoading(false);
            }

            if (msg.type === "LIST_USERS_PARAMS" || msg.type === "list_param_user") {
                setParams(msg.data?.params || []);
            }
        };

        window.addEventListener('qdash-ws-message', handleMessage);
        return () => window.removeEventListener('qdash-ws-message', handleMessage);
    }, []);

    // Initial Load
    useEffect(() => {
        if (isOpen && sendMessage) {
            setIsLoading(true);
            const userId = localStorage.getItem(USER_ID_KEY);

            sendMessage({
                type: "LIST_USERS_FIELDS",
                auth: { user_id: userId }
            });

            sendMessage({
                type: "LIST_USERS_PARAMS",
                auth: { user_id: userId }
            });

            sendMessage({
                type: "LIST_USERS_MODULES",
                auth: { user_id: userId }
            });
        }
    }, [isOpen, sendMessage]);

    function handleCreateNew() {
        // Auto-generate ID for new field
        const newId = `fld_${Date.now()}`;
        setCurrentField({
            id: newId,
            name: "", // New name field
            description: ""
        });
        setParamPairs([]);
        setLinkedFields(new Set());
        setSelectedModuleId(null);
        setOriginalId(null); // No original ID for new fields
    }

    function handleSelectField(field) {
        if (typeof field === 'string') {
            setCurrentField({ id: field, name: field, description: "" });
            setParamPairs([]);
            setLinkedFields(new Set());
            setSelectedModuleId(null);
            setOriginalId(field); // Capture original ID
        } else {
            const fieldId = field.id;
            setCurrentField({
                id: fieldId,
                name: field.name || fieldId, // Use name if available, else fallback to ID
                description: field.comment || field.description || ""
            });

            // Extract linked fields
            if (field.linked_fields && Array.isArray(field.linked_fields)) {
                setLinkedFields(new Set(field.linked_fields));
            } else {
                setLinkedFields(new Set());
            }

            // Extract param pairs from field.params
            const pairs = [];
            if (field.params && typeof field.params === 'object') {
                Object.entries(field.params).forEach(([paramId, value]) => {
                    pairs.push({
                        id: Math.random().toString(36).substr(2, 9),
                        paramId,
                        value
                    });
                });
            }
            setParamPairs(pairs);
            setOriginalId(fieldId); // Capture original ID
        }
    }

    function handleDeleteField(fieldId, e) {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }
        if (window.confirm("Delete this field?")) {
            const userId = localStorage.getItem(USER_ID_KEY);
            sendMessage({
                type: "DEL_FIELD",
                auth: { field_id: fieldId, user_id: userId }
            });
            setFields(prev => prev.filter(f => (typeof f === 'string' ? f : f.id) !== fieldId));
            if (currentField?.id === fieldId) setCurrentField(null);
        }
    }

    function handleAddParamPair() {
        setParamPairs([...paramPairs, {
            id: Math.random().toString(36).substr(2, 9),
            paramId: null,
            value: null
        }]);
    }

    function handleRemoveParamPair(pairId) {
        setParamPairs(pairs => pairs.filter(p => p.id !== pairId));
    }

    function handleParamSelect(pairId, paramId) {
        setParamPairs(pairs => pairs.map(p => {
            if (p.id === pairId) {
                // Initialize value based on param type
                const selectedParam = params.find(param => (typeof param === 'string' ? param : param.id) === paramId);
                let defaultValue = null;

                if (selectedParam && typeof selectedParam === 'object') {
                    const type = selectedParam.type;
                    if (type === 'int') defaultValue = 0;
                    else if (type === 'float') defaultValue = 0.0;
                    else if (type === 'bool') defaultValue = false;
                    else if (type === 'list') defaultValue = ""; // Shape specification
                    else if (type === 'complex') defaultValue = ""; // Shape specification
                    else if (type === 'complex_list') defaultValue = ""; // Shape specification
                }

                return { ...p, paramId, value: defaultValue };
            }
            return p;
        }));
    }

    function handleValueChange(pairId, newValue) {
        setParamPairs(pairs => pairs.map(p =>
            p.id === pairId ? { ...p, value: newValue } : p
        ));
    }

    function handleSave() {
        if (!currentField) return;
        const userId = localStorage.getItem(USER_ID_KEY);

        const finalId = currentField.id?.trim() ||
            `fld_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Build separate keys and values arrays
        const keys = [];
        const values = [];

        paramPairs.forEach(pair => {
            if (pair.paramId) {
                keys.push(pair.paramId);
                values.push(pair.value);
            }
        });

        const fieldData = {
            id: finalId,
            name: currentField.name, // Send name
            keys: keys,
            values: values,
            comment: currentField.description || "",
            linked_fields: Array.from(linkedFields),
            user_id: userId
        };

        sendMessage({
            type: "SET_FIELD",
            data: {
                field: fieldData
            },
            auth: {
                field_id: finalId,
                original_id: originalId,
                user_id: userId,
            }
        });
    }

    // Render value input based on param type
    const renderValueInput = (pair) => {
        if (!pair.paramId) return null;

        const selectedParam = params.find(p => (typeof p === 'string' ? p : p.id) === pair.paramId);
        if (!selectedParam || typeof selectedParam === 'string') return null;

        const type = selectedParam.type;
        const value = pair.value;
        const isDisabled = pair.paramId.startsWith('prev');

        if (type === 'bool') {
            return (
                <Switch
                    size="sm"
                    isSelected={!!value}
                    onValueChange={v => handleValueChange(pair.id, v)}
                    isDisabled={isDisabled}
                />
            );
        } else if (type === 'list') {
            return (
                <Input
                    size="sm"
                    placeholder="e.g., 10 or 2,3,4"
                    value={value || ""}
                    onChange={e => handleValueChange(pair.id, e.target.value)}
                    classNames={{ inputWrapper: "bg-white dark:bg-slate-900" }}
                    description={<span className="text-[9px] text-slate-400">Specify shape: single number or comma-separated dimensions</span>}
                    isDisabled={isDisabled}
                />
            );
        } else if (type === 'complex') {
            return (
                <Input
                    size="sm"
                    placeholder="e.g., 2 (default for [Re, Im])"
                    value={value || ""}
                    onChange={e => handleValueChange(pair.id, e.target.value)}
                    classNames={{ inputWrapper: "bg-white dark:bg-slate-900" }}
                    description={<span className="text-[9px] text-slate-400">Specify dimensions (typically 2 for real and imaginary)</span>}
                    isDisabled={isDisabled}
                />
            );
        } else if (type === 'complex_list') {
            return (
                <Input
                    size="sm"
                    placeholder="e.g., 5 (for 5 complex numbers)"
                    value={value || ""}
                    onChange={e => handleValueChange(pair.id, e.target.value)}
                    classNames={{ inputWrapper: "bg-white dark:bg-slate-900" }}
                    description={<span className="text-[9px] text-slate-400">Specify array length for complex numbers</span>}
                    isDisabled={isDisabled}
                />
            );
        } else {
            // Default: int, float
            const inputType = (type === 'int' || type === 'float') ? 'number' : 'text';
            const step = type === 'float' ? '0.01' : '1';
            return (
                <Input
                    size="sm"
                    type={inputType}
                    step={step}
                    value={value ?? ''}
                    onChange={e => handleValueChange(pair.id, inputType === 'number' ? parseFloat(e.target.value) : e.target.value)}
                    classNames={{ inputWrapper: "bg-white dark:bg-slate-900 shadow-sm" }}
                    isDisabled={isDisabled}
                />
            );
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 h-[85vh] bg-white dark:bg-slate-900 shadow-2xl rounded-t-3xl z-[100] flex flex-col border-t border-slate-200 dark:border-slate-800 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-t-3xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                        <Database size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Field Manager</h2>
                        <p className="text-xs text-slate-500">Define data fields with parameter templates</p>
                    </div>
                </div>
                <Button isIconOnly variant="light" onPress={onClose}>
                    <X size={24} />
                </Button>
            </div>

            {/* Split View */}
            <div className="flex flex-1 overflow-hidden relative">
                <GlobalConnectionSpinner inline={true} />

                {/* LEFT SIDE (30%) */}
                <div className="w-[30%] border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="h-[20%] p-4 flex items-center justify-center border-b border-slate-200 dark:border-slate-800">
                        <Button
                            color="success"
                            className="w-full h-full font-bold text-lg shadow-lg text-white"
                            startContent={<Plus size={24} />}
                            onPress={handleCreateNew}
                        >
                            New Field
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 relative">
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-500">Loading Fields...</div>
                        ) : fields.map(field => {
                            const fieldId = typeof field === 'string' ? field : field.id;
                            return (
                                <div
                                    key={fieldId}
                                    onClick={() => handleSelectField(field)}
                                    className={`p-3 mb-2 rounded-xl border cursor-pointer group transition-all flex items-center justify-between
                                        ${currentField?.id === fieldId
                                            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <Database size={16} className="text-slate-400 group-hover:text-emerald-500" />
                                        <span className="font-mono text-sm truncate">{fieldId}</span>
                                    </div>
                                    <Button
                                        isIconOnly
                                        size="sm"
                                        color="danger"
                                        variant="light"
                                        className="opacity-0 group-hover:opacity-100"
                                        onPress={(e) => handleDeleteField(fieldId, e)}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT SIDE (70%) */}
                <div className="w-[70%] flex flex-col bg-white dark:bg-slate-900">
                    <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
                        {currentField ? (
                            <>
                                <div className="space-y-2 hidden">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Field ID</label>
                                    <Input
                                        placeholder="Enter Field ID (auto-generated if empty)"
                                        value={currentField.id || ''}
                                        onChange={(e) => setCurrentField({ ...currentField, id: e.target.value })}
                                        isDisabled={true}
                                        variant="bordered"
                                        classNames={{ inputWrapper: "bg-slate-50 dark:bg-slate-800" }}
                                    />
                                </div>

                                {/* Field Name */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Field Name</label>
                                    <Input
                                        placeholder="Enter Field Name"
                                        value={currentField.name || ''}
                                        onChange={(e) => setCurrentField({ ...currentField, name: e.target.value })}
                                        variant="bordered"
                                        classNames={{ inputWrapper: "bg-slate-50 dark:bg-slate-800" }}
                                    />
                                </div>

                                {/* Description Input */}
                                {/* Description Input */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                                    <Textarea
                                        placeholder="Describe this field's purpose..."
                                        value={currentField.description || ''}
                                        onValueChange={(val) => setCurrentField({ ...currentField, description: val })}
                                        minRows={2}
                                        variant="bordered"
                                        classNames={{ input: "bg-slate-50 dark:bg-slate-800" }}
                                    />
                                </div>

                                {/* Linked Fields Dropdown */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Linked Fields</label>
                                    <Select
                                        selectionMode="multiple"
                                        placeholder="Select fields to link"
                                        selectedKeys={linkedFields}
                                        onSelectionChange={setLinkedFields}
                                        className="max-w-full"
                                        variant="bordered"
                                        classNames={{ trigger: "bg-slate-50 dark:bg-slate-800" }}
                                    >
                                        {userFields
                                            .filter(f => (typeof f === 'string' ? f : f.id) !== currentField.id) // Exclude self
                                            .map(field => {
                                                const fId = typeof field === 'string' ? field : field.id;
                                                const fParams = typeof field === 'object' && field.params ? Object.keys(field.params).join(', ') : 'No parameters';

                                                return (
                                                    <SelectItem key={fId} value={fId} textValue={fId}>
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-semibold text-small">{fId}</span>
                                                            <span className="text-tiny text-slate-400">Params: {fParams}</span>
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                    </Select>
                                </div>


                                {/* Parameter Pairs */}
                                <div className="flex-1 space-y-4 flex flex-col">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parameter Templates</label>
                                        <Button size="sm" color="primary" variant="flat" startContent={<Plus size={16} />} onPress={handleAddParamPair}>
                                            Add Parameter
                                        </Button>
                                    </div>

                                    <div className="space-y-3 overflow-y-auto pr-2 pb-4">
                                        {paramPairs.length === 0 && (
                                            <div className="text-center p-4 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                                No parameters added
                                            </div>
                                        )}

                                        {paramPairs.map((pair) => {
                                            const selectedParam = params.find(p => (typeof p === 'string' ? p : p.id) === pair.paramId);
                                            const paramType = selectedParam && typeof selectedParam === 'object' ? selectedParam.type : '';

                                            return (
                                                <div key={pair.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                                    <div className="flex gap-2 items-start mb-3">
                                                        {/* Parameter Dropdown */}
                                                        <div className="flex-1">
                                                            <Select
                                                                size="sm"
                                                                placeholder="Select parameter"
                                                                selectedKeys={pair.paramId ? [pair.paramId] : []}
                                                                onChange={(e) => handleParamSelect(pair.id, e.target.value)}
                                                                variant="bordered"
                                                                classNames={{ trigger: "bg-white dark:bg-slate-900" }}
                                                            >
                                                                {params.map(param => {
                                                                    const paramId = typeof param === 'string' ? param : param.id;
                                                                    const paramData = typeof param === 'object' ? param : null;
                                                                    const type = paramData?.type || 'unknown';

                                                                    return (
                                                                        <SelectItem key={paramId} value={paramId} textValue={`${paramId} (${type})`}>
                                                                            <div className="flex flex-col">
                                                                                <span className="font-semibold">{paramId}</span>
                                                                                <span className="text-xs text-slate-500">{type}</span>
                                                                            </div>
                                                                        </SelectItem>
                                                                    );
                                                                })}
                                                            </Select>
                                                        </div>

                                                        <Button
                                                            isIconOnly
                                                            size="sm"
                                                            color="danger"
                                                            variant="light"
                                                            onPress={() => handleRemoveParamPair(pair.id)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </div>

                                                    {/* Value Input */}
                                                    {pair.paramId && (
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                                                Value {paramType && <span className="text-slate-400">({paramType})</span>}
                                                            </label>
                                                            {renderValueInput(pair)}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Live Preview */}
                                <div className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        Live Field Preview
                                    </label>
                                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 relative">
                                        <div className="absolute top-0 right-0 p-2 bg-slate-900/50 backdrop-blur-sm rounded-bl-xl text-xs text-slate-400">
                                            Read Only
                                        </div>
                                        <pre className="p-4 text-xs font-mono text-emerald-400 leading-relaxed overflow-x-auto">
                                            {(() => {
                                                const keys = [];
                                                const values = [];

                                                paramPairs.forEach(pair => {
                                                    if (pair.paramId) {
                                                        keys.push(pair.paramId);
                                                        values.push(pair.value);
                                                    }
                                                });

                                                const fieldObj = {
                                                    id: currentField.id || "auto_generated",
                                                    keys: keys,
                                                    values: values,
                                                    linked_fields: Array.from(linkedFields),
                                                    comment: currentField.description
                                                };
                                                return JSON.stringify(fieldObj, null, 2);
                                            })()}
                                        </pre>
                                    </div>
                                </div>

                                {/* Submit Actions */}
                                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                                    <Button
                                        color="primary"
                                        size="lg"
                                        className="font-bold shadow-lg shadow-emerald-500/20 bg-emerald-600"
                                        startContent={<Save size={20} />}
                                        onPress={handleSave}
                                        isDisabled={paramPairs.length === 0 || paramPairs.some(p => !p.paramId)}
                                    >
                                        Save Field
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                <Database size={64} strokeWidth={1} className="mb-4" />
                                <p className="text-lg font-medium">No Field Selected</p>
                                <p className="text-sm">Select a field from the left or create new</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style jsx>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
            `}</style>
        </div >
    );
};

export default FieldDesigner;
