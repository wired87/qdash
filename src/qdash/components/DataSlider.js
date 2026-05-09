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
import { MathJax, MathJaxContext } from "better-react-mathjax";
import { get, ref } from "firebase/database";
import SliderPanel from "./common/SliderPanel";
import "../../index.css";

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/chtml"] },
  tex: { inlineMath: [["$", "$"], ["\\(", "\\)"]] },
};

const normalizeNumericPoints = (value) => {
  const points = [];
  const walk = (node) => {
    if (typeof node === "number" && Number.isFinite(node)) {
      points.push(node);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach((n) => walk(n));
      return;
    }
    if (node && typeof node === "object") {
      const hasXY = Number.isFinite(node.x) && Number.isFinite(node.y);
      if (hasXY) {
        points.push(node.y);
        return;
      }
      Object.values(node).forEach((n) => walk(n));
    }
  };
  walk(value);
  return points;
};

const makeSvgPolyline = (points, width = 760, height = 260) => {
  if (!points.length) return "";
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  return points
    .map((v, i) => {
      const x = (i / Math.max(points.length - 1, 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
};

export const DataSlider = ({ nodes, edges, logs, isOpen, onToggle, envsList, envData, sendMessage, setEnvData, envs, user, firebaseDb }) => {
  const [activeTab, setActiveTab] = useState("data");
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showNcfgModal, setShowNcfgModal] = useState(false);
  const [ncfgValue, setNcfgValue] = useState(50);
  const [showCheckboxActions, setShowCheckboxActions] = useState(false);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [resultLoading, setResultLoading] = useState(false);
  const [resultError, setResultError] = useState(null);
  const [activeResultEnvId, setActiveResultEnvId] = useState(null);
  const [resultPayload, setResultPayload] = useState(null);

  // Handler for get_data button click
  const handleGetEnvData = (envId) => {
    sendMessage({
      type: "GET_ENV_DATA",
      env_id: envId,
      timestamp: new Date().toISOString(),
    });
  };

  const getEnvStatus = (envId) => {
    const state = envs?.[envId]?.status?.state || envs?.[envId]?.status || "";
    return String(state).toLowerCase();
  };

  const isCompletedEnv = (envId) => {
    const status = getEnvStatus(envId);
    return status === "completed" || status === "complete" || status === "done";
  };

  const handleVisualizeCompletedEnv = async (envId) => {
    if (!isCompletedEnv(envId)) return;
    if (!firebaseDb?.current || !user?.uid) {
      setResultError("Firebase/Benutzer nicht verfügbar.");
      setResultModalOpen(true);
      return;
    }

    setActiveResultEnvId(envId);
    setResultError(null);
    setResultLoading(true);
    setResultPayload(null);
    setResultModalOpen(true);

    try {
      const primaryPath = ref(firebaseDb.current, `users/${user.uid}/results/${envId}`);
      const fallbackPath = ref(firebaseDb.current, `users/${user.uid}/result/${envId}`);

      const primarySnap = await get(primaryPath);
      let payload = primarySnap.exists() ? primarySnap.val() : null;

      if (!payload) {
        const fallbackSnap = await get(fallbackPath);
        payload = fallbackSnap.exists() ? fallbackSnap.val() : null;
      }

      if (!payload) {
        throw new Error("Keine Result-Daten für diese Environment gefunden.");
      }

      setResultPayload(payload);
    } catch (err) {
      setResultError(err?.message || "Result-Laden fehlgeschlagen.");
    } finally {
      setResultLoading(false);
    }
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

    switch (action) {
      case 'apply_ml':
        sendMessage({
          type: "APPLY_ML",
          entries: selectedList,
          timestamp: new Date().toISOString(),
        });
        break;
      case 'delete':
        sendMessage({
          type: "DELETE",
          entries: selectedList,
          timestamp: new Date().toISOString(),
        });
        break;
      case 'ask':
        sendMessage({
          type: "ASK",
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
      type: "NCFG_UPDATE",
      value: ncfgValue,
      timestamp: new Date().toISOString(),
    });
    setShowNcfgModal(false);
  };
  //...
  // Handler for row actions (visualize, delete)
  const handleRowAction = (itemId, action) => {
    if (action === "visualize") {
      sendMessage({
        type: "VISUALIZE",
        item_id: itemId,
        timestamp: new Date().toISOString(),
      });
    } else if (action === "delete") {
      sendMessage({
        type: "DELETE_ITEM",
        item_id: itemId,
        timestamp: new Date().toISOString(),
      });
    }
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

  const resultSeries = normalizeNumericPoints(resultPayload);
  const seriesCount = resultSeries.length;
  const mean = seriesCount ? resultSeries.reduce((a, b) => a + b, 0) / seriesCount : 0;
  const min = seriesCount ? Math.min(...resultSeries) : 0;
  const max = seriesCount ? Math.max(...resultSeries) : 0;
  const polylinePoints = makeSvgPolyline(resultSeries);

  return (
    <>
      <SliderPanel
        isOpen={isOpen}
        onClose={onToggle}
        title="Data Explorer"
        subtitle={`Nodes: ${nodes.length} | Edges: ${edges.length}`}
        width="900px"
      >
        <div className="flex flex-col gap-4">
          {/* Header Actions & Tabs */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-100 dark:bg-slate-900/50 p-3 rounded-xl">
            <div className="flex gap-2">
              <Button
                size="sm"
                color={activeTab === "environments" ? "primary" : "default"}
                variant={activeTab === "environments" ? "solid" : "flat"}
                onPress={() => setActiveTab("environments")}>
                Environments
              </Button>
              <Button
                size="sm"
                color={activeTab === "data" ? "primary" : "default"}
                variant={activeTab === "data" ? "solid" : "flat"}
                onPress={() => setActiveTab("data")}
              >
                Data Table
              </Button>
              <Button
                size="sm"
                color={activeTab === "logs" ? "primary" : "default"}
                variant={activeTab === "logs" ? "solid" : "flat"}
                onPress={() => setActiveTab("logs")}
              >
                Logs
              </Button>
            </div>

            {selectedRows.size > 0 && (
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    size="sm"
                    color="primary"
                    variant="shadow"
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
          </div>

          {/* Content Sections */}
          {activeTab === "environments" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Available Environments</h3>
              {envsList && envsList.length > 0 ? (
                <>
                  <Table
                    aria-label="Environments table"
                    isStriped
                    className="bg-white dark:bg-slate-900"
                  >
                    <TableHeader>
                      <TableColumn width="50"></TableColumn>
                      <TableColumn>Status</TableColumn>
                      <TableColumn>Name</TableColumn>
                      <TableColumn>Action</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {envsList.map((envId, index) => {
                        const status = getEnvStatus(envId);
                        const completed = isCompletedEnv(envId);
                        return (
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
                                color={completed ? "success" : "default"}
                                variant="flat"
                              >
                                {completed ? "completed" : (status || "pending")}
                              </Chip>
                            </TableCell>
                            <TableCell>
                              <span className="text-primary font-medium">{envId}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Dropdown>
                                  <DropdownTrigger>
                                    <Button
                                      aria-label="Environment actions"
                                      size="sm"
                                      variant="light"
                                      isIconOnly
                                    >
                                      <MoreVertical size={18} />
                                    </Button>
                                  </DropdownTrigger>
                                  <DropdownMenu aria-label="Environment Actions">
                                    <DropdownItem key="start" startContent={<span>▶</span>}>Start/Resume</DropdownItem>
                                    <DropdownItem key="stop">Stop</DropdownItem>
                                    <DropdownItem key="suspend">Suspend</DropdownItem>
                                    <DropdownItem key="reset" startContent={<span>⟲</span>}>Reset</DropdownItem>
                                  </DropdownMenu>
                                </Dropdown>
                                <Button
                                  size="sm"
                                  color="primary"
                                  variant="flat"
                                  onPress={() => handleGetEnvData(envId)}
                                >
                                  Get Data
                                </Button>
                                <Button
                                  size="sm"
                                  color="secondary"
                                  variant="flat"
                                  isDisabled={!completed}
                                  onPress={() => handleVisualizeCompletedEnv(envId)}
                                >
                                  Visualization
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Show environment data if available */}
                  {envData && envData.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-md font-semibold mb-3 text-slate-700 dark:text-slate-300">Environment Data</h4>
                      <Table
                        aria-label="Environment data table"
                        isStriped
                        className="bg-white dark:bg-slate-900"
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
                <div className="text-center py-10 text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                  <p>No environments available.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Network Data</h3>
              <Table
                aria-label="Network data table"
                isStriped
                className="bg-white dark:bg-slate-900"
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
                            <div className="flex justify-end items-center">
                              <Dropdown>
                                <DropdownTrigger>
                                  <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    aria-label="More actions"
                                  >
                                    <MoreVertical size={18} className="text-slate-500" />
                                  </Button>
                                </DropdownTrigger>
                                <DropdownMenu
                                  aria-label="Row actions"
                                  onAction={(key) => handleRowAction(item.id, key)}
                                >
                                  <DropdownItem key="visualize">Visualize</DropdownItem>
                                  <DropdownItem key="delete" className="text-danger" color="danger">Delete</DropdownItem>
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
                              variant="flat"
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
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">System Logs</h3>
              <div className="space-y-4">
                {nodes.map((node) => {
                  const nodeLogs = logs[node.id];
                  const logEntries = nodeLogs
                    ? renderLogEntries(nodeLogs, node.id)
                    : [];
                  return (
                    <Card key={node.id} className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                      <CardBody className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Node: {node.id}</span>
                          </div>
                          <Chip size="sm" variant="flat">
                            {logEntries.length} entries
                          </Chip>
                        </div>

                        <div className="bg-slate-950 rounded-lg p-3 max-h-[200px] overflow-y-auto font-mono text-xs space-y-1">
                          {logEntries.length > 0 ? (
                            logEntries.map((logEntry) => (
                              <div
                                key={logEntry.id}
                                className={
                                  logEntry.type === "error"
                                    ? "text-red-400"
                                    : "text-green-400"
                                }
                              >
                                <span className="opacity-50 mr-2">{logEntry.id.split('_').pop()}:</span>
                                {logEntry.line}
                              </div>
                            ))
                          ) : (
                            <div className="text-slate-500 italic">
                              {node.id}: No logs available
                            </div>
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
      </SliderPanel>

      <Modal
        isOpen={resultModalOpen}
        onOpenChange={setResultModalOpen}
        size="5xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Visualization Results · {activeResultEnvId || "unknown"}
              </ModalHeader>
              <ModalBody>
                {resultLoading ? (
                  <div className="text-sm text-slate-500">Lade Result-Daten aus Firebase RTDB...</div>
                ) : resultError ? (
                  <div className="text-sm text-red-500">{resultError}</div>
                ) : (
                  <MathJaxContext config={mathJaxConfig}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Card className="border border-slate-200 dark:border-slate-700">
                          <CardBody className="text-sm">Points: <Code>{seriesCount}</Code></CardBody>
                        </Card>
                        <Card className="border border-slate-200 dark:border-slate-700">
                          <CardBody className="text-sm">Min/Max: <Code>{min.toFixed(4)} / {max.toFixed(4)}</Code></CardBody>
                        </Card>
                        <Card className="border border-slate-200 dark:border-slate-700">
                          <CardBody className="text-sm">Mean: <Code>{mean.toFixed(4)}</Code></CardBody>
                        </Card>
                      </div>

                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-900">
                        <MathJax>{`$$\\bar{x}=\\frac{1}{n}\\sum_{i=1}^{n}x_i,\; n=${seriesCount},\; \\bar{x}=${mean.toFixed(4)}$$`}</MathJax>
                      </div>

                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-900 overflow-x-auto">
                        <svg width="760" height="260" viewBox="0 0 760 260" role="img" aria-label="Result data points chart">
                          <rect x="0" y="0" width="760" height="260" fill="transparent" />
                          <line x1="0" y1="259" x2="760" y2="259" stroke="#64748b" strokeWidth="1" />
                          <line x1="1" y1="0" x2="1" y2="260" stroke="#64748b" strokeWidth="1" />
                          {polylinePoints ? (
                            <polyline points={polylinePoints} fill="none" stroke="#0ea5e9" strokeWidth="2" />
                          ) : null}
                        </svg>
                      </div>

                      <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700">
                        <Table aria-label="Result points table" isStriped removeWrapper>
                          <TableHeader>
                            <TableColumn>INDEX</TableColumn>
                            <TableColumn>VALUE</TableColumn>
                          </TableHeader>
                          <TableBody>
                            {resultSeries.map((value, idx) => (
                              <TableRow key={`${idx}-${value}`}>
                                <TableCell>{idx}</TableCell>
                                <TableCell>{value}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </MathJaxContext>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>Close</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

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
                    formatOptions={{ style: "percent" }}
                    tooltipValueFormatOptions={{ style: "decimal" }}
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

