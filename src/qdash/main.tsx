"use client"

import React, {useCallback, useEffect, useRef, useState} from 'react';
import _useWebSocket from "./websocket";
import {initializeApp} from "firebase/app";
import {getDatabase, off, onChildChanged, ref} from "firebase/database";
import {ThreeScene} from "./_use_three.js";
import {getNodeColor} from "./get_color";
import {NodeInfoPanel} from "@/app/(site)/qdash/components/node_info_panel";
import NodeDrawer from "@/app/(site)/qdash/components/options_terminal";
import TerminalConsole from "@/app/(site)/qdash/components/terminal";
import DataTable from "@/app/(site)/qdash/table";



const WS_URL_LOCAL = "ws://127.0.0.1:8000/"

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

const disabledButtonStyle = {
    ...buttonStyle,
    backgroundColor: COLORS.containerBg,
    color: COLORS.textSecondary,
    cursor: 'not-allowed',
};


// Helper function to trigger CSV download for Logs
const downloadLogsCSV = (data, filename) => {
  const csvRows = [];
  csvRows.push("node_id,log_index,log_message");

  for (const nodeId in data) {
    if (data.hasOwnProperty(nodeId)) {
      data[nodeId].forEach((log, index) => {
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

// Helper function to trigger CSV download for Table Data
const downloadTableDataCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
        const values = headers.map(header => {
            const escaped = ('' + row[header]).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};





// Data View Sidebar Component (Positioned on the Left)

const DataSidebar = ({
  isOpen,
  onToggle,
  nodes = [],
  edges = [],
  onDownload
}) => {
  // ---- Safe style fallbacks (no Tailwind) ----
  const C = (typeof COLORS !== "undefined" && COLORS) || {
    panelBg: "#111",
    containerBg: "#181818",
    text: "#eaeaea",
    textSecondary: "#9aa0a6",
    border: "#2a2a2a",
  };

  const baseBtn = {
    background: "#2c2c2c",
    color: "#fff",
    border: `1px solid ${C.border}`,
    padding: "8px 10px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 12,
  };
  const buttonStyle =
    (typeof window !== "undefined" && window?.buttonStyle) || baseBtn;
  const disabledButtonStyle = { ...buttonStyle, opacity: 0.6, cursor: "not-allowed" };

  // ---- Local state ----
  const [activeSection, setActiveSection] = React.useState("data"); // "data" | "logs"
  const [dataSource, setDataSource] = React.useState("nodes"); // "nodes" | "edges"
  const [expandedNode, setExpandedNode] = React.useState(null); // accordion

  // Build local logs state: accept either { [nodeId]: {err:[], out:[]} } or {err:[], out:[]}
  const buildLogsMap = React.useCallback(
    (input) => {
      if (!input) return {};
      // Case A: already a map per node
      const isPerNodeMap =
        typeof input === "object" &&
        !Array.isArray(input) &&
        Object.values(input).some((v) => v && typeof v === "object" && (Array.isArray(v.err) || Array.isArray(v.out)));
      if (isPerNodeMap) return input;

      // Case B: global arrays: replicate for each node
      const globalErr = Array.isArray(input.err) ? input.err : [];
      const globalOut = Array.isArray(input.out) ? input.out : [];
      const map = {};
      (nodes || []).forEach((n) => {
        if (!n || typeof n.id === "undefined") return;
        map[n.id] = { err: globalErr, out: globalOut };
      });
      return map;
    },
    [nodes]
  );

  // ---- Utilities ----
  const flatten = (obj, parentKey = "", res = {}) => {
    if (!obj || typeof obj !== "object") return res;
    for (const k in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
      const key = parentKey ? `${parentKey}.${k}` : k;
      const val = obj[k];
      if (val && typeof val === "object" && !Array.isArray(val)) {
        flatten(val, key, res);
      } else {
        res[key] = Array.isArray(val) ? JSON.stringify(val) : String(val);
      }
    }
    return res;
  };

  const makeTableData = React.useCallback((arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return [];
    const flat = arr.map((o) => flatten(o));
    const unionKeys = Array.from(new Set(flat.flatMap((o) => Object.keys(o))));
    // Ensure first row has all union keys so headers are complete
    return flat.map((o) => {
      const row = {};
      unionKeys.forEach((k) => (row[k] = Object.prototype.hasOwnProperty.call(o, k) ? o[k] : ""));
      return row;
    });
  }, []);

  const tableData = React.useMemo(() => {
    const src = dataSource === "nodes" ? nodes : edges;
    return makeTableData(src);
  }, [dataSource, nodes, edges, makeTableData]);

  // ---- Renders ----
  const renderTabs = () => (
    <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
      <button
        onClick={() => setActiveSection("data")}
        style={{
          ...buttonStyle,
          background: activeSection === "data" ? "#3a3a3a" : buttonStyle.background,
          borderBottom: activeSection === "data" ? `2px solid ${C.text}` : `1px solid ${C.border}`,
        }}
      >
        Data
      </button>
      <button
        onClick={() => setActiveSection("logs")}
        style={{
          ...buttonStyle,
          background: activeSection === "logs" ? "#3a3a3a" : buttonStyle.background,
          borderBottom: activeSection === "logs" ? `2px solid ${C.text}` : `1px solid ${C.border}`,
        }}
      >
        Logs
      </button>
    </div>
  );

  const renderDataSection = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 8px 0" }}>
        <label htmlFor="datasource-select" style={{ color: C.textSecondary, fontSize: 12 }}>Database:</label>
        <select
          id="datasource-select"
          value={dataSource}
          onChange={(e) => setDataSource(e.target.value)}
          style={{
            background: C.panelBg,
            color: C.text,
            border: `1px solid ${C.border}`,
            padding: "6px 8px",
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          <option value="nodes">nodes</option>
          <option value="edges">edges</option>
        </select>
      </div>

      <div style={{ flex: 1, overflowY: "auto", backgroundColor: C.containerBg, borderRadius: 8, padding: 8 }}>
        {tableData.length > 0 ? (
          <DataTable rows={tableData} keys={Object.keys(tableData[0])} />
        ) : (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <p style={{ color: C.textSecondary }}>No data available. Start a sim or wait till its complete.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderLogsSection = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ color: C.textSecondary, fontSize: 12, margin: "4px 0 8px 0" }}>Nodes</div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {(nodes && nodes.length > 0) ? (
          nodes.map((n) => {
            const nodeId = n && typeof n.id !== "undefined" ? n.id : "(no-id)";
            const isOpen = expandedNode === nodeId;
            const logsForNode = logsMap[nodeId] || { err: [], out: [] };
            return (
              <div key={nodeId} style={{ marginBottom: 8, border: `1px solid ${C.border}`, borderRadius: 6, background: C.containerBg }}>
                <button
                  onClick={() => setExpandedNode(isOpen ? null : nodeId)}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: "transparent",
                    color: C.text,
                    border: "none",
                    padding: "8px 10px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  {String(nodeId)} {isOpen ? "▲" : "▼"}
                </button>
                {isOpen && (
                  <div style={{ padding: "8px 10px", borderTop: `1px solid ${C.border}` }}>
                    <div style={{ marginBottom: 6, color: C.textSecondary, fontSize: 12 }}>err</div>
                    {Array.isArray(logsForNode.err) && logsForNode.err.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {logsForNode.err.map((line, i) => (
                          <li key={`err-${i}`} style={{ marginBottom: 4, whiteSpace: "pre-wrap" }}>{String(line)}</li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ color: C.textSecondary, fontSize: 12, marginBottom: 8 }}>No error logs.</div>
                    )}

                    <div style={{ margin: "10px 0 6px 0", color: C.textSecondary, fontSize: 12 }}>out</div>
                    {Array.isArray(logsForNode.out) && logsForNode.out.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {logsForNode.out.map((line, i) => (
                          <li key={`out-${i}`} style={{ marginBottom: 4, whiteSpace: "pre-wrap" }}>{String(line)}</li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ color: C.textSecondary, fontSize: 12 }}>No output logs.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
            <p style={{ color: C.textSecondary }}>No nodes available. Provide nodes to view logs.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", position: "fixed", left: 0, top: 0, zIndex: 1000, pointerEvents: "none" }}>
      <div
        style={{
          width: isOpen ? "400px" : "0px",
          backgroundColor: C.panelBg,
          color: C.text,
          padding: isOpen ? "16px" : "0",
          transition: "width 0.3s ease, padding 0.3s ease",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          borderRight: `1px solid ${C.border}`,
          pointerEvents: "auto",
        }}
      >
        <h3 style={{ margin: "0 0 12px 0", fontWeight: 500 }}>Data View</h3>
        {renderTabs()}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {activeSection === "data" ? renderDataSection() : renderLogsSection()}
        </div>
      </div>

      <button
        onClick={onToggle}
        style={{
          ...buttonStyle,
          width: 40,
          height: 40,
          borderRadius: "0 50% 50% 0",
          padding: 0,
          alignSelf: "center",
          marginLeft: -1,
          pointerEvents: "auto",
        }}
      >
        {isOpen ? "<" : ">"}
      </button>
    </div>
  );
};




const QDash = (callback, deps) => {
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
  const [userId, setUserId] = useState(randomId());

  const updateInputValue = (data) =>  {
    setInputValue(value)
  }
  const updateHistoryNodes = (data) =>  {
    setHistoryNodes(prev => {
        if (prev.length === 0) return Array.isArray(data) ? data : [data];
        const newHNodes = [...prev];
        const item = Array.isArray(data) ? data[0] : data;
        const index = newHNodes.findIndex(e => e.id === item.id);
        if (index > -1) newHNodes[index] = { ...newHNodes[index], ...item };
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
  const updateHistoryEdges = (data) =>  {
    setHistoryNodes(prev => {
        if (prev.length === 0) return Array.isArray(data) ? data : [data];
        const newHNodes = [...prev];
        const item = Array.isArray(data) ? data[0] : data;
        const index = newHNodes.findIndex(e => e.id === item.id);
        if (index > -1) newHNodes[index] = { ...newHNodes[index], ...item };
        else newHNodes.push(item);
        return newHNodes;
    });
  }

  const updateLogge = (logs) =>{
    console.log("sut loggs...")
    setLoggs(logs);
  }
  const updateEdges = useCallback((data) => {
    setEdges(prev => {
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
    deactivate
  } = _useWebSocket(
    WS_URL, nodes,
    edges, updateNodes,
    updateEdges, updateCreds,
    () => {}
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
    if (!deactivate && fbIsConnected && fbCreds && firebaseDb.current) {
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
  }, [fbIsConnected, deactivate, fbCreds, handleDataChange, updateCreds]);

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
      <DataSidebar
        isOpen={isDataSidebarOpen}
        onToggle={handleToggleDataSidebar}
        onDownload={() => downloadTableDataCSV(tableData, 'table_data.csv')}
        nodes={historyNodes}
        edges={historyEdges}
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

    </div>
  );
};

export default QDash; x
// nichts darf deine gefühle beeinflussen (negativ oder positiv)




/*

<table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {Object.keys(tableData[0]).map((key) => (
                  <th key={key} style={{ borderBottom: `1px solid ${C.border}`, padding: 8, textAlign: "left" }}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((val, i) => (
                    <td key={i} style={{ padding: 8, borderTop: `1px solid ${C.border}` }}>{String(val)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

 */