"use client";

import { useOffline } from "@/lib/offline/useOffline";
import clsx from "clsx";

export default function OfflineBar() {
  const {
    isOnline, isSyncing, syncProgress, sync,
    pendingCount, conflictCount,
    formatLastSync,
  } = useOffline();

  if (isOnline && pendingCount === 0 && conflictCount === 0) return null;

  return (
    <div className={clsx(
      "fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lift text-sm font-medium transition-all",
      !isOnline
        ? "border border-red-200 bg-red-50 text-red-700"
        : conflictCount > 0
        ? "border border-amber-200 bg-amber-50 text-amber-700"
        : "border border-blue-200 bg-blue-50 text-blue-700"
    )}>
      {/* Status dot */}
      <div className={clsx("h-2.5 w-2.5 rounded-full flex-shrink-0",
        !isOnline ? "bg-red-500 animate-pulse" :
        conflictCount > 0 ? "bg-amber-500" : "bg-blue-500 animate-pulse")} />

      {/* Message */}
      <div>
        {!isOnline && <p>Offline mode — {pendingCount} operation{pendingCount !== 1 ? "s" : ""} queued</p>}
        {isOnline && pendingCount > 0 && !isSyncing && (
          <p>{pendingCount} pending · last sync {formatLastSync()}</p>
        )}
        {isOnline && isSyncing && (
          <div>
            <p>Syncing… {syncProgress}%</p>
            <div className="mt-1 h-1 w-32 rounded-full bg-blue-200 overflow-hidden">
              <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${syncProgress}%` }} />
            </div>
          </div>
        )}
        {isOnline && conflictCount > 0 && (
          <p>{conflictCount} conflict{conflictCount !== 1 ? "s" : ""} need resolution</p>
        )}
      </div>

      {/* Actions */}
      {isOnline && pendingCount > 0 && !isSyncing && (
        <button onClick={() => sync()}
          className="rounded-lg border border-blue-300 bg-blue-100 px-2.5 py-1 text-xs hover:bg-blue-200 transition">
          Sync now
        </button>
      )}
      {conflictCount > 0 && (
        <a href="/dashboard/offline"
          className="rounded-lg border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs hover:bg-amber-200 transition">
          Resolve
        </a>
      )}
    </div>
  );
}
