import React, { useEffect, useState } from "react";
import { Button, Card, CardBody } from "@heroui/react";
import { ChevronDown, Plus, Trash2, Edit } from "lucide-react";
import SliderPanel from "../common/SliderPanel";

const MOCK_CFG_SCHEMA = {
  env_id: "",
  cluster_cfg: {
    sim_time: 300,
    amount_of_nodes: [2, 2, 2],
    device: "cpu",
    num_cores: 2,
    num_gpus: 0,
    memory_limit_gb: 8
  },
  phase_cfg: [
    {
      phase_id: "",
      data: {
        param1: 1,
        param2: "value"
      }
    }
  ],
  visual_data: { points: [], output: [] }
};

const NCfgCreator = ({ sendMessage, isOpen, onToggle, initialValues }) => {
  const [formBlocks, setFormBlocks] = useState([]);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(null);

  useEffect(() => {
    const defaultBlock = {
      block_data: { ...MOCK_CFG_SCHEMA },
      phases: [{ ...MOCK_CFG_SCHEMA.phase_cfg[0] }],
      visual_data: { points: [], output: [] }
    };

    if (initialValues && Object.keys(initialValues).length > 0) {
      if (initialValues.cpu) defaultBlock.block_data.cluster_cfg.num_cores = initialValues.cpu;
      if (initialValues.gpu) defaultBlock.block_data.cluster_cfg.num_gpus = initialValues.gpu;
      if (initialValues.ram) defaultBlock.block_data.cluster_cfg.memory_limit_gb = initialValues.ram;
      if (initialValues.device) defaultBlock.block_data.cluster_cfg.device = initialValues.device;
    }

    setFormBlocks([defaultBlock]);
  }, [initialValues]);

  const handleAddBlock = () => {
    const newBlock = {
      block_data: { ...MOCK_CFG_SCHEMA },
      phases: [{ ...MOCK_CFG_SCHEMA.phase_cfg[0] }],
      visual_data: { points: [], output: [] }
    };
    setFormBlocks([...formBlocks, newBlock]);
  };

  return (
    <SliderPanel
      isOpen={isOpen}
      onClose={onToggle}
      title="Node Configuration"
      subtitle="Manage simulation nodes and clusters"
      width="450px"
    >
      {selectedBlockIndex !== null ? (
        <div className="space-y-4">
          <Button
            variant="flat"
            color="default"
            size="sm"
            onPress={() => setSelectedBlockIndex(null)}
            startContent={<ChevronDown className="rotate-90" size={16} />}
          >
            Back to List
          </Button>

          <Card className="bg-white dark:bg-slate-900">
            <CardBody className="p-4">
              <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100">
                Editing Block {selectedBlockIndex + 1}
              </h3>
              <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-sm text-center">
                Visual Editor Placeholder
              </div>
            </CardBody>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            {formBlocks.map((block, index) => (
              <Card
                key={index}
                className="bg-white dark:bg-slate-900 transition-shadow"
              >
                <CardBody className="p-4 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">Config Block</h3>
                      <p className="text-xs text-slate-500">
                        {block.block_data.cluster_cfg.device} • {block.block_data.cluster_cfg.num_cores} Cores
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="primary"
                      onPress={() => setSelectedBlockIndex(index)}
                    >
                      <Edit size={18} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          <Button
            className="w-full font-semibold"
            color="primary"
            variant="shadow"
            startContent={<Plus size={18} />}
            onPress={handleAddBlock}
          >
            Add Configuration Block
          </Button>
        </div>
      )}
    </SliderPanel>
  );
};

export default NCfgCreator;

