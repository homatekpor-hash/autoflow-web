"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Card } from "@/components/ui";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");
const af = (url: string, opts: RequestInit = {}) =>
  fetch(`${API}${url}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok()}`, ...(opts.headers||{}) } });

export default function ProfilePage() {
  const { user } = useAuth();
  const [name,   setName]   = useState(user?.name || "");
  const [oldPw,  setOldPw]  = useState("");
  const [newPw,  setNewPw]  = useState("");
  const [confPw, setConfPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState<{type:"ok"|"err",text:string}|null>(null);

  async function saveName(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setMsg(null);
    const res = await af(`/api/users/${user?.id}`, { method:"PUT", body: JSON.stringify({ name }) });
    setMsg(res.ok ? {type:"ok",text:"Name updated!"} : {type:"err",text:"Failed to update"});
    setSaving(false);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (newPw !== confPw) { setMsg({type:"err",text:"Passwords do not match"}); return; }
    if (newPw.length < 6) { setMsg({type:"err",text:"Minimum 6 characters"}); return; }
    setSaving(true);
    const res = await af("/api/auth/change-password", { method:"POST", body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }) });
    if (res.ok) { setMsg({type:"ok",text:"Password changed!"}); setOldPw(""); setNewPw(""); setConfPw(""); }
    else { const d = await res.json(); setMsg({type:"err",text:d.error||"Failed"}); }
    setSaving(false);
  }

  const ROLE_C: Record<string,string> = { SUPER_ADMIN:"bg-purple-100 text-purple-700", OWNER:"bg-red-100 text-red-700", BRANCH_MANAGER:"bg-blue-100 text-blue-700", SERVICE_ADVISOR:"bg-cyan-100 text-cyan-700", TECHNICIAN:"bg-amber-100 text-amber-700", CASHIER:"bg-green-100 text-green-700", PARTS_MANAGER:"bg-violet-100 text-violet-700" };

  return (
    <div className="fade-up max-w-lg">
      <PageHeader title="My profile" subtitle="Manage your account details" />
      <Card className="p-6 mb-5 flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center text-2xl font-bold text-orange-600 flex-shrink-0">
          {user?.name?.split(" ").map((w:string)=>w[0]).join("").slice(0,2)}
        </div>
        <div>
          <p className="text-lg font-bold text-ink">{user?.name}</p>
          <p className="text-sm text-ink-subtle">{user?.email}</p>
          <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_C[user?.role||""]||"bg-gray-100 text-gray-600"}`}>{user?.role?.replace(/_/g," ")}</span>
        </div>
      </Card>
      {msg && <div className={`rounded-xl border px-4 py-3 text-sm mb-4 ${msg.type==="ok"?"border-green-200 bg-green-50 text-green-700":"border-red-200 bg-red-50 text-red-700"}`}>{msg.text}</div>}
      <Card className="p-5 mb-4">
        <p className="text-sm font-semibold text-ink mb-4">Update name</p>
        <form onSubmit={saveName} className="space-y-3">
          <div><label className="label">Full name</label><input className="input" value={name} onChange={e=>setName(e.target.value)} required /></div>
          <div><label className="label">Email (cannot change)</label><input className="input opacity-50 cursor-not-allowed" value={user?.email||""} disabled /></div>
          <button type="submit" disabled={saving} className="w-full rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">{saving?"Saving…":"Save name"}</button>
        </form>
      </Card>
      <Card className="p-5">
        <p className="text-sm font-semibold text-ink mb-4">Change password</p>
        <form onSubmit={changePassword} className="space-y-3">
          <div><label className="label">Current password</label><input className="input" type="password" value={oldPw} onChange={e=>setOldPw(e.target.value)} required /></div>
          <div><label className="label">New password</label><input className="input" type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} required minLength={6} /></div>
          <div><label className="label">Confirm new password</label><input className="input" type="password" value={confPw} onChange={e=>setConfPw(e.target.value)} required /></div>
          <button type="submit" disabled={saving} className="w-full rounded-xl bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-60">{saving?"Changing…":"Change password"}</button>
        </form>
      </Card>
    </div>
  );
}
