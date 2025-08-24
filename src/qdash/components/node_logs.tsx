import React from "react";
import { Listbox, ListboxItem } from "@heroui/react";

interface LogsMap {
  [id: string]: string[]; // id -> array of log strings
}
export const NodeLogsSection: React.FC<{ logs }> = ({ logs }) => {
  const entries = Object.entries(logs || {});
  console.log("Log section rendered:", logs);

  if (entries.length === 0) {
    return <p className="text-default-400">Keine Logs vorhanden.</p>;
  }

  return (
    <div className="w-full max-w-md h-64 overflow-y-auto border rounded-md p-2 bg-content1">
      <h3 className="text-lg font-semibold mb-3">Logs</h3>
      <Listbox aria-label="Node Logs" variant="flat">
        {entries.map(([id, logItem]) =>
          <ListboxItem
            key={`${id}`}
            textValue={`${id}: ${logItem}`}
            className="p-3">
            <div className="flex flex-col">
              <span className="font-medium text-small text-primary">{id}</span>
              <span className="text-tiny text-default-500 whitespace-pre-wrap">
                {logItem}
              </span>
            </div>
          </ListboxItem>
        )}
      </Listbox>
    </div>
  );
};
