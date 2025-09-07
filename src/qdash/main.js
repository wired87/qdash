import React, { useState, useCallback } from "react";
import { Button } from "@heroui/react";
import { CfgCreator } from "./components/cfg_cereator";
import { DataSlider } from "./components/DataSlider";

import { TerminalConsole } from "./components/terminal";
import "../index.css";
import WorldCfgCreator from "./components/world_cfg";
import _useWebSocket from "./websocket";
import Dashboard from "./components/sim_view";
import {useFirebaseListeners} from "./firebase";

export const MainApp = () => {
  const [nodeLogs, setNodeLogs] = useState({});
  const [tableData, setTableData] = useState([]);
  const [isTraining, setIsTraining] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [historyNodes, setHistoryNodes] = useState([]);
  const [historyEdges, setHistoryEdges] = useState([]);


  const [nodes, setNodes] = useState([]);

  const [edges, setEdges] = useState([]);
  const [fbCreds, setFbCreds] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [chatInputValue, setChatInputValue] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodeInfoOpen, setNodeInfoOpen] = useState(null);

  const [isDataSidebarOpen, setIsDataSidebarOpen] = useState(false);
  const [isDataSliderOpen, setIsDataSliderOpen] = useState(false);
  const [isCfgSliderOpen, setIsCfgSliderOpen] = useState(false);
  const [worldCfgCreated, setWorldCfgCreated] = useState(false);
  const [envs, setEnvs] = useState({});


  const [dataset, setDataset] = useState(
    {
      keys: [],
      rows: []
    }
  );

  const updateNodeInfoOpen = () => {
    setNodeInfoOpen(!nodeInfoOpen)
  }

  const [logs, setLogs] = useState({
    node_1: {
      err: [
        "Connection timeout at 14:30:15",
        "Failed to process request #1234",
        "Memory leak detected in module XYZ",
      ],
      out: [
        "Server started successfully",
        "Processing 15 requests",
        "Memory usage: 45%",
        "Cache cleared successfully",
        "Database connection established",
      ],
    },
    node_2: {
      err: ["Disk space warning: 85% full", "Query timeout after 30s"],
      out: [
        "Database connected",
        "Query executed in 0.03ms",
        "Backup completed",
        "Index rebuild finished",
        "Replication sync completed",
      ],
    },
    node_3: {
      err: [
        "Network interface down",
        "Failed to bind to port 80",
        "SSL certificate expired",
      ],
      out: ["Load balancer initialized", "Health check passed"],
    },
  });

  const updateEnvs = (data) => {
    console.log("Set ENV Data", data)
    setEnvs(data)
  }

  const updateEnv = (listener_type, env_id, data) => {
    console.log("Update Env Data");

    setEnvs((prev) => {
      // Kopie des vorherigen States
      const updated = { ...prev };

      if (
        updated[env_id] &&
        updated[env_id][listener_type] &&
        updated[env_id][listener_type][data.id]
      ) {
        // .update(data) vorausgesetzt → neues Objekt zurück
        updated[env_id][listener_type][data.id] = {
          ...updated[env_id][listener_type][data.id],
          ...data,
        };
      }
      return updated;
    });
  };


  /**
   * @param {FbCreds | null} data
   */
  const updateCreds = useCallback((data) => {
    if (data) {
        setFbCreds({
            creds: data.creds,
            db_path: data.db_path,
            listener_paths: data.listener_paths,
        });
    } else {
        setFbCreds(null);
    }
  },[]);

  const updateDataset = (data) => {
    setDataset(data);
  };

  // HOOKS
  const {
      messages, sendMessage,
      isConnected
  } = _useWebSocket(
      updateCreds, updateDataset, updateEnvs
  );

  const { fbIsConnected, firebaseDb } = useFirebaseListeners(
      fbCreds,
      updateEnv
  )

  const handleSubmit = useCallback(() => {
    if (inputValue.trim() && isConnected) {
      sendMessage({
        text: inputValue,
        type: "COMMAND",
        timestamp: new Date().toISOString(),
      });
      setInputValue("");
    }
  }, [inputValue, isConnected, sendMessage]);

  const updateInputValue = useCallback((value) => {
    setInputValue(value);
  }, []);

  const toggleDataSlider = useCallback(() => {
    setIsDataSliderOpen(!isDataSliderOpen);
  }, [isDataSliderOpen]);

  const toggleCfgSlider = useCallback(() => {
    setIsCfgSliderOpen(!isCfgSliderOpen);
  }, [isCfgSliderOpen]);



  const cfg_struct = useCallback(() => {
    if (isCfgSliderOpen && worldCfgCreated) {
      console.log("CfgCreator ")

      return (
        <CfgCreator
          sendMessage={sendMessage}
          isOpen={isCfgSliderOpen}
          onToggle={toggleCfgSlider}
        />
      )
    } else if (!worldCfgCreated) {
      console.log("WorldCfgCreator")
      return(
        <></>
      )
    }
  }, [isCfgSliderOpen, worldCfgCreated])

  const get_dashboard = useCallback(() => {
    if (envs) {
      return(
        <Dashboard envs={envs} updateNodeInfoOpen={updateNodeInfoOpen}  />
      );
    }
    return(
      <p>Please create a simulation config file using the window on the right side</p>
    )
  }, [envs])


  return (
    <div className={"flex absolut flex-row w-full h-screen"}>
      <div className="dashboard-container">
      {/* Top Navigation */}
      <nav className="nav-container">
        <div className="nav-content">
          <div className="logo-container">
            <div className="logo-icon">
              <span className="logo-text">Q</span>
            </div>
            <div>
              <h1 className="nav-title">QDash</h1>
              <p className="nav-subtitle">Quantum Dashboard v2.0</p>
            </div>
          </div>

          <div className="nav-buttons">
            <Button
              color={isDataSliderOpen ? "primary" : "default"}
              variant={isDataSliderOpen ? "solid" : "bordered"}
              onPress={toggleDataSlider}
              startContent="📊"
            >
              Data Explorer
            </Button>

            <Button
              color={isCfgSliderOpen ? "secondary" : "default"}
              variant={isCfgSliderOpen ? "solid" : "bordered"}
              onPress={toggleCfgSlider}
              startContent="⚙️"
            >
              Configuration
            </Button>

            <div className="status-indicator">
              <div
                className={`status-dot ${
                  isConnected ? "status-dot-online" : "status-dot-offline"
                }`}
              />
              <span className="status-text">
                {isConnected ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Sliders */}
      <DataSlider
        nodes={nodes}
        edges={edges}
        logs={logs}
        isOpen={isDataSliderOpen}
        onToggle={toggleDataSlider}
      />

      {get_dashboard()}



      {/* Terminal Footer */}
      <TerminalConsole
        error={null}
        statusClass={isConnected ? "text-green-500" : "text-red-500"}
        handleSubmit={handleSubmit}
        isConnected={isConnected}
        inputValue={inputValue}
        updateInputValue={updateInputValue}
        options={["status", "config", "logs", "help", "refresh", "restart"]}
        messages={messages}
      />

    </div>
      <div className={"flex "}>
          <WorldCfgCreator
            sendMessage={sendMessage}
            isOpen={isCfgSliderOpen}
            onToggle={toggleCfgSlider}
          />
      </div>

  </div>
  );
};

export default MainApp;
/*




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


 */