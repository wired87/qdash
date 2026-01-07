import React, { useState, useEffect } from "react";
import { useSelector } from 'react-redux';
import ConfigAccordion from "./accordeon";
import { Button, Card, CardBody, Avatar, Switch } from "@heroui/react";
import { User, Trash2, Globe, Server, X, PlusCircle, ZapOff } from "lucide-react";
import { USER_ID_KEY, getSessionId } from "../auth";
import GlobalConnectionSpinner from './GlobalConnectionSpinner';


const WorldCfgCreator = ({ sendMessage, isOpen, onToggle, user, initialValues, saveUserWorldConfig, listenToUserWorldConfig, userProfile, toggleModal, startSim, toggleDataSlider, openClusterInjection }) => {
  const [environments, setEnvironments] = useState([]);
  const [sessionEnvironments, setSessionEnvironments] = useState([]);
  const [isLoadingEnvs, setIsLoadingEnvs] = useState(false);
  const [isLoadingSessionEnvs, setIsLoadingSessionEnvs] = useState(false);
  const [selectedEnvConfig, setSelectedEnvConfig] = useState(null);
  const [linkedEnvs, setLinkedEnvs] = useState(new Set());
  const isConnected = useSelector(state => state.websocket.isConnected);

  // ... (handlers remain)

  function handleCloseConfig() {
    setSelectedEnvConfig(null);
  }

  function handleCreateNew() {
    setSelectedEnvConfig({}); // Clear to defaults
  }

  function handleSessionLink(envId, isLinked) {
    // Optimistic UI update
    setLinkedEnvs(prev => {
      const next = new Set(prev);
      if (isLinked) next.add(envId);
      else next.delete(envId);
      return next;
    });

    const sessionId = getSessionId();
    const userId = localStorage.getItem(USER_ID_KEY);

  }

  // Request environments when modal opens
  useEffect(() => {
    if (isOpen && sendMessage && isConnected) {
      const userId = localStorage.getItem(USER_ID_KEY);
      const sessionId = getSessionId();

      if (userId) {
        setIsLoadingEnvs(true);
        sendMessage({
          type: "GET_USERS_ENVS",
          auth: { user_id: userId },
          timestamp: new Date().toISOString()
        });

        if (sessionId) {
          setIsLoadingSessionEnvs(true);
          sendMessage({
            type: "GET_SESSIONS_ENVS",
            auth: { user_id: userId, session_id: sessionId },
            timestamp: new Date().toISOString()
          });
        }
      }
    }
  }, [isOpen, sendMessage, isConnected]);

  // Listen for environment list responses
  useEffect(() => {
    const handleEnvResponse = (event) => {
      const msg = event?.detail; // Custom event detail
      if (!msg) return;

      if (msg.type === "GET_USERS_ENVS" || msg.type === "LIST_ENVS") {
        console.log("📋 Received environments:", msg.data.envs);
        setEnvironments(msg.data.envs || []);
        setIsLoadingEnvs(false);
      } else if (msg.type === "GET_SESSIONS_ENVS") {
        console.log("📋 Received session environments:", msg.data);
        const data = msg.data.data || msg.data || [];
        setSessionEnvironments(Array.isArray(data) ? data : []);
        setIsLoadingSessionEnvs(false);
      } else if (msg.type === "ENV_DELETED") {
        console.log("🗑️ Environment deleted:", msg.env_id);
        setEnvironments(prev => prev.filter(env => env.id !== msg.env_id));
        setSessionEnvironments(prev => prev.filter(env => env.id !== msg.env_id));
      } else if (msg.type === "DEL_ENV") {
        // Handle backend response for deletion if it comes this way
        setEnvironments(prev => prev.filter(env => env.id !== msg.env_id));
        setSessionEnvironments(prev => prev.filter(env => env.id !== msg.env_id));
      }
    };

    // Also listen for regular message events if not dispatching custom events
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "GET_USERS_ENVS" || data.type === "LIST_ENVS") {
          setEnvironments(data.data?.envs || data.envs || []);
          setIsLoadingEnvs(false);
        } else if (data.type === "GET_SESSIONS_ENVS") {
          const sEnvData = data.data?.data || data.data || [];
          setSessionEnvironments(Array.isArray(sEnvData) ? sEnvData : []);
          setIsLoadingSessionEnvs(false);
        } else if (data.type === "ENV_DELETED" || data.type === "DEL_ENV") {
          const deletedId = data.env_id || data.data?.env_id;
          if (deletedId) {
            setEnvironments(prev => prev.filter(env => env.id !== deletedId));
            setSessionEnvironments(prev => prev.filter(env => env.id !== deletedId));
          }
        }
      } catch (e) { }
    }


    window.addEventListener('qdash-ws-message', handleEnvResponse);
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('qdash-ws-message', handleEnvResponse);
      window.removeEventListener('message', handleMessage);
    }
  }, []);

  function handleDeleteEnv(e, envId) {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete environment ${envId}?`)) {
      if (sendMessage) {
        sendMessage({
          type: "DEL_ENV",
          auth: { env_id: envId, user_id: localStorage.getItem(USER_ID_KEY) },
          timestamp: new Date().toISOString()
        });
        // Optimistic update
        setEnvironments(prev => prev.filter(env => env.id !== envId));
      }
    }
  }

  function handleSelectEnv(env) {
    // Map env properties to config values expected by ConfigAccordion
    const config = {
      id: env.id,
      amount_of_nodes: env.amount_of_nodes || env.cluster_dim,
      sim_time: env.sim_time,
      dims: env.dims,
      enable_sm: env.enable_sm,
      particle: env.particle
    };
    setSelectedEnvConfig(config);
  }



  if (!isOpen) return null;

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
          <span className="text-[10px] text-slate-400 font-medium hidden group-hover:block transition-all">Link</span>
          <Switch
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
        <button
          onClick={(e) => { e.stopPropagation(); toggleModal(env.id); }}
          className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded transition-all"
          title="Graph"
        >
          🌐
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); startSim(env.id); }}
          className="px-2 py-1 bg-white hover:bg-slate-50 text-black text-[10px] font-bold rounded border border-slate-300 transition-all"
          title="Start"
        >
          ▶️
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleDataSlider();
            sendMessage({ type: "TOGGLE_DATA_SLIDER", env_id: env.id, timestamp: new Date().toISOString() });
          }}
          className="px-2 py-1 bg-gray-800 hover:bg-gray-700 text-white text-[10px] font-bold rounded transition-all"
          title="Data"
        >
          📊
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); openClusterInjection(env.id, env); }}
          className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold rounded transition-all"
          title="Apply Injection"
        >
          💉
        </button>
        <button
          onClick={(e) => handleDeleteEnv(e, env.id)}
          className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-bold rounded transition-all border border-red-200 flex items-center justify-center"
          title="Delete"
        >
          <Trash2 size={12} />
        </button>
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
        <Button isIconOnly variant="light" onPress={onToggle}>
          <X size={24} />
        </Button>
      </div>

      {/* Disconnected Overlay */}
      {/* Split View */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Disconnected Overlay */}
        <GlobalConnectionSpinner inline={true} />
        {/* LEFT SIDE (30%) - Environment List */}
        <div className="w-[30%] border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/50">
          {/* User Info / Actions */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <Button
              className="w-full font-bold shadow-sm"
              color="primary"
              variant="flat"
              startContent={<PlusCircle size={18} />}
              onPress={handleCreateNew}
            >
              New Environment
            </Button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">

            {/* Session Environments Section */}
            <div className="mb-2">
              <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider px-2 mb-2 mt-2 flex items-center gap-2">
                Session
                {isLoadingSessionEnvs && <span className="text-[10px] text-slate-400 animate-pulse ml-2">Syncing...</span>}
              </div>
              {!isLoadingSessionEnvs && sessionEnvironments.length === 0 ? (
                <div className="px-4 py-2 text-[10px] text-slate-400 italic">No linked environments</div>
              ) : (
                sessionEnvironments.map((env, i) => renderEnvItem(env, i, true))
              )}
            </div>

            <div className="h-px bg-slate-200 dark:bg-slate-700 my-2" />

            {/* Active (User) Environments Section */}
            <div className="mb-2 relative">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">Active Environments</div>
              {isLoadingEnvs ? (
                <div className="h-40 relative flex items-center justify-center">
                  <span className="text-slate-400 text-xs">Loading Environments...</span>
                </div>
              ) : environments.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <p className="text-xs text-slate-400">No environments found. Create one to get started.</p>
                </div>
              ) : (
                environments.map((env, i) => renderEnvItem(env, i, false))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE (70%) - Config Form */}
        <div className="w-[70%] flex flex-col bg-white dark:bg-slate-900 overflow-y-auto relative">
          {selectedEnvConfig ? (
            <div className="p-8 max-w-2xl mx-auto w-full relative">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                className="absolute top-2 right-2 z-10 text-slate-400 hover:text-slate-600"
                onPress={handleCloseConfig}
              >
                <X size={20} />
              </Button>
              <ConfigAccordion
                sendMessage={sendMessage}
                initialValues={selectedEnvConfig}
                shouldShowDefault={Object.keys(selectedEnvConfig).length === 0}
                user={user}
                userProfile={userProfile}
                saveUserWorldConfig={saveUserWorldConfig}
                listenToUserWorldConfig={listenToUserWorldConfig}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <PlusCircle size={32} className="text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-2">Configure Environment</h3>
              <p className="text-sm max-w-xs">Select an environment from the list to view details, or create a new one to get started.</p>
              <Button
                color="primary"
                variant="flat"
                className="mt-6 font-semibold"
                onPress={handleCreateNew}
              >
                Create New Environment
              </Button>
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
