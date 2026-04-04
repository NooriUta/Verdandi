import { create } from 'zustand';
import type { BreadcrumbItem, ViewLevel } from '../types/domain';

interface LoomStore {
  // ── View state ────────────────────────────────────────────────────────────
  viewLevel: ViewLevel;
  currentScope: string | null;
  navigationStack: BreadcrumbItem[];

  // ── Selection / highlight ─────────────────────────────────────────────────
  selectedNodeId: string | null;
  highlightedNodes: Set<string>;
  highlightedEdges: Set<string>;

  // ── Theme / Palette ───────────────────────────────────────────────────────
  theme: 'dark' | 'light';
  palette: string;

  // ── Graph stats (updated by LoomCanvas after layout) ─────────────────────
  nodeCount: number;
  edgeCount: number;
  zoom: number;

  // ── Actions ───────────────────────────────────────────────────────────────
  drillDown: (nodeId: string, label: string) => void;
  navigateBack: (index: number) => void;
  navigateToLevel: (level: ViewLevel) => void;
  selectNode: (nodeId: string | null) => void;
  clearHighlight: () => void;
  setGraphStats: (nodeCount: number, edgeCount: number) => void;
  setZoom: (zoom: number) => void;
  toggleTheme: () => void;
  setPalette: (name: string) => void;
}

export const useLoomStore = create<LoomStore>((set, get) => ({
  // ── Initial state ─────────────────────────────────────────────────────────
  viewLevel: 'L1',
  currentScope: null,
  navigationStack: [],
  selectedNodeId: null,
  highlightedNodes: new Set<string>(),
  highlightedEdges: new Set<string>(),
  theme: (localStorage.getItem('seer-theme') as 'dark' | 'light') ?? 'dark',
  palette: localStorage.getItem('seer-palette') ?? 'amber-forest',
  nodeCount: 0,
  edgeCount: 0,
  zoom: 1,

  // ── drillDown: push current level onto stack, advance ────────────────────
  drillDown: (nodeId, label) => {
    const { viewLevel, currentScope, navigationStack } = get();
    const nextLevel: ViewLevel = viewLevel === 'L1' ? 'L2' : 'L3';
    console.log(`[LOOM] drillDown → ${nextLevel}, scope=${nodeId}, label=${label}`);
    set({
      viewLevel: nextLevel,
      currentScope: nodeId,
      // L1 → L2: the root "Overview" button already represents L1, no stack push needed.
      // L2 → L3: push the current L2 scope so the breadcrumb shows the intermediate step.
      navigationStack:
        viewLevel === 'L1'
          ? []
          : [...navigationStack, { level: viewLevel, scope: currentScope, label }],
      selectedNodeId: null,
    });
  },

  // ── navigateBack: pop stack back to given breadcrumb index ───────────────
  navigateBack: (index) => {
    const { navigationStack } = get();
    const item = navigationStack[index];
    if (!item) return;
    console.log(`[LOOM] navigateBack → level=${item.level}, scope=${item.scope}`);
    set({
      viewLevel: item.level,
      currentScope: item.scope,
      navigationStack: navigationStack.slice(0, index),
      selectedNodeId: null,
    });
  },

  // ── navigateToLevel: jump directly to a level (resets scope) ─────────────
  navigateToLevel: (level) => {
    set({ viewLevel: level, currentScope: null, navigationStack: [], selectedNodeId: null });
  },

  // ── selectNode ────────────────────────────────────────────────────────────
  selectNode: (nodeId) => {
    console.log(`[LOOM] selectNode → ${nodeId}`);
    set({ selectedNodeId: nodeId });
  },

  // ── clearHighlight ────────────────────────────────────────────────────────
  clearHighlight: () => {
    set({ highlightedNodes: new Set<string>(), highlightedEdges: new Set<string>() });
  },

  // ── setGraphStats (called by canvas after render) ─────────────────────────
  setGraphStats: (nodeCount, edgeCount) => set({ nodeCount, edgeCount }),

  // ── setZoom (called by canvas onMoveEnd) ─────────────────────────────────
  setZoom: (zoom) => set({ zoom }),

  // ── toggleTheme ───────────────────────────────────────────────────────────
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('seer-theme', next);
    document.documentElement.setAttribute('data-theme', next);
    set({ theme: next });
  },

  // ── setPalette ────────────────────────────────────────────────────────────
  setPalette: (name) => {
    localStorage.setItem('seer-palette', name);
    if (name === 'amber-forest') {
      document.documentElement.removeAttribute('data-palette');
    } else {
      document.documentElement.setAttribute('data-palette', name);
    }
    set({ palette: name });
  },
}));
