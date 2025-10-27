import React from 'react';

// Icon component (simulating Lucide's ListOrdered icon for visual flair)
const ListOrdered = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="10" x2="21" y1="6" y2="6" />
    <line x1="10" x2="21" y1="12" y2="12" />
    <line x1="10" x2="21" y1="18" y2="18" />
    <path d="M4 6h.01" />
    <path d="M4 12h.01" />
    <path d="M4 18h.01" />
  </svg>
);

// Main application component
const ToDoCard = () => {
  const instructions = [
    "create env cfg",
    "set ncfg",
    "start % monitor sim",
    "gather and visualize results",
  ];

  return (
    // Outer container: Energetic Midnight Blue Background
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-inter">

      {/* The main instruction card: Deep Slate for a modern, refined look */}
      <div className="w-full max-w-md bg-slate-800 rounded-xl shadow-2xl p-6 md:p-8 border border-slate-700 transition duration-500 hover:shadow-blue-500/30">

        {/* Card Header */}
        <div className="flex items-center space-x-3 mb-6 border-b border-slate-700 pb-4">
          {/* Icon in Energetic Blue */}
          <ListOrdered className="w-6 h-6 text-blue-400 flex-shrink-0" />
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            System Initialization Sequence
          </h1>
        </div>

        {/* Instruction List */}
        <ol className="space-y-5">
          {instructions.map((instruction, index) => (
            <li key={index} className="flex items-start group">
              {/* Step Number Badge in Energetic Blue */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-600/30 group-hover:bg-blue-500 transition duration-200 ease-in-out">
                {index + 1}
              </div>

              {/* Step Description in White/Mono Font */}
              <p className="ml-4 pt-0.5 text-white text-lg font-mono leading-relaxed group-hover:text-blue-300 transition duration-200">
                {instruction}
              </p>
            </li>
          ))}
        </ol>

        {/* Footer Hint */}
        <p className="mt-8 text-sm text-slate-400 pt-4 border-t border-slate-700/50">
          Follow these steps sequentially to ensure a successful simulation run.
        </p>
      </div>
    </div>
  );
};

export default ToDoCard;
