import React, { useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Code,
  Checkbox,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Slider,
  Input,
} from "@heroui/react";
import { MoreVertical } from "lucide-react";
import "../../index.css";

export const DataSlider = ({ nodes, edges, logs, isOpen, onToggle, envsList, envData, sendMessage, setEnvData }) => {
  const [activeTab, setActiveTab] = useState("data");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showNcfgModal, setShowNcfgModal] = useState(false);
  const [ncfgValue, setNcfgValue] = useState(50);
  const [showCheckboxActions, setShowCheckboxActions] = useState(false);

  // Handler for get_data button click
  const handleGetEnvData = (envId) => {
    sendMessage({
      type: "get_env_data",
      env_id: envId,
      timestamp: new Date().toISOString(),
    });
  };

  // Handler for checkbox selection
  const handleRowSelection = (envId, isSelected) => {
    const newSelectedRows = new Set(selectedRows);
    if (isSelected) {
      newSelectedRows.add(envId);
    } else {
      newSelectedRows.delete(envId);
    }
    setSelectedRows(newSelectedRows);
  };

  // Handler for checkbox actions
  const handleCheckboxAction = (action) => {
    const selectedList = Array.from(selectedRows);
    
    switch(action) {
      case 'apply_ml':
        sendMessage({
          type: "apply_ml",
          entries: selectedList,
          timestamp: new Date().toISOString(),
        });
        break;
      case 'delete':
        sendMessage({
          type: "delete",
          entries: selectedList,
          timestamp: new Date().toISOString(),
        });
        break;
      case 'ask':
        sendMessage({
          type: "ask",
          entries: selectedList,
          timestamp: new Date().toISOString(),
        });
        break;
    }
    setShowCheckboxActions(false);
    setSelectedRows(new Set());
  };

  // Handler for NCFG slider submit
  const handleNcfgSubmit = () => {
    sendMessage({
      type: "ncfg_update",
      value: ncfgValue,
      timestamp: new Date().toISOString(),
    });
    setShowNcfgModal(false);
  };

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

    // Add hardcoded demo data
    data.push(
      {
        id: 'node-1',
        name: 'Demo Node 1',
        type: 'Server',
        ip: '192.168.1.1',
        target: '',
        protocol: '',
        status: 'ALIVE',
        class_name: 'WebApp',
        messages_sent: 120,
        messages_received: 80,
      },
      {
        id: 'edge-1',
        name: '',
        type: 'Edge',
        ip: '192.168.1.1',
        target: '192.168.1.2',
        protocol: 'TCP',
        status: 'Active',
        class_name: '',
        messages_sent: 0,
        messages_received: 0,
      },
      {
        id: 'node-2',
        name: 'Demo Node 2',
        type: 'Database',
        ip: '192.168.1.2',
        target: '',
        protocol: '',
        status: 'ALIVE',
        class_name: 'PostgreSQL',
        messages_sent: 80,
        messages_received: 120,
      }
    );

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

  // Handler for row actions (visualize, delete)
  const handleRowAction = (itemId, action) => {
    if (action === "visualize") {
      sendMessage({
        type: "visualize",
        item_id: itemId,
        timestamp: new Date().toISOString(),
      });
    } else if (action === "delete") {
      sendMessage({
        type: "delete_item",
        item_id: itemId,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const tableData = formatDataForTable(nodes, edges);
  const columns = [
    { key: "checkbox", label: "" },
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
    { key: "actions", label: "" },
  ];

  return (
    <>
      <div className="" onClick={onToggle} />
      <Card className="data-slider-wide">
        <CardHeader className="data-slider-header">
          <div className="data-header-top">
            <div className="data-title-section">
              <h2 className="data-title">Data Explorer</h2>
            </div>
            <div className="data-header-actions">
              {selectedRows.size > 0 && (
                <Dropdown>
                  <DropdownTrigger>
                    <Button 
                      size="sm" 
                      color="primary" 
                      variant="solid"
                    >
                      Actions ({selectedRows.size} selected)
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="Checkbox Actions">
                    <DropdownItem key="apply_ml" onClick={() => handleCheckboxAction('apply_ml')}>
                      Apply Machine Learning
                    </DropdownItem>
                    <DropdownItem key="delete" onClick={() => handleCheckboxAction('delete')} className="text-danger" color="danger">
                      Delete
                    </DropdownItem>
                    <DropdownItem key="ask" onClick={() => handleCheckboxAction('ask')}>
                      Send Request
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              )}

              <Button isIconOnly variant="light" onPress={onToggle}>
                ✕
              </Button>
            </div>
          </div>

          <div className="data-tab-container">
            <Button
              size="sm"
              color={activeTab === "environments" ? "primary" : "default"}
              variant={activeTab === "environments" ? "solid" : "bordered"}
              onPress={() => setActiveTab("environments")}>
              Environments
            </Button>
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
        </CardHeader>
        <CardBody className="data-slider-content">
          {activeTab === "environments" && (
            <div className="environments-section">
              <h3 className="data-section-title">Available Environments</h3>
              {envsList && envsList.length > 0 ? (
                <>
                  <Table
                    aria-label="Environments table"
                    isStriped
                    isCompact
                    className="data-table-full"
                  >
                    <TableHeader>
                      <TableColumn width="50"></TableColumn>
                      <TableColumn>Status</TableColumn>
                      <TableColumn>Name</TableColumn>
                      <TableColumn>Action</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {envsList.map((envId, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Checkbox
                              isSelected={selectedRows.has(envId)}
                              onValueChange={(isSelected) => handleRowSelection(envId, isSelected)}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="sm"
                              color={index === 0 ? "success" : "default"}
                              variant="flat"
                            >
                              {index === 0 ? "✓" : "○"}
                            </Chip>
                          </TableCell>
                          <TableCell>
                            <span className="text-primary">{envId}</span>
                          </TableCell>
                          <TableCell>
                            <Dropdown>
                              <DropdownTrigger>
                                <Button
                                  size="sm"
                                  variant="light"
                                  endContent={
                                    <span className="text-default-400">⋮</span>
                                  }
                                >
                                  Actions
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu aria-label="Environment Actions">
                                <DropdownItem 
                                  key="start" 
                                  startContent={<span>▶</span>}
                                >
                                  Start/Resume
                                </DropdownItem>
                                <DropdownItem key="stop">
                                  Stop
                                </DropdownItem>
                                <DropdownItem key="suspend">
                                  Suspend
                                </DropdownItem>
                                <DropdownItem 
                                  key="reset" 
                                  startContent={<span>⟲</span>}
                                >
                                  Reset
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                            <Button
                              size="sm"
                              color="primary"
                              variant="flat"
                              onPress={() => handleGetEnvData(envId)}
                              className="ml-2"
                            >
                              Get Data
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Show environment data if available */}
                  {envData && envData.length > 0 && (
                    <div className="env-data-section" style={{ marginTop: "20px" }}>
                      <h4 className="data-section-title">Environment Data</h4>
                      <Table
                        aria-label="Environment data table"
                        isStriped
                        isCompact
                        className="data-table-full"
                      >
                        <TableHeader>
                          {envData[0] && Object.keys(envData[0]).map((key) => (
                            <TableColumn key={key}>{key.toUpperCase()}</TableColumn>
                          ))}
                        </TableHeader>
                        <TableBody>
                          {envData.map((item, index) => (
                            <TableRow key={index}>
                              {Object.values(item).map((value, idx) => (
                                <TableCell key={idx}>
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </>
              ) : (
                <p>No environments available. Loading...</p>
              )}
            </div>
          )}

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
                    <TableColumn 
                      key={column.key} 
                      width={column.key === "checkbox" || column.key === "actions" ? "50" : undefined}
                      align={column.key === "actions" ? "end" : "start"}
                    >
                      {column.label}
                    </TableColumn>
                  ))}
                </TableHeader>
                <TableBody>
                  {tableData.map((item, index) => (
                    <TableRow key={index}>
                      {columns.map((column) => (
                        <TableCell key={column.key}>
                          {column.key === "checkbox" ? (
                            <Checkbox
                              isSelected={selectedRows.has(item.id)}
                              onValueChange={(isSelected) => handleRowSelection(item.id, isSelected)}
                            />
                          ) : column.key === "actions" ? (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <Dropdown>
                                <DropdownTrigger>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    aria-label="More actions"
                                    style={{
                                      minWidth: 'auto',
                                      width: '32px',
                                      height: '32px',
                                    }}
                                  >
                                    <MoreVertical size={18} style={{ color: '#6b7280' }} />
                                  </Button>
                                </DropdownTrigger>
                                <DropdownMenu 
                                  aria-label="Row actions"
                                  onAction={(key) => handleRowAction(item.id, key)}
                                >
                                  <DropdownItem 
                                    key="visualize"
                                  >
                                    Visualize
                                  </DropdownItem>
                                  <DropdownItem 
                                    key="delete"
                                    className="text-danger" 
                                    color="danger"
                                  >
                                    Delete
                                  </DropdownItem>
                                </DropdownMenu>
                              </Dropdown>
                            </div>
                          ) : column.key === "status" && item[column.key] ? (
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
        </CardBody>
        <CardFooter className="data-subtitle">
            <p>Nodes: {nodes.length} | Edges: {edges.length}</p>
        </CardFooter>
      </Card>

      {/* NCFG Slider Modal */}
      <Modal 
        isOpen={showNcfgModal} 
        onOpenChange={setShowNcfgModal}
        size="md"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                NCFG Configuration
              </ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <p className="text-small text-default-500">
                    Adjust the NCFG value using the slider below:
                  </p>
                  <Slider
                    label="NCFG Value"
                    step={1}
                    maxValue={100}
                    minValue={0}
                    value={ncfgValue}
                    onChange={setNcfgValue}
                    className="max-w-full"
                    showSteps={true}
                    showTooltip={true}
                    showOutline={true}
                    disableThumbScale={true}
                    formatOptions={{style: "percent"}}
                    tooltipValueFormatOptions={{style: "decimal"}}
                  />
                  <Input
                    type="number"
                    label="Manual Input"
                    placeholder="Enter value"
                    value={ncfgValue.toString()}
                    onChange={(e) => setNcfgValue(Number(e.target.value))}
                    min={0}
                    max={100}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
                <Button color="primary" onPress={handleNcfgSubmit}>
                  Apply
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
