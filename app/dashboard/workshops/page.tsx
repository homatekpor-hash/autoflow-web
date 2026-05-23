"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, PageHeader, Spinner } from "@/components/ui";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function authFetch(url: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("sl_token");
  return fetch(url, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
}

export default function WorkshopsPage() {
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", location: "", phone: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await authFetch(`${API}/api/workshops`);
    if (res.ok) setWorkshops(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addWorkshop(e: React.FormEvent) {
    e.preventDefault(); setError("");
    setSaving(true);
    const res = await authFetch(`${API}/api/workshops`, { method: "POST", body: JSON.stringify(form) });
    if (res.ok) { await load(); setShowAdd(false); setForm({ name: "", location: "", phone: "" }); }
    else { const d = await res.json(); setError(d.error || "Failed"); }
    setSaving(false);
  }

  const canAdd = user?.role === "OWNER" || user?.role === "SUPER_ADMIN";
  const getQRUrl = (ws: any) => {
    const base = typeof window !== "undefined" ? window.location.origin : "https://autoflow-web-vq1f.vercel.app";
    const link = `${base}/checkin/${ws.qrToken}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(link)}`;
  };
  const getCheckinUrl = (ws: any) => {
    const base = typeof window !== "undefined" ? window.location.origin : "https://autoflow-web-vq1f.vercel.app";
    return `${base}/checkin/${ws.qrToken}`;
  };

  return (
    <div className="fade-up">
      <PageHeader title="Workshops" subtitle={`${workshops.length} workshop${workshops.length !== 1 ? "s" : ""}`}>
        {canAdd && (
          <button onClick={() => setShowAdd(true)} className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition">
            + Add workshop
          </button>
        )}
      </PageHeader>

      {loading ? <div className="flex justify-center py-20"><Spinner className="h-6 w-6" /></div> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workshops.map((ws: any) => (
            <Card key={ws.id} className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-ink">{ws.name}</h3>
                  <p className="text-xs text-ink-subtle mt-0.5">?? {ws.location}</p>
                  {ws.phone && <p className="text-xs text-ink-subtle">?? {ws.phone}</p>}
                </div>
                <div className="h-2.5 w-2.5 rounded-full bg-green-400 mt-1" />
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[["Active", ws.stats?.active ?? 0], ["Done", ws.stats?.completed ?? 0], ["Staff", ws._count?.members ?? 0]].map(([l, v]) => (
                  <div key={String(l)} className="rounded-lg bg-ink-paper p-2 text-center">
                    <p className="text-lg font-semibold text-ink">{v}</p>
                    <p className="text-[10px] text-ink-faint">{l}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowQR(ws)}
                className="w-full rounded-xl border border-orange-200 bg-orange-50 py-2.5 text-sm font-medium text-orange-600 hover:bg-orange-100 transition">
                ?? Customer QR Check-in
              </button>
            </Card>
          ))}
          {canAdd && (
            <button onClick={() => setShowAdd(true)} className="rounded-2xl border-2 border-dashed border-ink-ghost p-5 text-center hover:border-orange-300 transition">
              <p className="text-3xl mb-2">??</p>
              <p className="text-sm text-ink-subtle">+ Add new workshop</p>
            </button>
          )}
        </div>
      )}

      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowQR(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-ink-ghost px-6 py-4">
              <h2 className="font-semibold text-ink">Customer QR Check-in</h2>
              <button onClick={() => setShowQR(null)} className="text-2xl text-ink-faint hover:text-ink">×</button>
            </div>
            <div className="p-6 text-center">
              <p className="font-medium text-ink mb-1">{showQR.name}</p>
              <p className="text-xs text-ink-subtle mb-4">Customers scan this to check in their vehicle</p>
              <img src={getQRUrl(showQR)} alt="QR Code" className="w-52 h-52 rounded-xl border border-ink-ghost mx-auto mb-4" />
              <div className="rounded-xl bg-ink-paper p-3 mb-4">
                <p className="text-[10px] text-ink-faint mb-1">Check-in link</p>
                <p className="text-xs font-mono text-ink break-all">{getCheckinUrl(showQR)}</p>
              </div>
              <div className="flex gap-2">
                <a href={getQRUrl(showQR)} download={`${showQR.name}-qr.png`} target="_blank" rel="noreferrer"
                  className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white text-center">
                  ? Download QR
                </a>
                <a href={getCheckinUrl(showQR)} target="_blank" rel="noreferrer"
                  className="flex-1 rounded-xl border border-ink-ghost py-2.5 text-sm text-ink-subtle text-center">
                  Open link ?
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-ink-ghost px-6 py-4">
              <h2 className="font-semibold text-ink">Add new workshop</h2>
              <button onClick={() => setShowAdd(false)} className="text-2xl text-ink-faint hover:text-ink">×</button>
            </div>
            <form onSubmit={addWorkshop} className="p-6 space-y-4">
              <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
              <div><label className="label">Location *</label><input className="input" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} required /></div>
              <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} /></div>
              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 rounded-xl border border-ink-ghost py-2.5 text-sm text-ink-subtle">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{saving ? "Creating…" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
