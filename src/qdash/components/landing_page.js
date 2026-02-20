import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, useInView } from 'framer-motion';
import { Select, SelectItem } from '@heroui/react';
import { LiveView } from './LiveView';
import { OscilloscopeView } from './OscilloscopeView';
import { FuturisticBackground } from './FuturisticBackground';
import { ParticleGridEngine } from './ParticleGridEngine';
import EngineFormsSidebar from './EngineFormsSidebar';
import ImageTo3DModal, { processImageFile } from './ImageTo3DModal';
import EngineEnvsSidebar from './EngineEnvsSidebar';
import EnvCfgGlassPanel from './EnvCfgGlassPanel';
import ConfigAccordion from './accordeon';
import { USER_ID_KEY, SESSION_ID_KEY, getSessionId } from '../auth';
import { setActiveSession, addSession } from '../store/slices/sessionSlice';
import { setSelectedEnv, selectSelectedEnv } from '../store/slices/envSlice';
import { clearCurrentEnv, setSelectedGeometry, selectSelectedGeometry } from '../store/slices/appStateSlice';
import { setLoading as setInjectionLoading } from '../store/slices/injectionSlice';
import { X, Plus } from 'lucide-react';
import { Button } from '@heroui/react';

export const LandingPage = ({
    liveData,
    setTerminalVisible,
    isSimRunning,
    isCfgOpen,
    children,
    sendMessage,
    isEnvCfgPanelOpen,
    onOpenEnvCfg,
    onCloseEnvCfg,
    user,
    userProfile,
    saveUserWorldConfig,
    listenToUserWorldConfig,
}) => {
    const heroRef = useRef(null);
    const instructionsSectionRef = useRef(null); // Rename to avoid conflict with instructionsRef used for InView
    const engineRef = useRef(null);

    const dispatch = useDispatch();
    const sessions = useSelector((state) => state.sessions.sessions) || [];
    const activeSession = useSelector((state) => state.sessions.activeSession);
    const selectedEnv = useSelector(selectSelectedEnv);
    const selectedGeometry = useSelector(selectSelectedGeometry);
    const userInjections = useSelector((state) => state.injections.userInjections || []);
    const injectionsLoading = useSelector((state) => state.injections.loading);
    const isInstructionsInView = useInView(instructionsSectionRef, { amount: 0.3 });
    const isEngineInView = useInView(engineRef, { amount: 0.3 });

    // Request user sessions and user envs when Engine Control Center is in view (initial load)
    useEffect(() => {
        if (isEngineInView && sendMessage) {
            const userId = localStorage.getItem(USER_ID_KEY);
            if (userId) {
                // Sessions list
                sendMessage({
                    type: 'LIST_USERS_SESSIONS',
                    auth: { user_id: userId },
                    timestamp: new Date().toISOString()
                });
                // User environments for left engine sidebar
                sendMessage({
                    type: 'GET_USERS_ENVS',
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
    const [droppedForms, setDroppedForms] = useState([]);
    const [isDragOverEnv, setIsDragOverEnv] = useState(false);
    const [hoverEnv, setHoverEnv] = useState(null);
    const [hoverInjectionType, setHoverInjectionType] = useState(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    const handleEnvDragOver = useCallback((e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        setIsDragOverEnv(true);
    }, []);
    const handleEnvDragLeave = useCallback((e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOverEnv(false);
    }, []);
    const handleEnvDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragOverEnv(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = Array.from(files).find((f) => /^image\/(png|jpeg|jpg|webp)$/i.test(f.type));
            if (file) {
                processImageFile(file).then(({ data, width, height }) => {
                    const id = `form-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                    setDroppedForms((prev) => [...prev, { id, type: 'image_3d', heightmap: data, heightmapWidth: width, heightmapHeight: height }]);
                }).catch(() => {});
                return;
            }
        }

        const formType = e.dataTransfer.getData('application/x-qdash-form') || e.dataTransfer.getData('text/plain');
        if (!formType) return;
        if (formType === 'image_3d') {
            setIsImageModalOpen(true);
            return;
        }
        if (!['rect', 'triangle', 'box'].includes(formType)) return;
        setDroppedForms((prev) => [...prev, { id: `form-${Date.now()}-${Math.random().toString(36).slice(2)}`, type: formType }]);
    }, []);
    // const [showArrow, setShowArrow] = useState(true); // Removed floating arrow logic as we have full sections now
    const [currentSlide, setCurrentSlide] = useState(0);

    // Control Terminal Visibility based on Engine View
    React.useEffect(() => {
        if (setTerminalVisible) {
            setTerminalVisible(isEngineInView);
        }
    }, [isEngineInView, setTerminalVisible]);

    const slides = [
        { headline: "The Grid", subtext: "nD simulation & viz." },
        { headline: "Modular Logic", subtext: "Hot-swappable Python modules." },
        { headline: "Spatial Intelligence", subtext: "Data in 13/nD space." },
        { headline: "Natural Language", subtext: "Terminal + Gemini AI." },
        { headline: "Graph Execution", subtext: "Dependency graph in real time." },
        {
            headline: "Open Source",
            subtext: "The Grid on GitHub.",
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

    // When hovering a geometry icon on the right, ensure injections are loaded
    useEffect(() => {
        if (!hoverInjectionType || !sendMessage) return;
        if (userInjections && userInjections.length > 0) return;
        const userId = localStorage.getItem(USER_ID_KEY);
        if (!userId) return;
        dispatch(setInjectionLoading(true));
        sendMessage({
            type: "GET_INJ_USER",
            auth: { user_id: userId },
            timestamp: new Date().toISOString(),
        });
    }, [hoverInjectionType, sendMessage, userInjections, dispatch]);

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
                    {/* Engine viewport full width with absolute side views – drop zone covers entire area including sidebars */}
                    <div
                        className={`absolute inset-0 z-0 transition-all duration-200 ${isDragOverEnv ? 'ring-4 ring-amber-500/60 ring-inset' : ''}`}
                        onDragOver={handleEnvDragOver}
                        onDragLeave={handleEnvDragLeave}
                        onDrop={handleEnvDrop}
                    >
                        {isDragOverEnv && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                                <span className="px-4 py-2 bg-stone-900/90 text-amber-400 font-mono text-sm uppercase tracking-widest rounded border border-amber-500/50 shadow-lg">
                                    Drop form here
                                </span>
                            </div>
                        )}
                        {/* Left env cfg glass panel when open */}
                        {isEnvCfgPanelOpen && (
                            <div className="absolute inset-y-0 left-0 z-30">
                                <EnvCfgGlassPanel
                                    isOpen={true}
                                    onClose={onCloseEnvCfg}
                                    sendMessage={sendMessage}
                                    user={user}
                                    userProfile={userProfile}
                                    saveUserWorldConfig={saveUserWorldConfig}
                                    listenToUserWorldConfig={listenToUserWorldConfig}
                                />
                            </div>
                        )}

                        {/* Engine viewport – rounded card, takes full width */}
                        <div className="w-full h-full relative transition-all duration-200 px-1 sm:px-2">
                            <div className="w-full h-full rounded-xl sm:rounded-2xl overflow-hidden border border-slate-800/40 shadow-[0_18px_45px_rgba(0,0,0,0.45)] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
                                <ParticleGridEngine
                                    className="w-full h-full"
                                    droppedForms={droppedForms}
                                    envConfig={selectedEnv ? { dims: selectedEnv.dims, amount_of_nodes: selectedEnv.amount_of_nodes ?? selectedEnv.cluster_dim, distance: selectedEnv.distance ?? 0 } : null}
                                    selectedGeometry={selectedGeometry}
                                />
                            </div>
                            {/* Env cfg modal: backdrop shows engine; centered modal with config */}
                            {selectedEnv && (
                                <div
                                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                                    role="dialog"
                                    aria-modal="true"
                                    aria-label="Environment configuration"
                                >
                                    <div
                                        className="absolute inset-0 transition-opacity"
                                        style={{
                                            background: 'rgba(0, 0, 0, 0.35)',
                                            backdropFilter: 'blur(8px)',
                                            WebkitBackdropFilter: 'blur(8px)',
                                        }}
                                        onClick={() => { dispatch(setSelectedEnv(null)); dispatch(clearCurrentEnv()); }}
                                    />
                                    <div
                                        className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-xl border border-white/20 overflow-hidden shadow-2xl"
                                        style={{
                                            background: 'rgba(15, 23, 42, 0.88)',
                                            backdropFilter: 'blur(16px)',
                                            WebkitBackdropFilter: 'blur(16px)',
                                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10">
                                            <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-300/95">
                                                Env: {selectedEnv.id ?? selectedEnv.env_id}
                                            </span>
                                            <Button
                                                aria-label="Close environment config"
                                                isIconOnly
                                                size="sm"
                                                variant="light"
                                                className="min-w-8 w-8 h-8 text-slate-400 hover:text-white"
                                                onPress={() => { dispatch(setSelectedEnv(null)); dispatch(clearCurrentEnv()); }}
                                                title="Close"
                                            >
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <div className="flex-1 min-h-0 overflow-y-auto p-4">
                                            <ConfigAccordion
                                                sendMessage={sendMessage}
                                                initialValues={{
                                                    id: selectedEnv.id ?? selectedEnv.env_id,
                                                    amount_of_nodes: selectedEnv.amount_of_nodes ?? selectedEnv.cluster_dim,
                                                    sim_time: selectedEnv.sim_time,
                                                    dims: selectedEnv.dims,
                                                    enable_sm: selectedEnv.enable_sm,
                                                    particle: selectedEnv.particle,
                                                    status: selectedEnv.status ?? selectedEnv.state,
                                                    field_id: selectedEnv.field_id ?? selectedEnv.field,
                                                    distance: selectedEnv.distance ?? 0,
                                                }}
                                                shouldShowDefault={false}
                                                user={user}
                                                userProfile={userProfile}
                                                saveUserWorldConfig={saveUserWorldConfig}
                                                listenToUserWorldConfig={listenToUserWorldConfig}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Left env dock – absolute over engine, mid-left; z-50 so it stays above overlays and remains clickable */}
                        <div className="absolute inset-y-0 left-0 flex items-center justify-center z-50">
                            <div className="w-16 sm:w-[200px] md:w-[260px]">
                                <EngineEnvsSidebar
                                    className="w-full max-h-[60vh]"
                                    sendMessage={sendMessage}
                                    onOpenEnvCfg={onOpenEnvCfg}
                                    isVisible={isEngineInView}
                                    onHoverEnv={setHoverEnv}
                                />
                            </div>
                        </div>

                        {/* Right forms sidebar – absolute over engine, mid-right; z-50 so it stays above hover panels (z-40) and remains clickable/draggable */}
                        <div className="absolute inset-y-0 right-0 hidden md:flex items-center justify-center z-50">
                            <div className="w-16 sm:w-[220px] md:w-[260px]">
                                <EngineFormsSidebar
                                    className="h-full"
                                    selectedGeometry={selectedGeometry}
                                    onSelectType={(id) => dispatch(setSelectedGeometry(id ?? null))}
                                    onHoverType={setHoverInjectionType}
                                    onOpenImageModal={() => setIsImageModalOpen(true)}
                                />
                            </div>
                        </div>

                        {/* Hover cfg panel: full height, right side 40% width (env cfg) */}
                        {hoverEnv && (
                            <div className="fixed inset-y-0 right-0 z-40 w-[40vw] min-w-[320px] max-w-xl border-l border-slate-200/40 bg-slate-950/90 text-slate-100 shadow-2xl flex flex-col">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-200">
                                            Env cfg
                                        </span>
                                        <span className="text-[11px] font-mono text-slate-400 truncate max-w-[240px]">
                                            {hoverEnv.id ?? hoverEnv.env_id}
                                        </span>
                                    </div>
                                    <Button
                                        aria-label="Close env config panel"
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        className="min-w-8 w-8 h-8 text-slate-300 hover:text-white"
                                        onPress={() => setHoverEnv(null)}
                                        title="Close"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex-1 min-h-0 overflow-y-auto p-4">
                                    <pre className="text-[11px] font-mono whitespace-pre-wrap break-all bg-slate-900/70 border border-slate-700/80 rounded-lg p-3">
{JSON.stringify(hoverEnv, null, 2)}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {/* Injection modal on geometry hover – full height, right side 40% width */}
                        {hoverInjectionType && (
                            <div className="fixed inset-y-0 right-0 z-40 w-[40vw] min-w-[320px] max-w-xl border-l border-emerald-400/40 bg-slate-950/95 text-slate-100 shadow-2xl flex flex-col">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-900/80">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-300">
                                            Injections · {hoverInjectionType}
                                        </span>
                                        <span className="text-[11px] font-mono text-slate-400">
                                            {userInjections?.length || 0} total
                                        </span>
                                    </div>
                                    <Button
                                        aria-label="Close injections panel"
                                        isIconOnly
                                        size="sm"
                                        variant="light"
                                        className="min-w-8 w-8 h-8 text-slate-300 hover:text-white"
                                        onPress={() => setHoverInjectionType(null)}
                                        title="Close"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
                                    {injectionsLoading && (
                                        <div className="text-[11px] text-slate-400 font-mono uppercase tracking-widest">
                                            Loading injections…
                                        </div>
                                    )}
                                    {!injectionsLoading && (!userInjections || userInjections.length === 0) && (
                                        <div className="text-[11px] text-slate-500 font-mono uppercase tracking-widest">
                                            No injections found
                                        </div>
                                    )}
                                    {!injectionsLoading && userInjections && userInjections.length > 0 && (() => {
                                        const matchesType = (inj) => {
                                            const t = (inj.geometry || inj.shape || inj.type || '').toLowerCase();
                                            return t === hoverInjectionType.toLowerCase();
                                        };
                                        const primary = userInjections.filter(matchesType);
                                        const list = primary.length > 0 ? primary : userInjections;
                                        return list.map((inj) => (
                                            <div
                                                key={inj.id}
                                                className="p-3 rounded-lg border border-slate-700/80 bg-slate-900/80 hover:border-emerald-400/70 transition-colors"
                                            >
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className="text-[11px] font-mono font-semibold truncate">
                                                        {inj.id}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-slate-500">
                                                        {(inj.type || inj.geometry || hoverInjectionType) ?? 'unknown'}
                                                    </span>
                                                </div>
                                                {inj.description && (
                                                    <p className="text-[11px] text-slate-300 line-clamp-2">
                                                        {inj.description}
                                                    </p>
                                                )}
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Top bar overlay – responsive */}
                    <header className="relative z-10 flex-shrink-0 flex items-center justify-between border-b border-black/20 px-4 sm:px-6 py-3 sm:py-4 gap-3 sm:gap-4 flex-wrap bg-white/90 backdrop-blur-sm">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <div className="flex-shrink-0 flex flex-col gap-0.5 sm:gap-1">
                                <span className="text-[8px] sm:text-[9px] font-mono font-bold uppercase tracking-widest text-black/70">Session</span>
                                <div className="flex items-center gap-1">
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
                                    <Button
                                        aria-label="Create session"
                                        isIconOnly
                                        size="sm"
                                        variant="flat"
                                        className="min-w-8 w-8 h-8 border border-black/20"
                                        onPress={() => {
                                            const newId = `session-${Date.now()}`;
                                            const newSession = { id: newId, created_at: new Date().toISOString() };
                                            dispatch(addSession(newSession));
                                            dispatch(setActiveSession(newSession));
                                            sessionStorage.setItem(SESSION_ID_KEY, newId);
                                            sendMessage?.({ type: 'CREATE_SESSION', auth: { user_id: localStorage.getItem(USER_ID_KEY) }, session_id: newId });
                                        }}
                                        title="Create session"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
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

            <ImageTo3DModal
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                onAddToScene={(form) => setDroppedForms((prev) => [...prev, form])}
            />
        </div >
    );
};
