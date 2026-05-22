"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card, Spinner } from "@/components/ui";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");
const get = (url: string) => fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${tok()}` } }).then(r => r.json());

export default function ReportsPage() {
  const [period, setPeriod] = useState("month");
  const [revenue, setRevenue] = useState<any>(null);
  const [jobs,    setJobs]    = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      get(`/api/reports/revenue?period=${period}`),
      get(`/api/reports/jobs?period=${period}`),
    ]).then(([r, j]) => { setRevenue(r); setJobs(j); setLoading(false); });
  }, [period]);

  const periods = [["week","7 days"],["month","30 days"],["year","12 months"]];

  return (
    <div className="fade-up">
      <PageHeader title="Reports & Analytics" subtitle="Revenue, jobs and performance metrics">
        <div className="flex gap-2">
          {periods.map(([v,l]) => (
            <button key={v} onClick={() => setPeriod(v)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${period===v ? "bg-orange-500 text-white" : "border border-ink-ghost text-ink-subtle hover:bg-ink-paper"}`}>
              {l}
            </button>
          ))}
        </div>
      </PageHeader>

      {loading ? <div className="flex justify-center py-20"><Spinner className="h-6 w-6"/></div> : (
        <div className="space-y-6">
          {/* Revenue KPIs */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Total revenue", `GHS ${(revenue?.totalRevenue||0).toLocaleString()}`, "text-green-600"],
              ["Outstanding",   `GHS ${(revenue?.totalUnpaid||0).toLocaleString()}`,  "text-amber-600"],
              ["Total jobs",    revenue?.totalJobs || 0,                               "text-blue-600"],
              ["Completion",    `${revenue?.completionRate||0}%`,                      "text-orange-600"],
            ].map(([l,v,c]) => (
              <Card key={String(l)} className="p-5 text-center">
                <p className="text-xs text-ink-faint mb-1">{l}</p>
                <p className={`text-2xl font-bold ${c}`}>{v}</p>
              </Card>
            ))}
          </div>

          {/* Revenue by workshop */}
          {revenue?.byWorkshop && Object.keys(revenue.byWorkshop).length > 0 && (
            <Card className="p-5">
              <p className="text-sm font-semibold text-ink mb-4">Revenue by workshop</p>
              <div className="space-y-3">
                {Object.entries(revenue.byWorkshop).sort((a:any,b:any)=>b[1]-a[1]).map(([name, amt]: any) => {
                  const max = Math.max(...Object.values(revenue.byWorkshop) as number[]);
                  const pct = max ? (amt/max)*100 : 0;
                  return (
                    <div key={name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-ink">{name}</span>
                        <span className="font-semibold text-green-600">GHS {amt.toLocaleString()}</span>
                      </div>
                      <div className="h-2 rounded-full bg-ink-paper overflow-hidden">
                        <div className="h-full rounded-full bg-green-400 transition-all" style={{width:`${pct}%`}} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Job status breakdown */}
          {jobs?.byStatus && (
            <Card className="p-5">
              <p className="text-sm font-semibold text-ink mb-4">Jobs by status</p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                {jobs.byStatus.map((s: any) => (
                  <div key={s.status} className="rounded-xl bg-ink-paper p-3 text-center">
                    <p className="text-lg font-bold text-ink">{s._count.id}</p>
                    <p className="text-[10px] text-ink-faint mt-0.5">{s.status.replace(/_/g," ")}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Top parts */}
          {revenue?.topParts?.length > 0 && (
            <Card className="p-5">
              <p className="text-sm font-semibold text-ink mb-4">Top parts used</p>
              <div className="space-y-2">
                {revenue.topParts.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-ink-ghost last:border-0 text-sm">
                    <span className="text-ink">{p.name}</span>
                    <div className="flex gap-4 text-right">
                      <span className="text-ink-faint">x{p.quantity}</span>
                      <span className="font-medium text-ink">GHS {(p.unitPrice*p.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent jobs */}
          {jobs?.recent?.length > 0 && (
            <Card className="p-5">
              <p className="text-sm font-semibold text-ink mb-4">Recent jobs</p>
              <div className="space-y-2">
                {jobs.recent.map((j: any) => (
                  <div key={j.id} className="flex items-center gap-3 py-2 border-b border-ink-ghost last:border-0">
                    <span className="font-mono text-xs text-orange-500">{j.jobRef}</span>
                    <div className="flex-1">
                      <p className="text-sm text-ink">{j.vehicle?.make} {j.vehicle?.model} · {j.vehicle?.plate}</p>
                      <p className="text-xs text-ink-faint">{j.workshop?.name}</p>
                    </div>
                    <span className="text-xs rounded-md bg-ink-paper px-2 py-0.5 text-ink-subtle">{j.status?.replace(/_/g," ")}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
