// ─── Dali Node Types ────────────────────────────────────────────────────────
export type DaliNodeType =
  | 'DaliDatabase'
  | 'DaliSchema'
  | 'DaliPackage'
  | 'DaliTable'
  | 'DaliColumn'
  | 'DaliJoin'
  | 'DaliRoutine'
  | 'DaliStatement'
  | 'DaliSession'
  | 'DaliAtom'
  | 'DaliOutputColumn'
  | 'DaliParameter'
  | 'DaliVariable';

// ─── Dali Edge Types ─────────────────────────────────────────────────────────
export type DaliEdgeType =
  | 'HAS_ATOM'
  | 'ATOM_REF_COLUMN'
  | 'ATOM_REF_TABLE'
  | 'HAS_COLUMN'
  | 'HAS_JOIN'
  | 'READS_FROM'
  | 'WRITES_TO'
  | 'CONTAINS_STMT'
  | 'CONTAINS_ROUTINE'
  | 'CONTAINS_TABLE'
  | 'CONTAINS_PACKAGE'
  | 'BELONGS_TO_SESSION'
  | 'CALLS'
  | 'CHILD_OF'
  | 'USES_SUBQUERY'
  | 'NESTED_IN'
  | 'HAS_OUTPUT_COL'
  | 'HAS_PARAMETER'
  | 'HAS_VARIABLE'
  | 'DATA_FLOW'
  | 'FILTER_FLOW'
  | 'JOIN_FLOW'
  | 'UNION_FLOW'
  | 'ATOM_PRODUCES'
  | 'ROUTINE_USES_TABLE';

// ─── Visualisation levels ────────────────────────────────────────────────────
export type ViewLevel = 'L1' | 'L2' | 'L3';

// ─── Column info (used inside TableNodeData) ─────────────────────────────────
export interface ColumnInfo {
  id: string;
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isForeignKey?: boolean;
}

// ─── Base node data (all nodes share this) ───────────────────────────────────
export interface DaliNodeData {
  label: string;
  nodeType: DaliNodeType;
  childrenAvailable: boolean;
  metadata: Record<string, unknown>;
  // Schema
  tablesCount?: number;
  routinesCount?: number;
  // Table
  schema?: string;
  columns?: ColumnInfo[];
  // Package / Routine
  packageType?: string;
  language?: string;
  // Atom / Column
  operation?: string;
  dataType?: string;
}

// ─── Typed sub-interfaces ────────────────────────────────────────────────────
export interface SchemaNodeData extends DaliNodeData {
  nodeType: 'DaliSchema';
  tablesCount: number;
  routinesCount: number;
}

export interface TableNodeData extends DaliNodeData {
  nodeType: 'DaliTable';
  schema: string;
  columns: ColumnInfo[];
}

export interface PackageNodeData extends DaliNodeData {
  nodeType: 'DaliPackage';
  routinesCount: number;
}

export interface ColumnNodeData extends DaliNodeData {
  nodeType: 'DaliColumn' | 'DaliOutputColumn';
  dataType: string;
}

// ─── Breadcrumb item ─────────────────────────────────────────────────────────
export interface BreadcrumbItem {
  level: ViewLevel;
  scope: string | null;
  label: string;
}
