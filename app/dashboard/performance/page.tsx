"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card, Spinner } from "@/components/ui";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");
const af = (url: string) => fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${tok()}` } }).then(r=>r.ok?r.json():null);

export default function PerformancePage() {
  const [data,    setData]    = useState<any>(null);
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState("month");

  useEffect(() => {
    Promise.all([
      af(`/api/reports/performance?period=${period}`),
      af("/api/jobs"),
    ]).then(([perf, jbs]) => {
      setData(perf);
      setJobs(Array.isArray(jbs)?jbs:[]);
      setLoading(false);
    });
  }, [period]);

  // Build tech stats from jobs
  const techStats = Object.values(
    jobs.reduce((acc: any, j: any) => {
      if (!j.technician) return acc;
      const id = j.technician.id;
      if (!acc[id]) acc[id] = { id, name: j.technician.name, total: 0, delivered: 0, inProgress: 0, avgDays: 0, totalDays: 0 };
      acc[id].total++;
      if (j.status === "DELIVERED") {
        acc[id].delivered++;
        if (j.completedAt) {
          const days = (new Date(j.completedAt).getTime() - new Date(j.createdAt).getTime()) / (1000*60*60*24);
          acc[id].totalDays += days;
        }
      }
      if (j.status === "IN_PROGRESS") acc[id].inProgress++;
      return acc;
    }, {})
  ).map((t: any) => ({
    ...t,
    completionRate: t.total ? Math.round((t.delivered/t.total)*100) : 0,
    avgDays: t.delivered ? (t.totalDays/t.delivered).toFixed(1) : "—",
  })).sort((a: any, b: any) => b.delivered - a.delivered);

  const medals = ["🥇","🥈","🥉"];

  return (
    <div className="fade-up">
      <PageHeader title="Staff Performance" subtitle="Technician leaderboard and job stats">
        <div className="flex gap-2">
          {[["week","7d"],["month","30d"],["year","12mo"]].map(([v,l])=>(
            <button key={v} onClick={()=>setPeriod(v)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${period===v?"bg-orange-500 text-white":"border border-ink-ghost text-ink-subtle hover:bg-ink-paper"}`}>
              {l}
            </button>
          ))}
        </div>
      </PageHeader>

      {loading ? <div className="flex justify-center py-20"><Spinner className="h-6 w-6"/></div> : (
        <div className="space-y-5">
          {/* Leaderboard */}
          <Card className="p-0 overflow-hidden">
            <div className="grid grid-cols-[40px_1fr_80px_80px_80px_80px] gap-2 bg-ink-paper px-4 py-2.5 text-[10px] font-semibold text-ink-faint uppercase tracking-wide">
              <span>#</span><span>Technician</span><span className="text-center">Total</span><span className="text-center">Done</span><span className="text-center">Rate</span><span className="text-center">Avg days</span>
            </div>
            {techStats.length === 0 && <div className="py-12 text-center text-ink-faint text-sm">No technician data yet. Assign technicians to jobs first.</div>}
            {(techStats as any[]).map((t, i) => (
              <div key={t.id} className="grid grid-cols-[40px_1fr_80px_80px_80px_80px] gap-2 border-t border-ink-ghost px-4 py-3 items-center">
                <span className="text-lg">{medals[i]||`${i+1}`}</span>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0">
                    {t.name?.split(" ").map((w:string)=>w[0]).join("").slice(0,2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{t.name}</p>
                    <p className="text-xs text-ink-faint">{t.inProgress} in progress</p>
                  </div>
                </div>
                <span className="text-center text-sm font-semibold text-ink">{t.total}</span>
                <span className="text-center text-sm font-semibold text-green-600">{t.delivered}</span>
                <div className="text-center">
                  <span className={`text-sm font-bold ${t.completionRate>=80?"text-green-600":t.completionRate>=50?"text-amber-600":"text-red-500"}`}>{t.completionRate}%</span>
                </div>
                <span className="text-center text-sm text-ink-subtle">{t.avgDays}d</span>
              </div>
            ))}
          </Card>

          {/* Performance bars */}
          {techStats.length > 0 && (
            <Card className="p-5">
              <p className="text-sm font-semibold text-ink mb-4">Jobs completed</p>
              {(techStats as any[]).map((t, i) => {
                const max = Math.max(...(techStats as any[]).map((x:any)=>x.delivered), 1);
                return (
                  <div key={t.id} className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-ink">{medals[i]||""} {t.name}</span>
                      <span className="font-bold text-ink">{t.delivered} jobs</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-ink-paper overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all" style={{width:`${(t.delivered/max)*100}%`}} />
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
