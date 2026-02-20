import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, PlusCircle } from 'lucide-react';
import { Button } from '@heroui/react';
import ConfigAccordion from './accordeon';
import { setSelectedEnv, selectSelectedEnv } from '../store/slices/envSlice';
import { clearCurrentEnv } from '../store/slices/appStateSlice';

/**
 * Glassmorphism panel for env config, shown to the left of the engine env list.
 * List view lives in EngineEnvsSidebar; this panel is the "create/edit env" form.
 */
const EnvCfgGlassPanel = ({
    isOpen,
    onClose,
    sendMessage,
    user,
    userProfile,
    saveUserWorldConfig,
    listenToUserWorldConfig,
}) => {
    const dispatch = useDispatch();
    const selectedEnv = useSelector(selectSelectedEnv);

    if (!isOpen) return null;

    const initialValues = selectedEnv
        ? {
            id: selectedEnv.id,
            amount_of_nodes: selectedEnv.amount_of_nodes ?? selectedEnv.cluster_dim,
            sim_time: selectedEnv.sim_time,
            dims: selectedEnv.dims,
            enable_sm: selectedEnv.enable_sm,
            particle: selectedEnv.particle,
            status: selectedEnv.status ?? selectedEnv.state,
            field_id: selectedEnv.field_id ?? selectedEnv.field,
            distance: selectedEnv.distance ?? 0,
        }
        : {};

    return (
        <div
            className="flex flex-col h-full min-w-[300px] max-w-[340px] rounded-r-xl border border-white/15 overflow-hidden"
            style={{
                background: 'rgba(15, 23, 42, 0.48)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                boxShadow: '4px 0 24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
        >
            <div className="flex-shrink-0 flex items-center justify-between px-3 py-2.5 border-b border-white/10">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-300/90">
                    Env Config
                </span>
                <div className="flex items-center gap-1">
                    <Button
                        aria-label="New environment"
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="min-w-7 w-7 h-7 text-slate-400 hover:text-white"
                        onPress={() => {
                            dispatch(setSelectedEnv(null));
                            dispatch(clearCurrentEnv());
                        }}
                        title="New env"
                    >
                        <PlusCircle className="w-4 h-4" />
                    </Button>
                    <Button
                        aria-label="Close env config"
                        isIconOnly
                        size="sm"
                        variant="light"
                        className="min-w-7 w-7 h-7 text-slate-400 hover:text-white"
                        onPress={() => onClose?.()}
                        title="Close"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3">
                <ConfigAccordion
                    sendMessage={sendMessage}
                    initialValues={initialValues}
                    shouldShowDefault={Object.keys(initialValues).length === 0}
                    user={user}
                    userProfile={userProfile}
                    saveUserWorldConfig={saveUserWorldConfig}
                    listenToUserWorldConfig={listenToUserWorldConfig}
                />
            </div>
        </div>
    );
};

export default EnvCfgGlassPanel;
