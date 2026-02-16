import { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import ConfigAccordion from "./accordeon";
import ModuleDesigner from "./ModuleDesigner";
import { Button, Switch } from "@heroui/react";
import { Trash2, Globe, Server, X, PlusCircle, Download, Activity, Box } from "lucide-react";
import { USER_ID_KEY, getSessionId } from "../auth";
import GlobalConnectionSpinner from './GlobalConnectionSpinner';
import { updateLogs, updateVisData } from "../store/slices/envSlice";
import { addModelEnv, removeModelEnv } from "../store/slices/conversationSlice";

const WorldCfgCreator = ({ sendMessage, isOpen, onToggle, user, saveUserWorldConfig, listenToUserWorldConfig, userProfile }) => {
  const [environments, setEnvironments] = useState([]);
  const [sessionEnvironments, setSessionEnvironments] = useState([]);
  // const [isLoadingEnvs, setIsLoadingEnvs] = useState(false); // Unused
  // const [isLoadingSessionEnvs, setIsLoadingSessionEnvs] = useState(false); // Unused
  const [selectedEnvConfig, setSelectedEnvConfig] = useState(null);
  const [linkedEnvs, setLinkedEnvs] = useState(new Set());

  // New State for Right Panel
  const [activeTab, setActiveTab] = useState("visual");
  const [localLiveData, setLocalLiveData] = useState([]); // For bottom table

  const isConnected = useSelector(state => state.websocket.isConnected);
  const logs = useSelector(state => state.envs.logs);
  const visData = useSelector(state => state.envs.visData);
  const conversationModels = useSelector(state => state.conversation.models);

  const dispatch = useDispatch();
  // const animationRef = useRef(null); // Unused

  // function handleCloseConfig() { // Unused
  //   setSelectedEnvConfig(null);
  // }

  function handleCreateNew() {
    setSelectedEnvConfig({}); // Clear to defaults
  }

  function handleSessionLink(envId, isLinked) {
    setLinkedEnvs(prev => {
      const next = new Set(prev);
      if (isLinked) next.add(envId);
      else next.delete(envId);
      return next;
    });
  }

  // Request environments and user fields when modal opens (fields feed the Field dropdown in World Config)
  useEffect(() => {
    if (isOpen && sendMessage && isConnected) {
      const userId = localStorage.getItem(USER_ID_KEY);
      const sessionId = getSessionId();

      if (userId) {
        sendMessage({
          type: "GET_USERS_ENVS",
          auth: { user_id: userId },
          timestamp: new Date().toISOString()
        });
        sendMessage({
          type: "LIST_USERS_FIELDS",
          auth: { user_id: userId },
          timestamp: new Date().toISOString()
        });

        if (sessionId) {
          sendMessage({
            type: "GET_SESSIONS_ENVS",
            auth: { user_id: userId, session_id: sessionId },
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }, [isOpen, sendMessage, isConnected]);

  // Listen for environment list and other responses
  useEffect(() => {
    const handleEnvResponse = (event) => {
      const msg = event?.detail;
      if (!msg) return;

      if (msg.type === "GET_USERS_ENVS" || msg.type === "LIST_ENVS") {
        setEnvironments(msg.data?.envs || []);
        // setIsLoadingEnvs(false);
      } else if (msg.type === "GET_SESSIONS_ENVS") {
        const data = msg.data?.data || msg.data || [];
        setSessionEnvironments(Array.isArray(data) ? data : []);
        // setIsLoadingSessionEnvs(false);
      } else if (msg.type === "ENV_DELETED" || msg.type === "DEL_ENV") {
        const deletedId = msg.env_id || msg.data?.env_id;
        if (deletedId) {
          setEnvironments(prev => prev.filter(env => env.id !== deletedId));
          setSessionEnvironments(prev => prev.filter(env => env.id !== deletedId));
        }
      } else if (msg.type === "RETRIEVE_LOGS_ENV") {
        // data structure: { env_id: [ {timestamp, message}, ... ] }
        // Assuming msg.data contains the logs directly or nested
        // Prompt: data[env_id: ldict(timestamp, message)) -> overwrite redux
        if (msg.data) {
          // Handle if data is wrapped or direct
          const envId = msg.auth?.env_id || msg.env_id; // Try to get env_id context if possible, or parse from data
          if (envId) {
            dispatch(updateLogs({ envId, logs: msg.data }));
          } else {
            // iterate keys if data is dict[env_id] -> logs
            if (msg.data && typeof msg.data === 'object') {
              Object.entries(msg.data).forEach(([eid, logList]) => {
                dispatch(updateLogs({ envId: eid, logs: logList }));
              });
            }
          }
        }
      } else if (msg.type === "GET_ENV_DATA") {
        // Bottom table data
        setLocalLiveData(prev => [...prev, ...(Array.isArray(msg.data) ? msg.data : [msg.data])]);
      }
    };

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Handle same types as above if needed, but CustomEvent 'qdash-ws-message' is preferred if available
        if (data.type === "GET_ENV_DATA") {
          setLocalLiveData(prev => Array.isArray(data.data) ? data.data : [data.data]);
        }
      } catch (e) { }
    }

    window.addEventListener('qdash-ws-message', handleEnvResponse);
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('qdash-ws-message', handleEnvResponse);
      window.removeEventListener('message', handleMessage);
    }
  }, [dispatch]);

  function handleDeleteEnv(e, envId) {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete environment ${envId}?`)) {
      if (sendMessage) {
        sendMessage({
          type: "DEL_ENV",
          auth: { env_id: envId, user_id: localStorage.getItem(USER_ID_KEY) },
          timestamp: new Date().toISOString()
        });
        setEnvironments(prev => prev.filter(env => env.id !== envId));
      }
    }
  }

  function handleSelectEnv(env) {
    const config = {
      id: env.id,
      amount_of_nodes: env.amount_of_nodes || env.cluster_dim,
      sim_time: env.sim_time,
      dims: env.dims,
      enable_sm: env.enable_sm,
      particle: env.particle,
      status: env.state || env.status || 'created',
      field_id: env.field_id ?? env.field
    };
    setSelectedEnvConfig(config);
    // Reset local view state
    setLocalLiveData([]);
    dispatch(updateLogs({ envId: env.id, logs: [] }));
  }

  // --- Visual Tab Logic ---
  useEffect(() => {
    if (activeTab === 'visual' && selectedEnvConfig?.id) {
      const envId = selectedEnvConfig.id;
      let frameId;
      const particles = [
        { x: 0, y: 0, vx: 1, vy: 1, color: '#FF0000' },
        { x: 50, y: 50, vx: -1, vy: 0.5, color: '#00FF00' },
        { x: 20, y: 80, vx: 0.5, vy: -1, color: '#0000FF' }
      ];

      const loop = () => {
        // Update particles
        const newData = {};
        particles.forEach((p, i) => {
          p.x = (p.x + p.vx) % 100;
          p.y = (p.y + p.vy) % 100;
          if (p.x < 0) p.x += 100;
          if (p.y < 0) p.y += 100;
          newData[`p${i}`] = { x: p.x, y: p.y, color: p.color };
        });

        // Sync to Redux (throttled in real app, but complying with prompt "endless loop ... in redux VIS_DATA format")
        dispatch(updateVisData({ envId, data: newData }));
        frameId = requestAnimationFrame(loop);
      };

      loop();
      return () => cancelAnimationFrame(frameId);
    }
  }, [activeTab, selectedEnvConfig, dispatch]);

  // --- Logs Logic ---
  useEffect(() => {
    if (activeTab === 'status logs' && selectedEnvConfig?.id) {
      sendMessage({
        type: "RETRIEVE_LOGS_ENV",
        auth: { env_id: selectedEnvConfig.id, user_id: localStorage.getItem(USER_ID_KEY) },
        timestamp: new Date().toISOString()
      });
    }
  }, [activeTab, selectedEnvConfig, sendMessage]);

  // --- Bottom Table Data ---
  useEffect(() => {
    if (selectedEnvConfig?.id) {
      // Prompt says: onmount sendMessage(type=GET_ENV_DATA...
      // We do this when config is selected (which mounts the bottom view)
      sendMessage({
        type: "GET_ENV_DATA",
        auth: { env_id: selectedEnvConfig.id, user_id: localStorage.getItem(USER_ID_KEY) },
        timestamp: new Date().toISOString()
      });
    }
  }, [selectedEnvConfig, sendMessage]);


  if (!isOpen) return null;

  const getStatusColor = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";
    const s = status.toLowerCase();
    if (s === 'created') return "bg-blue-100 text-blue-800 border-blue-200";
    if (s === 'in_progress') return "bg-green-100 text-green-800 border-green-200";
    if (s === 'error') return "bg-red-100 text-red-800 border-red-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const renderEnvItem = (env, i, isSessionEnv = false) => (
    <div
      key={(env.id || i) + (isSessionEnv ? '_session' : '')}
      onClick={() => handleSelectEnv(env)}
      className={`group flex flex-col gap-2 p-3 rounded-xl border transition-all shadow-sm cursor-pointer
        ${isSessionEnv
          ? "bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400"
          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400"
        }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          {isSessionEnv && (
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" title="Linked to Session" />
          )}
          <span className={`font-bold text-sm truncate ${isSessionEnv ? "text-indigo-700 dark:text-indigo-300" : "text-slate-700 dark:text-slate-200"}`}>
            {env.id || `Env ${i + 1}`}
          </span>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <div className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold ${getStatusColor(env.state || env.status)}`}>
            {env.state || env.status || 'UNK'}
          </div>
          <Switch
            aria-label={`Link ${env.id || 'env'} to session`}
            size="sm"
            isSelected={linkedEnvs.has(env.id) || isSessionEnv}
            onValueChange={(val) => handleSessionLink(env.id, val)}
            classNames={{
              wrapper: "group-data-[selected=true]:bg-indigo-500",
            }}
          />
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Server size={12} />
          <span>{env.amount_of_nodes || env.cluster_dim || 0} Nodes</span>
        </div>
        <div className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700">
          {env.dims || 3}D
        </div>
      </div>
      {/* Environment Actions */}
      <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
        <button onClick={(e) => handleDeleteEnv(e, env.id)} className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-bold rounded transition-all border border-red-200"><Trash2 size={12} /></button>
      </div>
    </div>
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[85vh] bg-white dark:bg-slate-900 shadow-2xl rounded-t-3xl z-[100] flex flex-col border-t border-slate-200 dark:border-slate-800 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-t-3xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
            <Globe size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Environment Designer</h2>
            <p className="text-xs text-slate-500">Configure simulation parameters and clusters</p>
          </div>
        </div>
        <Button aria-label="Close" isIconOnly variant="light" onPress={onToggle}>
          <X size={24} />
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <GlobalConnectionSpinner inline={true} />

        {/* EXISTING LEFT SIDE (Environment List) - Preserved but maybe condensed or just left as 30%? Prompt says "Split Top 80% into 2 cols (30% and 70%)".
            If I follow the interpretation of modifying the RIGHT panel (Config Area), then this Left List is fine.
        */}
        <div className="w-[20%] border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
          <div className="p-4 border-b border-slate-200">
            <Button className="w-full font-bold shadow-sm" color="primary" variant="flat" startContent={<PlusCircle size={18} />} onPress={handleCreateNew}>New</Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
            {/* Compact list */}
            {sessionEnvironments.map((env, i) => renderEnvItem(env, i, true))}
            {environments.map((env, i) => renderEnvItem(env, i, false))}
          </div>
        </div>

        {/* RIGHT SIDE (80% of total width) - The target of the prompt "env cfg right side" */}
        <div className="w-[80%] flex flex-col h-full bg-white dark:bg-slate-900">
          {selectedEnvConfig ? (
            <div className="flex flex-col h-full">
              {/* TOP 80% */}
              <div className="h-[80%] flex flex-row border-b border-slate-200 dark:border-slate-800">
                {/* Left 30% of Right Side: Config Inputs */}
                <div className="w-[30%] flex flex-col border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-4 bg-slate-50/20">
                  <div className={`mb-3 px-3 py-2 rounded-lg border text-center font-bold text-sm capitalize ${getStatusColor(selectedEnvConfig.status)}`}>
                    Status: {selectedEnvConfig.status || 'Created'}
                  </div>
                  <div className="mb-4 flex justify-center">
                    <Button
                      size="sm"
                      color="secondary"
                      startContent={<Download size={14} />}
                      onPress={() => {
                        const userId = localStorage.getItem(USER_ID_KEY);
                        if (!sendMessage || !selectedEnvConfig?.id || !userId) return;
                        sendMessage({
                          type: "SHOW_ENV_CFG",
                          auth: { env_id: selectedEnvConfig.id, user_id: userId },
                          timestamp: new Date().toISOString()
                        });
                      }}
                    >
                      Download CFG
                    </Button>
                  </div>
                  <ConfigAccordion
                    sendMessage={sendMessage}
                    initialValues={selectedEnvConfig}
                    shouldShowDefault={Object.keys(selectedEnvConfig || {}).length === 0}
                    user={user}
                    userProfile={userProfile}
                    saveUserWorldConfig={saveUserWorldConfig}
                    listenToUserWorldConfig={listenToUserWorldConfig}
                  />
                </div>

                {/* Right 70% of Right Side: Tabs (Visual, Model, Logs) */}
                <div className="w-[70%] flex flex-col bg-slate-50 dark:bg-slate-900">
                  {/* Header */}
                  <div className="flex items-center gap-2 p-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    {["visual", "model", "modules", "status logs"].map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === tab
                          ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                          : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-hidden relative p-4">
                    {activeTab === 'visual' && (
                      <div className="h-full w-full flex items-center justify-center bg-black rounded-xl overflow-hidden relative border border-slate-800">
                        <div className="absolute top-2 left-2 text-xs text-green-500 font-mono z-10">VIS_DATA VIEW</div>
                        {/* Render Visualization from Redux Data */}
                        <div className="relative w-full h-full">
                          {/* We iterate over keys in redux visData for this env */}
                          {visData[selectedEnvConfig.id] && Object.entries(visData[selectedEnvConfig.id]).map(([key, val]) => (
                            <div
                              key={key}
                              className="absolute w-4 h-4 rounded-full shadow-lg transition-all duration-75 border border-white/20"
                              style={{
                                left: `${val.x}%`,
                                top: `${val.y}%`,
                                backgroundColor: val.color,
                                transform: 'translate(-50%, -50%)'
                              }}
                            >
                              <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-white/50">{key}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'modules' && (
                      <div className="h-full min-h-0 flex flex-col">
                        <ModuleDesigner
                          embedded
                          sendMessage={sendMessage}
                          user={user}
                        />
                      </div>
                    )}

                    {activeTab === 'model' && (
                      <div className="flex flex-col gap-4 h-full">
                        <div className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                          <Button
                            size="sm"
                            color="secondary"
                            startContent={<Download size={16} />}
                            onPress={() => sendMessage({
                              type: "DOWNLOAD_MODEL",
                              auth: { env_id: selectedEnvConfig.id, user_id: localStorage.getItem(USER_ID_KEY) }
                            })}
                          >
                            Download Model
                          </Button>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold">Add to Conversation</span>
                            <Switch
                              aria-label="Add to conversation"
                              size="sm"
                              isSelected={conversationModels.includes(selectedEnvConfig.id)}
                              onValueChange={(val) => {
                                if (val) dispatch(addModelEnv(selectedEnvConfig.id));
                                else dispatch(removeModelEnv(selectedEnvConfig.id));
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex-1 bg-slate-900 rounded-xl p-4 font-mono text-xs overflow-y-auto border border-slate-800">
                          <div className="text-slate-500 mb-2 border-b border-slate-700 pb-1">CONVERSATION.models</div>
                          {conversationModels.map(id => (
                            <div key={id} className="flex items-center justify-between py-1 px-2 hover:bg-slate-800 rounded text-green-400">
                              <span>{id}</span>
                              <button onClick={() => dispatch(removeModelEnv(id))} className="text-slate-500 hover:text-red-500"><X size={12} /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'status logs' && (
                      <div className="h-full flex flex-col gap-2">
                        {(!selectedEnvConfig.status || selectedEnvConfig.status.toUpperCase() !== 'FINISHED') && (
                          <div className="p-2 bg-yellow-100 text-yellow-800 border border-yellow-200 text-xs rounded">
                            Note: The environment state needs to be FINISHED to view complete logs.
                          </div>
                        )}
                        <div className="flex-1 bg-black text-slate-300 font-mono text-xs p-4 rounded-xl overflow-y-auto">
                          {(logs[selectedEnvConfig.id] || []).map((log, i) => (
                            <div key={i} className={`py-0.5 border-b border-white/5 ${log.message?.toLowerCase().includes('err') || log.type === 'error' ? 'bg-red-900/50 text-red-200' : ''}`}>
                              <span className="text-slate-500 mr-2">[{log.timestamp}]</span>
                              <span>{log.message}</span>
                            </div>
                          ))}
                          {(!logs[selectedEnvConfig.id] || logs[selectedEnvConfig.id].length === 0) && (
                            <div className="text-slate-600 italic">No logs available...</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* BOTTOM 20% - Scrollable Live Table Data */}
              <div className="h-[20%] border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-blue-500" />
                    <span className="text-xs font-bold uppercase">Live Data Viewer</span>
                  </div>
                  <Button
                    aria-label="Fetch env data"
                    size="sm"
                    variant="light"
                    isIconOnly
                    onPress={() => sendMessage({ type: "GET_ENV_DATA", auth: { env_id: selectedEnvConfig.id, user_id: localStorage.getItem(USER_ID_KEY) } })}
                  >
                    <Download size={14} />
                  </Button>
                </div>
                <div className="flex-1 overflow-auto p-0">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 sticky top-0">
                      <tr>
                        {localLiveData.length > 0 && localLiveData[0] && typeof localLiveData[0] === 'object' && Object.keys(localLiveData[0]).map(key => (
                          <th key={key} className="px-4 py-2 font-medium border-b dark:border-slate-700">{key}</th>
                        ))}
                        {localLiveData.length === 0 && <th className="px-4 py-2">Data</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {localLiveData.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          {row && typeof row === 'object' && Object.values(row).map((val, j) => (
                            <td key={j} className="px-4 py-1.5 truncate max-w-[200px]">{typeof val === 'object' ? JSON.stringify(val) : val}</td>
                          ))}
                        </tr>
                      ))}
                      {localLiveData.length === 0 && (
                        <tr><td className="px-4 py-8 text-center text-slate-400 italic">No live data available</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Box size={48} className="mb-4 opacity-50" />
              <p>Select an environment to configure</p>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes slide-up {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
        }
        .animate-slide-up {
            animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};
export default WorldCfgCreator;