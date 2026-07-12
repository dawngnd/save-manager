import { useState, useEffect, useCallback } from 'react';
import { callBackendApi } from '../api';
import { Deposit } from '../types';

const CACHE_KEY = 'save_manager_deposits_cache';

interface CachedData {
  deposits: Deposit[];
  timestamp: number;
}

function readCache(): Deposit[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedData = JSON.parse(raw);
    return cached.deposits;
  } catch {
    return null;
  }
}

function writeCache(deposits: Deposit[]) {
  const data: CachedData = { deposits, timestamp: Date.now() };
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

export function useDepositsCache() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeposits = useCallback(async (forceRefresh = false) => {
    // Dùng cache nếu không force refresh
    if (!forceRefresh) {
      const cached = readCache();
      if (cached) {
        setDeposits(cached);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      const data = await callBackendApi<Deposit[]>({ action: 'get_deposits' });
      setDeposits(data);
      writeCache(data);
    } catch (err: any) {
      console.error('Failed to fetch deposits:', err);
      setError(err.message || 'Không thể tải danh sách khoản tiết kiệm.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    localStorage.removeItem(CACHE_KEY);
    await fetchDeposits(true);
  }, [fetchDeposits]);

  // Cập nhật cache sau khi thêm/tái tục (không cần gọi API lại)
  const updateCache = useCallback((updater: (prev: Deposit[]) => Deposit[]) => {
    setDeposits(prev => {
      const updated = updater(prev);
      writeCache(updated);
      return updated;
    });
  }, []);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  return { deposits, loading, error, refresh, updateCache };
}
