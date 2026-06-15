#!/usr/bin/env node
'use strict';

const fs = require('fs');

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error('Usage: node ua-tour-analyze.js <input.json> <output.json>');
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
} catch (e) {
  console.error('Failed to read input:', e.message);
  process.exit(1);
}

const { nodes, edges, layers } = data;

// Build node map
const nodeMap = {};
nodes.forEach(n => { nodeMap[n.id] = n; });

// A. Fan-In and Fan-Out
const fanIn = {};
const fanOut = {};
nodes.forEach(n => { fanIn[n.id] = 0; fanOut[n.id] = 0; });

edges.forEach(e => {
  if (fanOut[e.source] !== undefined) fanOut[e.source]++;
  if (fanIn[e.target] !== undefined) fanIn[e.target]++;
});

const fanInRanking = Object.entries(fanIn)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .map(([id, count]) => ({ id, fanIn: count, name: nodeMap[id] ? nodeMap[id].name : id }));

const fanOutRanking = Object.entries(fanOut)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20)
  .map(([id, count]) => ({ id, fanOut: count, name: nodeMap[id] ? nodeMap[id].name : id }));

// C. Entry Point Candidates
const entryFileNames = new Set([
  'index.ts','index.js','main.ts','main.js','app.ts','app.js',
  'server.ts','server.js','mod.rs','main.go','main.py','main.rs',
  'manage.py','app.py','wsgi.py','asgi.py','run.py','__main__.py',
  'Application.java','Main.java','Program.cs','config.ru','index.php',
  'App.swift','Application.kt','main.cpp','main.c',
  'main.jsx','app.jsx','index.jsx'
]);

const totalNodes = nodes.length;
const fanOutValues = Object.values(fanOut).sort((a, b) => a - b);
const fanInValues = Object.values(fanIn).sort((a, b) => a - b);
const top10FanOut = fanOutValues[Math.floor(totalNodes * 0.9)] || 0;
const bottom25FanIn = fanInValues[Math.floor(totalNodes * 0.25)] || 0;

const entryScores = {};
nodes.forEach(n => {
  let score = 0;
  const parts = n.filePath ? n.filePath.split('/') : [];
  const depth = parts.length - 1;

  if (n.type === 'document') {
    if (n.name === 'README.md' && depth === 0) score += 5;
    else if (n.name.endsWith('.md') && depth === 0) score += 2;
  } else {
    if (entryFileNames.has(n.name)) score += 3;
    if (depth <= 1) score += 1;
    if (fanOut[n.id] >= top10FanOut) score += 1;
    if (fanIn[n.id] <= bottom25FanIn) score += 1;
  }
  entryScores[n.id] = score;
});

const entryPointCandidates = Object.entries(entryScores)
  .filter(([, s]) => s > 0)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([id, score]) => ({
    id,
    score,
    name: nodeMap[id] ? nodeMap[id].name : id,
    summary: nodeMap[id] ? nodeMap[id].summary : ''
  }));

// D. BFS Traversal from top code entry point
// Find the top CODE entry point (skip documents)
const topCodeEntry = entryPointCandidates.find(e => {
  const n = nodeMap[e.id];
  return n && n.type === 'file';
});

const bfsStart = topCodeEntry ? topCodeEntry.id : null;
const bfsResult = { startNode: bfsStart, order: [], depthMap: {}, byDepth: {} };

if (bfsStart) {
  // Build adjacency for imports/calls
  const adj = {};
  nodes.forEach(n => { adj[n.id] = []; });
  edges.forEach(e => {
    if ((e.type === 'imports' || e.type === 'calls') && adj[e.source] !== undefined) {
      adj[e.source].push(e.target);
    }
  });

  const visited = new Set();
  const queue = [{ id: bfsStart, depth: 0 }];
  visited.add(bfsStart);

  while (queue.length > 0) {
    const { id, depth } = queue.shift();
    bfsResult.order.push(id);
    bfsResult.depthMap[id] = depth;
    if (!bfsResult.byDepth[depth]) bfsResult.byDepth[depth] = [];
    bfsResult.byDepth[depth].push(id);

    const neighbors = adj[id] || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ id: neighbor, depth: depth + 1 });
      }
    }
  }
}

// E. Non-Code File Inventory
const nonCodeFiles = { documentation: [], infrastructure: [], data: [], config: [] };
const infraTypes = new Set(['service', 'pipeline', 'resource']);
const dataTypes = new Set(['table', 'schema', 'endpoint']);

nodes.forEach(n => {
  const entry = { id: n.id, name: n.name, type: n.type, summary: n.summary || '' };
  if (n.type === 'document') nonCodeFiles.documentation.push(entry);
  else if (infraTypes.has(n.type)) nonCodeFiles.infrastructure.push(entry);
  else if (dataTypes.has(n.type)) nonCodeFiles.data.push(entry);
  else if (n.type === 'config') nonCodeFiles.config.push(entry);
});

// F. Tightly Coupled Clusters
const edgeSet = new Set();
const biEdgePairs = [];
edges.forEach(e => {
  if (e.type === 'imports' || e.type === 'calls') {
    edgeSet.add(`${e.source}→${e.target}`);
  }
});
edges.forEach(e => {
  if (e.type === 'imports' || e.type === 'calls') {
    if (edgeSet.has(`${e.target}→${e.source}`)) {
      const key = [e.source, e.target].sort().join('|');
      if (!biEdgePairs.find(p => p.key === key)) {
        biEdgePairs.push({ key, nodes: [e.source, e.target] });
      }
    }
  }
});

// Expand clusters
const clusters = biEdgePairs.slice(0, 10).map(pair => {
  const clusterNodes = new Set(pair.nodes);
  // Add nodes connected to 2+ cluster members
  nodes.forEach(n => {
    if (clusterNodes.has(n.id)) return;
    let connections = 0;
    clusterNodes.forEach(cn => {
      if (edgeSet.has(`${n.id}→${cn}`) || edgeSet.has(`${cn}→${n.id}`)) connections++;
    });
    if (connections >= 2) clusterNodes.add(n.id);
  });

  const clusterNodeList = Array.from(clusterNodes);
  let edgeCount = 0;
  clusterNodeList.forEach(a => {
    clusterNodeList.forEach(b => {
      if (a !== b && edgeSet.has(`${a}→${b}`)) edgeCount++;
    });
  });

  return { nodes: clusterNodeList, edgeCount };
});

// G. Layer List
const layerList = {
  count: layers ? layers.length : 0,
  list: layers || []
};

// H. Node Summary Index
const nodeSummaryIndex = {};
nodes.forEach(n => {
  nodeSummaryIndex[n.id] = {
    name: n.name,
    type: n.type,
    summary: n.summary || ''
  };
});

const result = {
  scriptCompleted: true,
  entryPointCandidates,
  fanInRanking,
  fanOutRanking,
  bfsTraversal: bfsResult,
  nonCodeFiles,
  clusters,
  layers: layerList,
  nodeSummaryIndex,
  totalNodes: nodes.length,
  totalEdges: edges.length
};

try {
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
  console.log('Analysis complete. Output written to', outputPath);
  console.log('Entry points:', entryPointCandidates.map(e => `${e.name}(${e.score})`).join(', '));
  console.log('BFS start:', bfsResult.startNode, '| Visited:', bfsResult.order.length, 'nodes');
  console.log('Clusters found:', clusters.length);
} catch (e) {
  console.error('Failed to write output:', e.message);
  process.exit(1);
}
