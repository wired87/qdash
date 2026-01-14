import React, { useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { LiveView } from './LiveView';
import { FuturisticBackground } from './FuturisticBackground';


const ColorizedText = ({ text }) => {
    // Fundamental minimalistic color stack
    const colors = [
        "text-fundamental-blue",
        "text-fundamental-red",
        "text-fundamental-yellow",
        "text-fundamental-green",
        "text-fundamental-orange",
        "text-fundamental-violet"
    ];

    if (typeof text !== 'string') return text; // Fallback for JSX

    return (
        <span className="font-black drop-shadow-sm">
            {text.split(" ").map((word, wordIndex) => {
                // "Technical magical" logic: Sparse coloring (roughly 1 in 3), or long words
                const isColored = (wordIndex % 3 === 0);

                const colorClass = isColored
                    ? colors[wordIndex % colors.length]
                    : "text-slate-400"; // Muted gray for contrast

                const animationClass = isColored ? "animate-pulse" : "";

                return (
                    <span key={wordIndex} className={`${colorClass} ${animationClass} inline-block mr-3`}>
                        {word}
                    </span>
                );
            })}
        </span>
    );
};

export const LandingPage = ({ liveData, setTerminalVisible, children }) => {
    const heroRef = useRef(null);
    const instructionsSectionRef = useRef(null); // Rename to avoid conflict with instructionsRef used for InView
    const engineRef = useRef(null);

    const isInstructionsInView = useInView(instructionsSectionRef, { amount: 0.3 });
    const isEngineInView = useInView(engineRef, { amount: 0.3 });

    const [showSpinner, setShowSpinner] = useState(false);
    const [hasVisitedEngine, setHasVisitedEngine] = useState(false);
    // const [showArrow, setShowArrow] = useState(true); // Removed floating arrow logic as we have full sections now
    const [currentSlide, setCurrentSlide] = useState(0);

    // Control Terminal Visibility based on Engine View
    React.useEffect(() => {
        if (setTerminalVisible) {
            setTerminalVisible(isEngineInView);
        }
    }, [isEngineInView, setTerminalVisible]);

    const slides = [
        {
            headline: "🚀 Engine Under Construction",
            subtext: "Building the future of modular simulation."
        },
        {
            headline: "🔬 Beta Testing Open",
            subtext: "Research institutions: Join our early access program.",
            button: { text: "Apply Now", url: "mailto:contact@thegrid.io?subject=Beta Access Request" }
        },
        {
            headline: "🤝 Partner with Us",
            subtext: "Collaborate on next-gen simulation infrastructure."
        },
        {
            headline: "💡 Open Source",
            subtext: "Explore & contribute to The Grid on GitHub.",
            button: { text: "View Code", url: "https://github.com/wired87/qdash" }
        },
        {
            headline: "📰 Latest: Multi-Field Support",
            subtext: "New module system enables complex data flows."
        },
        {
            headline: "🌐 About The Grid",
            subtext: "Modular simulation platform for distributed computing."
        }
    ];

    React.useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

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
        <div className="w-screen h-screen font-sans bg-white text-slate-800 overflow-y-scroll snap-y snap-mandatory scroll-smooth relative">

            {/* TERMINAL HINT OVERLAY */}
            {!isEngineInView && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
                >
                    <div className="bg-slate-900/80 backdrop-blur-md text-white px-6 py-2 rounded-full border border-slate-700 shadow-2xl flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="text-sm font-mono tracking-widest uppercase">Welcome to the Grid! <br />Scroll down to activate The Engine</span>
                        <span className="animate-bounce">↓</span>
                    </div>
                </motion.div>
            )}

            {/* SECTION 1: HERO (Header + Carousel) */}
            <div ref={heroRef} className="h-screen w-screen flex flex-col justify-center items-center p-8 relative overflow-hidden snap-start">
                <FuturisticBackground />

                <div className="max-w-7xl w-full mx-auto relative z-10 flex flex-col h-full justify-center">
                    <header className="text-center mb-16">
                        <h1 className="text-8xl font-black mb-8 tracking-tighter text-slate-900">
                            The Grid
                        </h1>
                        <p className="text-4xl font-light text-slate-600">
                            Advanced Simulation & Data Visualization Platform (Under Construction)
                        </p>
                    </header>

                    <div className="relative w-full overflow-visible flex-grow flex items-center justify-center">
                        <div className="w-full">
                            <div className="w-full flex flex-col items-center">
                                <div className="relative w-full h-[300px] flex items-center justify-center">
                                    {slides.map((slide, index) => (
                                        index === currentSlide && (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, x: 100 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -100 }}
                                                transition={{ duration: 0.8, ease: "easeInOut" }}
                                                className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-8 max-w-6xl mx-auto"
                                            >
                                                <h2 className="text-7xl font-black tracking-tighter leading-tight drop-shadow-sm">
                                                    <ColorizedText text={slide.headline} />
                                                </h2>
                                                <p className="text-3xl font-bold max-w-4xl mx-auto leading-relaxed">
                                                    <ColorizedText text={slide.subtext} />
                                                </p>
                                                {slide.button && (
                                                    <motion.a
                                                        href={slide.button.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        className="px-10 py-4 bg-white/90 text-slate-900 rounded-full font-bold shadow-xl hover:shadow-2xl hover:bg-white transition-all flex items-center gap-3 mt-8 text-xl"
                                                    >
                                                        <svg height="28" width="28" viewBox="0 0 16 16" fill="currentColor">
                                                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                                                        </svg>
                                                        {slide.button.text}
                                                    </motion.a>
                                                )}
                                            </motion.div>
                                        )
                                    ))}
                                </div>
                                <div className="flex items-center justify-center gap-6 pt-16 z-20">
                                    {slides.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentSlide(idx)}
                                            className={`h-3 w-3 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-blue-600 scale-150' : 'bg-slate-300 hover:bg-slate-400'}`}
                                            aria-label={`Go to slide ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: INSTRUCTIONS */}
            <div ref={instructionsSectionRef} className="h-screen w-screen flex flex-col justify-center items-center p-8 relative bg-slate-50 snap-start overflow-hidden">
                <div className="max-w-7xl w-full mx-auto relative z-10 space-y-16">
                    <div className="flex items-center justify-center gap-6">
                        <div className="h-px bg-slate-300 w-32"></div>
                        <h2 className="text-4xl font-bold uppercase tracking-widest text-slate-800">System Instructions</h2>
                        <div className="h-px bg-slate-300 w-32"></div>
                    </div>

                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate={isInstructionsInView ? "visible" : "hidden"}
                    >
                        {[
                            { title: "Show ENVs", text: "Open the Dashboard to manage environments. Create, delete, and monitor simulation clusters." },
                            { title: "Env Cfg", text: "Configure global simulation settings. Adjust time, dimensions, and physics models." },
                            { title: "Injection ⚡", text: "Design energy profiles. Create custom injection patterns for use in simulations." },
                            { title: "Modules 🧩", text: "Manage code modules. Define algorithms and link them to fields for calculation." },
                            { title: "Fields 📊", text: "Define data fields. Configure parameters and link fields to calculation modules." },
                            { title: "Updates 📧", text: "Engine is under construction. Tell the terminal to 'subscribe me at [email]' for updates." }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                whileHover={{ scale: 1.03, y: -3 }}
                                className="p-5 bg-white/40 backdrop-blur-sm rounded-xl border border-slate-200/50 transition-all duration-300 hover:bg-white/60 hover:border-slate-300/60"
                            >
                                <h3 className="text-sm font-bold mb-2 text-slate-900 uppercase tracking-wide">{item.title}</h3>
                                <p className="leading-snug text-slate-600 text-xs">
                                    {item.text}
                                </p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>

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

