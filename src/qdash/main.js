import React, { useState, useCallback, useEffect, useRef } from "react";

// Mock Components with Custom CSS
const ThreeScene = ({ edges, nodes, onNodeClick }) => (
  <div
    style={{
      background: "linear-gradient(135deg, #1e1e2e 0%, #2d3748 100%)",
      borderRadius: "12px",
      padding: "2rem",
      height: "400px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      border: "1px solid #4a5568",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background:
          "radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 70%)",
        animation: "pulse 3s ease-in-out infinite",
      }}
    ></div>
    <div
      style={{
        width: "60px",
        height: "60px",
        border: "3px solid #3b82f6",
        borderTop: "3px solid transparent",
        borderRadius: "50%",
        animation: "spin 2s linear infinite",
        marginBottom: "1rem",
      }}
    ></div>
    <h3
      style={{
        color: "#f7fafc",
        fontSize: "1.5rem",
        fontWeight: "bold",
        marginBottom: "0.5rem",
        textAlign: "center",
      }}
    >
      3D Scene Rendering
    </h3>
    <p
      style={{
        color: "#a0aec0",
        fontSize: "0.9rem",
        textAlign: "center",
      }}
    >
      Nodes: {nodes.length} | Edges: {edges.length}
    </p>
    <style jsx>{`
      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }
    `}</style>
  </div>
);

const DataTable = ({ rows, keys, cfg_content }) => {
  const [activeSection, setActiveSection] = useState(null);

  // Convert cfg_content to displayable data
  const formatCfgData = () => {
    const formattedData = [];

    Object.entries(cfg_content).forEach(([pixelId, fermions]) => {
      Object.entries(fermions).forEach(([fermionKey, fermionData]) => {
        formattedData.push({
          pixel_id: pixelId,
          fermion: fermionKey,
          max_value: fermionData.max_value,
          phase_count: fermionData.phase ? fermionData.phase.length : 0,
          phases: fermionData.phase || [],
        });
      });
    });

    return formattedData;
  };

  const cfgData = formatCfgData();

  return (
    <div
      style={{
        background: "#2d3748",
        borderRadius: "12px",
        padding: "1.5rem",
        border: "1px solid #4a5568",
        maxHeight: "500px",
        overflowY: "auto",
      }}
    >
      <h3
        style={{
          color: "#f7fafc",
          fontSize: "1.25rem",
          fontWeight: "bold",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
        }}
      >
        <svg
          style={{
            width: "20px",
            height: "20px",
            marginRight: "0.5rem",
            color: "#3b82f6",
          }}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
        </svg>
        Configuration Data
      </h3>

      <div
        style={{
          marginBottom: "1rem",
          padding: "0.75rem",
          background: "#1a202c",
          borderRadius: "8px",
          border: "1px solid #4a5568",
        }}
      >
        <p style={{ color: "#a0aec0", fontSize: "0.9rem" }}>
          Total Pixels: {Object.keys(cfg_content).length} | Total Fermions:{" "}
          {cfgData.length} | Active Phases:{" "}
          {cfgData.reduce((acc, item) => acc + item.phase_count, 0)}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {cfgData.map((item, index) => (
          <div
            key={index}
            style={{
              background: "#1a202c",
              borderRadius: "8px",
              padding: "1rem",
              border: "1px solid #4a5568",
              transition: "all 0.3s ease",
              cursor: "pointer",
            }}
            onClick={() =>
              setActiveSection(activeSection === index ? null : index)
            }
            onMouseEnter={(e) => (e.target.style.borderColor = "#3b82f6")}
            onMouseLeave={(e) => (e.target.style.borderColor = "#4a5568")}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h4
                  style={{
                    color: "#f7fafc",
                    fontSize: "1rem",
                    fontWeight: "semibold",
                    marginBottom: "0.25rem",
                  }}
                >
                  {item.pixel_id}
                </h4>
                <p style={{ color: "#a0aec0", fontSize: "0.85rem" }}>
                  {item.fermion}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p
                  style={{
                    color: "#3b82f6",
                    fontSize: "1rem",
                    fontWeight: "bold",
                  }}
                >
                  {typeof item.max_value === "string"
                    ? item.max_value
                    : item.max_value.toFixed(1)}
                </p>
                <p style={{ color: "#a0aec0", fontSize: "0.8rem" }}>
                  {item.phase_count} phases
                </p>
              </div>
            </div>

            {activeSection === index && item.phases.length > 0 && (
              <div
                style={{
                  marginTop: "1rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid #4a5568",
                }}
              >
                <h5
                  style={{
                    color: "#f7fafc",
                    fontSize: "0.9rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  Phases:
                </h5>
                {item.phases.map((phase, phaseIndex) => (
                  <div
                    key={phaseIndex}
                    style={{
                      background: "#2d3748",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <p style={{ color: "#e2e8f0", fontSize: "0.8rem" }}>
                      ID: {phase.id} | Iterations: {phase.iterations} |
                      Multiplier: {phase.max_val_multiplier}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const NodeInfoPanel = ({ node, onClose }) => (
  <div
    style={{
      background: "#2d3748",
      borderRadius: "12px",
      padding: "1.5rem",
      border: "1px solid #4a5568",
      minWidth: "250px",
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem",
      }}
    >
      <h3
        style={{
          color: "#f7fafc",
          fontSize: "1.25rem",
          fontWeight: "bold",
        }}
      >
        Node Info
      </h3>
      <button
        onClick={onClose}
        style={{
          background: "transparent",
          border: "none",
          color: "#a0aec0",
          cursor: "pointer",
          padding: "0.25rem",
        }}
      >
        <svg
          style={{ width: "20px", height: "20px" }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
    <div style={{ color: "#e2e8f0", fontSize: "0.9rem" }}>
      <p style={{ marginBottom: "0.5rem" }}>ID: {node.id}</p>
      <p>Type: {node.type || "unknown"}</p>
    </div>
  </div>
);

const NodeDrawer = ({ cfg_content }) => (
  <div
    style={{
      background: "#2d3748",
      borderRadius: "12px",
      padding: "1.5rem",
      border: "1px solid #4a5568",
      minWidth: "250px",
    }}
  >
    <h3
      style={{
        color: "#f7fafc",
        fontSize: "1.25rem",
        fontWeight: "bold",
        marginBottom: "1rem",
      }}
    >
      Quick Stats
    </h3>
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      <div
        style={{
          background: "#1a202c",
          padding: "0.75rem",
          borderRadius: "8px",
          border: "1px solid #4a5568",
        }}
      >
        <p
          style={{
            color: "#3b82f6",
            fontSize: "0.8rem",
            marginBottom: "0.25rem",
          }}
        >
          Total Pixels
        </p>
        <p style={{ color: "#f7fafc", fontSize: "1.5rem", fontWeight: "bold" }}>
          {Object.keys(cfg_content).length}
        </p>
      </div>
      <div
        style={{
          background: "#1a202c",
          padding: "0.75rem",
          borderRadius: "8px",
          border: "1px solid #4a5568",
        }}
      >
        <p
          style={{
            color: "#10b981",
            fontSize: "0.8rem",
            marginBottom: "0.25rem",
          }}
        >
          Active Fermions
        </p>
        <p style={{ color: "#f7fafc", fontSize: "1.5rem", fontWeight: "bold" }}>
          {Object.values(cfg_content).reduce(
            (acc, pixel) => acc + Object.keys(pixel).length,
            0
          )}
        </p>
      </div>
    </div>
  </div>
);

/**
 * Enhanced Main Dashboard Component (QDash) with Real Data Display
 */
export const QDash = () => {
  // State Management
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isDataSidebarOpen, setIsDataSidebarOpen] = useState(false);
  const [isCfgSidebarOpen, setIsCfgSidebarOpen] = useState(false);
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
      fermion_sub_omega: {
        max_value: 300,
        phase: [{ id: "p3", iterations: 3, max_val_multiplier: 0.8 }],
      },
    },
  });
  const [dataset, setDataset] = useState({ keys: [], rows: [] });
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([
    {
      type: "SYSTEM",
      text: "Dashboard initialized successfully",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [isConnected, setIsConnected] = useState(true);

  // Mock WebSocket connection
  const sendMessage = useCallback((message) => {
    console.log("Sending message:", message);
    setMessages((prev) => [
      ...prev,
      {
        ...message,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  // Handlers
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

  const handleNodeClick = useCallback(
    (nodeId) => {
      const nodeData = nodes.find((n) => n.id === nodeId);
      if (nodeData) {
        setSelectedNode(nodeData);
        sendMessage({
          type: "LOGS",
          info: { nodeId },
          timestamp: new Date().toISOString(),
        });
      }
    },
    [sendMessage, nodes]
  );

  const updateInputValue = useCallback((value) => {
    setInputValue(value);
  }, []);

  const toggleDataSidebar = useCallback(() => {
    setIsDataSidebarOpen(!isDataSidebarOpen);
  }, [isDataSidebarOpen]);

  const toggleCfgSidebar = useCallback(() => {
    setIsCfgSidebarOpen(!isCfgSidebarOpen);
  }, [isCfgSidebarOpen]);

  // Render Methods
  const renderScene = useCallback(() => {
    return (
      <ThreeScene edges={edges} nodes={nodes} onNodeClick={handleNodeClick} />
    );
  }, [edges, nodes, handleNodeClick]);

  const renderDataView = useCallback(() => {
    if (!isDataSidebarOpen) return null;
    return (
      <DataTable
        rows={dataset.rows}
        keys={dataset.keys}
        cfg_content={cfg_content}
      />
    );
  }, [dataset, isDataSidebarOpen, cfg_content]);

  const renderNodeSection = useCallback(() => {
    if (selectedNode) {
      return (
        <NodeInfoPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      );
    }
    return <NodeDrawer cfg_content={cfg_content} />;
  }, [selectedNode, cfg_content]);

  const renderConfigView = useCallback(() => {
    if (!isCfgSidebarOpen) return null;

    return (
      <div
        style={{
          position: "fixed",
          right: 0,
          top: "80px",
          bottom: "60px",
          width: "350px",
          background: "#1a202c",
          borderLeft: "1px solid #4a5568",
          padding: "1.5rem",
          overflowY: "auto",
          zIndex: 40,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h3
            style={{
              color: "#f7fafc",
              fontSize: "1.5rem",
              fontWeight: "bold",
            }}
          >
            Configuration
          </h3>
          <button
            onClick={toggleCfgSidebar}
            style={{
              background: "transparent",
              border: "none",
              color: "#a0aec0",
              cursor: "pointer",
              padding: "0.25rem",
            }}
          >
            <svg
              style={{ width: "24px", height: "24px" }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {Object.entries(cfg_content).map(([pixelId, fermions]) => (
            <div
              key={pixelId}
              style={{
                background: "#2d3748",
                borderRadius: "8px",
                padding: "1rem",
                border: "1px solid #4a5568",
              }}
            >
              <h4
                style={{
                  color: "#e2e8f0",
                  fontSize: "1rem",
                  fontWeight: "semibold",
                  marginBottom: "0.75rem",
                }}
              >
                {pixelId}
              </h4>

              {Object.entries(fermions).map(([fermionKey, fermionData]) => (
                <div
                  key={fermionKey}
                  style={{
                    background: "#1a202c",
                    borderRadius: "6px",
                    padding: "0.75rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <p
                    style={{
                      color: "#a0aec0",
                      fontSize: "0.85rem",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {fermionKey}
                  </p>
                  <p
                    style={{
                      color: "#3b82f6",
                      fontSize: "0.9rem",
                      fontWeight: "bold",
                    }}
                  >
                    Max:{" "}
                    {typeof fermionData.max_value === "string"
                      ? fermionData.max_value
                      : fermionData.max_value.toFixed(1)}
                  </p>
                  <p style={{ color: "#10b981", fontSize: "0.8rem" }}>
                    Phases: {fermionData.phase ? fermionData.phase.length : 0}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }, [isCfgSidebarOpen, cfg_content, toggleCfgSidebar]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "#f1f5f9",
      }}
    >
      {/* Top Navigation */}
      <div
        style={{
          background: "rgba(30, 41, 59, 0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #334155",
          padding: "1rem 2rem",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  color: "white",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                }}
              >
                Q
              </span>
            </div>
            <div>
              <h1
                style={{
                  color: "#f1f5f9",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  margin: 0,
                }}
              >
                QDash
              </h1>
              <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>
                Quantum Dashboard
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={toggleDataSidebar}
              style={{
                background: isDataSidebarOpen ? "#3b82f6" : "transparent",
                color: isDataSidebarOpen ? "white" : "#94a3b8",
                border: "1px solid #475569",
                borderRadius: "8px",
                padding: "0.5rem 1rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.3s ease",
              }}
            >
              <svg
                style={{ width: "16px", height: "16px" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Data
            </button>

            <button
              onClick={toggleCfgSidebar}
              style={{
                background: isCfgSidebarOpen ? "#8b5cf6" : "transparent",
                color: isCfgSidebarOpen ? "white" : "#94a3b8",
                border: "1px solid #475569",
                borderRadius: "8px",
                padding: "0.5rem 1rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.3s ease",
              }}
            >
              <svg
                style={{ width: "16px", height: "16px" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                />
              </svg>
              Configure
            </button>

            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: isConnected ? "#10b981" : "#ef4444",
                }}
              ></div>
              <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                {isConnected ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        style={{
          display: "flex",
          minHeight: "calc(100vh - 80px)",
          position: "relative",
        }}
      >
        {/* Data Sidebar */}
        {renderDataView()}

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            padding: "2rem",
            marginLeft: isDataSidebarOpen ? "350px" : "0",
            marginRight: isCfgSidebarOpen ? "350px" : "0",
            transition: "all 0.3s ease",
          }}
        >
          {nodes.length === 0 && edges.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "400px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  border: "4px solid #334155",
                  borderTop: "4px solid #3b82f6",
                  borderRadius: "50%",
                  animation: "spin 2s linear infinite",
                  marginBottom: "2rem",
                }}
              ></div>
              <h2
                style={{
                  color: "#f1f5f9",
                  fontSize: "2rem",
                  fontWeight: "bold",
                  marginBottom: "0.5rem",
                }}
              >
                Loading Dashboard
              </h2>
              <p
                style={{
                  color: "#94a3b8",
                  fontSize: "1rem",
                  maxWidth: "400px",
                }}
              >
                Initializing your quantum dashboard experience...
              </p>
            </div>
          ) : (
            renderScene()
          )}
        </div>

        {/* Node Info/Options Sidebar */}
        <div
          style={{
            position: "fixed",
            right: isCfgSidebarOpen ? "350px" : "20px",
            top: "100px",
            transition: "all 0.3s ease",
            zIndex: 30,
          }}
        >
          {renderNodeSection()}
        </div>
      </div>

      {/* Configuration Sidebar */}
      {renderConfigView()}

      {/* Data Sidebar */}
      {isDataSidebarOpen && (
        <div
          style={{
            position: "fixed",
            left: 0,
            top: "80px",
            bottom: 0,
            width: "350px",
            background: "#1a202c",
            borderRight: "1px solid #4a5568",
            padding: "1.5rem",
            overflowY: "auto",
            zIndex: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <h3
              style={{
                color: "#f7fafc",
                fontSize: "1.5rem",
                fontWeight: "bold",
              }}
            >
              Data View
            </h3>
            <button
              onClick={toggleDataSidebar}
              style={{
                background: "transparent",
                border: "none",
                color: "#a0aec0",
                cursor: "pointer",
                padding: "0.25rem",
              }}
            >
              <svg
                style={{ width: "24px", height: "24px" }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <DataTable
            rows={dataset.rows}
            keys={dataset.keys}
            cfg_content={cfg_content}
          />
        </div>
      )}

      {/* Terminal Footer */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(15, 23, 42, 0.95)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid #334155",
          padding: "1rem 2rem",
          zIndex: 50,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              minWidth: "100px",
            }}
          >
            <span style={{ color: "#10b981", fontSize: "0.85rem" }}>●</span>
            <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>Ready</span>
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => updateInputValue(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Enter command..."
            style={{
              flex: 1,
              background: "#1e293b",
              border: "1px solid #475569",
              borderRadius: "6px",
              padding: "0.5rem 1rem",
              color: "#f1f5f9",
              fontSize: "0.9rem",
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!isConnected || !inputValue.trim()}
            style={{
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "0.5rem 1rem",
              cursor:
                isConnected && inputValue.trim() ? "pointer" : "not-allowed",
              opacity: isConnected && inputValue.trim() ? 1 : 0.5,
              transition: "all 0.3s ease",
            }}
          >
            Execute
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto",
            sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #1a202c;
        }

        ::-webkit-scrollbar-thumb {
          background: #4a5568;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #718096;
        }
      `}</style>
    </div>
  );
};

export default QDash;
