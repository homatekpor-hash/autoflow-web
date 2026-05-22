/**
 * ShopLink offline storage — IndexedDB wrapper
 * Stores: pending operations, cached entities, conflict log
 */

const DB_NAME    = "shoplink_offline";
const DB_VERSION = 1;

const STORES = {
  pending:   "pending",    // queued API operations
  cache:     "cache",      // cached GET responses
  conflicts: "conflicts",  // detected conflicts
  meta:      "meta",       // sync metadata
};

let _db: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
  if (_db) return _db;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      // Pending operations queue
      if (!db.objectStoreNames.contains(STORES.pending)) {
        const store = db.createObjectStore(STORES.pending, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
        store.createIndex("type",      "type");
      }

      // Cache store
      if (!db.objectStoreNames.contains(STORES.cache)) {
        const store = db.createObjectStore(STORES.cache, { keyPath: "key" });
        store.createIndex("cachedAt",  "cachedAt");
        store.createIndex("expiresAt", "expiresAt");
      }

      // Conflicts
      if (!db.objectStoreNames.contains(STORES.conflicts)) {
        const store = db.createObjectStore(STORES.conflicts, { keyPath: "id" });
        store.createIndex("jobId",     "jobId");
        store.createIndex("resolved",  "resolved");
      }

      // Meta
      if (!db.objectStoreNames.contains(STORES.meta)) {
        db.createObjectStore(STORES.meta, { keyPath: "key" });
      }
    };

    req.onsuccess  = () => { _db = req.result; resolve(_db!); };
    req.onerror    = () => reject(req.error);
  });
}

function tx(store: string, mode: IDBTransactionMode = "readonly") {
  return openDB().then(db => db.transaction(store, mode).objectStore(store));
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((res, rej) => {
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}

// ─── Pending operations ───────────────────────────────────────────────────────

export interface PendingOp {
  id:        string;
  type:      string;       // "JOB_STATUS" | "NOTE" | "TIME_ENTRY" | "CHECKIN" | "PHOTO" etc.
  url:       string;
  method:    string;
  body:      any;
  createdAt: number;
  retries:   number;
  maxRetries: number;
  description: string;
  sizeBytes: number;
}

export async function enqueuePending(op: Omit<PendingOp, "id" | "createdAt" | "retries">) {
  const store = await tx(STORES.pending, "readwrite");
  const full: PendingOp = {
    ...op,
    id:        crypto.randomUUID(),
    createdAt: Date.now(),
    retries:   0,
  };
  await promisify(store.add(full));
  return full;
}

export async function getPending(): Promise<PendingOp[]> {
  const store = await tx(STORES.pending);
  const all   = await promisify(store.getAll()) as PendingOp[];
  return all.sort((a, b) => a.createdAt - b.createdAt);
}

export async function removePending(id: string) {
  const store = await tx(STORES.pending, "readwrite");
  await promisify(store.delete(id));
}

export async function incrementRetry(id: string) {
  const store = await tx(STORES.pending, "readwrite");
  const op    = await promisify(store.get(id)) as PendingOp;
  if (op) { op.retries++; await promisify(store.put(op)); }
}

export async function clearPending() {
  const store = await tx(STORES.pending, "readwrite");
  await promisify(store.clear());
}

// ─── Cache ────────────────────────────────────────────────────────────────────

export interface CacheEntry {
  key:       string;
  data:      any;
  cachedAt:  number;
  expiresAt: number;
}

export async function setCache(key: string, data: any, ttlMs = 5 * 60 * 1000) {
  const store = await tx(STORES.cache, "readwrite");
  const entry: CacheEntry = {
    key, data,
    cachedAt:  Date.now(),
    expiresAt: Date.now() + ttlMs,
  };
  await promisify(store.put(entry));
}

export async function getCache(key: string): Promise<any | null> {
  const store = await tx(STORES.cache);
  const entry = await promisify(store.get(key)) as CacheEntry | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) return null; // expired
  return entry.data;
}

export async function clearCache() {
  const store = await tx(STORES.cache, "readwrite");
  await promisify(store.clear());
}

export async function getCacheStats() {
  const store   = await tx(STORES.cache);
  const entries = await promisify(store.getAll()) as CacheEntry[];
  const total   = entries.reduce((s, e) => s + JSON.stringify(e.data).length, 0);
  return {
    entries: entries.length,
    sizeKB:  Math.round(total / 1024),
    stale:   entries.filter(e => Date.now() > e.expiresAt).length,
  };
}

// ─── Conflicts ────────────────────────────────────────────────────────────────

export interface Conflict {
  id:       string;
  jobId:    string;
  field:    string;
  local:    { value: any; timestamp: number; userId?: string };
  server:   { value: any; timestamp: number; userId?: string };
  resolved: boolean;
  resolution?: "local" | "server" | "both";
  resolvedAt?: number;
}

export async function addConflict(conflict: Omit<Conflict, "id" | "resolved">) {
  const store = await tx(STORES.conflicts, "readwrite");
  const full  = { ...conflict, id: crypto.randomUUID(), resolved: false };
  await promisify(store.add(full));
  return full;
}

export async function getConflicts(onlyUnresolved = true): Promise<Conflict[]> {
  const store = await tx(STORES.conflicts);
  const all   = await promisify(store.getAll()) as Conflict[];
  return onlyUnresolved ? all.filter(c => !c.resolved) : all;
}

export async function resolveConflict(id: string, resolution: "local" | "server" | "both") {
  const store    = await tx(STORES.conflicts, "readwrite");
  const conflict = await promisify(store.get(id)) as Conflict;
  if (conflict) {
    conflict.resolved   = true;
    conflict.resolution = resolution;
    conflict.resolvedAt = Date.now();
    await promisify(store.put(conflict));
  }
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

export async function setMeta(key: string, value: any) {
  const store = await tx(STORES.meta, "readwrite");
  await promisify(store.put({ key, value }));
}

export async function getMeta(key: string): Promise<any | null> {
  const store  = await tx(STORES.meta);
  const record = await promisify(store.get(key));
  return record?.value ?? null;
}
