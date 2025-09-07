import { useCallback, useEffect, useRef, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onChildChanged, off } from "firebase/database";
import { getNodeColor } from "./get_color";

export function useFirebaseListeners(
    fbCreds,
    updateEnv
) {
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
    (
        snapshot,
        env_id,
        listener_type,
    ) => {
      const changedData = snapshot.val();
      const nodeId = snapshot.key;

      if (!changedData) return;
        updateEnv(
            listener_type,
            env_id,
            { id: nodeId, ...changedData }
        )
    },
    []
  );


  useEffect(() => {
    if (fbIsConnected && fbCreds && firebaseDb.current) {
      // Alte Listener entfernen
      listenerRefs.current.forEach(({ refObj, callback }) =>
        off(refObj, "child_changed", callback)
      );
      listenerRefs.current = [];

      Object.entries(fbCreds.listener_paths).forEach(([env_id, struct]) => {
        Object.entries(struct).forEach(([listener_type, all_paths]) => {
          all_paths.forEach((path) => {
            const dbRef = ref(firebaseDb.current, path);

            const _callback = (snapshot) =>
              handleDataChange(snapshot, env_id, listener_type);

            onChildChanged(dbRef, _callback);
            listenerRefs.current.push({ refObj: dbRef, callback: _callback });
          });
        });
      });
    }
    return () => {
      listenerRefs.current.forEach(({ refObj, callback }) =>
        off(refObj, "child_changed", callback)
      );
    };
  }, [fbIsConnected, fbCreds, firebaseDb]);

  return { fbIsConnected, firebaseDb };
}
/*

updateNodes({
          id: nodeId,
          meta: changedData.meta,
          color: getNodeColor(changedData.meta.status.state),
        });
 */