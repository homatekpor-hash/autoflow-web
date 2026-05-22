"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card, Spinner } from "@/components/ui";
import Link from "next/link";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");
const af = (url: string) => fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${tok()}` } }).then(r => r.ok ? r.json() : null);

export default function NotificationsPage() {
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [parts,   setParts]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([af("/api/jobs"), af("/api/inventory/parts")]).then(([j, p]) => {
      setJobs(Array.isArray(j) ? j : []);
      setParts(Array.isArray(p) ? p : []);
      setLoading(false);
    });
  }, []);

  const readyJobs    = jobs.filter(j => j.status === "READY");
  const urgentJobs   = jobs.filter(j => j.priority === "URGENT" && !["DELIVERED","CANCELLED"].includes(j.status));
  const waitingParts = jobs.filter(j => j.status === "WAITING_PARTS");
  const lowStock     = parts.filter(p => p.qty <= p.minQty);

  type Alert = { id: string; type: string; title: string; desc: string; link?: string; color: string; icon: string };
  const alerts: Alert[] = [
    ...readyJobs.map(j => ({ id:`ready-${j.id}`, type:"READY", title:`${j.jobRef} is ready for pickup`, desc:`${j.vehicle?.make} ${j.vehicle?.model} · ${j.customerName}`, link:`/dashboard/jobs/${j.id}`, color:"bg-green-50 border-green-200", icon:"✅" })),
    ...urgentJobs.map(j => ({ id:`urgent-${j.id}`, type:"URGENT", title:`Urgent job: ${j.jobRef}`, desc:`${j.vehicle?.make} ${j.vehicle?.model} · ${j.status?.replace(/_/g," ")}`, link:`/dashboard/jobs/${j.id}`, color:"bg-red-50 border-red-200", icon:"🚨" })),
    ...waitingParts.map(j => ({ id:`parts-${j.id}`, type:"PARTS", title:`Waiting for parts: ${j.jobRef}`, desc:`${j.vehicle?.make} ${j.vehicle?.model} · ${j.customerName}`, link:`/dashboard/jobs/${j.id}`, color:"bg-orange-50 border-orange-200", icon:"⏳" })),
    ...lowStock.map(p => ({ id:`low-${p.id}`, type:"STOCK", title:`Low stock: ${p.name}`, desc:`${p.qty} ${p.unit} remaining · Min: ${p.minQty}`, link:`/dashboard/inventory`, color:"bg-amber-50 border-amber-200", icon:"📦" })),
  ];

  return (
    <div className="fade-up max-w-2xl">
      <PageHeader title="Notifications" subtitle={`${alerts.length} alerts`} />

      {loading ? <div className="flex justify-center py-20"><Spinner className="h-6 w-6"/></div> : (
        alerts.length === 0 ? (
          <Card className="p-16 text-center">
            <p className="text-4xl mb-3">🎉</p>
            <p className="text-lg font-semibold text-ink mb-1">All clear!</p>
            <p className="text-sm text-ink-subtle">No alerts at the moment</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {[{type:"READY",label:"Ready for pickup"},{type:"URGENT",label:"Urgent jobs"},{type:"PARTS",label:"Waiting for parts"},{type:"STOCK",label:"Low stock"}].map(section => {
              const sectionAlerts = alerts.filter(a => a.type === section.type);
              if (!sectionAlerts.length) return null;
              return (
                <div key={section.type}>
                  <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-2">{section.label} ({sectionAlerts.length})</p>
                  {sectionAlerts.map(alert => (
                    <Link key={alert.id} href={alert.link||"#"}
                      className={clsx("flex items-start gap-3 rounded-xl border p-4 mb-2 hover:opacity-90 transition", alert.color)}>
                      <span className="text-xl flex-shrink-0">{alert.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-ink">{alert.title}</p>
                        <p className="text-xs text-ink-subtle mt-0.5">{alert.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
