"use client";

import { useState } from "react";
import { estimateApi } from "@/lib/api";
import { Spinner } from "@/components/ui";

export default function EstimateApprovalPage({ params }: { params: { token: string } }) {
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const [reason,   setReason]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showReject, setShowReject] = useState(false);

  async function approve() {
    setLoading(true);
    try {
      await estimateApi.approve(params.token);
      setDecision("approved");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  }

  async function reject() {
    setLoading(true);
    try {
      await estimateApi.reject(params.token, reason);
      setDecision("rejected");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-ink-paper px-4 py-12">
      <div className="mx-auto max-w-sm fade-up">
        <div className="mb-6 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-2xl mb-3">🔧</div>
          <h1 className="text-lg font-semibold text-ink">Estimate approval</h1>
          <p className="text-sm text-ink-subtle mt-1">Review the quote for your vehicle repair</p>
        </div>

        {decision === "approved" && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
            <p className="text-3xl mb-2">✅</p>
            <p className="font-semibold text-green-800">Estimate approved!</p>
            <p className="text-sm text-green-700 mt-1">Work will begin on your vehicle shortly. You'll receive an SMS update.</p>
          </div>
        )}

        {decision === "rejected" && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-3xl mb-2">❌</p>
            <p className="font-semibold text-red-800">Estimate rejected</p>
            <p className="text-sm text-red-700 mt-1">The workshop has been notified and will contact you to discuss.</p>
          </div>
        )}

        {!decision && (
          <div className="rounded-2xl border border-ink-ghost bg-white p-5 space-y-4">
            <p className="text-sm text-ink-subtle text-center">Tap Approve to give the workshop the go-ahead, or Reject to request a revision.</p>

            {!showReject ? (
              <div className="space-y-3">
                <button
                  onClick={approve}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60"
                >
                  {loading ? <Spinner /> : "✅ Approve estimate"}
                </button>
                <button
                  onClick={() => setShowReject(true)}
                  className="w-full rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition"
                >
                  ❌ Request revision
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="label">Reason for rejection (optional)</label>
                  <textarea
                    className="input min-h-[80px]"
                    placeholder="e.g. Price too high, please explore alternatives…"
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    rows={3}
                  />
                </div>
                <button
                  onClick={reject}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 transition disabled:opacity-60"
                >
                  {loading ? <Spinner /> : "Confirm rejection"}
                </button>
                <button onClick={() => setShowReject(false)} className="w-full text-sm text-ink-faint hover:text-ink transition">
                  ← Back
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
