import React, { useState, useEffect } from 'react';
import { Button, Input, Select, SelectItem, Textarea } from "@heroui/react";
import { Plus, Trash2, Box, Save, X, Grip, Layers } from "lucide-react";
import { USER_ID_KEY } from "../auth";
import GlobalConnectionSpinner from './GlobalConnectionSpinner';

const ModuleDesigner = ({ isOpen, onClose, sendMessage, user, embedded = false }) => {
    const [modules, setModules] = useState([]);
    const [methods, setMethods] = useState([]);
    const [fields, setFields] = useState([]);
    const [currentModule, setCurrentModule] = useState(null);
    const [originalId, setOriginalId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [paramWarning, setParamWarning] = useState(null);

    // WebSocket Listener
    useEffect(() => {
        const handleMessage = (event) => {
            const msg = event.detail;
            if (!msg) return;

            if (msg.type === "LIST_USERS_MODULES") {
                setModules(msg.data?.modules || []);
                setIsLoading(false);
            } else if (msg.type === "GET_USERS_METHODS" || msg.type === "LIST_USERS_METHODS") {
                setMethods(msg.data?.methods || []);
            } else if (msg.type === "LIST_USERS_FIELDS" || msg.type === "list_field_user") {
                setFields(msg.data?.fields || []);
            }
        };

        window.addEventListener('qdash-ws-message', handleMessage);
        return () => window.removeEventListener('qdash-ws-message', handleMessage);
    }, []);

    // Initial Load (when modal opens or when embedded in env cfg)
    useEffect(() => {
        if ((isOpen || embedded) && sendMessage) {
            setIsLoading(true);
            const userId = localStorage.getItem(USER_ID_KEY);
            sendMessage({
                type: "LIST_USERS_MODULES",
                auth: { user_id: userId }
            });
            sendMessage({
                type: "GET_USERS_METHODS",
                auth: { user_id: userId }
            });
            sendMessage({
                type: "LIST_USERS_FIELDS",
                auth: { user_id: userId }
            });
        }
    }, [isOpen, embedded, sendMessage]);

    // Auto-merge params from selected methods and fields with suggestions
    useEffect(() => {
        if (!currentModule) return;

        // Collect params from methods into method_param_map
        const methodParamMap = [];
        (currentModule.methods || []).forEach(methodId => {
            const methodData = methods.find(m => (typeof m === 'string' ? m : m.id) === methodId);
            if (methodData && methodData.params && Array.isArray(methodData.params)) {
                methodData.params.forEach(param => {
                    if (typeof param === 'string' && !methodParamMap.includes(param)) {
                        methodParamMap.push(param);
                    }
                });
            }
        });

        // Collect keys from fields into field_keys_map
        const fieldKeysMap = [];
        (currentModule.fields || []).forEach(fieldId => {
            const fieldData = fields.find(f => (typeof f === 'string' ? f : f.id) === fieldId);
            if (fieldData && fieldData.keys && Array.isArray(fieldData.keys)) {
                fieldData.keys.forEach(key => {
                    if (!fieldKeysMap.includes(key)) {
                        fieldKeysMap.push(key);
                    }
                });
            }
        });

        // Identify missing parameters in fields
        const missingInFields = methodParamMap.filter(p => !fieldKeysMap.includes(p));

        // Find field suggestions for missing parameters
        const fieldSuggestions = {};
        if (missingInFields.length > 0) {
            missingInFields.forEach(missingParam => {
                const suggestedFields = fields.filter(field => {
                    if (typeof field === 'string') return false;
                    if (!field.keys || !Array.isArray(field.keys)) return false;
                    return field.keys.includes(missingParam);
                }).map(f => f.id);

                if (suggestedFields.length > 0) {
                    fieldSuggestions[missingParam] = suggestedFields;
                }
            });
        }

        // Identify unused parameters in fields
        const unusedInMethods = fieldKeysMap.filter(p => !methodParamMap.includes(p));

        // Build warning message
        if (missingInFields.length > 0 || unusedInMethods.length > 0) {
            let warning = [];
            if (missingInFields.length > 0) {
                const paramsWithSuggestions = missingInFields.map(param => {
                    if (fieldSuggestions[param]) {
                        return `${param} (try: ${fieldSuggestions[param].slice(0, 2).join(', ')})`;
                    }
                    return param;
                });
                warning.push(`⚠️ Methods need: ${paramsWithSuggestions.join(', ')}`);
            }
            if (unusedInMethods.length > 0) {
                warning.push(`ℹ️ Unused in methods: ${unusedInMethods.join(', ')}`);
            }
            setParamWarning(warning.join(' | '));
        } else {
            setParamWarning(null);
        }

        // Only update if changed
        const currentMethodParamMap = currentModule.method_param_map || [];
        const currentFieldKeysMap = currentModule.field_keys_map || [];
        const methodMapChanged = JSON.stringify(currentMethodParamMap.sort()) !== JSON.stringify(methodParamMap.sort());
        const fieldMapChanged = JSON.stringify(currentFieldKeysMap.sort()) !== JSON.stringify(fieldKeysMap.sort());

        if (methodMapChanged || fieldMapChanged) {
            setCurrentModule(prev => ({
                ...prev,
                method_param_map: methodParamMap,
                field_keys_map: fieldKeysMap,
                // Keep legacy params for backward compatibility
                params: methodParamMap,
                module_field_params: fieldKeysMap
            }));
        }
    }, [currentModule?.methods, currentModule?.fields, methods, fields]);

    function handleCreateNew() {
        // Auto-generate ID for new module
        const newId = `module_${Date.now()}`;
        setCurrentModule({
            id: newId,
            name: "", // New name field
            description: "",
            methods: [],
            fields: []
        });
        setOriginalId(null);
        setParamWarning(null);
    }

    function handleSelectModule(mod) {
        if (typeof mod === 'string') {
            setCurrentModule({ id: mod, name: mod, description: "", methods: [], fields: [] });
            setOriginalId(mod);
        } else {
            // Normalize methods to be an array of strings (IDs)
            let methodsArray = [];
            if (Array.isArray(mod.methods)) {
                methodsArray = mod.methods;
            } else if (mod.methods && typeof mod.methods === 'object') {
                methodsArray = Object.keys(mod.methods);
            }

            // Normalize fields as well, just in case
            let fieldsArray = [];
            if (Array.isArray(mod.fields)) {
                fieldsArray = mod.fields;
            } else if (mod.fields && typeof mod.fields === 'object') {
                fieldsArray = Object.keys(mod.fields);
            }

            setCurrentModule({
                id: mod.id,
                name: mod.name || mod.id,
                description: mod.description || "",
                methods: methodsArray,
                fields: fieldsArray
            });
            setOriginalId(mod.id);
        }
        setParamWarning(null);
    }

    function handleDeleteModule(moduleId, e) {
        e.stopPropagation();
        if (window.confirm("Delete this module?")) {
            const userId = localStorage.getItem(USER_ID_KEY);
            sendMessage({
                type: "DEL_MODULE",
                auth: { module_id: moduleId, user_id: userId }
            });
            // Optimistic update
            setModules(prev => prev.filter(m => (typeof m === 'string' ? m : m.id) !== moduleId));
            if (currentModule?.id === moduleId) setCurrentModule(null);
        }
    }

    function handleSave() {
        if (!currentModule) {
            alert("No module selected.");
            return;
        }
        // Ensure ID exists (auto-generate if somehow missing)
        if (!currentModule.id) {
            currentModule.id = `module_${Date.now()}`;
        }
        const userId = localStorage.getItem(USER_ID_KEY);

        // Prepare params as JSON strings
        const paramsJson = JSON.stringify(currentModule.params || []);
        const fieldParamsJson = JSON.stringify(currentModule.module_field_params || []);
        const methodParamMapJson = JSON.stringify(currentModule.method_param_map || []);
        const fieldKeysMapJson = JSON.stringify(currentModule.field_keys_map || []);

        sendMessage({
            type: "SET_MODULE",
            data: {
                id: currentModule.id,
                name: currentModule.name, // Send name
                description: currentModule.description,
                methods: currentModule.methods,
                fields: currentModule.fields,
                params: paramsJson,
                module_field_params: fieldParamsJson,
                method_param_map: methodParamMapJson,
                field_keys_map: fieldKeysMapJson
            },
            auth: {
                module_id: currentModule.id,
                user_id: userId
            }
        });
    }

    if (!embedded && !isOpen) return null;

    const innerContent = (
            <div className="flex flex-1 overflow-hidden relative md:flex-row flex-col min-h-0">
                <GlobalConnectionSpinner inline={true} />

                {/* LEFT SIDE (30%) */}
                <div className="w-full md:w-[30%] border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="h-[20%] p-4 flex items-center justify-center border-b border-slate-200 dark:border-slate-800">
                        <Button
                            color="primary"
                            className="w-full h-full font-bold text-lg shadow-lg"
                            startContent={<Plus size={24} />}
                            onPress={handleCreateNew}
                        >
                            New Module
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 relative">
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-500">Loading Modules...</div>
                        ) : modules.map(mod => {
                            const modId = typeof mod === 'string' ? mod : mod.id;
                            return (
                                <div
                                    key={modId}
                                    onClick={() => handleSelectModule(mod)}
                                    className={`p-3 mb-2 rounded-xl border cursor-pointer group transition-all flex items-center justify-between
                                    ${currentModule?.id === modId
                                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <Box size={16} className="text-slate-400 group-hover:text-blue-500" />
                                        <span className="font-mono text-sm truncate">{modId}</span>
                                    </div>
                                    <Button
                                        aria-label="Delete module"
                                        isIconOnly
                                        size="sm"
                                        color="danger"
                                        variant="light"
                                        className="opacity-0 group-hover:opacity-100"
                                        onPress={(e) => handleDeleteModule(modId, e)}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT SIDE (70%) */}
                <div className="w-full md:w-[70%] flex flex-col bg-white dark:bg-slate-900">
                    <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
                        {currentModule ? (
                            <>
                                {/* Module ID - Hidden */}
                                <div className="space-y-2 hidden">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Module ID</label>
                                    <Input
                                        placeholder="Enter Module ID"
                                        value={currentModule.id || ''}
                                        onChange={(e) => setCurrentModule({ ...currentModule, id: e.target.value })}
                                        isDisabled={true}
                                        variant="bordered"
                                        classNames={{ inputWrapper: "bg-slate-50 dark:bg-slate-800" }}
                                    />
                                </div>

                                {/* Module Name */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Module Name</label>
                                    <Input
                                        placeholder="Enter Module Name"
                                        value={currentModule.name || ''}
                                        onChange={(e) => setCurrentModule({ ...currentModule, name: e.target.value })}
                                        variant="bordered"
                                        classNames={{ inputWrapper: "bg-slate-50 dark:bg-slate-800" }}
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                                    <Textarea
                                        placeholder="Describe what this module does..."
                                        value={currentModule.description || ''}
                                        onValueChange={(val) => setCurrentModule({ ...currentModule, description: val })}
                                        minRows={2}
                                        variant="bordered"
                                        classNames={{ input: "bg-slate-50 dark:bg-slate-800" }}
                                    />
                                </div>

                                {/* Method Selector */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Included Methods</label>
                                    <Select
                                        selectionMode="multiple"
                                        placeholder="Select methods to include"
                                        selectedKeys={new Set(currentModule.methods || [])}
                                        onSelectionChange={(keys) => setCurrentModule({ ...currentModule, methods: Array.from(keys) })}
                                        className="max-w-full"
                                        variant="bordered"
                                        classNames={{ trigger: "bg-slate-50 dark:bg-slate-800" }}
                                    >
                                        {methods.map(method => {
                                            const mId = typeof method === 'string' ? method : method.id;
                                            return (
                                                <SelectItem key={mId} value={mId} textValue={mId}>
                                                    {mId}
                                                </SelectItem>
                                            );
                                        })}
                                    </Select>

                                    {/* Removable Selected Items List */}
                                    <div className="flex flex-col gap-2 mt-2">

                                        {(currentModule.methods || []).map(methodId => {
                                            const methodData = methods.find(m => (typeof m === 'string' ? m : m.id) === methodId);
                                            // Fallback if method details not found (e.g. deleted or ID-only)
                                            const paramsCount = methodData?.params?.length || 0;
                                            const createdAt = methodData?.created_at ? new Date(methodData.created_at).toLocaleDateString() : 'N/A';

                                            return (
                                                <div key={methodId} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 animate-fadeIn">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <Layers size={14} className="text-blue-500" />
                                                            <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">{methodId}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[10px] text-slate-500 uppercase tracking-wide">
                                                            <span>{paramsCount} Params</span>
                                                            <span>•</span>
                                                            <span>Created: {createdAt}</span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        aria-label="Remove method from module"
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        color="danger"
                                                        onPress={() => {
                                                            const newMethods = currentModule.methods.filter(id => id !== methodId);
                                                            setCurrentModule({ ...currentModule, methods: newMethods });
                                                        }}
                                                    >
                                                        <X size={16} />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                        {(!currentModule.methods || currentModule.methods.length === 0) && (
                                            <div className="text-center p-4 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                                No methods selected
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Fields Selector */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Included Fields</label>
                                    <Select
                                        selectionMode="multiple"
                                        placeholder="Select fields to include"
                                        selectedKeys={new Set(currentModule.fields || [])}
                                        onSelectionChange={(keys) => setCurrentModule({ ...currentModule, fields: Array.from(keys) })}
                                        className="max-w-full"
                                        variant="bordered"
                                        classNames={{ trigger: "bg-slate-50 dark:bg-slate-800" }}
                                    >
                                        {fields.map(field => {
                                            const fId = typeof field === 'string' ? field : field.id;
                                            const fParamsCount = typeof field === 'object' && field.params ? Object.keys(field.params).length : 0;
                                            return (
                                                <SelectItem key={fId} value={fId} textValue={fId}>
                                                    <div className="flex items-center justify-between">
                                                        <span>{fId}</span>
                                                        <span className="text-xs text-slate-400">{fParamsCount} params</span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </Select>

                                    {/* Selected Fields List */}
                                    <div className="flex flex-col gap-2 mt-2">
                                        {(currentModule.fields || []).map(fieldId => {
                                            const fieldData = fields.find(f => (typeof f === 'string' ? f : f.id) === fieldId);
                                            const paramsCount = fieldData?.params ? Object.keys(fieldData.params).length : 0;

                                            return (
                                                <div key={fieldId} className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 animate-fadeIn">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <Grip size={14} className="text-emerald-500" />
                                                            <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-300">{fieldId}</span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                                                            {paramsCount} Parameters
                                                        </div>
                                                    </div>
                                                    <Button
                                                        aria-label="Remove field from module"
                                                        isIconOnly
                                                        size="sm"
                                                        variant="light"
                                                        color="danger"
                                                        onPress={() => {
                                                            const newFields = currentModule.fields.filter(id => id !== fieldId);
                                                            setCurrentModule({ ...currentModule, fields: newFields });
                                                        }}
                                                    >
                                                        <X size={16} />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                        {(!currentModule.fields || currentModule.fields.length === 0) && (
                                            <div className="text-center p-4 text-slate-400 text-sm border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                                                No fields selected
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Parameter Warning */}
                                {paramWarning && (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                        <div className="flex items-start gap-2">
                                            <span className="text-amber-600 dark:text-amber-400 text-lg">⚠️</span>
                                            <div>
                                                <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide mb-1">Parameter Mismatch</p>
                                                <p className="text-xs text-amber-700 dark:text-amber-400">{paramWarning}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Method Parameter Map Display */}
                                {currentModule.method_param_map && currentModule.method_param_map.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Method Param Map</label>
                                            <span className="text-[10px] text-slate-400">Required by methods</span>
                                        </div>
                                        <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
                                            <div className="flex flex-wrap gap-1.5">
                                                {currentModule.method_param_map.map((param, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-mono border border-blue-200 dark:border-blue-800"
                                                    >
                                                        {param}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Field Keys Map Display */}
                                {currentModule.field_keys_map && currentModule.field_keys_map.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Field Keys Map</label>
                                            <span className="text-[10px] text-slate-400">Provided by fields</span>
                                        </div>
                                        <div className="p-3 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50">
                                            <div className="flex flex-wrap gap-1.5">
                                                {currentModule.field_keys_map.map((param, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded text-xs font-mono border border-emerald-200 dark:border-emerald-800"
                                                    >
                                                        {param}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Submit Actions */}
                                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                                    <Button
                                        color="primary"
                                        size="lg"
                                        className="font-bold shadow-lg shadow-blue-500/20"
                                        startContent={<Save size={20} />}
                                        onPress={handleSave}
                                    >
                                        Save Module
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                <Box size={64} strokeWidth={1} className="mb-4" />
                                <p className="text-lg font-medium">No Module Selected</p>
                                <p className="text-sm">Select a module from the left or create new</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
    );

    if (embedded) {
        return (
            <div className="h-full min-h-0 flex flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                {innerContent}
            </div>
        );
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 h-[85vh] bg-white dark:bg-slate-900 shadow-2xl rounded-t-3xl z-[100] flex flex-col border-t border-slate-200 dark:border-slate-800 animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-t-3xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                        <Box size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Module Manager</h2>
                        <p className="text-xs text-slate-500">Group methods into reusable modules</p>
                    </div>
                </div>
                <Button aria-label="Close modal" isIconOnly variant="light" onPress={onClose}>
                    <X size={24} />
                </Button>
            </div>
            {innerContent}
            <style>{`
                @keyframes slide-up {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ModuleDesigner;