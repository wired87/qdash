import React from 'react';

/**
 * Compact injection preview component showing mini chart
 * Used in top 20% of cluster injection modal
 */
const CompactInjectionPreview = ({ injection }) => {
    if (!injection) {
        return (
            <div style={{
                padding: '1rem',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '0.875rem',
                borderBottom: '2px solid #e5e7eb',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                Click an injection to preview
            </div>
        );
    }

    const [times, energies] = injection.data;

    if (!times?.length || !energies?.length) {
        return (
            <div style={{
                padding: '1rem',
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '0.875rem',
                borderBottom: '2px solid #e5e7eb'
            }}>
                Invalid injection data
            </div>
        );
    }

    const maxTime = Math.max(...times);
    const maxEnergy = Math.max(...energies);
    const minEnergy = Math.min(...energies);
    const energyRange = maxEnergy - minEnergy || 1;

    return (
        <div style={{
            padding: '0.75rem',
            borderBottom: '2px solid #e5e7eb',
            backgroundColor: '#f8fafc',
            height: '100%'
        }}>
            <div style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '0.5rem'
            }}>
                Preview: {injection.id}
            </div>

            <svg width="100%" height="80" viewBox="0 0 300 80" preserveAspectRatio="xMidYMid meet">
                {/* Grid */}
                <defs>
                    <pattern id="miniGrid" width="30" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 30 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
                    </pattern>
                </defs>
                <rect width="300" height="80" fill="url(#miniGrid)" />

                {/* Line chart */}
                <polyline
                    points={times.map((t, i) => {
                        const x = (t / maxTime) * 280 + 10;
                        const y = 70 - ((energies[i] - minEnergy) / energyRange) * 60;
                        return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                />

                {/* Points */}
                {times.map((t, i) => {
                    const x = (t / maxTime) * 280 + 10;
                    const y = 70 - ((energies[i] - minEnergy) / energyRange) * 60;
                    return (
                        <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="3"
                            fill="#3b82f6"
                            stroke="white"
                            strokeWidth="1"
                        />
                    );
                })}
            </svg>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.65rem',
                color: '#6b7280',
                marginTop: '0.25rem'
            }}>
                <span>{times.length} points</span>
                <span>Max: {maxEnergy.toFixed(1)}</span>
            </div>
        </div>
    );
};

export default CompactInjectionPreview;
