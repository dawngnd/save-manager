import { useState, useEffect, useCallback } from 'react';
import { callBackendApi } from '../api';
import { GoldRecord } from '../types';

const CACHE_KEY = 'save_manager_golds_cache';

function readCache(): GoldRecord[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache(data: GoldRecord[]) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

export function useGoldsCache() {
  const [golds, setGolds] = useState<GoldRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGolds = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = readCache();
      if (cached) {
        setGolds(cached);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      const data = await callBackendApi<GoldRecord[]>({ action: 'get_golds' });
      setGolds(data);
      writeCache(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách vàng.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    localStorage.removeItem(CACHE_KEY);
    await fetchGolds(true);
  }, [fetchGolds]);

  useEffect(() => {
    fetchGolds();
  }, [fetchGolds]);

  return { golds, loading, error, refresh };
}
