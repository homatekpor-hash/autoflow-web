"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card, Spinner } from "@/components/ui";
import Link from "next/link";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");
const af = (url: string) => fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${tok()}` } }).then(r=>r.ok?r.json():[]);

export default function NotificationsPage() {
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [parts,   setParts]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      af("/api/jobs"),
      af("/api/inventory/parts"),
    ]).then(([j, p]) => {
      setJobs(Array.isArray(j)?j:[]);
      setParts(Array.isArray(p)?p:[]);
      setLoading(false);
    });
  }, []);

  const readyJobs    = jobs.filter(j=>j.status==="READY");
  const urgentJobs   = jobs.filter(j=>j.priority==="URGENT"&&!["DELIVERED","CANCELLED"].includes(j.status));
  const stalledJobs  = jobs.filter(j=>["WAITING_PARTS","WAITING_APPROVAL"].includes(j.status)&&new Date(j.updatedAt)<new Date(Date.now()-48*60*60*1000));
  const lowParts     = parts.filter(p=>p.qty<=p.minQty);
  const outOfStock   = parts.filter(p=>p.qty===0);

  const total = readyJobs.length + urgentJobs.length + stalledJobs.length + lowParts.length;

  return (
    <div className="fade-up">
      <PageHeader title="Alerts & Notifications" subtitle={total > 0 ? `${total} items need attention` : "All clear!"} />

      {loading ? <div className="flex justify-center py-20"><Spinner className="h-6 w-6"/></div> : (
        <div className="space-y-5">
          {total === 0 && (
            <Card className="p-12 text-center">
              <p className="text-4xl mb-3">✅</p>
              <p className="text-lg font-semibold text-ink">All clear!</p>
              <p className="text-sm text-ink-faint mt-1">No urgent alerts at this time.</p>
            </Card>
          )}

          {readyJobs.length > 0 && (
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border-b border-green-100">
                <span className="text-xl">✅</span>
                <p className="text-sm font-bold text-green-700">Ready for pickup ({readyJobs.length})</p>
              </div>
              {readyJobs.map(j=>(
                <Link key={j.id} href={`/dashboard/jobs/${j.id}`}
                  className="flex items-center gap-3 px-4 py-3 border-b border-ink-ghost last:border-0 hover:bg-ink-paper transition">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{j.jobRef} · {j.vehicle?.make} {j.vehicle?.model}</p>
                    <p className="text-xs text-ink-faint">{j.customerName} · {j.customerPhone}</p>
                  </div>
                  <div className="flex gap-2">
                    <a href={`https://wa.me/${(j.customerPhone||"").replace(/\D/g,"").replace(/^0/,"233")}?text=${encodeURIComponent(`Hello ${j.customerName}, your ${j.vehicle?.make} ${j.vehicle?.model} is ready for pickup at ${j.workshop?.name}! Job ref: ${j.jobRef}`)}`}
                      target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                      className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600">
                      📱 Notify
                    </a>
                  </div>
                </Link>
              ))}
            </Card>
          )}

          {urgentJobs.length > 0 && (
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border-b border-red-100">
                <span className="text-xl">🔴</span>
                <p className="text-sm font-bold text-red-700">Urgent jobs ({urgentJobs.length})</p>
              </div>
              {urgentJobs.map(j=>(
                <Link key={j.id} href={`/dashboard/jobs/${j.id}`}
                  className="flex items-center gap-3 px-4 py-3 border-b border-ink-ghost last:border-0 hover:bg-ink-paper transition">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{j.jobRef} · {j.vehicle?.make} {j.vehicle?.model}</p>
                    <p className="text-xs text-ink-faint">{j.customerName} · Status: {j.status?.replace(/_/g," ")}</p>
                  </div>
                  <span className="text-xs rounded-full bg-red-100 text-red-600 px-2 py-0.5 font-bold">URGENT</span>
                </Link>
              ))}
            </Card>
          )}

          {stalledJobs.length > 0 && (
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border-b border-amber-100">
                <span className="text-xl">⏳</span>
                <p className="text-sm font-bold text-amber-700">Stalled jobs 48h+ ({stalledJobs.length})</p>
              </div>
              {stalledJobs.map(j=>(
                <Link key={j.id} href={`/dashboard/jobs/${j.id}`}
                  className="flex items-center gap-3 px-4 py-3 border-b border-ink-ghost last:border-0 hover:bg-ink-paper transition">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{j.jobRef} · {j.vehicle?.make} {j.vehicle?.model}</p>
                    <p className="text-xs text-ink-faint">{j.status?.replace(/_/g," ")} · Last updated: {new Date(j.updatedAt).toLocaleDateString("en-GH")}</p>
                  </div>
                </Link>
              ))}
            </Card>
          )}

          {(lowParts.length > 0 || outOfStock.length > 0) && (
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 border-b border-orange-100">
                <span className="text-xl">📦</span>
                <p className="text-sm font-bold text-orange-700">Low stock ({lowParts.length} parts)</p>
              </div>
              {lowParts.map(p=>(
                <Link key={p.id} href="/dashboard/inventory"
                  className="flex items-center gap-3 px-4 py-3 border-b border-ink-ghost last:border-0 hover:bg-ink-paper transition">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{p.name}</p>
                    <p className="text-xs text-ink-faint">SKU: {p.sku||"—"} · Min: {p.minQty}</p>
                  </div>
                  <span className={clsx("text-xs font-bold rounded-full px-2 py-0.5",p.qty===0?"bg-red-100 text-red-600":"bg-amber-100 text-amber-700")}>
                    {p.qty===0?"Out of stock":`${p.qty} left`}
                  </span>
                </Link>
              ))}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
