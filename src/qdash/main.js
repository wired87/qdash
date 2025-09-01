import React, { useState, useCallback, useEffect } from "react";
import { Button } from "@heroui/react";
import { CfgCreator } from "./components/cfg_cereator";
import { DataSlider } from "./components/DataSlider";

import { TerminalConsole } from "./components/terminal";
import "../index.css";
import { DataTable } from "./table";

export const MainApp = () => {
  const [nodes, setNodes] = useState([
    {
      id: "node_1",
      name: "Primary Server",
      type: "Server",
      ip: "192.168.1.100",
      meta: {
        status: { state: "ALIVE", info: "Running normally" },
        class_name: "ProductionServer",
        messages_sent: 45,
        messages_received: 38,
      },
    },
    {
      id: "node_2",
      name: "Database",
      type: "Database",
      ip: "192.168.1.101",
      meta: {
        status: { state: "ALIVE", info: "Connected" },
        class_name: "DatabaseServer",
        messages_sent: 23,
        messages_received: 41,
      },
    },
    {
      id: "node_3",
      name: "Load Balancer",
      type: "Network",
      ip: "192.168.1.102",
      meta: {
        status: { state: "DEAD", info: "Connection lost" },
        class_name: "NetworkDevice",
        messages_sent: 0,
        messages_received: 0,
      },
    },
  ]);

  const [edges, setEdges] = useState([
    {
      id: "edge_1",
      source: "node_1",
      target: "node_2",
      protocol: "TCP",
      status: "Active",
    },
    {
      id: "edge_2",
      source: "node_1",
      target: "node_3",
      protocol: "HTTP",
      status: "Inactive",
    },
  ]);

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

  const [cfg_content, setCfg_content] = useState({
    pixel_id_alpha: {
      fermion_sub_A: {
        max_value: 100.5,
        phase: [{ id: "p1", iterations: 5, max_val_multiplier: 1.2 }],
      },
      fermion_sub_B: {
        max_value: 250,
        phase: [{ id: "p2", iterations: 10, max_val_multiplier: 1.5 }],
      },
    },
    pixel_id_beta: {
      fermion_sub_X: {
        max_value: 75,
        phase: [],
      },
      fermion_sub_Y: {
        max_value: "custom_string",
        phase: [],
      },
    },
    pixel_id_gamma: {
      fermion_sub_Z: {
        max_value: 300,
        phase: [
          { id: "p3", iterations: 8, max_val_multiplier: 2.0 },
          { id: "p4", iterations: 12, max_val_multiplier: 1.8 },
        ],
      },
    },
  });

  const [messages, setMessages] = useState([
    {
      type: "SYSTEM",
      text: "Dashboard initialized successfully",
      timestamp: new Date(Date.now() - 300000).toISOString(),
    },
    {
      type: "COMMAND",
      text: "status check completed",
      timestamp: new Date(Date.now() - 240000).toISOString(),
    },
    {
      type: "LOGS",
      text: "Retrieved logs for 3 nodes",
      timestamp: new Date(Date.now() - 180000).toISOString(),
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isConnected, setIsConnected] = useState(true);
  const [isDataSliderOpen, setIsDataSliderOpen] = useState(false);
  const [isCfgSliderOpen, setIsCfgSliderOpen] = useState(false);

  // Simulate connection status changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.1) {
        setIsConnected((prev) => !prev);
        const statusMessage = {
          type: "SYSTEM",
          text: isConnected ? "Connection lost" : "Connection restored",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, statusMessage]);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const sendMessage = useCallback(
    (message) => {
      console.log("Sending message:", message);

      const newMessage = {
        ...message,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, newMessage]);

      setTimeout(() => {
        let responseMessage;

        if (message.type === "cfg_file") {
          responseMessage = {
            type: "SYSTEM",
            text: `Configuration updated with message: ${message.message}`,
            timestamp: new Date().toISOString(),
          };
          setCfg_content(message.cfg);
        } else if (message.text) {
          const command = message.text.toLowerCase();

          if (command.includes("status")) {
            const aliveNodes = nodes.filter(
              (n) => n.meta?.status?.state === "ALIVE"
            ).length;
            responseMessage = {
              type: "SYSTEM",
              text: `Status: ${aliveNodes}/${nodes.length} nodes alive, ${edges.length} edges configured`,
              timestamp: new Date().toISOString(),
            };
          } else if (command.includes("logs")) {
            const totalLogs = Object.values(logs).reduce(
              (acc, log) =>
                acc + (log.err?.length || 0) + (log.out?.length || 0),
              0
            );
            responseMessage = {
              type: "LOGS",
              text: `Retrieved ${totalLogs} log entries from ${
                Object.keys(logs).length
              } nodes`,
              timestamp: new Date().toISOString(),
            };
          } else if (command.includes("config")) {
            responseMessage = {
              type: "SYSTEM",
              text: `Configuration has ${
                Object.keys(cfg_content).length
              } pixel IDs configured`,
              timestamp: new Date().toISOString(),
            };
          } else if (command.includes("help")) {
            responseMessage = {
              type: "SYSTEM",
              text: "Available commands: status, logs, config, refresh, help",
              timestamp: new Date().toISOString(),
            };
          } else if (command.includes("refresh")) {
            setNodes((currentNodes) =>
              currentNodes.map((node) => ({
                ...node,
                meta: {
                  ...node.meta,
                  status: {
                    ...node.meta.status,
                    info: `Refreshed at ${new Date().toLocaleTimeString()}`,
                  },
                },
              }))
            );
            responseMessage = {
              type: "SYSTEM",
              text: "Node statuses refreshed successfully",
              timestamp: new Date().toISOString(),
            };
          } else if (command.includes("restart")) {
            setLogs((currentLogs) => {
              const clearedLogs = {};
              Object.keys(currentLogs).forEach((nodeId) => {
                clearedLogs[nodeId] = {
                  err: [],
                  out: [
                    `Node ${nodeId} restarted at ${new Date().toLocaleTimeString()}`,
                  ],
                };
              });
              return clearedLogs;
            });
            responseMessage = {
              type: "SYSTEM",
              text: "System restarted - logs cleared",
              timestamp: new Date().toISOString(),
            };
          } else {
            responseMessage = {
              type: "SYSTEM",
              text: `Processed command: ${message.text}`,
              timestamp: new Date().toISOString(),
            };
          }
        }

        if (responseMessage) {
          setMessages((prev) => [...prev, responseMessage]);
        }
      }, 500 + Math.random() * 1000);
    },
    [cfg_content, nodes, edges, logs]
  );

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

  return (
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

      {/* Main Content Area */}
      <div className="main-content">
        <div className="content-container">
          <div className="grid-container">
            {/* 3D Scene Placeholder */}
            <div className="card-container">
              <h2 className="card-title">3D Network Visualization</h2>
              <div className="viz-placeholder">
                <div className="viz-content">
                  <div className="spinner" />
                  <p className="viz-text">
                    Rendering: {nodes.length} nodes | {edges.length} edges
                  </p>
                  <p className="viz-subtext">
                    Interactive 3D visualization loading...
                  </p>
                </div>
              </div>
            </div>

            {/* Data Overview */}
            <div className="card-container">
              <DataTable
                cfg_content={cfg_content}
                nodes={nodes}
                edges={edges}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sliders */}
      <DataSlider
        nodes={nodes}
        edges={edges}
        logs={logs}
        isOpen={isDataSliderOpen}
        onToggle={toggleDataSlider}
      />

      <CfgCreator
        cfg_content={cfg_content}
        sendMessage={sendMessage}
        isOpen={isCfgSliderOpen}
        onToggle={toggleCfgSlider}
      />

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
  );
};

export default MainApp;
