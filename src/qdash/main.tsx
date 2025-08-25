import React, {useCallback, useEffect, useRef, useState} from 'react';
import _useWebSocket from "./websocket";
import {initializeApp} from "firebase/app";
import {getDatabase, off, onChildChanged, ref} from "firebase/database";
import {ThreeScene} from "./_use_three.js";
import {getNodeColor} from "./get_color";
import CfgCreator, {CfgContent} from "./components/cfg_cereator";
import {DataTable} from "./table";
import NodeDrawer from "./components/options_terminal";
import {NodeInfoPanel} from "./components/node_info_panel";
import {TerminalConsole} from "./components/terminal";


const quey_str = "?user_id=rajtigesomnlhfyqzbvx&env_id=env_bare_rajtigesomnlhfyqzbvx&mode=demo";
const WS_URL = `wss://www.bestbrain.tech/sim/run/${quey_str}`;
const WS_URL_LOCAL = `ws://127.0.0.1:8000/sim/run/${quey_str}`;


// --- Style Constants ---
const COLORS = {
  background: '#131314',
  panelBg: '#1e1f20',
  containerBg: '#2d2e30',
  accent: '#89b1f7',
  text: '#e3e3e3',
  textSecondary: '#bdc1c6',
  border: '#444746',
};

const buttonStyle = {
  backgroundColor: COLORS.accent,
  color: '#202124',
  border: 'none',
  borderRadius: '20px',
  padding: '8px 16px',
  cursor: 'pointer',
  fontWeight: '500',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};


// Helper function to trigger CSV download for Logs
const downloadLogsCSV = (data:any, filename:any) => {
  const csvRows = [];
  csvRows.push("node_id,log_index,log_message");

  for (const nodeId in data) {
    if (data.hasOwnProperty(nodeId)) {
      data[nodeId].forEach((log:any, index:any) => {
        const sanitizedLog = `"${String(log).replace(/"/g, '""')}"`;
        csvRows.push(`${nodeId},${index},${sanitizedLog}`);
      });
    }
  }

  const csvString = csvRows.join("\n");
  const blob = new Blob([csvString], { type: 'text/csv' });
  const url = window?.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// Basis-Struktur für einen Knoten
interface Node {
  id: string;
  pos?: any; // Koordinaten oder Position, genauerer Typ je nach Three.js
  type?: string;
  name?: string;
  status?: { state: string }; // Oder detailliertere Status-Struktur
  meta?: { status: { state: string } };
  color?: string; // Farbe des Knotens
  session_id?: string;
}

// Basis-Struktur für eine Kante
interface Edge {
  id: string;
  src: string; // Quell-Knoten-ID
  trgt: string; // Ziel-Knoten-ID
  session_id?: string;
}

// Struktur für Firebase-Anmeldeinformationen und Listener-Pfade
interface FbCreds {
  creds: any; // Firebase Credential Objekt, z.B. from serviceAccountKey.json
  listener_paths: string[];
  status_path: string;
  db_path: string; // databaseURL
}

// Struktur für eine Chat-Nachricht
interface ChatMessage {
  text: string;
  type: "CHAT_MESSAGE" | "COMMAND" | "LOGS" | "FILE_UPLOAD" | "REQUEST_TABLE_DATA" | "TRAIN_MODEL";
  timestamp: string; // ISO-String
  info?: { nodeId: string }; // Optional für LOGS-Typ
  file?: { name: string; type: string; size: number; content: string; }; // Optional für FILE_UPLOAD
}

// Struktur für ein Log-Eintrag
interface NodeLogEntry {
  id: string; // log_id
  err?: string;
  out?: string;
  // weitere Log-Details
}

// Struktur für NodeLogs (Objekt, das Log-Einträge pro Node-ID enthält)
interface NodeLogs {
  [nodeId: string]: { [logId: string]: NodeLogEntry } | NodeLogEntry[]; // Kann ein Objekt von Logs oder ein Array sein
}

// Struktur für Tabellendaten
interface TableDataRow {
  [key: string]: any;
}

interface Dataset {
  keys: string[];
  rows: TableDataRow[];
}

// --- Placeholder/Mock Komponenten und Funktionen ---



const QDash: React.FC<any> = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [historyNodes, setHistoryNodes] = useState<Node[]>([]);
  const [historyEdges, setHistoryEdges] = useState<Edge[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [fbCreds, setFbCreds] = useState<FbCreds | null>(null);
  const [inputValue, setInputValue] = useState<string>("");
  const [chatInputValue, setChatInputValue] = useState<string>("");
  const [fbIsConnected, setfbIsConnected] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodeLogs, setNodeLogs] = useState<NodeLogs>({});
  const [isDataSidebarOpen, setIsDataSidebarOpen] = useState<boolean>(false);
  const [tableData, setTableData] = useState<TableDataRow[]>([]);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [cfg_content, setCfg_content] = useState<any>({});
  const [dataset, setDataset] = useState<Dataset>(
    {
      keys: [],
      rows: []
    }
  );

  const updateDataset = (data: Dataset) => {
    setDataset(data);
  };

  const updateCfg = (data: CfgContent) => {
    setCfg_content(data);
  };

  // Korrektur: `value` war undefiniert, sollte `data` sein
  const updateInputValue = (data: string) => {
    setInputValue(data);
  };

  const updateHistoryNodes = useCallback((data: Node | Node[]) => {
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

  function randomId(len = 30): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < len; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  const updateHistoryEdges = useCallback((data: Edge | Edge[]) => {
    // Korrektur: Muss setHistoryEdges aufrufen, nicht setHistoryNodes
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


  const updateEdges = useCallback((data: Edge | Edge[]) => {
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

  const updateNodes = useCallback((data: Node | Node[]) => {
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

  const updateCreds = useCallback((data: FbCreds | null) => {
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

  // Korrektur: updateNodeLogs Funktion hinzugefügt
  const updateNodeLogs = useCallback((nodeId: string, logId: string, logEntry: NodeLogEntry) => {
    setNodeLogs(prevLogs => ({
      ...prevLogs,
      [nodeId]: {
        ...(prevLogs[nodeId] || {}), // Sicherstellen, dass ein Objekt vorhanden ist
        [logId]: logEntry
      }
    }));
  }, []);


  const {
    messages, sendMessage,
    isConnected, error,
  } = _useWebSocket(
    "WS_URL_PLACEHOLDER", nodes, // WS_URL muss definiert sein
    edges, updateNodes,
    updateEdges, updateCreds,
    updateCfg, updateDataset
  );

  const statusClass = isConnected ? 'text-green-400' : 'text-red-400'; // Tailwind-Klassen
  // const statusEmoji = isConnected ? '✔' : '✖'; // Nicht direkt verwendet, aber zur Referenz

  const firebaseApp = useRef<any>(null);
  const firebaseDb = useRef<any>(null);
  const listenerRefs = useRef<Array<{ refObj: any, callback: Function }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!fbIsConnected && fbCreds) {
      try {
        firebaseApp.current = initializeApp({
          credential: fbCreds?.creds,
          databaseURL: fbCreds.db_path
        });
        console.log('Firebase-Initialisierung erfolgreich'); // Korrektur von console.error zu console.log

        firebaseDb.current = getDatabase(firebaseApp.current);
        setfbIsConnected(true);
      } catch (e: any) { // Typisierung des Fehlers
        console.error('Firebase-Initialisierung fehlgeschlagen:', e);
        setfbIsConnected(false);
      }
    }
  }, [fbCreds, fbIsConnected]);

  // Updated handler to process all data changes from Firebase, including logs
  const handleDataChange = useCallback((snapshot: any) => { // snapshot Typisierung
    const changedData = snapshot.val();
    const nodeIdWithSuffix = snapshot.key; // Der Schlüssel, der vom Snapshot kommt

    if (!changedData) return;

    // Firebase-Pfade können variieren. Hier wird angenommen, dass der Schlüssel bereits die Node-ID ist oder einen Suffix hat.
    // Beispiel: logs/{nodeId} oder logs/{nodeId}_logkey
    // Wenn der Pfad 'nodes/{nodeId}' ist, dann ist snapshot.key die nodeId
    // Wenn der Pfad 'logs/{nodeId}_logId' ist, muss der Schlüssel gesplittet werden.

    // Wenn der Schlüssel z.B. "pixel_id_alpha__log123" ist
    const parts = nodeIdWithSuffix.split('__');
    const actualNodeId = parts[0]; // Dies wäre die Node-ID

    // Logic for Node/Edge updates based on changedData structure
    if (changedData.session_id && !changedData.src) {
        // history node change - here assuming snapshot.key is the actual node id
        updateNodes({ id: nodeIdWithSuffix, ...changedData });
    } else if (changedData.session_id && changedData.src) {
        // History Edges - here assuming snapshot.key is the actual edge id
        updateHistoryEdges({ id: nodeIdWithSuffix, ...changedData });
    } else if (changedData.src && changedData.trgt) { // Check for edge properties
        updateEdges({ id: nodeIdWithSuffix, ...changedData });
    } else if (changedData.pos && changedData.type) { // Check for node properties
        updateNodes({ id: nodeIdWithSuffix, ...changedData });
    } else if (changedData.err || changedData.out) { // loggs (Check for log properties)
        console.log("Log change detected:", nodeIdWithSuffix);
        // Annahme: Wenn der Schlüssel des Snapshots ein Log ist (z.B. node_id__log_id)
        const nodeForLog = parts.length > 1 ? parts[0] : nodeIdWithSuffix; // Wenn der Schlüssel gesplittet wurde
        const logId = parts.length > 1 ? parts[1] : randomId(10); // Oder generiere eine neue ID
        updateNodeLogs(nodeForLog, logId, { id: logId, ...changedData });
    } else if (changedData.status && changedData.meta) { // metadata
        updateNodes(
            {
                id: nodeIdWithSuffix, // Hier auch nodeIdWithSuffix verwenden
                meta: changedData.meta,
                color: getNodeColor(changedData.meta.status.state)
            }
        );
    }
    // Spezifische Prüfung für Logs im Array-Format, falls sie als komplettes Array unter einer Node-ID kommen
    // Dies würde einen anderen Firebase-Pfad erfordern, z.B. /nodes/{nodeId}/logs_array
    if (Array.isArray(changedData.logs)) {
        setNodeLogs(prevLogs => ({
            ...prevLogs,
            [nodeIdWithSuffix]: changedData.logs // Direkt das Array setzen
        }));
    }
  }, [updateNodes, updateEdges, updateHistoryEdges, updateNodeLogs]); // updateNodeLogs hinzugefügt

  useEffect(() => {
    if (fbIsConnected && fbCreds && firebaseDb.current) {
        // Bereinige bestehende Listener, bevor neue hinzugefügt werden
        listenerRefs.current.forEach(({refObj, callback}) => off(refObj, 'child_changed', callback));
        listenerRefs.current = [];

        fbCreds.listener_paths.forEach(path => {
          const dbRef = ref(firebaseDb.current, path);
          onChildChanged(dbRef, handleDataChange);
          listenerRefs.current.push({refObj: dbRef, callback: handleDataChange});
        });

        // updateCreds(null); // Kommentiert, da dies die Creds sofort löschen würde, was nicht immer gewünscht ist
    }
    return () => {
      // Cleanup-Funktion für den Effekt
      listenerRefs.current.forEach(({ refObj, callback }) => off(refObj, 'child_changed', callback));
      listenerRefs.current = [];
    };
  }, [fbIsConnected, fbCreds, handleDataChange]); // updateCreds aus den Abhängigkeiten entfernt

  // Simplified message handler, as logs are now handled by Firebase listener
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      if (latestMessage?.type === "CHAT_MESSAGE") {
        setChatMessages(prev => [...prev, latestMessage]);
      }
      else if (latestMessage?.type === "TABLE_DATA" && Array.isArray(latestMessage?.data)) { // data nicht typisiert im ChatMessage
        setTableData(latestMessage?.data as TableDataRow[]); // Type Assertion
        setIsTraining(false);
      }
      else if (latestMessage?.type === "TRAINING_COMPLETE") {
        setIsTraining(false);
      }
    }
  }, [messages]);

  const handleSubmit = useCallback((e: React.FormEvent) => { // Typisierung des Events
    e.preventDefault();
    if (inputValue.trim() && isConnected) {
      sendMessage({ text: inputValue, type: "COMMAND", timestamp: new Date().toISOString() });
      setInputValue('');
    }
  }, [inputValue, isConnected, sendMessage]);

  // When a node is clicked, select it and send a message to the backend to trigger log generation
  const handleNodeClick = useCallback((nodeId: string) => {
    const nodeData = nodes.find(n => n.id === nodeId);
    if (nodeData) {
      setSelectedNode(nodeData);
      sendMessage({ type: "LOGS", info: { nodeId }, timestamp: new Date().toISOString() });
    }
  }, [sendMessage, nodes]);

  const handleChatSubmit = useCallback((e: React.FormEvent) => { // Typisierung des Events
    e.preventDefault();
    if (chatInputValue.trim() && isConnected) {
      sendMessage({ text: chatInputValue, type: "CHAT_MESSAGE", timestamp: new Date().toISOString() });
      setChatInputValue('');
    }
  }, [chatInputValue, isConnected, sendMessage]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => { // Typisierung des Events
    const file = e.target.files?.[0]; // Sicherer Zugriff
    if (file && isConnected) {
      const reader = new FileReader();
      reader.onload = (event) => {
        sendMessage({
          type: "FILE_UPLOAD",
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
            content: (event.target?.result as string).split(',')[1], // Type Assertion
          },
          timestamp: new Date().toISOString()
        });
      };
      reader.readAsDataURL(file);
    }
  }, [isConnected, sendMessage]);

  const handleDownloadLogs = useCallback((nodeId: string) => {
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
    // Only render if sidebar is open, and pass correct props
    if (!isDataSidebarOpen) return null;
    return (
      <>
        <DataTable
          rows={dataset.rows}
          keys={dataset.keys}
        />
      </>
    );
  }, [dataset, isDataSidebarOpen]); // Abhängigkeit von isDataSidebarOpen

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
          deactivate={(nodeId) => console.log(`Deactivating node: ${nodeId}`)} // Placeholder für deactivate
        />
      );
    }
    return(
      <NodeDrawer />
    );
  },[selectedNode, firebaseDb, fbIsConnected, handleDownloadLogs, handleDownloadAllLogs]);


  // @ts-ignore // Kann entfernt werden, wenn alle Typen korrekt sind
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', backgroundColor: "#131314", color: "#e3e3e3", fontFamily: 'sans-serif' }}> {/* COLORS.background/text */}

      {render_data_view()} {/* Conditional rendering for data view */}

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
      {/* Conditionally render CfgCreator, e.g., based on a state variable */}
      {/* For demo, it's always rendered, but in a real app, you might have a button to open/close it */}
      <CfgCreator cfg_content={cfg_content} />
    </div>
  );
};

export default QDash;


/*



const QDash = () => {
  const [nodes, setNodes] = useState([]);
  const [historyNodes, setHistoryNodes] = useState([]);
  const [historyEdges, setHistoryEdges] = useState([]);
  const [edges, setEdges] = useState([]);
  const [fbCreds, setFbCreds] = useState(false);
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

  const updateDataset = (data:object) => {
    setDataset(data)
  }


  const updateCfg = (data:object) => {
    setCfg_content(data)
  }

  const updateInputValue = (data) =>  {
    setInputValue(value)
  }

  const updateHistoryNodes = (data) =>  {
    setHistoryNodes(prev:any => {
        if (prev.length === 0) return Array.isArray(data) ? data : [data];
        const newHNodes = [...prev];
        const item = Array.isArray(data) ? data[0] : data;
        const index: number = newHNodes.findIndex(e => e.id === item.id);
        if (index > -1) newHNodes?[index] = { ...newHNodes?[index], ...item };
        else newHNodes.push(item);
        return newHNodes;
    });
  }

  function randomId(len = 30) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < len; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  const updateHistoryEdges = (data:any) =>  {
    setHistoryNodes(prev:any => {
        if (prev.length === 0) return Array.isArray(data) ? data : [data];
        const newHNodes = [...prev];
        const item = Array.isArray(data) ? data[0] : data;
        const index = newHNodes.findIndex(e => e.id === item.id);
        if (index > -1) newHNodes[index] = { ...newHNodes[index], ...item };
        else newHNodes.push(item);
        return newHNodes;
    });
  }


  const updateEdges = useCallback((data: any) => {
    setEdges(prev:any => {
        if (prev.length === 0) return Array.isArray(data) ? data : [data];
        const newEdges = [...prev];
        const item = Array.isArray(data) ? data[0] : data;
        const index = newEdges.findIndex(e => e.id === item.id);
        if (index > -1) newEdges[index] = { ...newEdges[index], ...item };
        else newEdges.push(item);
        return newEdges;
    });
  },[]);

  const updateNodes = useCallback((data) => {
    setNodes(prev => {
        if (prev.length === 0) return Array.isArray(data) ? data : [data];
        const newNodes = [...prev];
        const item = Array.isArray(data) ? data[0] : data;
        const index = newNodes.findIndex(n => n.id === item.id);
        if (index > -1) newNodes[index] = { ...newNodes[index], ...item };
        else newNodes.push(item);
        return newNodes;
    });
  },[]);

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

  const {
    messages, sendMessage,
    isConnected, error,
  } = _useWebSocket(
    WS_URL, nodes,
    edges, updateNodes,
    updateEdges, updateCreds,
    updateCfg, updateDataset
  );

  const statusClass = isConnected ? 'status-connected' : 'status-disconnected';
  const statusEmoji = isConnected ? '✔' : '✖';

  const firebaseApp = useRef(null);
  const firebaseDb = useRef(null);
  const listenerRefs = useRef([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!fbIsConnected && fbCreds) {
      try {
        firebaseApp.current = initializeApp({
          credential: fbCreds.creds,
          databaseURL: fbCreds.db_path
        });
        console.error('Firebase-Initialisierung erfolgreich');

        firebaseDb.current = getDatabase(firebaseApp.current);
        setfbIsConnected(true);
      } catch (e) {
        console.error('Firebase-Initialisierung:', e);
        setfbIsConnected(false);
      }
    }
  }, [fbCreds, fbIsConnected]);

  // Updated handler to process all data changes from Firebase, including logs
  const handleDataChange = useCallback((snapshot) => {
    const changedData = snapshot.val();
    const nodeId = snapshot.key;

    if (!changedData) return;

    if ("session_id" in changedData && !"src" in changedData) {
      // history node change
      updateNodes({ id: nodeId, ...changedData });
    }else if ("session_id" in changedData && "src" in changedData) {
      // History Edges
      updateEdges({ id: nodeId, ...changedData });
    }
    if ("src" in changedData && "trgt" in changedData) {
        updateEdges({ id: nodeId, ...changedData });
        return
    } else if ("pos" in changedData && "type" in changedData) {
        updateNodes({ id: nodeId, ...changedData });
        return
    }else if ("err" in changedData && "out" in changedData) { // loggs
      console.log("Log chnge detected:", nodeId)
      const node = nodeId.split("__")[0];
      const log_id = nodeId.split("__").pop();
      updateLogge({ id: node, log_id: log_id, ...changedData });
      return
    }else if ("status" in changedData) { // metadata
        updateNodes(
          {
            id: nodeId,
            meta: changedData.meta,
            color: getNodeColor(changedData.meta.status.state)
          }
        );
        return
    }

    // Specifically check for and update logs from Firebase
    if (Array.isArray(changedData.logs)) {
        setNodeLogs(prevLogs => ({
            ...prevLogs,
            [nodeId]: changedData.logs
        }));
    }
  }, [updateNodes, updateEdges]);

  useEffect(() => {
    if (fbIsConnected && fbCreds && firebaseDb.current) {
        listenerRefs.current.forEach(({refObj, callback}) => off(refObj, 'child_changed', callback));
        listenerRefs.current = [];

        fbCreds.listener_paths.forEach(path => {
          const dbRef = ref(firebaseDb.current, path);
          onChildChanged(dbRef, handleDataChange);
          listenerRefs.current.push({refObj: dbRef, callback: handleDataChange});
        });

        updateCreds(null); // Clear creds after setting up listeners
    }
    return () => {
      listenerRefs.current.forEach(({ refObj, callback }) => off(refObj, 'child_changed', callback));
    };
  }, [fbIsConnected, fbCreds, handleDataChange, updateCreds]);

  // Simplified message handler, as logs are now handled by Firebase listener
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && isConnected) {
      sendMessage({ text: inputValue, type: "COMMAND", timestamp: new Date().toISOString() });
      setInputValue('');
    }
  };

  // When a node is clicked, select it and send a message to the backend to trigger log generation
  const handleNodeClick = useCallback((nodeId) => {
    const nodeData = nodes.find(n => n.id === nodeId);
    if (nodeData) {
      setSelectedNode(nodeData);
      sendMessage({ type: "LOGS", info: { nodeId }, timestamp: new Date().toISOString() });
    }
  }, [sendMessage, nodes]);

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (chatInputValue.trim() && isConnected) {
      sendMessage({ text: chatInputValue, type: "CHAT_MESSAGE", timestamp: new Date().toISOString() });
      setChatInputValue('');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && isConnected) {
      const reader = new FileReader();
      reader.onload = (event) => {
        sendMessage({
          type: "FILE_UPLOAD",
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
            content: event.target.result.split(',')[1],
          },
          timestamp: new Date().toISOString()
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadLogs = (nodeId) => {
    const logsToDownload = { [nodeId]: nodeLogs[nodeId] };
    downloadLogsCSV(logsToDownload, `node_${nodeId}_logs.csv`);
  };

  const handleDownloadAllLogs = () => {
    downloadLogsCSV(nodeLogs, 'all_nodes_logs.csv');
  };

  const handleToggleDataSidebar = () => {
      const willBeOpen = !isDataSidebarOpen;
      setIsDataSidebarOpen(willBeOpen);
      if (willBeOpen) {
          sendMessage({ type: "REQUEST_TABLE_DATA", timestamp: new Date().toISOString() });
      }
  };

  const handleTrainModel = () => {
      setIsTraining(true);
      sendMessage({ type: "TRAIN_MODEL", timestamp: new Date().toISOString() });
  };

  const renderScene = useCallback(() => {
    return <ThreeScene edges={edges} nodes={nodes} onNodeClick={handleNodeClick} />;
  }, [edges, nodes, handleNodeClick]);


  const render_data_view = useCallback(() => {
    return (
      <DataTable
        rows={dataset.rows}
        keys={dataset.keys}
      />
    )
  }, [historyNodes, historyEdges, isDataSidebarOpen]);

  const nodeSection = useCallback(() => {
    console.log("selectedNode, firebaseDb,fbIsConnected", selectedNode, firebaseDb,fbIsConnected)
    if (selectedNode) {
      return(
        <NodeInfoPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onDownloadSingle={handleDownloadLogs}
          onDownloadAll={handleDownloadAllLogs}
          firebaseDb={firebaseDb}
          fbIsConnected={fbIsConnected}
        />
      )
    }
    return(
      <NodeDrawer />
    )
  },[selectedNode, firebaseDb,fbIsConnected]);

  // @ts-ignore
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', backgroundColor: COLORS.background, color: COLORS.text, fontFamily: 'sans-serif' }}>

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
 */