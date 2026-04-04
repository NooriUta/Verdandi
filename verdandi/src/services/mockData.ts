import type { ApiGraphResponse } from '../types/api';

async function loadJson(path: string): Promise<ApiGraphResponse> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load mock data: ${path} (${res.status})`);
  return res.json() as Promise<ApiGraphResponse>;
}

export async function fetchMockOverview(): Promise<ApiGraphResponse> {
  return loadJson('/mock/overview.json');
}

export async function fetchMockExplore(scope: string): Promise<ApiGraphResponse> {
  // Map scope id → available mock files
  const schemaName = scope.includes('analytics') ? 'analytics' : 'public';
  // analytics schema falls back to public mock (same structure, different label)
  const file = schemaName === 'analytics' ? 'explore-public' : `explore-${schemaName}`;
  const data = await loadJson(`/mock/${file}.json`);
  // Patch metadata scope for analytics
  if (schemaName === 'analytics') {
    return { ...data, metadata: { ...data.metadata, scope } };
  }
  return data;
}

export async function fetchMockColumnLineage(tableId: string): Promise<ApiGraphResponse> {
  // All L3 drill-downs use the orders column lineage as demo data
  const _tableId = tableId; // reserved for future per-table mocks
  void _tableId;
  return loadJson('/mock/column-orders.json');
}
