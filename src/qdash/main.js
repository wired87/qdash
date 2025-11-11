import React, {useState, useCallback} from "react";
import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@heroui/react";
import { DataSlider } from "./components/DataSlider";

import "../index.css";
import WorldCfgCreator from "./components/world_cfg";
import _useWebSocket from "./websocket";
import Dashboard from "./components/dash";
import {useFirebaseListeners} from "./firebase";
import {getNodeColor} from "./get_color";
import {NodeInfoPanel} from "./components/node_info_panel";
import {ThreeScene} from "./_use_three";
import TerminalConsole from "./components/terminal";
import ToDoCard from "./components/todo_card";


export const MainApp = () => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [fbCreds, setFbCreds] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");

  const [isDataSidebarOpen, setIsDataSidebarOpen] = useState(false);
  const [isDataSliderOpen, setIsDataSliderOpen] = useState(false);
  const [isCfgSliderOpen, setIsCfgSliderOpen] = useState(false);
  const [worldCfgCreated, setWorldCfgCreated] = useState(false);
  const [envs, setEnvs] = useState({
      "env_edae32cbbbaf47a985f006a7f756d11fc16822f03355430e9702bd09af1aadc14": 64,
  });
  const [clickedNode, setClickedNode] = useState(null);
  const [nodeSliderOpen, setNodeOpen] = useState(null);
  const [graph, setGraph] = useState({
      nodes: [],
      edges: [],
  });

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

    const [selectedEnv, setSelectedEnv] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [isDashOpen, setIsDashOpen] = useState(false);
    const [isBucketOpen, setIsBucketOpen] = useState(false);

    const get_info_card = useCallback((_case) => {
        if (!isDashOpen && !isOpen && !isCfgSliderOpen) {
            return <ToDoCard />
        }
    },[isOpen, isDashOpen, isCfgSliderOpen]);


    const toggleModal = useCallback((env_id) => {

        if (env_id) {
            setSelectedEnv(env_id);
        }
        setIsOpen(!isOpen);
    }, [isOpen, selectedEnv]);

    const toggleBucket = useCallback(() => {
        setIsBucketOpen(!isBucketOpen);
    }, [isBucketOpen]);

    const modal = useCallback(() => {
        console.log("isOpen, selectedEnv, graph",isOpen, selectedEnv, graph)
        return (
            <Modal 
                isOpen={isOpen} 
                onClose={() => toggleModal("")} 
                size="5xl" 
                className="graph-modal"
                style={{position:"fixed", width:500, height:500, zIndex: 99999}}
            >
                <ModalContent>
                        <>
                            <ModalHeader className="flex flex-col gap-1 modal-header-enhanced">
                                <h3 className="modal-title">Graph Visualization</h3>
                                <p className="modal-subtitle">Interactive 3D Network View</p>
                            </ModalHeader>
                            <ModalBody>
                                <div style={{width: "100%", height: "60vh", position: "relative"}}>
                                    <ThreeScene
                                        nodes={graph.nodes}
                                        edges={graph.edges}
                                        onNodeClick={updateNodeInfo}
                                        env_id={selectedEnv}
                                    />
                                </div>
                            </ModalBody>
                            <ModalFooter className="modal-footer-enhanced">
                                <Button 
                                    color="danger" 
                                    variant="light" 
                                    onPress={toggleModal}
                                    className="modal-close-button"
                                    size="lg"
                                >
                                    Close
                                </Button>
                            </ModalFooter>
                        </>

                </ModalContent>
            </Modal>
        )
    }, [isOpen, selectedEnv, graph])


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



  const updateGraph = (graph) => {
      setGraph(graph)
  }

  // HOOKS
  const {
      messages, sendMessage,
      isConnected
  } = _useWebSocket(
      updateCreds, updateDataset, addEnvs, updateGraph
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

  const toggleDahboard = useCallback(() => {
      console.log("toggleDahboard:", !isDashOpen)
    setIsDashOpen(!isDashOpen);
  }, [isDashOpen]);

  const toggleCfgSlider = useCallback(() => {
     console.log("toggleDahboard:", !isDashOpen)
    setIsCfgSliderOpen(!isCfgSliderOpen);
  }, [isCfgSliderOpen]);

    const startSim = (env_id) => {
        sendMessage({
            data: {
                env_ids: [env_id]
            },
            type: "start_sim",
            timestamp: new Date().toISOString(),
        })
    }


  const get_dashboard = useCallback(() => {
    if (isDashOpen) {
      return(
        <Dashboard envs={envs} startSim={startSim} toggleModal={toggleModal} />
      );
    }
    return <></>
  }, [envs, isDashOpen]);




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
  },[clickedNode, isCfgSliderOpen])

  const get_data_slider = useCallback(() => {
    if (isDataSliderOpen) {
      return(
        <DataSlider
        nodes={nodes}
        edges={edges}
        logs={logs}
        isOpen={isDataSliderOpen}
        onToggle={toggleDataSlider}
      />      );
    }
    return <></>
  }, [isDataSliderOpen, toggleDataSlider, nodes, edges]);
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
              startContent={<span className="button-icon">📊</span>}
              size="lg"
              className="nav-action-button"
            >
              Data Explorer
            </Button>

            <Button
              color={isCfgSliderOpen ? "secondary" : "default"}
              variant={isCfgSliderOpen ? "solid" : "bordered"}
              onPress={toggleCfgSlider}
              startContent={<span className="button-icon">⚙️</span>}
              size="lg"
              className="nav-action-button"
            >
              Configuration
            </Button>

            <div className="status-indicator">
              <Button
                color={isConnected ? "success" : "danger"}
                variant="flat"
                size="sm"
                className="status-button"
                startContent={
                  <div
                    className={`status-dot ${
                      isConnected ? "status-dot-online" : "status-dot-offline"
                    }`}
                  />
                }
              >
                {isConnected ? "Online" : "Offline"}
              </Button>
            </div>
          </div>
        </div>
      </nav>

          {get_data_slider()}
          {get_dashboard()}
        <TerminalConsole
            error={error}
              handleSubmit={handleSubmit}
              isConnected={isConnected}
              inputValue={inputValue}
              updateInputValue={updateInputValue}
              messages={messages}
            toggleCfgSlider={toggleCfgSlider}
            toggleDataSlider={toggleDataSlider}
            sendMessage={sendMessage}
            toggleDashboard={toggleDahboard}
            envs={envs}
            toggleBucket={toggleBucket}
        />
    </div>
      <div className={"flex "}>
          {
            get_node_panel()
          }
      </div>
    {modal()}
  </div>
  );
};

export default MainApp;