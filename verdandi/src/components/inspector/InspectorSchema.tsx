import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import type { DaliNodeData } from '../../types/domain';
import { InspectorSection, InspectorRow } from './InspectorSection';
import { useLoomStore } from '../../stores/loomStore';

interface Props { data: DaliNodeData; nodeId: string }

export const InspectorSchema = memo(({ data, nodeId }: Props) => {
  const { t } = useTranslation();
  const { drillDown, viewLevel } = useLoomStore();

  const canDrill = data.childrenAvailable && viewLevel !== 'L3';

  return (
    <>
      <InspectorSection title={t('inspector.properties')}>
        <InspectorRow label={t('inspector.label')}  value={data.label} />
        <InspectorRow label={t('inspector.type')}   value={data.nodeType} />
        <InspectorRow label={t('inspector.id')}     value={nodeId} />
      </InspectorSection>

      {(data.tablesCount !== undefined || data.routinesCount !== undefined) && (
        <InspectorSection title={t('inspector.stats')}>
          {data.tablesCount !== undefined && (
            <InspectorRow label={t('inspector.tables')} value={String(data.tablesCount)} />
          )}
          {data.routinesCount !== undefined && (
            <InspectorRow label={t('inspector.routines')} value={String(data.routinesCount)} />
          )}
        </InspectorSection>
      )}

      {canDrill && (
        <div style={{ padding: '8px 10px' }}>
          <button
            onClick={() => drillDown(nodeId, data.label)}
            style={{
              width: '100%', padding: '5px 10px',
              background: 'var(--acc)', border: 'none',
              borderRadius: 'var(--seer-radius-sm, 4px)',
              color: 'var(--bg0)', fontSize: '11px', fontWeight: 600,
              cursor: 'pointer', letterSpacing: '0.04em',
            }}
          >
            {t('inspector.drillDown')}
          </button>
        </div>
      )}
    </>
  );
});

InspectorSchema.displayName = 'InspectorSchema';
