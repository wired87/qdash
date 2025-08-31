import React, {useCallback, useEffect, useRef, useState} from "react";
import {get, off, onChildChanged, query, ref, limitToLast} from "firebase/database";
import {Button, Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader} from "@heroui/react";
import {NodeStatusSection} from "./node_info";
import {NodeLogsSection} from "./node_logs";

export const NodeInfoPanel = (
  {node, onClose, firebaseDb, fbCreds, fbIsConnected, deactivate}
) => {
  // ALLE Hooks müssen am Anfang stehen, VOR JEDEM bedingten Return.
  const [logs, setLogs] = useState({});
  const listenerRefs = useRef([]);
  console.log("node, firebaseDb,fbIsConnected", node, firebaseDb, fbIsConnected)

  const updateLogs = useCallback((newLogs) => {
    setLogs(prevLogs => {
      if (newLogs && newLogs.id) {
        return {
          ...prevLogs,
          [newLogs.id]: newLogs
        };
      }
      return prevLogs;
    });
  }, []);

  useEffect(() => {
    // Hier kannst du Bedingungen sicher prüfen.
    if (!node || !fbIsConnected || !firebaseDb.current) {
      console.log("!node || !fbIsConnected || !firebaseDb.current", node, fbIsConnected, firebaseDb)
        // Aufräumen, auch wenn keine Bedingung erfüllt ist
        listenerRefs.current.forEach(({ refObj, callback }) => off(refObj, "child_changed", callback));
        listenerRefs.current = [];
        return;
    }

    const logs_path = null

    // Cleanup vorheriger Listener
    listenerRefs.current.forEach(({ refObj, callback }) =>
      off(refObj, "child_changed", callback)
    );
    listenerRefs.current = [];

    // @ts-ignore
    const dbRef = ref(firebaseDb.current, logs_path);
    const logsQuery = query(dbRef, limitToLast(30));
    console.log("Fetching initial log data...");

    get(logsQuery).then((snapshot) => {
      if (snapshot.exists()) {
        const initialData = snapshot.val();
        console.log("Initial data loaded:", initialData);
        setLogs(initialData);
      } else {
        console.log("No initial data available.");
        setLogs({});
      }
    }).catch((error) => {
      console.error("Initial data fetch failed:", error);
    });

    const onChildChangedCallback = (snapshot) => {
      const changedData = snapshot.val();
      console.log("Child changed detected:", changedData);
      updateLogs({ id: snapshot.key, ...changedData });
    };

    onChildChanged(logsQuery, onChildChangedCallback);

    listenerRefs.current.push(
      // @ts-ignore
      { refObj: logsQuery, callback: onChildChangedCallback }
    );

    return () => {
      console.log("Cleaning up listeners.");
      listenerRefs.current.forEach(({ refObj, callback }) =>
        off(refObj, "child_changed", callback)
      );
    };
  }, [node, fbIsConnected, firebaseDb, updateLogs]);


  // Der bedingte Render kommt erst nach den Hooks.
  if (!node) return null;
  return (
    <Drawer isOpen={true} onOpenChange={onClose}>
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex flex-col gap-1">Info {node?.id}</DrawerHeader>
            <DrawerBody>
              <NodeStatusSection node={node} />
              <NodeLogsSection logs={logs} />
            </DrawerBody>
            <DrawerFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Close
              </Button>
              <Button color="primary" onPress={onClose}>
                Action
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};