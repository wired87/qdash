import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, useInView } from 'framer-motion';
import { Select, SelectItem } from '@heroui/react';
import { LiveView } from './LiveView';
import { OscilloscopeView } from './OscilloscopeView';
import { FuturisticBackground } from './FuturisticBackground';
import { ParticleGridEngine } from './ParticleGridEngine';
import { USER_ID_KEY, SESSION_ID_KEY, getSessionId } from '../auth';
import { setActiveSession } from '../store/slices/sessionSlice';


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

export const LandingPage = ({ liveData, setTerminalVisible, isSimRunning, isCfgOpen, children, sendMessage }) => {
    const heroRef = useRef(null);
    const instructionsSectionRef = useRef(null); // Rename to avoid conflict with instructionsRef used for InView
    const engineRef = useRef(null);

    const dispatch = useDispatch();
    const sessions = useSelector((state) => state.sessions.sessions) || [];
    const activeSession = useSelector((state) => state.sessions.activeSession);
    const isInstructionsInView = useInView(instructionsSectionRef, { amount: 0.3 });
    const isEngineInView = useInView(engineRef, { amount: 0.3 });

    // Request user sessions when Engine Control Center is in view (initial load)
    useEffect(() => {
        if (isEngineInView && sendMessage) {
            const userId = localStorage.getItem(USER_ID_KEY);
            if (userId) {
                sendMessage({
                    type: 'LIST_USERS_SESSIONS',
                    auth: { user_id: userId },
                    timestamp: new Date().toISOString()
                });
            }
        }
    }, [isEngineInView, sendMessage]);

    const requestSessionsList = () => {
        if (!sendMessage) return;
        const userId = localStorage.getItem(USER_ID_KEY);
        if (userId) {
            sendMessage({
                type: 'LIST_USERS_SESSIONS',
                auth: { user_id: userId },
                timestamp: new Date().toISOString()
            });
        }
    };

    const [showSpinner, setShowSpinner] = useState(false);
    const [hasVisitedEngine, setHasVisitedEngine] = useState(false);
    const FIRST_VISIT_KEY = 'qdash_welcome_shown';
    const [showWelcome, setShowWelcome] = useState(() => !localStorage.getItem(FIRST_VISIT_KEY));
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
            headline: "The Grid",
            subtext: "Advanced Simulation & Data Visualization Platform."
        },
        {
            headline: "Modular Logic",
            subtext: "Decouple simulation logic from the runtime engine using hot-swappable Python Modules."
        },
        {
            headline: "Spatial Intelligence",
            subtext: "Map abstract data to physical 3D/4D space for intuitive debugging and analysis."
        },
        {
            headline: "Natural Language Control",
            subtext: "Interact with the system via a terminal interface powered by Gemini AI."
        },
        {
            headline: "Graph-Based Execution",
            subtext: "Visualize and manipulate the dependency graph of your simulation in real-time."
        },
        {
            headline: "Open Source",
            subtext: "Explore & contribute to The Grid on GitHub.",
            button: { text: "View Code", url: "https://github.com/wired87/qdash" }
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

    const dismissWelcome = () => {
        setShowWelcome(false);
        localStorage.setItem(FIRST_VISIT_KEY, '1');
    };

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
        <div className="w-screen h-screen font-sans bg-white text-slate-900 overflow-y-scroll snap-y snap-mandatory scroll-smooth relative selection:bg-black selection:text-white">

            {/* TERMINAL HINT OVERLAY */}
            {!isEngineInView && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
                >
                    <div className="bg-white/80 backdrop-blur-md text-black px-6 py-2 rounded-none border border-black shadow-none flex items-center gap-3">
                        <span className="w-1.5 h-1.5 bg-black animate-pulse"></span>
                        <span className="text-[10px] font-mono tracking-[0.2em] uppercase">System Ready <br />Initialize</span>
                        <span className="animate-bounce text-black text-xs">↓</span>
                    </div>
                </motion.div>
            )}

            {/* SECTION 1: HERO (Header + Carousel) */}
            <div ref={heroRef} className="h-screen w-screen flex flex-col justify-center items-center p-8 relative overflow-hidden snap-start bg-white">
                <FuturisticBackground />

                <div className="max-w-7xl w-full mx-auto relative z-10 flex flex-col h-full justify-center">
                    <header className="text-center mb-16">
                        <h1 className="text-6xl font-black mb-4 tracking-tighter text-black uppercase">
                            The Grid
                        </h1>
                        <p className="text-sm font-mono text-slate-500 tracking-[0.3em] uppercase">
                            Advanced Simulation Platform <span className="ml-2 text-[9px] border border-black px-1 py-0.5 bg-black text-white">BETA 2.0</span>
                        </p>
                    </header>

                    <div className="relative w-full overflow-visible flex-grow flex items-center justify-center">
                        <div className="w-full">
                            <div className="w-full flex flex-col items-center">
                                <div className="relative w-full h-[200px] flex items-center justify-center">
                                    {slides.map((slide, index) => (
                                        index === currentSlide && (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, filter: "blur(5px)" }}
                                                animate={{ opacity: 1, filter: "blur(0px)" }}
                                                exit={{ opacity: 0, filter: "blur(5px)" }}
                                                transition={{ duration: 0.6, ease: "easeInOut" }}
                                                className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4 max-w-4xl mx-auto"
                                            >
                                                <h2 className="text-4xl font-black tracking-tight text-black uppercase">
                                                    {slide.headline}
                                                </h2>
                                                <p className="text-lg font-light max-w-2xl mx-auto leading-relaxed text-slate-600 font-mono">
                                                    {slide.subtext}
                                                </p>
                                                {slide.button && (
                                                    <motion.a
                                                        href={slide.button.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        className="px-8 py-3 bg-black text-white border border-black rounded-none font-mono text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center gap-3 mt-6"
                                                    >
                                                        {slide.button.text}
                                                    </motion.a>
                                                )}
                                            </motion.div>
                                        )
                                    ))}
                                </div>
                                <div className="flex items-center justify-center gap-4 pt-12 z-20">
                                    {slides.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setCurrentSlide(idx)}
                                            className={`h-0.5 transition-all duration-500 ${idx === currentSlide ? 'bg-black w-8' : 'bg-slate-300 w-4 hover:bg-slate-400'}`}
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
            <div ref={instructionsSectionRef} className="h-screen w-screen flex flex-col justify-center items-center p-8 relative bg-white snap-start overflow-hidden">
                <div className="max-w-7xl w-full mx-auto relative z-10 space-y-12">
                    <div className="flex items-center justify-center gap-6">
                        <div className="h-px bg-slate-200 w-24"></div>
                        <h2 className="text-xl font-bold uppercase tracking-[0.3em] text-black">System Protocols</h2>
                        <div className="h-px bg-slate-200 w-24"></div>
                    </div>

                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 border border-slate-200"
                        variants={containerVariants}
                        initial="hidden"
                        animate={isInstructionsInView ? "visible" : "hidden"}
                    >
                        {[
                            { title: "Show ENVs", text: "Open the Dashboard to manage environments. Create, delete, and monitor simulation clusters." },
                            { title: "Env Cfg", text: "Configure global simulation settings. Adjust time, dimensions, and physics models." },
                            { title: "Injection", text: "Design energy profiles. Create custom injection patterns for use in simulations." },
                            { title: "Modules", text: "Manage code modules. Define algorithms and link them to fields for calculation." },
                            { title: "Fields", text: "Define data fields. Configure parameters and link fields to calculation modules." },
                            { title: "Updates", text: "Engine is under construction. Tell the terminal to 'subscribe me at [email]' for updates." }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                variants={itemVariants}
                                className="group p-8 bg-white hover:bg-slate-50 transition-colors duration-300"
                            >
                                <div className="flex flex-col h-full justify-between gap-4">
                                    <div>
                                        <h3 className="text-xs font-black mb-3 text-black uppercase tracking-widest">{item.title}</h3>
                                        <p className="leading-relaxed text-slate-500 text-[10px] font-mono uppercase tracking-wide">
                                            {item.text}
                                        </p>
                                    </div>
                                    <div className="w-4 h-0.5 bg-slate-200 group-hover:bg-black transition-colors duration-300"></div>
                                </div>
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
                    className="w-full h-full flex flex-col min-h-0 relative"
                >
                    {/* Full-screen particle grid (entire control center) */}
                    <div className="absolute inset-0 z-0 w-full h-full min-h-0">
                        <ParticleGridEngine className="w-full h-full" />
                    </div>

                    {/* Top bar overlay – responsive */}
                    <header className="relative z-10 flex-shrink-0 flex items-center justify-between border-b border-black/20 px-4 sm:px-6 py-3 sm:py-4 gap-3 sm:gap-4 flex-wrap bg-white/90 backdrop-blur-sm">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className="flex-shrink-0 flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-widest text-black/70">Session</span>
                                <Select
                                    size="sm"
                                    placeholder="Select session"
                                    selectedKeys={activeSession?.id ? [activeSession.id] : (getSessionId() ? [getSessionId()] : [])}
                                    onOpenChange={(open) => {
                                        if (open) requestSessionsList();
                                    }}
                                    onSelectionChange={(keys) => {
                                        const id = Array.from(keys)[0];
                                        if (id) {
                                            const sess = sessions.find(s => (typeof s === 'string' ? s : s.id) === id);
                                            if (sess) {
                                                const sessionObj = typeof sess === 'string' ? { id: sess } : sess;
                                                dispatch(setActiveSession(sessionObj));
                                                sessionStorage.setItem(SESSION_ID_KEY, id);
                                            }
                                        }
                                    }}
                                    className="max-w-[140px] sm:max-w-[200px]"
                                    classNames={{
                                        trigger: 'bg-white border border-black/20 font-mono text-xs',
                                        value: 'text-black'
                                    }}
                                >
                                    {sessions.map((s) => {
                                        const id = typeof s === 'string' ? s : s.id;
                                        const label = typeof s === 'string' ? s : (s.name || s.id || id);
                                        return <SelectItem key={id} textValue={String(label)}>{String(label)}</SelectItem>;
                                    })}
                                </Select>
                            </div>
                            <h2 className="text-lg sm:text-2xl font-black text-black tracking-tighter uppercase flex items-center gap-2 sm:gap-3 truncate">
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black flex-shrink-0"></span>
                                <span className="truncate">Engine Control Center</span>
                            </h2>
                        </div>
                        <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                            <span className="px-2 py-1 border border-black text-black text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">
                                <span className="w-1 h-1 bg-black"></span>
                                ONLINE
                            </span>
                            <span className="px-2 py-1 bg-black text-white text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">
                                <span className="w-1 h-1 bg-white animate-pulse"></span>
                                TERMINAL
                            </span>
                        </div>
                    </header>

                    {/* Content overlay – scrollable, responsive */}
                    <div className="relative z-10 flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent bg-white/80 sm:bg-white/85 backdrop-blur-[1px]">
                        <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
                            {showWelcome && isEngineInView && (
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-black text-white border-2 border-black shadow-lg animate-fadeIn">
                                    <p className="text-base sm:text-lg font-bold tracking-tight">Welcome to the grid</p>
                                    <button
                                        type="button"
                                        onClick={dismissWelcome}
                                        className="flex-shrink-0 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-widest border border-white/50 rounded hover:bg-white/10 transition-colors"
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            )}
                            {children}
                        </div>
                    </div>

                    {/* Background LiveView - Active only when Sim Running and NOT in Config */}
                    {(isSimRunning && !isCfgOpen) && (
                        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none grayscale" aria-hidden>
                            <LiveView
                                data={liveData}
                                isDarkMode={false}
                                onToggleDarkMode={() => { }}
                            />
                        </div>
                    )}

                    {/* Oscilloscope-style visualization (retro n-D params) - when sim running */}
                    {(isSimRunning && !isCfgOpen) && liveData && liveData.length > 0 && (
                        <div className="absolute bottom-4 left-4 right-4 z-20 max-w-4xl mx-auto pointer-events-none">
                            <OscilloscopeView
                                data={liveData}
                                isDarkMode={true}
                                maxSamples={120}
                                showGrid={true}
                                showGlow={true}
                                height={200}
                                className="bg-slate-950/90 shadow-2xl"
                            />
                        </div>
                    )}
                </motion.div>
            </div>
        </div >
    );
};
