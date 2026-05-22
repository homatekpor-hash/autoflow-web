"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Card, Spinner } from "@/components/ui";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");
const authFetch = (url: string, opts: RequestInit = {}) =>
  fetch(`${API}${url}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok()}`, ...(opts.headers||{}) } });

const TABS = ["Members","Add member"];

const ROLE_COLORS: Record<string,string> = {
  SUPER_ADMIN:    "bg-purple-50 text-purple-700",
  OWNER:          "bg-red-50 text-red-600",
  BRANCH_MANAGER: "bg-blue-50 text-blue-700",
  SERVICE_ADVISOR:"bg-cyan-50 text-cyan-700",
  TECHNICIAN:     "bg-amber-50 text-amber-700",
  CASHIER:        "bg-green-50 text-green-700",
  PARTS_MANAGER:  "bg-violet-50 text-violet-700",
};

export default function TeamPage() {
  const { user } = useAuth();
  const [tab,      setTab]      = useState(0);
  const [members,  setMembers]  = useState<any[]>([]);
  const [workshops,setWorkshops]= useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState<any>(null);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");

  const [form, setForm] = useState({ name:"", email:"", role:"TECHNICIAN", workshopId:"" });

  async function load() {
    const [u, w] = await Promise.all([
      authFetch("/api/users").then(r=>r.json()),
      authFetch("/api/workshops").then(r=>r.json()),
    ]);
    setMembers(Array.isArray(u) ? u : []);
    setWorkshops(Array.isArray(w) ? w : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSuccess(""); setSaving(true);
    const res = await authFetch("/api/users/invite", { method:"POST", body: JSON.stringify(form) });
    const data = await res.json();
    if (res.ok) {
      setSuccess(`✅ Account created! Temp password: ${data.tempPassword}`);
      setForm({ name:"", email:"", role:"TECHNICIAN", workshopId:"" });
      load();
    } else { setError(data.error || "Failed to create member"); }
    setSaving(false);
  }

  async function updateMember(id: string, updates: any) {
    setSaving(true);
    const res = await authFetch(`/api/users/${id}`, { method:"PUT", body: JSON.stringify(updates) });
    if (res.ok) { setEditing(null); load(); }
    setSaving(false);
  }

  const canManage = ["SUPER_ADMIN","OWNER","BRANCH_MANAGER"].includes(user?.role||"");

  return (
    <div className="fade-up">
      <PageHeader title="Team & Staff" subtitle={`${members.length} members`} />

      <div className="mb-5 flex border-b border-ink-ghost">
        {(canManage ? TABS : [TABS[0]]).map((t,i) => (
          <button key={t} onClick={() => setTab(i)}
            className={clsx("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition",
              tab===i ? "border-orange-500 text-orange-600" : "border-transparent text-ink-subtle hover:text-ink")}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Members list ── */}
      {tab === 0 && (
        loading ? <div className="flex justify-center py-20"><Spinner className="h-6 w-6"/></div> :
        <Card className="p-0 overflow-hidden">
          <div className="grid grid-cols-[1fr_140px_160px_80px_60px] gap-2 bg-ink-paper px-4 py-2.5 text-[10px] font-semibold text-ink-faint uppercase tracking-wide">
            <span>Member</span><span>Role</span><span>Workshop</span><span>Status</span><span></span>
          </div>
          {members.map(m => (
            <div key={m.id}>
              {editing?.id === m.id ? (
                <div className="border-t border-ink-ghost px-4 py-3 bg-orange-50">
                  <div className="flex gap-3 items-center flex-wrap">
                    <input defaultValue={m.name} id={`name-${m.id}`}
                      className="input flex-1 min-w-[160px]" placeholder="Full name" />
                    <select id={`role-${m.id}`} defaultValue={m.role} className="input w-44">
                      {["BRANCH_MANAGER","SERVICE_ADVISOR","TECHNICIAN","CASHIER","PARTS_MANAGER"].map(r => (
                        <option key={r} value={r}>{r.replace(/_/g," ")}</option>
                      ))}
                    </select>
                    <select id={`ws-${m.id}`} defaultValue={m.workshopId||""} className="input w-44">
                      <option value="">No workshop</option>
                      {workshops.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={() => updateMember(m.id, {
                        name: (document.getElementById(`name-${m.id}`) as HTMLInputElement)?.value,
                        role: (document.getElementById(`role-${m.id}`) as HTMLSelectElement)?.value,
                      })} className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs text-white font-medium">Save</button>
                      <button onClick={() => setEditing(null)} className="rounded-lg border border-ink-ghost px-3 py-1.5 text-xs text-ink-subtle">Cancel</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-[1fr_140px_160px_80px_60px] gap-2 border-t border-ink-ghost px-4 py-3 items-center hover:bg-ink-paper transition">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-xs font-semibold text-orange-600 flex-shrink-0">
                      {m.name?.split(" ").map((w:string)=>w[0]).join("").slice(0,2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{m.name}</p>
                      <p className="text-xs text-ink-faint">{m.email}</p>
                    </div>
                  </div>
                  <span className={clsx("rounded-md px-2 py-0.5 text-[10px] font-semibold w-fit", ROLE_COLORS[m.role]||"bg-gray-100 text-gray-600")}>
                    {m.role?.replace(/_/g," ")}
                  </span>
                  <span className="text-xs text-ink-subtle truncate">{m.workshop?.name || "—"}</span>
                  <span className={clsx("rounded-md px-2 py-0.5 text-[10px] font-semibold w-fit",
                    m.status==="ACTIVE" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700")}>
                    {m.status}
                  </span>
                  {canManage && (
                    <button onClick={() => setEditing(m)} className="text-xs text-orange-600 hover:underline">Edit</button>
                  )}
                </div>
              )}
            </div>
          ))}
          {members.length === 0 && <div className="py-12 text-center text-ink-faint text-sm">No team members yet</div>}
        </Card>
      )}

      {/* ── Add member ── */}
      {tab === 1 && canManage && (
        <div className="max-w-lg">
          <Card className="p-6">
            <p className="text-sm font-semibold text-ink mb-5">Add a new team member</p>
            <form onSubmit={inviteMember} className="space-y-4">
              <div><label className="label">Full name *</label>
                <input className="input" placeholder="e.g. Kofi Mensah" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} required /></div>
              <div><label className="label">Email address *</label>
                <input className="input" type="email" placeholder="kofi@workshop.gh" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} required /></div>
              <div><label className="label">Role *</label>
                <select className="input" value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))}>
                  <option value="BRANCH_MANAGER">Branch Manager</option>
                  <option value="SERVICE_ADVISOR">Service Advisor</option>
                  <option value="TECHNICIAN">Technician</option>
                  <option value="CASHIER">Cashier</option>
                  <option value="PARTS_MANAGER">Parts Manager</option>
                </select></div>
              <div><label className="label">Workshop *</label>
                <select className="input" value={form.workshopId} onChange={e=>setForm(p=>({...p,workshopId:e.target.value}))} required>
                  <option value="">Select workshop…</option>
                  {workshops.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
                </select></div>

              {error   && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              {success && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}<br/>
                  <span className="text-xs text-green-600 mt-1 block">Share the temporary password with the new member. They should change it on first login.</span>
                </div>
              )}

              <button type="submit" disabled={saving}
                className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition disabled:opacity-60">
                {saving ? "Creating account…" : "Create account"}
              </button>
            </form>
          </Card>

          <Card className="p-5 mt-4 border-ink-ghost bg-ink-paper">
            <p className="text-xs font-semibold text-ink mb-2">How it works</p>
            <ul className="space-y-1.5 text-xs text-ink-subtle">
              <li>→ A temporary password is generated automatically</li>
              <li>→ Share the email and temp password with the new member</li>
              <li>→ They log in and change their password</li>
              <li>→ They only see their own workshop's data</li>
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
