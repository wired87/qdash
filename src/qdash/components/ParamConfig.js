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
        setCurrentParam({
            id: "",
            type: "int",
            description: "",
            is_constant: false
        });
        setOriginalId(null);
    }

    function handleSelectParam(param) {
        if (typeof param === 'string') {
            setCurrentParam({ id: param, type: "int", description: "" });
            setOriginalId(param);
        } else {
            setCurrentParam({
                id: param.id,
                type: param.type || "int",
                description: param.description || "",
                is_constant: !!param.is_constant
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

        // Generate param ID if empty
        const finalId = currentParam.id?.trim() ||
            `param_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const paramData = {
            id: finalId,
            type: currentParam.type,
            description: currentParam.description || "",
            is_constant: currentParam.is_constant,
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
                <Button isIconOnly variant="light" onPress={onClose}>
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
                                {/* Param ID Input */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Parameter ID</label>
                                    <Input
                                        placeholder="Enter Parameter ID (auto-generated if empty)"
                                        value={currentParam.id || ''}
                                        onChange={(e) => setCurrentParam({ ...currentParam, id: e.target.value })}
                                        isDisabled={originalId !== null}
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
                                        onChange={(e) => setCurrentParam({ ...currentParam, type: e.target.value })}
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

                                {/* Constant Toggle */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Constant Parameter</span>
                                            <span className="text-xs text-slate-500">Enable to make this parameter immutable during runtime</span>
                                        </div>
                                        <Switch
                                            isSelected={currentParam.is_constant}
                                            onValueChange={(val) => setCurrentParam({ ...currentParam, is_constant: val })}
                                            color="secondary"
                                        />
                                    </div>
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
                                                type: currentParam.type,
                                                is_constant: currentParam.is_constant,
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
            `}</style>
        </div>
    );
};

export default ParamConfig;
