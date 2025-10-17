import React, { useState } from 'react';
import {ThreeScene} from "../_use_three";

// --- STYLES DEFINITION (Inline CSS Equivalent) ---
const styles = {
// ... (styles remain unchanged)
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
    canvasContainer: {
        width: '95%',
        maxWidth: '800px',
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
    tableWrapper: {
        maxHeight: '500px',
        overflowY: 'auto',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
    },
    dataTable: {
        width: '100%',
        borderCollapse: 'collapse',
        tableLayout: 'fixed',
    },
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
    cell: {
        padding: '10px 15px',
        borderBottom: '1px solid #f3f4f6',
        color: '#374151',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
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

// --- PLACEHOLDER COMPONENTS ---
// Note: These must be simple placeholders since the full implementations of ThreeScene
// and Button are not available in this single file.

/** Placeholder for the custom ThreeScene graph visualization component. */


/** Placeholder for the custom Button component. */
const Button = ({ children, onPress, startContent }) => (
    <button
        onClick={onPress}
        style={{
            padding: '8px 12px',
            backgroundColor: '#1e3a8a',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            margin: '4px 0',
            width: '100%',
            fontWeight: 600,
            transition: 'background-color 0.2s',
        }}
    >
        {startContent} {children}
    </button>
);


// --- Main App Component ---
// Component now expects envs, updateNodeInfo, graph, and startSim as props.
const ScrollableDataTable = ({ envs, updateNodeInfo, graph, startSim }) => {
    let environments = envs;
    const totalEnvironments = Object.keys(environments).length;

    console.log("environments", environments)

    return (
        <div style={styles.appContainer}>
            <div style={styles.canvasContainer}>
                <h2 style={styles.h2}>Environment and Simulation Management</h2>

                <div style={styles.tableWrapper}>
                    <table style={styles.dataTable}>
                        <thead>
                            <tr>
                                <th style={{ ...styles.headerCell, width: '33%' }}>Environment ID</th>
                                <th style={{ ...styles.headerCell, width: '33%' }}>Graph Visualization</th>
                                <th style={{ ...styles.headerCell, width: '34%' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(environments).map(([env_id, amount_nodes], index) => (
                                <tr
                                    key={env_id}
                                    // Using custom logic for row coloring
                                    style={index % 2 !== 0 ? styles.rowEven : {}}
                                >

                                    {/* Column 1: Environment ID and Node Count */}
                                    <td style={styles.cell}>
                                        <p style={{fontWeight: 600}}>{env_id}</p>
                                        <p style={{fontSize: 12, color: '#6b7280'}}>{amount_nodes} nodes</p>
                                    </td>

                                    {/* Column 2: Graph/Scene */}
                                    <td style={styles.cell}>
                                        <ThreeScene
                                            nodes={graph.nodes}
                                            edges={graph.edges}
                                            onNodeClick={updateNodeInfo}
                                            env_id={env_id}
                                        />
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
                    Total environments loaded: {totalEnvironments}.
                </p>
            </div>
        </div>
    );
};

export default ScrollableDataTable;
