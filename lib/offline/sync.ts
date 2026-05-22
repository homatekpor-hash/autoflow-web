/**
 * ShopLink sync engine
 * Runs in the browser — processes the pending queue when online
 */

import {
  getPending, removePending, incrementRetry,
  setCache, getCache,
  addConflict, setMeta, getMeta,
  type PendingOp,
} from "./db";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("sl_token") ?? "" : "";
}

// ─── Offline-aware fetch ───────────────────────────────────────────────────────
// Use this instead of raw fetch throughout the app

export async function offlineFetch(
  url:         string,
  options:     RequestInit & { offlineType?: string; offlineDesc?: string } = {},
  cacheKey?:   string,
  cacheTtlMs?: number,
): Promise<any> {
  const isOnline = navigator.onLine;
  const fullUrl  = url.startsWith("http") ? url : `${API}${url}`;
  const method   = (options.method || "GET").toUpperCase();
  const token    = getToken();

  // ── GET: try network, fall back to cache ──────────────────────────────────
  if (method === "GET") {
    const key = cacheKey || url;
    if (isOnline) {
      try {
        const res  = await fetch(fullUrl, { ...options, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(options.headers || {}) } });
        const data = await res.json();
        // Cache successful responses
        await setCache(key, data, cacheTtlMs || 5 * 60 * 1000);
        return data;
      } catch {
        // Network error — fall through to cache
      }
    }
    // Offline or network failed — serve from cache
    const cached = await getCache(key);
    if (cached !== null) return cached;
    throw new Error("No cached data available for " + url);
  }

  // ── Mutations: queue if offline ───────────────────────────────────────────
  if (!isOnline) {
    const { enqueuePending } = await import("./db");
    const body = options.body ? JSON.parse(options.body as string) : {};
    await enqueuePending({
      type:        options.offlineType || method,
      url:         fullUrl,
      method,
      body,
      description: options.offlineDesc || `${method} ${url}`,
      maxRetries:  3,
      sizeBytes:   JSON.stringify(body).length,
    });
    // Return an optimistic response
    return { queued: true, offline: true };
  }

  // Online — execute immediately
  const res  = await fetch(fullUrl, { ...options, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(options.headers || {}) } });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
  return data;
}

// ─── Sync engine ──────────────────────────────────────────────────────────────

export interface SyncResult {
  processed: number;
  failed:    number;
  conflicts: number;
}

let isSyncing = false;

export async function syncNow(
  onProgress?: (current: number, total: number, op: PendingOp) => void
): Promise<SyncResult> {
  if (isSyncing || !navigator.onLine) return { processed: 0, failed: 0, conflicts: 0 };
  isSyncing = true;

  const result: SyncResult = { processed: 0, failed: 0, conflicts: 0 };
  const pending = await getPending();
  const total   = pending.length;

  for (const op of pending) {
    onProgress?.(result.processed, total, op);

    try {
      const res = await fetch(op.url, {
        method:  op.method,
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json" },
        body:    op.body ? JSON.stringify(op.body) : undefined,
      });

      if (res.status === 409) {
        // Conflict detected
        const serverData = await res.json();
        await addConflict({
          jobId:  op.body?.jobId || "unknown",
          field:  op.type,
          local:  { value: op.body, timestamp: op.createdAt },
          server: { value: serverData, timestamp: Date.now() },
        });
        result.conflicts++;
        await removePending(op.id);
      } else if (res.ok) {
        await removePending(op.id);
        result.processed++;
      } else if (res.status >= 400 && res.status < 500) {
        // Client error — remove from queue (won't succeed on retry)
        await removePending(op.id);
        result.failed++;
      } else {
        // Server error — retry later
        await incrementRetry(op.id);
        if (op.retries >= op.maxRetries) {
          await removePending(op.id);
          result.failed++;
        }
      }
    } catch {
      // Network error — keep in queue
      await incrementRetry(op.id);
    }
  }

  await setMeta("lastSyncAt", Date.now());
  isSyncing = false;
  return result;
}

// ─── Auto-sync setup ─────────────────────────────────────────────────────────

let autoSyncInterval: NodeJS.Timeout | null = null;

export function startAutoSync(intervalMs = 30000, onSync?: (r: SyncResult) => void) {
  stopAutoSync();

  // Sync when coming online
  window.addEventListener("online", async () => {
    const result = await syncNow();
    onSync?.(result);
  });

  // Periodic sync
  autoSyncInterval = setInterval(async () => {
    if (navigator.onLine) {
      const result = await syncNow();
      if (result.processed > 0 || result.conflicts > 0) onSync?.(result);
    }
  }, intervalMs);

  // Initial sync if online
  if (navigator.onLine) {
    syncNow().then(r => onSync?.(r));
  }
}

export function stopAutoSync() {
  if (autoSyncInterval) {
    clearInterval(autoSyncInterval);
    autoSyncInterval = null;
  }
}

export async function getLastSyncTime(): Promise<number | null> {
  return getMeta("lastSyncAt");
}
