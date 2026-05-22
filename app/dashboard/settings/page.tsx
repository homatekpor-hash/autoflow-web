"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Card, Spinner } from "@/components/ui";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");
const af = (url: string, opts: RequestInit = {}) =>
  fetch(`${API}${url}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok()}`, ...(opts.headers||{}) } });

export default function SettingsPage() {
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [editing,   setEditing]   = useState<any>(null);
  const [form,      setForm]      = useState({ name:"", location:"", phone:"" });
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState("");

  useEffect(() => {
    af("/api/workshops").then(r => r.json()).then(d => { setWorkshops(Array.isArray(d)?d:[]); setLoading(false); });
  }, []);

  function startEdit(ws: any) { setEditing(ws); setForm({ name:ws.name, location:ws.location, phone:ws.phone||"" }); setMsg(""); }

  async function saveWorkshop(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const res = await af(`/api/workshops/${editing.id}`, { method:"PUT", body: JSON.stringify(form) });
    if (res.ok) { setMsg("✅ Workshop updated!"); setEditing(null); af("/api/workshops").then(r=>r.json()).then(d=>setWorkshops(Array.isArray(d)?d:[])); }
    else setMsg("❌ Failed to update");
    setSaving(false);
  }

  const canEdit = ["SUPER_ADMIN","OWNER","BRANCH_MANAGER"].includes(user?.role||"");

  return (
    <div className="fade-up max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your workshop details" />

      {msg && <div className={`rounded-xl border px-4 py-3 text-sm mb-4 ${msg.startsWith("✅")?"border-green-200 bg-green-50 text-green-700":"border-red-200 bg-red-50 text-red-700"}`}>{msg}</div>}

      {loading ? <div className="flex justify-center py-10"><Spinner className="h-6 w-6"/></div> : (
        <div className="space-y-4">
          {workshops.map(ws => (
            <Card key={ws.id} className="p-5">
              {editing?.id === ws.id ? (
                <form onSubmit={saveWorkshop} className="space-y-3">
                  <p className="text-sm font-semibold text-ink mb-3">Editing: {ws.name}</p>
                  <div><label className="label">Workshop name</label><input className="input" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} required /></div>
                  <div><label className="label">Location</label><input className="input" value={form.location} onChange={e=>setForm(p=>({...p,location:e.target.value}))} required /></div>
                  <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} /></div>
                  <div className="flex gap-2">
                    <button type="button" onClick={()=>setEditing(null)} className="flex-1 rounded-xl border border-ink-ghost py-2.5 text-sm text-ink-subtle">Cancel</button>
                    <button type="submit" disabled={saving} className="flex-1 rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">{saving?"Saving…":"Save changes"}</button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-ink">{ws.name}</p>
                    <p className="text-xs text-ink-subtle mt-0.5">📍 {ws.location}</p>
                    {ws.phone && <p className="text-xs text-ink-subtle">📞 {ws.phone}</p>}
                    {ws.manager && <p className="text-xs text-ink-faint mt-1">Manager: {ws.manager.name}</p>}
                  </div>
                  {canEdit && (
                    <button onClick={() => startEdit(ws)} className="rounded-lg border border-ink-ghost px-3 py-1.5 text-xs text-ink-subtle hover:bg-ink-paper transition">Edit</button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
