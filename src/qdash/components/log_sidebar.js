import React from 'react';
import SliderPanel from './common/SliderPanel';
import { Card, CardBody, Chip } from "@heroui/react";

const LogSidebar = ({ logs, isOpen, onClose }) => {
  return (
    <SliderPanel
      isOpen={isOpen}
      onClose={onClose}
      title="System Logs"
      subtitle="Real-time node execution logs"
      side="left"
      width="500px"
    >
      <div className="space-y-6">
        {Object.entries(logs).map(([nodeId, logData]) => (
          <div key={nodeId} className="space-y-2">
            <div className="flex items-center justify-between sticky top-0 bg-slate-50 dark:bg-slate-950 py-2 z-10">
              <h3 className="font-bold text-lg text-slate-700 dark:text-slate-300">{nodeId}</h3>
              <Chip size="sm" variant="flat" color="default">
                {(logData.err?.length || 0) + (logData.out?.length || 0)} entries
              </Chip>
            </div>

            {logData.err && logData.err.length > 0 && (
              <Card className="bg-red-50 dark:bg-red-900/10">
                <CardBody className="p-3">
                  <h4 className="font-semibold text-red-600 dark:text-red-400 text-xs uppercase tracking-wider mb-2">Errors</h4>
                  <div className="space-y-1">
                    {logData.err.map((error, index) => (
                      <div key={`err-${index}`} className="flex gap-2 text-xs font-mono text-red-700 dark:text-red-300">
                        <span>&gt;</span>
                        <span className="break-all">{error}</span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {logData.out && logData.out.length > 0 && (
              <Card className="bg-slate-100 dark:bg-slate-800">
                <CardBody className="p-3">
                  <h4 className="font-semibold text-green-600 dark:text-green-400 text-xs uppercase tracking-wider mb-2">Output</h4>
                  <div className="space-y-1">
                    {logData.out.map((output, index) => (
                      <div key={`out-${index}`} className="flex gap-2 text-xs font-mono text-slate-600 dark:text-slate-300">
                        <span>&gt;</span>
                        <span className="break-all">{output}</span>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        ))}
        {Object.keys(logs).length === 0 && (
          <div className="text-center text-slate-400 py-10">
            No logs available
          </div>
        )}
      </div>
    </SliderPanel>
  );
};

export default LogSidebar;