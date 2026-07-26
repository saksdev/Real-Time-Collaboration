# DocSync PRO — Real-Time Collaborative Workspace

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue?style=flat-square&logo=react)](https://react.dev/)
[![Yjs](https://img.shields.io/badge/Yjs-CRDT-orange?style=flat-square)](https://yjs.dev/)
[![Monaco Editor](https://img.shields.io/badge/Monaco_Editor-0.47.0-blueviolet?style=flat-square)](https://microsoft.github.io/monaco-editor/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-cyan?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

**DocSync PRO** is a state-of-the-art, high-performance real-time collaborative code editor built with **Next.js 16**, **React 19**, **Monaco Editor**, and **Yjs CRDTs**. It enables developers to create or join workspace rooms, collaborate on code in real time, observe dynamic collaborator cursors, and communicate through an integrated real-time chat.

---

## 🌟 Key Features

- ⚡ **Conflict-Free Real-Time Collaboration**: Powered by Yjs Conflict-Free Replicated Data Types (CRDTs), ensuring zero merge conflicts across concurrent edits.
- 💻 **Monaco Code Editor**: Professional editing experience with syntax highlighting, auto-formatting (`Ctrl+S` or toolbar button), customizable font sizes (12px–20px), and toggleable auto-suggestions.
- 🎯 **Live Remote Cursors & Selection**: Dynamic CSS injection injects collaborator cursor flags and text selections directly into Monaco in real time with custom assigned colors.
- 💬 **Integrated Real-Time Chat**: Synchronized P2P room chat built on Yjs shared arrays (`Y.Array`), featuring timestamps, color-coded sender badges, and clickable URL rendering.
- 👥 **Collaborator Presence & Roster**: Real-time awareness monitoring via `provider.awareness` tracking online peers and active room count.
- 🎨 **Modern Glassmorphism Design System**: Sleek mesh layout with dark/light mode switching, responsive mobile overlay drawers, and subtle micro-animations.
- 🔗 **Instant Room Sharing**: Unique 5-character Workspace IDs (e.g. `ALPHA`) with single-click invite link copying.

---

## 🏗️ Architecture & Real-Time Data Flow

### 1. System Data Flow Diagram

```mermaid
flowchart TD
    subgraph Client ["Client Browser (DocSync Workspace)"]
        UI["User Interface (Next.js 16 + React 19)"]
        ME["Monaco Editor Instance"]
        MB["y-monaco (MonacoBinding)"]
        YD["Y.Doc (CRDT Document Store)"]
        AW["Awareness Manager (Cursor/Peer State)"]
        WP["y-websocket Provider"]
    end

    subgraph Transport ["Real-Time Transport Layer"]
        WSS["y-websocket Server / Relay\n(ws://localhost:1234 or wss://demos.yjs.dev)"]
    end

    subgraph RemotePeers ["Collaborators (Remote Browsers)"]
        RC1["Remote Peer Client 1"]
        RC2["Remote Peer Client 2"]
    end

    %% User Interactions
    UI -->|Renders UI & Controls| ME
    ME -->|On Change| MB
    MB -->|Syncs Text| YD
    ME -->|Cursor / Selection| AW

    %% Network Connections
    YD -->|Delta Transactions| WP
    AW -->|Awareness Packets| WP
    WP <-->|WebSocket Stream| WSS
    WSS <-->|Room Channel Broadcast| RC1
    WSS <-->|Room Channel Broadcast| RC2

    %% Inbound Synchronization
    WP -->|Applies Remote Deltas| YD
    WP -->|Updates Peer Awareness| AW
    YD -->|Updates Model| MB
    MB -->|Reflects Text| ME
    AW -->|Injects Dynamic Remote Cursor CSS| ME
```

---

### 2. Synchronization Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Architect / User
    participant Editor as Monaco Editor (UI)
    participant Binding as y-monaco Binding
    participant YDoc as Y.Doc (CRDT State)
    participant Awareness as Yjs Awareness
    participant WS as y-websocket Provider
    participant Relay as WebSocket Server / Relay
    actor Peers as Remote Collaborators

    %% Local Edit Flow
    rect rgb(240, 245, 255)
    note right of User: Code Edit & Cursor Movement
    User->>Editor: Types code / moves cursor
    Editor->>Binding: Triggers change event
    Binding->>YDoc: Applies change to Y.Text ('monaco')
    Editor->>Awareness: Updates local cursor position & user metadata
    end

    %% Sync Out Flow
    rect rgb(245, 240, 255)
    note right of YDoc: Network Synchronization (Outbound)
    YDoc->>WS: Emits Yjs delta update payload
    Awareness->>WS: Emits Awareness state packet (name, color, cursor)
    WS->>Relay: Sends WebSocket frame over room channel
    end

    %% Broadcast & Inbound Flow
    rect rgb(240, 255, 245)
    note right of Relay: Broadcast & Sync (Inbound)
    Relay->>Peers: Broadcasts delta updates & awareness frames
    Peers->>Relay: Emits peer edits & cursor updates
    Relay->>WS: Receives peer WebSocket payload
    WS->>YDoc: Applies CRDT transaction (conflict-free resolution)
    WS->>Awareness: Updates peer awareness map
    YDoc->>Binding: Syncs Y.Text changes to Monaco Model
    Awareness->>Editor: Inject dynamic CSS (.yRemoteSelection-<id>) for peer cursors
    Binding->>Editor: Re-renders updated document content
    end

    %% Chat Sync Flow
    rect rgb(255, 245, 240)
    note right of User: Real-Time P2P Chat
    User->>YDoc: Pushes message to Y.Array ('chat-messages')
    YDoc->>WS: Syncs message delta over WebSocket
    WS->>Relay: Broadcasts chat update to room
    Relay->>Peers: Updates chat log on peer screens
    end
```

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16.1.6](https://nextjs.org/) | App Router, Server/Client components, SSR optimization |
| **UI Library** | [React 19.2.3](https://react.dev/) | Dynamic hooks, state management, concurrent rendering |
| **Code Editor** | [`@monaco-editor/react`](https://github.com/suren-atoyan/monaco-react) | VS Code editing experience in browser |
| **CRDT Protocol** | [`yjs`](https://yjs.dev/) | High-performance CRDT framework for real-time state |
| **Network Provider** | [`y-websocket`](https://github.com/yjs/y-websocket) | WebSocket provider for Yjs document synchronization |
| **Editor Binding** | [`y-monaco`](https://github.com/yjs/y-monaco) | Monaco binding for Yjs `Y.Text` |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) | Modern utility-first CSS engine |
| **Icons & Utilities** | [`lucide-react`](https://lucide.dev/), `uuid` | Modern SVG icons & UUID generation |

---

## 📂 Project Structure

```
Real-Time-Collaboration/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root HTML structure & font definitions
│   │   ├── globals.css        # Core design tokens, dark mesh, glassmorphism
│   │   ├── page.tsx           # Workspace Landing Page (Create / Join Room)
│   │   └── [roomId]/
│   │       └── page.tsx       # Dynamic Room Route & Identity Prompt Modal
│   └── components/
│       ├── Editor.tsx         # Core Editor Component (Monaco + Yjs + Chat + Awareness)
│       ├── Editor.meet.tsx    # Video & audio meeting experimental variant
│       └── Editor.split.tsx   # Split view experimental variant
├── package.json               # Dependencies & scripts
└── next.config.ts             # Next.js configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm** or **pnpm** or **yarn**

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/saksdev/Real-Time-Collaboration.git
cd Real-Time-Collaboration
npm install
```

### 2. Start the Local WebSocket Server (Optional for local offline test)

To run a dedicated WebSocket server locally on port `1234`:

```bash
npx y-websocket
# Runs on ws://localhost:1234
```

> **Note**: If `ws://localhost:1234` is not running, the application automatically falls back to public WebSocket relays (`wss://demos.yjs.dev`).

### 3. Launch Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start collaborating!

---

## 🧪 Build & Production Deployment

To create a production build:

```bash
npm run build
npm run start
```

---

## 📄 License

This project is open-source under the MIT License.
