"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");
const af  = (url: string) => fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${tok()}` } }).then(r => r.ok ? r.json() : null);

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const STATUS_COLOR: Record<string,string> = {
  RECEIVED:"bg-gray-100 text-gray-600", DIAGNOSING:"bg-amber-50 text-amber-700",
  WAITING_APPROVAL:"bg-blue-50 text-blue-700", WAITING_PARTS:"bg-orange-50 text-orange-700",
  IN_PROGRESS:"bg-blue-50 text-blue-600", QC:"bg-purple-50 text-purple-700",
  READY:"bg-green-50 text-green-700", DELIVERED:"bg-gray-50 text-gray-500",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [report,    setReport]    = useState<any>(null);
  const [jobs,      setJobs]      = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      af("/api/workshops"),
      af("/api/reports/revenue?period=week"),
      af("/api/jobs"),
    ]).then(([ws, rep, jbs]) => {
      setWorkshops(Array.isArray(ws) ? ws : []);
      setReport(rep);
      setJobs(Array.isArray(jbs) ? jbs.slice(0,8) : []);
      setLoading(false);
    });
  }, []);

  const activeJobs    = jobs.filter(j => !["DELIVERED","CANCELLED"].includes(j.status)).length;
  const completedToday = jobs.filter(j => j.status === "DELIVERED" && new Date(j.updatedAt).toDateString() === new Date().toDateString()).length;
  const canAddWorkshop = ["OWNER","SUPER_ADMIN"].includes(user?.role||"");

  return (
    <div className="fade-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">{greeting()}, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-sm text-ink-subtle mt-0.5">{new Date().toLocaleDateString("en-GH",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
        </div>
        {canAddWorkshop && (
          <Link href="/dashboard/workshops" className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition">
            + Add workshop
          </Link>
        )}
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner className="h-6 w-6"/></div> : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
            {[
              ["Active jobs",       activeJobs,                          "🔧","text-blue-600"],
              ["Completed today",   completedToday,                      "✅","text-green-600"],
              ["Revenue (7 days)",  "GHS "+(report?.totalRevenue||0).toLocaleString(), "💰","text-orange-500"],
              ["Workshops",         workshops.length,                    "🏭","text-purple-600"],
            ].map(([l,v,icon,c])=>(
              <div key={String(l)} className="rounded-2xl border border-ink-ghost bg-white p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-ink-faint font-medium">{l}</p>
                  <span className="text-xl">{icon}</span>
                </div>
                <p className={`text-2xl font-bold ${c}`}>{v}</p>
              </div>
            ))}
          </div>

          {/* Workshops */}
          {workshops.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-3">Your workshops</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {workshops.map(ws=>(
                  <Link key={ws.id} href={`/dashboard/workshops/${ws.id}`}
                    className="rounded-2xl border border-ink-ghost bg-white p-4 hover:shadow-lift transition-shadow group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-ink group-hover:text-orange-600 transition">{ws.name}</p>
                        <p className="text-xs text-ink-subtle">📍 {ws.location}</p>
                      </div>
                      <span className="text-ink-faint group-hover:text-orange-500 transition">→</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[["Active",ws.stats?.active??0],["Done",ws.stats?.completed??0],["Staff",ws._count?.members??0]].map(([l,v])=>(
                        <div key={String(l)} className="rounded-lg bg-ink-paper p-2 text-center">
                          <p className="text-base font-bold text-ink">{v}</p>
                          <p className="text-[10px] text-ink-faint">{l}</p>
                        </div>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent jobs */}
          {jobs.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-ink-faint">Recent jobs</p>
                <Link href="/dashboard/jobs" className="text-xs text-orange-500 hover:underline">View all →</Link>
              </div>
              <div className="rounded-2xl border border-ink-ghost bg-white overflow-hidden">
                {jobs.map(j=>(
                  <Link key={j.id} href={`/dashboard/jobs/${j.id}`}
                    className="flex items-center gap-3 px-4 py-3 border-b border-ink-ghost last:border-0 hover:bg-ink-paper transition">
                    <span className="font-mono text-xs text-orange-500 w-28 flex-shrink-0">{j.jobRef}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{j.vehicle?.make} {j.vehicle?.model}</p>
                      <p className="text-xs text-ink-faint">{j.customerName} · {j.vehicle?.plate}</p>
                    </div>
                    <span className="text-xs text-ink-subtle hidden sm:block">{j.workshop?.name}</span>
                    <span className={clsx("rounded-md px-2 py-0.5 text-[10px] font-semibold flex-shrink-0", STATUS_COLOR[j.status]||"bg-gray-100 text-gray-600")}>
                      {j.status?.replace(/_/g," ")}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {jobs.length===0 && workshops.length===0 && (
            <div className="rounded-2xl border-2 border-dashed border-ink-ghost p-16 text-center">
              <p className="text-4xl mb-3">🚗</p>
              <p className="text-lg font-semibold text-ink mb-1">Welcome to AutoFlow Ghana</p>
              <p className="text-sm text-ink-subtle mb-5">Start by adding your workshop and doing your first vehicle intake</p>
              <div className="flex gap-3 justify-center">
                <Link href="/dashboard/workshops" className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600">Add workshop</Link>
                <Link href="/dashboard/intake" className="rounded-xl border border-ink-ghost px-5 py-2.5 text-sm font-medium text-ink-subtle hover:bg-ink-paper">New intake</Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
