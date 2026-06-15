#!/usr/bin/env node
'use strict';

const fs = require('fs');

const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
  console.error('Usage: node ua-arch-analyze.js <input.json> <output.json>');
  process.exit(1);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
} catch (e) {
  console.error('Failed to read input:', e.message);
  process.exit(1);
}

const { fileNodes, importEdges, allEdges } = data;

// ── A. Directory Grouping ──────────────────────────────────────────
function getFilePath(node) {
  return node.filePath || node.name || '';
}

const allPaths = fileNodes.map(n => getFilePath(n));

// Find common prefix
function commonPrefix(paths) {
  if (!paths.length) return '';
  const parts0 = paths[0].replace(/\\/g, '/').split('/');
  let prefix = [];
  for (let i = 0; i < parts0.length - 1; i++) {
    const seg = parts0[i];
    if (paths.every(p => p.replace(/\\/g, '/').split('/')[i] === seg)) {
      prefix.push(seg);
    } else break;
  }
  return prefix.join('/');
}

const commonPfx = commonPrefix(allPaths);

function getGroupKey(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  let relative = normalized;
  if (commonPfx && normalized.startsWith(commonPfx + '/')) {
    relative = normalized.slice(commonPfx.length + 1);
  }
  const parts = relative.split('/');
  if (parts.length <= 1) return 'root';
  return parts[0];
}

const directoryGroups = {};
fileNodes.forEach(node => {
  const fp = getFilePath(node);
  const grp = getGroupKey(fp);
  if (!directoryGroups[grp]) directoryGroups[grp] = [];
  directoryGroups[grp].push(node.id);
});

// ── B. Node Type Grouping ──────────────────────────────────────────
const nodeTypeGroups = {};
fileNodes.forEach(node => {
  const t = node.type || 'file';
  if (!nodeTypeGroups[t]) nodeTypeGroups[t] = [];
  nodeTypeGroups[t].push(node.id);
});

// ── C. Import Adjacency ────────────────────────────────────────────
const fanIn = {};
const fanOut = {};
fileNodes.forEach(n => { fanIn[n.id] = 0; fanOut[n.id] = 0; });

importEdges.forEach(e => {
  if (fanOut[e.source] !== undefined) fanOut[e.source]++;
  if (fanIn[e.target] !== undefined) fanIn[e.target]++;
});

// ── D. Cross-Category Dependency Analysis ─────────────────────────
const nodeTypeMap = {};
fileNodes.forEach(n => { nodeTypeMap[n.id] = n.type || 'file'; });

const crossCatMap = {};
allEdges.forEach(e => {
  const fromType = nodeTypeMap[e.source] || 'unknown';
  const toType = nodeTypeMap[e.target] || 'unknown';
  const key = `${fromType}->${toType}::${e.type}`;
  crossCatMap[key] = (crossCatMap[key] || 0) + 1;
});

const crossCategoryEdges = Object.entries(crossCatMap).map(([k, count]) => {
  const [pair, edgeType] = k.split('::');
  const [fromType, toType] = pair.split('->');
  return { fromType, toType, edgeType, count };
}).sort((a, b) => b.count - a.count);

// ── E. Inter-Group Import Frequency ───────────────────────────────
const nodeGroupMap = {};
fileNodes.forEach(node => {
  nodeGroupMap[node.id] = getGroupKey(getFilePath(node));
});

const interGroupMap = {};
importEdges.forEach(e => {
  const fromGrp = nodeGroupMap[e.source];
  const toGrp = nodeGroupMap[e.target];
  if (!fromGrp || !toGrp || fromGrp === toGrp) return;
  const key = `${fromGrp}->${toGrp}`;
  interGroupMap[key] = (interGroupMap[key] || 0) + 1;
});

const interGroupImports = Object.entries(interGroupMap).map(([k, count]) => {
  const [from, to] = k.split('->');
  return { from, to, count };
}).sort((a, b) => b.count - a.count);

// ── F. Intra-Group Import Density ─────────────────────────────────
const groupEdgeCounts = {};
const groupInternalEdges = {};
Object.keys(directoryGroups).forEach(g => {
  groupEdgeCounts[g] = 0;
  groupInternalEdges[g] = 0;
});

importEdges.forEach(e => {
  const fromGrp = nodeGroupMap[e.source];
  const toGrp = nodeGroupMap[e.target];
  if (fromGrp) groupEdgeCounts[fromGrp] = (groupEdgeCounts[fromGrp] || 0) + 1;
  if (toGrp && toGrp !== fromGrp) groupEdgeCounts[toGrp] = (groupEdgeCounts[toGrp] || 0) + 1;
  if (fromGrp && toGrp && fromGrp === toGrp) {
    groupInternalEdges[fromGrp] = (groupInternalEdges[fromGrp] || 0) + 1;
  }
});

const intraGroupDensity = {};
Object.keys(directoryGroups).forEach(g => {
  const total = groupEdgeCounts[g] || 0;
  const internal = groupInternalEdges[g] || 0;
  intraGroupDensity[g] = {
    internalEdges: internal,
    totalEdges: total,
    density: total > 0 ? +(internal / total).toFixed(3) : 0
  };
});

// ── G. Directory Pattern Matching ─────────────────────────────────
const dirPatterns = {
  routes: 'api', api: 'api', controllers: 'api', endpoints: 'api', handlers: 'api',
  controller: 'api', routers: 'api', blueprints: 'api', serializers: 'api',
  services: 'service', core: 'service', lib: 'service', domain: 'service', logic: 'service',
  composables: 'service', internal: 'service', signals: 'service', mailers: 'service',
  jobs: 'service', channels: 'service',
  models: 'data', db: 'data', data: 'data', persistence: 'data', repository: 'data',
  entities: 'data', migrations: 'data', entity: 'data', sql: 'data', database: 'data',
  schema: 'data',
  components: 'ui', views: 'ui', pages: 'ui', ui: 'ui', layouts: 'ui', screens: 'ui',
  middleware: 'middleware', plugins: 'middleware', interceptors: 'middleware', guards: 'middleware',
  utils: 'utility', helpers: 'utility', common: 'utility', shared: 'utility', tools: 'utility',
  pkg: 'utility', templatetags: 'utility',
  config: 'config', constants: 'config', env: 'config', settings: 'config',
  management: 'config', commands: 'config',
  '__tests__': 'test', test: 'test', tests: 'test', spec: 'test', specs: 'test',
  types: 'types', interfaces: 'types', schemas: 'types', contracts: 'types', dtos: 'types',
  dto: 'types', request: 'types', response: 'types',
  hooks: 'hooks',
  store: 'state', state: 'state', reducers: 'state', actions: 'state', slices: 'state',
  assets: 'assets', static: 'assets', public: 'assets',
  docs: 'documentation', documentation: 'documentation', wiki: 'documentation',
  deploy: 'infrastructure', deployment: 'infrastructure', infra: 'infrastructure',
  infrastructure: 'infrastructure', k8s: 'infrastructure', kubernetes: 'infrastructure',
  helm: 'infrastructure', charts: 'infrastructure', terraform: 'infrastructure',
  tf: 'infrastructure', docker: 'infrastructure',
  '.github': 'ci-cd', '.gitlab': 'ci-cd', '.circleci': 'ci-cd',
  cmd: 'entry', bin: 'entry', frontend: 'ui',
  'load-test': 'test',
};

const patternMatches = {};
Object.keys(directoryGroups).forEach(grp => {
  patternMatches[grp] = dirPatterns[grp.toLowerCase()] || 'unknown';
});

// Also check file-level patterns for groups not yet matched
fileNodes.forEach(node => {
  const fp = getFilePath(node).replace(/\\/g, '/');
  const fileName = fp.split('/').pop() || '';
  const grp = nodeGroupMap[node.id];
  if (!grp) return;

  // Already matched
  if (patternMatches[grp] && patternMatches[grp] !== 'unknown') return;

  if (/\.(test|spec)\.[^.]+$/.test(fileName) || /^test_/.test(fileName) || /_test\.[^.]+$/.test(fileName)) {
    patternMatches[grp] = 'test';
  } else if (/\.d\.ts$/.test(fileName)) {
    patternMatches[grp] = 'types';
  } else if (/^(Dockerfile|docker-compose)/.test(fileName) || /\.(tf|tfvars)$/.test(fileName)) {
    patternMatches[grp] = 'infrastructure';
  } else if (/\.(md|rst)$/.test(fileName)) {
    patternMatches[grp] = 'documentation';
  }
});

// ── H. Deployment Topology Detection ──────────────────────────────
const infraFiles = [];
let hasDockerfile = false, hasCompose = false, hasK8s = false, hasTerraform = false, hasCI = false;

fileNodes.forEach(node => {
  const fp = getFilePath(node).replace(/\\/g, '/');
  const fileName = fp.split('/').pop() || '';
  if (/^Dockerfile/.test(fileName)) { hasDockerfile = true; infraFiles.push(fp); }
  if (/^docker-compose/.test(fileName)) { hasCompose = true; infraFiles.push(fp); }
  if (fp.includes('k8s/') || fp.includes('kubernetes/') || fp.includes('helm/')) { hasK8s = true; infraFiles.push(fp); }
  if (/\.(tf|tfvars)$/.test(fileName)) { hasTerraform = true; infraFiles.push(fp); }
  if (fp.includes('.github/workflows/') || /^(Jenkinsfile|\.gitlab-ci\.yml)$/.test(fileName)) { hasCI = true; infraFiles.push(fp); }
});

const deploymentTopology = { hasDockerfile, hasCompose, hasK8s, hasTerraform, hasCI, infraFiles };

// ── I. Data Pipeline Detection ─────────────────────────────────────
const schemaFiles = [], migrationFiles = [], dataModelFiles = [], apiHandlerFiles = [];

fileNodes.forEach(node => {
  const fp = getFilePath(node).replace(/\\/g, '/');
  const fileName = fp.split('/').pop() || '';
  if (/\.(sql|graphql|gql|proto|prisma)$/.test(fileName) || node.type === 'schema') schemaFiles.push(fp);
  if (fp.includes('migration') || fp.includes('Migration')) migrationFiles.push(fp);
  if (fp.includes('model') || fp.includes('Model') || fp.includes('entity') || node.type === 'table') dataModelFiles.push(fp);
  if (fp.includes('route') || fp.includes('controller') || fp.includes('Controller') || fp.includes('handler')) apiHandlerFiles.push(fp);
});

const dataPipeline = { schemaFiles, migrationFiles, dataModelFiles, apiHandlerFiles };

// ── J. Documentation Coverage ─────────────────────────────────────
const groupsWithDocs = new Set();
fileNodes.forEach(node => {
  const fp = getFilePath(node).replace(/\\/g, '/');
  const fileName = fp.split('/').pop() || '';
  if (/\.(md|rst)$/.test(fileName) || node.type === 'document') {
    const grp = nodeGroupMap[node.id];
    if (grp) groupsWithDocs.add(grp);
  }
});

const totalGroups = Object.keys(directoryGroups).length;
const undocumentedGroups = Object.keys(directoryGroups).filter(g => !groupsWithDocs.has(g));
const docCoverage = {
  groupsWithDocs: groupsWithDocs.size,
  totalGroups,
  coverageRatio: +(groupsWithDocs.size / totalGroups).toFixed(2),
  undocumentedGroups
};

// ── K. Dependency Direction ────────────────────────────────────────
const pairCounts = {};
importEdges.forEach(e => {
  const fromGrp = nodeGroupMap[e.source];
  const toGrp = nodeGroupMap[e.target];
  if (!fromGrp || !toGrp || fromGrp === toGrp) return;
  const fwd = `${fromGrp}->${toGrp}`;
  const rev = `${toGrp}->${fromGrp}`;
  pairCounts[fwd] = (pairCounts[fwd] || 0) + 1;
  if (!pairCounts[rev]) pairCounts[rev] = 0;
});

const dependencyDirection = [];
const visited = new Set();
Object.entries(pairCounts).forEach(([key, count]) => {
  const [from, to] = key.split('->');
  const revKey = `${to}->${from}`;
  const pairKey = [from, to].sort().join('|');
  if (visited.has(pairKey)) return;
  visited.add(pairKey);
  const revCount = pairCounts[revKey] || 0;
  if (count > revCount) {
    dependencyDirection.push({ dependent: from, dependsOn: to });
  } else if (revCount > count) {
    dependencyDirection.push({ dependent: to, dependsOn: from });
  }
});

// ── File Stats ────────────────────────────────────────────────────
const filesPerGroup = {};
Object.entries(directoryGroups).forEach(([g, ids]) => { filesPerGroup[g] = ids.length; });

const nodeTypeCounts = {};
fileNodes.forEach(n => {
  const t = n.type || 'file';
  nodeTypeCounts[t] = (nodeTypeCounts[t] || 0) + 1;
});

const fileStats = {
  totalFileNodes: fileNodes.length,
  filesPerGroup,
  nodeTypeCounts
};

// ── Top fan-in / fan-out ───────────────────────────────────────────
const fileFanIn = fanIn;
const fileFanOut = fanOut;

// ── Output ────────────────────────────────────────────────────────
const result = {
  scriptCompleted: true,
  directoryGroups,
  nodeTypeGroups,
  crossCategoryEdges,
  interGroupImports,
  intraGroupDensity,
  patternMatches,
  deploymentTopology,
  dataPipeline,
  docCoverage,
  dependencyDirection,
  fileStats,
  fileFanIn,
  fileFanOut
};

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('Analysis complete. Output written to', outputPath);
console.log('Directory groups:', Object.keys(directoryGroups).join(', '));
console.log('Total nodes:', fileNodes.length);
