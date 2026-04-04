import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  type OnMoveEnd,
} from '@xyflow/react';

import { SchemaNode }  from './nodes/SchemaNode';
import { PackageNode } from './nodes/PackageNode';
import { TableNode }   from './nodes/TableNode';
import { RoutineNode } from './nodes/RoutineNode';
import { ColumnNode }  from './nodes/ColumnNode';
import { Breadcrumb }  from './Breadcrumb';

import { useLoomStore }                          from '../../stores/loomStore';
import { transformGqlOverview, transformGqlExplore } from '../../utils/transformGraph';
import { applyELKLayout }                        from '../../utils/layoutGraph';
import { useOverview, useExplore, useLineage }   from '../../services/hooks';
import { isUnauthorized }                        from '../../services/lineage';
import type { LoomNode, LoomEdge }               from '../../types/graph';

// ─── nodeTypes must be defined OUTSIDE the render function ───────────────────
const NODE_TYPES: NodeTypes = {
  schemaNode:  SchemaNode  as NodeTypes[string],
  packageNode: PackageNode as NodeTypes[string],
  tableNode:   TableNode   as NodeTypes[string],
  routineNode: RoutineNode as NodeTypes[string],
  columnNode:  ColumnNode  as NodeTypes[string],
  atomNode:    ColumnNode  as NodeTypes[string], // reuse ColumnNode for atoms
};

// ─── Inner canvas (needs ReactFlowProvider to already be mounted) ─────────────
const LoomCanvasInner = memo(() => {
  const {
    viewLevel,
    currentScope,
    theme,
    setGraphStats,
    setZoom,
    selectNode,
    drillDown,
  } = useLoomStore();
  const { t } = useTranslation();

  const [nodes, setNodes, onNodesChange] = useNodesState<LoomNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<LoomEdge>([]);
  const [layouting, setLayouting] = useState(false);

  // ── Real data queries ───────────────────────────────────────────────────
  // All three are always called (Rules of Hooks); enabled flags prevent firing.
  const overviewQ = useOverview();
  const exploreQ  = useExplore(viewLevel === 'L2' ? currentScope : null);
  const lineageQ  = useLineage(viewLevel === 'L3' ? currentScope : null);

  const activeQuery = viewLevel === 'L1' ? overviewQ
                    : viewLevel === 'L2' ? exploreQ
                    : lineageQ;

  // ── Transform raw GraphQL data → RF nodes / edges ───────────────────────
  const rawGraph = useMemo(() => {
    if (viewLevel === 'L1' && overviewQ.data) return transformGqlOverview(overviewQ.data);
    if (viewLevel === 'L2' && exploreQ.data)  return transformGqlExplore(exploreQ.data);
    if (viewLevel === 'L3' && lineageQ.data)  return transformGqlExplore(lineageQ.data);
    return null;
  }, [viewLevel, overviewQ.data, exploreQ.data, lineageQ.data]);

  // ── ELK layout whenever graph data changes ──────────────────────────────
  useEffect(() => {
    if (!rawGraph) return;
    let cancelled = false;
    setLayouting(true);

    applyELKLayout(rawGraph.nodes, rawGraph.edges)
      .then((layoutedNodes) => {
        if (cancelled) return;
        setNodes(layoutedNodes);
        setEdges(rawGraph.edges);
        setGraphStats(layoutedNodes.length, rawGraph.edges.length);
      })
      .catch((err) => {
        console.error('[LOOM] ELK layout failed', err);
      })
      .finally(() => {
        if (!cancelled) setLayouting(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawGraph]);

  // ── Status message key for error / empty states ─────────────────────────
  const statusKey: string | null = (() => {
    if (activeQuery.isError) {
      return isUnauthorized(activeQuery.error) ? 'status.unauthorized' : 'status.error';
    }
    if (!activeQuery.isLoading && !layouting && rawGraph?.nodes.length === 0) {
      return 'status.empty';
    }
    return null;
  })();

  const isLoading = activeQuery.isLoading || layouting;

  // ── Node interactions ───────────────────────────────────────────────────
  const onNodeClick = useCallback((_: React.MouseEvent, node: LoomNode) => {
    selectNode(node.id);
  }, [selectNode]);

  // Double-click drills down into nodes that have children (Schema → L2, Table → L3)
  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: LoomNode) => {
    if (node.data.childrenAvailable && viewLevel !== 'L3') {
      drillDown(node.id, node.data.label);
    }
  }, [drillDown, viewLevel]);

  // ── Zoom tracking for status bar ────────────────────────────────────────
  const onMoveEnd: OnMoveEnd = useCallback((_: unknown, viewport) => {
    setZoom(viewport.zoom);
  }, [setZoom]);

  // ── Minimap node colour ─────────────────────────────────────────────────
  const minimapNodeColor = useCallback((node: LoomNode) => {
    switch (node.type) {
      case 'tableNode':   return '#A8B860';
      case 'routineNode': return '#7DBF78';
      case 'columnNode':  return '#88B8A8';
      case 'atomNode':    return '#D4922A';
      case 'packageNode':
      default:            return '#665c48';
    }
  }, []);

  const rfTheme = useMemo(
    () => (theme === 'dark' ? 'dark' : 'light') as 'dark' | 'light',
    [theme],
  );

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Loading overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(20,17,8,0.75)', backdropFilter: 'blur(3px)',
          pointerEvents: 'none',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <SpinnerSVG />
            <span style={{ fontSize: '11px', color: 'var(--t3)', letterSpacing: '0.07em' }}>
              {t(activeQuery.isLoading ? 'status.loading' : 'canvas.computingLayout')}
            </span>
          </div>
        </div>
      )}

      {/* Error / empty status message */}
      {statusKey && !isLoading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: '13px', color: 'var(--t3)', letterSpacing: '0.04em' }}>
            {t(statusKey)}
          </span>
        </div>
      )}

      {/* Breadcrumb */}
      <Breadcrumb />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={NODE_TYPES}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onMoveEnd={onMoveEnd}
        onPaneClick={() => selectNode(null)}
        colorMode={rfTheme}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.1}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
      >
        {/* Dot-grid: 24px gap, Amber Forest --bd at opacity 0.3 */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color={theme === 'dark' ? '#42382a4d' : '#d4ccb84d'}
        />
        <Controls position="bottom-right" />
        <MiniMap
          position="bottom-left"
          nodeColor={minimapNodeColor as (node: unknown) => string}
          maskColor={theme === 'dark' ? 'rgba(20,17,8,0.72)' : 'rgba(245,243,238,0.72)'}
          style={{ border: '1px solid var(--bd)', borderRadius: 'var(--seer-radius-md)' }}
        />
      </ReactFlow>
    </div>
  );
});

LoomCanvasInner.displayName = 'LoomCanvasInner';

// ─── Public export wraps with provider ───────────────────────────────────────
export const LoomCanvas = memo(() => (
  <ReactFlowProvider>
    <LoomCanvasInner />
  </ReactFlowProvider>
));

LoomCanvas.displayName = 'LoomCanvas';

// ─── Spinner SVG (no dependency) ─────────────────────────────────────────────
function SpinnerSVG() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
      style={{ animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="14" cy="14" r="11" stroke="var(--seer-border-2)" strokeWidth="2.5" />
      <path d="M14 3 A11 11 0 0 1 25 14" stroke="var(--seer-accent)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
