import React, {useState} from "react";
import {ThreeScene} from "../_use_three";


const CustomCard = ({ children, className = "" }) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden ${className}`}>
      {children}
    </div>
  );
};

const CustomCardBody = ({ children, className = "" }) => {
  return (
    <div className={`p-4 ${className}`}>
      {children}
    </div>
  );
};

const CustomChip = ({ children, color, className = "" }) => {
  const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold";
  const colorClasses = {
    secondary: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  }[color] || "";

  return (
    <span className={`${baseClasses} ${colorClasses} ${className}`}>
      {children}
    </span>
  );
};



// The main Dashboard component.
export const Dashboard = (
  { envs, updateNodeInfoOpen }
) => {
  const [selectedEnv, setSelectedEnv] = useState(null);
  Object.entries(envs).map(([env_id, item]) => {
    console.log("nodes:", item.data.nodes)
    console.log("edges:", item.data.nodes)
  })



  const handleSelectEnv = (envId) => {
    setSelectedEnv(envId);
  };

  const handleBack = () => {
    setSelectedEnv(null);
  };
  if (Object.keys(envs).length === 0) {
    return <></>
  }
  // Render the full-screen view for the selected environment
  if (selectedEnv) {
    const env = envs[selectedEnv];
    return (
      <div className="flex flex-col h-screen p-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans">
        <div className="main-content w-full max-w-4xl mx-auto h-full overflow-hidden flex flex-col rounded-2xl shadow-lg">
          <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={handleBack}
              className="text-blue-600 dark:text-blue-400 font-semibold"
            >
              ← Back to list
            </button>
            <h2 className="text-2xl font-bold mt-2">{env.name}</h2>
            <CustomChip color={env.status === "online" ? "online" : "offline"}>
              {env.status.toUpperCase()}
            </CustomChip>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Environment Details</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{env.details}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">Nodes</span>
                <span className="block text-lg font-bold">{env.nodes}</span>
              </div>
              <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">Edges</span>
                <span className="block text-lg font-bold">{env.edges}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render the list view
  return (
    <div className="flex flex-col h-screen p-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans">
      <div className="main-content w-full max-w-4xl mx-auto h-full flex flex-col rounded-2xl shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Network Environments</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Select an environment to see detailed information.
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {Object.entries(envs).map(([env_id, item]) => (
            <CustomCard
              key={env_id}
              onClick={() => handleSelectEnv(env_id)}>
              <CustomCardBody>
                <ThreeScene nodes={item.data.nodes} edges={item.data.edges} onNodeClick={updateNodeInfoOpen}/>
              </CustomCardBody>
            </CustomCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

