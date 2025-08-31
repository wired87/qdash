// src/hooks/useWebSocket.js
import { useState, useEffect, useRef, useCallback } from "react";

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
  updateNodes,
  updateEdges,
  updateCreds,
  updateCfg,
  updateDataset
) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [deactivate, setDeactivate] = useState(false);

  // useRef, um die WebSocket-Instanz zu speichern, ohne Re-Renders auszulösen
  const ws = useRef(null);

  // useCallback, um die send-Funktion zu memoizen
  const sendMessage = useCallback((message) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message)); // Nachrichten als JSON senden
    } else {
      console.warn("WebSocket ist nicht verbunden oder bereit.");
    }
  }, []);

  const handleWebSocketMessage = (message) => {
    if (message.type === "init_graph_edges") {
      //  iun demo receive entire G at once
      if (message.data) updateEdges(message.data);
    } else if (message.type === "init_graph_nodes") {
      //  iun demo receive entire G at once
      const data = message.data;
      if (data) {
        updateNodes(data); // `data` ist hier wahrscheinlich das Array von Nodes
        // Iteriere über jedes einzelne "node"-Objekt im "data"-Array
        data.forEach((node) => {
          // forEach ist hier passender, da nichts zurückgegeben wird
          if (node.meta) {
            const state = node.meta.status?.state; // Optional Chaining für "status"

            /*
                if (state === "ALIVE") {
                  console.log("Add", node.id, "to activeNodes");
                  updateActiveNodes(node.id);
                }
              */
          }
        });
      }
    } else if (message.type === "creds") {
      //  iun demo receive entire G at once
      if (message.data) updateCreds(message.data);
    } else if (message.type === "dataset") {
      //  iun demo receive entire G at once
      if (message.data) updateDataset(message.data);
    } else if (message.type === "cfg_schema") {
      //  iun demo receive entire G at once
      if (message.data) updateCfg(message.data);
    } else if (message.type === "conversation") {
      setMessages((prevMessages) => [...prevMessages, message]);
    } else if (message.type === "data_response") {
      handleDownload(message.data);
    } else if (message.type === "finished") {
      setDeactivate(true);
    } else {
      // Für alle anderen unbekannten Nachrichtentypen
      console.log("Unbekannte WebSocket-Nachricht:", message);
    }
  };

  useEffect(() => {
    // Schließe bestehende Verbindung, falls vorhanden
    // Neue WebSocket-Verbindung aufbauen
    ws.current = new WebSocket("http://localhost:3002/");

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
        ws.current.close();
      }
    };
  }, []); // Abhängigkeit: Verbindet sich neu, wenn sich die URL ändert

  return { messages, sendMessage, isConnected, error };
};

export default _useWebSocket;
