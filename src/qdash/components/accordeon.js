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
  const [completed, setCompleted] = useState(false);
  const [electronCompleted, setElectronCompleted] = useState(false);
  const [cfg, setCfg] = useState(filteredCfg);
  const [blocks, setBlocks] = useState([]);
  const [electronId, setElectronId] = useState("ELECTRON_px_0");

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
    return maxValues;
  };
  // Function to add a new block
  const addBlock = () => {
    const newBlock = {
      block_break_duration_iters: 5,
      id: `something${blocks.length + 1}`,
      break_duration_iter: 8,
      multiplier: 10,
      stim_duration_iter: 2,
      total_stim_strength: 10,
      sets_iter: 100,
    };
    setBlocks([...blocks, newBlock]);
  };

  // Function to delete a block
  const deleteBlock = (blockIndex) => {
    setBlocks(blocks.filter((_, index) => index !== blockIndex));
  };

  // Function to update block field values
  const updateBlockField = (blockIndex, field, value) => {
    setBlocks(blocks.map((block, index) => {
      if (index === blockIndex) {
        return {
          ...block,
          [field]: isNaN(parseFloat(value)) ? value : parseFloat(value),
        };
      }
      return block;
    }));
  };
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
  // Function to render a single block
  const renderBlock = (block, index) => (
    <div
      key={index}
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "12px",
        backgroundColor: "#f9f9f9",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
        <h4 style={{ margin: 0 }}>Block {index + 1}</h4>
        <Button
          size="sm"
          color="danger"
          variant="flat"
          onPress={() => deleteBlock(index)}
        >
          Delete Block
        </Button>
      </div>
      
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "1fr 1fr", 
        gap: "10px",
        width: "100%",
        boxSizing: "border-box",
      }}>
        <div style={{ minWidth: 0, overflow: "hidden" }}>
          <label style={{ fontSize: "0.875rem", fontWeight: 500, display: "block", marginBottom: "4px" }}>
            id
          </label>
          <Input
            value={block.id}
            onValueChange={(val) => updateBlockField(index, 'id', val)}
            size="sm"
            style={{ width: "100%" }}
          />
        </div>        
        <div style={{ minWidth: 0, overflow: "hidden" }}>
          <label style={{ fontSize: "0.875rem", fontWeight: 500, display: "block", marginBottom: "4px" }}>
            block_break_duration_iters
          </label>
          <Input
            value={block.block_break_duration_iters}
            onValueChange={(val) => updateBlockField(index, 'block_break_duration_iters', val)}
            size="sm"
            type="number"
            style={{ width: "100%" }}
          />
        </div>
        
        <div style={{ minWidth: 0, overflow: "hidden" }}>
          <label style={{ fontSize: "0.875rem", fontWeight: 500, display: "block", marginBottom: "4px" }}>
            break_duration_iter
          </label>
          <Input
            value={block.break_duration_iter}
            onValueChange={(val) => updateBlockField(index, 'break_duration_iter', val)}
            size="sm"
            type="number"
            style={{ width: "100%" }}
          />
        </div>
        
        <div style={{ minWidth: 0, overflow: "hidden" }}>
          <label style={{ fontSize: "0.875rem", fontWeight: 500, display: "block", marginBottom: "4px" }}>
            multiplier
          </label>
          <Input
            value={block.multiplier}
            onValueChange={(val) => updateBlockField(index, 'multiplier', val)}
            size="sm"
            type="number"
            style={{ width: "100%" }}
          />
        </div>        
        <div style={{ minWidth: 0, overflow: "hidden" }}>
          <label style={{ fontSize: "0.875rem", fontWeight: 500, display: "block", marginBottom: "4px" }}>
            stim_duration_iter
          </label>
          <Input
            value={block.stim_duration_iter}
            onValueChange={(val) => updateBlockField(index, 'stim_duration_iter', val)}
            size="sm"
            type="number"
            style={{ width: "100%" }}
          />
        </div>
        
        <div style={{ minWidth: 0, overflow: "hidden" }}>
          <label style={{ fontSize: "0.875rem", fontWeight: 500, display: "block", marginBottom: "4px" }}>
            total_stim_strength
          </label>
          <Input
            value={block.total_stim_strength}
            onValueChange={(val) => updateBlockField(index, 'total_stim_strength', val)}
            size="sm"
            type="number"
            style={{ width: "100%" }}
          />
        </div>
        
        <div style={{ minWidth: 0, overflow: "hidden" }}>
          <label style={{ fontSize: "0.875rem", fontWeight: 500, display: "block", marginBottom: "4px" }}>
            sets_iter
          </label>
          <Input
            value={block.sets_iter}
            onValueChange={(val) => updateBlockField(index, 'sets_iter', val)}
            size="sm"
            type="number"
            style={{ width: "100%" }}
          />
        </div>
      </div>
    </div>
  );
  // Function to send electron configuration
  const sendElectronMessage = () => {
    const electronData = {
      id: electronId,
      blocks: blocks,
      type: "electron_cfg",
      timestamp: new Date().toISOString(),
    };
    sendMessage(electronData);
    setElectronCompleted(true);
  };

  return (
    <Accordion selectionMode="multiple">
      <AccordionItem
        key={"worldConfig"}
        aria-label={"worldConfig"}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>WORLD CONFIG</span>
            {completed && <span>✅</span>}
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {get_input()}
          <Button
            color="primary"
            onPress={() => {
              sendMessage({
                world_cfg: JSON.stringify(filter_cfg()),
                type: "world_cfg",
                timestamp: new Date().toISOString(),
              });
              setCompleted(true);
            }}
            style={{ marginTop: "8px" }}
          >
            Confirm
          </Button>
        </div>
      </AccordionItem>
      <AccordionItem
        key={"electronConfig"}
        aria-label={"electronConfig"}
        title={
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>+ BLOCK</span>
            {electronCompleted && <span>✅</span>}
          </div>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>
              Electron ID
            </label>
            <Input
              value={electronId}
              onValueChange={setElectronId}
              size="sm"
              placeholder="Enter electron ID"
            />
          </div>
          
          {/* Render all blocks */}
          {blocks.map((block, index) => renderBlock(block, index))}
          
          {/* Add Block Button */}
          <Button
            color="secondary"
            onPress={addBlock}
            style={{ width: "100%" }}
          >
            + Add New Block
          </Button>
          
          {/* Confirm button for electron config */}
          {blocks.length > 0 && (
            <Button
              color="primary"
              onPress={sendElectronMessage}
              style={{ marginTop: "8px" }}
            >
              Confirm Electron Config
            </Button>
          )}
        </div>
      </AccordionItem>
    </Accordion>
  );
};

export default ConfigAccordion;