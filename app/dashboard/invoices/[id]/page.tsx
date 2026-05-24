"use client";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/invoices/${params.id}`, { headers: { Authorization: `Bearer ${tok()}` } })
      .then(r => r.ok ? r.json() : null).then(d => { setInvoice(d); setLoading(false); });
  }, [params.id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-6 w-6"/></div>;
  if (!invoice) return <div className="text-center py-20 text-ink-faint">Invoice not found</div>;

  const job = invoice.job;
  const items = job?.estimate?.items || [];

  return (
    <div>
      <div className="flex gap-3 mb-6 print:hidden">
        <button onClick={() => window.print()} className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600">🖨️ Print / Save PDF</button>
        <button onClick={() => window.history.back()} className="rounded-xl border border-ink-ghost px-5 py-2.5 text-sm text-ink-subtle hover:bg-ink-paper">← Back</button>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 print:shadow-none print:border-none print:p-4">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-orange-500">AutoFlow Ghana</h1>
            <p className="text-sm text-gray-500">Workshop Management Platform</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-gray-900">{invoice.invoiceNumber}</p>
            <p className={`text-sm font-semibold mt-1 ${invoice.status==="PAID"?"text-green-600":"text-amber-600"}`}>{invoice.status}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(invoice.createdAt).toLocaleDateString("en-GH",{year:"numeric",month:"long",day:"numeric"})}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          {[
            ["Workshop", [job?.workshop?.name, job?.workshop?.location, job?.workshop?.phone].filter(Boolean)],
            ["Customer", [job?.customerName, job?.customerPhone].filter(Boolean)],
            ["Vehicle",  [`${job?.vehicle?.make} ${job?.vehicle?.model}`, `Plate: ${job?.vehicle?.plate}`].filter(Boolean)],
            ["Job ref",  [job?.jobRef, invoice.paymentMethod ? `Via: ${invoice.paymentMethod}` : null].filter(Boolean)],
          ].map(([label, lines]: any) => (
            <div key={String(label)} className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{label}</p>
              {lines.map((l: string, i: number) => <p key={i} className={i===0?"font-semibold text-gray-900":"text-sm text-gray-500"}>{l}</p>)}
            </div>
          ))}
        </div>

        <table className="w-full mb-6">
          <thead>
            <tr className="border-b-2 border-gray-200">
              {["Description","Type","Qty","Unit price","Total"].map(h=>(
                <th key={h} className={`text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 ${h==="Description"?"text-left":"text-right"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, i: number) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-3 text-sm text-gray-900">{item.description}</td>
                <td className="py-3 text-sm text-gray-500 text-right">{item.type}</td>
                <td className="py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                <td className="py-3 text-sm text-gray-900 text-right">GHS {Number(item.rate||item.unitPrice||0).toLocaleString()}</td>
                <td className="py-3 text-sm font-medium text-gray-900 text-right">GHS {(item.quantity*(item.rate||item.unitPrice||0)).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t-2 border-gray-200 pt-4 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>GHS {Number(invoice.subtotal).toLocaleString()}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">VAT (12.5%)</span><span>GHS {Number(invoice.tax).toFixed(2)}</span></div>
          <div className="flex justify-between text-xl font-bold border-t-2 border-gray-200 pt-3"><span>Total</span><span className="text-orange-500">GHS {Number(invoice.total).toLocaleString()}</span></div>
        </div>

        {invoice.status==="PAID" && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-green-700 font-semibold">✅ PAID — {invoice.paymentMethod}</p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
          <p>Thank you for choosing {job?.workshop?.name}</p>
          <p className="mt-1">Powered by AutoFlow Ghana</p>
        </div>
      </div>
    </div>
  );
}
