import type { LoomNode, LoomEdge } from '../types/graph';

// ─── Node dimension hints for ELK ────────────────────────────────────────────
const NODE_WIDTH  = 240;
const NODE_HEIGHT_BASE = 80;
const COLUMN_ROW_HEIGHT = 22;

function getNodeHeight(node: LoomNode): number {
  if (node.type === 'tableNode') {
    const cols = node.data.columns?.length ?? 0;
    return NODE_HEIGHT_BASE + Math.min(cols, 7) * COLUMN_ROW_HEIGHT + 24;
  }
  return NODE_HEIGHT_BASE;
}

// ─── Fallback grid layout (used if ELK fails) ────────────────────────────────
function applyGridLayout(nodes: LoomNode[]): LoomNode[] {
  const cols = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
  return nodes.map((node, i) => ({
    ...node,
    position: {
      x: (i % cols) * (NODE_WIDTH + 60),
      y: Math.floor(i / cols) * (NODE_HEIGHT_BASE + 60),
    },
  }));
}

// ─── ELK types (minimal, avoids dependency on @types/elkjs) ──────────────────
interface ElkNode {
  id: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}
interface ElkEdge {
  id: string;
  sources: string[];
  targets: string[];
}
interface ElkGraph {
  id: string;
  layoutOptions?: Record<string, string>;
  children: ElkNode[];
  edges: ElkEdge[];
}
interface ElkApi {
  layout: (graph: ElkGraph) => Promise<ElkGraph & { children: ElkNode[] }>;
}

// Singleton ELK instance (lazy-initialised)
let elkInstance: ElkApi | null = null;

async function getElk(): Promise<ElkApi | null> {
  if (elkInstance) return elkInstance;
  try {
    // elk.bundled.js = no web workers, runs in main thread
    const mod = await import('elkjs/lib/elk.bundled.js');
    const ELK = mod.default as new () => ElkApi;
    elkInstance = new ELK();
    return elkInstance;
  } catch (err) {
    console.warn('[LOOM] ELK load failed, using grid layout fallback.', err);
    return null;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function applyELKLayout(
  nodes: LoomNode[],
  edges: LoomEdge[],
): Promise<LoomNode[]> {
  if (nodes.length === 0) return nodes;

  const elk = await getElk();
  if (!elk) return applyGridLayout(nodes);

  const graph: ElkGraph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm':                                  'layered',
      'elk.direction':                                  'RIGHT',
      'elk.layered.spacing.nodeNodeBetweenLayers':      '100',
      'elk.spacing.nodeNode':                           '50',
      'elk.layered.crossingMinimization.strategy':      'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy':             'BRANDES_KOEPF',
    },
    children: nodes.map((n) => ({
      id:     n.id,
      width:  NODE_WIDTH,
      height: getNodeHeight(n),
    })),
    edges: edges.map((e) => ({
      id:      e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  try {
    const result = await elk.layout(graph);
    return nodes.map((node) => {
      const laid = result.children.find((c) => c.id === node.id);
      if (!laid) return node;
      return { ...node, position: { x: laid.x ?? 0, y: laid.y ?? 0 } };
    });
  } catch (err) {
    console.warn('[LOOM] ELK layout error, using grid layout fallback.', err);
    return applyGridLayout(nodes);
  }
}
