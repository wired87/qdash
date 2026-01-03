import React, { useCallback, useEffect, useRef, useState } from "react";
import { get, off, onChildChanged, query, ref, limitToLast } from "firebase/database";
import { Button } from "@heroui/react";
import { NodeStatusSection } from "./node_info";
import { NodeLogsSection } from "./node_logs";
import SliderPanel from "./common/SliderPanel";

import { CustomButton } from "../components";
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
  // ALLE Hooks müssen am Anfang stehen, VOR JEDEM bedingten Return.
  const [logs, setLogs] = useState({});
  const listenerRefs = useRef([]);

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
    const dbRef = ref(firebaseDb.current, logs_path);
    const logsQuery = query(
      dbRef,
      limitToLast(30)
    );

    get(logsQuery).then((snapshot) => {
      if (snapshot.exists()) {
        const initialData = snapshot.val();
        setLogs(initialData);
      } else {
        setLogs({});
      }
    }).catch((error) => {
      console.error("Initial data fetch failed:", error);
    });

    const onChildChangedCallback = (snapshot) => {
      const changedData = snapshot.val();
      updateLogs({ id: snapshot.key, ...changedData });
    };

    onChildChanged(logsQuery, onChildChangedCallback);

    listenerRefs.current.push(
      // @ts-ignore
      { refObj: logsQuery, callback: onChildChangedCallback }
    );

    return () => {
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
    <SliderPanel
      isOpen={sliderOpen}
      onClose={onClose}
      title={`Info ${new_node?.id}`}
      subtitle="Node Details & Configuration"
      width="500px"
    >
      <div className="space-y-6">
        {get_ncfg_section()}

        <CustomButton
          color="primary"
          className="w-full"
          onPress={() => {
            sendMessage({
              type: "CFG_FILE",
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

        <div className="flex justify-end gap-2 pt-4">
          <Button color="danger" variant="light" onPress={onClose}>
            Close
          </Button>
          <Button color="primary" onPress={onClose}>
            Action
          </Button>
        </div>
      </div>
    </SliderPanel>
  );
};