#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = 'C:/study/SafeAlert';
const INT = path.join(ROOT, '.understand-anything/intermediate');
const OUT = path.join(ROOT, '.understand-anything');

const graph = JSON.parse(fs.readFileSync(path.join(INT, 'assembled-graph.json'), 'utf8'));
const layers = JSON.parse(fs.readFileSync(path.join(INT, 'layers.json'), 'utf8'));
const tour = JSON.parse(fs.readFileSync(path.join(INT, 'tour.json'), 'utf8'));
const scan = JSON.parse(fs.readFileSync(path.join(INT, 'scan-result.json'), 'utf8'));

// Build knowledge graph
const knowledgeGraph = {
  version: '2.7.7',
  generatedAt: new Date().toISOString(),
  project: {
    name: scan.projectName || 'SafeAlert',
    description: scan.projectDescription || '기상청·행정안전부·환경부 공공 API 기반 실시간 재난/날씨/미세먼지 알림 MSA 플랫폼',
    rootPath: ROOT,
    languages: scan.languages || ['Java', 'JavaScript', 'SQL', 'YAML'],
    frameworks: scan.frameworks || ['Spring Boot', 'Spring Cloud Gateway', 'React', 'Kafka', 'Redis', 'MongoDB', 'PostgreSQL', 'Kubernetes'],
    outputLanguage: 'ko'
  },
  stats: {
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    layerCount: layers.length,
    tourStepCount: tour.length,
    nodeTypes: graph.nodes.reduce((acc, n) => { acc[n.type] = (acc[n.type] || 0) + 1; return acc; }, {}),
    edgeTypes: graph.edges.reduce((acc, e) => { acc[e.type] = (acc[e.type] || 0) + 1; return acc; }, {})
  },
  nodes: graph.nodes,
  edges: graph.edges,
  layers: layers,
  tour: tour
};

fs.writeFileSync(
  path.join(OUT, 'knowledge-graph.json'),
  JSON.stringify(knowledgeGraph, null, 2)
);

console.log('knowledge-graph.json written successfully');
console.log(`  nodes: ${knowledgeGraph.stats.nodeCount}`);
console.log(`  edges: ${knowledgeGraph.stats.edgeCount}`);
console.log(`  layers: ${knowledgeGraph.stats.layerCount}`);
console.log(`  tour steps: ${knowledgeGraph.stats.tourStepCount}`);
console.log('  nodeTypes:', JSON.stringify(knowledgeGraph.stats.nodeTypes));
console.log('  edgeTypes:', JSON.stringify(knowledgeGraph.stats.edgeTypes));
