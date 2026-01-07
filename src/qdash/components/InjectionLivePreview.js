import React from 'react';

/**
 * Visualizes injection SOA data as a line chart
 * Input format: [[times], [energies]]
 */
const InjectionLivePreview = ({ config, title = "Injection Pattern" }) => {
    if (!config || !Array.isArray(config) || config.length !== 2) {
        return (
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 text-center">
                <p className="text-sm text-slate-500">No injection data to preview</p>
            </div>
        );
    }

    const [times, energies] = config;

    if (!times?.length || !energies?.length || times.length !== energies.length) {
        return (
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 text-center">
                <p className="text-sm text-slate-500">Invalid injection data format</p>
            </div>
        );
    }

    // Calculate SVG path
    const maxTime = Math.max(...times, 1);
    const maxEnergy = Math.max(...energies, 1);
    const minEnergy = Math.min(...energies, 0);
    const energyRange = maxEnergy - minEnergy || 1;

    const width = 300;
    const height = 150;
    const padding = 20;

    const points = times.map((time, i) => {
        const x = padding + ((time / maxTime) * (width - 2 * padding));
        const y = height - padding - (((energies[i] - minEnergy) / energyRange) * (height - 2 * padding));
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">{title}</h4>

            <svg width={width} height={height} className="mx-auto">
                {/* Grid lines */}
                <defs>
                    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                    </pattern>
                </defs>
                <rect width={width} height={height} fill="url(#grid)" />

                {/* Axes */}
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding}
                    stroke="#94a3b8" strokeWidth="2" />
                <line x1={padding} y1={padding} x2={padding} y2={height - padding}
                    stroke="#94a3b8" strokeWidth="2" />

                {/* Data line */}
                <polyline
                    points={points}
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Gradient for line */}
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="50%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                </defs>

                {/* Data points */}
                {times.map((time, i) => {
                    const x = padding + ((time / maxTime) * (width - 2 * padding));
                    const y = height - padding - (((energies[i] - minEnergy) / energyRange) * (height - 2 * padding));
                    return (
                        <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="4"
                            fill="#3b82f6"
                            stroke="white"
                            strokeWidth="2"
                        />
                    );
                })}

                {/* Labels */}
                <text x={width / 2} y={height - 5} textAnchor="middle" className="text-xs fill-slate-600">
                    Time
                </text>
                <text x="5" y={height / 2} textAnchor="middle" transform={`rotate(-90 5 ${height / 2})`} className="text-xs fill-slate-600">
                    Energy
                </text>
            </svg>

            {/* Data summary */}
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="bg-white dark:bg-slate-700 rounded p-2 border border-slate-200 dark:border-slate-600">
                    <div className="text-slate-500 dark:text-slate-400">Points</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{times.length}</div>
                </div>
                <div className="bg-white dark:bg-slate-700 rounded p-2 border border-slate-200 dark:border-slate-600">
                    <div className="text-slate-500 dark:text-slate-400">Max Energy</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{maxEnergy.toFixed(1)}</div>
                </div>
                <div className="bg-white dark:bg-slate-700 rounded p-2 border border-slate-200 dark:border-600">
                    <div className="text-slate-500 dark:text-slate-400">Duration</div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{maxTime}</div>
                </div>
            </div>
        </div>
    );
};

export default InjectionLivePreview;
