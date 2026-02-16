# QDash

> Advanced Simulation & Data Visualization Platform

**QDash** is a React-based control plane for a modular simulation engine. Users manage **Environments** (spatial containers), **Modules** (Python logic), **Fields** (data layers), and **Injections** (external stimuli) via an AI-powered terminal and visual designers. The frontend talks to the engine over WebSocket; state is held in Redux (sessions, envs, modules, fields, injections, conversation).

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)

---


todo
frontend full agent capabilities and interaction just use relay for commmits

- **Geometry drag-drop**: Make just the geometries from the right side view available for drag-and-drop into the middle (main background particle) component where the selected grid is defined. File conversion in frontend.







## ⚠️ First-Time Setup

- clone -> paste env args -> ready to go 
- feel free use it as blueprint for other projects 

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Core Concepts](#-core-concepts)
- [Features](#-features)
- [Architecture](#-architecture)
- [To-Do](#-to-do)
- [Installation](#-installation)
- [Usage](#-usage)
- [Contributing](#-contributing)

---

## 🌟 Overview

QDash provides a single interface to manage distributed simulation graphs: create envs, link modules and fields to sessions, inject patterns, and drive everything via natural language (Gemini) or structured commands. The **core** engine coordinates logic across nodes; the UI keeps live state in Redux and syncs with the backend over WebSocket.

### Key Objectives

- **Modular logic**: Python **Modules** are hot-swappable; link them to sessions and envs.
- **Spatial mapping**: **Environments** define dimensions and nodes; **Fields** carry data; **Injections** target coordinates.
- **Natural language + structure**: Terminal chat (Gemini) plus dedicated designers (Module, Field, Injection, World Config, Session Config).
- **Live feedback**: Logs, env lists, and session config updates flow through WebSocket and Redux.

---

## 🧩 Core Concepts

| Concept | Description |
|--------|--------------|
| **Environments (Envs)** | Spatial containers for a simulation. Each has id, dimensions, nodes, optional `field_id`. Stored in Redux `envs.userEnvs`; linked to sessions. |
| **Modules** | Units of logic (e.g. Python classes). Stored in `modules.userModules`; linked to sessions/envs. |
| **Fields** | Data layers used by modules. Stored in `fields.userFields`; can be associated with envs (World Config “Field” dropdown) and sessions. |
| **Injections** | External stimuli at specific coordinates. Stored in `injections`; assigned per env/field in session config. |
| **Sessions** | Working context: which envs, modules, and fields are linked, plus injection mappings. State in `sessions` slice. |
| **Conversation** | Terminal context: `conversation.models` is an array of `env_id`s “in conversation” (e.g. for visualization or scoping). |

See **[redux_ds.md](redux_ds.md)** for full Redux structures.

---

## ✨ Features

### Interactive Terminal
- **AI-powered**: Natural language to create envs, link modules, run simulations.
- **Hybrid**: Mix free-form chat and structured commands.
- **Live feedback**: Logs and WebSocket events shown in the terminal.

### Visual Builders
- **World Config (Env Cfg)**: Create/update envs; choose a **Field** from user fields; send `SET_ENV` with `data.env` and optional `data.field`.
- **Session Config**: Link envs, modules, and injections to the active session; hierarchical config (env → module → field → injection).
- **Module Designer**: Upload and edit Python module code.
- **Field Designer**: Manage user fields.
- **Energy / Injection Designer**: Define injection patterns and apply to envs.

### Visualization
- **Live View**: Field state over time per env.
- **Oscilloscope View**: Retro n-D style traces for module params.
- **Cluster Viz**: Topology of the simulation cluster.
- **Env list**: User envs with status; “Add to Conversation” adds `env_id` to `conversation.models` (e.g. in World Cfg model tab).

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend (React + Redux)                   │
│  [Terminal]  [World Cfg]  [Session Config]  [Designers]      │
│  Redux: sessions | envs | modules | fields | injections |    │
│         conversation (models = env_ids) | websocket          │
├───────────────────────────────────────────────────────────────┤
│                    WebSocket (bestbrain.tech / localhost)     │
├───────────────────────────────────────────────────────────────┤
│                   Simulation Engine (Python)                  │
│  Graph | Module Executor | Injection Controller              │
├───────────────────────────────────────────────────────────────┤
│                   Data (Firebase / backend)                  │
└─────────────────────────────────────────────────────────────┘
```

- **Env list responses** (`GET_USERS_ENVS`, `LIST_USERS_ENVS`, `LIST_ENVS`): Envs are stored with `field_id` preserved; Redux `envs.userEnvs` and World Cfg use it.
- **SET_ENV**: Payload includes `data.env` and optional `data.field` (selected user field id).

---

## 📌 To-Do

- **Agent capabilities**: Extend terminal agent (e.g. intent handling, tool use).
- **User self-handling of API key**: Let users set/store Gemini API key in the app (e.g. settings or prompt).
- **Connect to "QBrain" project**: Integration with QBrain backend or services.
- **Visualization in-screen**: Choose module params by type and map them to visualization techniques; use matplotlib; support retro n-D views.
- **Visualization — Add model Button**
  - **Scope**: Within each **user env item** in the env list (each env card in World Cfg left column), add a switch that adds that env’s `env_id` to the Redux **conversation “models”** list (i.e. `conversation.models`).
  - **Data**: `conversation.models` is the terminal-facing list of env IDs “in conversation”; it drives which envs are considered for live input / visualization context.
  - **Terminal behavior**: The terminal captures **live input** from the user and **clears the input on each submit**. The workflow should be:
    1. User toggles “Add model” on an env item → dispatch `addModelEnv(env_id)` so that `env_id` is in `state.conversation.models`.
    2. On submit, the terminal sends the current message (and optionally the current `conversation.models` as context) to the backend/Gemini.
    3. After submit, the **input field is cleared** (existing behavior); `conversation.models` can either stay as-is for the next turn or be cleared per product choice (e.g. clear on submit or keep until user removes envs).
  - **Workflow to implement**: (1) Add a per-env-item switch in the env list (World Cfg) that toggles `env_id` in `conversation.models`. (2) Ensure terminal submit clears the input and, if desired, pass `conversation.models` in the request. (3) Document or add a clear rule for when `conversation.models` is reset (e.g. on submit vs. manual only).

---

## 🚀 Installation

### Prerequisites

- Node.js (v14+)
- Python (v3.10+) for the backend engine
- Firebase (for auth/persistence)

### Quick Start

1. **Clone**
   ```bash
   git clone https://github.com/wired87/qdash.git
   cd qdash
   ```

2. **Install**
   ```bash
   npm install
   ```

3. **Configure**
   - Copy `.env.example` to `.env`
   - Set `CLIENT_KEY_GEMINI_API_KEY`
   - Configure Firebase if using a custom project

4. **Run**
   ```bash
   npm start
   ```
   Backend expected at `ws://127.0.0.1:8000/run` (or production WebSocket URL).

---

## 💻 Usage

1. **Create an env**: Open **Env Cfg** (World Config), set dimensions/options, pick a Field, confirm. Or ask in terminal: *“Create a 10×10 grid for heat simulation.”*
2. **Define logic**: Use **Module Designer** to add Python modules (e.g. `HeatModule` with `diffuse`).
3. **Link & run**: In **Session Config**, link envs and modules to the session. In terminal: *“Link HeatModule to current session”* then *“Start simulation.”*
4. **Inject**: Use the Injection designer or Session Config to assign injections to env/field/positions.

---

## 🤝 Contributing

Contributions are welcome. Use the usual fork-and-pull-request workflow.

---

## 📄 License

MIT — see [LICENSE](LICENSE).

---

<p align="center">
  Made with ❤️ by the QDash Team
</p>
