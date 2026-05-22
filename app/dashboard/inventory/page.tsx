"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Card, Spinner } from "@/components/ui";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");
const authFetch = (url: string, opts: RequestInit = {}) =>
  fetch(`${API}${url}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok()}`, ...(opts.headers||{}) } });

const TABS = ["Parts","Add part","Movements","Low stock"];

export default function InventoryPage() {
  const { user } = useAuth();
  const [tab,     setTab]    = useState(0);
  const [parts,   setParts]  = useState<any[]>([]);
  const [moves,   setMoves]  = useState<any[]>([]);
  const [loading, setLoading]= useState(true);
  const [saving,  setSaving] = useState(false);
  const [error,   setError]  = useState("");
  const [success, setSuccess]= useState("");
  const [search,  setSearch] = useState("");

  const [form, setForm] = useState({ name:"", sku:"", description:"", quantity:"0", minQuantity:"5", unitPrice:"0", unit:"PCS", category:"" });

  async function load() {
    const [p, m] = await Promise.all([
      authFetch("/api/inventory/parts").then(r=>r.ok?r.json():[]),
      authFetch("/api/inventory/movements").then(r=>r.ok?r.json():[]),
    ]);
    setParts(Array.isArray(p)?p:[]);
    setMoves(Array.isArray(m)?m:[]);
    setLoading(false);
  }

  useEffect(()=>{ load(); },[]);

  async function addPart(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSuccess(""); setSaving(true);
    const res = await authFetch("/api/inventory/parts", {
      method:"POST",
      body: JSON.stringify({ ...form, quantity: parseInt(form.quantity), minQuantity: parseInt(form.minQuantity), unitPrice: parseFloat(form.unitPrice) }),
    });
    const data = await res.json();
    if (res.ok) { setSuccess("✅ Part added!"); setForm({ name:"",sku:"",description:"",quantity:"0",minQuantity:"5",unitPrice:"0",unit:"PCS",category:"" }); load(); }
    else setError(data.error || "Failed to add part");
    setSaving(false);
  }

  async function adjustStock(partId: string, qty: number, type: string) {
    await authFetch("/api/inventory/movements", {
      method:"POST",
      body: JSON.stringify({ partId, quantity: qty, type, note: "Manual adjustment" }),
    });
    load();
  }

  const filtered = parts.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase()));
  const lowStock = parts.filter(p => p.qty <= p.minQty);
  const canEdit  = ["SUPER_ADMIN","OWNER","BRANCH_MANAGER","PARTS_MANAGER"].includes(user?.role||"");

  return (
    <div className="fade-up">
      <PageHeader title="Inventory" subtitle={`${parts.length} parts · ${lowStock.length} low stock`} />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-5 sm:grid-cols-4">
        {[["Total parts", parts.length, "text-blue-600"],
          ["Low stock",   lowStock.length, "text-red-600"],
          ["Total value", "GHS "+parts.reduce((s,p)=>s+(p.qty*Number(p.sellPrice)),0).toLocaleString(), "text-green-600"],
          ["Categories",  new Set(parts.map(p=>p.category).filter(Boolean)).size, "text-orange-600"]].map(([l,v,c])=>(
          <Card key={String(l)} className="p-4 text-center">
            <p className="text-xs text-ink-faint mb-1">{l}</p>
            <p className={`text-xl font-bold ${c}`}>{v}</p>
          </Card>
        ))}
      </div>

      <div className="mb-5 flex border-b border-ink-ghost">
        {(canEdit ? TABS : [TABS[0], TABS[2], TABS[3]]).map((t,i)=>(
          <button key={t} onClick={()=>setTab(canEdit?i:[0,2,3][i])}
            className={clsx("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap",
              tab===(canEdit?i:[0,2,3][i]) ? "border-orange-500 text-orange-600" : "border-transparent text-ink-subtle hover:text-ink")}>
            {t}{t==="Low stock"&&lowStock.length>0&&<span className="ml-1.5 rounded-full bg-red-100 px-1.5 text-[10px] text-red-600">{lowStock.length}</span>}
          </button>
        ))}
      </div>

      {/* Parts list */}
      {tab===0 && (
        <div>
          <input className="input mb-4" placeholder="Search by name or SKU…" value={search} onChange={e=>setSearch(e.target.value)} />
          {loading ? <div className="flex justify-center py-10"><Spinner className="h-6 w-6"/></div> : (
            <Card className="p-0 overflow-hidden">
              <div className="grid grid-cols-[60px_1fr_100px_80px_100px_80px_80px] gap-2 bg-ink-paper px-4 py-2.5 text-[10px] font-semibold text-ink-faint uppercase tracking-wide">
                <span>SKU</span><span>Part name</span><span>Category</span><span>Stock</span><span>Price (GHS)</span><span>Value</span><span>Actions</span>
              </div>
              {filtered.map(p=>(
                <div key={p.id} className={clsx("grid grid-cols-[60px_1fr_100px_80px_100px_80px_80px] gap-2 border-t border-ink-ghost px-4 py-3 items-center", p.qty<=p.minQty&&"bg-red-50/40")}>
                  <span className="font-mono text-[10px] text-ink-faint">{p.sku}</span>
                  <div>
                    <p className="text-sm font-medium text-ink">{p.name}</p>
                    {p.description&&<p className="text-[10px] text-ink-faint">{p.description}</p>}
                  </div>
                  <span className="text-xs text-ink-subtle">{p.category||"—"}</span>
                  <div className="flex items-center gap-1">
                    <span className={clsx("text-sm font-semibold", p.qty<=p.minQty?"text-red-600":"text-ink")}>{p.qty}</span>
                    <span className="text-[10px] text-ink-faint">{p.unit}</span>
                  </div>
                  <span className="text-sm text-ink">{Number(p.sellPrice).toLocaleString()}</span>
                  <span className="text-xs text-ink-subtle">{(p.qty*Number(p.sellPrice)).toLocaleString()}</span>
                  {canEdit && (
                    <div className="flex gap-1">
                      <button onClick={()=>{ const q=prompt("Quantity to add:"); if(q&&!isNaN(+q)) adjustStock(p.id,+q,"STOCK_IN"); }}
                        className="rounded px-1.5 py-0.5 text-[10px] bg-green-50 text-green-700 hover:bg-green-100">+</button>
                      <button onClick={()=>{ const q=prompt("Quantity to remove:"); if(q&&!isNaN(+q)) adjustStock(p.id,+q,"STOCK_OUT"); }}
                        className="rounded px-1.5 py-0.5 text-[10px] bg-red-50 text-red-600 hover:bg-red-100">-</button>
                    </div>
                  )}
                </div>
              ))}
              {filtered.length===0&&<div className="py-10 text-center text-ink-faint text-sm">No parts found</div>}
            </Card>
          )}
        </div>
      )}

      {/* Add part */}
      {tab===1&&canEdit&&(
        <div className="max-w-lg">
          <Card className="p-6">
            <p className="text-sm font-semibold text-ink mb-5">Add new part</p>
            <form onSubmit={addPart} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Part name *</label><input className="input" placeholder="e.g. Oil Filter" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} required/></div>
                <div><label className="label">SKU *</label><input className="input" placeholder="e.g. OF-001" value={form.sku} onChange={e=>setForm(p=>({...p,sku:e.target.value}))} required/></div>
                <div><label className="label">Category</label><input className="input" placeholder="e.g. Filters" value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))}/></div>
                <div><label className="label">Unit</label>
                  <select className="input" value={form.unit} onChange={e=>setForm(p=>({...p,unit:e.target.value}))}>
                    {["PCS","LITRES","KG","SET","PAIR","BOX"].map(u=><option key={u}>{u}</option>)}
                  </select></div>
                <div><label className="label">Initial stock</label><input className="input" type="number" min="0" value={form.quantity} onChange={e=>setForm(p=>({...p,quantity:e.target.value}))}/></div>
                <div><label className="label">Low stock alert</label><input className="input" type="number" min="0" value={form.minQuantity} onChange={e=>setForm(p=>({...p,minQuantity:e.target.value}))}/></div>
                <div className="col-span-2"><label className="label">Unit price (GHS)</label><input className="input" type="number" min="0" step="0.01" value={form.unitPrice} onChange={e=>setForm(p=>({...p,unitPrice:e.target.value}))}/></div>
                <div className="col-span-2"><label className="label">Description</label><input className="input" placeholder="Optional description" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))}/></div>
              </div>
              {error&&<div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              {success&&<div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}
              <button type="submit" disabled={saving} className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition disabled:opacity-60">
                {saving?"Adding…":"Add part"}
              </button>
            </form>
          </Card>
        </div>
      )}

      {/* Movements */}
      {tab===2&&(
        <Card className="p-0 overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_100px_1fr_100px] gap-2 bg-ink-paper px-4 py-2.5 text-[10px] font-semibold text-ink-faint uppercase tracking-wide">
            <span>Part</span><span>Qty</span><span>Type</span><span>Note</span><span>Date</span>
          </div>
          {moves.slice(0,50).map((m:any)=>(
            <div key={m.id} className="grid grid-cols-[1fr_80px_100px_1fr_100px] gap-2 border-t border-ink-ghost px-4 py-3 items-center">
              <span className="text-sm text-ink">{m.part?.name||"—"}</span>
              <span className={clsx("text-sm font-semibold", m.type==="STOCK_IN"?"text-green-600":"text-red-600")}>
                {m.type==="STOCK_IN"?"+":"-"}{m.quantity}
              </span>
              <span className="text-xs text-ink-subtle">{m.type?.replace(/_/g," ")}</span>
              <span className="text-xs text-ink-faint truncate">{m.note||"—"}</span>
              <span className="text-[10px] text-ink-faint">{new Date(m.createdAt).toLocaleDateString("en-GH")}</span>
            </div>
          ))}
          {moves.length===0&&<div className="py-10 text-center text-ink-faint text-sm">No stock movements yet</div>}
        </Card>
      )}

      {/* Low stock */}
      {tab===3&&(
        lowStock.length===0
          ? <Card className="p-10 text-center"><p className="text-2xl mb-2">✅</p><p className="text-sm text-ink-faint">All parts are adequately stocked</p></Card>
          : <Card className="p-0 overflow-hidden">
              {lowStock.map(p=>(
                <div key={p.id} className="flex items-center gap-4 border-b border-ink-ghost px-4 py-3 last:border-0 bg-red-50/30">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-ink">{p.name}</p>
                    <p className="text-xs text-ink-faint">{p.sku} · {p.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600">{p.qty} <span className="text-xs font-normal">{p.unit}</span></p>
                    <p className="text-[10px] text-ink-faint">Min: {p.minQty}</p>
                  </div>
                  <span className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">Reorder</span>
                </div>
              ))}
            </Card>
      )}
    </div>
  );
}
