import React, {useState, useCallback, useEffect} from "react";
import { Button } from "@heroui/react";
import { CfgCreator } from "./components/cfg_cereator";
import { DataSlider } from "./components/DataSlider";

import { TerminalConsole } from "./components/terminal";
import "../index.css";
import WorldCfgCreator from "./components/world_cfg";
import _useWebSocket from "./websocket";
import Dashboard from "./components/sim_view";
import {useFirebaseListeners} from "./firebase";
import {getNodeColor} from "./get_color";
import {NodeInfoPanel} from "./components/node_info_panel";



// TEST
const TEST_ENV_ID = "env_rajtigesomnlhfyqzbvx_zddioeaduhvnyphluwvu"






export const MainApp = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [fbCreds, setFbCreds] = useState(null);
  const [inputValue, setInputValue] = useState("");

  const [isDataSidebarOpen, setIsDataSidebarOpen] = useState(false);
  const [isDataSliderOpen, setIsDataSliderOpen] = useState(false);
  const [isCfgSliderOpen, setIsCfgSliderOpen] = useState(false);
  const [worldCfgCreated, setWorldCfgCreated] = useState(false);
  const [envs, setEnvs] = useState({});
  const [clickedNode, setClickedNode] = useState(null);
  const [nodeSliderOpen, setNodeOpen] = useState(null);



  const updateNodesliderOpen = () => {
    setNodeOpen(!nodeSliderOpen)
  }

  const [dataset, setDataset] = useState(
    {
      keys: [],
      rows: []
    }
  );

  const updateNodeInfo = (nodeId, env_id) => {
    console.log(`${nodeId} click detected`)
    setClickedNode(
        {
          env: env_id,
          node: envs[env_id]["nodes"][nodeId],
        }
    )
    updateNodesliderOpen()
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

  const addEnvs = (data) => {
    console.log("Add ENV Data", data)
    setEnvs((prev) => {
      return {
        ...prev,
        ...data,
      }
    })
  }

  useEffect(() => {
    console.log("envs", envs)
  }, [envs])


  const updateEnv = (listener_type, env_id, data) => {
    console.log("Update Env Data");

    if (listener_type === "meta") {
      // Apply color change to the node
      const state = data.status.state
      let new_color = getNodeColor(state)
      updatenodeColor(listener_type, env_id, data, new_color)
      console.log("Updated node color:", new_color)
    }

    setEnvs((prev) => {
      // Kopie des vorherigen States
      const updated = { ...prev };
      if (
        updated[env_id] &&
        updated[env_id][listener_type] &&
        updated[env_id][listener_type][data.id]
      ) {

        if (listener_type === "node" || listener_type === "edge") {
          console.log("update node:", updated[env_id][listener_type][data.id])
          // .update(data) vorausgesetzt → neues Objekt zurück
          updated[env_id][listener_type][data.id] = {
            ...updated[env_id][listener_type][data.id],
            ...data,
          };
        } else if (listener_type === "meta") {
          //Apply changes direclt inside te node
          console.log("update node:", updated[env_id][listener_type][data.id])
          // .update(data) vorausgesetzt → neues Objekt zurück
          updated[env_id][listener_type][data.id] = {
            ...updated[env_id][listener_type][data.id]["meta"],
            ...data,
          };
        }
      } else {
        console.log(`node ${data.id} not found in ${env_id}`)
      }
      return updated;
    });
  };

  const updatenodeColor = (listener_type, env_id, data, new_color) => {
    // Wenn der Listener-Typ "meta" ist, hole die neue Farbe, ansonsten ist sie null.

    // Wenn keine neue Farbe vorhanden ist, tu nichts und beende die Funktion.
    if (new_color === null) {
      return;
    }

    setEnvs((prev) => {
      // Erstelle eine tiefe Kopie des Pfades, den du ändern musst.
      return {
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
      };
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
      updateCreds, updateDataset, addEnvs
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
        <></>
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
        <Dashboard envs={envs} updateNodeInfo={updateNodeInfo}  />
      );
    }
    return(
      <p>Please create a simulation config file using the window on the right side</p>
    )
  }, [envs])

  const get_node_panel = useCallback(() => {
    if (clickedNode !== null){
      return <NodeInfoPanel
        node={clickedNode} // Format env:env_id, node:node_objä
        sliderOpen={nodeSliderOpen}
        onClose={() => {
          updateNodesliderOpen();
          setClickedNode(null);
        }}
        firebaseDb={firebaseDb}
        fbIsConnected={fbIsConnected}
        user_id
      />
    }
    else return(
        <WorldCfgCreator
            sendMessage={sendMessage}
            isOpen={isCfgSliderOpen}
            onToggle={toggleCfgSlider}
          />
    )
  },[clickedNode])




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
          {
            get_node_panel()
          }
      </div>
  </div>
  );
};

export default MainApp;
/*
<CfgCreator
          sendMessage={sendMessage}
          isOpen={isCfgSliderOpen}
          onToggle={toggleCfgSlider}
        />
 */