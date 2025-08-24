import React from "react";
import { Listbox, ListboxItem } from "@heroui/react";

interface Node {
  id: string;
  name?: string;
  meta?: {
    status?: {
      state?: string;
      message?: string;
    };
    [key: string]: any; // erlaubt Zusatzdaten
  };
  [key: string]: any;
}

export const NodeStatusSection = ({ node }) => {
  if (!node) {
    return <p className="text-default-400">Error fetching.</p>;
  }
  console.log("Status section rendered:", node)

  return (
    <div className="w-full max-w-md">
      <h3 className="text-lg font-semibold mb-3">Node Status</h3>
      <Listbox aria-label="Node Status Section" variant="flat" className="bg-content1 rounded-md">
        <ListboxItem
          key={node.id}
          textValue={node.name || node.id}
          className="p-3" >
          <div className="flex flex-col">
              <strong className="text-small text-default-500">ID:{node.id}</strong>
              <strong className="text-small text-default-500">STATE</strong>
              <strong className="text-small text-default-500">STATUS:{node.meta.status?.state}</strong>
              <strong className="text-small text-default-500">INFO:{node?.meta.status?.info}</strong>
              <strong className="text-small text-default-500">CLASS NAME:{node.meta.class_name}</strong>
              <strong className="text-small text-default-500">MSG Sent:{node.meta.messages_received}</strong>
              <strong className="text-small text-default-500">MSG received:{node.meta.messages_received}</strong>
          </div>
        </ListboxItem>
      </Listbox>
    </div>
  );
};
