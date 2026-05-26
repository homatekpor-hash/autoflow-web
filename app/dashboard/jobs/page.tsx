"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Card, Spinner } from "@/components/ui";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");
const af = (url: string, opts: RequestInit = {}) =>
  fetch(`${API}${url}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok()}`, ...(opts.headers||{}) } });

const STATUS_COLOR: Record<string,string> = {
  RECEIVED:"bg-gray-100 text-gray-600", DIAGNOSING:"bg-amber-50 text-amber-700",
  WAITING_APPROVAL:"bg-blue-50 text-blue-700", WAITING_PARTS:"bg-orange-50 text-orange-700",
  IN_PROGRESS:"bg-blue-100 text-blue-700", QC:"bg-purple-50 text-purple-700",
  READY:"bg-green-50 text-green-700", DELIVERED:"bg-gray-50 text-gray-500", CANCELLED:"bg-red-50 text-red-500",
};
const PRIORITY_COLOR: Record<string,string> = { URGENT:"text-red-500", HIGH:"text-orange-500", NORMAL:"text-gray-400", LOW:"text-gray-300" };
const ALL_STATUSES = ["RECEIVED","DIAGNOSING","WAITING_APPROVAL","WAITING_PARTS","IN_PROGRESS","QC","READY","DELIVERED","CANCELLED"];

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs,     setJobs]     = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState("");
  const [sort,     setSort]     = useState("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulking,  setBulking]  = useState(false);

  async function load() {
    const url = `/api/jobs${status ? `?status=${status}` : ""}`;
    const res = await af(url);
    if (res.ok) setJobs(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [status]);

  async function applyBulk() {
    if (!bulkStatus || selected.size === 0) return;
    setBulking(true);
    await Promise.all([...selected].map(id =>
      af(`/api/jobs/${id}/status`, { method:"PUT", body: JSON.stringify({ status: bulkStatus }) })
    ));
    setSelected(new Set()); setBulkStatus(""); await load();
    setBulking(false);
  }

  function toggleSelect(id: string) {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(j=>j.id)));
  }

  const filtered = jobs
    .filter(j => !search ||
      j.jobRef?.toLowerCase().includes(search.toLowerCase()) ||
      j.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      j.vehicle?.plate?.toLowerCase().includes(search.toLowerCase()) ||
      j.vehicle?.make?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a,b) => sort==="newest"
      ? new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()
      : new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime()
    );

  const canManage = ["SUPER_ADMIN","OWNER","BRANCH_MANAGER","SERVICE_ADVISOR"].includes(user?.role||"");
  const active    = jobs.filter(j=>!["DELIVERED","CANCELLED"].includes(j.status)).length;
  const ready     = jobs.filter(j=>j.status==="READY").length;
  const delivered = jobs.filter(j=>j.status==="DELIVERED").length;

  return (
    <div className="fade-up">
      <PageHeader title="Jobs" subtitle={`${jobs.length} total · ${active} active`}>
        <Link href="/dashboard/intake" className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition">
          + New intake
        </Link>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[["Active",active,"text-blue-600"],["Ready",ready,"text-green-600"],["Delivered",delivered,"text-gray-500"]].map(([l,v,c])=>(
          <Card key={String(l)} className="p-4 text-center">
            <p className={`text-2xl font-bold ${c}`}>{v}</p>
            <p className="text-xs text-ink-faint mt-1">{l}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-3 flex-wrap">
        <input className="input flex-1 min-w-48" placeholder="Search by ref, customer, plate…" value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="input w-48" value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {ALL_STATUSES.map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
        </select>
        <select className="input w-36" value={sort} onChange={e=>setSort(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {/* Bulk actions */}
      {canManage && selected.size > 0 && (
        <div className="flex items-center gap-3 mb-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
          <span className="text-sm font-semibold text-orange-700">{selected.size} selected</span>
          <select className="input w-48 text-sm" value={bulkStatus} onChange={e=>setBulkStatus(e.target.value)}>
            <option value="">Change status to…</option>
            {ALL_STATUSES.map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
          </select>
          <button onClick={applyBulk} disabled={!bulkStatus||bulking}
            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50">
            {bulking?"Applying…":"Apply"}
          </button>
          <button onClick={()=>setSelected(new Set())} className="text-sm text-orange-600 hover:underline ml-auto">Clear</button>
        </div>
      )}

      {/* Job list */}
      {loading ? <div className="flex justify-center py-20"><Spinner className="h-6 w-6"/></div> : (
        <Card className="p-0 overflow-hidden">
          <div className={clsx("grid gap-2 bg-ink-paper px-4 py-2.5 text-[10px] font-semibold text-ink-faint uppercase tracking-wide", canManage?"grid-cols-[32px_120px_1fr_100px_120px_100px_80px]":"grid-cols-[120px_1fr_100px_120px_100px_80px]")}>
            {canManage && <span><input type="checkbox" checked={selected.size===filtered.length&&filtered.length>0} onChange={toggleAll} /></span>}
            <span>Job ref</span><span>Vehicle / Customer</span><span>Workshop</span><span>Status</span><span>Priority</span><span>Date</span>
          </div>
          {filtered.map(j=>(
            <div key={j.id} className={clsx("grid gap-2 border-t border-ink-ghost px-4 py-3 items-center hover:bg-ink-paper transition", canManage?"grid-cols-[32px_120px_1fr_100px_120px_100px_80px]":"grid-cols-[120px_1fr_100px_120px_100px_80px]")}>
              {canManage && <input type="checkbox" checked={selected.has(j.id)} onChange={()=>toggleSelect(j.id)} onClick={e=>e.stopPropagation()} />}
              <Link href={`/dashboard/jobs/${j.id}`} className="font-mono text-xs text-orange-500 font-semibold hover:underline">{j.jobRef}</Link>
              <Link href={`/dashboard/jobs/${j.id}`} className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{j.vehicle?.make} {j.vehicle?.model} <span className="text-ink-faint font-normal">· {j.vehicle?.plate}</span></p>
                <p className="text-xs text-ink-faint">{j.customerName}</p>
              </Link>
              <span className="text-xs text-ink-subtle truncate hidden sm:block">{j.workshop?.name}</span>
              <span className={clsx("rounded-md px-2 py-0.5 text-[10px] font-semibold w-fit", STATUS_COLOR[j.status]||"bg-gray-100 text-gray-600")}>{j.status?.replace(/_/g," ")}</span>
              <span className={clsx("text-xs font-semibold", PRIORITY_COLOR[j.priority]||"text-gray-400")}>
                {j.priority==="URGENT"?"🔴":j.priority==="HIGH"?"🟠":"⚪"} {j.priority}
              </span>
              <span className="text-[10px] text-ink-faint hidden sm:block">{new Date(j.createdAt).toLocaleDateString("en-GH")}</span>
            </div>
          ))}
          {filtered.length===0 && <div className="py-12 text-center text-ink-faint text-sm">No jobs found</div>}
        </Card>
      )}
    </div>
  );
}
