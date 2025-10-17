import { Accordion, AccordionItem } from "@heroui/react";
import { Button, Input } from "@heroui/react";
import {useCallback, useState} from "react";
import XYZInput from "./dim_component";

const filteredCfg = {
  sim_time_s: {
    value: 300,
    description:
      "Time in s the simulation should run",
  },
  cluster_dim: {
    value: [1, 1, 1],
    description: "The 3D dimensions of the simulation cluster.",
  },

  device: {
    value: "cpu",
    description: "The device to use for the simulation (CPU or GPU).",
  },

  cpu: {
    value: 2,
    description: "The amount of CPUs use for the simulation.",
  },
  cpu_limit: {
    value: 4,
    description: "For case the sim requires more resources then specified. - Set your max allowed resiurces",
  },

  mem: {
    value: 8,
    description: "RAM per simulation in Gigabytes (GB)",
  },
  mem_limit: {
    value: 16,
    description: "max. RAM for the sim in Gigabytes (GB)",
  },




};

const ConfigAccordion = ({ sendMessage }) => {
  const [completed, setCompleted] = useState(false); // { pixelId: true/false }
  const [cfg, setCfg] = useState(filteredCfg);

    const handleValueChange = (sid, newValue) => {
    setCfg((prevCfg) => {
      let updatedCfg = { ...prevCfg };
      if (updatedCfg[sid]) {
        updatedCfg = {
          ...updatedCfg,
          [sid]: {
            ...updatedCfg[sid],
            value: isNaN(parseFloat(newValue))
              ? newValue
              : parseFloat(newValue),
          },
        };
      }
      return updatedCfg;
    });
  };
  const filter_cfg = () => {
    const maxValues = Object.fromEntries(
      Object.entries(cfg).map(([key, val]) => [key, val.value])
    );
    // generate env_id
    maxValues.id = crypto.randomUUID().replace(/-/g, '');

    return [{
        world_cfg: maxValues,
        node_cfg: [
            {
            id: "ELECTRON_px_0",
            "blocks": [
              {
                "block_break_duration_iters": 5,
                "id": "somthing1",
                "break_duration_iter": 8,
                "multiplier": 10,
                "stim_duration_iter": 2,
                "total_stim_strength": 10,
                "sets_iter": 100
              }
            ]
          }
        ],
    }]
  }

  const get_input = () => {
    return Object.entries(cfg).map(([sid, attrs]) =>
      sid !== "cluster_dim" ? (
        <div
          key={sid}
          style={{ display: "flex", flexDirection: "column", gap: "4px" }}
        >
          <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>
            {sid} {attrs.description && <span title={attrs.description}>ℹ️</span>}
          </label>

          <Input
            disabled
            value={attrs.value}
            onValueChange={(val) => handleValueChange(sid, val)}
            size="sm"
          />

        </div>
      ) : (
        <XYZInput
          key={sid}
          value={{
            x: attrs.value[0],
            y: attrs.value[1],
            z: attrs.value[2],
          }}
          onChange={(newCoords) =>
            setCfg((prev) => ({
              ...prev,
              cluster_dim: {
                ...prev.cluster_dim,
                value: [newCoords.x, newCoords.y, newCoords.z],
              },
            }))
          }
        />
      )
    );
  };

  return (
    <Accordion selectionMode="multiple">
      <AccordionItem
        key={"pixelId"}
        aria-label={"pixelId"}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>WORLD CONFIG</span>
            {completed && <span>✅</span>}
          </div>
        } >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {get_input()}
          <Button
            color="primary"
            onPress={() => sendMessage({
                data: filter_cfg(),
                type: "world_cfg",
                timestamp: new Date().toISOString(),
              })}
            style={{ marginTop: "8px" }}>
            Confirm
          </Button>
            <Button
            color="primary"
            onPress={() => sendMessage({
                data: filter_cfg(),
                type: "world_cfg",
                timestamp: new Date().toISOString(),
              })}
            style={{ marginTop: "8px" }}>
            Confirm
          </Button>
        </div>
      </AccordionItem>

    </Accordion>

  );
};

export default ConfigAccordion;
