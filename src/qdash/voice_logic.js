import { pipeline, env } from '@xenova/transformers';

// Configuration for local-only environment if needed
env.allowLocalModels = false; // Allow downloading from hub as we don't have local copies
env.useBrowserCache = true;

const COMMANDS = [
    { text: "show dashboard", intent: "show_envs" },
    { text: "open dashboard", intent: "show_envs" },
    { text: "show environments", intent: "show_envs" },
    { text: "open world config", intent: "set_config" },
    { text: "configure world", intent: "set_config" },
    { text: "open settings", intent: "set_config" },
    { text: "watch data", intent: "watch_data" },
    { text: "view data", intent: "watch_data" },
    { text: "open statistics", intent: "watch_data" },
    { text: "upload node config", intent: "upload_ncfg" },
    { text: "configure nodes", intent: "upload_ncfg" },
    { text: "open logs", intent: "show_logs" },
    { text: "show logs", intent: "show_logs" },
    { text: "view logs", intent: "show_logs" },
    { text: "show cluster", intent: "show_cluster" },
    { text: "open cluster view", intent: "show_cluster" },
    { text: "view cluster", intent: "show_cluster" },
    { text: "upload files", intent: "upload_files" },
    { text: "open bucket", intent: "upload_files" },
    { text: "open camera", intent: "open_camera" },
    { text: "take photo", intent: "open_camera" },
    { text: "start simulation", intent: "start_sim" },
    { text: "run simulation", intent: "start_sim" }
];

let embedder = null;
let commandEmbeddings = [];
let isLoading = false;

export const initializeVoice = async () => {
    if (embedder || isLoading) return;
    isLoading = true;
    console.log("🎙️ Initializing local embedding model...");
    try {
        // Using a tiny model for speed/latency
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log("🎙️ Model loaded. Pre-embedding commands...");

        for (const cmd of COMMANDS) {
            const output = await embedder(cmd.text, { pooling: 'mean', normalize: true });
            commandEmbeddings.push({
                intent: cmd.intent,
                embedding: Array.from(output.data)
            });
        }
        console.log("🎙️ Voice control ready.");
    } catch (error) {
        console.error("🎙️ Failed to initialize voice control model:", error);
    } finally {
        isLoading = false;
    }
};

export const processVoiceInput = async (text) => {
    if (!embedder) {
        console.warn("🎙️ Embedder not ready. Falling back to simple matching.");
        return simpleMatch(text);
    }

    try {
        const output = await embedder(text, { pooling: 'mean', normalize: true });
        const inputEmbedding = Array.from(output.data);

        let bestMatch = null;
        let highestScore = -1;

        for (const cmd of commandEmbeddings) {
            const score = cosineSimilarity(inputEmbedding, cmd.embedding);
            if (score > highestScore) {
                highestScore = score;
                bestMatch = cmd;
            }
        }

        return { ...bestMatch, score: highestScore };
    } catch (error) {
        console.error("🎙️ Error processing voice input:", error);
        return simpleMatch(text);
    }
};

// Fallback for extreme low latency or if model fails
function simpleMatch(text) {
    const tokens = text.toLowerCase().split(/\s+/);
    let bestMatch = null;
    let highestScore = 0;

    for (const cmd of COMMANDS) {
        const cmdTokens = cmd.text.toLowerCase().split(/\s+/);
        let intersection = tokens.filter(x => cmdTokens.includes(x));
        let score = intersection.length / Math.max(tokens.length, cmdTokens.length);

        if (score > highestScore) {
            highestScore = score;
            bestMatch = cmd;
        }
    }

    return { ...bestMatch, score: highestScore };
}

function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
