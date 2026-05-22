"use client";

import { useEffect, useState } from "react";
import { publicApi } from "@/lib/api";
import type { TrackingJob, JobStatus } from "@/lib/types";
import { Spinner } from "@/components/ui";

const STEPS: { status: JobStatus; label: string; icon: string }[] = [
  { status: "INTAKE",        label: "Checked in",   icon: "📋" },
  { status: "DIAGNOSING",    label: "Diagnosing",   icon: "🔍" },
  { status: "IN_PROGRESS",   label: "In progress",  icon: "🔧" },
  { status: "QUALITY_CHECK", label: "Quality check",icon: "✅" },
  { status: "COMPLETED",     label: "Ready!",        icon: "🎉" },
];

const STATUS_IDX: Record<string, number> = {
  INTAKE: 0, DIAGNOSING: 1, IN_PROGRESS: 2, QUALITY_CHECK: 3, COMPLETED: 4,
};

export default function TrackPage({ params }: { params: { trackingToken: string } }) {
  const [job,     setJob]     = useState<TrackingJob | null>(null);
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi.track(params.trackingToken)
      .then(setJob)
      .catch(() => setError("Job not found. Please check your reference or scan the QR code again."))
      .finally(() => setLoading(false));
  }, [params.trackingToken]);

  // Auto-refresh every 30s
  useEffect(() => {
    const t = setInterval(() => {
      publicApi.track(params.trackingToken).then(setJob).catch(() => {});
    }, 30_000);
    return () => clearInterval(t);
  }, [params.trackingToken]);

  if (loading) return <Screen><div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div></Screen>;
  if (error)   return <Screen><div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center"><p className="text-red-700">{error}</p></div></Screen>;
  if (!job)    return null;

  const stepIdx = STATUS_IDX[job.status] ?? 0;
  const isComplete = job.status === "COMPLETED";

  return (
    <Screen>
      {/* Header */}
      <div className="mb-5 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-3xl mb-3">
          🔧
        </div>
        <h1 className="text-lg font-semibold text-ink">{job.vehicle.make} {job.vehicle.model}</h1>
        <p className="text-sm text-ink-subtle">{job.vehicle.plate} · {job.workshop.name}</p>
      </div>

      {/* Job ref + status */}
      <div className={`mb-4 rounded-2xl p-4 text-center ${isComplete ? "bg-green-50 border border-green-200" : "bg-blue-50 border border-blue-200"}`}>
        <p className={`text-xs mb-1 ${isComplete ? "text-green-600" : "text-blue-600"}`}>Job reference</p>
        <p className={`text-2xl font-bold font-mono ${isComplete ? "text-green-800" : "text-blue-800"}`}>{job.jobRef}</p>
        {isComplete && <p className="mt-2 text-sm font-medium text-green-700">🎉 Your vehicle is ready for collection!</p>}
      </div>

      {/* Progress stepper */}
      <div className="mb-5 rounded-2xl border border-ink-ghost bg-white p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">Progress</p>
        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const done    = i < stepIdx;
            const current = i === stepIdx;
            return (
              <div key={step.status} className="flex items-center gap-3">
                <div className={`h-7 w-7 flex-shrink-0 rounded-full flex items-center justify-center text-xs border-2 transition-all
                  ${done    ? "border-green-500 bg-green-500 text-white" :
                    current ? "border-brand-600 bg-brand-600 text-white" :
                              "border-ink-ghost bg-white text-ink-faint"}`}>
                  {done ? "✓" : step.icon}
                </div>
                <span className={`text-sm ${current ? "font-semibold text-brand-600" : done ? "text-ink" : "text-ink-faint"}`}>
                  {step.label}
                </span>
                {current && <span className="ml-auto text-[10px] text-brand-400 animate-pulse font-medium">● Now</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Estimate */}
      {job.estimate && (
        <div className="mb-4 rounded-2xl border border-ink-ghost bg-white p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Estimate</p>
          <div className="flex justify-between text-sm">
            <span className="text-ink-subtle">Subtotal</span><span>GHS {job.estimate.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-subtle">VAT (12.5%)</span><span>GHS {job.estimate.tax.toLocaleString()}</span>
          </div>
          <div className="mt-2 flex justify-between border-t border-ink-ghost pt-2 text-base font-semibold">
            <span>Total</span><span>GHS {job.estimate.total.toLocaleString()}</span>
          </div>

          {job.estimate.status === "SENT" && (
            <div className="mt-3 flex gap-2">
              <a
                href={`/estimate/${job.estimate.approvalToken}`}
                className="flex-1 rounded-xl bg-green-600 py-2 text-center text-sm font-medium text-white hover:bg-green-700 transition"
              >
                Review & approve →
              </a>
            </div>
          )}
          {job.estimate.status === "APPROVED" && (
            <p className="mt-3 text-center text-sm font-medium text-green-700">✅ Estimate approved</p>
          )}
          {job.estimate.status === "REJECTED" && (
            <p className="mt-3 text-center text-sm text-red-600">Estimate rejected — workshop will contact you.</p>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-2xl border border-ink-ghost bg-white p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">Updates</p>
        <div className="space-y-3">
          {[...job.timeline].reverse().map((entry, i) => (
            <div key={i} className="flex gap-2.5">
              <div className="mt-0.5 flex-shrink-0">
                <div className="h-2 w-2 rounded-full bg-brand-400 mt-1" />
              </div>
              <div>
                <p className="text-[10px] text-ink-faint">{new Date(entry.createdAt).toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" })}</p>
                <p className="text-xs text-ink">{entry.note || entry.status.replace(/_/g, " ")}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      {job.workshop.phone && (
        <a
          href={`tel:${job.workshop.phone}`}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-ink-ghost bg-white py-3 text-sm font-medium text-ink-subtle hover:bg-ink-paper transition"
        >
          📞 Call {job.workshop.name}
        </a>
      )}
      <p className="mt-3 text-center text-[10px] text-ink-faint">Auto-refreshes every 30 seconds</p>
    </Screen>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-paper px-4 py-8">
      <div className="mx-auto max-w-sm fade-up">{children}</div>
    </div>
  );
}
