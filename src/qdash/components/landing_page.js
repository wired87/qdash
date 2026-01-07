import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { LiveView } from './LiveView';
import { FuturisticBackground } from './FuturisticBackground';


export const LandingPage = ({ liveData, children }) => {
    const engineRef = useRef(null);
    const instructionsRef = useRef(null);
    const isEngineInView = useInView(engineRef, { amount: 0.3 });
    const isInstructionsInView = useInView(instructionsRef, { amount: 0.2, once: true });

    const [showSpinner, setShowSpinner] = useState(false);
    const [hasVisitedEngine, setHasVisitedEngine] = useState(false);
    const [showArrow, setShowArrow] = useState(true);

    React.useEffect(() => {
        if (isEngineInView && !hasVisitedEngine) {
            setShowSpinner(true);
            setHasVisitedEngine(true);
        }
    }, [isEngineInView, hasVisitedEngine]);

    React.useEffect(() => {
        if (showSpinner) {
            const timer = setTimeout(() => {
                setShowSpinner(false);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [showSpinner]);

    // Hide arrow after 3 bounces (each bounce cycle is ~1 second)
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setShowArrow(false);
        }, 3000);
        return () => clearTimeout(timer);
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <div className={`w-full font-sans bg-white text-slate-800`}>
            {/* Intro Section */}
            <div className="min-h-screen flex flex-col justify-center p-8 relative z-10 overflow-hidden">
                {/* Futuristic SVG Background */}
                <FuturisticBackground />

                <div className="max-w-7xl mx-auto space-y-24 relative z-10">
                    <header className="text-center pt-10">
                        <h1 className="text-7xl font-black mb-6 tracking-tighter text-slate-900">
                            Q-Dash Environment
                        </h1>
                        <p className="text-3xl font-light text-slate-600">
                            Advanced Simulation & Data Visualization Platform
                        </p>
                    </header>

                    <section ref={instructionsRef} className="space-y-12">
                        <div className="flex items-center justify-center gap-4">
                            <div className="h-px bg-slate-300 w-24"></div>
                            <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-800">Instructions</h2>
                            <div className="h-px bg-slate-300 w-24"></div>
                        </div>

                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
                            variants={containerVariants}
                            initial="hidden"
                            animate={isInstructionsInView ? "visible" : "hidden"}
                        >
                            {[
                                { title: "Show ENVs", text: "Open the Dashboard to manage environments. Create, delete, and monitor simulation clusters." },
                                { title: "Env Cfg", text: "Configure global simulation settings. Adjust time, dimensions, and physics models." },
                                { title: "Injection ⚡", text: "Design energy profiles. Create custom injection patterns for use in simulations." },
                                { title: "Modules 🧩", text: "Manage code modules. Define algorithms and link them to fields for calculation." },
                                { title: "Fields 📊", text: "Define data fields. Configure parameters and link fields to calculation modules." }
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    variants={itemVariants}
                                    className="p-8 group"
                                >
                                    <h3 className="text-xl font-bold mb-3 text-slate-900 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                                    <p className="leading-relaxed text-slate-700 font-medium">
                                        {item.text}
                                    </p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </section>

                    {showArrow && (
                        <div className="text-center animate-bounce pt-12 pb-12">
                            <p className="text-sm uppercase tracking-widest text-slate-500 mb-2">Scroll to Enter Engine</p>
                            <span className="text-2xl text-slate-400">↓</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Engine Section - Exactly 100vh */}
            <div
                ref={engineRef}
                className="h-screen w-screen relative overflow-hidden flex flex-col bg-white snap-start"
            >
                {/* Spinner Overlay - Removed */}
                {showSpinner && (
                    null
                )}

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={isEngineInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="w-full h-full relative"
                >
                    {/* Background LiveView - Always Light Mode */}
                    <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                        <LiveView
                            data={liveData}
                            isDarkMode={false}
                            onToggleDarkMode={() => { }}
                        />
                    </div>

                    {/* Engine Content */}
                    <div className="relative z-10 w-full h-full overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
                        <div className="max-w-7xl mx-auto space-y-6">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Engine Control Center</h2>
                                <div className="flex gap-2">
                                    <span className="px-3 py-1 text-slate-600 text-xs font-mono font-bold">SYSTEM ONLINE</span>
                                    <span className="px-3 py-1 text-blue-600 text-xs font-mono font-bold">TERMINAL ACTIVE</span>
                                </div>
                            </div>

                            {/* Injected Components (Dashboard, etc.) */}
                            {children}
                        </div>
                    </div>
                </motion.div>
            </div>
        </div >
    );
};

