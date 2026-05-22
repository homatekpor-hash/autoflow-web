"use client";

import { useState } from "react";
import clsx from "clsx";
import { jobApi } from "@/lib/api";
import type { Job, JobStatus } from "@/lib/types";
import { StatusBadge, Spinner } from "@/components/ui";

const COLUMNS: { status: JobStatus; label: string; dot: string }[] = [
  { status: "INTAKE",        label: "Intake",        dot: "bg-gray-400" },
  { status: "DIAGNOSING",    label: "Diagnosing",    dot: "bg-yellow-400" },
  { status: "IN_PROGRESS",   label: "In Progress",   dot: "bg-blue-500" },
  { status: "QUALITY_CHECK", label: "Quality Check", dot: "bg-green-400" },
  { status: "COMPLETED",     label: "Completed",     dot: "bg-green-600" },
];

interface Props {
  jobs: Job[];
  onJobUpdated: (job: Job) => void;
}

export default function JobBoard({ jobs, onJobUpdated }: Props) {
  const [selected, setSelected] = useState<Job | null>(null);
  const [updating, setUpdating] = useState(false);

  async function moveJob(job: Job, newStatus: JobStatus) {
    if (job.status === newStatus) return;
    setUpdating(true);
    try {
      const updated = await jobApi.updateStatus(job.id, newStatus);
      onJobUpdated(updated);
      if (selected?.id === job.id) setSelected(updated);
    } finally {
      setUpdating(false);
    }
  }

  const byStatus = (status: JobStatus) => jobs.filter(j => j.status === status);

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {COLUMNS.map(col => (
        <div key={col.status} className="flex-shrink-0 w-52">
          {/* Column header */}
          <div className="mb-2 flex items-center gap-2 px-1">
            <span className={clsx("h-2 w-2 rounded-full", col.dot)} />
            <span className="text-xs font-medium text-ink-subtle">{col.label}</span>
            <span className="ml-auto rounded-full bg-ink-ghost px-1.5 py-0.5 text-[10px] font-medium text-ink-faint">
              {byStatus(col.status).length}
            </span>
          </div>

          {/* Cards */}
          <div className="kanban-col space-y-2">
            {byStatus(col.status).map(job => (
              <button
                key={job.id}
                onClick={() => setSelected(job)}
                className={clsx(
                  "w-full rounded-xl border bg-white p-3 text-left shadow-card transition-all hover:shadow-lift",
                  selected?.id === job.id ? "border-brand-400 ring-2 ring-brand-100" : "border-ink-ghost"
                )}
              >
                <p className="text-[10px] text-ink-faint font-mono">{job.jobRef}</p>
                <p className="mt-0.5 text-xs font-semibold text-ink leading-tight">
                  {job.vehicle.make} {job.vehicle.model}
                </p>
                <p className="text-[10px] text-ink-subtle mt-0.5">{job.vehicle.plate}</p>
                <p className="mt-1.5 text-[11px] text-ink-subtle line-clamp-2 leading-relaxed">{job.complaint}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-ink-faint">{job.technician?.name ?? "Unassigned"}</span>
                  {job.estimate && (
                    <span className="text-[10px] font-medium text-green-700">GHS {job.estimate.total.toLocaleString()}</span>
                  )}
                </div>
              </button>
            ))}

            {byStatus(col.status).length === 0 && (
              <div className="rounded-xl border border-dashed border-ink-ghost py-6 text-center">
                <p className="text-[11px] text-ink-faint">Empty</p>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Job detail panel */}
      {selected && (
        <div className="flex-shrink-0 w-72 rounded-2xl border border-ink-ghost bg-white shadow-lift p-4 self-start sticky top-0">
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-mono text-ink-faint">{selected.jobRef}</p>
              <p className="mt-0.5 text-sm font-semibold text-ink">{selected.vehicle.make} {selected.vehicle.model} {selected.vehicle.year}</p>
              <p className="text-xs text-ink-subtle">{selected.vehicle.plate}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-ink-faint hover:text-ink text-lg leading-none">×</button>
          </div>

          <StatusBadge status={selected.status} />

          <div className="mt-3 space-y-2">
            {[
              ["Customer",  selected.customerName],
              ["Phone",     selected.customerPhone || "—"],
              ["Mileage",   `${selected.mileage.toLocaleString()} km`],
              ["Technician", selected.technician?.name || "Unassigned"],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between text-xs">
                <span className="text-ink-faint">{l}</span>
                <span className="font-medium text-ink">{v}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg bg-ink-paper p-2.5">
            <p className="text-[10px] text-ink-faint mb-1">Complaint</p>
            <p className="text-xs text-ink leading-relaxed">{selected.complaint}</p>
          </div>

          {selected.estimate && (
            <div className="mt-3 rounded-lg bg-green-50 border border-green-100 p-2.5">
              <p className="text-[10px] text-green-600 mb-1">Estimate</p>
              <p className="text-sm font-semibold text-green-800">GHS {selected.estimate.total.toLocaleString()}</p>
              <StatusBadge status={selected.status} />
            </div>
          )}

          <div className="mt-4">
            <p className="text-[10px] text-ink-faint mb-2 uppercase tracking-wide">Move to</p>
            <div className="grid grid-cols-2 gap-1.5">
              {COLUMNS.filter(c => c.status !== selected.status).map(col => (
                <button
                  key={col.status}
                  disabled={updating}
                  onClick={() => moveJob(selected, col.status)}
                  className="rounded-lg border border-ink-ghost px-2 py-1.5 text-xs text-ink-subtle hover:bg-ink-paper hover:text-ink transition disabled:opacity-50"
                >
                  {updating ? <Spinner /> : col.label}
                </button>
              ))}
            </div>
          </div>

          {/* Invoice download */}
          {selected.estimate && (
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/jobs/${selected.id}/invoice/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-ink-ghost bg-ink-paper py-2 text-xs font-medium text-ink-subtle hover:bg-white hover:text-ink transition"
            >
              📄 Download invoice PDF
            </a>
          )}
        </div>
      )}
    </div>
  );
}
