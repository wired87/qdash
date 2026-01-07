import React from 'react';

export const FuturisticBackground = React.memo(() => {
    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-slate-50 pointer-events-none">
            <svg className="absolute w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-900" />
                    </pattern>
                    <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-400" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Futuristic Accents */}
                <g className="text-blue-500" stroke="currentColor" strokeWidth="1" fill="none">
                    <circle cx="10%" cy="20%" r="50" opacity="0.2" />
                    <circle cx="90%" cy="80%" r="100" opacity="0.1" />
                    <path d="M 0 100 L 100 0" opacity="0.2" />
                    <path d="M 100% 80% L 80% 100%" opacity="0.2" />
                </g>

                {/* Circuit-like lines */}
                <path d="M 10% 10% H 30% V 30%" stroke="currentColor" strokeWidth="1" fill="none" className="text-slate-400" opacity="0.3" />
                <path d="M 90% 90% H 70% V 70%" stroke="currentColor" strokeWidth="1" fill="none" className="text-slate-400" opacity="0.3" />
            </svg>

        </div>
    );
});
