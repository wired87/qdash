import React, {useCallback, useState} from "react";
import {Button} from "@heroui/react";
import EnergyProfileModal from "./node_cfg/block_visual";


const CustomChip = ({children, color, className = ""}) => {
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


export const Dashboard = (
    {
        envs,
        toggleModal,
        startSim,
        toggleNcfg,
        toggleDataSlider,
        sendMessage,
        isDataSliderOpen,
    }
) => {
    const [envNcfg, setEnvNcfg] = useState("")
    const [isNcfgModalOpen, setIsNcfgModalOpen] = useState(false)
    const [blockVisualData, setBlockVisualData] = useState({
        points: [
            { id: 0, x: 50, y: 150 },
            { id: 1, x: 550, y: 150 },
        ],
        output: [],
        selectedTools: []
    });
    
    const addEnvLen = useCallback(() => {
        const len_envs = Object.keys(envs).length
        console.log("envs len", len_envs);
        return len_envs
    }, [envs])

    const handleSetNcfg = (env_id) => {
        setEnvNcfg(env_id)
        setIsNcfgModalOpen(true)
        // Initialize with default blocks array
        setBlockVisualData({
            blocks: [{
                id: Date.now(),
                points: [
                    { id: 0, x: 50, y: 150 },
                    { id: 1, x: 550, y: 150 },
                ],
                output: [],
                selectedTools: []
            }]
        });
    }

    const handleCloseNcfgModal = () => {
        setIsNcfgModalOpen(false)
        setEnvNcfg("")
        setBlockVisualData({
            blocks: [{
                id: Date.now(),
                points: [
                    { id: 0, x: 50, y: 150 },
                    { id: 1, x: 550, y: 150 },
                ],
                output: [],
                selectedTools: []
            }]
        });
    }

    const handleSendNcfg = (data) => {
        // Send all blocks data with the environment ID
        sendMessage({
            type: "ncfg",
            env_id: envNcfg,
            node_cfg: data.blocks || [],
            timestamp: new Date().toISOString(),
        });
        handleCloseNcfgModal();
    }

    const get_content = useCallback(() => {
        if (addEnvLen() > 0 ) {
            return(
                <table style={styles.dataTable}>
                    <thead>
                    <tr>
                        <th style={{...styles.headerCell, width: '25%'}}>Environment ID</th>
                        <th style={{...styles.headerCell, width: '25%'}}>Graph Visualization</th>
                        <th style={{...styles.headerCell, width: '25%'}}>Node CFG</th>
                        <th style={{...styles.headerCell, width: '25%'}}>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {Object.entries(envs).map(([env_id, amount_nodes], index) => (
                        <tr
                            key={env_id}
                            // Using custom logic for row coloring
                            style={index % 2 !== 0 ? styles.rowEven : {}}
                        >

                            {/* Column 1: Environment ID and Node Count */}
                            <td style={styles.cell}>
                                <p style={{fontWeight: 600}}>{env_id}</p>
                                <p style={{
                                    fontSize: 12,
                                    color: '#6b7280'
                                }}>Cluster size: {amount_nodes} (x3D) nodes</p>
                            </td>

                            {/* Column 2: Graph/Scene */}
                            <td style={styles.cell}>
                                <Button
                                    onPress={() => toggleModal(env_id)}
                                    color="primary"
                                    style={{
                                        width: "10vh",
                                        height: 100,
                                        zIndex: 9999,
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}
                                >
                                    Show Graph
                                </Button>
                            </td>
                            <td style={styles.cell}>
                                <Button
                                    onPress={() => handleSetNcfg(env_id)}
                                    color="primary"
                                    style={{
                                        width: "10vh",
                                        height: 100,
                                        zIndex: 9999,
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}
                                >
                                    SetNcfg
                                </Button>
                            </td>

                            {/* Column 3: Start Sim Button */}
                            <td style={styles.cell}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <Button
                                        onPress={() => startSim(env_id)}
                                        startContent="📊">
                                        Start Sim
                                    </Button>
                                    <Button
                                        onPress={() => {
                                            toggleDataSlider();
                                            sendMessage({
                                                type: "toggle_data_slider",
                                                env_id: env_id,
                                                timestamp: new Date().toISOString(),
                                            });
                                        }}
                                        color="secondary"
                                        startContent="📊">
                                        {isDataSliderOpen ? "Close Data" : "Open Data"}
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )
        }else {
            return <p> No environments created now... </p>
        }
    }, [envs, addEnvLen, toggleNcfg, toggleDataSlider, sendMessage, isDataSliderOpen])

    return (
    <>
        <div
            className="flex flex-col h-screen p-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans">
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
                            <div style={styles.appContainer}>
                                <div style={styles.canvasContainer}>
                                    <h2 style={styles.h2}>Environment and Simulation Management</h2>
                                    <div style={styles.tableWrapper}>
                                        {get_content()}
                                    </div>
                                    <p style={styles.footerText}>
                                        Total environments loaded: {addEnvLen()}.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Block Visual Modal - Opens directly when SetNcfg is clicked */}
        {isNcfgModalOpen && envNcfg && (
            <EnergyProfileModal
                initialData={blockVisualData}
                onClose={handleCloseNcfgModal}
                onSend={handleSendNcfg}
            />
        )}
    </>
    );
};

export default Dashboard;

