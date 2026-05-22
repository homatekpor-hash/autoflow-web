"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card, Spinner } from "@/components/ui";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [paying,   setPaying]   = useState<string|null>(null);
  const [method,   setMethod]   = useState("CASH");

  async function load() {
    const res = await fetch(`${API}/api/invoices`, { headers: { Authorization: `Bearer ${tok()}` } });
    if (res.ok) setInvoices(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function markPaid(id: string) {
    const res = await fetch(`${API}/api/invoices/${id}/paid`, {
      method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok()}` },
      body: JSON.stringify({ paymentMethod: method }),
    });
    if (res.ok) { setPaying(null); load(); }
  }

  const total    = invoices.reduce((s,i)=>s+(i.status==="PAID"?Number(i.total):0),0);
  const unpaid   = invoices.reduce((s,i)=>s+(i.status==="UNPAID"?Number(i.total):0),0);

  return (
    <div className="fade-up">
      <PageHeader title="Invoices" subtitle={`${invoices.length} invoices`} />

      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        {[["Total collected","GHS "+total.toLocaleString(),"text-green-600"],
          ["Outstanding","GHS "+unpaid.toLocaleString(),"text-amber-600"],
          ["Paid",invoices.filter(i=>i.status==="PAID").length,"text-green-600"],
          ["Unpaid",invoices.filter(i=>i.status==="UNPAID").length,"text-amber-600"]].map(([l,v,c])=>(
          <Card key={String(l)} className="p-4 text-center">
            <p className="text-xs text-ink-faint mb-1">{l}</p>
            <p className={`text-xl font-bold ${c}`}>{v}</p>
          </Card>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner className="h-6 w-6"/></div> : (
        <Card className="p-0 overflow-hidden">
          <div className="grid grid-cols-[100px_1fr_120px_100px_100px_80px] gap-2 bg-ink-paper px-4 py-2.5 text-[10px] font-semibold text-ink-faint uppercase tracking-wide">
            <span>Invoice #</span><span>Job / Vehicle</span><span>Workshop</span><span>Total (GHS)</span><span>Status</span><span></span>
          </div>
          {invoices.map(inv => (
            <div key={inv.id} className="grid grid-cols-[100px_1fr_120px_100px_100px_80px] gap-2 border-t border-ink-ghost px-4 py-3 items-center">
              <span className="font-mono text-xs text-orange-500">{inv.invoiceNumber}</span>
              <div>
                <p className="text-sm font-medium text-ink">{inv.job?.vehicle?.make} {inv.job?.vehicle?.model}</p>
                <p className="text-xs text-ink-faint">{inv.job?.jobRef} · {inv.job?.customerName}</p>
              </div>
              <span className="text-xs text-ink-subtle truncate">{inv.job?.workshop?.name}</span>
              <span className="font-semibold text-ink">{Number(inv.total).toLocaleString()}</span>
              <span className={clsx("rounded-md px-2 py-0.5 text-[10px] font-semibold w-fit",
                inv.status==="PAID" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700")}>
                {inv.status}
              </span>
              {inv.status === "UNPAID" ? (
                paying === inv.id ? (
                  <div className="flex gap-1">
                    <select value={method} onChange={e=>setMethod(e.target.value)} className="text-[10px] border border-ink-ghost rounded px-1 py-0.5">
                      <option value="CASH">Cash</option>
                      <option value="MOMO">MoMo</option>
                      <option value="CARD">Card</option>
                      <option value="BANK">Bank</option>
                    </select>
                    <button onClick={() => markPaid(inv.id)} className="text-[10px] bg-green-500 text-white rounded px-2 py-0.5">✓</button>
                  </div>
                ) : (
                  <button onClick={() => setPaying(inv.id)} className="text-xs text-green-600 hover:underline">Mark paid</button>
                )
              ) : (
                <span className="text-[10px] text-ink-faint">{inv.paymentMethod}</span>
              )}
            </div>
          ))}
          {invoices.length === 0 && <div className="py-12 text-center text-ink-faint text-sm">No invoices yet</div>}
        </Card>
      )}
    </div>
  );
}
