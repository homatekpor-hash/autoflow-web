"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Card, Spinner } from "@/components/ui";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");
const af = (url: string) => fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${tok()}` } }).then(r => r.ok ? r.json() : []);

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
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("");
  const [sort,    setSort]    = useState("newest");

  useEffect(() => {
    const url = `/api/jobs${status ? `?status=${status}` : ""}`;
    af(url).then(d => { setJobs(Array.isArray(d)?d:[]); setLoading(false); });
  }, [status]);

  const filtered = jobs
    .filter(j =>
      !search ||
      j.jobRef?.toLowerCase().includes(search.toLowerCase()) ||
      j.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      j.vehicle?.plate?.toLowerCase().includes(search.toLowerCase()) ||
      j.vehicle?.make?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a,b) => sort==="newest"
      ? new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()
      : new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime()
    );

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
        {[["Active",active,"text-blue-600"],["Ready for pickup",ready,"text-green-600"],["Delivered",delivered,"text-gray-500"]].map(([l,v,c])=>(
          <Card key={String(l)} className="p-4 text-center">
            <p className={`text-2xl font-bold ${c}`}>{v}</p>
            <p className="text-xs text-ink-faint mt-1">{l}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
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

      {/* Job list */}
      {loading ? <div className="flex justify-center py-20"><Spinner className="h-6 w-6"/></div> : (
        <Card className="p-0 overflow-hidden">
          <div className="hidden sm:grid grid-cols-[120px_1fr_100px_120px_100px_80px] gap-2 bg-ink-paper px-4 py-2.5 text-[10px] font-semibold text-ink-faint uppercase tracking-wide">
            <span>Job ref</span><span>Vehicle / Customer</span><span>Workshop</span><span>Status</span><span>Priority</span><span>Date</span>
          </div>
          {filtered.map(j=>(
            <Link key={j.id} href={`/dashboard/jobs/${j.id}`}
              className="grid grid-cols-[120px_1fr_100px_120px_100px_80px] gap-2 border-t border-ink-ghost px-4 py-3 items-center hover:bg-ink-paper transition">
              <span className="font-mono text-xs text-orange-500 font-semibold">{j.jobRef}</span>
              <div>
                <p className="text-sm font-medium text-ink">{j.vehicle?.make} {j.vehicle?.model} <span className="text-ink-faint font-normal">· {j.vehicle?.plate}</span></p>
                <p className="text-xs text-ink-faint">{j.customerName} · {j.customerPhone}</p>
              </div>
              <span className="text-xs text-ink-subtle truncate hidden sm:block">{j.workshop?.name}</span>
              <span className={clsx("rounded-md px-2 py-0.5 text-[10px] font-semibold w-fit", STATUS_COLOR[j.status]||"bg-gray-100 text-gray-600")}>
                {j.status?.replace(/_/g," ")}
              </span>
              <span className={clsx("text-xs font-semibold", PRIORITY_COLOR[j.priority]||"text-gray-400")}>
                {j.priority==="URGENT"?"🔴":j.priority==="HIGH"?"🟠":j.priority==="NORMAL"?"⚪":"⚫"} {j.priority}
              </span>
              <span className="text-[10px] text-ink-faint hidden sm:block">{new Date(j.createdAt).toLocaleDateString("en-GH")}</span>
            </Link>
          ))}
          {filtered.length===0 && <div className="py-12 text-center text-ink-faint text-sm">{search||status?"No jobs match your filters":"No jobs yet. Start with a new intake."}</div>}
        </Card>
      )}
    </div>
  );
}
