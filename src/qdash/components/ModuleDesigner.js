import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Button, Input } from "@heroui/react";
import { Plus, Trash2, HelpCircle, FileText, Save, X, ZapOff } from "lucide-react";
import { USER_ID_KEY, getSessionId } from "../auth";
import GlobalConnectionSpinner from './GlobalConnectionSpinner';


const ModuleDesigner = ({ isOpen, onClose, sendMessage, user }) => {
    const [modules, setModules] = useState([]);
    const [currentModule, setCurrentModule] = useState(null);
    const [originalId, setOriginalId] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

    const isConnected = useSelector(state => state.websocket.isConnected);

    // WebSocket Listener
    useEffect(() => {
        const handleMessage = (event) => {
            const msg = event.detail;
            if (!msg) return;

            if (msg.type === "LIST_USERS_MODULES") {
                setModules(msg.data?.modules || []);
                setIsLoading(false);
            } else if (msg.type === "GET_MODULE") {
                setCurrentModule(msg.data);
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
                type: "LIST_USERS_MODULES",
                data: null,
                auth: { user_id: userId }
            });
        }
    }, [isOpen, sendMessage]);

    // Actions
    function handleCreateNew() {
        setCurrentModule({
            id: "", // Empty ID for new module
            files: [],
            code: []
        });
        setOriginalId(null);
    }

    function handleSelectModule(moduleId) {
        const userId = localStorage.getItem(USER_ID_KEY);
        setOriginalId(moduleId);
        sendMessage({
            type: "GET_MODULE",
            auth: { module_id: moduleId, user_id: userId }
        });
    }

    function handleDeleteModule(moduleId, e) {
        e.stopPropagation();
        if (window.confirm("Delete this module?")) {
            const userId = localStorage.getItem(USER_ID_KEY);
            sendMessage({
                type: "DEL_MODULE",
                data: null,
                auth: { module_id: moduleId, user_id: userId }
            });
            // Optimistic update or wait for LIST_USERS_MODULES
        }
    }



    const fileInputRef = React.useRef(null);

    const processFiles = useCallback((files) => {
        if (!files || files.length === 0) return;

        const fileList = Array.from(files);
        const newFiles = [];
        let processed = 0;

        fileList.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                newFiles.push({
                    name: file.name,
                    content: event.target.result
                });
                processed++;
                if (processed === fileList.length) {
                    setCurrentModule(prev => ({
                        ...prev,
                        files: [...(prev.files || []), ...newFiles]
                    }));
                }
            };
            reader.readAsText(file);
        });
    }, []);

    const onDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const onDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        if (!currentModule) return;
        processFiles(e.dataTransfer.files);
    }, [currentModule, processFiles]);

    const handleFileSelect = useCallback((e) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
        }
        // Reset input value to allow selecting same files again if needed
        e.target.value = '';
    }, [processFiles]);

    const handleBrowseClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    function handleSave() {
        if (!currentModule || !currentModule.id) {
            alert("Please define a Module ID.");
            return;
        }
        const userId = localStorage.getItem(USER_ID_KEY);

        // Convert files to list of strings (content)
        const filePayload = (currentModule.files || []).map(f => {
            return typeof f === 'object' ? (f.content || "") : f;
        });

        sendMessage({
            type: "SET_MODULE",
            data: {
                id: currentModule.id,
                files: filePayload
            },
            auth: {
                user_id: userId
            }
        });
    }

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
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Module Designer</h2>
                        <p className="text-xs text-slate-500">Define code bases and equation links</p>
                    </div>
                </div>
                <Button isIconOnly variant="light" onPress={onClose}>
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
                            New Module
                        </Button>
                    </div>

                    {/* Bottom 80% - List */}
                    <div className="flex-1 overflow-y-auto p-2 relative">
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-500">Loading Modules...</div>
                        ) : modules.map(mod => {
                            const modId = typeof mod === 'string' ? mod : mod.id;
                            return (
                                <div
                                    key={modId}
                                    onClick={() => handleSelectModule(modId)}
                                    className={`p-3 mb-2 rounded-xl border cursor-pointer group transition-all flex items-center justify-between
                                    ${currentModule?.id === modId
                                            ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText size={16} className="text-slate-400 group-hover:text-purple-500" />
                                        <span className="font-mono text-sm truncate">{modId}</span>
                                    </div>
                                    <Button
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
                    {/* Top 20% - Help Text */}
                    <div className="h-[20%] p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-start gap-4">
                        <HelpCircle className="text-blue-500 mt-1 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-1">Module Definition</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                Modules define the code base used to calculate equations. They can be linked to created fields to calculate them together.
                                <br />
                                <span className="font-semibold text-amber-600 dark:text-amber-400 text-xs mt-2 block">
                                    ⚠️ WARNING: Fields must have the same parameters as used by equations, otherwise calculation will fail.
                                </span>
                            </p>
                        </div>
                    </div>

                    {/* Bottom 80% - Editor */}
                    <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
                        {currentModule ? (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Module ID</label>
                                    <Input
                                        placeholder="Enter Module ID (or auto-generate)"
                                        value={currentModule.id || ''}
                                        onChange={(e) => setCurrentModule({ ...currentModule, id: e.target.value })}
                                        isDisabled={originalId !== null}
                                        variant="bordered"
                                        classNames={{ inputWrapper: "bg-slate-50 dark:bg-slate-800" }}
                                    />
                                </div>

                                {/* File Viewer */}
                                <div className="flex-1 space-y-2 flex flex-col min-h-[200px]">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                                        <span>Module Files (Drag & Drop)</span>
                                        <span className="text-xs font-normal lowercase">{currentModule.files?.length || 0} files</span>
                                    </label>
                                    <div
                                        onDragOver={onDragOver}
                                        onDragLeave={onDragLeave}
                                        onDrop={onDrop}
                                        onClick={handleBrowseClick}
                                        className={`flex-1 border-2 border-dashed rounded-xl overflow-hidden relative transition-colors cursor-pointer ${isDragging
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900'
                                            }`}
                                    >
                                        <input
                                            type="file"
                                            multiple
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                        />
                                        {/* Simple File List View for now */}
                                        <div className="absolute inset-0 overflow-auto p-4 space-y-4">
                                            {currentModule.files && currentModule.files.length > 0 ? (
                                                currentModule.files.map((file, idx) => {
                                                    const fileName = typeof file === 'object' ? file.name : `File ${idx + 1}`;
                                                    const isPyFile = typeof file === 'string' || (file.name && file.name.toLowerCase().endsWith('.py'));

                                                    return (
                                                        <div key={idx} className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm relative group overflow-hidden ${isPyFile ? 'p-4' : 'p-3 flex items-center justify-between'}`}>

                                                            {/* Header / Name */}
                                                            <div className={`flex items-center justify-between ${isPyFile ? 'text-xs font-mono text-slate-400 mb-2 border-b pb-1' : 'flex-1 min-w-0 mr-4'}`}>
                                                                <div className="flex items-center gap-2 truncate">
                                                                    <FileText size={14} className={isPyFile ? "text-blue-400" : "text-slate-400"} />
                                                                    <span className={`truncate ${!isPyFile && 'text-sm font-medium text-slate-700 dark:text-slate-200'}`}>
                                                                        {fileName}
                                                                    </span>
                                                                </div>

                                                                {isPyFile && (
                                                                    <Button
                                                                        isIconOnly size="sm" color="danger" variant="light" className="h-4 w-4 min-w-4"
                                                                        onPress={(e) => {
                                                                            if (e && e.stopPropagation) e.stopPropagation(); // Stop click from opening file browser
                                                                            const newFiles = [...currentModule.files];
                                                                            newFiles.splice(idx, 1);
                                                                            setCurrentModule({ ...currentModule, files: newFiles });
                                                                        }}
                                                                    >
                                                                        <X size={12} />
                                                                    </Button>
                                                                )}
                                                            </div>

                                                            {/* Content for .py files */}
                                                            {isPyFile && (
                                                                <pre className="text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                                                                    {typeof file === 'string' ? file : (file.content || '')}
                                                                </pre>
                                                            )}

                                                            {/* Remove action for non-py files (inline) */}
                                                            {!isPyFile && (
                                                                <Button
                                                                    isIconOnly size="sm" color="danger" variant="light"
                                                                    onPress={(e) => {
                                                                        if (e && e.stopPropagation) e.stopPropagation();
                                                                        const newFiles = [...currentModule.files];
                                                                        newFiles.splice(idx, 1);
                                                                        setCurrentModule({ ...currentModule, files: newFiles });
                                                                    }}
                                                                >
                                                                    <X size={16} />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-400 pointer-events-none">
                                                    <FileText size={48} strokeWidth={1} className={`mb-2 transition-transform ${isDragging ? 'scale-110 text-blue-500' : ''}`} />
                                                    <p>{isDragging ? "Drop files now!" : "Drag & Drop files here or click to browse"}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>



                                {/* Code Field Editor */}
                                {((currentModule.code && currentModule.code.length > 0) || (currentModule.files && currentModule.files.length > 0)) && (
                                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            Live Code Inspector
                                        </label>
                                        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 relative group">
                                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/50 backdrop-blur-sm rounded-bl-xl text-xs text-slate-400">
                                                Read Only
                                            </div>
                                            <textarea
                                                readOnly
                                                value={(() => {
                                                    const filesContent = (currentModule.files || [])
                                                        .filter(f => typeof f === 'string' || (f.name && f.name.toLowerCase().endsWith('.py')))
                                                        .map(f => typeof f === 'object' ? `# --- ${f.name} ---\n${f.content || ''}` : f)
                                                        .join('\n\n');
                                                    if (filesContent.trim()) return filesContent;
                                                    return Array.isArray(currentModule.code) ? currentModule.code.join('\n') : (currentModule.code || '');
                                                })()}
                                                className="w-full h-48 p-4 bg-slate-950 text-green-400 font-mono text-xs leading-relaxed outline-none resize-none scrollbar-thin scrollbar-thumb-slate-700"
                                            />
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
                                <FileText size={64} strokeWidth={1} className="mb-4" />
                                <p className="text-lg font-medium">No Module Selected</p>
                                <p className="text-sm">Select a module from the left or create new</p>
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

export default ModuleDesigner;
