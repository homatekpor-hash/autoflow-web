"use client";
import { useEffect, useState } from "react";
import { PageHeader, Spinner } from "@/components/ui";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");
const af = (url: string, opts: RequestInit = {}) =>
  fetch(`${API}${url}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok()}`, ...(opts.headers||{}) } });

const COLUMNS = [
  { status:"RECEIVED",         label:"Received",         color:"bg-gray-100 text-gray-700"     },
  { status:"DIAGNOSING",       label:"Diagnosing",       color:"bg-amber-100 text-amber-700"   },
  { status:"WAITING_APPROVAL", label:"Awaiting Approval",color:"bg-blue-100 text-blue-700"     },
  { status:"WAITING_PARTS",    label:"Waiting Parts",    color:"bg-orange-100 text-orange-700" },
  { status:"IN_PROGRESS",      label:"In Progress",      color:"bg-blue-100 text-blue-600"     },
  { status:"QC",               label:"QC Check",         color:"bg-purple-100 text-purple-700" },
  { status:"READY",            label:"Ready",            color:"bg-green-100 text-green-700"   },
];
const PRIORITY_DOT: Record<string,string> = { URGENT:"bg-red-500", HIGH:"bg-orange-400", NORMAL:"bg-gray-300", LOW:"bg-gray-200" };

export default function WIPPage() {
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [techs,   setTechs]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [moving,  setMoving]  = useState<string|null>(null);
  const [techFilter, setTechFilter] = useState("");
  const [search,  setSearch]  = useState("");

  async function load() {
    const [j, u] = await Promise.all([
      af("/api/jobs").then(r=>r.ok?r.json():[]),
      af("/api/users?role=TECHNICIAN").then(r=>r.ok?r.json():[]),
    ]);
    setJobs(Array.isArray(j)?j:[]);
    setTechs(Array.isArray(u)?u:[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function moveJob(jobId: string, newStatus: string) {
    setMoving(jobId);
    await af(`/api/jobs/${jobId}/status`, { method:"PUT", body: JSON.stringify({ status: newStatus }) });
    await load(); setMoving(null);
  }

  const activeJobs = jobs
    .filter(j => !["DELIVERED","CANCELLED"].includes(j.status))
    .filter(j => !techFilter || j.technicianId === techFilter)
    .filter(j => !search ||
      j.jobRef?.toLowerCase().includes(search.toLowerCase()) ||
      j.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      j.vehicle?.plate?.toLowerCase().includes(search.toLowerCase())
    );

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-6 w-6"/></div>;

  return (
    <div className="fade-up">
      <PageHeader title="WIP Board" subtitle={`${activeJobs.length} active jobs`} />

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input className="input flex-1 min-w-40" placeholder="Search jobs…" value={search} onChange={e=>setSearch(e.target.value)} />
        <select className="input w-48" value={techFilter} onChange={e=>setTechFilter(e.target.value)}>
          <option value="">All technicians</option>
          {techs.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4" style={{minHeight:"70vh"}}>
        {COLUMNS.map(col => {
          const colJobs = activeJobs.filter(j => j.status === col.status);
          return (
            <div key={col.status} className="flex-shrink-0 w-64">
              <div className={clsx("rounded-xl px-3 py-2 mb-3 flex items-center justify-between", col.color)}>
                <p className="text-xs font-bold">{col.label}</p>
                <span className="text-xs font-bold opacity-60">{colJobs.length}</span>
              </div>
              <div className="space-y-2">
                {colJobs.map(job => (
                  <div key={job.id} className="rounded-xl border border-ink-ghost bg-white p-3 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-mono text-[10px] text-orange-500 font-semibold">{job.jobRef}</span>
                      <div className={clsx("h-2 w-2 rounded-full flex-shrink-0 mt-1", PRIORITY_DOT[job.priority]||"bg-gray-300")} />
                    </div>
                    <p className="text-sm font-semibold text-ink">{job.vehicle?.make} {job.vehicle?.model}</p>
                    <p className="text-xs text-ink-faint">{job.vehicle?.plate}</p>
                    {job.customerName && <p className="text-xs text-ink-subtle mt-0.5">{job.customerName}</p>}
                    {job.technician && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center text-[9px] font-bold text-amber-700">
                          {job.technician.name?.split(" ").map((w:string)=>w[0]).join("").slice(0,2)}
                        </div>
                        <p className="text-[10px] text-ink-faint">{job.technician.name}</p>
                      </div>
                    )}
                    <div className="mt-3 flex gap-1.5 flex-wrap">
                      {COLUMNS.filter(c=>c.status!==col.status).slice(0,2).map(next=>(
                        <button key={next.status} onClick={()=>moveJob(job.id,next.status)} disabled={!!moving}
                          className="text-[10px] rounded-lg border border-ink-ghost px-2 py-1 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition disabled:opacity-40">
                          → {next.label}
                        </button>
                      ))}
                    </div>
                    {moving===job.id && <p className="text-[10px] text-orange-500 mt-1">Moving…</p>}
                  </div>
                ))}
                {colJobs.length===0 && (
                  <div className="rounded-xl border border-dashed border-ink-ghost p-4 text-center">
                    <p className="text-xs text-ink-faint">No jobs</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
