import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Input, Select, SelectItem, Switch, Textarea } from "@heroui/react";
import { Plus, Trash2, HelpCircle, FileText, Save, X, ZapOff, Lock } from "lucide-react";
import { USER_ID_KEY, getSessionId } from "../auth";
import GlobalConnectionSpinner from './GlobalConnectionSpinner';
import { setLoading as setMethodLoading } from '../store/slices/methodSlice';


const MethodDesigner = ({ isOpen, onClose, sendMessage, user }) => {
    const dispatch = useDispatch();
    const [currentModule, setCurrentModule] = useState(null);
    const [originalId, setOriginalId] = useState(null);

    const [params, setParams] = useState([]);
    const [equationWarning, setEquationWarning] = useState(null);

    const isConnected = useSelector(state => state.websocket.isConnected);
    const { userMethods, loading: isLoading } = useSelector(state => state.methods);
    const { userParams } = useSelector(state => state.params || { userParams: [] }); // Fallback if slice not ready

    // Get function content string from jax_code, code (array or string), or equation
    const getFunctionContent = useCallback((raw) => {
        if (!raw) return '';
        const toStr = (val) => {
            if (val == null || val === '') return '';
            if (Array.isArray(val)) return val.join('\n');
            return String(val);
        };
        return toStr(raw.jax_code) || toStr(raw.code) || toStr(raw.equation) || '';
    }, []);

    // Normalize method from API/Redux into form shape: params as [{ name, origin }], equation from jax_code/code/equation
    const normalizeMethod = useCallback((raw) => {
        if (!raw || !raw.id) return null;
        let params = raw.params;
        if (params && Array.isArray(params) && raw.param_origins && Array.isArray(raw.param_origins)) {
            params = params.map((name, idx) => ({
                name: typeof name === 'string' ? name : name.name,
                origin: raw.param_origins[idx] || 'self'
            }));
        } else if (params && Array.isArray(params)) {
            params = params.map(p => typeof p === 'string' ? { name: p, origin: 'self' } : { name: p.name, origin: p.origin || 'self' });
        } else {
            params = [];
        }
        return {
            id: raw.id,
            description: raw.description ?? '',
            params,
            return_key: raw.return_key ?? null,
            derivate: !!raw.derivate,
            equation: getFunctionContent(raw)
        };
    }, [getFunctionContent]);

    // WebSocket Listener
    useEffect(() => {
        const handleMessage = (event) => {
            const msg = event.detail;
            if (!msg) return;

            if (msg.type === "GET_METHOD" || msg.type === "GET_METHOD_RESPONSE") {
                const mod = msg.data?.method ?? msg.data;
                if (mod && mod.id) {
                    const normalized = normalizeMethod(mod);
                    if (normalized) setCurrentModule(normalized);
                }
            } else if (msg.type === "LIST_USERS_PARAMS" || msg.type === "list_param_user") {
                setParams(msg.data?.params || []);
            }
        };

        window.addEventListener('qdash-ws-message', handleMessage);
        return () => window.removeEventListener('qdash-ws-message', handleMessage);
    }, [normalizeMethod]);

    // Initial Load
    useEffect(() => {
        if (isOpen && sendMessage) {
            dispatch(setMethodLoading(true));
            const userId = localStorage.getItem(USER_ID_KEY);
            sendMessage({
                type: "GET_USERS_METHODS",
                data: null,
                auth: { user_id: userId }
            });
            sendMessage({
                type: "LIST_USERS_PARAMS",
                auth: { user_id: userId }
            });
        }
    }, [isOpen, sendMessage, dispatch]);

    // Actions
    function handleCreateNew() {
        // Auto-generate ID for new method
        const newId = `method_${Date.now()}`;
        setCurrentModule({
            id: newId,
            code: [],
            description: "",
            params: [], // Array of objects { name: "paramId", origin: "self" }
            return_key: null,
            derivate: false,
            equation: ""
        });
        setOriginalId(null);
        setEquationWarning(null);
    }

    function handleSelectModule(moduleId) {
        setOriginalId(moduleId);
        setEquationWarning(null);

        // Prefill form from Redux if we already have full method data
        const methodInRedux = userMethods.find(m => (typeof m === 'string' ? m : m.id) === moduleId);
        if (methodInRedux && typeof methodInRedux === 'object' && (methodInRedux.description != null || methodInRedux.params != null || methodInRedux.equation != null)) {
            const normalized = normalizeMethod(methodInRedux);
            if (normalized) setCurrentModule(normalized);
        }

        const userId = localStorage.getItem(USER_ID_KEY);
        sendMessage({
            type: "GET_METHOD",
            auth: { method_id: moduleId, user_id: userId }
        });
    }

    function handleDeleteModule(moduleId, e) {
        e.stopPropagation();
        if (window.confirm("Delete this method?")) {
            const userId = localStorage.getItem(USER_ID_KEY);
            sendMessage({
                type: "DEL_METHOD",
                data: null,
                auth: { method_id: moduleId, user_id: userId }
            });
            // Optimistic update or wait for GET_USERS_METHODS
        }
    }

    function handleSave() {
        if (!currentModule) {
            alert("No method selected.");
            return;
        }
        // Ensure ID exists (auto-generate if somehow missing)
        if (!currentModule.id) {
            currentModule.id = `method_${Date.now()}`;
        }
        const userId = localStorage.getItem(USER_ID_KEY);

        sendMessage({
            type: "SET_METHOD",
            data: {
                id: currentModule.id,
                description: currentModule.description,
                params: (currentModule.params || []).map(p => typeof p === 'string' ? p : p.name),
                param_origins: (currentModule.params || []).map(p => typeof p === 'string' ? 'self' : (p.origin || 'self')),
                return_key: currentModule.return_key,
                derivate: !!currentModule.derivate,
                equation: currentModule.equation
            },
            auth: {
                user_id: userId
            }
        });
    }

    // Validation
    useEffect(() => {
        if (!currentModule || !currentModule.equation) {
            setEquationWarning(null);
            return;
        }

        const eq = currentModule.equation;
        // Extract param names from the object array
        const selectedParams = new Set((currentModule.params || []).map(p => typeof p === 'string' ? p : p.name));

        // Find all potential variable names in equation
        const usedVars = eq.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];

        // Check if any used var is a known param but NOT selected
        const knownParamIds = new Set(params.map(p => typeof p === 'string' ? p : p.id));
        const missingParams = usedVars.filter(v => knownParamIds.has(v) && !selectedParams.has(v));

        if (missingParams.length > 0) {
            setEquationWarning(`Warning: Equation uses parameters that are not selected: ${missingParams.join(', ')}`);
        } else {
            setEquationWarning(null);
        }
    }, [currentModule, params]);


    // Render Helpers
    if (!isOpen) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 h-[85vh] bg-white dark:bg-slate-900 shadow-2xl rounded-t-3xl z-[100] flex flex-col border-t border-slate-200 dark:border-slate-800 animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-t-3xl">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                        <FileText size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Method Designer</h2>
                        <p className="text-xs text-slate-500">Define code bases and equation links</p>
                    </div>
                </div>
                <Button aria-label="Close modal" isIconOnly variant="light" onPress={onClose}>
                    <X size={24} />
                </Button>
            </div>

            {/* Disconnected Overlay */}
            {/* Split View */}
            <div className="flex flex-1 overflow-hidden relative flex-col md:flex-row">
                {/* Disconnected Overlay */}
                <GlobalConnectionSpinner inline={true} />
                {/* LEFT SIDE (30%) */}
                <div className="w-full md:w-[30%] border-r-0 md:border-r border-b md:border-b-0 border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
                    {/* Top 20% - Add Button */}
                    <div className="h-[20%] p-4 flex items-center justify-center border-b border-slate-200 dark:border-slate-800">
                        <Button
                            color="secondary"
                            className="w-full h-full font-bold text-lg shadow-lg"
                            startContent={<Plus size={24} />}
                            onPress={handleCreateNew}
                        >
                            New Method
                        </Button>
                    </div>

                    {/* Bottom 80% - List */}
                    <div className="flex-1 overflow-y-auto p-2 relative">
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-500">Loading Methods...</div>
                        ) : userMethods.map(mod => {
                            const methodId = typeof mod === 'string' ? mod : mod.id;
                            return (
                                <div
                                    key={methodId}
                                    onClick={() => handleSelectModule(methodId)}
                                    className={`p-3 mb-2 rounded-xl border cursor-pointer group transition-all flex items-center justify-between
                                    ${currentModule?.id === methodId
                                            ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText size={16} className="text-slate-400 group-hover:text-purple-500" />
                                        <span className="font-mono text-sm truncate">{methodId}</span>
                                    </div>
                                    <Button
                                        aria-label="Delete method"
                                        isIconOnly
                                        size="sm"
                                        color="danger"
                                        variant="light"
                                        className="opacity-0 group-hover:opacity-100"
                                        onPress={(e) => handleDeleteModule(methodId, e)}
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
                    {/* Top 20% - Help Text */}
                    <div className="h-[20%] p-4 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-800/50 flex items-start gap-3">
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <HelpCircle className="text-blue-500 dark:text-blue-400" size={16} />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 uppercase tracking-wide">Method Definition</h3>
                            <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                                Define equations that can be linked to modules. Ensure parameters match method requirements.
                            </p>
                        </div>
                    </div>

                    {/* Bottom 80% - Editor */}
                    <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
                        {currentModule ? (
                            <>
                                {/* Method ID - Display only, auto-generated */}
                                <div className="px-3 py-2 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg border border-slate-200/50 dark:border-slate-700/50 hidden">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Method ID</span>
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Auto-generated</span>
                                    </div>
                                    <span className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-1 block">{currentModule.id}</span>
                                </div>

                                {/* Method Name */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Method Name</label>
                                    <Input
                                        placeholder="Enter Method Name"
                                        value={currentModule.id || ''}
                                        onChange={(e) => setCurrentModule({ ...currentModule, id: e.target.value })}
                                        isDisabled={originalId !== null}
                                        variant="bordered"
                                        classNames={{ inputWrapper: "bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all" }}
                                    />
                                </div>

                                {/* Description */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                                    <Textarea
                                        placeholder="Describe what this method does..."
                                        value={currentModule.description || ''}
                                        onValueChange={(val) => setCurrentModule({ ...currentModule, description: val })}
                                        minRows={2}
                                        variant="bordered"
                                        size="sm"
                                        classNames={{
                                            inputWrapper: "bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all",
                                            input: "text-sm"
                                        }}
                                    />
                                </div>

                                {/* Params (Multiple Choice) */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parameters</label>
                                    <Select
                                        selectionMode="multiple"
                                        placeholder="Select parameters used in this method"
                                        // Map objects back to IDs for selection state
                                        selectedKeys={new Set((currentModule.params || []).map(p => typeof p === 'string' ? p : p.name))}
                                        onSelectionChange={(keys) => {
                                            const selectedIds = Array.from(keys);
                                            // Merge new selections with existing objects to preserve 'origin'
                                            const newParams = selectedIds.map(id => {
                                                const existing = (currentModule.params || []).find(p => (typeof p === 'string' ? p : p.name) === id);
                                                if (existing) {
                                                    return typeof existing === 'string' ? { name: existing, origin: 'self' } : existing;
                                                }
                                                return { name: id, origin: 'self' };
                                            });
                                            setCurrentModule({ ...currentModule, params: newParams });
                                        }}
                                        className="max-w-full"
                                        variant="bordered"
                                        size="sm"
                                        classNames={{
                                            trigger: "bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all h-9"
                                        }}
                                    >
                                        {params.map(param => {
                                            const pId = typeof param === 'string' ? param : param.id;
                                            const pType = typeof param === 'string' ? 'unknown' : (param.type || 'unknown');
                                            return (
                                                <SelectItem key={pId} value={pId} textValue={pId}>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-xs">{pId}</span>
                                                        <span className="text-[10px] text-slate-400">{pType}</span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </Select>

                                    {/* Selected Params Detail List */}
                                    <div className="flex flex-col gap-1.5 mt-2">
                                        {(currentModule.params || []).map((paramObj, idx) => {
                                            // Handle legacy string params or new object params
                                            const paramId = typeof paramObj === 'string' ? paramObj : paramObj.name;
                                            const currentOrigin = typeof paramObj === 'string' ? 'self' : (paramObj.origin || 'self');

                                            const paramData = params.find(p => (typeof p === 'string' ? p : p.id) === paramId);
                                            const pType = paramData?.type || 'unknown';
                                            const isConst = !!paramData?.is_constant;

                                            return (
                                                <div key={paramId} className="flex items-center justify-between p-2 rounded-lg bg-white/60 dark:bg-slate-800/40 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:border-slate-300/70 dark:hover:border-slate-600/70 transition-all">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{paramId}</span>
                                                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100/80 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400">
                                                            {pType}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        {/* Origin Selector */}
                                                        <Select
                                                            size="sm"
                                                            variant="bordered"
                                                            selectedKeys={new Set([currentOrigin])}
                                                            onSelectionChange={(keys) => {
                                                                const selected = Array.from(keys)[0];
                                                                // Update the specific param object in the array
                                                                const newParams = [...currentModule.params];
                                                                // Find index of this param
                                                                const pIndex = newParams.findIndex(p => (typeof p === 'string' ? p : p.name) === paramId);
                                                                if (pIndex !== -1) {
                                                                    newParams[pIndex] = { name: paramId, origin: selected };
                                                                    setCurrentModule({ ...currentModule, params: newParams });
                                                                }
                                                            }}
                                                            classNames={{
                                                                trigger: "h-6 min-h-6 w-24 px-2 text-[10px]",
                                                                value: "text-[10px]"
                                                            }}
                                                            aria-label="Parameter Origin"
                                                        >
                                                            <SelectItem key="self" value="self">Self</SelectItem>
                                                            <SelectItem key="interactant" value="interactant">Interactant</SelectItem>
                                                        </Select>

                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${isConst
                                                            ? "bg-purple-100/80 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300"
                                                            : "bg-slate-100/80 text-slate-500 dark:bg-slate-800/50 dark:text-slate-500"
                                                            }`}>
                                                            {isConst ? <Lock size={9} /> : null}
                                                            {isConst ? "CONST" : "VAR"}
                                                        </span>
                                                        <Button
                                                            aria-label="Remove parameter"
                                                            isIconOnly
                                                            size="sm"
                                                            variant="light"
                                                            color="danger"
                                                            className="h-5 w-5 min-w-5"
                                                            onPress={() => {
                                                                const newParams = currentModule.params.filter(p => (typeof p === 'string' ? p : p.name) !== paramId);
                                                                setCurrentModule({ ...currentModule, params: newParams });
                                                            }}
                                                        >
                                                            <X size={12} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Return Key (Single Choice) */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Return Key</label>
                                    <Select
                                        placeholder="Select return parameter"
                                        selectedKeys={currentModule.return_key ? new Set([currentModule.return_key]) : new Set()}
                                        onSelectionChange={(keys) => {
                                            const selected = Array.from(keys)[0];
                                            setCurrentModule({ ...currentModule, return_key: selected });
                                        }}
                                        className="max-w-full"
                                        variant="bordered"
                                        size="sm"
                                        classNames={{
                                            trigger: "bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all h-9"
                                        }}
                                    >
                                        {/* Use params from local state which is populated via websocket */}
                                        {params.map(param => {
                                            const pId = typeof param === 'string' ? param : param.id;
                                            const pType = typeof param === 'string' ? 'unknown' : (param.type || 'unknown');
                                            return (
                                                <SelectItem key={pId} value={pId} textValue={pId}>
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-xs">{pId}</span>
                                                        <span className="text-[10px] text-slate-400">{pType}</span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </Select>
                                </div>

                                {/* Derivate (include surrounding) */}
                                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Derivate</span>
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Include surrounding</span>
                                    </div>
                                    <Switch
                                        aria-label="Derivate - include surrounding"
                                        size="sm"
                                        isSelected={!!currentModule.derivate}
                                        onValueChange={(val) => setCurrentModule({ ...currentModule, derivate: val })}
                                        classNames={{ wrapper: 'group-data-[selected=true]:bg-purple-500' }}
                                    />
                                </div>

                                {/* Equation Editor */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Function Content (Equation, Function or Problem)</label>
                                        <span className="text-[9px] text-slate-400 font-mono">Single function only</span>
                                    </div>
                                    <div className="relative">
                                        <Textarea
                                            placeholder="def calculate(params):\n    # Your calculation logic here\n    return result"
                                            value={currentModule.equation || ''}
                                            onValueChange={(val) => setCurrentModule({ ...currentModule, equation: val })}
                                            minRows={8}
                                            classNames={{
                                                input: "font-mono text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 rounded-lg leading-relaxed",
                                                inputWrapper: "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
                                            }}
                                        />
                                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[9px] text-slate-500 dark:text-slate-400 font-mono pointer-events-none border border-slate-200 dark:border-slate-700">
                                            Python/JS
                                        </div>
                                    </div>
                                    {equationWarning && (
                                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5 bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm p-2 rounded-lg border border-amber-200/50 dark:border-amber-800/50">
                                            <span>⚠️</span>
                                            {equationWarning}
                                        </div>
                                    )}

                                </div>

                                {/* Submit Actions */}
                                <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-end">
                                    <Button
                                        color="primary"
                                        size="md"
                                        className="font-bold shadow-lg shadow-blue-500/20 text-sm"
                                        startContent={<Save size={16} />}
                                        onPress={handleSave}
                                    >
                                        Save Method
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                <FileText size={64} strokeWidth={1} className="mb-4" />
                                <p className="text-lg font-medium">No Method Selected</p>
                                <p className="text-sm">Select a method from the left or create new</p>
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

export default MethodDesigner;