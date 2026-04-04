import type { ApiGraphResponse } from '../types/api';
import type { DaliNodeType, DaliEdgeType } from '../types/domain';
import type { LoomNode, LoomEdge } from '../types/graph';
import type { ExploreResult, SchemaNode } from '../services/lineage';

// ─── Map Dali node type → React Flow node type string ───────────────────────
const NODE_TYPE_MAP: Record<DaliNodeType, string> = {
  DaliDatabase:     'schemaNode',
  DaliSchema:       'schemaNode',
  DaliPackage:      'packageNode',
  DaliTable:        'tableNode',
  DaliColumn:       'columnNode',
  DaliOutputColumn: 'columnNode',
  DaliAtom:         'atomNode',
  DaliRoutine:      'routineNode',
  DaliStatement:    'routineNode',
  DaliSession:      'routineNode',
  DaliJoin:         'routineNode',
  DaliParameter:    'columnNode',
  DaliVariable:     'columnNode',
};

// ─── Node types that support drilling down ───────────────────────────────────
const DRILLABLE_TYPES = new Set<DaliNodeType>([
  'DaliDatabase', 'DaliSchema', 'DaliPackage', 'DaliTable',
]);

// ─── SEER Design System v1.1 — Amber Forest edge colours ────────────────────
//   --inf #88B8A8  READS_FROM   solid 1.5px
//   --wrn #D4922A  WRITES_TO    dashed 5 3  1.5px
//   --acc #A8B860  DATA_FLOW    animated dashed
//   --t3  #665c48  HAS_COLUMN   dashed 1px

const ANIMATED_EDGES = new Set<DaliEdgeType>([
  'DATA_FLOW', 'ATOM_PRODUCES', 'FILTER_FLOW',
  'JOIN_FLOW', 'UNION_FLOW',
]);

function getEdgeStyle(type: DaliEdgeType): React.CSSProperties {
  switch (type) {
    case 'READS_FROM':      return { stroke: '#88B8A8', strokeWidth: 1.5 };
    case 'WRITES_TO':       return { stroke: '#D4922A', strokeWidth: 1.5, strokeDasharray: '5 3' };
    case 'DATA_FLOW':       return { stroke: '#A8B860', strokeWidth: 1.5 };
    case 'FILTER_FLOW':     return { stroke: '#D4922A', strokeWidth: 1.5 };
    case 'JOIN_FLOW':       return { stroke: '#88B8A8', strokeWidth: 1.5 };
    case 'UNION_FLOW':      return { stroke: '#A8B860', strokeWidth: 1.5 };
    case 'ATOM_PRODUCES':   return { stroke: '#A8B860', strokeWidth: 1.5 };
    case 'ATOM_REF_COLUMN': return { stroke: '#88B8A8', strokeWidth: 1 };
    case 'HAS_ATOM':        return { stroke: '#88B8A8', strokeWidth: 1 };
    case 'HAS_COLUMN':      return { stroke: '#665c48', strokeWidth: 1, strokeDasharray: '4 3' };
    default:                return { stroke: '#42382a', strokeWidth: 1, strokeDasharray: '4 3' };
  }
}

// ─── Main transform ──────────────────────────────────────────────────────────
export function transformGraph(response: ApiGraphResponse): {
  nodes: LoomNode[];
  edges: LoomEdge[];
} {
  const nodes: LoomNode[] = response.nodes.map((n) => ({
    id: n.id,
    type: NODE_TYPE_MAP[n.type] ?? 'schemaNode',
    position: { x: 0, y: 0 }, // overwritten by ELK layout
    data: n.data,
  }));

  const edges: LoomEdge[] = response.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    animated: ANIMATED_EDGES.has(e.type),
    style: getEdgeStyle(e.type),
    data: { edgeType: e.type },
  }));

  return { nodes, edges };
}

// ─── LOOM-020: GraphQL ExploreResult → LoomNode[] / LoomEdge[] ───────────────
// Used by all L2/L3 views: explore, lineage, upstream, downstream.

export function transformGqlExplore(result: ExploreResult): {
  nodes: LoomNode[];
  edges: LoomEdge[];
} {
  const nodes: LoomNode[] = result.nodes.map((n) => {
    const nodeType = n.type as DaliNodeType;
    return {
      id: n.id,
      type: NODE_TYPE_MAP[nodeType] ?? 'schemaNode',
      position: { x: 0, y: 0 },
      data: {
        label: n.label,
        nodeType,
        childrenAvailable: DRILLABLE_TYPES.has(nodeType),
        metadata: { scope: n.scope },
        schema: n.scope || undefined,
      },
    };
  });

  const edges: LoomEdge[] = result.edges.map((e) => {
    const edgeType = e.type as DaliEdgeType;
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      animated: ANIMATED_EDGES.has(edgeType),
      style: getEdgeStyle(edgeType),
      data: { edgeType },
    };
  });

  return { nodes, edges };
}

// ─── LOOM-020: GraphQL SchemaNode[] → LoomNode[] (L1 Overview) ───────────────
// Overview has no edges — schemas are shown as standalone cards.

export function transformGqlOverview(schemas: SchemaNode[]): {
  nodes: LoomNode[];
  edges: LoomEdge[];
} {
  const nodes: LoomNode[] = schemas.map((s) => ({
    id: s.id,
    type: 'schemaNode',
    position: { x: 0, y: 0 },
    data: {
      label: s.name,
      nodeType: 'DaliSchema' as DaliNodeType,
      childrenAvailable: true,
      metadata: {},
      tablesCount: s.tableCount,
      routinesCount: s.routineCount + s.packageCount,
    },
  }));

  return { nodes, edges: [] };
}
