import {Accordion, AccordionItem} from "@heroui/react";
import {Button, Input} from "@heroui/react";
import {useState} from "react";

const filteredCfg = {
    sim_time_s: {
        value: 300,
        description:
            "Time in s(iterations) the simulation should run",
    },
    cluster_dim: {
        value: 64,
        description: "The 3 Dimensions of the simulation cluster.",
    },
    energy: {
        value: 99,
        description: "Energy to apply"
    },
    phase: {
        value: 2,
        description: "iter break & duration of stim"
    },
    particle: {
        value: "electron",
        description: "particle to apply stim to"
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
const ConfigAccordion = ({sendMessage}) => {
    const [completed, setCompleted] = useState(false);
    const [cfg, setCfg] = useState(filteredCfg);

    const handleValueChange = (sid, newValue) => {
        setCfg((prevCfg) => {
            let updatedCfg = {...prevCfg};
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
        maxValues.id = crypto.randomUUID().replace(/-/g, '');
        return maxValues;
    };

    const send = () => {
        sendMessage(
            {
                world_cfg: [filter_cfg()],
                type: "world_cfg",
                timestamp: new Date().toISOString(),
            }
        );
        setCompleted(true);
    }

    /*
    const handle_disabled = (sid) => {

        return disabled_key.includes(sid);
    };
     */

    const get_input = (sid, attrs) => {
        return (
            <div
                key={sid}
                style={{display: "flex", flexDirection: "column", gap: "4px"}}
            >
                <label style={{fontSize: "0.875rem", fontWeight: 500}}>
                    {sid} {attrs.description && <span title={attrs.description}>ℹ️</span>}
                </label>
                <Input
                    disabled={false} // handle_disabled(sid)
                    value={attrs.value}
                    onValueChange={(val) => handleValueChange(sid, val)}
                    size="sm"
                />
            </div>
        )
    }


    return (
        <Accordion selectionMode="multiple">
            <AccordionItem
                key={"worldConfig"}
                aria-label={"worldConfig"}
                title={
                    <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
                        <span>WORLD CONFIG</span>
                        {completed && <span>✅</span>}
                    </div>
                }>
                <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
                    {Object.entries(cfg).map(([sid, attrs]) => get_input(sid, attrs))}
                </div>
                <Button
                color="primary"
                onPress={() => send()}
                style={{marginTop: "8px"}}
            >
                Confirm
            </Button>
            </AccordionItem>


        </Accordion>
    );
};

export default ConfigAccordion;