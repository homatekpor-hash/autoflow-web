"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, PageHeader, Spinner } from "@/components/ui";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function authFetch(url: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("sl_token");
  return fetch(url, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
}

export default function WorkshopsPage() {
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showAdd,   setShowAdd]   = useState(false);
  const [showQR,    setShowQR]    = useState<any>(null);
  const [qrData,    setQrData]    = useState<string>("");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [form, setForm] = useState({ name: "", location: "", phone: "" });

  async function load() {
    const res = await authFetch(`${API}/api/workshops`);
    if (res.ok) setWorkshops(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function loadQR(ws: any) {
    setShowQR(ws); setQrData("");
    const res = await authFetch(`${API}/api/workshops/${ws.id}/qrcode`);
    if (res.ok) { const d = await res.json(); setQrData(d.dataUrl); }
  }

  async function addWorkshop(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (!form.name.trim() || !form.location.trim()) { setError("Name and location are required."); return; }
    setSaving(true);
    const res = await authFetch(`${API}/api/workshops`, { method: "POST", body: JSON.stringify(form) });
    if (res.ok) { await load(); setShowAdd(false); setForm({ name: "", location: "", phone: "" }); }
    else { const d = await res.json(); setError(d.error || "Failed to create workshop"); }
    setSaving(false);
  }

  const canAdd = user?.role === "OWNER" || user?.role === "SUPER_ADMIN";
  const checkinUrl = (ws: any) => `http://localhost:3000/checkin/${ws.qrToken}`;

  return (
    <div className="fade-up">
      <PageHeader
        title="Workshops"
        subtitle={`${workshops.length} workshop${workshops.length !== 1 ? "s" : ""} in your network`}
        action={canAdd && (
          <button onClick={() => setShowAdd(true)}
            className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition">
            + Add workshop
          </button>
        )}
      />

      {loading ? (
        <div className="flex justify-center py-20"><Spinner className="h-6 w-6" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workshops.map((ws: any) => (
            <Card key={ws.id} className="p-5 hover:shadow-lift transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-ink">{ws.name}</h3>
                  <p className="text-xs text-ink-subtle mt-0.5">📍 {ws.location}</p>
                  {ws.phone && <p className="text-xs text-ink-subtle">📞 {ws.phone}</p>}
                </div>
                <div className={clsx("h-2.5 w-2.5 rounded-full mt-1", ws.active ? "bg-green-400" : "bg-gray-300")} />
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                {[["Active", ws.stats?.active ?? 0], ["Done", ws.stats?.completed ?? 0], ["Staff", ws._count?.members ?? 0]].map(([l, v]) => (
                  <div key={String(l)} className="rounded-lg bg-ink-paper p-2 text-center">
                    <p className="text-lg font-semibold text-ink">{v}</p>
                    <p className="text-[10px] text-ink-faint">{l}</p>
                  </div>
                ))}
              </div>

              <div className="h-1.5 rounded-full bg-ink-paper overflow-hidden mb-4">
                <div className="h-full rounded-full bg-orange-400 transition-all"
                  style={{ width: `${Math.min(100, ((ws.stats?.active ?? 0) / 10) * 100)}%` }} />
              </div>

              {/* QR Check-in button */}
              <button onClick={() => loadQR(ws)}
                className="w-full rounded-xl border border-orange-200 bg-orange-50 py-2.5 text-sm font-medium text-orange-600 hover:bg-orange-100 transition flex items-center justify-center gap-2">
                <span>📱</span> Customer QR Check-in
              </button>
            </Card>
          ))}

          {canAdd && (
            <button onClick={() => setShowAdd(true)}
              className="rounded-2xl border-2 border-dashed border-ink-ghost p-5 text-center hover:border-orange-300 hover:bg-orange-50 transition group">
              <p className="text-3xl mb-2 group-hover:scale-110 transition-transform">🏭</p>
              <p className="text-sm font-medium text-ink-subtle group-hover:text-orange-600">+ Add new workshop</p>
            </button>
          )}
        </div>
      )}

      {/* ── QR Code Modal ── */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-ghost px-6 py-4">
              <h2 className="font-semibold text-ink">Customer Check-in QR</h2>
              <button onClick={() => { setShowQR(null); setQrData(""); }} className="text-ink-faint hover:text-ink text-2xl leading-none">×</button>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm font-medium text-ink mb-1">{showQR.name}</p>
              <p className="text-xs text-ink-subtle mb-5">Customers scan this to check in their vehicle</p>

              {qrData ? (
                <div className="flex justify-center mb-4">
                  <img src={qrData} alt="QR Code" className="w-52 h-52 rounded-xl border border-ink-ghost" />
                </div>
              ) : (
                <div className="flex justify-center mb-4">
                  <div className="w-52 h-52 rounded-xl border border-ink-ghost flex items-center justify-center">
                    <Spinner className="h-6 w-6" />
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-ink-paper border border-ink-ghost p-3 mb-5">
                <p className="text-[10px] text-ink-faint mb-1">Check-in link</p>
                <p className="text-xs font-mono text-ink break-all">{checkinUrl(showQR)}</p>
              </div>

              <div className="flex gap-2">
                {qrData && (
                  <a href={qrData} download={`${showQR.name}-checkin-qr.png`}
                    className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition text-center">
                    ⬇ Download QR
                  </a>
                )}
                <a href={checkinUrl(showQR)} target="_blank" rel="noreferrer"
                  className="flex-1 rounded-xl border border-ink-ghost py-2.5 text-sm text-ink-subtle hover:bg-ink-paper transition text-center">
                  Open link →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Workshop Modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-ghost px-6 py-4">
              <h2 className="font-semibold text-ink text-lg">Add new workshop</h2>
              <button onClick={() => { setShowAdd(false); setError(""); }} className="text-ink-faint hover:text-ink text-2xl leading-none">×</button>
            </div>
            <form onSubmit={addWorkshop} className="p-6 space-y-4">
              <div><label className="label">Workshop name *</label><input className="input" placeholder="e.g. AutoFlow East Legon" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required autoFocus /></div>
              <div><label className="label">Location *</label><input className="input" placeholder="e.g. East Legon, Accra" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} required /></div>
              <div><label className="label">Phone number</label><input className="input" placeholder="+233 30 000 0000" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowAdd(false); setError(""); }} className="flex-1 rounded-xl border border-ink-ghost py-2.5 text-sm text-ink-subtle hover:bg-ink-paper transition">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition disabled:opacity-60">{saving ? "Creating…" : "Create workshop"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
