import { memo } from 'react';
import { ChevronRight, LayoutGrid } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLoomStore } from '../../stores/loomStore';

export const Breadcrumb = memo(() => {
  const { navigationStack, viewLevel, currentScope, navigateBack, navigateToLevel } = useLoomStore();
  const { t } = useTranslation();

  if (navigationStack.length === 0 && viewLevel === 'L1') return null;

  return (
    <div style={{
      position: 'absolute',
      top: 'var(--seer-space-3)',
      left: 'var(--seer-space-3)',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      padding: '4px var(--seer-space-3)',
      background: 'rgba(20,17,8,0.88)',
      backdropFilter: 'blur(8px)',
      border: '1px solid var(--bd)',
      borderRadius: 'var(--seer-radius-md)',
      fontSize: '12px',
      maxWidth: '580px',
      flexWrap: 'wrap',
    }}>
      {/* Root — always clickable to go back to L1 */}
      <BreadcrumbSegment
        label={t('breadcrumb.overview')}
        icon={<LayoutGrid size={12} />}
        onClick={() => navigateToLevel('L1')}
        isCurrent={viewLevel === 'L1'}
      />

      {navigationStack.map((item, idx) => (
        <span key={`${item.level}-${idx}`} style={{ display: 'contents' }}>
          <ChevronRight size={11} color="var(--t3)" style={{ flexShrink: 0 }} />
          <BreadcrumbSegment
            label={item.label}
            onClick={() => navigateBack(idx)}
            isCurrent={false}
          />
        </span>
      ))}

      {/* Current segment — not clickable */}
      {(navigationStack.length > 0 || currentScope) && (
        <>
          <ChevronRight size={11} color="var(--t3)" style={{ flexShrink: 0 }} />
          <BreadcrumbSegment
            label={currentScopeLabel(viewLevel, currentScope)}
            isCurrent
          />
        </>
      )}
    </div>
  );
});

Breadcrumb.displayName = 'Breadcrumb';

// ── Helpers ───────────────────────────────────────────────────────────────────

function currentScopeLabel(viewLevel: string, scope: string | null): string {
  if (!scope) return viewLevel;
  // Extract label from scope id (e.g. "schema-public" → "public", "tbl-orders" → "orders")
  const parts = scope.split('-');
  return parts.slice(1).join('-') || scope;
}

interface SegmentProps {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  isCurrent: boolean;
}

function BreadcrumbSegment({ label, icon, onClick, isCurrent }: SegmentProps) {
  return (
    <span
      onClick={isCurrent ? undefined : onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '1px 4px',
        borderRadius: '4px',
        cursor: isCurrent ? 'default' : 'pointer',
        color: isCurrent ? 'var(--t1)' : 'var(--acc)',
        fontWeight: isCurrent ? 500 : 400,
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => {
        if (!isCurrent) (e.currentTarget as HTMLElement).style.background = 'var(--bg3)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      {icon}
      {label}
    </span>
  );
}
