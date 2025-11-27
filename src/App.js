import React, { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:5001");

function App() {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [config, setConfig] = useState({ nodeCount: 35, maxConnections: 8 });
  const [selectedNode, setSelectedNode] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    socket.on("networkUpdate", (data) => {
      setNodes(data.nodes);
      setConnections(data.connections);
      setMetrics(data.metrics);
    });

    return () => {
      socket.off("networkUpdate");
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    drawNetwork(ctx, nodes, connections, selectedNode);
  }, [nodes, connections, selectedNode]);

  const drawNetwork = (ctx, nodes, connections, selectedNode) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw connections with gradient based on strength
    connections.forEach((conn) => {
      const sourceNode = nodes.find((n) => n.id === conn.source);
      const targetNode = nodes.find((n) => n.id === conn.target);

      if (sourceNode && targetNode) {
        const gradient = ctx.createLinearGradient(
          sourceNode.x,
          sourceNode.y,
          targetNode.x,
          targetNode.y
        );

        gradient.addColorStop(0, `rgba(100, 150, 255, ${conn.strength})`);
        gradient.addColorStop(1, `rgba(255, 100, 150, ${conn.strength})`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2 + conn.strength * 3;
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.stroke();

        // Draw latency indicator
        if (conn.latency > 15) {
          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;

          ctx.fillStyle = conn.latency > 25 ? "#ff4444" : "#ffaa00";
          ctx.beginPath();
          ctx.arc(midX, midY, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    });
    connections.forEach((conn) => {
      const sourceNode = nodes.find((n) => n.id === conn.source);
      const targetNode = nodes.find((n) => n.id === conn.target);

      if (sourceNode && targetNode && conn.traffic > 5) {
        const progress = (Date.now() / 1000) % 1;
        const x = sourceNode.x + (targetNode.x - sourceNode.x) * progress;
        const y = sourceNode.y + (targetNode.y - sourceNode.y) * progress;

        ctx.fillStyle = conn.utilization > 80 ? "#ff4444" : "#00ff00";
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
    // Draw nodes
    nodes.forEach((node) => {
      const isSelected = selectedNode && selectedNode.id === node.id;
      const color = getNodeColor(node.type, node.load);
      const radius = getNodeRadius(node.type);

      // Node glow effect for selected node
      if (isSelected) {
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 20;
      }

      // Node background
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fill();

      // Node border
      ctx.strokeStyle = isSelected ? "#00ffff" : "#333";
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Node icon based on type
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(getNodeIcon(node.type), node.x, node.y);

      // Node label
      ctx.fillStyle = "#2c3e50";
      ctx.font = "10px Arial";
      ctx.fillText(node.id.slice(-6), node.x, node.y + radius + 12);

      // Load indicator
      drawLoadIndicator(ctx, node, radius);
    });
  };

  const getNodeColor = (type, load) => {
    const baseColors = {
      cloud: "#3498db",
      fog: "#2ecc71",
      edge: "#e74c3c",
      iot: "#f39c12",
    };

    const intensity = 1 - (load / 100) * 0.5;
    const baseColor = baseColors[type] || "#95a5a6";

    // Darken color based on load
    return adjustColorBrightness(baseColor, -load * 0.3);
  };

  const adjustColorBrightness = (hex, percent) => {
    const num = parseInt(hex.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;

    return `#${(
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)}`;
  };

  const getNodeRadius = (type) => {
    const radii = { cloud: 28, fog: 22, edge: 18, iot: 14 };
    return radii[type] || 18;
  };

  const getNodeIcon = (type) => {
    const icons = { cloud: "☁", fog: "🌫", edge: "⚡", iot: "📱" };
    return icons[type] || "■";
  };

  const drawLoadIndicator = (ctx, node, radius) => {
    const loadWidth = (radius * 2 * node.load) / 100;
    const loadColor =
      node.load > 80 ? "#ff4444" : node.load > 60 ? "#ffaa00" : "#44ff44";

    ctx.fillStyle = loadColor;
    ctx.fillRect(node.x - radius, node.y - radius - 8, loadWidth, 4);

    // Background for load bar
    ctx.fillStyle = "#ecf0f1";
    ctx.fillRect(
      node.x - radius + loadWidth,
      node.y - radius - 8,
      radius * 2 - loadWidth,
      4
    );
  };

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Check if clicked on a node
    const clickedNode = nodes.find((node) => {
      const distance = Math.sqrt(
        Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2)
      );
      return distance <= getNodeRadius(node.type);
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
    } else {
      setSelectedNode(null);

      // Add new node if simulation is not running
      if (!simulationRunning) {
        const nodeTypes = ["cloud", "fog", "edge", "iot"];
        const randomType =
          nodeTypes[Math.floor(Math.random() * nodeTypes.length)];

        const nodeData = {
          x,
          y,
          type: randomType,
          capacity: getCapacityByType(randomType),
          load: Math.random() * 40,
          cpuUsage: 20 + Math.random() * 40,
          memoryUsage: 25 + Math.random() * 35,
          bandwidth: getBandwidthByType(randomType),
          latency: 5 + Math.random() * 20,
          maxConnections: config.maxConnections,
        };

        socket.emit("addNode", nodeData);
      }
    }
  };

  const getCapacityByType = (type) => {
    const capacities = { cloud: 200, fog: 100, edge: 50, iot: 20 };
    return capacities[type] || 50;
  };

  const getBandwidthByType = (type) => {
    const bandwidths = { cloud: 5001, fog: 1000, edge: 500, iot: 100 };
    return bandwidths[type] || 100;
  };

  const generateNetwork = () => {
    socket.emit("generateNetwork", config);
  };

  const startSimulation = () => {
    setSimulationRunning(true);
    socket.emit("startSimulation");
  };

  const stopSimulation = () => {
    setSimulationRunning(false);
    socket.emit("stopSimulation");
  };

  const updateConfig = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: parseInt(value) || 0 }));
  };

  const getNodeTypeCount = (type) => {
    return nodes.filter((node) => node.type === type).length;
  };

  const exportNetworkData = () => {
    const networkData = {
      timestamp: new Date().toISOString(),
      nodes: nodes,
      connections: connections,
      metrics: metrics,
      config: config,
    };

    const dataStr = JSON.stringify(networkData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = `fog-network-${Date.now()}.json`;
    link.click();
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>🌐 Self-Organizing Fog Network Simulator</h1>
          <div className="simulation-controls">
            <div className="control-group">
              <label>Number of Nodes</label>
              <input
                type="number"
                value={config.nodeCount}
                onChange={(e) => updateConfig("nodeCount", e.target.value)}
                min="5"
                max="100"
                disabled={simulationRunning}
              />
            </div>
            <div className="control-group">
              <label>Max Connections</label>
              <input
                type="number"
                value={config.maxConnections}
                onChange={(e) => updateConfig("maxConnections", e.target.value)}
                min="1"
                max="20"
                disabled={simulationRunning}
              />
            </div>
            <button
              onClick={generateNetwork}
              className="btn-regenerate"
              disabled={simulationRunning}
            >
              🔄 Regenerate Network
            </button>
            <button onClick={exportNetworkData} className="btn-export">
              📊 Export Data
            </button>
            {!simulationRunning ? (
              <button onClick={startSimulation} className="btn-start">
                ▶ Start Simulation
              </button>
            ) : (
              <button onClick={stopSimulation} className="btn-stop">
                ⏹ Stop Simulation
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="main-content">
        <div className="network-section">
          <div className="canvas-container">
            <canvas
              ref={canvasRef}
              width={1200}
              height={700}
              onClick={handleCanvasClick}
              className="network-canvas"
            />
            <div className="canvas-overlay">
              <div className="legend">
                <div className="legend-item">
                  <div className="legend-color cloud"></div>
                  <span>Cloud ({getNodeTypeCount("cloud")})</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color fog"></div>
                  <span>Fog ({getNodeTypeCount("fog")})</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color edge"></div>
                  <span>Edge ({getNodeTypeCount("edge")})</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color iot"></div>
                  <span>IoT ({getNodeTypeCount("iot")})</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar">
          <div className="stats-panel">
            <h2>📊 Network Statistics</h2>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-value">{nodes.length}</div>
                <div className="metric-label">Total Nodes</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{connections.length}</div>
                <div className="metric-label">Total Connections</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">
                  {metrics.totalResources
                    ? metrics.totalResources.toFixed(0)
                    : "0"}
                </div>
                <div className="metric-label">Total Resources</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">
                  {nodes.length
                    ? (connections.length / nodes.length).toFixed(2)
                    : "0"}
                </div>
                <div className="metric-label">Avg Connections</div>
              </div>
            </div>

            <div className="advanced-metrics">
              <h3>Advanced Metrics</h3>
              <div className="metric-bar">
                <label>Network Efficiency</label>
                <div className="bar-container">
                  <div
                    className="bar-fill efficiency"
                    style={{ width: `${metrics.networkEfficiency || 0}%` }}
                  ></div>
                  <span>
                    {metrics.networkEfficiency
                      ? metrics.networkEfficiency.toFixed(1)
                      : "0"}
                    %
                  </span>
                </div>
              </div>
              <div className="metric-bar">
                <label>Load Balance</label>
                <div className="bar-container">
                  <div
                    className="bar-fill balance"
                    style={{ width: `${metrics.loadBalanceScore || 0}%` }}
                  ></div>
                  <span>
                    {metrics.loadBalanceScore
                      ? metrics.loadBalanceScore.toFixed(1)
                      : "0"}
                    %
                  </span>
                </div>
              </div>
              <div className="metric-bar">
                <label>Avg Latency</label>
                <div className="bar-container">
                  <div
                    className="bar-fill latency"
                    style={{ width: `${100 - (metrics.avgLatency || 0) * 2}%` }}
                  ></div>
                  <span>{(metrics.avgLatency || 0).toFixed(1)}ms</span>
                </div>
              </div>
            </div>
          </div>

          {selectedNode && (
            <div className="node-details-panel">
              <h2>🔍 Node Details</h2>
              <div className="node-header">
                <div className={`node-type-badge ${selectedNode.type}`}>
                  {selectedNode.type.toUpperCase()}
                </div>
                <div className="node-id">{selectedNode.id}</div>
              </div>

              <div className="node-stats">
                <div className="stat-row">
                  <span>Load</span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${selectedNode.load}%` }}
                    ></div>
                    <span>{selectedNode.load.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="stat-row">
                  <span>CPU Usage</span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${selectedNode.cpuUsage}%` }}
                    ></div>
                    <span>{selectedNode.cpuUsage.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="stat-row">
                  <span>Memory Usage</span>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${selectedNode.memoryUsage}%` }}
                    ></div>
                    <span>{selectedNode.memoryUsage.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="stat-row">
                  <span>Connections</span>
                  <span>
                    {selectedNode.connections} / {selectedNode.maxConnections}
                  </span>
                </div>
                <div className="stat-row">
                  <span>Bandwidth</span>
                  <span>{selectedNode.bandwidth} Mbps</span>
                </div>
                <div className="stat-row">
                  <span>Energy Consumption</span>
                  <span>
                    {selectedNode.energyConsumption
                      ? selectedNode.energyConsumption.toFixed(2)
                      : "0"}{" "}
                    W
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
