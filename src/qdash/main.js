import React, { useState, useCallback, useRef, useEffect } from "react";
import { useEnvStore } from "./env_store";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "@heroui/react";


import "../index.css";
import WorldCfgCreator from "./components/world_cfg";
import _useWebSocket from "./websocket";
import { USER_ID_KEY } from "./auth";
import Dashboard from "./components/dash";
import { useFirebaseListeners } from "./firebase";
import { getNodeColor } from "./get_color";
import { NodeInfoPanel } from "./components/node_info_panel";
import { ThreeScene } from "./_use_three";
import TerminalConsole from "./components/terminal";
import { classifyAndRespond, analyzeCommand } from "./gemini";
import NCfgCreator from "./components/node_cfg/ncfg_slider";
import LogSidebar from "./components/log_sidebar";
import { ClusterVisualizerModal } from "./components/cluster_visualizer";
import { LandingPage } from "./components/landing_page";
import { initializeVoice, processVoiceInput } from "./voice_logic";


import { AuthForm } from "./components/AuthForm";
import { DataSlider } from "./components/DataSlider";
import { UserCard } from "./components/UserCard";
import EnergyDesignerWithViz from "./components/EnergyDesignerWithViz";
import BillingManager from "./components/BillingManager";

import ModuleDesigner from "./components/ModuleDesigner";
import MethodDesigner from "./components/MethodDesigner";
import FieldDesigner from "./components/FieldDesigner";
import SessionConfig from "./components/SessionConfig";
import ParamConfig from "./components/ParamConfig";
import { createOrUpdateUser, updateUserPlan as firestoreUpdateUserPlan, trackResourceUsage } from "./utils/firestoreUserManager";

export const MainApp = () => {
  // 1. ALL STATE DECLARATIONS
  // const [nodes, setNodes] = useState([]); // Unused
  // const [edges, setEdges] = useState([]); // Unused
  const [fbCreds, setFbCreds] = useState(null);
  const [inputValue, setInputValue] = useState("");
  // const [error, setError] = useState(""); // Unused
  const [authError, setAuthError] = useState(null);

  const [isLogSidebarOpen, setIsLogSidebarOpen] = useState(false);
  const [isDataSliderOpen, setIsDataSliderOpen] = useState(false);
  const [isCfgSliderOpen, setIsCfgSliderOpen] = useState(false);
  const [isClusterModalOpen, setIsClusterModalOpen] = useState(false);
  const [isDashOpen, setIsDashOpen] = useState(false);
  const [isNSliderOpen, setIsNSliderOpen] = useState(false);
  const [isBucketOpen, setIsBucketOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isModuleDesignerOpen, setIsModuleDesignerOpen] = useState(false);
  const [isMethodDesignerOpen, setIsMethodDesignerOpen] = useState(false);
  const [isFieldDesignerOpen, setIsFieldDesignerOpen] = useState(false);
  const [isSessionConfigOpen, setIsSessionConfigOpen] = useState(false);
  const [isParamConfigOpen, setIsParamConfigOpen] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const [envs, setEnvs] = useState({});
  const [clickedNode, setClickedNode] = useState(null);
  const [nodeSliderOpen, setNodeOpen] = useState(false);
  const [graph, setGraph] = useState({
    nodes: [],
    edges: [],
  });
  const [clusterData, setClusterData] = useState([]);
  const [messages, setMessages] = useState([]);
  const [extractedEntities, setExtractedEntities] = useState({});

  // Terminal visibility state
  const [isTerminalVisible, setIsTerminalVisible] = useState(false);
  // const [isNCFGModalOpen, setIsNCFGModalOpen] = useState(false); // Unused
  // const [activeGridPos, setActiveGridPos] = useState(null); // Unused
  const scrollContainerRef = useRef(null);

  // Voice Control State
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const recognitionRef = useRef(null);

  // Injection Designer State
  const [injectionEnvId, setInjectionEnvId] = useState(null);
  const [injectionData] = useState({
    blocks: [{
      id: Date.now(),
      points: [
        { id: 0, x: 50, y: 150 },
        { id: 1, x: 550, y: 150 },
      ],
      output: [],
      selectedTools: [],
    }],
  });
  // const [setInjectionData] = useState(...); // Unused

  const [liveData, setLiveData] = useState([
    [0, 12.5, 45.2, 88.1, 23.4, 67.8, 90.1],
    [1, 13.2, 46.1, 87.5, 24.1, 68.2, 89.5],
    [2, 14.1, 47.3, 86.9, 25.0, 69.1, 88.9],
    [3, 14.8, 48.5, 86.2, 25.8, 70.5, 88.2],
    [4, 15.5, 49.2, 85.8, 26.5, 71.2, 87.6],
    [5, 16.2, 50.1, 85.1, 27.2, 72.0, 87.1],
    [6, 16.9, 51.0, 84.5, 28.0, 72.8, 86.5],
    [7, 17.5, 51.8, 83.9, 28.7, 73.5, 85.9],
    [8, 18.2, 52.6, 83.2, 29.5, 74.2, 85.3],
    [9, 18.9, 53.4, 82.6, 30.2, 75.0, 84.8],
  ]);

  // const [dataset, setDataset] = useState({ keys: [], rows: [] }); // Unused

  const [logs, setLogs] = useState({
    node_1: {
      err: ["Connection timeout at 14:30:15", "Failed to process request #1234", "Memory leak detected in module XYZ"],
      out: ["Server started successfully", "Processing 15 requests", "Memory usage: 45%", "Cache cleared successfully", "Database connection established"],
    },
    node_2: {
      err: ["Disk space warning: 85% full", "Query timeout after 30s"],
      out: ["Database connected", "Query executed in 0.03ms", "Backup completed", "Index rebuild finished", "Replication sync completed"],
    },
    node_3: {
      err: ["Network interface down", "Failed to bind to port 80", "SSL certificate expired"],
      out: ["Load balancer initialized", "Health check passed"],
    },
  });

  // 2. HELPER FUNCTIONS & CALLBACKS
  const updateNodesliderOpen = useCallback(() => {
    setNodeOpen(prev => !prev);
  }, []);

  const updateNodeInfo = useCallback((nodeId, env_id, gridPos) => {
    console.log(`${nodeId} interaction detected`, gridPos);
    if (gridPos) {
      // setActiveGridPos(gridPos); // Unused
      setClickedNode({ id: nodeId });
      // setIsNCFGModalOpen(true); // Unused
      return;
    }
    setClickedNode({
      env: env_id,
      node: envs[env_id]?.nodes[nodeId],
    });
    setNodeOpen(true);
  }, [envs]);

  const addEnvs = useCallback((data) => {
    setEnvs(prev => ({ ...prev, ...data }));
  }, []);

  const deleteEnv = useCallback((env_id) => {
    setEnvs(prev => {
      const newEnvs = { ...prev };
      delete newEnvs[env_id];
      return newEnvs;
    });
    // Also sync with global store
    useEnvStore.getState().removeEnv(env_id);
  }, []);

  const updatenodeColor = useCallback((listener_type, env_id, data, new_color) => {
    if (new_color === null) return;
    setEnvs(prev => ({
      ...prev,
      [env_id]: {
        ...prev[env_id],
        [listener_type]: {
          ...prev[env_id][listener_type],
          [data.id]: {
            ...prev[env_id][listener_type][data.id],
            color: new_color,
          },
        },
      },
    }));
  }, []);

  const updateEnv = useCallback((listener_type, env_id, data) => {
    if (listener_type === "status") {
      setEnvs(prev => {
        const updated = { ...prev };
        if (updated[env_id]) updated[env_id] = { ...updated[env_id], status: data };
        return updated;
      });
      return;
    }
    if (listener_type === "logs") {
      setLogs(prev => ({ ...prev, ...data }));
      return;
    }
    if (listener_type === "cluster_data") {
      setClusterData(data);
      return;
    }
    if (listener_type === "meta") {
      const state = data.status.state;
      let new_color = getNodeColor(state);
      updatenodeColor(listener_type, env_id, data, new_color);
    }
    setEnvs(prev => {
      const updated = { ...prev };
      if (updated[env_id] && updated[env_id][listener_type] && updated[env_id][listener_type][data.id]) {
        updated[env_id][listener_type][data.id] = { ...updated[env_id][listener_type][data.id], ...data };
      }
      return updated;
    });
  }, [updatenodeColor]);

  const updateCreds = useCallback((data) => {
    if (data) setFbCreds({ creds: data.creds, db_path: data.db_path, listener_paths: data.listener_paths });
    else setFbCreds(null);
  }, []);

  // const updateDataset = useCallback((data) => setDataset(data), []); // Unused
  const updateDataset = useCallback((data) => { }, []); // Empty call back to satisfy websocket signature or update signature manually. 
  // Actually, better to just keep it empty or log, as removing it from _useWebSocket calls would require editing another file we just touched.
  // The prompt says "setDataset is not defined". 

  const updateGraph = useCallback((g) => setGraph(g), []);

  const handleInjectionMessage = useCallback((message) => {
    if (message.type === "INJ_PATTERN_STRUCT_ERR") {
      setMessages(prev => [...prev, { text: `⚠️ Gemini Error: ${message.data}`, type: 'gemini', timestamp: new Date().toISOString() }]);
    } else if (message.type === "INJ_PATTERN_STRUCT") {
      const { env_id, data } = message;
      setEnvs(prev => (prev[env_id] ? { ...prev, [env_id]: { ...prev[env_id], ...data } } : prev));
    }
  }, []);

  const addConsoleMessage = useCallback((text, type = 'system') => {
    setMessages(prev => [...prev, { text: text, type, timestamp: new Date().toISOString() }]);
  }, []);

  // 3. HOOKS THAT DEPEND ON CALLBACKS
  const { sendMessage, isConnected } = _useWebSocket(
    updateCreds, updateDataset, addEnvs, updateGraph, setClusterData, setLiveData, handleInjectionMessage, addConsoleMessage
  );

  const {
    fbIsConnected, firebaseDb, saveMessage, user, userProfile, signInWithEmail, signUpWithEmail, logout,
    saveUserWorldConfig, listenToUserWorldConfig, updateUser, loading, error: authErrorState
  } = useFirebaseListeners(fbCreds, updateEnv, setMessages);

  // 4. ACTION TOGGLES
  const handleLogin = async (email, password) => {
    try { setAuthError(null); await signInWithEmail(email, password); }
    catch (e) { setAuthError(e); }
  };

  const handleSignup = async (email, password) => {
    try { setAuthError(null); await signUpWithEmail(email, password); }
    catch (e) { setAuthError(e); }
  };

  // Firestore: Create/Update user document on login
  useEffect(() => {
    const initializeUserDocument = async () => {
      if (firebaseDb && user && fbIsConnected) {
        try {
          const userDoc = await createOrUpdateUser(firebaseDb, user);
          if (userDoc) {
            setMessages(prev => [...prev, {
              text: `✅ Welcome ${userDoc.display_name || user.email}! Plan: ${userDoc.plan?.toUpperCase() || 'FREE'}`,
              type: 'system',
              timestamp: new Date().toISOString()
            }]);
          }
        } catch (error) {
          console.error('Failed to initialize user document:', error);
          setMessages(prev => [...prev, {
            text: `⚠️ Warning: Could not sync user profile`,
            type: 'system',
            timestamp: new Date().toISOString()
          }]);
        }
      }
    };

    initializeUserDocument();
  }, [firebaseDb, user, fbIsConnected]);

  const updateInputValue = useCallback((value) => setInputValue(value), []);
  const toggleDataSlider = useCallback(() => setIsDataSliderOpen(prev => !prev), []);
  const toggleLogSidebar = useCallback(() => setIsLogSidebarOpen(prev => !prev), []);
  const toggleClusterModal = useCallback(() => setIsClusterModalOpen(prev => !prev), []);
  const toggleNcfgSlider = useCallback(() => setIsNSliderOpen(prev => !prev), []);
  const toggleDahboard = useCallback(() => setIsDashOpen(prev => !prev), []);
  const toggleCfgSlider = useCallback(() => setIsCfgSliderOpen(prev => !prev), []);
  const toggleBucket = useCallback(() => setIsBucketOpen(prev => !prev), []);
  const toggleBilling = useCallback(() => setIsBillingOpen(prev => !prev), []);
  const toggleModuleDesigner = useCallback(() => setIsModuleDesignerOpen(prev => !prev), []);
  const toggleMethodDesigner = useCallback(() => setIsMethodDesignerOpen(prev => !prev), []);
  const toggleFieldDesigner = useCallback(() => setIsFieldDesignerOpen(prev => !prev), []);
  const toggleSessionConfig = useCallback(() => setIsSessionConfigOpen(prev => !prev), []);
  const toggleParamConfig = useCallback(() => setIsParamConfigOpen(prev => !prev), []);

  const updateUserPlan = useCallback(async (uid, planData) => {
    try {
      // Use Firestore update if plan is being changed
      if (firebaseDb && planData.plan) {
        await firestoreUpdateUserPlan(firebaseDb, uid, planData.plan);
      } else if (updateUser) {
        // Fallback to original updateUser for other updates
        await updateUser(uid, planData);
      }
      setMessages(prev => [...prev, {
        text: `✅ Plan updated successfully to ${planData.plan?.toUpperCase() || 'updated'}`,
        type: 'system',
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Failed to update plan:', error);
      setMessages(prev => [...prev, {
        text: `❌ Failed to update plan: ${error.message}`,
        type: 'system',
        timestamp: new Date().toISOString()
      }]);
      alert('Failed to update plan');
    }
  }, [updateUser, firebaseDb, setMessages]);

  const toggleModal = useCallback((env_id) => {
    if (env_id) setSelectedEnv(env_id);
    setIsOpen(prev => !prev);
  }, []);

  const requestClusterData = useCallback((env_id) => {
    const userId = localStorage.getItem(USER_ID_KEY);
    sendMessage({
      auth: {
        user_id: userId,
        env_id: env_id
      },
      data: {},
      type: "GET_CLUSTER_DATA",
      status: {
        error: null,
        state: "pending",
        message: "Fetching cluster data",
        code: null
      }
    });
    toggleClusterModal();
  }, [sendMessage, toggleClusterModal]);

  const toggleInjection = useCallback(() => {
    setInjectionEnvId(prev => prev === null ? 'standalone' : null);
  }, []);

  const handleCloseInjection = useCallback(() => {
    setInjectionEnvId(null);
  }, []);

  const handleSendInjection = useCallback((data) => {
    // Energy Designer now handles WebSocket communication directly via set_inj
    // This callback is kept for resource tracking only

    // Track injection usage
    if (user && firebaseDb) {
      trackResourceUsage(firebaseDb, user.uid, 'injections', 1)
        .catch(err => console.error('Failed to track injection:', err));
    }

    // Do not close the modal automatically
    // handleCloseInjection();
  }, [user, firebaseDb]);


  const startSim = useCallback(async (env_id_or_ids) => {
    if (userProfile?.plan === 'free') {
      if (window.confirm("Free tier reached. Upgrade?")) window.open("https://example.com/upgrade", "_blank");
      return;
    }
    if (userProfile?.balance?.compute_hours <= 0) { alert("Insufficient balance."); return; }

    // Always send as array - handle both single env_id and array of env_ids
    const env_ids = Array.isArray(env_id_or_ids) ? env_id_or_ids : [env_id_or_ids];
    sendMessage({ data: { env_ids }, type: "START_SIM", timestamp: new Date().toISOString() });

    // Track resource usage in Firestore
    if (user && firebaseDb) {
      try {
        await trackResourceUsage(firebaseDb, user.uid, 'simulations', env_ids.length);
        await updateUser(user.uid, { "active_sim": { start_time: Date.now(), rate: 10 } });
      } catch (error) {
        console.error('Failed to track resource usage:', error);
      }
    }
  }, [userProfile, sendMessage, user, updateUser, firebaseDb]);

  const startAllEnvs = useCallback(async () => {
    const allEnvIds = Object.keys(envs);
    if (allEnvIds.length === 0) {
      alert("No environments to start.");
      return;
    }
    await startSim(allEnvIds);
  }, [envs, startSim]);

  const executeIntent = useCallback((intent) => {
    console.log("🎙️ Executing Voice Intent:", intent);
    switch (intent) {
      case "show_envs": if (!isDashOpen) toggleDahboard(); break;
      case "set_config": if (!isCfgSliderOpen) toggleCfgSlider(); break;
      case "watch_data": if (!isDataSliderOpen) toggleDataSlider(); break;
      case "upload_ncfg": if (!isNSliderOpen) toggleNcfgSlider(); break;
      case "show_logs": if (!isLogSidebarOpen) toggleLogSidebar(); break;
      case "show_cluster": if (!isClusterModalOpen) toggleClusterModal(); break;
      case "upload_files": if (!isBucketOpen) toggleBucket(); break;
      case "open_camera":
        window.externalAction = "open_camera";
        setMessages(prev => [...prev, { text: "[VOICE] Opening Camera", type: 'system', timestamp: new Date().toISOString() }]);
        break;
      case "start_sim":
        const env_to_start = selectedEnv || Object.keys(envs)[0];
        if (env_to_start) startSim(env_to_start);
        break;
      default: console.warn("🎙️ Unknown voice intent:", intent);
    }
  }, [isDashOpen, isCfgSliderOpen, isDataSliderOpen, isNSliderOpen, isLogSidebarOpen, isClusterModalOpen, isBucketOpen, selectedEnv, envs, toggleDahboard, toggleCfgSlider, toggleDataSlider, toggleNcfgSlider, toggleLogSidebar, toggleClusterModal, toggleBucket, startSim]);

  // 5. EFFECTS
  useEffect(() => {
    if (isVoiceActive) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) { setIsVoiceActive(false); return; }
      const recognition = new SpeechRecognition();
      recognition.continuous = true; recognition.interimResults = false; recognition.lang = 'en-US';
      recognition.onstart = () => initializeVoice();
      recognition.onresult = async (event) => {
        const text = event.results[event.results.length - 1][0].transcript.trim();
        if (!text) return;
        setMessages(prev => [...prev, { text: `🎙️ "${text}"`, type: 'user', timestamp: new Date().toISOString() }]);
        const match = await processVoiceInput(text);
        if (match && match.score > 0.6) executeIntent(match.intent);
      };
      recognition.onerror = () => setIsVoiceActive(false);
      recognition.onend = () => { if (isVoiceActive) try { recognition.start(); } catch { } };
      try { recognition.start(); recognitionRef.current = recognition; } catch { }
    } else if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    return () => recognitionRef.current?.stop();
  }, [isVoiceActive, executeIntent]);

  // Welcome Message - Fire once on mount
  useEffect(() => {
    // Simple check to prevent double-fire in Strict Mode if needed, 
    // though usually acceptable in dev. 
    // We will just set it once.
    setMessages([
      {
        text: `Welcome to The Grid.

⚠️ ENGINE UNDER CONSTRUCTION ⚠️

Please tell me your email if you want to receive updates or register for early access!`,
        type: 'system',
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);

  // 6. RENDER HELPERS
  const get_dashboard = useCallback(() => {
    if (isDashOpen) return (
      <Dashboard envs={envs} startSim={startSim} toggleModal={toggleModal} toggleNcfg={toggleNcfgSlider}
        toggleDataSlider={toggleDataSlider} sendMessage={sendMessage} isDataSliderOpen={isDataSliderOpen}
        toggleLogSidebar={toggleLogSidebar} requestClusterData={requestClusterData} isVoiceActive={isVoiceActive} setIsVoiceActive={setIsVoiceActive}
        isDashOpen={isDashOpen} setIsDashOpen={setIsDashOpen} startAllEnvs={startAllEnvs} onDeleteEnv={deleteEnv}
      />
    );
    return <></>;
  }, [envs, isDashOpen, setIsDashOpen, toggleNcfgSlider, toggleDataSlider, sendMessage, isDataSliderOpen, toggleLogSidebar, requestClusterData, startSim, toggleModal, isVoiceActive, setIsVoiceActive, startAllEnvs, deleteEnv]);

  const get_node_panel = useCallback(() => {
    if (clickedNode !== null) return (
      <NodeInfoPanel node={clickedNode} sliderOpen={nodeSliderOpen} onClose={() => { updateNodesliderOpen(); setClickedNode(null); }}
        firebaseDb={firebaseDb} fbIsConnected={fbIsConnected} />
    );
    return <></>;
  }, [clickedNode, nodeSliderOpen, updateNodesliderOpen, firebaseDb, fbIsConnected]);

  const get_world_cfg = useCallback(() => {
    return (
      <WorldCfgCreator sendMessage={sendMessage} isOpen={isCfgSliderOpen} onToggle={toggleCfgSlider} user={user}
        userProfile={userProfile} initialValues={extractedEntities} saveUserWorldConfig={saveUserWorldConfig}
        listenToUserWorldConfig={listenToUserWorldConfig} authLoading={loading} authError={authErrorState}
        toggleModal={toggleModal} startSim={startSim} toggleDataSlider={toggleDataSlider} openClusterInjection={toggleInjection}
      />
    );
  }, [isCfgSliderOpen, toggleCfgSlider, user, userProfile, extractedEntities, saveUserWorldConfig, listenToUserWorldConfig, loading, authErrorState, sendMessage, toggleModal, startSim, toggleDataSlider, toggleInjection]);

  const get_ncfgslider = useCallback(() => {
    if (isNSliderOpen) return <NCfgCreator sendMessage={sendMessage} isOpen={isNSliderOpen} onToggle={toggleNcfgSlider} initialValues={extractedEntities} />;
    return <></>;
  }, [isNSliderOpen, toggleNcfgSlider, sendMessage, extractedEntities]);

  const modal = useCallback(() => {
    if (!isOpen || !selectedEnv) return <></>;
    return (
      <Modal
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        size="5xl"
        classNames={{
          base: "bg-slate-50 border border-slate-200 shadow-2xl rounded-3xl",
          header: "border-b border-slate-100",
          footer: "border-t border-slate-100",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-slate-900 font-bold">
                Environment Topology: {selectedEnv}
              </ModalHeader>
              <ModalBody>
                <div className="h-[600px] w-full bg-slate-900 rounded-2xl overflow-hidden shadow-inner relative border border-slate-800">
                  <ThreeScene
                    env_id={selectedEnv}
                    onNodeClick={updateNodeInfo}
                  />
                  <div className="absolute top-4 left-4 bg-blue-600/90 backdrop-blur text-white text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-widest flex items-center gap-1.5 border border-blue-400/30">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    Live Connection Active
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose} className="font-semibold">
                  Close Visualization
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    );
  }, [isOpen, selectedEnv, updateNodeInfo, setIsOpen]);

  const get_data_slider = useCallback(() => (
    <DataSlider
      nodes={graph.nodes}
      edges={graph.edges}
      logs={logs}
      isOpen={isDataSliderOpen}
      onToggle={toggleDataSlider}
      envsList={Object.keys(envs)}
      sendMessage={sendMessage}
    />
  ), [graph.nodes, graph.edges, logs, isDataSliderOpen, toggleDataSlider, envs, sendMessage]);

  const get_bucket = useCallback(() => {
    if (!isBucketOpen) return <></>;
    return (
      <Modal isOpen={isBucketOpen} onOpenChange={setIsBucketOpen} size="3xl" classNames={{ base: "bg-slate-50 rounded-3xl" }}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="font-bold text-slate-900">Global Storage (Buckets)</ModalHeader>
              <ModalBody>
                <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-[40px] bg-slate-100/50">
                  <div className="text-4xl mb-4">🪣</div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Workspace Bucket</h3>
                  <p className="text-slate-500 max-w-md mx-auto">Global file management is being synchronized. Please use per-environment upload sections in the dashboard to inject data into specific simulations.</p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" variant="shadow" onPress={onClose} className="font-bold">
                  Understood
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    );
  }, [isBucketOpen]);

  const handleSubmit = useCallback(async (files = []) => {
    if (!inputValue.trim() && files.length === 0) return;

    // Helper function to convert File to base64
    const fileToBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
    };

    // Send files as SET_FILE request (Module from File)
    if (files.length > 0) {
      const processedFiles = [];
      for (const file of files) {
        try {
          const base64Data = await fileToBase64(file);
          processedFiles.push({
            name: file.name,
            size: file.size,
            type: file.type,
            content: base64Data,
            lastModified: file.lastModified,
          });
        } catch (error) {
          console.error("Error reading file:", error);
          setMessages(prev => [...prev, {
            text: `❌ Error reading file ${file.name}: ${error.message}`,
            type: 'system',
            timestamp: new Date().toISOString()
          }]);
        }
      }

      if (processedFiles.length > 0) {
        const userId = localStorage.getItem(USER_ID_KEY);
        // Use input value as ID (Module Name) if provided, otherwise default to first filename (sans extension)
        const moduleId = inputValue.trim() || processedFiles[0].name.replace(/\.[^/.]+$/, "");

        sendMessage({
          type: "SET_FILE",
          data: {
            id: moduleId,
            files: processedFiles
          },
          auth: {
            user_id: userId
          },
          timestamp: new Date().toISOString()
        });

        setMessages(prev => [...prev, {
          text: `📤 Uploading ${processedFiles.length} file(s) as module '${moduleId}'...`,
          type: 'system',
          timestamp: new Date().toISOString()
        }]);
      }

      updateInputValue("");
      return; // Stop normal chat processing if files were sent
    }


    // Process text input if present
    if (!inputValue.trim()) return;

    const userMsg = { text: inputValue, type: 'user', timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    saveMessage(userMsg);
    const checkInput = inputValue.trim();
    if (checkInput.startsWith("request_inj_process")) {
      sendMessage({ type: "REQUEST_INJ_PROCESS", timestamp: new Date().toISOString() });
      setInputValue(''); return;
    }
    if (checkInput.startsWith("set_cfg_process")) {
      try {
        const data = JSON.parse(checkInput.replace("set_cfg_process", "").trim());
        sendMessage({ type: "SET_CFG_PROCESS", data, timestamp: new Date().toISOString() });
        setInputValue(''); return;
      } catch (e) {
        setMessages(prev => [...prev, { type: 'system', text: `Error: ${e.message}`, timestamp: new Date().toISOString() }]);
        setInputValue(''); return;
      }
    }
    const currentInput = inputValue; setInputValue('');
    const botMsg = { text: '', type: 'bot', timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, botMsg]);
    let fullResponse = '';
    await classifyAndRespond(currentInput, chunk => {
      fullResponse += chunk;
      setMessages(prev => prev.map((msg, i) => i === prev.length - 1 ? { ...msg, text: msg.text + chunk } : msg));
    });
    saveMessage({ ...botMsg, text: fullResponse });
    const analysis = await analyzeCommand(currentInput, ["show_envs", "set_config", "watch_data", "upload_ncfg", "show_logs", "show_cluster", "upload_files", "start_sim", "get_cluster_data", "research", "upgrade_plan", "downgrade_plan", "chat", "subscribe_updates", "session_cfg"]);
    const { intent, entities } = analysis;
    if (intent !== "unknown" && intent !== "chat") {
      setExtractedEntities(entities);
      let actionDesc = "";
      if (intent === "show_envs") { toggleDahboard(); actionDesc = "Opening Dashboard"; }
      else if (intent === "set_config") { toggleCfgSlider(); actionDesc = "Opening World Config"; }
      else if (intent === "watch_data") { toggleDataSlider(); actionDesc = "Opening Data View"; }
      else if (intent === "upload_ncfg") { toggleNcfgSlider(); actionDesc = "Opening Node Config"; }
      else if (intent === "show_logs") { toggleLogSidebar(); actionDesc = "Opening Logs"; }
      else if (intent === "show_cluster") { toggleClusterModal(); actionDesc = "Opening Cluster Visualization"; }
      else if (intent === "upload_files") { toggleBucket(); actionDesc = "Opening File Uploader"; }
      else if (intent === "session_cfg") {
        sendMessage({ type: "SESSION_CFG_ACTION", data: entities, timestamp: new Date().toISOString() });
        actionDesc = `Modifying Session Config: ${entities.operation} ${entities.target}`;
      }
      else if (intent === "start_sim" || intent === "get_cluster_data") {
        sendMessage({ type: intent.toUpperCase(), data: { ...entities, input: currentInput }, timestamp: new Date().toISOString() });
        actionDesc = `Executing ${intent}`;
      }
      else if (intent === "subscribe_updates") {
        const email = entities.email;
        if (email) {
          const currentEmails = JSON.parse(localStorage.getItem("qdash_email_subscribers") || "[]");
          if (!currentEmails.includes(email)) {
            currentEmails.push(email);
            localStorage.setItem("qdash_email_subscribers", JSON.stringify(currentEmails));
            actionDesc = `✅ Subscribed ${email} for updates.`;
          } else {
            actionDesc = `ℹ️ ${email} is already subscribed.`;
          }
        } else {
          setMessages(prev => [...prev, { text: `[SYSTEM] ⚠️ Please provide your email address to subscribe (e.g., "subscribe me at email@example.com").`, type: 'system', timestamp: new Date().toISOString() }]);
          return;
        }
      }
      if (actionDesc) setMessages(prev => [...prev, { text: `[SYSTEM] ${actionDesc}`, type: 'system', timestamp: new Date().toISOString() }]);
    }
  }, [inputValue, saveMessage, setMessages, setInputValue, toggleDahboard, toggleCfgSlider, toggleDataSlider, toggleNcfgSlider, toggleLogSidebar, toggleClusterModal, toggleBucket, sendMessage, updateInputValue]);

  if (fbIsConnected && !user) return <AuthForm onLogin={handleLogin} onSignup={handleSignup} error={authError} />;

  return (
    <div className="flex absolute flex-row w-full h-screen overflow-hidden">
      <div className="dashboard-container w-full h-full overflow-y-auto scroll-smooth" ref={scrollContainerRef}>
        <LandingPage
          liveData={liveData}
          setTerminalVisible={setIsTerminalVisible}
          isSimRunning={Object.values(envs).some(e => e.status === 'running')}
          isCfgOpen={isCfgSliderOpen}
        >
          <LogSidebar logs={logs} isOpen={isLogSidebarOpen} onClose={toggleLogSidebar} />
          {get_dashboard()}
          {get_ncfgslider()}
        </LandingPage>
        <TerminalConsole handleSubmit={handleSubmit} isConnected={isConnected} fbIsConnected={fbIsConnected} userProfile={userProfile} inputValue={inputValue} updateInputValue={updateInputValue} messages={messages} toggleCfgSlider={toggleCfgSlider} toggleDataSlider={toggleDataSlider} sendMessage={sendMessage} toggleDashboard={toggleDahboard} toggleNcfgSlider={toggleNcfgSlider} toggleLogSidebar={toggleLogSidebar} toggleClusterModal={toggleClusterModal} toggleInjection={toggleInjection} toggleBilling={toggleBilling} toggleModuleDesigner={toggleModuleDesigner} toggleMethodDesigner={toggleMethodDesigner} toggleFieldDesigner={toggleFieldDesigner} toggleSessionConfig={toggleSessionConfig} toggleParamConfig={toggleParamConfig} envs={envs} toggleBucket={toggleBucket} saveMessage={saveMessage} setMessages={setMessages} isVisible={isTerminalVisible} isVoiceActive={isVoiceActive} setIsVoiceActive={setIsVoiceActive} />
      </div>
      <div className="flex">
        {get_node_panel()}
        {get_world_cfg()}
      </div>

      {modal()}
      {get_data_slider()}
      {get_bucket()}
      <ClusterVisualizerModal isOpen={isClusterModalOpen} onClose={toggleClusterModal} data={clusterData} />
      <UserCard user={user} userProfile={userProfile} onLogout={logout} />

      {/* Module Designer */}
      <ModuleDesigner
        isOpen={isModuleDesignerOpen}
        onClose={toggleModuleDesigner}
        sendMessage={sendMessage}
        user={user}
      />

      {/* Method Designer */}
      <MethodDesigner
        isOpen={isMethodDesignerOpen}
        onClose={toggleMethodDesigner}
        sendMessage={sendMessage}
        user={user}
      />

      {/* Field Designer */}
      <FieldDesigner
        isOpen={isFieldDesignerOpen}
        onClose={toggleFieldDesigner}
        sendMessage={sendMessage}
        user={user}
      />

      {/* Billing Manager Modal */}
      {isBillingOpen && (
        <BillingManager
          user={user}
          userProfile={userProfile}
          onClose={toggleBilling}
          updateUserPlan={updateUserPlan}
        />
      )}

      {/* Session Config */}
      <SessionConfig
        isOpen={isSessionConfigOpen}
        onClose={toggleSessionConfig}
        sendMessage={sendMessage}
        user={user}
      />

      {/* Param Config */}
      <ParamConfig
        isOpen={isParamConfigOpen}
        onClose={toggleParamConfig}
        sendMessage={sendMessage}
      />

      {/* Energy Designer - Bottom-to-top slider modal */}
      {injectionEnvId && (
        <EnergyDesignerWithViz
          initialData={injectionData}
          onClose={handleCloseInjection}
          onSend={handleSendInjection}
          sendMessage={sendMessage}
        />
      )}
    </div>
  );
};

export default MainApp;
