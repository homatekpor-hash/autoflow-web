"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const STEPS = ["Vehicle", "Contact", "Complaint", "Confirm"];

export default function CheckinPage({ params }: { params: { qrToken: string } }) {
  const [workshop, setWorkshop]   = useState<any>(null);
  const [notFound, setNotFound]   = useState(false);
  const [step,     setStep]       = useState(0);
  const [done,     setDone]       = useState(false);
  const [jobRef,   setJobRef]     = useState("");
  const [saving,   setSaving]     = useState(false);
  const [error,    setError]      = useState("");

  const [form, setForm] = useState({
    plate: "", make: "", model: "", year: "", color: "", mileage: "",
    customerName: "", customerPhone: "", customerEmail: "",
    complaint: "", urgency: "NORMAL",
  });

  useEffect(() => {
    fetch(`${API}/api/workshops/qr/${params.qrToken}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d ? setWorkshop(d) : setNotFound(true))
      .catch(() => setNotFound(true));
  }, [params.qrToken]);

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  function canNext() {
    if (step === 0) return form.plate && form.make && form.model;
    if (step === 1) return form.customerName && form.customerPhone;
    if (step === 2) return form.complaint;
    return true;
  }

  async function submit() {
    setSaving(true); setError("");
    try {
      const res = await fetch(`${API}/api/checkin/${params.qrToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) { setJobRef(data.jobRef || data.job?.jobRef || "RECEIVED"); setDone(true); }
      else setError(data.error || "Submission failed. Please try again.");
    } catch { setError("Network error. Please check your connection."); }
    setSaving(false);
  }

  if (notFound) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="text-center">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-xl font-bold text-white mb-2">Workshop not found</h1>
        <p className="text-gray-400 text-sm">This QR code may be invalid or expired.</p>
      </div>
    </div>
  );

  if (!workshop) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"/>
    </div>
  );

  if (done) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-6 text-4xl">✓</div>
        <h1 className="text-2xl font-bold text-white mb-2">You're checked in!</h1>
        <p className="text-gray-400 mb-6">Your vehicle has been registered at <strong className="text-white">{workshop.name}</strong>. A service advisor will be with you shortly.</p>
        {jobRef && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 mb-6">
            <p className="text-xs text-orange-400 mb-1">Your job reference</p>
            <p className="text-2xl font-mono font-bold text-orange-400">{jobRef}</p>
            <p className="text-xs text-gray-500 mt-1">Keep this number for follow-up</p>
          </div>
        )}
        <button onClick={() => { setDone(false); setStep(0); setForm({ plate:"",make:"",model:"",year:"",color:"",mileage:"",customerName:"",customerPhone:"",customerEmail:"",complaint:"",urgency:"NORMAL" }); }}
          className="w-full py-3 rounded-xl border border-gray-700 text-gray-300 text-sm hover:bg-gray-800 transition">
          Submit another vehicle
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 py-8 px-4">
      <div className="max-w-md mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center mx-auto mb-3 text-2xl">🔧</div>
          <h1 className="text-xl font-bold text-white">{workshop.name}</h1>
          <p className="text-gray-400 text-sm mt-1">Vehicle check-in</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`flex-1 h-1 rounded-full transition-all ${i <= step ? "bg-orange-500" : "bg-gray-800"}`}/>
              {i === STEPS.length - 1 && <div className={`w-2 h-2 rounded-full ${i <= step ? "bg-orange-500" : "bg-gray-700"}`}/>}
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 text-center mb-6">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>

        {/* Form card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-4">

          {/* Step 0 — Vehicle */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">Vehicle details</h2>
              <div>
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1.5">Number plate *</label>
                <input value={form.plate} onChange={e => set("plate", e.target.value.toUpperCase())}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white font-mono text-lg tracking-widest focus:border-orange-500 focus:outline-none transition"
                  placeholder="GR-1234-22" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Make *</label>
                  <input value={form.make} onChange={e => set("make", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white focus:border-orange-500 focus:outline-none transition text-sm"
                    placeholder="Toyota" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Model *</label>
                  <input value={form.model} onChange={e => set("model", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white focus:border-orange-500 focus:outline-none transition text-sm"
                    placeholder="Camry" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Year</label>
                  <input value={form.year} onChange={e => set("year", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white focus:border-orange-500 focus:outline-none transition text-sm"
                    placeholder="2020" type="number" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Color</label>
                  <input value={form.color} onChange={e => set("color", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white focus:border-orange-500 focus:outline-none transition text-sm"
                    placeholder="Silver" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Current mileage (km)</label>
                <input value={form.mileage} onChange={e => set("mileage", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-3 text-white focus:border-orange-500 focus:outline-none transition text-sm"
                  placeholder="55,000" type="number" />
              </div>
            </div>
          )}

          {/* Step 1 — Contact */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">Your details</h2>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Full name *</label>
                <input value={form.customerName} onChange={e => set("customerName", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none transition"
                  placeholder="Kwame Asante" autoFocus />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Phone number *</label>
                <input value={form.customerPhone} onChange={e => set("customerPhone", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none transition"
                  placeholder="+233 24 000 0000" type="tel" />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Email (optional)</label>
                <input value={form.customerEmail} onChange={e => set("customerEmail", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none transition"
                  placeholder="kwame@email.com" type="email" />
              </div>
            </div>
          )}

          {/* Step 2 — Complaint */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white mb-4">What's the problem?</h2>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Describe the issue *</label>
                <textarea value={form.complaint} onChange={e => set("complaint", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-orange-500 focus:outline-none transition text-sm resize-none"
                  placeholder="e.g. Car makes a knocking sound when I brake. Engine light is on." rows={4} autoFocus />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide block mb-3">Urgency level</label>
                <div className="grid grid-cols-3 gap-2">
                  {[["NORMAL","🟢","Normal"],["HIGH","🟡","Urgent"],["URGENT","🔴","Emergency"]].map(([val, icon, label]) => (
                    <button key={val} onClick={() => set("urgency", val)}
                      className={`py-3 rounded-xl border text-sm font-medium transition ${form.urgency === val ? "border-orange-500 bg-orange-500/10 text-orange-400" : "border-gray-700 text-gray-400 hover:border-gray-600"}`}>
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Confirm */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Confirm your details</h2>
              <div className="space-y-3">
                {[
                  ["🚗 Vehicle", `${form.year} ${form.make} ${form.model}`],
                  ["🔢 Plate", form.plate],
                  ["👤 Name", form.customerName],
                  ["📞 Phone", form.customerPhone],
                  ["⚠️ Issue", form.complaint],
                  ["🚨 Urgency", form.urgency],
                ].map(([label, value]) => value && (
                  <div key={String(label)} className="flex justify-between items-start py-2 border-b border-gray-800 last:border-0">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="text-sm text-white text-right max-w-48 break-words">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-sm text-red-400 mb-4">{error}</div>}

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3.5 rounded-xl border border-gray-700 text-gray-300 font-medium hover:bg-gray-800 transition">
              ← Back
            </button>
          )}
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              className="flex-1 py-3.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition disabled:opacity-40 disabled:cursor-not-allowed">
              Continue →
            </button>
          ) : (
            <button onClick={submit} disabled={saving}
              className="flex-1 py-3.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition disabled:opacity-60">
              {saving ? "Submitting…" : "✓ Submit check-in"}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">Powered by AutoFlow Ghana</p>
      </div>
    </div>
  );
}
