import { useState, useEffect, useCallback } from 'react';
import { callBackendApi } from '../api';

const CACHE_KEY = 'save_manager_users_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 giờ

interface CachedData {
  users: string[];
  timestamp: number;
}

function readCache(): string[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedData = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cached.users;
  } catch {
    return null;
  }
}

function writeCache(users: string[]) {
  const data: CachedData = { users, timestamp: Date.now() };
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
}

export function useUsersCache() {
  const [users, setUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = readCache();
      if (cached) {
        setUsers(cached);
        return;
      }
    }

    try {
      setLoading(true);
      const data = await callBackendApi<string[]>({ action: 'get_users' });
      setUsers(data);
      writeCache(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCache = useCallback(async () => {
    localStorage.removeItem(CACHE_KEY);
    await fetchUsers(true);
  }, [fetchUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, clearCache };
}
