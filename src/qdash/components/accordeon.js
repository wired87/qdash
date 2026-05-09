import { Accordion, AccordionItem, Button, Input, Select, SelectItem, Switch } from "@heroui/react";
import { useCallback, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useEnvStore } from "../env_store";
import { USER_ID_KEY, getSessionId } from "../auth";
import ParticleChoice from "./node_cfg/particle_choice_dd";
import { CheckCircle2, Info } from "lucide-react";

const filteredCfg = {
    id: {
        value: "Hi",
        description:
            "ID/name of the simulation cluster.",
    },
    sim_time: {
        value: 300,
        description:
            "Time in iterations the simulation should run",
    },
    amount_of_nodes: {
        value: 64,
        description: "Amount of nodes per Dimension of the simulation cluster.",
    },
    dims: {
        value: 3,
        description: "The room dimensions of the simulation cluster.",
    },
    distance: {
        value: 0,
        description: "Distance in nanometers (nm).",
        label: "distance (nm)",
    },
    gpu_processing: {
        value: false,
        description: "Enable GPU processing for this environment.",
        label: "gpu processing",
    },
    cloud_provider: {
        value: "gcp",
        description: "Select the cloud execution profile for this environment.",
        label: "cloud bar",
    },
};

const CLOUD_OPTIONS = [
    { key: "gcp", label: "GCP" },
    { key: "aws", label: "AWS" },
    { key: "az", label: "AZ" },
    { key: "cloud_heat", label: "Cloud & Heat" },
];

const getEngineBaseUrl = () => {
    const custom = process.env.REACT_APP_ENGINE_HTTP_BASE;
    if (custom) return custom.replace(/\/$/, "");
    return process.env.NODE_ENV === "production"
        ? "https://www.bestbrain.tech"
        : "http://127.0.0.1:8000";
};

const toEnvVarKey = (key) => `Q_ENV_${String(key).toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`;

const transformCfgToEnvVars = ({ envConfig, envId, sessionId, fields, methods }) => {
    const envVars = {
        Q_ENV_ID: envId,
        Q_SESSION_ID: sessionId || "default",
        Q_SELECTED_FIELDS: fields.join(","),
        Q_SELECTED_METHODS: methods.join(","),
    };

    Object.entries(envConfig || {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
            envVars[toEnvVarKey(key)] = value.join(",");
            return;
        }
        if (typeof value === "boolean") {
            envVars[toEnvVarKey(key)] = value ? "true" : "false";
            return;
        }
        if (typeof value === "object") {
            envVars[toEnvVarKey(key)] = JSON.stringify(value);
            return;
        }
        envVars[toEnvVarKey(key)] = String(value);
    });

    return envVars;
};

const ConfigAccordion = ({ sendMessage, initialValues, user, saveUserWorldConfig, saveUserSessionConfig, listenToUserWorldConfig, userProfile, shouldShowDefault }) => {
    const userFields = useSelector((state) => state.fields.userFields) || [];
    const userMethods = useSelector((state) => state.methods.userMethods) || [];
    const [completed, setCompleted] = useState(false);
    const [cfg, setCfg] = useState(filteredCfg);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedFieldIds, setSelectedFieldIds] = useState(new Set());
    const [selectedMethodIds, setSelectedMethodIds] = useState(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState("");

    // Initialize from props
    useEffect(() => {
        if (initialValues) {
            const fieldId = initialValues.field_id ?? initialValues.field ?? "";
            const fieldIdsFromInitial = Array.isArray(initialValues.field_ids)
                ? initialValues.field_ids
                : (Array.isArray(initialValues.fields) ? initialValues.fields : null);
            const methodsFromInitial = Array.isArray(initialValues.method_ids)
                ? initialValues.method_ids
                : (Array.isArray(initialValues.methods) ? initialValues.methods : null);

            if (fieldIdsFromInitial && fieldIdsFromInitial.length > 0) {
                setSelectedFieldIds(new Set(fieldIdsFromInitial.filter(Boolean)));
            } else if (fieldId) {
                setSelectedFieldIds(new Set([fieldId]));
            } else {
                setSelectedFieldIds(new Set());
            }

            if (methodsFromInitial && methodsFromInitial.length > 0) {
                setSelectedMethodIds(new Set(methodsFromInitial.filter(Boolean)));
            } else {
                setSelectedMethodIds(new Set());
            }

            if (Object.keys(initialValues).length > 0) {
                setCfg((prevCfg) => {
                    const updatedCfg = { ...prevCfg };
                    Object.entries(initialValues).forEach(([key, value]) => {
                        if (updatedCfg[key]) {
                            updatedCfg[key] = {
                                ...updatedCfg[key],
                                value: value
                            };
                        }
                    });
                    return updatedCfg;
                });
            } else {
                // Reset to defaults if empty object passed
                setCfg(filteredCfg);
                setCompleted(false);
            }
        }
    }, [initialValues]);

    // Load user config from Firebase
    useEffect(() => {
        if (user && user.uid && listenToUserWorldConfig) {
            const unsubscribe = listenToUserWorldConfig(user.uid, (data) => {
                if (data) {
                    setCfg((prevCfg) => {
                        const updatedCfg = { ...prevCfg };
                        Object.entries(data).forEach(([key, value]) => {
                            if (updatedCfg[key]) {
                                updatedCfg[key] = {
                                    ...updatedCfg[key],
                                    value: value
                                };
                            }
                        });
                        return updatedCfg;
                    });
                }
            });
            return () => unsubscribe();
        }
    }, [user, listenToUserWorldConfig]);

    // Listen for set_env response from WebSocket
    useEffect(() => {
        const handleSetEnvResponse = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "ENV_SET" || data.type === "SET_ENV_SUCCESS") {
                    console.log('✅ Environment configuration confirmed:', data.env_id);
                    setCompleted(true);
                } else if (data.type === "SET_ENV_ERROR") {
                    console.error('❌ Failed to set environment:', data.error);
                    alert(`Failed to configure world: ${data.error || 'Unknown error'}`);
                    setCompleted(false);
                }
            } catch (error) {
                // Ignore parse errors from non-JSON messages
            }
        };

        window.addEventListener('message', handleSetEnvResponse);
        return () => window.removeEventListener('message', handleSetEnvResponse);
    }, []);

    const handleValueChange = useCallback((sid, newValue) => {
        if (userProfile?.plan === 'free') {
            alert("Free tier: cfg file is not editable. Upgrade to Magician.");
            return;
        }

        setCfg((prevCfg) => {
            let updatedCfg = { ...prevCfg };
            if (updatedCfg[sid]) {
                let val = newValue;
                if (sid === 'distance') {
                    val = newValue === '' || isNaN(parseFloat(newValue)) ? 0 : parseFloat(newValue);
                } else if (!isNaN(parseFloat(newValue)) && sid !== 'email' && sid !== 'particle') {
                    val = parseFloat(newValue);
                }
                updatedCfg = {
                    ...updatedCfg,
                    [sid]: {
                        ...updatedCfg[sid],
                        value: val
                    },
                };
            }
            return updatedCfg;
        });
    }, []);

    const updateIsDropdownOpen = useCallback(() => {
        setIsDropdownOpen(!isDropdownOpen);
    }, [isDropdownOpen]);

    // Removed redundant updateSelectedTools function that was causing compilation error
    // Particle choice updates are handled directly via handleValueChange where needed

    const filter_cfg = () => {
        const maxValues = Object.fromEntries(
            Object.entries(cfg).map(([key, val]) => [key, val.value])
        );
        maxValues.id = crypto.randomUUID().replace(/-/g, '');
        if (maxValues.distance === '' || maxValues.distance == null || isNaN(Number(maxValues.distance))) {
            maxValues.distance = 0;
        }
        // maxValues.amount_of_nodes = maxValues.amount_of_nodes;
        // maxValues.sim_time = maxValues.sim_time;
        return maxValues;
    };

    const send = async () => {
        setIsSubmitting(true);
        setSubmitStatus("Transforming config...");

        // 1. Build local config payload
        const filteredConfig = filter_cfg();
        const userId = localStorage.getItem(USER_ID_KEY);
        const sessionId = getSessionId() || "default";
        const env_id = 'env_' + filteredConfig.id;

        const fields = Array.from(selectedFieldIds || []);
        const methods = Array.from(selectedMethodIds || []);

        const dataPayload = {
            env: {
                ...filteredConfig,
                id: env_id // Ensure ID is consistent
            },
            // Backwards-compatible primary field (first selection), plus full lists
            field: fields[0] || undefined,
            fields,
            methods,
        };

        try {
            // Keep local view in sync before post-processes
            useEnvStore.getState().clearEnvs();

            // 2. Send env config to engine transport
            setSubmitStatus("Submitting env config...");
            await sendMessage({
                type: "SET_ENV",
                data: dataPayload,
                auth: {
                    user_id: userId
                },
                timestamp: new Date().toISOString(),
            });

            // 3. Persist world cfg and session cfg in Firebase RTDB
            if (user && user.uid && saveUserWorldConfig) {
                const configValues = Object.fromEntries(
                    Object.entries(cfg).map(([key, val]) => [key, val.value])
                );
                configValues.env = env_id;
                configValues.fields = fields;
                configValues.methods = methods;
                configValues.session_id = sessionId;

                setSubmitStatus("Saving world config to Firebase...");
                await saveUserWorldConfig(user.uid, configValues);

                const envVars = transformCfgToEnvVars({
                    envConfig: dataPayload.env,
                    envId: env_id,
                    sessionId,
                    fields,
                    methods,
                });

                if (saveUserSessionConfig) {
                    setSubmitStatus("Saving session config to Firebase...");
                    await saveUserSessionConfig(user.uid, sessionId, env_id, {
                        env: dataPayload.env,
                        fields,
                        methods,
                        env_vars: envVars,
                        cloud_provider: dataPayload.env.cloud_provider || "gcp",
                        gpu_processing: !!dataPayload.env.gpu_processing,
                        updated_at: new Date().toISOString(),
                    });
                }

                // 4. Deploy process (currently only GCP)
                if ((dataPayload.env.cloud_provider || "gcp") === "gcp") {
                    const gpuEnabled = !!dataPayload.env.gpu_processing;
                    const resources = {
                        gpu_count: gpuEnabled ? 1 : 0,
                        cpu_cores: gpuEnabled ? 0 : 4,
                        disk_gb: 40,
                        ram_gb: 16,
                    };

                    const image = process.env.REACT_APP_GCP_ARTIFACT_IMAGE || "europe-west1-docker.pkg.dev/local-project/qdash/engine:latest";
                    const deployEndpoint = `${getEngineBaseUrl()}/engine/deploy-gcp-vm`;

                    setSubmitStatus("Deploying VM + Docker from GCP Artifact Registry...");
                    
                    // ===== GHOST MODE: Skip actual GCP deployment =====
                    const DEPLOY_GHOST_MODE = true; // Set to false to enable actual GCP deployment
                    if (DEPLOY_GHOST_MODE) {
                        console.debug(`[GHOST MODE] Deploy request skipped (ghosted)`, { env_id, cloud_provider: "gcp" });
                    } else {
                        // ===== END GHOST MODE =====
                        const deployRes = await fetch(deployEndpoint, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                user_id: userId,
                                session_id: sessionId,
                                env_id,
                                cloud_provider: "gcp",
                                docker: {
                                    image,
                                    env_vars: envVars,
                                },
                                resources,
                            }),
                        });

                        if (!deployRes.ok) {
                            const detail = await deployRes.text().catch(() => "");
                            throw new Error(`Deploy failed: HTTP ${deployRes.status}${detail ? ` - ${detail}` : ""}`);
                        }
                    }
                }
            }

            setCompleted(true);
            setSubmitStatus("Configuration saved and deployment triggered.");
        } catch (err) {
            console.error("Config submit/deploy failed:", err);
            setCompleted(false);
            setSubmitStatus(`Failed: ${err?.message || "unknown error"}`);
            alert(`Failed to confirm config: ${err?.message || "Unknown error"}`);
        } finally {
            setIsSubmitting(false);
        }
    }

    const validate_input = useCallback((key) => {
        if (key === "device") {
            return (
                <Select
                    selectedKeys={[String(cfg[key]?.value)]}
                    onChange={(e) => handleValueChange(key, parseInt(e.target.value))}
                    className="max-w-xs"
                    size="sm"
                    variant="bordered"
                    classNames={{
                        trigger: "bg-white dark:bg-slate-800",
                        value: "text-slate-800 dark:text-slate-200"
                    }}
                >
                    <SelectItem key="1" value={1}>CPU</SelectItem>
                    <SelectItem key="0" value={0}>GPU</SelectItem>
                </Select>
            );
        }
        if (key === "enable_sm" || key === "gpu_processing") {
            return (
                <Switch
                    aria-label={key === "gpu_processing" ? "Enable GPU Processing" : "Enable Standard Model"}
                    isSelected={cfg[key]?.value}
                    onValueChange={(isSelected) => handleValueChange(key, isSelected)}
                    size="sm"
                    color="primary"
                />
            );
        }
        if (key === "cloud_provider") {
            const selected = String(cfg[key]?.value || "gcp");
            return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CLOUD_OPTIONS.map((opt) => {
                        const active = selected === opt.key;
                        return (
                            <Button
                                key={opt.key}
                                size="sm"
                                variant={active ? "solid" : "bordered"}
                                color={active ? "primary" : "default"}
                                className="font-semibold tracking-wide"
                                onPress={() => handleValueChange(key, opt.key)}
                            >
                                {opt.label}
                            </Button>
                        );
                    })}
                </div>
            );
        }
        if (key !== "particle") {
            return (
                <Input
                    isDisabled={key === 'dims'}
                    type={key === 'distance' ? 'number' : 'text'}
                    value={String(cfg[key]?.value ?? (key === 'distance' ? 0 : ''))}
                    onValueChange={(val) => handleValueChange(key, val)}
                    size="sm"
                    variant="bordered"
                    isInvalid={!!cfg[key]?.error}
                    errorMessage={cfg[key]?.error}
                    classNames={{
                        input: "text-slate-800 dark:text-slate-200",
                        inputWrapper: "bg-white dark:bg-slate-800",
                    }}
                />
            )
        }
        return (
            <ParticleChoice
                fieldOptions={userFields.map(f => typeof f === 'string' ? f : (f?.id ?? f?.name ?? '')).filter(Boolean)}
                updateSelectedTools={(item) => handleValueChange("particle", item)}
                updateIsDropdownOpen={updateIsDropdownOpen}
                isDropdownOpen={isDropdownOpen}
            />
        )
    }, [cfg, userFields, updateIsDropdownOpen, isDropdownOpen, handleValueChange])

    const get_input = (sid, attrs) => {
        return (
            <div
                key={sid}
                className="flex flex-col gap-1.5"
            >
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                    {(attrs.label || sid.replace(/_/g, ' '))}
                    {attrs.description && (
                        <div className="group relative">
                            <Info size={14} className="cursor-help text-slate-400 hover:text-blue-500 transition-colors" />
                            <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                {attrs.description}
                            </div>
                        </div>
                    )}
                </label>
                {validate_input(sid)}
            </div>
        )
    }


    return (
        <Accordion
            selectionMode="multiple"
            defaultExpandedKeys={shouldShowDefault ? ["worldConfig"] : []}
            selectedKeys={shouldShowDefault ? ["worldConfig"] : undefined}
            className="px-0"
            itemClasses={{
                base: "group-[.is-splitted]:px-4 group-[.is-splitted]:bg-content1 group-[.is-splitted]:shadow-medium group-[.is-splitted]:max-w-[300px] py-0",
                title: "font-normal text-medium",
                trigger: "px-2 py-0 data-[hover=true]:bg-default-100 rounded-lg h-14 flex items-center",
                indicator: "text-medium",
                content: "text-small px-2",
            }}
        >
            <AccordionItem
                key={"worldConfig"}
                aria-label={"worldConfig"}
                title={
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-100">WORLD CONFIG</span>
                        {completed && <CheckCircle2 size={18} className="text-green-500" />}
                    </div>
                }
                subtitle={
                    <span className="text-xs text-slate-500">
                        {completed ? "Configuration Applied" : "Pending Configuration"}
                    </span>
                }
            >
                <div className="flex flex-col gap-4 py-2">
                    {/* Methods dropdown: user methods from Redux */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                            Methods
                        </label>
                        <Select
                            selectionMode="multiple"
                            placeholder="Select methods"
                            selectedKeys={selectedMethodIds}
                            onSelectionChange={(keys) => {
                                if (keys === 'all') {
                                    const allIds = userMethods
                                        .map((m) => (typeof m === 'string' ? m : m?.id))
                                        .filter(Boolean);
                                    setSelectedMethodIds(new Set(allIds));
                                } else {
                                    setSelectedMethodIds(new Set(keys));
                                }
                            }}
                            className="max-w-full"
                            size="sm"
                            variant="bordered"
                            classNames={{
                                trigger: "bg-white dark:bg-slate-800",
                                value: "text-slate-800 dark:text-slate-200"
                            }}
                        >
                            {userMethods.map((m) => {
                                const id = typeof m === "string" ? m : m?.id;
                                const label = typeof m === "string" ? m : (m?.description ?? m?.id ?? id);
                                return id ? <SelectItem key={id} textValue={String(label)}>{String(label)}</SelectItem> : null;
                            })}
                        </Select>
                    </div>

                    {/* Fields dropdown: user fields from Redux (multi-select) */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                            Fields
                        </label>
                        <Select
                            selectionMode="multiple"
                            placeholder="Select fields"
                            selectedKeys={selectedFieldIds}
                            onSelectionChange={(keys) => {
                                if (keys === 'all') {
                                    const allIds = userFields
                                        .map((f) => (typeof f === 'string' ? f : f?.id))
                                        .filter(Boolean);
                                    setSelectedFieldIds(new Set(allIds));
                                } else {
                                    setSelectedFieldIds(new Set(keys));
                                }
                            }}
                            className="max-w-full"
                            size="sm"
                            variant="bordered"
                            classNames={{
                                trigger: "bg-white dark:bg-slate-800",
                                value: "text-slate-800 dark:text-slate-200"
                            }}
                        >
                            {userFields.map((f) => {
                                const id = typeof f === "string" ? f : f?.id;
                                const label = typeof f === "string" ? f : (f?.name ?? f?.id ?? id);
                                return id ? <SelectItem key={id} textValue={String(label)}>{String(label)}</SelectItem> : null;
                            })}
                        </Select>
                    </div>

                    {/* Live JSON preview of env + selected fields/methods */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 uppercase tracking-wider">
                            Live Env JSON
                        </label>
                        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-950/90 text-emerald-300 text-[11px] font-mono p-3 max-h-40 overflow-auto">
                            <pre className="whitespace-pre-wrap break-all">
{JSON.stringify({
    env: Object.fromEntries(Object.entries(cfg).map(([key, val]) => [key, val.value])),
    fields: Array.from(selectedFieldIds || []),
    methods: Array.from(selectedMethodIds || []),
}, null, 2)}
                            </pre>
                        </div>
                    </div>

                    {Object.entries(cfg).map(([sid, attrs]) => get_input(sid, attrs))}
                </div>
                <Button
                    color="primary"
                    variant="shadow"
                    onPress={() => send()}
                    className="mt-6 mb-2 w-full font-semibold"
                    isDisabled={isSubmitting}
                    endContent={completed ? <CheckCircle2 size={18} /> : null}
                >
                    {isSubmitting ? "Processing..." : (completed ? "Update Configuration" : "Confirm Configuration")}
                </Button>
                {submitStatus && (
                    <p className="mb-6 text-xs text-slate-500 dark:text-slate-400">{submitStatus}</p>
                )}
            </AccordionItem>
        </Accordion>
    );
};

export default ConfigAccordion;