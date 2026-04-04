import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Table2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLoomStore } from '../../../stores/loomStore';
import type { DaliNodeData, ColumnInfo } from '../../../types/domain';

export type TableNodeType = Node<DaliNodeData>;

const MAX_VISIBLE_COLS = 5;

function ColumnRow({ col }: { col: ColumnInfo }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--seer-space-2)',
      padding: '3px 10px',
      borderTop: '1px solid var(--bd)',
      fontSize: '12px',
      position: 'relative',
    }}>
      {/* Column handles for L3 lineage edges */}
      <Handle
        type="source"
        position={Position.Right}
        id={`src-${col.id}`}
        style={{ background: 'var(--acc)', width: '6px', height: '6px', right: '-4px' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id={`tgt-${col.id}`}
        style={{ background: 'var(--inf)', width: '6px', height: '6px', left: '-4px' }}
      />

      {/* PK filled dot · FK hollow dot */}
      <span style={{ flexShrink: 0, width: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {col.isPrimaryKey ? (
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--wrn)', display: 'block' }} />
        ) : col.isForeignKey ? (
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', border: '1.5px solid var(--inf)', display: 'block' }} />
        ) : (
          <span style={{ width: '7px' }} />
        )}
      </span>

      {/* Column name — Fira Code */}
      <span className="mono" style={{ color: 'var(--t1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px' }}>
        {col.name}
      </span>

      {/* Column type — Fira Code, muted */}
      <span className="mono" style={{ color: 'var(--t3)', flexShrink: 0, fontSize: '11px' }}>
        {col.type}
      </span>
    </div>
  );
}

export const TableNode = memo(({ data, selected, id }: NodeProps<TableNodeType>) => {
  const { drillDown, selectNode } = useLoomStore();
  const { t } = useTranslation();
  const columns = data.columns ?? [];
  const visible  = columns.slice(0, MAX_VISIBLE_COLS);
  const overflow = columns.length - MAX_VISIBLE_COLS;

  return (
    <div
      className={`loom-node${selected ? ' selected' : ''}`}
      style={{
        background: 'var(--bg2)',
        borderLeftWidth: '3px',
        borderLeftColor: selected ? 'var(--acc)' : 'var(--acc)',
        minWidth: '220px',
        padding: 0,
        overflow: 'hidden',
      }}
      onClick={() => selectNode(id)}
      onDoubleClick={() => {
        if (data.childrenAvailable) drillDown(id, data.label);
      }}
    >
      <Handle type="target" position={Position.Left}  style={{ background: 'var(--inf)', zIndex: 5 }} />

      {/* Header */}
      <div style={{
        padding: 'var(--seer-space-2) var(--seer-space-3)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--seer-space-2)',
        background: 'var(--bg3)',
        borderBottom: '1px solid var(--bd)',
      }}>
        <Table2 size={13} color="var(--acc)" strokeWidth={1.5} />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {data.label}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--t3)', marginTop: '1px' }}>
            {data.schema ?? 'public'} · {columns.length} {t('nodes.columns')}
          </div>
        </div>
      </div>

      {/* Column rows */}
      {visible.map((col) => (
        <ColumnRow key={col.id} col={col} />
      ))}

      {overflow > 0 && (
        <div style={{
          padding: '3px var(--seer-space-3)',
          borderTop: '1px solid var(--bd)',
          fontSize: '11px',
          color: 'var(--acc)',
          cursor: 'pointer',
        }}
        onDoubleClick={() => drillDown(id, data.label)}
        >
          {t('nodes.moreColumns', { count: overflow })}
        </div>
      )}

      <Handle type="source" position={Position.Right} style={{ background: 'var(--acc)', zIndex: 5 }} />
    </div>
  );
});

TableNode.displayName = 'TableNode';
