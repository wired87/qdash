"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onChildChanged, off } from "firebase/database";
import { getNodeColor } from "./get_color";

export function useFirebaseListeners(fbCreds, deactivate, updateNodes, updateEdges, listener_type, listener_paths, updateLogs) {
  const [fbIsConnected, setFbIsConnected] = useState(false);
  const firebaseApp = useRef(null);
  const firebaseDb = useRef(null);
  const listenerRefs = useRef([]);

  // --- Firebase Init ---
  useEffect(() => {
    if (!fbIsConnected && fbCreds) {
      try {
        firebaseApp.current = initializeApp({
          credential: fbCreds.creds,
          databaseURL: fbCreds.db_path,
        });
        firebaseDb.current = getDatabase(firebaseApp.current);
        setFbIsConnected(true);
      } catch (e) {
        console.error("Firebase Init Error:", e);
        setFbIsConnected(false);
      }
    }
  }, [fbCreds, fbIsConnected]);

  // --- Handle Data Changes ---
  const handleDataChange = useCallback(

    (snapshot) => {

      const changedData = snapshot.val();
      const nodeId = snapshot.key;
      if (!changedData) return;
      if (listener_type === "logs") {
        updateLogs({ id: nodeId, ...changedData })
        return
      }
      if ("src" in changedData && "trgt" in changedData) {
        updateEdges({ id: nodeId, ...changedData });
        return;
      } else if ("pos" in changedData && "type" in changedData) {
        updateNodes({ id: nodeId, ...changedData });
        return;
      } else if ("err" in changedData && "out" in changedData) {
        const logNode = nodeId.split("__")[0];
        const logId = nodeId.split("__").pop();
        updateLogs({ id: logNode, log_id: logId, ...changedData });
        return;
      } else if ("status" in changedData) {
        updateNodes({
          id: nodeId,
          meta: changedData.meta,
          color: getNodeColor(changedData.meta.status.state),
        });
        return;
      }
    },
    [updateNodes, updateEdges, updateLogs]
  );


  useEffect(() => {
    if (!deactivate && fbIsConnected && fbCreds && firebaseDb.current) {
      // Alte Listener weg
      listenerRefs.current.forEach(({ refObj, callback }) =>
        off(refObj, "child_changed", callback)
      );
      listenerRefs.current = [];

      listener_paths.forEach((path) => {
        const dbRef = ref(firebaseDb.current, path);
        onChildChanged(dbRef, handleDataChange);
        listenerRefs.current.push({ refObj: dbRef, callback: handleDataChange });
      });
    }

    return () => {
      listenerRefs.current.forEach(({ refObj, callback }) =>
        off(refObj, "child_changed", callback)
      );
    };
  }, [fbIsConnected, deactivate, fbCreds, handleDataChange]);

  return { fbIsConnected, firebaseDb, logs,  };
}
