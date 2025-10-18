import React, {useCallback, useState} from "react";
import {Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader} from "@heroui/react";
import {ThreeScene} from "../_use_three";


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
    const [isOpen, setIsOpen] = useState(false);

    const handleSelectEnv = (envId) => {
        setSelectedEnv(envId);
    };

    const toggleModal = (env_id = null) => {
        if (env_id) {
            handleSelectEnv(env_id);
        }

        setIsOpen(!isOpen);
    };

    const handleBack = () => {
        setSelectedEnv(null);
    };

    const addEnvLen = useCallback((env_id) => {
        return Object.keys(envs).length
    }, [envs])

    const modal = useCallback(() => {
        return (
            <Modal isOpen={isOpen} onClose={toggleModal} size="5xl" scrollBehavior="inside">
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Graph View</ModalHeader>
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
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Close
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        )
    }, [isOpen, selectedEnv, graph])


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
                                        <table style={styles.dataTable}>
                                            <thead>
                                            <tr>
                                                <th style={{...styles.headerCell, width: '33%'}}>Environment ID</th>
                                                <th style={{...styles.headerCell, width: '33%'}}>Graph Visualization
                                                </th>
                                                <th style={{...styles.headerCell, width: '34%'}}>Actions</th>
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
                                                        }}>{amount_nodes} nodes</p>
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

                                                    {/* Column 3: Start Sim Button */}
                                                    <td style={styles.cell}>
                                                        <Button
                                                            onPress={() => startSim(env_id)}
                                                            startContent="📊">
                                                            Start Sim
                                                        </Button>
                                                    </td>

                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
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
        {modal()}
    </>
    );
};

export default Dashboard;

