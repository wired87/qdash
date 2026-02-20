import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Plus, Minus, RefreshCw } from 'lucide-react';
import { setSelectedEnv, setLoading } from '../store/slices/envSlice';
import { setCurrentEnv } from '../store/slices/appStateSlice';
import { USER_ID_KEY } from '../auth';

const requestEnvs = (sendMessage) => {
    const userId = localStorage.getItem(USER_ID_KEY);
    if (userId && sendMessage) {
        sendMessage({
            type: 'GET_USERS_ENVS',
            auth: { user_id: userId },
            timestamp: new Date().toISOString(),
        });
    }
};

/**
 * Left sidebar: Mac-style dock of env items at mid height; hover shows cfg modal, click selects env.
 */
const EngineEnvsSidebar = ({ className = '', sendMessage, onRequestEnvs, onOpenEnvCfg, isVisible = true, onHoverEnv }) => {
    const dispatch = useDispatch();
    const userEnvs = useSelector((state) => state.envs?.userEnvs ?? []);
    const selectedEnvId = useSelector((state) => state.envs?.selectedEnvId);
    const loading = useSelector((state) => state.envs?.loading);
    const isWsConnected = useSelector((state) => state.websocket?.isConnected);

    const fetchEnvs = useCallback(() => {
        if (onRequestEnvs) {
            onRequestEnvs();
        } else {
            dispatch(setLoading(true));
            requestEnvs(sendMessage);
        }
    }, [sendMessage, onRequestEnvs, dispatch]);

    useEffect(() => {
        if (!isVisible) return;
        fetchEnvs();
    }, [isVisible, fetchEnvs]);

    useEffect(() => {
        if (!isVisible || !isWsConnected) return;
        fetchEnvs();
    }, [isVisible, isWsConnected, fetchEnvs]);

    const handleSelectEnv = (env) => {
        if (!env) return;
        const id = env.id ?? env.env_id;
        dispatch(setSelectedEnv(id ?? null));
        dispatch(setCurrentEnv(env));
    };

    const handleDeselect = () => {
        dispatch(setSelectedEnv(null));
        dispatch(setCurrentEnv(null));
    };

    return (
        <div
            key={userEnvs.length || 'no-envs'}
            className={`flex flex-col h-full overflow-hidden ${className}`}
        >
            {/* Minimal toolbar – no container chrome */}
            <div className="flex-shrink-0 px-2 py-1.5 flex items-center justify-end gap-1">
                <button
                    type="button"
                    onClick={() => onOpenEnvCfg?.()}
                    className="p-1.5 rounded-full text-cyan-300/90 hover:bg-cyan-500/20 transition-all"
                    title="New env"
                >
                    <Plus className="w-3 h-3" strokeWidth={2.5} />
                </button>
                <button
                    type="button"
                    onClick={handleDeselect}
                    className="p-1.5 rounded-full text-slate-400 hover:bg-slate-500/20 transition-all"
                    title="Deselect"
                >
                    <Minus className="w-3 h-3" strokeWidth={2.5} />
                </button>
                <button
                    type="button"
                    onClick={fetchEnvs}
                    disabled={loading}
                    className="p-1.5 rounded-full text-slate-400 hover:bg-slate-500/20 transition-all disabled:opacity-50"
                    title="Refresh"
                >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} strokeWidth={2.5} />
                </button>
            </div>

            {/* Just env items – no container */}
            <div className="flex-1 min-h-0 flex items-center justify-center p-2">
                {loading && userEnvs.length === 0 && (
                    <div className="text-slate-500 text-[10px] font-mono uppercase tracking-wider text-center">
                        Loading…
                    </div>
                )}
                {!loading && userEnvs.length === 0 && (
                    <div className="text-slate-500 text-[10px] font-mono uppercase tracking-wider text-center">
                        No envs · Use + to create
                    </div>
                )}
                {userEnvs.length > 0 && (
                    <div className="flex flex-col items-center gap-3 max-h-full overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent py-2">
                        {userEnvs.map((env) => {
                            const id = env.id ?? env.env_id;
                            const isSelected = selectedEnvId === id;
                            const nodeCount = env.amount_of_nodes ?? env.cluster_dim;
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => handleSelectEnv(env)}
                                    onMouseEnter={() => onHoverEnv?.(env)}
                                    onMouseLeave={() => onHoverEnv?.(null)}
                                    className="group flex flex-col items-center gap-1 focus:outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-2xl"
                                >
                                    <div
                                        className={`
                                            w-10 h-10 sm:w-12 sm:h-12 rounded-2xl
                                            transition-all duration-200 ease-out
                                            transform origin-center
                                            group-hover:scale-[1.3]
                                            ring-2
                                            ${isSelected
                                                ? 'bg-cyan-500/50 ring-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.6)]'
                                                : 'ring-transparent bg-slate-700/80 group-hover:bg-slate-600/90 group-hover:ring-slate-500'
                                            }
                                        `}
                                    />
                                    <div className="flex flex-col items-center gap-0.5">
                                        <span className={`text-[10px] font-mono truncate max-w-[180px] transition-colors ${isSelected ? 'text-cyan-200' : 'text-slate-200 group-hover:text-white'}`}>
                                            {id}
                                        </span>
                                        {nodeCount != null && (
                                            <span className="text-[9px] text-slate-400 font-mono tabular-nums">
                                                {nodeCount}n
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

        </div>
    );
};

export default EngineEnvsSidebar;
