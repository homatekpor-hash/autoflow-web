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

  async function load() {
    const res = await authFetch(`${API}/api/workshops`);
    if (res.ok) setWorkshops(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const getBase = () => typeof window !== "undefined" ? window.location.origin : "https://autoflow-web-vq1f.vercel.app";
  const getQRUrl = (ws: any) => `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${getBase()}/checkin/${ws.qrToken}`)}`;
  const getLink = (ws: any) => `${getBase()}/checkin/${ws.qrToken}`;

  return (
    <div className="fade-up">
      <PageHeader title="Workshops" subtitle={`${workshops.length} workshops`} />
      {loading ? <div className="flex justify-center py-20"><Spinner className="h-6 w-6" /></div> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workshops.map((ws: any) => (
            <Card key={ws.id} className="p-5">
              <h3 className="font-semibold text-ink mb-1">{ws.name}</h3>
              <p className="text-xs text-ink-subtle mb-3">📍 {ws.location}</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[["Active", ws.stats?.active ?? 0], ["Done", ws.stats?.completed ?? 0], ["Staff", ws._count?.members ?? 0]].map(([l, v]) => (
                  <div key={String(l)} className="rounded-lg bg-ink-paper p-2 text-center">
                    <p className="text-lg font-semibold text-ink">{v}</p>
                    <p className="text-xs text-ink-faint">{l}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowQR(ws)} className="w-full rounded-xl border border-orange-200 bg-orange-50 py-2.5 text-sm font-medium text-orange-600 hover:bg-orange-100 transition">
                📱 Customer QR Check-in
              </button>
            </Card>
          ))}
        </div>
      )}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowQR(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-ink-ghost px-6 py-4">
              <h2 className="font-semibold text-ink">QR Check-in — {showQR.name}</h2>
              <button onClick={() => setShowQR(null)} className="text-2xl text-ink-faint">x</button>
            </div>
            <div className="p-6 text-center">
              <img src={getQRUrl(showQR)} alt="QR" className="w-52 h-52 mx-auto rounded-xl border mb-4" />
              <p className="text-xs font-mono text-ink-subtle break-all mb-4">{getLink(showQR)}</p>
              <div className="flex gap-2">
                <a href={getQRUrl(showQR)} download target="_blank" rel="noreferrer" className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white text-center">Download</a>
                <a href={getLink(showQR)} target="_blank" rel="noreferrer" className="flex-1 rounded-xl border border-ink-ghost py-2.5 text-sm text-ink-subtle text-center">Open</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}