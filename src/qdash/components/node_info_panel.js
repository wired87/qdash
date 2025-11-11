import React, {useCallback, useEffect, useRef, useState} from "react";
import {get, off, onChildChanged, query, ref, limitToLast} from "firebase/database";
import {Button, Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader} from "@heroui/react";
import {NodeStatusSection} from "./node_info";
import {NodeLogsSection} from "./node_logs";
import {NodeConfigForm} from "./node_cfg/node_cfg";

import {CustomButton} from "../components";
import useNcfg from "../../hooks/useNcfg";

export const NodeInfoPanel = (
  {
      node,
      onClose,
      firebaseDb,
      fbIsConnected,
      user_id,
      sliderOpen,
      sendMessage,
  }
) => {
  console.log("node, onClose, firebaseDb, fbIsConnected, user_id", node, onClose, firebaseDb, fbIsConnected, user_id)

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

    const {
        ncfg,
        get_ncfg_section
    } = useNcfg();

    const get_ncfg = useCallback(() => {
        return ncfg;
    }, [ncfg])

  useEffect(() => {
    // Hier kannst du Bedingungen sicher prüfen.
    if (!node || !fbIsConnected || !firebaseDb.current) {
      console.log("!node || !fbIsConnected || !firebaseDb.current", node, fbIsConnected, firebaseDb)
        // Aufräumen, auch wenn keine Bedingung erfüllt ist
        listenerRefs.current.forEach(({ refObj, callback }) => off(refObj, "child_changed", callback));
        listenerRefs.current = [];
        return;
    }

    // Cleanup vorheriger Listener
    listenerRefs.current.forEach(({ refObj, callback }) =>
      off(refObj, "child_changed", callback)
    );
    listenerRefs.current = [];


    const logs_path = `users/${user_id}/env/${node.env}/logs/${node.id}`;
    console.log("start second logs listener")
    const dbRef = ref(firebaseDb.current, logs_path);
    const logsQuery = query(
      dbRef,
      limitToLast(30)
    );

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

  // Overwrite
  let new_node = node.node;


  return (
    <Drawer isOpen={sliderOpen} onOpenChange={onClose}>
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="flex flex-col gap-1">Info {new_node?.id}</DrawerHeader>
            <DrawerBody>
                {get_ncfg_section()}
                <CustomButton
                  color="primary"
                  onPress={() => {
                    sendMessage({
                      type: "cfg_file",
                      data: {
                        ncfg: get_ncfg(),
                        env_id: node.env,
                      },
                      timestamp: new Date().toISOString(),
                    });
                  }}
                >
                  Send Configuration
                </CustomButton>
              <NodeStatusSection node={new_node} />
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