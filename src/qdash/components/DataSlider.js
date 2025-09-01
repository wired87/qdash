import React, { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Code,
} from "@heroui/react";
import "../../index.css";

export const DataSlider = ({ nodes, edges, logs, isOpen, onToggle }) => {
  const [activeTab, setActiveTab] = useState("data");

  const formatDataForTable = (nodes, edges) => {
    const data = [];

    // Add nodes data
    nodes.forEach((node) => {
      data.push({
        id: node.id,
        name: node.name || "",
        type: node.type,
        ip: node.ip || "",
        target: "",
        protocol: "",
        status: node.meta?.status?.state || "",
        class_name: node.meta?.class_name || "",
        messages_sent: node.meta?.messages_sent || 0,
        messages_received: node.meta?.messages_received || 0,
      });
    });

    // Add edges data
    edges.forEach((edge) => {
      data.push({
        id: edge.id,
        name: "",
        type: "Edge",
        ip: edge.source,
        target: edge.target,
        protocol: edge.protocol,
        status: edge.status,
        class_name: "",
        messages_sent: 0,
        messages_received: 0,
      });
    });

    return data;
  };

  const renderLogEntries = (logData, nodeId) => {
    const allLogs = [];

    // Process error logs
    if (logData.err && Array.isArray(logData.err)) {
      logData.err.forEach((logLine, index) => {
        allLogs.push({
          id: `${nodeId}_err_${index}`,
          line: logLine,
          type: "error",
        });
      });
    }

    // Process output logs
    if (logData.out && Array.isArray(logData.out)) {
      logData.out.forEach((logLine, index) => {
        allLogs.push({
          id: `${nodeId}_out_${index}`,
          line: logLine,
          type: "output",
        });
      });
    }

    return allLogs;
  };

  const tableData = formatDataForTable(nodes, edges);

  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "NAME" },
    { key: "type", label: "TYPE" },
    { key: "ip", label: "IP/SOURCE" },
    { key: "target", label: "TARGET" },
    { key: "protocol", label: "PROTOCOL" },
    { key: "status", label: "STATUS" },
    { key: "class_name", label: "CLASS" },
    { key: "messages_sent", label: "MSG SENT" },
    { key: "messages_received", label: "MSG RECEIVED" },
  ];

  if (!isOpen) return null;

  return (
    <>
      <div className="slider-overlay" onClick={onToggle} />
      <div className="data-slider-wide">
        <div className="data-slider-header">
          <div className="data-header-top">
            <div className="data-title-section">
              <h2 className="data-title">Data Explorer</h2>
              <p className="data-subtitle">
                Nodes: {nodes.length} | Edges: {edges.length}
              </p>
            </div>
            <Button isIconOnly variant="light" onPress={onToggle}>
              ✕
            </Button>
          </div>

          <div className="data-tab-container">
            <Button
              size="sm"
              color={activeTab === "data" ? "primary" : "default"}
              variant={activeTab === "data" ? "solid" : "bordered"}
              onPress={() => setActiveTab("data")}
            >
              Data Table
            </Button>
            <Button
              size="sm"
              color={activeTab === "logs" ? "primary" : "default"}
              variant={activeTab === "logs" ? "solid" : "bordered"}
              onPress={() => setActiveTab("logs")}
            >
              Logs
            </Button>
          </div>
        </div>

        <div className="data-slider-content">
          {activeTab === "data" && (
            <div className="data-table-section">
              <h3 className="data-section-title">Network Data</h3>
              <Table
                aria-label="Network data table"
                isStriped
                isCompact
                className="data-table-full"
              >
                <TableHeader>
                  {columns.map((column) => (
                    <TableColumn key={column.key}>{column.label}</TableColumn>
                  ))}
                </TableHeader>
                <TableBody>
                  {tableData.map((item, index) => (
                    <TableRow key={index}>
                      {columns.map((column) => (
                        <TableCell key={column.key}>
                          {column.key === "status" && item[column.key] ? (
                            <Chip
                              size="sm"
                              color={
                                item[column.key] === "ALIVE" ||
                                item[column.key] === "Active"
                                  ? "success"
                                  : "default"
                              }
                            >
                              {item[column.key]}
                            </Chip>
                          ) : (
                            item[column.key] || ""
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="logs-section">
              <h3 className="logs-section-title">System Logs</h3>
              <div className="logs-container">
                {nodes.map((node) => {
                  const nodeLogs = logs[node.id];
                  const logEntries = nodeLogs
                    ? renderLogEntries(nodeLogs, node.id)
                    : [];

                  return (
                    <Card key={node.id} className="log-node-card">
                      <CardBody>
                        <div className="log-node-header">
                          <div className="log-node-indicator" />
                          <span className="log-node-name">Node: {node.id}</span>
                          <Chip size="sm" variant="flat">
                            {logEntries.length} entries
                          </Chip>
                        </div>

                        <div className="log-entries">
                          {logEntries.length > 0 ? (
                            logEntries.map((logEntry) => (
                              <Code
                                key={logEntry.id}
                                color={
                                  logEntry.type === "error"
                                    ? "danger"
                                    : "success"
                                }
                                className="log-code-line"
                              >
                                {logEntry.id}: {logEntry.line}
                              </Code>
                            ))
                          ) : (
                            <Code className="log-code-line" color="default">
                              {node.id}: No logs available
                            </Code>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
