import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Zap,
  Layers,
  Database,
  Play,
  BarChart3,
  Grid3X3,
  Cpu,
} from 'lucide-react';

/**
 * ComponentGrid: Custom grid button interface with hardcoded component configurations
 * Replaces the engine/terminal screen with an interactive grid of components
 */
const ComponentGrid = ({ user, userProfile }) => {
  const [selectedComponent, setSelectedComponent] = useState(null);

  // Hardcoded components configuration
  const componentsConfig = [
    {
      id: 'params',
      title: 'Parameters',
      icon: Settings,
      description: 'Configure system parameters',
      color: 'from-cyan-500 to-blue-500',
      borderColor: 'border-cyan-400/30',
      hoverColor: 'hover:from-cyan-500/20 hover:to-blue-500/20',
      fields: [
        { name: 'sim_time', type: 'number', default: 1000 },
        { name: 'timestep', type: 'number', default: 0.01 },
        { name: 'convergence_threshold', type: 'number', default: 1e-6 },
        { name: 'max_iterations', type: 'number', default: 10000 },
      ],
    },
    {
      id: 'fields',
      title: 'Fields',
      icon: Zap,
      description: 'Define field configurations',
      color: 'from-purple-500 to-pink-500',
      borderColor: 'border-purple-400/30',
      hoverColor: 'hover:from-purple-500/20 hover:to-pink-500/20',
      fields: [
        { name: 'electric_field', type: 'boolean', default: true },
        { name: 'magnetic_field', type: 'boolean', default: false },
        { name: 'field_strength', type: 'number', default: 1.0 },
        { name: 'field_frequency', type: 'number', default: 50 },
      ],
    },
    {
      id: 'modules',
      title: 'Modules',
      icon: Layers,
      description: 'Manage simulation modules',
      color: 'from-green-500 to-emerald-500',
      borderColor: 'border-green-400/30',
      hoverColor: 'hover:from-green-500/20 hover:to-emerald-500/20',
      fields: [
        { name: 'physics_engine', type: 'boolean', default: true },
        { name: 'collision_detection', type: 'boolean', default: true },
        { name: 'particle_system', type: 'boolean', default: true },
        { name: 'visualization', type: 'boolean', default: true },
      ],
    },
    {
      id: 'sessions',
      title: 'Sessions',
      icon: Database,
      description: 'Manage simulation sessions',
      color: 'from-yellow-500 to-orange-500',
      borderColor: 'border-yellow-400/30',
      hoverColor: 'hover:from-yellow-500/20 hover:to-orange-500/20',
      fields: [
        { name: 'session_name', type: 'string', default: 'New Session' },
        { name: 'auto_save', type: 'boolean', default: true },
        { name: 'save_interval', type: 'number', default: 300 },
        { name: 'enable_logging', type: 'boolean', default: true },
      ],
    },
    {
      id: 'methods',
      title: 'Methods',
      icon: Cpu,
      description: 'Configure calculation methods',
      color: 'from-red-500 to-rose-500',
      borderColor: 'border-red-400/30',
      hoverColor: 'hover:from-red-500/20 hover:to-rose-500/20',
      fields: [
        { name: 'solver_type', type: 'string', default: 'rk4' },
        { name: 'precision', type: 'string', default: 'double' },
        { name: 'parallelization', type: 'boolean', default: true },
        { name: 'gpu_acceleration', type: 'boolean', default: false },
      ],
    },
    {
      id: 'results',
      title: 'Results',
      icon: BarChart3,
      description: 'Analyze simulation results',
      color: 'from-indigo-500 to-blue-500',
      borderColor: 'border-indigo-400/30',
      hoverColor: 'hover:from-indigo-500/20 hover:to-blue-500/20',
      fields: [
        { name: 'export_format', type: 'string', default: 'csv' },
        { name: 'include_metrics', type: 'boolean', default: true },
        { name: 'compression', type: 'boolean', default: false },
        { name: 'detailed_logs', type: 'boolean', default: true },
      ],
    },
    {
      id: 'environment',
      title: 'Environment',
      icon: Grid3X3,
      description: 'Configure environment settings',
      color: 'from-teal-500 to-cyan-500',
      borderColor: 'border-teal-400/30',
      hoverColor: 'hover:from-teal-500/20 hover:to-cyan-500/20',
      fields: [
        { name: 'seed', type: 'number', default: 42 },
        { name: 'dimensions', type: 'number', default: 3 },
        { name: 'grid_size', type: 'number', default: 100 },
        { name: 'boundary_conditions', type: 'string', default: 'periodic' },
      ],
    },
    {
      id: 'execution',
      title: 'Execute',
      icon: Play,
      description: 'Run simulation with current config',
      color: 'from-lime-500 to-green-500',
      borderColor: 'border-lime-400/30',
      hoverColor: 'hover:from-lime-500/20 hover:to-green-500/20',
      fields: [
        { name: 'dry_run', type: 'boolean', default: false },
        { name: 'verbose_output', type: 'boolean', default: true },
        { name: 'benchmark_mode', type: 'boolean', default: false },
      ],
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const GridButton = ({ component }) => {
    const Icon = component.icon;
    return (
      <motion.button
        variants={item}
        onClick={() => setSelectedComponent(component)}
        className="group relative h-full"
      >
        {/* Outer glow effect */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${component.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300`}
        />

        {/* Main card */}
        <div
          className={`relative h-full flex flex-col items-center justify-center gap-3 px-6 py-8 rounded-2xl border ${component.borderColor} bg-slate-900/50 backdrop-blur-md hover:bg-slate-900/70 transition-all duration-300 group-hover:scale-105 cursor-pointer`}
        >
          {/* Icon */}
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${component.color} shadow-lg group-hover:shadow-2xl transition-all duration-300`}
          >
            <Icon className="w-6 h-6 text-white" strokeWidth={2} />
          </div>

          {/* Title */}
          <h3 className="text-sm font-bold text-white text-center leading-tight">
            {component.title}
          </h3>

          {/* Description */}
          <p className="text-xs text-gray-400 text-center line-clamp-2 group-hover:text-gray-300 transition-colors">
            {component.description}
          </p>

          {/* Field count badge */}
          <span className="mt-auto text-[10px] px-2 py-1 rounded-full bg-white/10 text-blue-300 font-mono">
            {component.fields.length} cfg
          </span>
        </div>
      </motion.button>
    );
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-blue-400/20 px-6 py-4 bg-slate-900/50">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Grid3X3 className="w-6 h-6 text-blue-400" />
          Component Configuration Grid
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Select a component to configure its parameters and settings
        </p>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-max"
        >
          {componentsConfig.map((component) => (
            <GridButton key={component.id} component={component} />
          ))}
        </motion.div>
      </div>

      {/* Detail Panel */}
      {selectedComponent && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="flex-shrink-0 border-t border-blue-400/20 bg-slate-900/50 backdrop-blur-md p-6 max-h-80 overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {React.createElement(selectedComponent.icon, {
                className: 'w-5 h-5 text-blue-400',
              })}
              <h3 className="text-lg font-bold text-white">
                {selectedComponent.title} Configuration
              </h3>
            </div>
            <button
              onClick={() => setSelectedComponent(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Fields Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedComponent.fields.map((field, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-800/50 border border-blue-400/20"
              >
                <label className="text-xs font-semibold text-blue-300 uppercase tracking-widest">
                  {field.name}
                </label>
                <p className="text-xs text-gray-400 mt-1">
                  Type: <span className="text-blue-200">{field.type}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Default: <span className="font-mono text-gray-300">{String(field.default)}</span>
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ComponentGrid;
