"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Spinner, PageHeader } from "@/components/ui";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
function authFetch(url: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("sl_token");
  return fetch(url, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
}

export default function WorkshopDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [ws, setWs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    authFetch(`${API}/api/workshops/${params.id}`)
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e.error)))
      .then(setWs)
      .catch(e => setError(e || "Failed to load workshop"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-6 w-6" /></div>;
  if (error)   return (
    <div className="text-center py-20">
      <p className="text-red-600 mb-4">{error}</p>
      <button onClick={() => router.push("/dashboard/workshops")} className="text-sm text-orange-600 underline">← Back to workshops</button>
    </div>
  );

  return (
    <div className="fade-up">
      <PageHeader
        title={ws.name}
        subtitle={`📍 ${ws.location}${ws.phone ? ` · 📞 ${ws.phone}` : ""}`}
        action={<button onClick={() => router.push("/dashboard/workshops")} className="rounded-lg border border-ink-ghost px-4 py-2 text-sm text-ink-subtle hover:bg-ink-paper">← Back</button>}
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[["Active jobs", ws._count?.jobs ?? 0], ["Staff members", ws._count?.members ?? 0], ["Manager", ws.manager?.name || "—"]].map(([l, v]) => (
          <Card key={String(l)} className="p-4 text-center">
            <p className="text-xs text-ink-faint mb-1">{l}</p>
            <p className="text-xl font-semibold text-ink">{v}</p>
          </Card>
        ))}
      </div>

      {ws.members?.length > 0 && (
        <Card className="p-5">
          <p className="text-sm font-semibold text-ink mb-3">Team members</p>
          <div className="space-y-2">
            {ws.members.map((m: any) => (
              <div key={m.id} className="flex justify-between items-center py-2 border-b border-ink-ghost last:border-0 text-sm">
                <span className="text-ink">{m.name}</span>
                <span className="text-xs text-ink-faint">{m.role?.replace(/_/g, " ")}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
