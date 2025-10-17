import React, {useState} from "react";
import {ThreeScene} from "../_use_three";
import {Button} from "@heroui/react";
import ScrollableDataTable from "./data_table";


const CustomCard = ({ children, className = "" }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

const CustomCardBody = ({ children, className = "" }) => {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
};

const CustomChip = ({ children, color, className = "" }) => {
  const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold";
  const colorClasses = {
    secondary: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  }[color] || "";

  return (
    <span className={`${baseClasses} ${colorClasses} ${className}`}>
      {children}
    </span>
  );
};

const styles = {
    // Mimics the body/root layout
    appContainer: {
        fontFamily: 'Inter, sans-serif',
        margin: '0',
        padding: '20px',
        backgroundColor: '#f4f7f9',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        minHeight: '100vh',
    },
    // .canvas-container (The outer wrapper/list item)
    canvasContainer: {
        width: '95%',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        padding: '20px',
    },
    h2: {
        color: '#1e3a8a',
        borderBottom: '2px solid #eff6ff',
        paddingBottom: '10px',
        marginTop: '0',
        fontWeight: '600',
    },
    // .table-wrapper (The Scroll Mechanism)
    tableWrapper: {
        maxHeight: '500px',
        overflowY: 'auto',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
    },
    // .data-table
    dataTable: {
        width: '100%',
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
    },
    // Sticky Header
    headerCell: {
        position: 'sticky',
        top: 0,
        backgroundColor: '#1e3a8a',
        color: 'white',
        fontWeight: 700,
        padding: '12px 15px',
        textAlign: 'left',
        zIndex: 10,
    },
    // Base Cell Style
    cell: {
        padding: '10px 15px',
        borderBottom: '1px solid #f3f4f6',
        color: '#374151',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    // Hover Style (applied dynamically)
    rowHover: {
        backgroundColor: '#e0f2fe', // Light blue on hover
        cursor: 'pointer',
        color: '#0b509f',
        transition: 'background-color 0.2s ease',
    },
    // Alternate Row Shading (for even rows)
    rowEven: {
        backgroundColor: '#f9fafb',
    },
    footerText: {
        textAlign: 'center',
        marginTop: '15px',
        fontSize: '0.85em',
        color: '#6b7280',
    }
};

// --- Helper Component to manage individual row hover state ---
const TableRow = ({ data, index }) => {
    const [isHovered, setIsHovered] = useState(false);

    // Apply odd/even stripe style
    const baseRowStyle = index % 2 === 0 ? styles.rowEven : {};

    // Combine base style, hover style (if active), and reset transition for inline update
    const finalRowStyle = {
        ...baseRowStyle,
        ...(isHovered ? styles.rowHover : {}),
    };

    const columnWidths = [
        { width: '30%' },
        { width: '40%' },
        { width: '30%' },
    ];

    return (
        <tr
            style={finalRowStyle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <td style={{ ...styles.cell, ...columnWidths[0] }}>{data.id}</td>
            <td style={{ ...styles.cell, ...columnWidths[1] }}>{data.description}</td>
            <td style={{ ...styles.cell, ...columnWidths[2] }}>{data.classification}</td>
        </tr>
    );
};





// The main Dashboard component.
export const Dashboard = (
  {
      envs,
      updateNodeInfo,
      graph,
      startSim,
  }
) => {
  const [selectedEnv, setSelectedEnv] = useState(null);
  const classifications = ['Priority 1', 'Standard', 'Low Risk', 'Archive', 'Critical'];
  const rowCount = 50;
  const handleSelectEnv = (envId) => {
    setSelectedEnv(envId);
  };

  const handleBack = () => {
    setSelectedEnv(null);
  };


  if (Object.keys(envs).length === 0) {
    return <></>
  }

  // Render the full-screen view for the selected environment
  if (selectedEnv) {
    const env = envs[selectedEnv];
    return (
      <div className="flex flex-col h-screen p-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans">
        <div className="main-content w-full max-w-4xl mx-auto h-full overflow-hidden flex flex-col rounded-2xl shadow-lg">
          <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={handleBack}
              className="text-blue-600 dark:text-blue-400 font-semibold"
            >
              ← Back to list
            </button>
            <h2 className="text-2xl font-bold mt-2">{env.name}</h2>
            <CustomChip color={env.status === "online" ? "online" : "offline"}>
              {env.status.toUpperCase()}
            </CustomChip>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Environment Details</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{env.details}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">Nodes</span>
                <span className="block text-lg font-bold">{env.nodes}</span>
              </div>
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">Edges</span>
                <span className="block text-lg font-bold">{env.edges}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen p-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans">
      <div className="main-content w-full max-w-4xl mx-auto h-full flex flex-col rounded-2xl shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Network Environments</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Select an environment to see detailed information.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div style={styles.appContainer}>
            <div style={styles.canvasContainer}>


                <ScrollableDataTable
                    envs={envs} updateNodeInfo={updateNodeInfo} graph={graph} startSim={startSim}/>
            </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

