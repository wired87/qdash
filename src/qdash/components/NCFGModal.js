import React, { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Divider } from "@heroui/react";
import { Plus, Trash2, Save } from "lucide-react";
import { useNCFGStore } from "../ncfg_store";

export const NCFGModal = ({ isOpen, onClose, nodeId, pos }) => {
    const { setGridNCFG } = useNCFGStore();
    const [timeSteps, setTimeSteps] = useState([0]);
    const [strengths, setStrengths] = useState([1.0]);

    if (!nodeId || !pos) return null;

    const handleSave = () => {
        setGridNCFG(nodeId, pos, timeSteps, strengths);
        onClose();
    };

    const addEntry = () => {
        setTimeSteps([...timeSteps, (timeSteps[timeSteps.length - 1] || 0) + 10]);
        setStrengths([...strengths, 1.0]);
    };

    const removeEntry = (index) => {
        setTimeSteps(timeSteps.filter((_, i) => i !== index));
        setStrengths(strengths.filter((_, i) => i !== index));
    };

    const updateEntry = (index, field, value) => {
        const val = parseFloat(value) || 0;
        if (field === 'time') {
            const newSteps = [...timeSteps];
            newSteps[index] = val;
            setTimeSteps(newSteps);
        } else {
            const newStrengths = [...strengths];
            newStrengths[index] = val;
            setStrengths(newStrengths);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={onClose}
            size="2xl"
            classNames={{
                base: "bg-slate-900 border border-slate-800 text-white",
                header: "border-b border-slate-800",
                footer: "border-t border-slate-800"
            }}
        >
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            NCFG Configuration
                            <span className="text-xs text-slate-400 font-normal">
                                Node: {nodeId} | Pos: {pos.x.toFixed(1)}, {pos.y.toFixed(1)}, {pos.z.toFixed(1)}
                            </span>
                        </ModalHeader>
                        <ModalBody>
                            <div className="space-y-4 py-2">
                                <div className="grid grid-cols-12 gap-4 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <div className="col-span-5">Time Step (s)</div>
                                    <div className="col-span-5">Strength</div>
                                    <div className="col-span-2 text-center">Action</div>
                                </div>

                                <Divider className="bg-slate-800" />

                                <div className="max-h-[300px] overflow-y-auto space-y-2 px-2 custom-scrollbar">
                                    {timeSteps.map((step, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-4 items-center animate-in fade-in slide-in-from-left-2 transition-all">
                                            <div className="col-span-5">
                                                <Input
                                                    type="number"
                                                    value={step}
                                                    onChange={(e) => updateEntry(index, 'time', e.target.value)}
                                                    variant="bordered"
                                                    size="xs"
                                                    classNames={{ input: "text-white", inputWrapper: "border-slate-700 focus-within:border-blue-500" }}
                                                />
                                            </div>
                                            <div className="col-span-5">
                                                <Input
                                                    type="number"
                                                    value={strengths[index]}
                                                    onChange={(e) => updateEntry(index, 'strength', e.target.value)}
                                                    variant="bordered"
                                                    size="xs"
                                                    classNames={{ input: "text-white", inputWrapper: "border-slate-700 focus-within:border-blue-500" }}
                                                />
                                            </div>
                                            <div className="col-span-2 flex justify-center">
                                                <Button
                                                    isIconOnly
                                                    color="danger"
                                                    variant="light"
                                                    size="xs"
                                                    onPress={() => removeEntry(index)}
                                                    className="hover:bg-red-500/10"
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Button
                                    fullWidth
                                    variant="flat"
                                    color="primary"
                                    startContent={<Plus size={18} />}
                                    onPress={addEntry}
                                    className="bg-blue-600/10 text-blue-400 border border-blue-600/20 hover:bg-blue-600/20"
                                >
                                    Add Time Step
                                </Button>
                            </div>
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                onPress={handleSave}
                                startContent={<Save size={18} />}
                                className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 font-bold"
                            >
                                Save Configuration
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    );
};
