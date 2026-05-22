"use client";

import { useState } from "react";
import { Card, PageHeader, Spinner } from "@/components/ui";
import { useOffline } from "@/lib/offline/useOffline";
import clsx from "clsx";

const TABS = [
  { id: "status",    label: "Sync status" },
  { id: "queue",     label: "Pending queue" },
  { id: "conflicts", label: "Conflicts" },
  { id: "cache",     label: "Local cache" },
  { id: "settings",  label: "Settings" },
];

const OP_TYPE_STYLE: Record<string, string> = {
  JOB_STATUS:  "bg-blue-50 text-blue-700",
  NOTE:        "bg-gray-100 text-gray-600",
  TIME_ENTRY:  "bg-amber-50 text-amber-700",
  CHECKIN:     "bg-green-50 text-green-700",
  PHOTO:       "bg-purple-50 text-purple-700",
  GET:         "bg-gray-100 text-gray-500",
  POST:        "bg-green-50 text-green-700",
  PUT:         "bg-blue-50 text-blue-700",
  DELETE:      "bg-red-50 text-red-600",
};

export default function OfflinePage() {
  const [tab, setTab]               = useState("status");
  const [autoSync, setAutoSync]     = useState(true);
  const [syncInterval, setSyncInt]  = useState("30");
  const [cachePhotos, setCachePhotos] = useState(false);

  const {
    isOnline, isSyncing, syncProgress, sync,
    pending, pendingCount,
    conflicts, conflictCount, resolveConflict,
    clearQueue,
    lastSyncAt, formatLastSync,
    cacheStats,
  } = useOffline();

  return (
    <div className="fade-up">
      <PageHeader title="Offline & sync" subtitle="Manage local data, pending operations, and conflict resolution" />

      {/* Network status */}
      <div className={clsx("mb-4 flex items-center gap-3 rounded-2xl border px-4 py-3",
        isOnline ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50")}>
        <div className={clsx("h-3 w-3 rounded-full flex-shrink-0",
          isOnline ? "bg-green-500" : "bg-red-500 animate-pulse")} />
        <p className={clsx("font-medium text-sm", isOnline ? "text-green-800" : "text-red-800")}>
          {isOnline ? "Connected — ShopLink is online" : "Offline mode — working from local cache"}
        </p>
        <div className="ml-auto flex items-center gap-2">
          {pendingCount > 0 && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">{pendingCount} pending</span>}
          {conflictCount > 0 && <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">{conflictCount} conflicts</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex border-b border-ink-ghost overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap",
              tab === t.id ? "border-brand-600 text-brand-600" : "border-transparent text-ink-subtle hover:text-ink")}>
            {t.label}
            {t.id === "queue"     && pendingCount  > 0 && <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 text-[10px] text-amber-700">{pendingCount}</span>}
            {t.id === "conflicts" && conflictCount > 0 && <span className="ml-1.5 rounded-full bg-red-100 px-1.5 text-[10px] text-red-700">{conflictCount}</span>}
          </button>
        ))}
      </div>

      {/* ── Status ── */}
      {tab === "status" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[["Pending ops", pendingCount, "text-amber-600"], ["Conflicts", conflictCount, "text-red-600"],
              ["Cache entries", cacheStats.entries, "text-brand-600"], ["Last sync", formatLastSync(), "text-green-600"]].map(([l, v, tc]) => (
              <div key={String(l)} className="rounded-xl border border-ink-ghost bg-white p-4 text-center">
                <p className="text-xs text-ink-faint">{l}</p>
                <p className={clsx("mt-1 text-xl font-semibold", tc)}>{v}</p>
              </div>
            ))}
          </div>

          {isSyncing && (
            <Card className="p-4 border-blue-200 bg-blue-50">
              <div className="flex justify-between mb-2">
                <p className="text-sm font-medium text-blue-800">⟳ Syncing…</p>
                <span className="text-sm text-blue-600">{syncProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-blue-200 overflow-hidden">
                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${syncProgress}%` }} />
              </div>
            </Card>
          )}

          <Card className="p-5">
            <p className="mb-4 text-sm font-medium text-ink">How offline mode works</p>
            {[
              ["📝", "All actions saved locally", "Job updates, check-ins, notes, time entries — saved to IndexedDB instantly. No internet required."],
              ["📶", "Auto-sync when online", "When your connection returns, all queued operations sync automatically in the order they were created."],
              ["⚔️", "Smart conflict resolution", "If the same record was edited online and offline simultaneously, you choose which version to keep."],
              ["📦", "Full offline capability", "Jobs, vehicles, staff, parts — all cached locally so you can work without any internet connection."],
            ].map(([icon, title, desc]) => (
              <div key={String(title)} className="flex gap-3 mb-3 last:mb-0">
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div>
                  <p className="text-sm font-medium text-ink">{title}</p>
                  <p className="text-xs text-ink-subtle mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </Card>

          <div className="flex gap-2">
            <button onClick={() => sync()} disabled={!isOnline || isSyncing}
              className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-800 transition disabled:opacity-50">
              {isSyncing ? "Syncing…" : "↑ Sync now"}
            </button>
            <button className="flex-1 rounded-xl border border-ink-ghost py-2.5 text-sm text-ink-subtle hover:bg-ink-paper transition">
              ⬇ Refresh cache
            </button>
          </div>
        </div>
      )}

      {/* ── Queue ── */}
      {tab === "queue" && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-sm text-ink-subtle">{pendingCount} operations waiting to sync</p>
            <div className="flex gap-2">
              <button onClick={() => sync()} disabled={!isOnline || isSyncing || pendingCount === 0}
                className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-800 disabled:opacity-50">
                ↑ Sync all
              </button>
              <button onClick={() => clearQueue()} disabled={pendingCount === 0}
                className="rounded-lg border border-ink-ghost px-3 py-1.5 text-xs text-ink-subtle hover:bg-ink-paper disabled:opacity-50">
                Clear queue
              </button>
            </div>
          </div>

          {pendingCount === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-sm text-ink-muted">All operations synced</p>
            </Card>
          ) : (
            <Card className="overflow-hidden p-0">
              <div className="grid grid-cols-[90px_1fr_80px_60px_50px] gap-2 bg-ink-paper px-4 py-2.5 text-[10px] font-medium text-ink-faint">
                <span>Type</span><span>Operation</span><span>Time</span><span>Size</span><span>Tries</span>
              </div>
              {pending.map(op => (
                <div key={op.id} className="grid grid-cols-[90px_1fr_80px_60px_50px] gap-2 border-t border-ink-ghost px-4 py-2.5 items-center">
                  <span className={clsx("rounded px-1.5 py-0.5 text-[9px] font-medium w-fit", OP_TYPE_STYLE[op.type] || "bg-gray-100 text-gray-600")}>
                    {op.type.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-ink truncate">{op.description}</span>
                  <span className="text-[10px] text-ink-faint">{new Date(op.createdAt).toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="text-[10px] text-ink-faint">{Math.round(op.sizeBytes / 1024 * 10) / 10} KB</span>
                  <span className={clsx("text-[10px]", op.retries > 0 ? "text-amber-600 font-medium" : "text-ink-faint")}>{op.retries}</span>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* ── Conflicts ── */}
      {tab === "conflicts" && (
        <div className="space-y-3">
          {conflictCount === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-2xl mb-2">✅</p>
              <p className="text-sm text-ink-muted">No conflicts — all data is in sync</p>
            </Card>
          ) : (
            <>
              <Card className="p-4 border-amber-200 bg-amber-50">
                <p className="font-medium text-amber-800 text-sm">⚔️ {conflictCount} sync conflict{conflictCount !== 1 ? "s" : ""}</p>
                <p className="text-xs text-amber-700 mt-0.5">These records were modified both offline and online. Choose which version to keep.</p>
              </Card>
              {conflicts.map(c => (
                <div key={c.id} className="rounded-2xl border-l-4 border-amber-400 border border-ink-ghost bg-white p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-mono text-xs text-brand-600">{c.jobId}</p>
                      <p className="font-medium text-ink mt-0.5">{c.field} conflict</p>
                    </div>
                    <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] text-amber-700 font-medium">Needs resolution</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="rounded-xl bg-ink-paper p-3">
                      <p className="text-[10px] text-ink-faint mb-1">📱 LOCAL (your offline change)</p>
                      <p className="text-sm font-semibold text-ink">{JSON.stringify(c.local.value)}</p>
                      <p className="text-[10px] text-ink-faint mt-1">{new Date(c.local.timestamp).toLocaleString("en-GH")}</p>
                    </div>
                    <div className="rounded-xl bg-blue-50 p-3">
                      <p className="text-[10px] text-blue-600 mb-1">☁️ SERVER (online change)</p>
                      <p className="text-sm font-semibold text-blue-800">{JSON.stringify(c.server.value)}</p>
                      <p className="text-[10px] text-blue-500 mt-1">{new Date(c.server.timestamp).toLocaleString("en-GH")}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => resolveConflict(c.id, "local")}
                      className="flex-1 rounded-lg border border-ink-ghost py-2 text-xs text-ink-subtle hover:bg-ink-paper">Keep local</button>
                    <button onClick={() => resolveConflict(c.id, "server")}
                      className="flex-1 rounded-lg bg-brand-600 py-2 text-xs font-medium text-white hover:bg-brand-800">Keep server</button>
                    <button onClick={() => resolveConflict(c.id, "both")}
                      className="rounded-lg border border-ink-ghost px-3 py-2 text-xs text-ink-subtle hover:bg-ink-paper">Keep both</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* ── Cache ── */}
      {tab === "cache" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[["Cached entries", cacheStats.entries], ["Cache size", cacheStats.sizeKB + " KB"], ["Stale entries", cacheStats.stale]].map(([l, v]) => (
              <div key={String(l)} className="rounded-xl border border-ink-ghost bg-white p-4 text-center">
                <p className="text-xs text-ink-faint">{l}</p>
                <p className="text-xl font-semibold text-ink mt-1">{v}</p>
              </div>
            ))}
          </div>

          <Card className="p-5">
            <p className="mb-3 text-sm font-medium text-ink">What's cached locally</p>
            {[["Active jobs", "All jobs in your workshop — available offline", true],
              ["Vehicle records", "Plate, make, model, history", true],
              ["Staff list", "Technicians, advisors, managers", true],
              ["Parts catalogue", "Inventory for offline estimates", true],
              ["Estimate templates", "Quick-add templates", true],
              ["Job photos", "Before/after photos", false]].map(([name, desc, cached]) => (
              <div key={String(name)} className="flex items-center justify-between py-2 border-b border-ink-ghost last:border-0">
                <div>
                  <p className="text-sm text-ink">{name}</p>
                  <p className="text-xs text-ink-faint">{desc}</p>
                </div>
                <span className={clsx("rounded-md px-2 py-0.5 text-[10px] font-medium", cached ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500")}>
                  {cached ? "✓ Cached" : "Not cached"}
                </span>
              </div>
            ))}
          </Card>

          <button className="w-full rounded-xl border border-red-200 py-2.5 text-sm text-red-600 hover:bg-red-50 transition">
            🗑 Clear all local data
          </button>
        </div>
      )}

      {/* ── Settings ── */}
      {tab === "settings" && (
        <div className="space-y-4">
          <Card className="p-5">
            <p className="mb-4 text-sm font-medium text-ink">Sync settings</p>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-ink">Auto-sync when online</p>
                <p className="text-xs text-ink-subtle">Sync automatically when connection is restored</p>
              </div>
              <button onClick={() => setAutoSync(!autoSync)}
                className={clsx("relative h-6 w-11 rounded-full border transition-colors", autoSync ? "bg-brand-600 border-brand-600" : "bg-ink-ghost border-ink-ghost")}>
                <span className={clsx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", autoSync ? "left-5" : "left-0.5")} />
              </button>
            </div>
            <div>
              <p className="text-sm text-ink mb-2">Sync interval</p>
              <select className="input w-full" value={syncInterval} onChange={e => setSyncInt(e.target.value)}>
                <option value="10">Every 10 seconds</option>
                <option value="30">Every 30 seconds</option>
                <option value="60">Every minute</option>
                <option value="300">Every 5 minutes</option>
              </select>
            </div>
          </Card>

          <Card className="p-5">
            <p className="mb-4 text-sm font-medium text-ink">Cache settings</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-ink">Cache vehicle photos</p>
                <p className="text-xs text-ink-subtle">Uses more storage (~50MB)</p>
              </div>
              <button onClick={() => setCachePhotos(!cachePhotos)}
                className={clsx("relative h-6 w-11 rounded-full border transition-colors", cachePhotos ? "bg-brand-600 border-brand-600" : "bg-ink-ghost border-ink-ghost")}>
                <span className={clsx("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", cachePhotos ? "left-5" : "left-0.5")} />
              </button>
            </div>
          </Card>

          <Card className="p-5 border-red-200">
            <p className="text-sm font-medium text-red-700 mb-1">Danger zone</p>
            <p className="text-xs text-red-600 mb-3">Clear all local data. Unsynced changes will be permanently lost.</p>
            <button className="rounded-lg border border-red-200 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition">
              Clear all local data
            </button>
          </Card>
        </div>
      )}
    </div>
  );
}
