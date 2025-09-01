import React from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Card,
  CardBody,
  CardHeader,
} from "@heroui/react";
import "../index.css";

export const DataTable = ({ cfg_content, nodes, edges }) => {
  const formatOverviewData = () => {
    const data = [];

    if (cfg_content && Object.keys(cfg_content).length > 0) {
      data.push({
        type: "Config",
        id: "config_summary",
        count: Object.keys(cfg_content).length,
        status: "Active",
        details: `${Object.keys(cfg_content).length} pixel IDs configured`,
      });
    }

    if (nodes && nodes.length > 0) {
      const aliveNodes = nodes.filter(
        (n) => n.meta?.status?.state === "ALIVE"
      ).length;
      data.push({
        type: "Nodes",
        id: "nodes_summary",
        count: nodes.length,
        status: aliveNodes === nodes.length ? "Healthy" : "Warning",
        details: `${aliveNodes}/${nodes.length} nodes alive`,
      });
    }

    if (edges && edges.length > 0) {
      const activeEdges = edges.filter((e) => e.status === "Active").length;
      data.push({
        type: "Edges",
        id: "edges_summary",
        count: edges.length,
        status: activeEdges === edges.length ? "Healthy" : "Warning",
        details: `${activeEdges}/${edges.length} edges active`,
      });
    }

    return data;
  };

  const overviewData = formatOverviewData();

  const columns = [
    { key: "type", label: "TYPE" },
    { key: "id", label: "ID" },
    { key: "count", label: "COUNT" },
    { key: "status", label: "STATUS" },
    { key: "details", label: "DETAILS" },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Healthy":
      case "Active":
        return "success";
      case "Warning":
        return "warning";
      case "Error":
        return "danger";
      default:
        return "default";
    }
  };

  return (
    <Card className="data-overview-card">
      <CardHeader className="data-overview-header">
        <h3 className="data-overview-title">System Overview</h3>
      </CardHeader>
      <CardBody>
        {overviewData.length > 0 ? (
          <Table
            aria-label="System overview table"
            className="data-overview-table"
          >
            <TableHeader>
              {columns.map((column) => (
                <TableColumn key={column.key}>{column.label}</TableColumn>
              ))}
            </TableHeader>
            <TableBody>
              {overviewData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <span className="table-cell-type">{item.type}</span>
                  </TableCell>
                  <TableCell>
                    <span className="table-cell-id">{item.id}</span>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat">
                      {item.count}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" color={getStatusColor(item.status)}>
                      {item.status}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="table-cell-details">{item.details}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="data-overview-empty">
            <div className="data-overview-empty-icon">📊</div>
            <p className="data-overview-empty-text">No data available</p>
            <p className="data-overview-empty-subtext">
              Configure nodes and edges to see system overview
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
