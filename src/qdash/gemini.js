import { GoogleGenerativeAI } from "@google/generative-ai";

// Get API key from environment variable
// Try both REACT_APP_CLIENT_KEY_GEMINI_API_KEY (for CRA) and GEMINI_API_KEY (custom setup)
const API_KEY = process.env.REACT_APP_CLIENT_KEY_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

console.log("🔍 Checking Gemini API configuration...");
console.log("   REACT_APP_CLIENT_KEY_GEMINI_API_KEY:", process.env.REACT_APP_CLIENT_KEY_GEMINI_API_KEY ? "✅ Found" : "❌ Not found");

if (!API_KEY) {
  console.error("❌ No Gemini API key found!");
  console.error("📝 To fix this:");
  console.error("   1. Edit .env file in project root");
  console.error("   2. Add ONE of these lines:");
  console.error("      REACT_APP_CLIENT_KEY_GEMINI_API_KEY=your_actual_key  (recommended for Create React App)");
  console.error("      OR");
  console.error("      GEMINI_API_KEY=your_actual_key  (if using custom webpack config)");
  console.error("   3. Get key from: https://makersuite.google.com/app/apikey");
  console.error("   4. IMPORTANT: Restart the dev server (Ctrl+C then npm start)");
  console.error("   5. See SETUP_GEMINI.md for detailed instructions");
} else {
  console.log("✅ Gemini API key loaded successfully");
  console.log(`   Key length: ${API_KEY.length} characters`);
  console.log(`   Source: ${process.env.REACT_APP_CLIENT_KEY_GEMINI_API_KEY ? 'REACT_APP_CLIENT_KEY_GEMINI_API_KEY' : 'GEMINI_API_KEY'}`);
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Lazy initialization of model and chat
let model = null;
let chat = null;

const initializeChat = () => {
  if (!genAI) {
    throw new Error("Gemini API is not initialized. Please set REACT_APP_CLIENT_KEY_GEMINI_API_KEY in your .env file.");
  }

  if (!model) {
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  if (!chat) {
    chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{
            text: `You are an expert assistant for core, an Advanced Simulation & Data Visualization Platform.
Your name is 'Q'. You respond concisely and professionally.

KNOWLEDGE BASE:
1. Navigation:
   - Terminal: Allows interaction via natural language or commands.
   - Dashboard: Real-time data from nodes. Click nodes to inspect.
2. Visualization:
   - 4D Data Visualization Table.
   - 3D Network View (Cluster).
3. Configuration:
   - Node Config: Upload/modify node settings.
   - Global Settings: CPU, GPU, RAM, Disk, Nodes.
4. Features:
   - Real-time logs.
   - File uploader (Bucket).
   - AI Assistant (You).

COMMANDS:
- show_envs: Open Dashboard.
- set_config: Open World Config.
- watch_data: Open Data View.
- upload_ncfg: Open Node Config.
- show_logs: Open Logs.
- show_cluster: Open Cluster Visualization.
- upload_files: Open File Uploader.
- start_sim: Start simulation.
- get_cluster_data: Get cluster data.
- research: Perform research.

Use this knowledge to answer user questions about the website and its features.` }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I am Q, your expert assistant for core. I have access to the knowledge base and am ready to assist you with simulations, visualization, configuration, and any questions about the platform." }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 200,
      },
    });
  }

  return chat;
};

const getModel = () => {
  if (!genAI) {
    throw new Error("Gemini API is not initialized. Please set REACT_APP_CLIENT_KEY_GEMINI_API_KEY in your .env file.");
  }

  if (!model) {
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  return model;
};

/**
 * Sends a message to the Gemini Pro model and streams the response.
 * @param {string} message The user's input message.
 * @param {(chunk: string) => void} onChunkReceived Callback to handle streamed response chunks.
 * @returns {Promise<void>} A promise that resolves when the streaming is complete.
 */
export const classifyAndRespond = async (message, onChunkReceived) => {
  try {
    if (!API_KEY) {
      throw new Error("API key not configured");
    }

    const chatInstance = initializeChat();
    const result = await chatInstance.sendMessageStream(message);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      onChunkReceived(chunkText);
    }
  } catch (error) {
    console.error("Error communicating with Gemini API:", error);
    onChunkReceived("I'm sorry, but I'm having trouble connecting to my core functions right now. Please ensure REACT_APP_CLIENT_KEY_GEMINI_API_KEY is set in your .env file.");
  }
};

/**
 * Analyzes the user's request to extract intent and entities.
 * @param {string} message The user's input message.
 * @param {string[]} categories The list of valid categories.
 * @returns {Promise<{intent: string, entities: Object, response?: string}>} The analysis result.
 */
export const analyzeCommand = async (message, categories) => {
  try {
    if (!API_KEY) {
      throw new Error("API key not configured");
    }

    const prompt = `
      You are a system command analyzer for a simulation dashboard.
      Your goal is to extract the user's intent and any relevant entities (parameters) from their request.

      VALID INTENTS:
      ${categories.map(c => `"${c}"`).join(", ")}

      INSTRUCTIONS:
      1. Analyze the "User Request" below.
      2. Determine the most appropriate "intent" from the list above. If none match clearly, use "unknown".
         - "start_sim": Start a simulation. Entities: "env_id" (optional).
         - "get_cluster_data": Get cluster data. Entities: "env_id" (optional).
         - "show_envs": Show environments or dashboard.
         - "set_config": Open configuration settings. Entities: "cpu" (number), "gpu" (number), "ram" (number), "disk" (number), "nodes" (number).
         - "watch_data": Open data view.
         - "upload_ncfg": Open node config uploader.
         - "show_logs": Open logs sidebar.
         - "show_cluster": Open cluster visualization.
         - "upload_files": Open file uploader.
         - "research": Web search or research questions. Entities: "query" (string).
         - "upgrade_plan": User wants to upgrade their plan or subscription.
         - "downgrade_plan": User wants to downgrade their plan or subscription.
         - "open_camera": User wants to open the camera or take a photo.
         - "subscribe_updates": User wants to receive email updates about the engine construction. Entities: "email" (string).
         - "session_cfg": Modify session configuration (add/remove items).
            - Entities needed:
              - "operation": "add" (for link/add/include) or "remove" (for unlink/delete/remove).
              - "type": "env" or "module" (infer from context e.g. "grid"->env, "script"->module).
              - "target": Name/ID of the item (e.g. "Abc", "HeatModule").
              - "session_target": "latest" (default if not specified) or specific session ID.
         - "chat": General conversation that doesn't fit a specific command.

      3. Extract any relevant "entities" mentioned in the request.
         - Example: "set cpu to 4 and gpu to 2" -> entities: { "cpu": 4, "gpu": 2 }
         - Example: "start sim for env 1" -> entities: { "env_id": "1" }
         - Example: "add env Abc to the session" -> entities: { "operation": "add", "type": "env", "target": "Abc", "session_target": "latest" }

      4. Return the result as a strictly valid JSON object. Do not include markdown formatting (like \`\`\`json).
      
      JSON STRUCTURE:
      {
        "intent": "string",
        "entities": { ... }
      }

      User Request: "${message}"
    `;

    const modelInstance = getModel();
    const result = await modelInstance.generateContent(prompt);
    const response = result.response;
    let text = response.text().trim();

    // Clean up potential markdown code blocks if the model adds them
    if (text.startsWith('```json')) {
      text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const data = JSON.parse(text);

    // Validate intent
    if (!categories.includes(data.intent) && data.intent !== "chat") {
      data.intent = "unknown";
    }

    return data;
  } catch (error) {
    console.error("Error analyzing request:", error);
    return { intent: "unknown", entities: {} };
  }
};

export const generateSimpleResponse = async (prompt) => {
  try {
    const modelInstance = getModel();
    const result = await modelInstance.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    return "⚠️ Error generating response.";
  }
};
