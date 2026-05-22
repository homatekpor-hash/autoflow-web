"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPending, getConflicts, getCacheStats, clearPending,
  resolveConflict as dbResolveConflict,
  type PendingOp, type Conflict,
} from "./db";
import { syncNow, startAutoSync, stopAutoSync, getLastSyncTime } from "./sync";

export interface OfflineState {
  isOnline:      boolean;
  isSyncing:     boolean;
  syncProgress:  number;   // 0-100
  pendingCount:  number;
  conflictCount: number;
  lastSyncAt:    number | null;
  cacheStats:    { entries: number; sizeKB: number; stale: number };
}

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const up   = () => setIsOnline(true);
    const down = () => setIsOnline(false);
    window.addEventListener("online",  up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);

  return isOnline;
}

export function useSync() {
  const [isSyncing,    setIsSyncing]    = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastResult,   setLastResult]   = useState<{ processed: number; failed: number; conflicts: number } | null>(null);

  const sync = useCallback(async () => {
    setIsSyncing(true);
    setSyncProgress(0);

    const pending = await getPending();
    const total   = pending.length;
    let   done    = 0;

    const result = await syncNow((current) => {
      done++;
      setSyncProgress(Math.round((done / total) * 100));
    });

    setLastResult(result);
    setIsSyncing(false);
    setSyncProgress(100);
    setTimeout(() => setSyncProgress(0), 1000);
    return result;
  }, []);

  return { isSyncing, syncProgress, sync, lastResult };
}

export function usePendingQueue() {
  const [pending, setPending] = useState<PendingOp[]>([]);

  const refresh = useCallback(async () => {
    setPending(await getPending());
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const clear = useCallback(async () => {
    await clearPending();
    refresh();
  }, [refresh]);

  return { pending, refresh, clear };
}

export function useConflicts() {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  const refresh = useCallback(async () => {
    setConflicts(await getConflicts(true));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const resolve = useCallback(async (id: string, resolution: "local" | "server" | "both") => {
    await dbResolveConflict(id, resolution);
    refresh();
  }, [refresh]);

  return { conflicts, resolve, refresh };
}

export function useOffline() {
  const isOnline     = useOfflineStatus();
  const { isSyncing, syncProgress, sync, lastResult } = useSync();
  const { pending, refresh: refreshPending, clear: clearQueue } = usePendingQueue();
  const { conflicts, resolve: resolveConflict }                  = useConflicts();
  const [lastSyncAt,  setLastSyncAt]  = useState<number | null>(null);
  const [cacheStats,  setCacheStats]  = useState({ entries: 0, sizeKB: 0, stale: 0 });

  useEffect(() => {
    getLastSyncTime().then(setLastSyncAt);
    getCacheStats().then(setCacheStats);
    startAutoSync(30000, () => {
      refreshPending();
      getLastSyncTime().then(setLastSyncAt);
      getCacheStats().then(setCacheStats);
    });
    return () => stopAutoSync();
  }, [refreshPending]);

  function formatLastSync() {
    if (!lastSyncAt) return "Never";
    const diff = Date.now() - lastSyncAt;
    if (diff < 60000)  return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  }

  return {
    isOnline,
    isSyncing,
    syncProgress,
    sync,
    lastResult,
    pending,
    pendingCount:  pending.length,
    conflicts,
    conflictCount: conflicts.length,
    resolveConflict,
    clearQueue,
    lastSyncAt,
    formatLastSync,
    cacheStats,
  };
}
