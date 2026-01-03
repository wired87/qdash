import React, { useState, useEffect } from "react";

import { X, Database, Trash2 } from "lucide-react";
import ClusterInjectionModal from "./ClusterInjectionModal";

import { USER_ID_KEY } from "../auth";

const StatusBar = ({ status }) => {
    const statusConfig = {
        running: { color: 'bg-blue-500/20 text-blue-700 border-blue-500/30', label: 'Running', icon: '⚡' },
        finished: { color: 'bg-green-500/20 text-green-700 border-green-500/30', label: 'Finished', icon: '✓' },
        error: { color: 'bg-red-500/20 text-red-700 border-red-500/30', label: 'Error', icon: '✗' },
        default: { color: 'bg-slate-500/20 text-slate-700 border-slate-500/30', label: 'Idle', icon: '○' }
    };

    const config = statusConfig[status] || statusConfig.default;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${config.color}`}>
            <span>{config.icon}</span>
            {config.label}
        </span>
    );
};

export const Dashboard = (
    {
        envs,
        toggleModal,
        startSim,
        toggleNcfg,
        toggleDataSlider,
        sendMessage,
        isDataSliderOpen,
        toggleLogSidebar,
        requestClusterData,
        isDashOpen,
        setIsDashOpen,
        startAllEnvs,
        onDeleteEnv
    }
) => {
    const [selectedEnvs, setSelectedEnvs] = useState(new Set());
    const [injectionModalOpen, setInjectionModalOpen] = useState(false);
    const [selectedEnvForInjection, setSelectedEnvForInjection] = useState(null);

    const addEnvLen = () => Object.keys(envs).length

    const handleCheckboxChange = (env_id) => {
        const newSelectedEnvs = new Set(selectedEnvs);
        if (newSelectedEnvs.has(env_id)) {
            newSelectedEnvs.delete(env_id);
        } else {
            newSelectedEnvs.add(env_id);
        }
        setSelectedEnvs(newSelectedEnvs);
    };

    const openClusterInjection = (env_id, env_data) => {
        setSelectedEnvForInjection({ envId: env_id, envData: env_data });
        setInjectionModalOpen(true);
    };

    const handleDelete = (env_id) => {
        const userId = localStorage.getItem(USER_ID_KEY);
        if (window.confirm("Are you sure you want to delete this environment?")) {
            sendMessage({
                type: "DEL_ENV",
                auth: { user_id: userId, env_id: env_id }
            });
            if (onDeleteEnv) onDeleteEnv(env_id);
        }
    };

    useEffect(() => {
        const userId = localStorage.getItem(USER_ID_KEY);
        if (sendMessage) {
            sendMessage({
                type: "GET_ENV",
                auth: { user_id: userId }
            });
        }
    }, [sendMessage]);

    if (Object.keys(envs).length === 0) {
        return <div className="p-8 text-center text-slate-500">Loading Environments...</div>;
    }

    return (
        <>
            {/* Injection Modal */}
            {injectionModalOpen && selectedEnvForInjection && (
                <ClusterInjectionModal
                    isOpen={injectionModalOpen}
                    onClose={() => {
                        setInjectionModalOpen(false);
                        setSelectedEnvForInjection(null);
                    }}
                    envId={selectedEnvForInjection.envId}
                    envData={selectedEnvForInjection.envData}
                    sendMessage={sendMessage}
                />
            )}

            {/* Dropdown Modal Container */}
            <div
                className={`fixed top-0 left-4 z-40 w-96 bg-white shadow-2xl border-r border-slate-200 overflow-hidden transition-all duration-500 ease-out ${isDashOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                    }`}
                style={{ height: '100vh' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center gap-2">
                        <Database size={20} className="text-blue-600" />
                        <h2 className="text-lg font-bold text-slate-900">Environments</h2>
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {addEnvLen()}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {addEnvLen() > 0 && (
                            <button
                                onClick={startAllEnvs}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                                title="Start all environments"
                            >
                                <span className="text-sm">▶</span>
                                Start All
                            </button>
                        )}
                        <button
                            onClick={() => setIsDashOpen(false)}
                            className="p-1 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            <X size={18} className="text-slate-600" />
                        </button>
                    </div>
                </div>

                {/* Environment List */}
                <div className="flex-1 overflow-y-auto" style={{ height: 'calc(100vh - 140px)' }}>
                    {addEnvLen() > 0 ? (
                        <div className="p-2">
                            {Object.entries(envs).map(([env_id, env_data]) => (
                                <div
                                    key={env_id}
                                    className="mb-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-all duration-200 group"
                                >
                                    {/* Env Header */}
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox h-4 w-4 text-blue-500 rounded"
                                                checked={selectedEnvs.has(env_id)}
                                                onChange={() => handleCheckboxChange(env_id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-mono text-slate-600 truncate" title={env_id}>
                                                    {env_id.substring(0, 24)}...
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <StatusBar status={env_data.status} />
                                            <span className="text-xs font-semibold text-slate-600">
                                                {Object.keys(env_data.nodes || {}).length} nodes
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons - Compact Grid */}
                                    <div className="grid grid-cols-4 gap-1">
                                        <button onClick={() => toggleModal(env_id)} className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded transition-all" title="Graph">🌐</button>
                                        <button onClick={() => startSim(env_id)} className="px-2 py-1 bg-white hover:bg-slate-50 text-black text-xs font-semibold rounded border border-slate-300 transition-all" title="Start">▶️</button>
                                        <button onClick={() => { toggleDataSlider(); sendMessage({ type: "TOGGLE_DATA_SLIDER", env_id, timestamp: new Date().toISOString() }); }} className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold rounded transition-all" title="Data">📊</button>
                                        <button onClick={() => openClusterInjection(env_id, env_data)} className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded transition-all" title="Apply Injection">💉</button>
                                        {toggleLogSidebar && <button onClick={toggleLogSidebar} className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-white text-xs font-semibold rounded transition-all" title="Logs">📜</button>}
                                        {env_data.status === 'finished' && requestClusterData && <button onClick={() => requestClusterData(env_id)} className="px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold rounded transition-all" title="Cluster">📈</button>}
                                        <button onClick={() => handleDelete(env_id)} className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold rounded transition-all border border-red-200 flex items-center justify-center" title="Delete">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <div className="text-4xl mb-2">🌌</div>
                            <p className="text-sm text-slate-600 font-semibold">No environments yet</p>
                            <p className="text-xs text-slate-400 mt-1">Create your first environment</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-semibold">{selectedEnvs.size} selected</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Dashboard;
