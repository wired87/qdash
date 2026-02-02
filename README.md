# QDash 

> Advanced Simulation & Data Visualization Platform

**core** is a modular, high-performance simulation engine designed to coordinate complex logic across distributed nodes. It enables users to define custom execution modules, link them to nD spatial environments, and visualize the resulting data streams in real-time.


## ⚠️ IMPORTANT: First-Time Setup

1. **Quick Setup**: Run `setup-gemini.bat` (Windows) or see `SETUP_GEMINI.md`
2. **Get API Key**: https://makersuite.google.com/app/apikey
3. **Add to `.env`**: `CLIENT_KEY_GEMINI_API_KEY=your_key_here`
4. **Restart Server**: Stop and run `npm start` again

Without this, the terminal chat will show connection errors. See **[SETUP_GEMINI.md](SETUP_GEMINI.md)** for detailed instructions.

---


ToDo:
- agent capabilities: 
- User self handling of API key 
- connect to "QBrain" project
- Visualization in screen of the engine. 
choose all modules params classified for type to suitable visualizaton techniques. use matplot. retro n-Dimention (nD)
- 
- 



![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)

## 📋 Table of Contents

- [Overview](#overview)
- [Core Concepts](#core-concepts)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)

## 🌟 Overview

core provides a "God Mode" interface for managing distributed computational graphs. Users don't just run static scripts; they build living, breathing environments where logic (Modules) flows through data carriers (Fields) across a spatial manifold (Environments).

### Key Objectives

- **Modular Logic**: Decouple simulation logic from the runtime engine using hot-swappable Python **Modules**.
- **Spatial Intelligence**: Map abstract data to physical 3D/4D space for intuitive debugging and analysis.
- **Natural Language Control**: Interact with the system via a terminal interface powered by Gemini AI.
- **Graph-Based Execution**: Visualize and manipulate the dependency graph of your simulation in real-time.

## 🧩 Core Concepts

1.  **Environments (Envs)**: The spatial containers for your simulation. An Env defines core dimensions, physics constants, and active nodes.
2.  **Modules**: Self-contained units of logic (Python classes) that perform calculations. Example: `HeatDiffusion`, `AgentBehavior`, `QuantumOscillator`.
3.  **Fields**: Data layers managed by Modules. A Module might read a `Temperature` Field and update a `pressure` Field.
4.  **Injections**: External stimuli applied to core. You "inject" energy or data patterns into specific coordinates to kickstart simulations.

## ✨ Features

### Interactive Terminal
- **AI-Powered**: Chat with the system ("Create a new env", "Link module X to session Y").
- **Hybrid Control**: Switch seamlessly between natural language and structured commands.
- **Real-time Feedback**: See system logs, errors, and confirmations instantly.

### Visual Builders
- **Node Cfg Slider**: Fine-tune the properties of individual nodes within core.
- **Module Designer**: Upload, edit, and manage your Python simulation code.
- **Energy Injection Designer**: Draw patterns of energy injection on a canvas and apply them to core.

### 3D/4D Visualization
- **Live View**: Watch the state of your Fields evolve in real-time.
- **Oscilloscope View**: Retro n-D waveform display—module params as rolling phosphor-style traces (green/amber grid, multi-channel) when the simulation is running.
- **Cluster Viz**: Inspect the topology of your simulation cluster.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                    │
│   [Terminal]  [3D Canvas]  [Designers]  [Dashboard]     │
├─────────────────────────────────────────────────────────┤
│                  WebSocket Gateway                      │
├─────────────────────────────────────────────────────────┤
│                   core Engine (Python)              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │  Graph      │  │  Module     │  │  Injection  │      │
│  │  Manager    │  │  Executor   │  │  Controller │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
├─────────────────────────────────────────────────────────┤
│                    Data Storage (BigQuery/Firebase)     │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Installation

### Prerequisites

- Node.js (v14 or higher)
- Python (v3.10 or higher for the backend engine)
- Firebase Account (for auth/data persistence)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/wired87/qdash.git
   cd qdash
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Add your `CLIENT_KEY_GEMINI_API_KEY`
   - Configure Firebase credentials if running against a custom instance.

4. **Start the Development Server**
   ```bash
   npm start
   ```
   *Note: Ensure the backend engine is running separately on port 8000 (ws://127.0.0.1:8000/run).*

## 💻 Usage

### 1. Initialize an Environment
Open the **Env Cfg** or type:
> "Create a 10x10 Grid for heat simulation"

### 2. Define Logic
Use the **Module Designer** to upload a Python script.
> Class `HeatModule` with process method `diffuse`.

### 3. Link & Run
Connect your Module to the active Session.
> "Link HeatModule to current session"
> "Start simulation"

### 4. Inject
Use the **Injection ⚡** tool to add heat sources to core and watch it spread.

## 🤝 Contributing

We welcome contributions! Please follow standard fork-and-pull-request workflows.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made with ❤️ by the QDash Team
</p>

