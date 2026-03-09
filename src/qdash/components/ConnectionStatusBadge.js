import React from 'react';
import { useSelector } from 'react-redux';

const statusConfig = {
    connected: { label: 'Online', dot: 'bg-emerald-500', box: 'bg-emerald-500/95 text-white', pulse: false },
    connecting: { label: 'Connecting…', dot: 'bg-amber-500', box: 'bg-amber-500/95 text-amber-950', pulse: true },
    disconnected: { label: 'Disconnected', dot: 'bg-red-500', box: 'bg-red-500/95 text-white', pulse: true },
    error: { label: 'Connection error', dot: 'bg-red-500', box: 'bg-red-500/95 text-white', pulse: true },
};

/** @param {{ inline?: boolean }} props - If inline, positions absolute within parent (for engine control); otherwise fixed top-right. */
const ConnectionStatusBadge = ({ inline = false }) => {
    const { isConnected, status } = useSelector(state => state.websocket);
    const effective = isConnected ? 'connected' : (status || 'disconnected');
    const config = statusConfig[effective] || statusConfig.disconnected;

    const positionClass = inline
        ? 'absolute top-4 right-4 z-20'
        : 'fixed top-4 right-4 z-[90]';

    return (
        <div
            className={`${positionClass} flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-lg border border-white/20 backdrop-blur-sm ${config.box}`}
            title={`WebSocket: ${config.label}`}
        >
            <span
                className={`w-2 h-2 rounded-full ${config.dot} ${config.pulse ? 'animate-pulse' : ''}`}
                aria-hidden
            />
            <span className="text-xs font-semibold uppercase tracking-wider">
                {config.label}
            </span>
        </div>
    );
};

export default ConnectionStatusBadge;
