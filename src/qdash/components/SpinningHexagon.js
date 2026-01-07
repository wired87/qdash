import React from 'react';
import { motion } from 'framer-motion';

// Graph-based brain SVG component
const GraphBrain = ({ className }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {/* Abstract Brain Shape Nodes & Connections */}
        <circle cx="50" cy="50" r="3" fill="currentColor" />
        <circle cx="35" cy="40" r="2.5" fill="currentColor" />
        <circle cx="65" cy="40" r="2.5" fill="currentColor" />
        <circle cx="35" cy="60" r="2.5" fill="currentColor" />
        <circle cx="65" cy="60" r="2.5" fill="currentColor" />
        <circle cx="50" cy="30" r="2.5" fill="currentColor" />
        <circle cx="50" cy="70" r="2.5" fill="currentColor" />
        <circle cx="25" cy="50" r="2" fill="currentColor" />
        <circle cx="75" cy="50" r="2" fill="currentColor" />

        {/* Connections */}
        <path d="M50 50 L35 40 M50 50 L65 40 M50 50 L35 60 M50 50 L65 60" opacity="0.8" />
        <path d="M35 40 L50 30 L65 40" opacity="0.6" />
        <path d="M35 60 L50 70 L65 60" opacity="0.6" />
        <path d="M35 40 L25 50 L35 60" opacity="0.6" />
        <path d="M65 40 L75 50 L65 60" opacity="0.6" />
    </svg>
);

export const SpinningHexagon = () => {
    return (
        <div className="flex items-center justify-center w-full h-full z-50 absolute inset-0 pointer-events-none">
            {/* The Spinner Container */}
            <div className="relative w-32 h-32 flex items-center justify-center">

                {/* Rotating Glass Hexagon */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, ease: "linear", repeat: Infinity }}
                    className="absolute inset-0 bg-slate-900/20 backdrop-blur-md"
                    style={{
                        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                        boxShadow: "inset 0 0 20px rgba(255,255,255,0.1)" // Subtle inner light
                    }}
                />

                {/* Inner White-ish Glass Layer for Detail (Counter Rotating?) optional, kept simple */}
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                    className="absolute inset-4 bg-blue-600/10 backdrop-blur-sm"
                    style={{
                        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)"
                    }}
                />

                {/* Static Brain in Center */}
                <div className="absolute z-20 w-16 h-16 flex items-center justify-center">
                    <GraphBrain className="w-10 h-10 text-white drop-shadow-[0_0_2px_rgba(255,255,255,0.8)]" />
                </div>
            </div>
        </div>
    );
};
