import React, {useState, useCallback, useEffect, useRef} from "react";
import {initializeApp} from "firebase/app";
import {getDatabase, get, off, onChildChanged, query, ref, limitToLast} from "firebase/database";
import CfgCreator from "./components/cfg_cereator";

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
const _useWebSocket = (
  _wsUrl,
  _nodes,
  _edges,
  _updateNodes,
  _updateEdges,
  _updateCreds,
  _updateCfg,
  _updateDataset
) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsConnected(true);
    const timer = setTimeout(() => {
      setMessages(prev => [...prev, { type: "CHAT_MESSAGE", text: "Welcome to QDash!", timestamp: new Date().toISOString() }]);
      _updateCfg({
          "mock_pixel": {
              "mock_fermion": {
                  "max_value": 99.9,
                  "phase": []
              }
          }
      });
      _updateDataset({
        keys: ["col1", "col2"],
        rows: [{col1: "data1", col2: "data2"}]
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  /**
   * @param {ChatMessage} msg
   */
  const sendMessage = useCallback((msg) => {
    console.log("WebSocket: Sending message:", msg);
    setMessages(prev => [...prev, msg]);
  }, []);

  return { messages, sendMessage, isConnected, error };
};

/**
 * Mock für ThreeScene Komponente
 * @param {object} props
 * @param {Edge[]} props.edges
 * @param {Node[]} props.nodes
 * @param {(nodeId: string) => void} props.onNodeClick
 */
const ThreeScene = ({ edges, nodes, onNodeClick }) => {
  return (
    <div className="flex-1 bg-gray-900 flex items-center justify-center text-gray-400">
      <p>3D Scene Placeholder</p>
      <div className="absolute inset-0 flex flex-wrap justify-center items-center gap-4">
        {nodes.map(node => (
          <button
            key={node.id}
            onClick={() => onNodeClick(node.id)}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200"
          >
            Node: {node.id} ({node.status?.state || 'N/A'})
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * Mock für DataTable Komponente
 * @param {object} props
 * @param {TableDataRow[]} props.rows
 * @param {string[]} props.keys
 */
const DataTable = ({ rows, keys }) => {
  if (rows.length === 0) {
    return (
      <div className="p-4 bg-gray-700 text-gray-300 rounded-lg shadow-md max-h-96 overflow-y-auto w-full">
        <h3 className="text-xl font-semibold mb-3">Data Table (Placeholder)</h3>
        <p>No table data available.</p>
      </div>
    );
  }
  return (
    <div className="p-4 bg-gray-700 text-gray-300 rounded-lg shadow-md max-h-96 overflow-y-auto w-full">
      <h3 className="text-xl font-semibold mb-3">Data Table (Placeholder)</h3>
      <table className="min-w-full divide-y divide-gray-600">
        <thead className="bg-gray-600">
          <tr>
            {keys.map(key => (
              <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-200 uppercase tracking-wider">
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-gray-700 divide-y divide-gray-600">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {keys.map(key => (
                <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                  {String(row[key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Mock für NodeDrawer Komponente
 */
const NodeDrawer = () => {
  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-gray-800 text-white shadow-xl z-50 flex flex-col p-4">
      <h2 className="text-xl font-semibold mb-4">Node Drawer (Placeholder)</h2>
      <p>Details about all nodes or other information.</p>
    </div>
  );
};

/**
 * Mock für TerminalConsole Komponente
 * @param {object} props
 * @param {Error | null} props.error
 * @param {string} props.statusClass
 * @param {(e: React.FormEvent) => void} props.handleSubmit
 * @param {boolean} props.isConnected
 * @param {string} props.inputValue
 * @param {(value: string) => void} props.updateInputValue
 * @param {string[]} props.options
 */
const TerminalConsole = ({ error, statusClass, handleSubmit, isConnected, inputValue, updateInputValue, options }) => {
  const statusEmoji = isConnected ? "✔" : "✖";
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLocalSubmit = useCallback((e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setMessages(prev => [...prev, `> ${inputValue}`]);
      handleSubmit(e);
      updateInputValue('');
    }
  }, [inputValue, handleSubmit, updateInputValue]);

  return (
    <div className="p-4 bg-gray-800 text-gray-100 rounded-lg m-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {options.map((option) => (
          <button
            key={option}
            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
            onClick={() => console.log(`Option selected: ${option}`)}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="mb-2 text-sm max-h-48 overflow-y-auto bg-gray-700 p-2 rounded-md">
        <p className="text-gray-400">Connection: <span className={statusClass}>{isConnected ? "Established" : "Disconnected"} {statusEmoji}</span></p>
        {error && <p className="text-red-400">Error: {error.message || "Unknown Error"}</p>}
        {messages.map((msg, idx) => <p key={idx}>{msg}</p>)}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleLocalSubmit} className="flex items-center">
        <span className="text-blue-400 mr-2">:</span>
        <input
          type="text"
          className="flex-1 bg-transparent border-none text-white text-sm outline-none focus:ring-0"
          value={inputValue}
          onChange={(e) => updateInputValue(e.target.value)}
          placeholder="Enter command..."
          disabled={!isConnected}
        />
      </form>
    </div>
  );
};

/**
 * Mock für NodeInfoPanel
 * @param {object} props
 * @param {Node | null} props.node
 * @param {() => void} props.onClose
 * @param {(nodeId: string) => void} props.onDownloadSingle
 * @param {(nodeId: string) => void} props.onDownloadAll
 * @param {React.MutableRefObject<any>} props.firebaseDb
 * @param {any} props.fbCreds
 * @param {boolean} props.fbIsConnected
 * @param {(nodeId: string) => void} props.deactivate
 */
const NodeInfoPanel = ({ node, onClose, onDownloadSingle, onDownloadAll, firebaseDb, fbCreds, fbIsConnected, deactivate }) => {
    /** @type {React.MutableRefObject<Array<{ refObj: import("firebase/database").Query; callback: Function }>>} */
    const listenerRefs = useRef([]);
    const [logs, setLogs] = useState({});
    const [isOpen, setIsOpen] = useState(true);
    const updateLogs = useCallback((newLogEntry) => {
      setLogs(prevLogs => {
        if (newLogEntry && newLogEntry.id) {
          return {
            ...prevLogs,
            [newLogEntry.id]: newLogEntry
          };
        }
        return prevLogs;
      });
    }, []);
    useEffect(() => {
      setIsOpen(!!node);
    }, [node]);
    useEffect(() => {
      listenerRefs.current.forEach(({ refObj, callback }) => off(refObj, "child_changed", callback));
      listenerRefs.current = [];
      if (!node || !fbIsConnected || !firebaseDb.current) {
        console.log("Firebase DB oder Node nicht verfügbar. Listener werden nicht initialisiert oder bereinigt.");
        return;
      }
      const logs_path = `nodes/${node.id}/logs`;
      if (!logs_path) {
          console.error("logs_path konnte nicht erstellt werden. Node-ID möglicherweise ungültig.");
          return;
      }
      const dbRef = ref(firebaseDb.current, logs_path);
      const logsQuery = query(dbRef, limitToLast(30));
      console.log(`Fetching initial log data for node ${node.id} from path: ${logs_path}`);
      get(logsQuery).then((snapshot) => {
        if (snapshot.exists()) {
          const initialData = snapshot.val();
          console.log("Initial data loaded:", initialData);
          setLogs(initialData);
        } else {
          console.log("No initial data available.");
          setLogs({});
        }
      }).catch((error) => {
        console.error("Initial data fetch failed:", error);
        setLogs({});
      });
      const onChildChangedCallback = (snapshot) => {
        const changedData = snapshot.val();
        console.log("Child changed detected:", { key: snapshot.key, data: changedData });
        updateLogs({ id: snapshot.key, ...changedData });
      };
      onChildChanged(logsQuery, onChildChangedCallback);
      listenerRefs.current.push({ refObj: logsQuery, callback: onChildChangedCallback });
      return () => {
        console.log("Cleaning up Firebase listeners for node:", node?.id);
        listenerRefs.current.forEach(({ refObj, callback }) =>
          off(refObj, "child_changed", callback)
        );
        listenerRefs.current = [];
      };
    }, [node, fbIsConnected, firebaseDb, updateLogs]);
    if (!node || !isOpen) return null;
    return (
        <div
          className="fixed right-0 top-0 h-full w-96 bg-gray-800 text-white shadow-xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out"
          style={{
            transform: isOpen ? 'translateX(0)' : 'translateX(100%)'
          }}
        >
          <div className="flex flex-col gap-1 p-4 border-b border-gray-700 bg-gray-900">
            <h2 className="text-xl font-semibold">Info: {node?.id}</h2>
            {node?.name && <p className="text-gray-400 text-sm">{node.name}</p>}
            {node?.status && <p className="text-gray-400 text-sm">Status: {node.status}</p>}
          </div>
          <div className="flex-grow p-4 overflow-y-auto">
            <div className="bg-gray-700 p-3 rounded-lg mb-4">
                <h3 className="text-lg font-medium mb-2">Node Status (Placeholder)</h3>
                <p className="text-gray-300">Hier würden detaillierte Statusinformationen des Knotens angezeigt werden.</p>
                <p className="text-gray-400 text-sm mt-1">Aktueller Status: {node?.status || 'Unbekannt'}</p>
            </div>
            <div className="bg-gray-700 p-3 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Node Logs (Placeholder)</h3>
                {Object.keys(logs).length === 0 ? (
                    <p className="text-gray-300">Keine Logs verfügbar.</p>
                ) : (
                    <ul className="space-y-1 text-sm text-gray-300 max-h-48 overflow-y-auto custom-scrollbar">
                        {Object.entries(logs).map(([logId, logEntry]) => (
                            <li key={logId} className="border-b border-gray-600 pb-1 last:border-b-0">
                                <strong>{logId}:</strong> {JSON.stringify(logEntry)}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
          </div>
          <div className="flex justify-end gap-2 p-4 border-t border-gray-700 bg-gray-900">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium transition-colors duration-200"
            >
              Close
            </button>
            <button
              onClick={() => onDownloadSingle(node.id)}
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-200"
            >
              Download Single
            </button>
            <button
              onClick={() => onDownloadAll(node.id)}
              className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white font-medium transition-colors duration-200"
            >
              Download All
            </button>
            <button
              onClick={() => deactivate(node.id)}
              className="px-4 py-2 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white font-medium transition-colors duration-200"
            >
              Deactivate
            </button>
          </div>
        </div>
    );
};


/**
 * @param {string} statusState
 * @returns {string}
 */
const getNodeColor = (statusState) => {
  switch (statusState) {
    case 'active': return 'green';
    case 'inactive': return 'gray';
    case 'error': return 'red';
    case 'training': return 'yellow';
    default: return 'blue';
  }
};

/**
 * @param {NodeLogs} logs
 * @param {string} filename
 */
const downloadLogsCSV = (logs, filename) => {
  console.log(`Downloading ${filename} with logs:`, logs);
};

// --- Hauptkomponente QDash ---

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
  } = _useWebSocket(
    "WS_URL_PLACEHOLDER", nodes,
    edges, updateNodes,
    updateEdges, updateCreds,
    updateCfg, updateDataset
  );

  const statusClass = isConnected ? 'text-green-400' : 'text-red-400';

  const firebaseApp = useRef(null);
  const firebaseDb = useRef(null);
  /** @type {React.MutableRefObject<Array<{ refObj: import("firebase/database").Query; callback: Function }>>} */
  const listenerRefs = useRef([]);
  const fileInputRef = useRef(null);

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

  /**
   * @param {string} nodeId
   */
  const handleDownloadLogs = useCallback((nodeId) => {
    const logsToDownload = { [nodeId]: nodeLogs[nodeId] };
    downloadLogsCSV(logsToDownload, `node_${nodeId}_logs.csv`);
  }, [nodeLogs]);

  const handleDownloadAllLogs = useCallback(() => {
    downloadLogsCSV(nodeLogs, 'all_nodes_logs.csv');
  }, [nodeLogs]);

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
          onDownloadSingle={handleDownloadLogs}
          onDownloadAll={handleDownloadAllLogs}
          firebaseDb={firebaseDb}
          fbIsConnected={fbIsConnected}
          deactivate={(nodeId) => console.log(`Deactivating node: ${nodeId}`)}
        />
      );
    }
    return(
      <NodeDrawer />
    );
  },[selectedNode, firebaseDb, fbIsConnected, handleDownloadLogs, handleDownloadAllLogs]);


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
      />

      </div>

      {nodeSection()}
      <CfgCreator cfg_content={cfg_content} />
    </div>
  );
};

export default QDash;
