import { useState, useEffect, useRef, useCallback } from "react";
import {USER_ID_KEY} from "./auth";




const handleDownload = (data) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "data.json"; // Dateiname
  link.click();

  URL.revokeObjectURL(url); // Speicher freigeben
};

const _useWebSocket = (
  updateCreds,
  updateDataset,
  addEnvs,
  updateGraph,
) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [deactivate, setDeactivate] = useState(false);

  // useRef, um die WebSocket-Instanz zu speichern, ohne Re-Renders auszulösen
  const ws = useRef(null);


    const get_ws_endpoint = () => {
        const userId = localStorage.getItem(USER_ID_KEY)
        const quey_str = `?user_id=${userId}&mode=demo`;

        const WS_URL = `wss://www.bestbrain.tech/run/${quey_str}`;
        const WS_URL_LOCAL = `ws://127.0.0.1:8000/run/${quey_str}`;

        return WS_URL
  }


  // useCallback, um die send-Funktion zu memoizen
  const sendMessage = useCallback((message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
      console.log("Send message:", message);
    } else {
      console.warn("WebSocket ist nicht verbunden oder bereit.");
    }
  }, []);

  const handleWebSocketMessage = (message) => {
    if (message.type === "world_content") {
      // receive all world objects to render in dashboard
      addEnvs(message.data.envs)
      updateGraph(message.data.graph)
    } else if (message.type === "creds") {
      //  iun demo receive entire G at once
      if (message.data) {
        updateCreds(message.data);
      }
    } else if (message.type === "dataset") {
      //  iun demo receive entire G at once
      if (message.data) updateDataset(message.data);
    } else if (message.type === "data_response") {
      handleDownload(message.data);
    } else if (message.type === "finished") {
      setDeactivate(true);
    } else {
      // Für alle anderen unbekannten Nachrichtentypen
      console.log("Unbekannte WebSocket-Nachricht:", message);
    }
  };
  // Tom
  useEffect(() => {
    // Schließe bestehende Verbindung, falls vorhanden
    // Neue WebSocket-Verbindung aufbauen
    ws.current = new WebSocket(get_ws_endpoint());

    // Event-Handler@import "tailwindcss/base";
    //
    // @import "tailwindcss/components";
    //
    // @import "tailwindcss/utilities";
    ws.current.onopen = () => {
      console.log("WebSocket verbunden");
      setIsConnected(true);
      setError(null); // Fehler zurücksetzen
    };

    ws.current.onmessage = (event) => {
      try {
        const receivedMessage = JSON.parse(event.data); // JSON-Nachricht parsen
        console.log("receivedMessage", receivedMessage);
        handleWebSocketMessage(receivedMessage);
        //
      } catch (e) {
        console.log("Fehler beim Parsen der WebSocket-Nachricht:", e);
      }
    };

    ws.current.onclose = (event) => {
      console.log("WebSocket getrennt", event.code, event.reason);
      setIsConnected(false);
      // Optional: Logik zum Wiederverbinden hier hinzufügen
    };

    ws.current.onerror = (event) => {
      console.log("WebSocket Fehler:", event);
      setError(event);
      setIsConnected(false);
    };

    // Cleanup-Funktion: Wird ausgeführt, wenn die Komponente unmontiert wird
    // oder wenn sich die URL ändert (um alte Verbindungen zu schließen)
    return () => {
      if (ws.current) {
      }
    };
  }, []); // Abhängigkeit: Verbindet sich neu, wenn sich die URL ändert

  return { messages, sendMessage, isConnected, error };
};

export default _useWebSocket;
