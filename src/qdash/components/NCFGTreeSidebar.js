import React from 'react';
import { useNCFGStore } from '../ncfg_store';
import demoG from '../demo_G.json';
import { getUniqueColor } from '../get_color';
import { ChevronRight, Database, MapPin, Clock, Zap } from 'lucide-react';

export const NCFGTreeSidebar = ({ onSelectPos }) => {
    const { ncfgData } = useNCFGStore();

    return (
        <div className="w-[350px] h-full bg-slate-950/80 backdrop-blur-xl border-l border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
            <div className="p-6 border-b border-slate-800">
                <div className="flex items-center gap-2 mb-1">
                    <Database className="text-blue-500" size={20} />
                    <h2 className="text-xl font-bold text-white tracking-tight">NCFG Registry</h2>
                </div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Active State Monitoring</p>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {demoG.nodes.map((node, idx) => {
                    const nodeEntries = ncfgData[node.id] || {};
                    const entries = Object.entries(nodeEntries).filter(([_, [steps]]) => steps && steps.length > 0);
                    const entryCount = entries.length;
                    const nodeColor = getUniqueColor(idx, demoG.nodes.length);

                    return (
                        <div key={node.id} className="group">
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800/50 hover:bg-slate-800/50 transition-all duration-300 group-hover:border-slate-700">
                                <div
                                    className="w-3 h-3 rounded-full shadow-lg"
                                    style={{ backgroundColor: nodeColor, boxShadow: `0 0 10px ${nodeColor}` }}
                                />
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold text-slate-200 truncate">{node.id}</h3>
                                    <p className="text-[10px] text-slate-500 font-mono italic">{node.type}</p>
                                </div>
                                {entryCount > 0 && (
                                    <div className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold animate-pulse">
                                        {entryCount}
                                    </div>
                                )}
                            </div>

                            {entryCount > 0 && (
                                <div className="ml-6 mt-2 space-y-2 border-l-2 border-slate-800/50 pl-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    {entries.map(([posKey, [timeSteps, strengths]]) => (
                                        <div
                                            key={posKey}
                                            onClick={() => onSelectPos?.(node.id, posKey)}
                                            className="p-3 rounded-lg bg-slate-900/30 border border-slate-800/30 hover:bg-blue-500/10 transition-colors cursor-pointer group/item"
                                        >
                                            <div className="flex items-center gap-1.5 text-slate-400 mb-2">
                                                <MapPin size={12} className="text-blue-500" />
                                                <span className="text-[10px] font-mono tracking-tighter">{posKey}</span>
                                            </div>
                                            <div className="space-y-1.5">
                                                {timeSteps.map((step, i) => (
                                                    <div key={i} className="flex items-center justify-between text-[10px]">
                                                        <div className="flex items-center gap-1 text-slate-500">
                                                            <Clock size={10} />
                                                            <span>{step}s</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-blue-400 font-bold">
                                                            <Zap size={10} />
                                                            <span>{strengths[i].toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="p-4 bg-slate-900/80 border-t border-slate-800">
                <div className="flex items-center justify-between text-[10px] font-medium uppercase tracking-wider text-slate-500">
                    <span>Registry Status</span>
                    <span className="text-blue-500 animate-pulse flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        Live Synchronized
                    </span>
                </div>
            </div>
        </div>
    );
};
