"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Spinner, Card, PageHeader, StatusBadge, Metric } from "@/components/ui";
import type { JobStatus } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface VehicleHistory {
  vehicle: {
    id: string; plate: string; make?: string; model?: string;
    year?: number; color?: string;
  };
  stats: {
    totalJobs: number; totalSpend: number; lastMileage: number | null;
    firstSeen: string | null; workshops: string[];
  };
  jobs: {
    id: string; jobRef: string; mileage: number; customerName: string;
    complaint: string; status: string; createdAt: string; completedAt?: string;
    workshop: { name: string; location: string };
    technician: { name: string } | null;
    estimate: { total: number; status: string } | null;
    invoice:  { total: number; status: string } | null;
    statusHistory: { status: string; note?: string; createdAt: string; changedBy?: { name: string } | null }[];
  }[];
}

export default function VehicleHistoryPage({ params }: { params: { plate: string } }) {
  const router  = useRouter();
  const plate   = decodeURIComponent(params.plate);
  const [data,    setData]    = useState<VehicleHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("sl_token");
    fetch(`${API_BASE}/api/vehicles/${encodeURIComponent(plate)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async r => {
        if (!r.ok) throw new Error((await r.json()).error || "Not found");
        return r.json();
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [plate]);

  if (loading) return <div className="flex justify-center py-24"><Spinner className="h-6 w-6" /></div>;
  if (error)   return (
    <div className="fade-up">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-2xl mb-2">⚠️</p>
        <p className="font-medium text-red-700">{error}</p>
        <button onClick={() => router.back()} className="mt-3 text-sm text-red-600 underline">Go back</button>
      </div>
    </div>
  );
  if (!data) return null;

  const { vehicle, stats, jobs } = data;
  const title = [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(" ") || "Unknown vehicle";

  return (
    <div className="fade-up">
      <PageHeader
        title={`${vehicle.plate}`}
        subtitle={`${title} · Full service history`}
        action={
          <button onClick={() => router.back()}
            className="rounded-lg border border-ink-ghost px-4 py-2 text-sm text-ink-subtle hover:bg-white transition">
            ← Back
          </button>
        }
      />

      {/* Vehicle card */}
      <Card className="mb-5 p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl">🚗</div>
            <div>
              <p className="text-xl font-bold text-ink font-mono">{vehicle.plate}</p>
              <p className="text-sm text-ink-subtle">{title}</p>
              {vehicle.color && <p className="text-xs text-ink-faint mt-0.5">Colour: {vehicle.color}</p>}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Total visits"      value={stats.totalJobs} />
          <Metric label="Total spend (GHS)" value={stats.totalSpend.toLocaleString()} />
          <Metric label="Last mileage (km)" value={stats.lastMileage?.toLocaleString() ?? "—"} />
          <Metric label="Workshops visited" value={stats.workshops.length} />
        </div>
        {stats.workshops.length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {stats.workshops.map(ws => (
              <span key={ws} className="rounded-full border border-ink-ghost bg-ink-paper px-3 py-1 text-xs text-ink-subtle">
                {ws}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Job history */}
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {jobs.length} service record{jobs.length !== 1 ? "s" : ""} — most recent first
      </p>

      {jobs.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-ink-faint">No service records found for this vehicle.</p>
        </Card>
      )}

      <div className="space-y-3">
        {jobs.map((job, idx) => {
          const isOpen   = expanded === job.id;
          const amount   = job.invoice?.total || job.estimate?.total;
          const isPaid   = job.invoice?.status === "PAID";
          const isFirst  = idx === jobs.length - 1;

          return (
            <Card key={job.id} className="overflow-hidden">
              {/* Summary row */}
              <button
                onClick={() => setExpanded(isOpen ? null : job.id)}
                className="w-full text-left px-5 py-4 hover:bg-ink-paper transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {/* Timeline dot */}
                    <div className="relative flex-shrink-0 pt-1">
                      <div className={`h-3 w-3 rounded-full border-2 ${isFirst ? "border-brand-600 bg-brand-600" : "border-brand-400 bg-white"}`} />
                      {idx < jobs.length - 1 && (
                        <div className="absolute left-1/2 top-3 -translate-x-1/2 w-0.5 h-8 bg-ink-ghost" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-brand-600">{job.jobRef}</span>
                        <StatusBadge status={job.status as JobStatus} />
                        {isPaid && <span className="rounded-md border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">PAID</span>}
                      </div>
                      <p className="mt-1 text-sm text-ink">{job.complaint}</p>
                      <div className="mt-1 flex gap-3 text-xs text-ink-faint flex-wrap">
                        <span>📍 {job.workshop.name}</span>
                        <span>📅 {new Date(job.createdAt).toLocaleDateString("en-GH", { day:"numeric", month:"short", year:"numeric" })}</span>
                        <span>🔧 {job.mileage.toLocaleString()} km</span>
                        {job.technician && <span>👤 {job.technician.name}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {amount ? (
                      <p className="text-base font-semibold text-ink">GHS {amount.toLocaleString()}</p>
                    ) : (
                      <p className="text-xs text-ink-faint">No estimate</p>
                    )}
                    <p className="text-xs text-ink-faint mt-0.5">{isOpen ? "▲ Hide" : "▼ Details"}</p>
                  </div>
                </div>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-ink-ghost bg-ink-paper px-5 py-4 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Status timeline */}
                    {job.statusHistory.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-ink-faint mb-2 uppercase tracking-wide">Timeline</p>
                        <div className="space-y-2">
                          {job.statusHistory.map((entry, i) => (
                            <div key={i} className="flex gap-2 text-xs">
                              <div className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-400" />
                              <div>
                                <span className="font-medium text-ink">{entry.status.replace(/_/g, " ")}</span>
                                <span className="text-ink-faint ml-2">{new Date(entry.createdAt).toLocaleTimeString("en-GH", { hour:"2-digit", minute:"2-digit" })}</span>
                                {entry.note && <p className="text-ink-subtle mt-0.5">{entry.note}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Estimate summary */}
                    {job.estimate && (
                      <div>
                        <p className="text-xs font-semibold text-ink-faint mb-2 uppercase tracking-wide">Estimate</p>
                        <div className="rounded-xl border border-ink-ghost bg-white p-3 space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-ink-faint">Total</span>
                            <span className="font-semibold">GHS {job.estimate.total.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-ink-faint">Status</span>
                            <span className={`font-medium ${job.estimate.status === "APPROVED" ? "text-green-600" : "text-ink-subtle"}`}>
                              {job.estimate.status}
                            </span>
                          </div>
                          {job.invoice && (
                            <div className="flex justify-between text-xs pt-1 border-t border-ink-ghost">
                              <span className="text-ink-faint">Invoice</span>
                              <span className={`font-medium ${job.invoice.status === "PAID" ? "text-green-600" : "text-amber-600"}`}>
                                {job.invoice.status}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/jobs/${job.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-100 transition"
                  >
                    Open full job record →
                  </Link>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
