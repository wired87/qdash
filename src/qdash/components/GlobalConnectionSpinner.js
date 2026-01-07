import React from 'react';
import { useSelector } from 'react-redux';


const GlobalConnectionSpinner = ({ inline = false }) => {
    const { isConnected, status } = useSelector(state => state.websocket);

    if (isConnected) return null;

    let message = "Connecting to Q-Dash";
    let submessage = "Establishing secure link...";

    if (status === 'error') {
        message = "Connection Error";
        submessage = "Retrying...";
    } else if (status === 'disconnected') {
        message = "Disconnected";
        submessage = "Reconnecting...";
    }

    const containerClass = inline
        ? "absolute inset-0 z-[50] bg-white/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-inherit"
        : "fixed inset-0 z-[100] bg-white/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center";

    return (
        <div className={containerClass}>
            <div className="flex flex-col items-center gap-2">
                <span className="text-xl font-bold animate-pulse text-slate-700 dark:text-slate-200">
                    {message}
                </span>
                <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">
                    {submessage}
                </span>
            </div>
        </div>
    );
};

export default GlobalConnectionSpinner;
