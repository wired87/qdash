import React, { useState, useEffect } from 'react';
import { Button, Input, Select, SelectItem, Textarea, Spinner, Switch } from "@heroui/react";
import { Plus, Trash2, Database, Save, X, Loader2 } from "lucide-react";
import { USER_ID_KEY } from "../auth";
import { useSelector } from 'react-redux';
import GlobalConnectionSpinner from './GlobalConnectionSpinner';

const ParamConfig = ({ isOpen, onClose, sendMessage }) => {
    const [params, setParams] = useState([]);
    const [currentParam, setCurrentParam] = useState(null);
    const [originalId, setOriginalId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [deletingParams, setDeletingParams] = useState({});

    const isConnected = useSelector(state => state.websocket.isConnected);

    // Fetch params on open
    useEffect(() => {
        if (isOpen && sendMessage) {
            setIsLoading(true);
            const userId = localStorage.getItem(USER_ID_KEY);
            sendMessage({
                type: "LIST_USERS_PARAMS",
                auth: { user_id: userId }
            });
        }
    }, [isOpen, sendMessage]);

    // Listen for param responses
    useEffect(() => {
        const handleMessage = (event) => {
            const msg = event.detail;
            if (!msg) return;

            if (msg.type === "LIST_USERS_PARAMS" || msg.type === "list_param_user") {
                setParams(msg.data?.params || []);
                setIsLoading(false);
            }
        };

        window.addEventListener('qdash-ws-message', handleMessage);
        return () => window.removeEventListener('qdash-ws-message', handleMessage);
    }, []);

    function handleCreateNew() {
        // Auto-generate ID for new parameter
        const newId = `param_${Date.now()}`;
        setCurrentParam({
            id: newId,
            name: "", // New name field
            type: "int",
            description: "",
            is_constant: false,
            value: "",
            shape: []
        });
        setOriginalId(null);
    }

    function handleSelectParam(param) {
        const baseType = (typeof param === 'string' ? "int" : (param.type || "int"));
        const baseShape = (typeof param === 'string' ? [] : (Array.isArray(param.shape) ? param.shape : []));
        if (typeof param === 'string') {
            setCurrentParam({ id: param, name: param, type: "int", description: "", value: "", shape: [] });
            setOriginalId(param);
        } else {
            setCurrentParam({
                id: param.id,
                name: param.name || param.id,
                type: baseType,
                description: param.description || "",
                is_constant: !!param.is_constant,
                value: param.value || "",
                shape: (baseType === 'int' || baseType === 'float') ? [] : baseShape
            });
            setOriginalId(param.id);
        }
    }

    function handleDeleteParam(paramId, e) {
        if (e && typeof e.stopPropagation === 'function') {
            e.stopPropagation();
        }
        if (window.confirm("Delete this parameter?")) {
            setDeletingParams(prev => ({ ...prev, [paramId]: true }));
            const userId = localStorage.getItem(USER_ID_KEY);
            sendMessage({
                type: "DEL_PARAM",
                auth: { param_id: paramId, user_id: userId }
            });

            // Optimistic update
            setTimeout(() => {
                setParams(prev => prev.filter(p => (typeof p === 'string' ? p : p.id) !== paramId));
                setDeletingParams(prev => {
                    const newState = { ...prev };
                    delete newState[paramId];
                    return newState;
                });
                if (currentParam?.id === paramId) setCurrentParam(null);
            }, 500);
        }
    }

    function handleSave() {
        if (!currentParam) return;
        const userId = localStorage.getItem(USER_ID_KEY);

        // Ensure ID exists
        const finalId = currentParam.id || `param_${Date.now()}`;

        const isScalarType = currentParam.type === 'int' || currentParam.type === 'float';
        const shape = isScalarType ? [] : (Array.isArray(currentParam.shape) ? currentParam.shape : []);

        const paramData = {
            id: finalId,
            name: currentParam.name, // Send name
            type: currentParam.type,
            description: currentParam.description || "",
            is_constant: currentParam.is_constant,
            value: currentParam.is_constant ? currentParam.value : undefined,
            shape,
            user_id: userId
        };

        sendMessage({
            type: "SET_PARAM",
            data: {
                param: paramData
            },
            auth: {
                param_id: finalId,
                user_id: userId
            }
        });

        // Refresh list
        setTimeout(() => {
            sendMessage({
                type: "LIST_USERS_PARAMS",
                auth: { user_id: userId }
            });
        }, 300);
    }

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 h-[85vh] bg-white dark:bg-slate-900 shadow-2xl rounded-t-3xl z-[100] flex flex-col border-t border-slate-200 dark:border-slate-800 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-t-3xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                        <Database size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Parameter Manager</h2>
                        <p className="text-xs text-slate-500">Define parameter types</p>
                    </div>
                </div>
                <Button aria-label="Close modal" isIconOnly variant="light" onPress={onClose}>
                    <X size={24} />
                </Button>
            </div>

            {/* Split View */}
            <div className="flex flex-1 overflow-hidden relative">
                <GlobalConnectionSpinner inline={true} />

                {/* LEFT SIDE (30%) */}
                <div className="w-[30%] border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
                    {/* Top 20% - Add Button */}
                    <div className="h-[20%] p-4 flex items-center justify-center border-b border-slate-200 dark:border-slate-800">
                        <Button
                            color="secondary"
                            className="w-full h-full font-bold text-lg shadow-lg text-white"
                            startContent={<Plus size={24} />}
                            onPress={handleCreateNew}
                        >
                            New Parameter
                        </Button>
                    </div>

                    {/* Bottom 80% - List */}
                    <div className="flex-1 overflow-y-auto p-2 relative">
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-500">Loading Parameters...</div>
                        ) : params.map(param => {
                            const paramId = typeof param === 'string' ? param : param.id;
                            const isDeleting = deletingParams[paramId];
                            return (
                                <div
                                    key={paramId}
                                    onClick={() => !isDeleting && handleSelectParam(param)}
                                    className={`p-3 mb-2 rounded-xl border cursor-pointer group transition-all flex items-center justify-between
                                        ${currentParam?.id === paramId
                                            ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <Database size={16} className="text-slate-400 group-hover:text-purple-500" />
                                        <span className="font-mono text-sm truncate">{paramId}</span>
                                    </div>
                                    {isDeleting ? (
                                        <Loader2 size={16} className="animate-spin text-slate-400" />
                                    ) : (
                                        <Button
                                            aria-label="Delete parameter"
                                            isIconOnly
                                            size="sm"
                                            color="danger"
                                            variant="light"
                                            className="opacity-0 group-hover:opacity-100"
                                            onPress={(e) => handleDeleteParam(paramId, e)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT SIDE (70%) */}
                <div className="w-[70%] flex flex-col bg-white dark:bg-slate-900">
                    <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
                        {currentParam ? (
                            <>
                                {/* Constant Toggle */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Constant Parameter</span>
                                            <span className="text-xs text-slate-500">Enable to make this parameter immutable during runtime</span>
                                        </div>
                                        <Switch
                                            aria-label="Constant parameter"
                                            isSelected={currentParam.is_constant}
                                            onValueChange={(val) => setCurrentParam({ ...currentParam, is_constant: val })}
                                            color="secondary"
                                        />
                                    </div>
                                </div>

                                {/* Conditional Rendering based on is_constant */}
                                {currentParam.is_constant ? (
                                    // Constant: ID, Type, Value, Description
                                    <>
                                        {/* Param ID */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parameter ID</label>
                                            <Input
                                                placeholder="Enter Parameter ID"
                                                value={currentParam.id || ''}
                                                onChange={(e) => setCurrentParam({ ...currentParam, id: e.target.value })}
                                                variant="bordered"
                                                classNames={{ inputWrapper: "bg-slate-50 dark:bg-slate-800" }}
                                            />
                                        </div>

                                        {/* Type Selector */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</label>
                                            <Select
                                                placeholder="Select parameter type"
                                                selectedKeys={[currentParam.type]}
                                                onSelectionChange={(keys) => {
                                                    const t = Array.from(keys)[0] || currentParam.type;
                                                    const isScalar = t === 'int' || t === 'float';
                                                    setCurrentParam({ ...currentParam, type: t, shape: isScalar ? [] : (currentParam.shape || []) });
                                                }}
                                                variant="bordered"
                                                classNames={{ trigger: "bg-slate-50 dark:bg-slate-800" }}
                                            >
                                                <SelectItem key="int" value="int">Integer</SelectItem>
                                                <SelectItem key="float" value="float">Float</SelectItem>
                                                <SelectItem key="bool" value="bool">Boolean</SelectItem>
                                                <SelectItem key="list" value="list">List (Array)</SelectItem>
                                                <SelectItem key="complex" value="complex">Complex</SelectItem>
                                                <SelectItem key="complex_list" value="complex_list">Complex Array</SelectItem>
                                            </Select>
                                        </div>

                                        {/* Shape */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Shape</label>
                                            <Input
                                                placeholder="[]"
                                                value={(currentParam.type === 'int' || currentParam.type === 'float') ? '[]' : (Array.isArray(currentParam.shape) ? currentParam.shape.join(', ') : '')}
                                                onChange={(e) => {
                                                    if (currentParam.type === 'int' || currentParam.type === 'float') return;
                                                    const parsed = e.target.value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
                                                    setCurrentParam({ ...currentParam, shape: parsed });
                                                }}
                                                isDisabled={currentParam.type === 'int' || currentParam.type === 'float'}
                                                variant="bordered"
                                                classNames={{ inputWrapper: "bg-slate-50 dark:bg-slate-800" }}
                                                description={(currentParam.type === 'int' || currentParam.type === 'float') ? "Scalar types use empty shape" : "Comma-separated dims, e.g. 3, 4, 5"}
                                            />
                                        </div>

                                        {/* Constant Value Input */}
                                        <div className="space-y-2 animate-slide-down">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Constant Value</label>
                                            <Input
                                                placeholder="Enter constant value"
                                                value={currentParam.value || ''}
                                                onChange={(e) => setCurrentParam({ ...currentParam, value: e.target.value })}
                                                variant="bordered"
                                                classNames={{ inputWrapper: "bg-slate-50 dark:bg-slate-800" }}
                                            />
                                        </div>

                                        {/* Description Input */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                                            <Textarea
                                                placeholder="Describe this parameter..."
                                                value={currentParam.description || ''}
                                                onValueChange={(val) => setCurrentParam({ ...currentParam, description: val })}
                                                minRows={3}
                                                variant="bordered"
                                                classNames={{ input: "bg-slate-50 dark:bg-slate-800" }}
                                            />
                                        </div>
                                    </>
                                ) : (
                                    // Render Full Config (Name, Description, Type) if NOT constant
                                    <>
                                        {/* Param ID - Hidden */}
                                        <div className="space-y-2 hidden">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parameter ID</label>
                                            <Input
                                                placeholder="Enter Parameter ID"
                                                value={currentParam.id || ''}
                                                onChange={(e) => setCurrentParam({ ...currentParam, id: e.target.value })}
                                                isDisabled={true}
                                                variant="bordered"
                                                classNames={{ inputWrapper: "bg-slate-50 dark:bg-slate-800" }}
                                            />
                                        </div>

                                        {/* Param Name */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parameter Name</label>
                                            <Input
                                                placeholder="Enter Parameter Name"
                                                value={currentParam.name || ''}
                                                onChange={(e) => setCurrentParam({ ...currentParam, name: e.target.value })}
                                                variant="bordered"
                                                classNames={{ inputWrapper: "bg-slate-50 dark:bg-slate-800" }}
                                            />
                                        </div>

                                        {/* Type Selector */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</label>
                                            <Select
                                                placeholder="Select parameter type"
                                                selectedKeys={[currentParam.type]}
                                                onSelectionChange={(keys) => {
                                                    const t = Array.from(keys)[0] || currentParam.type;
                                                    const isScalar = t === 'int' || t === 'float';
                                                    setCurrentParam({ ...currentParam, type: t, shape: isScalar ? [] : (currentParam.shape || []) });
                                                }}
                                                variant="bordered"
                                                classNames={{ trigger: "bg-slate-50 dark:bg-slate-800" }}
                                            >
                                                <SelectItem key="int" value="int">Integer</SelectItem>
                                                <SelectItem key="float" value="float">Float</SelectItem>
                                                <SelectItem key="bool" value="bool">Boolean</SelectItem>
                                                <SelectItem key="list" value="list">List (Array)</SelectItem>
                                                <SelectItem key="complex" value="complex">Complex</SelectItem>
                                                <SelectItem key="complex_list" value="complex_list">Complex Array</SelectItem>
                                            </Select>
                                        </div>

                                        {/* Shape */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Shape</label>
                                            <Input
                                                placeholder="[]"
                                                value={(currentParam.type === 'int' || currentParam.type === 'float') ? '[]' : (Array.isArray(currentParam.shape) ? currentParam.shape.join(', ') : '')}
                                                onChange={(e) => {
                                                    if (currentParam.type === 'int' || currentParam.type === 'float') return;
                                                    const parsed = e.target.value.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
                                                    setCurrentParam({ ...currentParam, shape: parsed });
                                                }}
                                                isDisabled={currentParam.type === 'int' || currentParam.type === 'float'}
                                                variant="bordered"
                                                classNames={{ inputWrapper: "bg-slate-50 dark:bg-slate-800" }}
                                                description={(currentParam.type === 'int' || currentParam.type === 'float') ? "Scalar types use empty shape" : "Comma-separated dims, e.g. 3, 4, 5"}
                                            />
                                        </div>

                                        {/* Description Input */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                                            <Textarea
                                                placeholder="Describe this parameter..."
                                                value={currentParam.description || ''}
                                                onValueChange={(val) => setCurrentParam({ ...currentParam, description: val })}
                                                minRows={3}
                                                variant="bordered"
                                                classNames={{ input: "bg-slate-50 dark:bg-slate-800" }}
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Live Preview */}
                                <div className="flex-1 space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                                        Live Parameter Preview
                                    </label>
                                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 relative">
                                        <div className="absolute top-0 right-0 p-2 bg-slate-900/50 backdrop-blur-sm rounded-bl-xl text-xs text-slate-400">
                                            Read Only
                                        </div>
                                        <pre className="p-4 text-xs font-mono text-purple-400 leading-relaxed overflow-x-auto">
                                            {JSON.stringify({
                                                id: currentParam.id || "auto_generated",
                                                name: currentParam.name,
                                                type: currentParam.type,
                                                shape: (currentParam.type === 'int' || currentParam.type === 'float') ? [] : (Array.isArray(currentParam.shape) ? currentParam.shape : []),
                                                is_constant: currentParam.is_constant,
                                                value: currentParam.is_constant ? currentParam.value : undefined,
                                                description: currentParam.description
                                            }, null, 2)}
                                        </pre>
                                    </div>
                                </div>

                                {/* Submit Actions */}
                                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                                    <Button
                                        color="primary"
                                        size="lg"
                                        className="font-bold shadow-lg shadow-purple-500/20 bg-purple-600"
                                        startContent={<Save size={20} />}
                                        onPress={handleSave}
                                    >
                                        Save Parameter
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                <Database size={64} strokeWidth={1} className="mb-4" />
                                <p className="text-lg font-medium">No Parameter Selected</p>
                                <p className="text-sm">Select a parameter from the left or create new</p>
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
                @keyframes slide-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-down {
                    animation: slide-down 0.2s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default ParamConfig;