# Fog Network Simulator

Advanced Self-Organizing Fog Network Simulator (FogEdge)

This repository contains a React front-end (client) and an Express+Socket.io server that together simulate a fog network of nodes with dynamic behavior and metrics.

## Features
- Generate random fog networks with nodes of various types (cloud, fog, edge, iot)
- Dynamic simulation of load, CPU, memory, bandwidth and energy consumption
- Connection organization based on compatibility and distance
- Node failure and data traffic simulation

## Start locally
1. Install dependencies

```bash
npm install
```

2. Start the client and server concurrently

```bash
npm run dev
```

3. Build for production

```bash
npm run build
npm start
```

