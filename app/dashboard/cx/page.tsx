"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card, Spinner } from "@/components/ui";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");
const af  = (url: string, opts: RequestInit = {}) =>
  fetch(`${API}${url}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok()}`, ...(opts.headers||{}) } });

export default function CXPage() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("surveys");

  useEffect(() => {
    Promise.all([
      af("/api/cx/surveys").then(r => r.ok ? r.json() : []),
      af("/api/cx/referrals").then(r => r.ok ? r.json() : []),
    ]).then(([s, r]) => {
      setSurveys(Array.isArray(s) ? s : []);
      setReferrals(Array.isArray(r) ? r : []);
      setLoading(false);
    });
  }, []);

  const avgScore = surveys.length ? (surveys.reduce((s,r)=>s+(r.score||0),0)/surveys.length).toFixed(1) : "—";
  const promoters = surveys.filter(s=>s.score>=9).length;
  const detractors = surveys.filter(s=>s.score<=6).length;
  const nps = surveys.length ? Math.round(((promoters-detractors)/surveys.length)*100) : 0;

  return (
    <div className="fade-up">
      <PageHeader title="Customer Experience" subtitle="Surveys, NPS scores and referrals" />

      {/* NPS stats */}
      <div className="grid grid-cols-2 gap-4 mb-5 sm:grid-cols-4">
        {[["NPS score", nps, "text-orange-500"],["Avg rating", avgScore+"★", "text-amber-500"],
          ["Promoters", promoters, "text-green-600"],["Total surveys", surveys.length, "text-blue-600"]].map(([l,v,c])=>(
          <Card key={String(l)} className="p-4 text-center">
            <p className="text-xs text-ink-faint mb-1">{l}</p>
            <p className={`text-2xl font-bold ${c}`}>{v}</p>
          </Card>
        ))}
      </div>

      <div className="flex border-b border-ink-ghost mb-5">
        {["surveys","referrals","whatsapp"].map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize transition ${tab===t?"border-orange-500 text-orange-600":"border-transparent text-ink-subtle hover:text-ink"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab==="surveys" && (
        loading ? <div className="flex justify-center py-10"><Spinner className="h-6 w-6"/></div> :
        surveys.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-3xl mb-3">⭐</p>
            <p className="text-sm font-semibold text-ink mb-1">No surveys yet</p>
            <p className="text-xs text-ink-subtle">Surveys are sent automatically when a job is delivered</p>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden">
            {surveys.map((s:any)=>(
              <div key={s.id} className="flex items-center gap-4 px-4 py-3 border-b border-ink-ghost last:border-0">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${s.score>=9?"bg-green-500":s.score>=7?"bg-amber-500":"bg-red-500"}`}>
                  {s.score}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink">{s.customerName || "Anonymous"}</p>
                  {s.comment && <p className="text-xs text-ink-subtle mt-0.5 italic">"{s.comment}"</p>}
                </div>
                <span className="text-xs text-ink-faint">{new Date(s.createdAt).toLocaleDateString("en-GH")}</span>
              </div>
            ))}
          </Card>
        )
      )}

      {tab==="referrals" && (
        <Card className="p-12 text-center">
          <p className="text-3xl mb-3">🎁</p>
          <p className="text-sm font-semibold text-ink mb-1">Referral programme</p>
          <p className="text-xs text-ink-subtle max-w-xs mx-auto">Customers get a unique referral code after job completion. Each successful referral earns them a discount on their next service.</p>
        </Card>
      )}

      {tab==="whatsapp" && (
        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-sm font-semibold text-ink mb-3">📱 WhatsApp notification templates</p>
            <p className="text-xs text-ink-subtle mb-4">These messages are sent automatically when job status changes. Powered by wa.me links.</p>
            {[
              ["RECEIVED",  "✅ Your vehicle has been received at {workshop}. Job ref: {jobRef}"],
              ["DIAGNOSING","🔍 Our technician is diagnosing your {vehicle}. We'll update you soon."],
              ["READY",     "🎉 Your {vehicle} is ready for pickup at {workshop}!"],
              ["DELIVERED", "👍 Thank you for choosing {workshop}! We hope to see you again."],
            ].map(([status, msg])=>(
              <div key={String(status)} className="mb-3 rounded-xl border border-ink-ghost p-3">
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wide">{status}</span>
                <p className="text-sm text-ink mt-1">{msg}</p>
              </div>
            ))}
          </Card>
          <Card className="p-5 border-blue-200 bg-blue-50">
            <p className="text-sm font-semibold text-blue-800 mb-1">Connect WhatsApp Business API</p>
            <p className="text-xs text-blue-700">To enable automatic sending, connect your Twilio WhatsApp Business account in Settings. Currently sending via wa.me links.</p>
          </Card>
        </div>
      )}
    </div>
  );
}
