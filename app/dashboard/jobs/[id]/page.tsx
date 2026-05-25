"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");
const af = (url: string, opts: RequestInit = {}) =>
  fetch(`${API}${url}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok()}`, ...(opts.headers||{}) } });

const STATUSES = ["RECEIVED","DIAGNOSING","WAITING_APPROVAL","WAITING_PARTS","IN_PROGRESS","QC","READY","DELIVERED","CANCELLED"];
const STATUS_COLOR: Record<string,string> = {
  RECEIVED:"bg-gray-100 text-gray-600", DIAGNOSING:"bg-amber-50 text-amber-700",
  WAITING_APPROVAL:"bg-blue-50 text-blue-700", WAITING_PARTS:"bg-orange-50 text-orange-700",
  IN_PROGRESS:"bg-blue-50 text-blue-600", QC:"bg-purple-50 text-purple-700",
  READY:"bg-green-50 text-green-700", DELIVERED:"bg-gray-100 text-gray-500", CANCELLED:"bg-red-50 text-red-600",
};
const ROLE_ICON: Record<string,string> = { TECHNICIAN:"🔧", SERVICE_ADVISOR:"📋", BRANCH_MANAGER:"🏭", OWNER:"👑", CASHIER:"💳", PARTS_MANAGER:"📦", SUPER_ADMIN:"🛡️" };

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { user } = useAuth();
  const [job,      setJob]      = useState<any>(null);
  const [notes,    setNotes]    = useState<any[]>([]);
  const [techs,    setTechs]    = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState("overview");
  const [saving,   setSaving]   = useState(false);
  const [note,     setNote]     = useState("");
  const [noteText, setNoteText] = useState("");
  const [internal, setInternal] = useState(false);
  const [estItems, setEst]      = useState<any[]>([]);

  async function load() {
    const [jobRes, notesRes] = await Promise.all([
      af(`/api/jobs/${params.id}`),
      af(`/api/jobs/${params.id}/notes`),
    ]);
    if (jobRes.ok) {
      const d = await jobRes.json();
      setJob(d);
      setEst((d.estimate?.items||[]).map((i:any)=>({...i, unitPrice: i.rate||i.unitPrice||0})));
    }
    if (notesRes.ok) setNotes(await notesRes.json());
    setLoading(false);
  }

  async function loadTechs() {
    const res = await af("/api/users?role=TECHNICIAN");
    if (res.ok) { const d = await res.json(); setTechs(Array.isArray(d)?d:[]); }
  }

  useEffect(() => { load(); loadTechs(); }, [params.id]);

  async function updateStatus(status: string) {
    setSaving(true);
    await af(`/api/jobs/${params.id}/status`, { method:"PUT", body: JSON.stringify({ status, note }) });
    await load(); setSaving(false); setNote("");
  }

  async function assignTech(technicianId: string) {
    setSaving(true);
    await af(`/api/jobs/${params.id}/assign`, { method:"PUT", body: JSON.stringify({ technicianId }) });
    await load(); setSaving(false);
  }

  async function addNote() {
    if (!noteText.trim()) return;
    setSaving(true);
    await af(`/api/jobs/${params.id}/notes`, { method:"POST", body: JSON.stringify({ content: noteText, isInternal: internal }) });
    setNoteText(""); await load(); setSaving(false);
  }

  async function saveEstimate() {
    setSaving(true);
    const mappedItems = estItems.map(i=>({...i, rate: i.unitPrice||i.rate||0}));
    const total = mappedItems.reduce((s:number,i:any)=>s+(i.quantity*i.rate),0);
    if (job.estimate?.id) await af(`/api/estimates/${job.estimate.id}`, { method:"PUT", body: JSON.stringify({ items: mappedItems, total }) });
    else await af(`/api/jobs/${params.id}/estimate`, { method:"POST", body: JSON.stringify({ items: mappedItems, total }) });
    await load(); setSaving(false);
  }

  async function createInvoice() {
    setSaving(true);
    const res = await af(`/api/jobs/${params.id}/invoice`, { method:"POST" });
    if (res.ok) { await load(); setTab("invoice"); }
    setSaving(false);
  }

  async function markPaid(method: string) {
    setSaving(true);
    if (job.invoice) { await af(`/api/invoices/${job.invoice.id}/paid`, { method:"PUT", body: JSON.stringify({ paymentMethod: method }) }); await load(); }
    setSaving(false);
  }

  function printInvoice() {
    if (!job?.invoice) return;
    const inv = job.invoice;
    const items = job.estimate?.items?.map((i:any)=>
      `<tr><td>${i.description}</td><td>${i.type}</td><td>${i.quantity}</td><td>GHS ${i.rate||i.unitPrice}</td><td>GHS ${(i.quantity*(i.rate||i.unitPrice)).toFixed(2)}</td></tr>`
    ).join("") || "";
    const w = window.open("","_blank");
    w?.document.write(`<!DOCTYPE html><html><head><title>${inv.invoiceNumber}</title>
    <style>body{font-family:Arial,sans-serif;padding:40px;color:#111}h1{color:#f97316}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}.total{font-size:20px;font-weight:bold;color:#f97316}.meta{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:20px 0}.box{background:#f9f9f9;padding:16px;border-radius:8px}</style>
    </head><body>
    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:30px">
      <div><h1>AutoFlow Ghana</h1><p style="color:#888">${job.workshop?.name}</p></div>
      <div style="text-align:right"><h2>${inv.invoiceNumber}</h2><p style="color:${inv.status==="PAID"?"green":"orange"};font-weight:bold">${inv.status}</p></div>
    </div>
    <div class="meta">
      <div class="box"><strong>Workshop</strong><br>${job.workshop?.name}<br>${job.workshop?.location}</div>
      <div class="box"><strong>Customer</strong><br>${job.customerName}<br>${job.customerPhone||""}</div>
      <div class="box"><strong>Vehicle</strong><br>${job.vehicle?.make} ${job.vehicle?.model}<br>Plate: ${job.vehicle?.plate}</div>
      <div class="box"><strong>Job ref</strong><br>${job.jobRef}<br>${new Date(inv.createdAt).toLocaleDateString("en-GH")}</div>
    </div>
    <table><thead><tr><th>Description</th><th>Type</th><th>Qty</th><th>Unit price</th><th>Total</th></tr></thead><tbody>${items}</tbody></table>
    <div style="text-align:right;margin-top:20px">
      <p>Subtotal: GHS ${Number(inv.subtotal).toFixed(2)}</p>
      <p>VAT (12.5%): GHS ${Number(inv.tax).toFixed(2)}</p>
      <p class="total">Total: GHS ${Number(inv.total).toFixed(2)}</p>
      ${inv.status==="PAID"?`<p style="color:green">✅ Paid via ${inv.paymentMethod}</p>`:""}
    </div>
    <div style="margin-top:40px;text-align:center;color:#888;font-size:12px">Thank you for choosing ${job.workshop?.name} · Powered by AutoFlow Ghana</div>
    </body></html>`);
    w?.document.close(); w?.print();
  }

  const canManage = ["SUPER_ADMIN","OWNER","BRANCH_MANAGER","SERVICE_ADVISOR"].includes(user?.role||"");
  const estTotal = estItems.reduce((s,i)=>s+(i.quantity*(i.unitPrice||i.rate||0)),0);

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-6 w-6"/></div>;
  if (!job) return <div className="text-center py-20 text-ink-faint">Job not found</div>;

  return (
    <div className="fade-up max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <button onClick={()=>router.back()} className="text-sm text-ink-faint hover:text-ink mb-2 flex items-center gap-1">← Back</button>
          <h1 className="text-2xl font-bold text-ink">{job.jobRef}</h1>
          <p className="text-sm text-ink-subtle mt-0.5">{job.vehicle?.make} {job.vehicle?.model} · {job.vehicle?.plate} · {job.customerName}</p>
        </div>
        <span className={clsx("rounded-xl px-3 py-1.5 text-sm font-semibold", STATUS_COLOR[job.status])}>{job.status?.replace(/_/g," ")}</span>
      </div>

      <div className="flex border-b border-ink-ghost mb-6 overflow-x-auto">
        {["overview","notes","estimate","invoice","history"].map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={clsx("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize whitespace-nowrap transition",
              tab===t?"border-orange-500 text-orange-600":"border-transparent text-ink-subtle hover:text-ink")}>
            {t}{t==="notes"&&notes.length>0&&<span className="ml-1 text-[10px] rounded-full bg-orange-100 text-orange-600 px-1.5">{notes.length}</span>}
            {t==="invoice"&&job.invoice&&<span className="ml-1 text-[10px] rounded-full bg-green-100 text-green-700 px-1.5">{job.invoice.status}</span>}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab==="overview" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[["Customer",job.customerName],["Phone",job.customerPhone||"—"],["Priority",job.priority],["Workshop",job.workshop?.name]].map(([l,v])=>(
              <div key={String(l)} className="rounded-xl border border-ink-ghost bg-white p-4">
                <p className="text-xs text-ink-faint mb-1">{l}</p><p className="text-sm font-medium text-ink">{v}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-ink-ghost bg-white p-5">
            <p className="text-xs font-semibold text-ink-faint uppercase tracking-wide mb-2">Complaint</p>
            <p className="text-sm text-ink">{job.complaint||"—"}</p>
          </div>

          {/* Technician assignment */}
          {canManage && (
            <div className="rounded-xl border border-ink-ghost bg-white p-5">
              <p className="text-xs font-semibold text-ink-faint uppercase tracking-wide mb-3">Assigned technician</p>
              <div className="flex items-center gap-3">
                {job.technician ? (
                  <div className="flex items-center gap-2 flex-1">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                      {job.technician.name?.split(" ").map((w:string)=>w[0]).join("").slice(0,2)}
                    </div>
                    <span className="text-sm font-medium text-ink">{job.technician.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-ink-faint flex-1">No technician assigned</span>
                )}
                <select onChange={e=>assignTech(e.target.value)} value={job.technician?.id||""} disabled={saving}
                  className="input w-48 text-sm">
                  <option value="">Unassigned</option>
                  {techs.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Update status */}
          {canManage && (
            <div className="rounded-xl border border-ink-ghost bg-white p-5">
              <p className="text-xs font-semibold text-ink-faint uppercase tracking-wide mb-3">Update status</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {STATUSES.filter(s=>s!==job.status&&s!=="CANCELLED").map(s=>(
                  <button key={s} onClick={()=>updateStatus(s)} disabled={saving}
                    className="rounded-lg border border-ink-ghost px-3 py-1.5 text-xs font-medium hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition disabled:opacity-50">
                    → {s.replace(/_/g," ")}
                  </button>
                ))}
              </div>
              <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Add a note (optional)…" rows={2} className="input resize-none text-sm" />
            </div>
          )}

          <div className="rounded-xl border border-ink-ghost bg-white p-5">
            <p className="text-xs font-semibold text-ink-faint uppercase tracking-wide mb-3">Vehicle</p>
            <div className="grid grid-cols-3 gap-3">
              {[["Make",job.vehicle?.make],["Model",job.vehicle?.model],["Year",job.vehicle?.year||"—"],["Color",job.vehicle?.color||"—"],["Plate",job.vehicle?.plate],["Mileage",job.mileageIn?job.mileageIn+" km":"—"]].map(([l,v])=>(
                <div key={String(l)}><p className="text-[10px] text-ink-faint">{l}</p><p className="text-sm font-medium text-ink">{v}</p></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {tab==="notes" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-ink-ghost bg-white p-4">
            <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Add a note or comment…" rows={3} className="input resize-none text-sm mb-3" />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-ink-subtle cursor-pointer">
                <input type="checkbox" checked={internal} onChange={e=>setInternal(e.target.checked)} className="rounded" />
                Internal only
              </label>
              <button onClick={addNote} disabled={saving||!noteText.trim()}
                className="rounded-xl bg-orange-500 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50">
                {saving?"Posting…":"Post note"}
              </button>
            </div>
          </div>
          {notes.length===0 ? <div className="text-center py-10 text-ink-faint text-sm">No notes yet.</div> :
            notes.map(n=>(
              <div key={n.id} className={clsx("rounded-xl border p-4",n.isInternal?"border-amber-200 bg-amber-50":"border-ink-ghost bg-white")}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span>{ROLE_ICON[n.author?.role]||"💬"}</span>
                    <span className="text-sm font-semibold text-ink">{n.author?.name}</span>
                    {n.isInternal&&<span className="text-[10px] rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">Internal</span>}
                  </div>
                  <span className="text-xs text-ink-faint">{new Date(n.createdAt).toLocaleString("en-GH")}</span>
                </div>
                <p className="text-sm text-ink">{n.content}</p>
              </div>
            ))
          }
        </div>
      )}

      {/* Estimate */}
      {tab==="estimate" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-ink-ghost bg-white p-5">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-semibold text-ink">Estimate items</p>
              <span className="text-lg font-bold text-orange-500">GHS {estTotal.toLocaleString()}</span>
            </div>
            {estItems.map((item,i)=>(
              <div key={i} className="grid grid-cols-[1fr_80px_80px_100px_32px] gap-2 mb-2 items-center">
                <input value={item.description} onChange={e=>{const a=[...estItems];a[i]={...a[i],description:e.target.value};setEst(a);}} className="input text-sm" placeholder="Description"/>
                <select value={item.type} onChange={e=>{const a=[...estItems];a[i]={...a[i],type:e.target.value};setEst(a);}} className="input text-xs">
                  <option value="LABOUR">Labour</option><option value="PART">Part</option><option value="OTHER">Other</option>
                </select>
                <input type="number" value={item.quantity} onChange={e=>{const a=[...estItems];a[i]={...a[i],quantity:+e.target.value};setEst(a);}} className="input text-sm" min="1"/>
                <input type="number" value={item.unitPrice||item.rate||0} onChange={e=>{const a=[...estItems];a[i]={...a[i],unitPrice:+e.target.value,rate:+e.target.value};setEst(a);}} className="input text-sm" min="0" step="0.01"/>
                <button onClick={()=>setEst(estItems.filter((_,j)=>j!==i))} className="text-red-400 hover:text-red-600 text-lg">×</button>
              </div>
            ))}
            <button onClick={()=>setEst([...estItems,{description:"",type:"LABOUR",quantity:1,unitPrice:0,rate:0}])}
              className="mt-2 w-full rounded-xl border border-dashed border-ink-ghost py-2.5 text-sm text-ink-subtle hover:border-orange-300 hover:text-orange-500 transition">
              + Add item
            </button>
          </div>
          <div className="rounded-xl border border-ink-ghost bg-white p-5">
            <div className="flex justify-between text-sm mb-1"><span className="text-ink-faint">Subtotal</span><span>GHS {estTotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm mb-3"><span className="text-ink-faint">VAT (12.5%)</span><span>GHS {(estTotal*0.125).toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-lg border-t border-ink-ghost pt-3"><span>Total</span><span className="text-orange-500">GHS {(estTotal*1.125).toFixed(2)}</span></div>
          </div>
          <div className="flex gap-3">
            <button onClick={saveEstimate} disabled={saving||estItems.length===0} className="flex-1 rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition disabled:opacity-50">{saving?"Saving…":"Save estimate"}</button>
            {job.estimate&&!job.invoice&&<button onClick={createInvoice} disabled={saving} className="flex-1 rounded-xl bg-green-500 py-3 text-sm font-semibold text-white hover:bg-green-600 transition disabled:opacity-50">Generate invoice →</button>}
          </div>
        </div>
      )}

      {/* Invoice */}
      {tab==="invoice" && (
        <div className="space-y-4">
          {!job.invoice ? (
            <div className="rounded-xl border border-dashed border-ink-ghost p-12 text-center">
              <p className="text-2xl mb-2">🧾</p>
              <p className="text-sm text-ink-faint mb-4">No invoice yet. Create an estimate first.</p>
              <button onClick={()=>setTab("estimate")} className="text-sm text-orange-500 hover:underline">Go to estimate →</button>
            </div>
          ) : (
            <div className="rounded-xl border border-ink-ghost bg-white p-6">
              <div className="flex justify-between items-start mb-6">
                <div><p className="text-xl font-bold text-ink">{job.invoice.invoiceNumber}</p><p className="text-sm text-ink-subtle">{job.workshop?.name}</p></div>
                <div className="flex gap-2 items-center">
                  <button onClick={printInvoice} className="rounded-lg border border-ink-ghost px-3 py-1.5 text-xs font-medium hover:bg-ink-paper transition">🖨️ Print</button>
                  <span className={clsx("rounded-xl px-3 py-1.5 text-sm font-bold",job.invoice.status==="PAID"?"bg-green-50 text-green-700":"bg-amber-50 text-amber-700")}>{job.invoice.status}</span>
                </div>
              </div>
              <div className="border-t border-ink-ghost pt-4 space-y-2 mb-4">
                {job.estimate?.items?.map((item:any,i:number)=>(
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-ink">{item.description} <span className="text-ink-faint">x{item.quantity}</span></span>
                    <span className="font-medium">GHS {Number(item.total||item.quantity*(item.rate||item.unitPrice||0)).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-ink-ghost pt-3 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-ink-faint">Subtotal</span><span>GHS {(Number(job.invoice.subtotal)||Number(job.invoice.total)/1.125).toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-ink-faint">VAT 12.5%</span><span>GHS {(Number(job.invoice.tax)||(Number(job.invoice.total)-(Number(job.invoice.total)/1.125))).toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-ink-ghost"><span>Total</span><span className="text-orange-500">GHS {Number(job.invoice.total).toLocaleString()}</span></div>
              </div>
              {job.invoice.status==="PENDING"||job.invoice.status==="UNPAID"?(
                <div className="mt-5 pt-5 border-t border-ink-ghost">
                  <p className="text-xs font-semibold text-ink-faint uppercase tracking-wide mb-3">Mark as paid</p>
                  <div className="flex gap-2 flex-wrap">
                    {["CASH","MOMO","CARD","BANK"].map(m=>(
                      <button key={m} onClick={()=>markPaid(m)} disabled={saving}
                        className="rounded-xl border border-ink-ghost px-4 py-2 text-sm font-medium hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition disabled:opacity-50">
                        {m==="MOMO"?"📱 MoMo":m==="CASH"?"💵 Cash":m==="CARD"?"💳 Card":"🏦 Bank"}
                      </button>
                    ))}
                  </div>
                </div>
              ):(
                <div className="mt-4 rounded-xl bg-green-50 border border-green-200 p-4 text-center">
                  <p className="text-green-700 font-semibold">✅ Paid via {job.invoice.paymentMethod}</p>
                  <p className="text-xs text-green-600 mt-1">{job.invoice.paidAt?new Date(job.invoice.paidAt).toLocaleString("en-GH"):""}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* History */}
      {tab==="history" && (
        <div className="space-y-2">
          {job.statusHistory?.length===0&&<div className="text-center py-10 text-ink-faint text-sm">No history yet</div>}
          {job.statusHistory?.map((h:any)=>(
            <div key={h.id} className="flex gap-4 items-start rounded-xl border border-ink-ghost bg-white p-4">
              <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 text-sm">📋</div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className={clsx("rounded-md px-2 py-0.5 text-xs font-semibold",STATUS_COLOR[h.status])}>{h.status?.replace(/_/g," ")}</span>
                  <span className="text-xs text-ink-faint">{new Date(h.createdAt).toLocaleString("en-GH")}</span>
                </div>
                {h.note&&<p className="text-sm text-ink-subtle mt-1">{h.note}</p>}
                {h.changedBy&&<p className="text-xs text-ink-faint mt-0.5">by {h.changedBy.name}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
