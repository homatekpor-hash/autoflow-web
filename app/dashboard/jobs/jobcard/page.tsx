"use client";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");

export default function JobCardPage() {
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      fetch(`${API}/api/jobs/${id}`, { headers: { Authorization: `Bearer ${tok()}` } })
        .then(r=>r.ok?r.json():null).then(d=>{setJob(d);setLoading(false);});
    } else setLoading(false);
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-6 w-6"/></div>;

  return (
    <div>
      <div className="flex gap-3 mb-6 print:hidden">
        <button onClick={()=>window.print()} className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600">🖨️ Print job card</button>
        <button onClick={()=>window.history.back()} className="rounded-xl border border-ink-ghost px-5 py-2.5 text-sm text-ink-subtle hover:bg-ink-paper">← Back</button>
      </div>
      {job ? (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 p-8 print:rounded-none print:border-none">
          <div className="flex justify-between items-start border-b-2 border-orange-500 pb-4 mb-6">
            <div><h1 className="text-2xl font-bold text-orange-500 mb-0.5">AutoFlow Ghana</h1><p className="text-sm text-gray-500">{job.workshop?.name}</p></div>
            <div className="text-right">
              <p className="text-xl font-bold font-mono">{job.jobRef}</p>
              <span className="inline-block bg-orange-500 text-white text-[11px] font-bold px-3 py-0.5 rounded-full mt-1">{job.status?.replace(/_/g," ")}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-xl p-4"><p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Vehicle</p><p className="font-bold">{job.vehicle?.make} {job.vehicle?.model}</p><p className="text-sm text-gray-500">Plate: {job.vehicle?.plate} · Year: {job.vehicle?.year||"—"}</p></div>
            <div className="bg-gray-50 rounded-xl p-4"><p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Customer</p><p className="font-bold">{job.customerName}</p><p className="text-sm text-gray-500">{job.customerPhone}</p></div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[["Mileage in",job.mileageIn?job.mileageIn+" km":"—"],["Fuel",job.fuelLevel||"—"],["Date",new Date(job.createdAt).toLocaleDateString("en-GH")]].map(([l,v])=>(
              <div key={String(l)} className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-[10px] text-gray-400 mb-1">{l}</p><p className="font-bold text-sm">{v}</p></div>
            ))}
          </div>
          <div className="border border-gray-200 rounded-xl p-4 mb-4"><p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Complaint</p><p>{job.complaint||"—"}</p></div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border border-gray-200 rounded-xl p-4"><p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Technician</p><p className="font-bold">{job.technician?.name||"Not assigned"}</p></div>
            <div className="border border-gray-200 rounded-xl p-4"><p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2">Priority</p><p className="font-bold">{job.priority}</p></div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t-2 border-dashed border-gray-200 pt-5">
            {["Customer signature","Advisor signature"].map(l=>(
              <div key={l}><div className="h-12 border-b border-gray-300 mb-2"/><p className="text-xs text-gray-400">{l}</p></div>
            ))}
          </div>
          <p className="mt-5 text-center text-xs text-gray-300">Powered by AutoFlow Ghana</p>
        </div>
      ) : (
        <div className="text-center py-20 text-ink-faint"><p className="text-2xl mb-3">🖨️</p><p>No job loaded. Open from a job detail page.</p></div>
      )}
    </div>
  );
}
