import React, {useState, useCallback, useEffect, useRef} from "react";
import {initializeApp} from "firebase/app";
import {getDatabase, off, onChildChanged, ref} from "firebase/database";
import CfgCreator from "./components/cfg_cereator";
import _useWebSocket from "./websocket";
import {getNodeColor} from "./get_color";
import {ThreeScene} from "./_use_three";
import {DataTable} from "./table";
import {NodeInfoPanel} from "./components/node_info_panel";
import NodeDrawer from "./components/options_terminal";
import {TerminalConsole} from "./components/terminal";

const defaultCfg = {

}


// --- CfgCreator Komponente (hierher verschoben und nach JS konvertiert) ---

/**
 * @typedef {object} PhaseType
 * @property {string} id
 * @property {number} iterations
 * @property {number} max_val_multiplier
 */

/**
 * @typedef {object} FermionSubAttrs
 * @property {number|string} max_value
 * @property {PhaseType[]} phase
 */


// --- Schnittstellen-Definitionen für QDash (als JSDoc) ---

/**
 * @typedef {object} Node
 * @property {string} id
 * @property {any} [pos]
 * @property {string} [type]
 * @property {string} [name]
 * @property {{state: string}} [status]
 * @property {{status: {state: string}}} [meta]
 * @property {string} [color]
 * @property {string} [session_id]
 */

/**
 * @typedef {object} Edge
 * @property {string} id
 * @property {string} src
 * @property {string} trgt
 * @property {string} [session_id]
 */

/**
 * @typedef {object} FbCreds
 * @property {any} creds
 * @property {string[]} listener_paths
 * @property {string} status_path
 * @property {string} db_path
 */

/**
 * @typedef {object} ChatMessage
 * @property {string} text
 * @property {"CHAT_MESSAGE" | "COMMAND" | "LOGS" | "FILE_UPLOAD" | "REQUEST_TABLE_DATA" | "TRAIN_MODEL"} type
 * @property {string} timestamp
 * @property {{nodeId: string}} [info]
 * @property {{name: string; type: string; size: number; content: string;}} [file]
 * @property {any} [data]
 */

/**
 * @typedef {object} NodeLogEntry
 * @property {string} id
 * @property {string} [err]
 * @property {string} [out]
 */

/**
 * @typedef {object} NodeLogs
 * @property {{[logId: string]: NodeLogEntry} | NodeLogEntry[]} [nodeId]
 */

/**
 * @typedef {object} TableDataRow
 * @property {any} [key]
 */

/**
 * @typedef {object} Dataset
 * @property {string[]} keys
 * @property {TableDataRow[]} rows
 */

// --- Placeholder/Mock Komponenten und Funktionen (nach JS konvertiert) ---

/**
 * Mock für _useWebSocket Hook
 * @param {string} _wsUrl
 * @param {Node[]} _nodes
 * @param {Edge[]} _edges
 * @param {(data: Node | Node[]) => void} _updateNodes
 * @param {(data: Edge | Edge[]) => void} _updateEdges
 * @param {(data: FbCreds | null) => void} _updateCreds
 * @param {(data: CfgContent) => void} _updateCfg
 * @param {(data: Dataset) => void} _updateDataset
 */

const QDash = () => {
  const [nodes, setNodes] = useState([]);
  const [historyNodes, setHistoryNodes] = useState([]);
  const [historyEdges, setHistoryEdges] = useState([]);
  const [edges, setEdges] = useState([]);
  const [fbCreds, setFbCreds] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [chatInputValue, setChatInputValue] = useState("");
  const [fbIsConnected, setfbIsConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeLogs, setNodeLogs] = useState({});
  const [isDataSidebarOpen, setIsDataSidebarOpen] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [cfg_content, setCfg_content] = useState({});
  const [dataset, setDataset] = useState(
    {
      keys: [],
      rows: []
    }
  );

  /**
   * @param {Dataset} data
   */
  const updateDataset = (data) => {
    setDataset(data);
  };

  /**
   * @param {CfgContent} data
   */
  const updateCfg = (data) => {
    setCfg_content(data);
  };

  /**
   * @param {string} data
   */
  const updateInputValue = (data) => {
    setInputValue(data);
  };

  /**
   * @param {Node | Node[]} data
   */
  const updateHistoryNodes = useCallback((data) => {
    setHistoryNodes(prev => {
        const items = Array.isArray(data) ? data : [data];
        let newHNodes = [...prev];
        items.forEach(item => {
            const index = newHNodes.findIndex(e => e.id === item.id);
            if (index > -1) newHNodes[index] = { ...newHNodes[index], ...item };
            else newHNodes.push(item);
        });
        return newHNodes;
    });
  }, []);

  /**
   * @param {number} len
   * @returns {string}
   */
  function randomId(len = 30) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < len; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * @param {Edge | Edge[]} data
   */
  const updateHistoryEdges = useCallback((data) => {
    setHistoryEdges(prev => {
        const items = Array.isArray(data) ? data : [data];
        let newHEdges = [...prev];
        items.forEach(item => {
            const index = newHEdges.findIndex(e => e.id === item.id);
            if (index > -1) newHEdges[index] = { ...newHEdges[index], ...item };
            else newHEdges.push(item);
        });
        return newHEdges;
    });
  }, []);

  /**
   * @param {Edge | Edge[]} data
   */
  const updateEdges = useCallback((data) => {
    setEdges(prev => {
        const items = Array.isArray(data) ? data : [data];
        let newEdges = [...prev];
        items.forEach(item => {
            const index = newEdges.findIndex(e => e.id === item.id);
            if (index > -1) newEdges[index] = { ...newEdges[index], ...item };
            else newEdges.push(item);
        });
        return newEdges;
    });
  },[]);

  /**
   * @param {Node | Node[]} data
   */
  const updateNodes = useCallback((data) => {
    setNodes(prev => {
        const items = Array.isArray(data) ? data : [data];
        let newNodes = [...prev];
        items.forEach(item => {
            const index = newNodes.findIndex(n => n.id === item.id);
            if (index > -1) newNodes[index] = { ...newNodes[index], ...item };
            else newNodes.push(item);
        });
        return newNodes;
    });
  },[]);

  /**
   * @param {FbCreds | null} data
   */
  const updateCreds = useCallback((data) => {
    if (data) {
        setFbCreds({
            creds: data.creds,
            listener_paths: data.listener_paths,
            status_path: data.status_path,
            db_path: data.db_path,
        });
    } else {
        setFbCreds(null);
    }
  },[]);

  /**
   * @param {string} nodeId
   * @param {string} logId
   * @param {NodeLogEntry} logEntry
   */

  const updateNodeLogs = useCallback((nodeId, logId, logEntry) => {
    setNodeLogs(prevLogs => ({
      ...prevLogs,
      [nodeId]: {
        ...(prevLogs[nodeId] || {}),
        [logId]: logEntry
      }
    }));
  }, []);


  const {
    messages, sendMessage,
    isConnected, error,
    data,
  } = _useWebSocket(
    updateNodes,
    updateEdges, updateCreds,
    updateCfg, updateDataset
  );


  const statusClass = isConnected ? 'text-green-400' : 'text-red-400';

  const firebaseApp = useRef(null);
  const firebaseDb = useRef(null);
  /** @type {React.MutableRefObject<Array<{ refObj: import("firebase/database").Query; callback: Function }>>} */
  const listenerRefs = useRef([]);

  useEffect(() => {
    if (!fbIsConnected && fbCreds) {
      try {
        firebaseApp.current = initializeApp({
          credential: fbCreds.creds,
          databaseURL: fbCreds.db_path
        });
        console.log('Firebase-Initialisierung erfolgreich');

        firebaseDb.current = getDatabase(firebaseApp.current);
        setfbIsConnected(true);
      } catch (e) {
        console.error('Firebase-Initialisierung fehlgeschlagen:', e);
        setfbIsConnected(false);
      }
    }
  }, [fbCreds, fbIsConnected]);

  /**
   * @param {any} snapshot
   */
  const handleDataChange = useCallback((snapshot) => {
    const changedData = snapshot.val();
    const nodeIdWithSuffix = snapshot.key;

    if (!changedData) return;

    const parts = nodeIdWithSuffix.split('__');
    const actualNodeId = parts[0];

    if (changedData.session_id && !changedData.src) {
        updateNodes({ id: nodeIdWithSuffix, ...changedData });
    } else if (changedData.session_id && changedData.src) {
        updateHistoryEdges({ id: nodeIdWithSuffix, ...changedData });
    } else if (changedData.src && changedData.trgt) {
        updateEdges({ id: nodeIdWithSuffix, ...changedData });
    } else if (changedData.pos && changedData.type) {
        updateNodes({ id: nodeIdWithSuffix, ...changedData });
    } else if (changedData.err || changedData.out) {
        console.log("Log change detected:", nodeIdWithSuffix);
        const nodeForLog = parts.length > 1 ? parts[0] : nodeIdWithSuffix;
        const logId = parts.length > 1 ? parts[1] : randomId(10);
        updateNodeLogs(nodeForLog, logId, { id: logId, ...changedData });
    } else if (changedData.status && changedData.meta) {
        updateNodes(
            {
                id: nodeIdWithSuffix,
                meta: changedData.meta,
                color: getNodeColor(changedData.meta.status.state)
            }
        );
    }
    if (Array.isArray(changedData.logs)) {
        setNodeLogs(prevLogs => ({
            ...prevLogs,
            [nodeIdWithSuffix]: changedData.logs
        }));
    }
  }, [updateNodes, updateEdges, updateHistoryEdges, updateNodeLogs]);

  useEffect(() => {
    if (fbIsConnected && fbCreds && firebaseDb.current) {
        listenerRefs.current.forEach(({refObj, callback}) => off(refObj, 'child_changed', callback));
        listenerRefs.current = [];

        fbCreds.listener_paths.forEach(path => {
          const dbRef = ref(firebaseDb.current, path);
          onChildChanged(dbRef, handleDataChange);
          listenerRefs.current.push({refObj: dbRef, callback: handleDataChange});
        });

    }
    return () => {
      listenerRefs.current.forEach(({ refObj, callback }) => off(refObj, 'child_changed', callback));
      listenerRefs.current = [];
    };
  }, [fbIsConnected, fbCreds, handleDataChange]);

  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage.type === "CHAT_MESSAGE") {
        setChatMessages(prev => [...prev, latestMessage]);
      }
      else if (latestMessage.type === "TABLE_DATA" && Array.isArray(latestMessage.data)) {
        setTableData(latestMessage.data);
        setIsTraining(false);
      }
      else if (latestMessage.type === "TRAINING_COMPLETE") {
        setIsTraining(false);
      }
    }
  }, [messages]);

  /**
   * @param {React.FormEvent} e
   */
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (inputValue.trim() && isConnected) {
      sendMessage({ text: inputValue, type: "COMMAND", timestamp: new Date().toISOString() });
      setInputValue('');
    }
  }, [inputValue, isConnected, sendMessage]);

  /**
   * @param {string} nodeId
   */
  const handleNodeClick = useCallback((nodeId) => {
    const nodeData = nodes.find(n => n.id === nodeId);
    if (nodeData) {
      setSelectedNode(nodeData);
      sendMessage({ type: "LOGS", info: { nodeId }, timestamp: new Date().toISOString() });
    }
  }, [sendMessage, nodes]);

  /**
   * @param {React.FormEvent} e
   */
  const handleChatSubmit = useCallback((e) => {
    e.preventDefault();
    if (chatInputValue.trim() && isConnected) {
      sendMessage({ text: chatInputValue, type: "CHAT_MESSAGE", timestamp: new Date().toISOString() });
      setChatInputValue('');
    }
  }, [chatInputValue, isConnected, sendMessage]);

  /**
   * @param {React.ChangeEvent<HTMLInputElement>} e
   */
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file && isConnected) {
      const reader = new FileReader();
      reader.onload = (event) => {
        sendMessage({
          type: "FILE_UPLOAD",
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
            content: event.target?.result.split(',')[1],
          },
          timestamp: new Date().toISOString()
        });
      };
      reader.readAsDataURL(file);
    }
  }, [isConnected, sendMessage]);


  const handleToggleDataSidebar = useCallback(() => {
      const willBeOpen = !isDataSidebarOpen;
      setIsDataSidebarOpen(willBeOpen);
      if (willBeOpen) {
          sendMessage({ type: "REQUEST_TABLE_DATA", timestamp: new Date().toISOString() });
      }
  }, [isDataSidebarOpen, sendMessage]);

  const handleTrainModel = useCallback(() => {
      setIsTraining(true);
      sendMessage({ type: "TRAIN_MODEL", timestamp: new Date().toISOString() });
  }, [sendMessage]);


  const renderScene = useCallback(() => {
    return <ThreeScene edges={edges} nodes={nodes} onNodeClick={handleNodeClick} />;
  }, [edges, nodes, handleNodeClick]);


  const render_data_view = useCallback(() => {
    if (!isDataSidebarOpen) return null;
    return (
      <DataTable
        rows={dataset.rows}
        keys={dataset.keys}
      />
    );
  }, [dataset, isDataSidebarOpen]);

  const nodeSection = useCallback(() => {
    console.log("selectedNode, firebaseDb,fbIsConnected", selectedNode, firebaseDb,fbIsConnected);
    if (selectedNode) {
      return(
        <NodeInfoPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          //onDownloadSingle={handleDownloadLogs}
          //onDownloadAll={handleDownloadAllLogs}
          firebaseDb={firebaseDb}
          fbIsConnected={fbIsConnected}
          deactivate={(nodeId) => console.log(`Deactivating node: ${nodeId}`)}
        />
      );
    }
    return(
      <NodeDrawer />
    );
  },[selectedNode, firebaseDb, fbIsConnected]);


  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', backgroundColor: "#131314", color: "#e3e3e3", fontFamily: 'sans-serif' }}>

      {render_data_view()}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        {nodes.length === 0 && edges.length === 0 ? (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>Loading...</div>
        ) : (
          renderScene()
        )}
          <TerminalConsole
            error={error}
            statusClass={statusClass}
            handleSubmit={handleSubmit}
            isConnected={isConnected}
            inputValue={inputValue}
            updateInputValue={updateInputValue}
            options={["config creation", "QA"]}
            messages={messages}
          />
      </div>
      {nodeSection()}
      <CfgCreator cfg_content={cfg_content} sendMessage={sendMessage} />
    </div>
  );
};

export default QDash;
