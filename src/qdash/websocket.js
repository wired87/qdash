import { useState, useEffect, useRef, useCallback } from "react";
import { USER_ID_KEY } from "./auth";
import { useEnvStore } from "./env_store";
import { store } from "./store";
import { setUserModules, setActiveModuleFields, updateModule } from "./store/slices/moduleSlice";
import { setActiveSessionModules, setActiveSessionFields, setSessions, mergeLinkData, removeSessionEnv, removeSessionModule, removeSessionField, removeInjectionFromAllSessions } from "./store/slices/sessionSlice";
import { setUserFields, updateField } from "./store/slices/fieldSlice";
import { setUserInjections } from "./store/slices/injectionSlice";
import {setUserMethods} from "./store/slices/methodSlice";




const handleDownload = (data) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "data.json"; // Dateiname
  link.click();

  URL.revokeObjectURL(url); // Speicher freigeben
};

const _useWebSocket = (
  updateCreds,
  updateDataset,
  addEnvs,
  updateGraph,
  setClusterData,
  updateLiveData, // New callback
  handleInjectionMessage, // Callback for injection messages
  addConsoleMessage // New callback for general console messages
) => {
  const [messages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  // const [deactivate, setDeactivate] = useState(false); // unused

  // useRef for message queue when offline
  const messageQueue = useRef([]);
  const ws = useRef(null);


  const get_ws_endpoint = () => {
    const userId = localStorage.getItem(USER_ID_KEY)
    const quey_str = `?user_id=${userId}&mode=demo`;

    // const backendEndpoint = process.env.REACT_APP_BACKEND_ENDPOINT || process.env.BACKEND_ENDPOINT; // unused

    /*
    if (backendEndpoint) {
      const url = `wss://${backendEndpoint}/run/${quey_str}`;
      console.log("url", url)
      return url
    }
    */

    const WS_URL_PROD = `wss://www.bestbrain.tech/run/${quey_str}`;
    const WS_URL_LOCAL = `ws://127.0.0.1:8000/run/${quey_str}`;

    const isProd = process.env.NODE_ENV === 'production';
    const targetUrl = isProd ? WS_URL_PROD : WS_URL_LOCAL;

    console.log("WebSocket Target URL:", targetUrl);
    return targetUrl;
  }


  // useCallback, um die send-Funktion zu memoizen
  const sendMessage = useCallback((message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      console.log("Send message:", message);
    } else {
      console.warn("WebSocket ist nicht verbunden. Nachricht wird in Warteschlange gelegt:", message);
      messageQueue.current.push(message);
    }
  }, []);

  const handleWebSocketMessage = (message) => {
    // Check for errors as requested: attr includes "error" or type includes "error"
    console.log("received data", message);
    const hasErrorAttr = Object.keys(message).some(key => key.toLowerCase().includes("error"));
    const isErrorType = message.type && typeof message.type === 'string' && message.type.toLowerCase().includes("error");

    if ((hasErrorAttr || isErrorType) && addConsoleMessage) {
      console.error("WebSocket Error Message Detected:", message);
      // Try to find the error content
      let errorText = message.error || message.err || message.message || message.msg || message.data;
      if (typeof errorText === 'object') errorText = JSON.stringify(errorText);
      if (!errorText) errorText = JSON.stringify(message);

      addConsoleMessage(`❌ WebSocket Error: ${errorText}`, 'system');
    }

    if (message.type === "WORLD_CONTENT") {
      // receive all world objects to render in dashboard
      addEnvs(message.data.envs)
      updateGraph(message.data.graph)
    } else if (message.type === "ENV_SET" || message.type === "SET_ENV_SUCCESS") {
      // Handle successful set_env response
      console.log("✅ Environment configuration saved:", message.env_id);

      if (addConsoleMessage) {
        addConsoleMessage(`✅ World config saved: ${message.env_id || 'environment'}`, 'system');
      }

      // Update local envs state with new config
      if (message.config && message.env_id) {
        const newEnv = {
          [message.env_id]: {
            ...message.config,
            status: 'configured'
          }
        };
        addEnvs(newEnv);
      }
    } else if (message.type === "SET_ENV_ERROR") {
      // Handle set_env error
      console.error("❌ Failed to set environment:", message.error);

      if (addConsoleMessage) {
        addConsoleMessage(`❌ Failed to save world config: ${message.error || 'Unknown error'}`, 'system');
      }
    } else if (message.type === "ENV_LIST" || message.type === "GET_ENV_RESPONSE" || message.type === "GET_ENV" || message.type === "GET_USERS_ENVS" || message.type === "LIST_USERS_ENVS" || message.type === "LIST_ENVS") {
      // Handle environment list response
      // Check for message.data.envs as strictly requested
      const envsList = message.data?.envs || message.data?.environments || message.environments || [];
      const count = Array.isArray(envsList) ? envsList.length : Object.keys(envsList).length;

      console.log("📋 Received environment list:", count, "environments");

      if (addConsoleMessage) {
        if (count === 0) addConsoleMessage('ℹ️ No environments found', 'system');
        else addConsoleMessage(`📋 Loaded ${count} environment${count !== 1 ? 's' : ''}`, 'system');
      }

      // Process and update environment state
      let envsMap = {};

      if (Array.isArray(envsList)) {
        envsList.forEach(env => {
          // Schema: { id, sim_time, amount_of_nodes, dims, field_id }
          const id = env.id || env.env_id || env.nid;
          if (id) {
            envsMap[id] = {
              id: id,
              sim_time: env.sim_time,
              amount_of_nodes: env.amount_of_nodes,
              dims: env.dims,
              field_id: env.field_id ?? env.field,
              status: env.status || 'default',
              nodes: env.nodes || {},
              ...env
            };
          }
        });
      } else if (envsList) {
        envsMap = envsList;
      }

      // Update global store
      if (Object.keys(envsMap).length > 0) {
        if (addEnvs) addEnvs(envsMap);

        try {
          useEnvStore.getState().addEnvs(envsMap);
        } catch (e) {
          console.warn("Could not update global env store directly:", e);
        }
      }
    } else if (["GET_SESSIONS_ENVS", "LIST_SESSIONS_ENVS", "LINK_ENV_SESSION", "RM_LINK_ENV_SESSION"].includes(message.type)) {
      // Merge hierarchical link data if present

      if (message.data?.sessions) {
        store.dispatch(mergeLinkData(message.data));
      }

      // Handle removal specifically
      if (message.type === "RM_LINK_ENV_SESSION" && message.auth) {
        const { session_id, env_id } = message.auth;
        if (session_id && env_id) {
          store.dispatch(removeSessionEnv({ sessionId: session_id, envId: env_id }));
        }
      }

      if (addConsoleMessage) {
        if (message.type === "LINK_ENV_SESSION") addConsoleMessage('🔗 Environment linked to session', 'system');
        else if (message.type === "RM_LINK_ENV_SESSION") addConsoleMessage('🔗 Environment unlinked from session', 'system');
        else addConsoleMessage('📋 Session environments updated', 'system');
      }

    } else if (message.type === "ENV_DELETED" || message.type === "DEL_ENV") {
      // Handle environment deletion confirmation
      console.log("🗑️ Environment deleted:", message.env_id);

      if (addConsoleMessage) {
        addConsoleMessage(`🗑️ Environment deleted: ${message.env_id}`, 'system');
      }

      // Remove from local envs state
      if (message.env_id) {
        // Optionally remove from addEnvs - depends on your state management
        // For now, the component handles it via its own listener
      }
    } else if (message.type === "CLUSTER_INJECTION_SET" || message.type === "SET_CLUSTER_INJECTION_SUCCESS") {
      // Handle cluster injection mapping success
      const envId = message.auth?.env_id || message.env_id;
      console.log("✅ Cluster injection mapping saved:", envId);

      if (addConsoleMessage) {
        addConsoleMessage(`✅ Injections applied to cluster: ${envId}`, 'system');
      }
    } else if (message.type === "GET_INJ_USER") {
      // Handle user injection list response
      const injections = message.data?.injections || message.injections || [];

      console.log("📋 Received user injections:", injections.length);
      store.dispatch(setUserInjections(injections));

      if (addConsoleMessage) {
        const count = injections.length;
        if (count === 0) addConsoleMessage('ℹ️ No injections found', 'system');
        else addConsoleMessage(`📋 Loaded ${count} injection${count !== 1 ? 's' : ''}`, 'system');
      }
      // Data is handled by the component's event listener

    } else if (message.type === "LIST_USERS_METHODS") {
      // Handle user injection list response
      const methods = message.data?.methods || message.methods || [];

      console.log("📋 Received user Methods:", methods.length);
      store.dispatch(setUserMethods(methods));

      if (addConsoleMessage) {
        const count = methods.length;
        if (count === 0) addConsoleMessage('ℹ️ No injections found', 'system');
        else addConsoleMessage(`📋 Loaded ${count} methods${count !== 1 ? 's' : ''}`, 'system');
      }
      // Data is handled by the component's event listener

    } else if (message.type === "SET_INJ") {
      // Handle injection save response (check status.state)
      const injId = message.data?.id || message.id;

      if (message.status?.state === "success") {
        console.log("✅ Injection saved:", injId);
        if (addConsoleMessage) {
          addConsoleMessage(`✅ Injection saved: ${injId}`, 'system');
        }
      } else if (message.status?.state === "error") {
        console.error("❌ Injection save error:", message.status?.error);
        if (addConsoleMessage) {
          addConsoleMessage(`❌ Failed to save injection: ${message.status?.error}`, 'error');
        }
      }
      // Component will request get_inj_user to refresh list
    } else if (message.type === "DEL_INJ") {
      // Handle injection deletion response (check status.state)
      const injId = message.data?.id || message.id;

      if (message.status?.state === "success") {
        console.log("🗑️ Injection deleted:", injId);

        // Remove injection from all sessions
        if (injId) {
          store.dispatch(removeInjectionFromAllSessions({ injectionId: injId }));
        }

        if (addConsoleMessage) {
          addConsoleMessage(`🗑️ Injection deleted: ${injId}`, 'system');
        }
      } else if (message.status?.state === "error") {
        console.error("❌ Injection deletion error:", message.status?.error);
        if (addConsoleMessage) {
          addConsoleMessage(`❌ Failed to delete injection: ${message.status?.error}`, 'error');
        }
      }
    } else if (message.type === "WORLD_CFG") {
      // Handle world configuration message (backwards compatibility)
      // Expected structure: { world_cfg: { nid, cfg, type } }
      if (message.world_cfg) {
        const { nid, cfg, type } = message.world_cfg;
        console.log("Received world_cfg:", { nid, cfg, type });

        // Add to envs structure using the env_id (nid) as key
        const newEnv = {
          [nid]: {
            ...cfg,
            type: type,
            nodes: cfg.nodes || {},
            status: cfg.status || 'default'
          }
        };
        addEnvs(newEnv);

        if (addConsoleMessage) {
          addConsoleMessage(`✅ World configuration loaded: ${nid}`, 'system');
        }
      }
    } else if (message.type === "CREDS") {
      //  iun demo receive entire G at once
      if (message.data) {
        updateCreds(message.data);
      }
    } else if (message.type === "DATASET") {
      //  iun demo receive entire G at once
      if (message.data) updateDataset(message.data);
    } else if (message.type === "DATA_RESPONSE") {
      handleDownload(message.data);
    } else if (message.type === "CLUSTER_DATA") {
      if (message.data) setClusterData(message.data);
    } else if (message.type === "4D_DATA") {
      if (message.data && updateLiveData) updateLiveData(message.data);
    } else if (message.type === "INJ_PATTERN_STRUCT" || message.type === "INJ_PATTERN_STRUCT_ERR") {
      if (handleInjectionMessage) handleInjectionMessage(message);
    } else if (message.type === "SET_SID") {
      const sid = message.auth?.sid;
      if (sid) {
        sessionStorage.setItem("QBRAIN_SESSION_ID", sid);
        console.log("✅ Session ID saved:", sid);
        if (addConsoleMessage) {
          addConsoleMessage(`✅ Session established: ${sid}...`, 'system');
        }
      }
    } else if (message.type === "ENABLE_SM") {
      // Handle ENABLE_SM configuration
      // Expected structure: { session_id: { env_id: { module_id: [field_id, ...] } } }
      if (message.data) {
        console.log("📡 Received ENABLE_SM configuration:", message.data);

        // Dispatch to Redux to merge with session config
        store.dispatch({
          type: 'sessions/mergeEnableSM',
          payload: message.data
        });

        if (addConsoleMessage) {
          addConsoleMessage('✅ SM configuration received', 'system');
        }
      }
    } else if (message.type === "FINISHED") {
      // setDeactivate(true); // Unused, state removed
    } else if (["LIST_USERS_MODULES", "DEL_MODULE", "SET_MODULE"].includes(message.type)) {
      // Handle User Modules List
      const modules = message.data?.modules || message.data || [];
      // Ensure strictly array
      const safeModules = Array.isArray(modules) ? modules : [];

      console.log(`📦 User Modules update (${message.type}):`, safeModules.length);
      store.dispatch(setUserModules(safeModules));

      if (addConsoleMessage) {
        if (message.type === "DEL_MODULE") addConsoleMessage('🗑️ Module deleted', 'system');
        else if (message.type === "SET_MODULE") addConsoleMessage('✅ Module saved', 'system');
        else {
          if (safeModules.length === 0) addConsoleMessage('ℹ️ No modules found', 'system');
          else addConsoleMessage(`📦 User modules loaded: ${safeModules.length}`, 'system');
        }
      }

    } else if (message.type === "LIST_USERS_SESSIONS") {
      // Handle User Sessions List
      let safeSessions = [];

      // Extract sessions array
      if (Array.isArray(message.data?.sessions)) {
        safeSessions = message.data.sessions;
      } else if (Array.isArray(message.data)) {
        safeSessions = message.data;
      } else if (message.data?.sessions && typeof message.data.sessions === 'object') {
        // If sessions is an object (hierarchical structure), extract session IDs
        safeSessions = Object.keys(message.data.sessions).map(sessionId => ({ id: sessionId }));
      }

      console.log(`📋 User Sessions update (${message.type}):`, safeSessions.length);
      store.dispatch(setSessions(safeSessions));

      // Also merge hierarchical link data if present
      if (message.data?.sessions && typeof message.data.sessions === 'object') {
        store.dispatch(mergeLinkData(message.data));
      }

      if (addConsoleMessage) {
        if (safeSessions.length === 0) addConsoleMessage('ℹ️ No sessions found', 'system');
        else addConsoleMessage(`📋 User sessions loaded: ${safeSessions.length}`, 'system');
      }

    } else if (["GET_SESSIONS_MODULES", "LINK_ENV_MODULE", "RM_LINK_ENV_MODULE"].includes(message.type)) {
      // Handle Session Modules List with new hierarchical structure
      // Expected: { sessions: { session_id: { envs: { env_id: { modules: { module_id: {...} } } } } } }

      let extractedModules = [];

      if (message.data?.sessions) {
        // New hierarchical structure
        Object.values(message.data.sessions).forEach(session => {
          if (session.envs) {
            Object.values(session.envs).forEach(env => {
              if (env.modules) {
                Object.keys(env.modules).forEach(moduleId => {
                  if (!extractedModules.includes(moduleId)) {
                    extractedModules.push(moduleId);
                  }
                });
              }
            });
          }
        });
      } else if (message.data?.modules) {
        // Fallback to old structure
        extractedModules = Array.isArray(message.data.modules) ? message.data.modules : [];
      } else if (Array.isArray(message.data)) {
        extractedModules = message.data;
      }

      console.log(`🔗 Session Modules update (${message.type}):`, extractedModules.length);
      store.dispatch(setActiveSessionModules(extractedModules));

      // Merge hierarchical link data if present
      if (message.data?.sessions) {
        store.dispatch(mergeLinkData(message.data));
      }

      // Handle removal specifically
      if (message.type === "RM_LINK_ENV_MODULE" && message.auth) {
        const { session_id, env_id, module_id } = message.auth;
        if (session_id && env_id && module_id) {
          store.dispatch(removeSessionModule({ sessionId: session_id, envId: env_id, moduleId: module_id }));
        }
      }

      if (addConsoleMessage) {
        if (message.type === "LINK_ENV_MODULE") addConsoleMessage('🔗 Module linked to session', 'system');
        else if (message.type === "RM_LINK_ENV_MODULE") addConsoleMessage('🔗 Module unlinked from session', 'system');
        else addConsoleMessage(`🔗 Session modules loaded: ${extractedModules.length}`, 'system');
      }
    } else if (message.type === "GET_MODULE") {
      // Individual module details - mostly for UI viewing, maybe no global store needed yet, 
      // but often useful to update the item in the list if it existss.
      console.log("📦 Module details received:", message.data);
      // For now, we might not need to store single module in global state if the list is the source of truth,
      // but if we are editing it, potentially good. 
      // Let's leave it as is for now or dispatch if we add 'setActiveModule'
    } else if (message.type === "CONVERT_MODULE") {
      console.log("🔄 Module conversion result:", message.data);
      if (addConsoleMessage) addConsoleMessage('✅ Module conversion complete', 'system');

    } else if (["LIST_USERS_FIELDS", "DEL_FIELD", "SET_FIELD"].includes(message.type)) {
      // Handle User Fields List
      const fields = message.data?.fields || message.data || [];
      const safeFields = Array.isArray(fields) ? fields : [];

      console.log(`🌾 User Fields update (${message.type}):`, safeFields.length);
      store.dispatch(setUserFields(safeFields));

      if (addConsoleMessage) {
        if (message.type === "DEL_FIELD") addConsoleMessage('🗑️ Field deleted', 'system');
        else if (message.type === "SET_FIELD") addConsoleMessage('✅ Field saved', 'system');
        else {
          if (safeFields.length === 0) addConsoleMessage('ℹ️ No fields found', 'system');
          else addConsoleMessage(`🌾 User fields loaded: ${safeFields.length}`, 'system');
        }
      }

    } else if (["LIST_MODULES_FIELDS", "GET_MODULES_FIELDS", "LINK_MODULE_FIELD", "RM_LINK_MODULE_FIELD"].includes(message.type)) {
      // Handle Module Fields List with new hierarchical structure
      // Expected: { sessions: { session_id: { envs: { env_id: { modules: { module_id: { fields: [...] } } } } } } }

      let extractedFields = [];

      if (message.data?.sessions) {
        // New hierarchical structure
        Object.values(message.data.sessions).forEach(session => {
          if (session.envs) {
            Object.values(session.envs).forEach(env => {
              if (env.modules) {
                Object.values(env.modules).forEach(module => {
                  if (module.fields && Array.isArray(module.fields)) {
                    module.fields.forEach(fieldId => {
                      if (!extractedFields.includes(fieldId)) {
                        extractedFields.push(fieldId);
                      }
                    });
                  }
                });
              }
            });
          }
        });
      } else if (message.data?.fields) {
        // Fallback to old structure
        extractedFields = Array.isArray(message.data.fields) ? message.data.fields : [];
      } else if (Array.isArray(message.data)) {
        extractedFields = message.data;
      }

      console.log(`🔗 Module Fields update (${message.type}):`, extractedFields.length);
      store.dispatch(setActiveModuleFields(extractedFields));

      // Merge hierarchical link data if present
      if (message.data?.sessions) {
        store.dispatch(mergeLinkData(message.data));
      }

      // Handle removal specifically
      if (message.type === "RM_LINK_MODULE_FIELD" && message.auth) {
        const { session_id, env_id, module_id, field_id } = message.auth;
        if (session_id && env_id && module_id && field_id) {
          store.dispatch(removeSessionField({ sessionId: session_id, envId: env_id, moduleId: module_id, fieldId: field_id }));
        }
      }

      if (addConsoleMessage) {
        if (message.type === "LINK_MODULE_FIELD") addConsoleMessage('🔗 Field linked to module', 'system');
        else if (message.type === "RM_LINK_MODULE_FIELD") addConsoleMessage('🔗 Field unlinked from module', 'system');
        else addConsoleMessage(`🔗 Module fields loaded: ${extractedFields.length}`, 'system');
      }

    } else if (message.type === "SESSIONS_FIELDS") {
      // Handle Session Fields List with new hierarchical structure
      // Expected: { sessions: { session_id: { envs: { env_id: { modules: { module_id: { fields: [...] } } } } } } }

      let extractedFields = [];

      if (message.data?.sessions) {
        // New hierarchical structure
        Object.values(message.data.sessions).forEach(session => {
          if (session.envs) {
            Object.values(session.envs).forEach(env => {
              if (env.modules) {
                Object.values(env.modules).forEach(module => {
                  if (module.fields && Array.isArray(module.fields)) {
                    module.fields.forEach(fieldId => {
                      if (!extractedFields.includes(fieldId)) {
                        extractedFields.push(fieldId);
                      }
                    });
                  }
                });
              }
            });
          }
        });
      } else if (message.data?.fields) {
        // Fallback to old structure
        extractedFields = Array.isArray(message.data.fields) ? message.data.fields : [];
      } else if (Array.isArray(message.data)) {
        extractedFields = message.data;
      }

      console.log(`🔗 Session Fields update (${message.type}):`, extractedFields.length);
      store.dispatch(setActiveSessionFields(extractedFields));

      // Merge hierarchical link data if present
      if (message.data?.sessions) {
        store.dispatch(mergeLinkData(message.data));
      }

      if (addConsoleMessage) addConsoleMessage(`🔗 Session fields loaded: ${extractedFields.length}`, 'system');

    } else if (message.type === "GET_ITEM") {
      // Handle generic GET_ITEM response
      const itemData = message.data || {};
      console.log("📦 Received Item Details:", itemData);

      if (itemData.id) {
        // Attempt to update across all stores as we might not know the type for sure
        // 1. Env
        addEnvs({ [itemData.id]: itemData });
        // 2. Module
        store.dispatch(updateModule(itemData));
        // 3. Field
        store.dispatch(updateField(itemData));
      }

      if (addConsoleMessage) addConsoleMessage(`📦 Loaded details for: ${itemData.id || 'Unknown Item'}`, 'system');

    } else {
      // Für alle anderen unbekannten Nachrichtentypen
      console.log("Unbekannte WebSocket-Nachricht:", message);
    }
  }
  // Tom
  // Reconnection refs
  const reconnectTimeout = useRef(null);
  const isMounted = useRef(true);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) return;

    ws.current = new WebSocket(get_ws_endpoint());

    ws.current.onopen = () => {
      console.log("WebSocket verbunden");
      if (isMounted.current) {
        setIsConnected(true);
        setError(null);
        window.dispatchEvent(new CustomEvent('qdash-ws-status', { detail: { status: 'connected', isConnected: true } }));
      }

      // Flush message queue safely
      const flushQueue = () => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
          if (messageQueue.current.length > 0) {
            console.log(`Flushing ${messageQueue.current.length} queued messages...`);
            while (messageQueue.current.length > 0) {
              const msg = messageQueue.current.shift();
              try {
                ws.current.send(JSON.stringify(msg));
                console.log("Sent queued message:", msg);
              } catch (err) {
                console.error("Failed to send queued message:", err);
                break;
              }
            }
          }
        } else {
          setTimeout(flushQueue, 50);
        }
      };

      flushQueue();
    };

    ws.current.onmessage = (event) => {
      try {
        const receivedMessage = JSON.parse(event.data);
        window.dispatchEvent(new CustomEvent('qdash-ws-message', { detail: receivedMessage }));
        handleWebSocketMessage(receivedMessage);
      } catch (e) {
        console.log("Fehler beim Parsen der WebSocket-Nachricht:", e);
      }
    };

    ws.current.onclose = (event) => {
      console.log("WebSocket getrennt", event.code, event.reason);
      if (isMounted.current) {
        setIsConnected(false);
        window.dispatchEvent(new CustomEvent('qdash-ws-status', { detail: { status: 'disconnected', isConnected: false, code: event.code } }));

        // Attempt Reconnect automatically
        if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = setTimeout(() => {
          console.log("Attempting WebSocket reconnection...");
          connect();
        }, 3000);
      }
    };

    ws.current.onerror = (event) => {
      console.log("WebSocket Fehler:", event);
      if (isMounted.current) {
        setError(event);
        setIsConnected(false);
        window.dispatchEvent(new CustomEvent('qdash-ws-status', { detail: { status: 'error', isConnected: false, error: event } }));
      }
    };

  }, []);

  useEffect(() => {
    isMounted.current = true;
    connect();

    return () => {
      isMounted.current = false;
      if (ws.current) ws.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [connect]);
   // new
  return { messages, sendMessage, isConnected, error };
};


export default _useWebSocket