import React from 'react';
import { X } from 'lucide-react';

/**
 * Shown when user submits in a cfg designer while disconnected.
 * Dismissible alarm so they can keep editing.
 */
const SubmitConnectionAlarm = ({ message, onDismiss }) => {
    if (!message) return null;
    return (
        <div
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-amber-500/95 text-amber-950 border border-amber-600/80 shadow-lg"
            role="alert"
        >
            <span className="text-sm font-semibold uppercase tracking-wider">
                {message}
            </span>
            <button
                type="button"
                aria-label="Dismiss"
                onClick={onDismiss}
                className="p-1 rounded hover:bg-amber-600/30 transition-colors"
            >
                <X size={18} />
            </button>
        </div>
    );
};

export default SubmitConnectionAlarm;
