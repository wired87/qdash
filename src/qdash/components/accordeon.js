import { Accordion, AccordionItem } from "@heroui/react";
import { Button, Input } from "@heroui/react";
import {useCallback, useState} from "react";
import XYZInput from "./dim_component";

const filteredCfg = {

  sim_time_s: {
    max_value: 300,
    description:
      "no matter how long, everything gets split into sub blocks for easier handling",
  },
  cluster_dim: {
    max_value: [2, 2, 2],
    description: "The spatial dimension of the simulation cluster.",
  },
  device: {
    max_value: "cpu",
    description: "The device to use for the simulation (CPU or GPU).",
  },
  num_cores: {
    max_value: 2,
    description: "CPU-Kerne",
  },
  num_gpus: {
    max_value: 0,
    description: "GPU-Anzahl (falls device=gpu)",
  },
  memory_limit_gb: {
    max_value: 8,
    description: "max. RAM für die Simulation in Gigabytes",
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
            max_value: isNaN(parseFloat(newValue))
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
      Object.entries(cfg).map(([key, val]) => [key, val.max_value])
    );
    return maxValues
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
            value={attrs.max_value}
            onValueChange={(val) => handleValueChange(sid, val)}
            size="sm"
          />

        </div>
      ) : (
        <XYZInput
          key={sid}
          value={{
            x: attrs.max_value[0],
            y: attrs.max_value[1],
            z: attrs.max_value[2],
          }}
          onChange={(newCoords) =>
            setCfg((prev) => ({
              ...prev,
              cluster_dim: {
                ...prev.cluster_dim,
                max_value: [newCoords.x, newCoords.y, newCoords.z],
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
                world_cfg: JSON.stringify(filter_cfg()),
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
