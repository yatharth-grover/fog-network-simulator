const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(express.static(path.join(__dirname, "../build")));

class AdvancedFogNetwork {
  constructor() {
    this.nodes = new Map();
    this.connections = [];
    this.simulationRunning = false;
    this.networkMetrics = {
      totalResources: 0,
      avgLatency: 0,
      networkEfficiency: 0,
      loadBalanceScore: 0,
    };
  }

  connectionExists(a, b) {
  return this.connections.some(
    c =>
      (c.source === a && c.target === b) ||
      (c.source === b && c.target === a)
  );
}

  generateRandomNetwork(nodeCount = 50, maxConnections = 10) {
    this.nodes.clear();
    this.connections = [];

    const nodeTypes = ["cloud", "fog", "edge", "iot"];
    const typeWeights = { cloud: 0.1, fog: 0.3, edge: 0.4, iot: 0.2 };

    for (let i = 0; i < nodeCount; i++) {
      const type = this.weightedRandom(nodeTypes, typeWeights);
      const node = {
        id: `node-${i}`,
        x: Math.random() * 1000 + 50,
        y: Math.random() * 600 + 50,
        type: type,
        capacity: this.getCapacityByType(type),
        load: Math.random() * 40,
        cpuUsage: 20 + Math.random() * 40,
        memoryUsage: 25 + Math.random() * 35,
        bandwidth: this.getBandwidthByType(type),
        latency: 5 + Math.random() * 20,
        connections: 0,
        maxConnections: maxConnections,
        energyConsumption: 0,
        status: "active",
      };

      this.nodes.set(node.id, node);
    }

    this.organizeConnections();
    this.calculateNetworkMetrics();
  }

  weightedRandom(items, weights) {
    const totalWeight = Object.values(weights).reduce(
      (sum, weight) => sum + weight,
      0
    );
    let random = Math.random() * totalWeight;

    for (const [item, weight] of Object.entries(weights)) {
      random -= weight;
      if (random <= 0) return item;
    }
    return items[0];
  }

  getCapacityByType(type) {
    const capacities = { cloud: 200, fog: 100, edge: 50, iot: 20 };
    return capacities[type] || 50;
  }

  getBandwidthByType(type) {
    const bandwidths = { cloud: 5001, fog: 1000, edge: 500, iot: 100 };
    return bandwidths[type] || 100;
  }

  organizeConnections() {
  
  this.connections = [];
  const nodeArray = Array.from(this.nodes.values());
  nodeArray.forEach(node => {
    node.connections = 0;
  });
  if (nodeArray.length < 2) return;
  const candidates = [];

  for (let i = 0; i < nodeArray.length; i++) {
    for (let j = i + 1; j < nodeArray.length; j++) {
      const nodeA = nodeArray[i];
      const nodeB = nodeArray[j];
      if (nodeA.status === "failed" || nodeB.status === "failed") continue;

      const distance = Math.sqrt(
        (nodeA.x - nodeB.x) ** 2 + (nodeA.y - nodeB.y) ** 2
      );

      const score = this.calculateConnectionScore(nodeA, nodeB, distance);

      if (score > 0.3) {
        candidates.push({ nodeA, nodeB, distance, score });
      }
    }
  }
  candidates.sort((a, b) => b.score - a.score);

  for (const c of candidates) {
    const { nodeA, nodeB, distance, score } = c;

    if (
      nodeA.connections < nodeA.maxConnections &&
      nodeB.connections < nodeB.maxConnections &&
      !this.connectionExists(nodeA.id, nodeB.id)
    ) {
      this.connections.push({
        id: `conn-${nodeA.id}-${nodeB.id}`,
        source: nodeA.id,
        target: nodeB.id,
        latency: distance * 0.1,
        bandwidth: Math.min(nodeA.bandwidth, nodeB.bandwidth),
        strength: score,
      });

      nodeA.connections++;
      nodeB.connections++;

    }
  }
}

  calculateConnectionScore(nodeA, nodeB, distance) {
    const maxDistance = 300;
    const distanceScore = 1 - distance / maxDistance;

    const typeCompatibility = {
      cloud: { cloud: 0.8, fog: 0.9, edge: 0.7, iot: 0.5 },
      fog: { cloud: 0.9, fog: 0.8, edge: 0.9, iot: 0.7 },
      edge: { cloud: 0.7, fog: 0.9, edge: 0.8, iot: 0.9 },
      iot: { cloud: 0.5, fog: 0.7, edge: 0.9, iot: 0.6 },
    };

    const compatibilityScore = typeCompatibility[nodeA.type][nodeB.type] || 0.5;
    const capacityScore = 1 - Math.abs(nodeA.capacity - nodeB.capacity) / 200;

    return distanceScore * 0.4 + compatibilityScore * 0.4 + capacityScore * 0.2;
  }

  simulateStep() {
    this.nodes.forEach((node) => {
      // Simulate dynamic load changes
      node.load = Math.max(
        0,
        Math.min(100, node.load + (Math.random() - 0.5) * 10)
      );
      node.cpuUsage = Math.max(
        0,
        Math.min(100, node.cpuUsage + (Math.random() - 0.4) * 8)
      );
      node.memoryUsage = Math.max(
        0,
        Math.min(100, node.memoryUsage + (Math.random() - 0.3) * 6)
      );

      // Simulate energy consumption
      node.energyConsumption =
        (node.cpuUsage * 0.7 + node.memoryUsage * 0.3) * 0.1;

      // Load balancing for overloaded nodes
      if (node.load > 85) {
        this.balanceLoad(node);
      }
    });

    this.calculateNetworkMetrics();
  }

  balanceLoad(overloadedNode) {
    const neighbors = this.getNodeNeighbors(overloadedNode.id).filter(
      (neighbor) => neighbor.load < 60
    );

    if (neighbors.length > 0) {
      const loadToTransfer = Math.min(20, overloadedNode.load - 70);
      const transferPerNeighbor = loadToTransfer / neighbors.length;

      neighbors.forEach((neighbor) => {
        neighbor.load += transferPerNeighbor;
      });
      overloadedNode.load -= loadToTransfer;
    }
  }

  getNodeNeighbors(nodeId) {
    return this.connections
      .filter((conn) => conn.source === nodeId || conn.target === nodeId)
      .map((conn) =>
        conn.source === nodeId
          ? this.nodes.get(conn.target)
          : this.nodes.get(conn.source)
      )
      .filter((node) => node !== undefined);
  }

  calculateNetworkMetrics() {
    const nodeArray = Array.from(this.nodes.values());

    this.networkMetrics.totalResources = nodeArray.reduce(
      (sum, node) => sum + node.capacity + node.bandwidth,
      0
    );

    this.networkMetrics.avgLatency =
      this.connections.length > 0
        ? this.connections.reduce((sum, conn) => sum + conn.latency, 0) /
          this.connections.length
        : 0;

    const loadVariance = this.calculateLoadVariance(nodeArray);
    this.networkMetrics.loadBalanceScore = Math.max(0, 100 - loadVariance * 2);

    this.networkMetrics.networkEfficiency = Math.min(
      100,
      (this.connections.length / (nodeArray.length * 3)) * 100 +
        (100 - this.networkMetrics.avgLatency) * 0.3
    );
  }

  calculateLoadVariance(nodes) {
    const avgLoad =
      nodes.reduce((sum, node) => sum + node.load, 0) / nodes.length;
    const variance =
      nodes.reduce((sum, node) => sum + Math.pow(node.load - avgLoad, 2), 0) /
      nodes.length;
    return Math.sqrt(variance);
  }

  // Add fault tolerance simulation
  simulateNodeFailure() {
    if (this.nodes.size > 5 && Math.random() < 0.1) {
      // 10% chance each step
      const nodeArray = Array.from(this.nodes.values());
      const randomNode =
        nodeArray[Math.floor(Math.random() * nodeArray.length)];

      if (randomNode.type !== "cloud") {
        // Don't fail cloud nodes
        randomNode.status = "failed";
        randomNode.load = 0;
        randomNode.cpuUsage = 0;
        randomNode.memoryUsage = 0;

        // Reorganize connections around failed node
        setTimeout(() => {
          this.organizeConnections();
          this.calculateNetworkMetrics();
        }, 2000);
      }
    }
  }

  // Add data traffic simulation
  simulateDataTraffic() {
    this.connections.forEach((conn) => {
      // Simulate data transfer
      conn.traffic = (conn.traffic || 0) + Math.random() * 10;
      conn.utilization = (conn.traffic / conn.bandwidth) * 100;

      // Simulate packet loss under high utilization
      if (conn.utilization > 80) {
        conn.packetLoss = Math.min(10, (conn.utilization - 80) / 2);
      } else {
        conn.packetLoss = 0;
      }
    });
  }
}

const fogNetwork = new AdvancedFogNetwork();

// Generate initial network
fogNetwork.generateRandomNetwork(35, 8);

io.on("connection", (socket) => {
  console.log("Client connected");

  // Send initial state
  socket.emit("networkUpdate", {
    nodes: Array.from(fogNetwork.nodes.values()),
    connections: fogNetwork.connections,
    metrics: fogNetwork.networkMetrics,
  });

  socket.on("generateNetwork", (config) => {
    fogNetwork.generateRandomNetwork(config.nodeCount, config.maxConnections);
    io.emit("networkUpdate", {
      nodes: Array.from(fogNetwork.nodes.values()),
      connections: fogNetwork.connections,
      metrics: fogNetwork.networkMetrics,
    });
  });

  socket.on("startSimulation", () => {
    fogNetwork.simulationRunning = true;
    const simulationInterval = setInterval(() => {
      if (fogNetwork.simulationRunning) {
        fogNetwork.simulateStep();
        io.emit("networkUpdate", {
          nodes: Array.from(fogNetwork.nodes.values()),
          connections: fogNetwork.connections,
          metrics: fogNetwork.networkMetrics,
        });
      } else {
        clearInterval(simulationInterval);
      }
    }, 1500);
  });

  socket.on("stopSimulation", () => {
    fogNetwork.simulationRunning = false;
  });

  socket.on("addNode", (nodeData) => {
    const node = {
      id: `node-${Date.now()}`,
      ...nodeData,
      connections: 0,
      energyConsumption: 0,
      status: "active",
    };

    fogNetwork.nodes.set(node.id, node);
    fogNetwork.organizeConnections();
    fogNetwork.calculateNetworkMetrics();

    io.emit("networkUpdate", {
      nodes: Array.from(fogNetwork.nodes.values()),
      connections: fogNetwork.connections,
      metrics: fogNetwork.networkMetrics,
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Advanced Fog Network Simulator running on port ${PORT}`);
});
