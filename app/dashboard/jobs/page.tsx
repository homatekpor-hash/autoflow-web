"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { jobApi } from "@/lib/api";
import type { Job, JobStatus } from "@/lib/types";
import { PageHeader, StatusBadge, Spinner, Card } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";

function downloadInvoice() {
  const token = localStorage.getItem("sl_token");
  fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/jobs/${job!.id}/invoice/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(res => res.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href     = url;
      a.download = `${job!.jobRef}-invoice.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch(() => alert("Failed to download invoice"));
}
const STATUS_OPTS: { label: string; value: string }[] = [
  { label: "All statuses", value: "" },
  { label: "Intake",        value: "INTAKE" },
  { label: "Diagnosing",    value: "DIAGNOSING" },
  { label: "In Progress",   value: "IN_PROGRESS" },
  { label: "Quality Check", value: "QUALITY_CHECK" },
  { label: "Completed",     value: "COMPLETED" },
  { label: "Cancelled",     value: "CANCELLED" },
];

export default function JobsPage() {
  const { user } = useAuth();
  const [jobs,    setJobs]    = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("");

  useEffect(() => {
    jobApi.list({ status: status || undefined, search: search || undefined })
      .then(setJobs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status]);

  // Client-side search filter
  const filtered = search
    ? jobs.filter(j =>
        j.jobRef.toLowerCase().includes(search.toLowerCase()) ||
        j.vehicle.plate.toLowerCase().includes(search.toLowerCase()) ||
        j.customerName.toLowerCase().includes(search.toLowerCase()) ||
        `${j.vehicle.make} ${j.vehicle.model}`.toLowerCase().includes(search.toLowerCase())
      )
    : jobs;

  return (
    <div className="fade-up">
      <PageHeader
        title="All jobs"
        subtitle={`${filtered.length} job${filtered.length !== 1 ? "s" : ""} found`}
      />

      {/* Filters */}
      <div className="mb-4 flex gap-3 flex-wrap">
        <input
          className="input w-64"
          placeholder="Search plate, name, job ref…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="input w-44"
          value={status}
          onChange={e => { setStatus(e.target.value); setLoading(true); }}
        >
          {STATUS_OPTS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>
<button onClick={downloadInvoice}
  className="inline-flex items-center gap-1.5 rounded-lg border border-brand-600 bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 transition">
  📄 Download invoice PDF
</button>
<button onClick={downloadInvoice}
  className="flex items-center justify-center gap-2 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-4 text-sm font-medium text-brand-600 hover:bg-brand-100 transition w-full">
  📄 Download invoice PDF
</button>
      {loading ? (
        <div className="flex justify-center py-16"><Spinner className="h-6 w-6" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-2xl mb-2">🔧</p>
          <p className="text-sm font-medium text-ink-muted">No jobs found</p>
          <p className="text-xs text-ink-faint mt-1">Try adjusting your search or filter</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-ghost bg-ink-paper">
                {["Job ref", "Vehicle", "Customer", "Workshop", "Status", "Technician", "Created", ""].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-ink-faint whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-ghost">
              {filtered.map(job => (
                <tr key={job.id} className="hover:bg-ink-paper transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-medium text-brand-600">{job.jobRef}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink text-xs">{job.vehicle.make} {job.vehicle.model}</p>
                    <p className="text-[11px] text-ink-faint">{job.vehicle.plate}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-ink">{job.customerName}</p>
                    <p className="text-[11px] text-ink-faint">{job.customerPhone || "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-subtle max-w-[130px] truncate">
                    {job.workshop.name}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={job.status as JobStatus} />
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-subtle">
                    {job.technician?.name || <span className="text-ink-faint">Unassigned</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-faint whitespace-nowrap">
                    {new Date(job.createdAt).toLocaleDateString("en-GH")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/jobs/${job.id}`}
                      className="rounded-lg border border-ink-ghost px-3 py-1 text-xs text-ink-subtle hover:bg-white hover:text-ink transition"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
