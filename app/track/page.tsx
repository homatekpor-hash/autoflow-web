"use client";
import { useState } from "react";
import Image from "next/image";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const STATUS_STEPS = ["RECEIVED","DIAGNOSING","WAITING_APPROVAL","WAITING_PARTS","IN_PROGRESS","QC","READY","DELIVERED"];
const STATUS_LABELS: Record<string,string> = {
  RECEIVED:"Vehicle received", DIAGNOSING:"Diagnosing issue", WAITING_APPROVAL:"Awaiting your approval",
  WAITING_PARTS:"Waiting for parts", IN_PROGRESS:"Repair in progress", QC:"Quality check",
  READY:"Ready for pickup! 🎉", DELIVERED:"Delivered ✅", CANCELLED:"Cancelled"
};
const STATUS_ICONS: Record<string,string> = {
  RECEIVED:"📥", DIAGNOSING:"🔍", WAITING_APPROVAL:"📋", WAITING_PARTS:"📦",
  IN_PROGRESS:"🔧", QC:"✨", READY:"🎉", DELIVERED:"✅", CANCELLED:"❌"
};

export default function TrackPage() {
  const [ref,     setRef]     = useState("");
  const [job,     setJob]     = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  async function search(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true); setJob(null);
    const res = await fetch(`${API}/api/jobs/track/${ref.trim().toUpperCase()}`);
    if (res.ok) setJob(await res.json());
    else setError("Job not found. Please check your reference number.");
    setLoading(false);
  }

  const stepIdx = job ? STATUS_STEPS.indexOf(job.status) : -1;

  return (
    <div style={{minHeight:"100vh",background:"#07070d",color:"#f0f0f8",fontFamily:"'Outfit',sans-serif"}}>
      {/* Header */}
      <div style={{borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"16px 32px",display:"flex",alignItems:"center",gap:"12px",background:"rgba(15,15,24,0.8)"}}>
        <Image src="/autoflow-logo.jpg" alt="AutoFlow" width={40} height={40} style={{borderRadius:"8px",objectFit:"contain"}} />
        <div>
          <p style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontWeight:800,fontSize:"18px"}}>AutoFlow Ghana</p>
          <p style={{fontSize:"12px",color:"#8888aa"}}>Job tracker</p>
        </div>
      </div>

      <div style={{maxWidth:"560px",margin:"0 auto",padding:"60px 24px"}}>
        <h1 style={{fontFamily:"'Bricolage Grotesque',sans-serif",fontSize:"clamp(32px,6vw,48px)",fontWeight:800,letterSpacing:"-0.04em",marginBottom:"12px"}}>
          Track your <span style={{color:"#f97316"}}>vehicle</span>
        </h1>
        <p style={{color:"#8888aa",marginBottom:"40px",fontSize:"16px",fontWeight:300}}>Enter your job reference number to see the current status of your vehicle.</p>

        <form onSubmit={search} style={{display:"flex",gap:"12px",marginBottom:"40px"}}>
          <input value={ref} onChange={e=>setRef(e.target.value)} placeholder="e.g. SL-AGL-0001"
            required style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"12px",padding:"14px 18px",color:"#f0f0f8",fontSize:"16px",outline:"none",fontFamily:"monospace",letterSpacing:"0.05em"}} />
          <button type="submit" disabled={loading}
            style={{background:"linear-gradient(135deg,#f97316,#ea6c0a)",color:"white",border:"none",borderRadius:"12px",padding:"14px 28px",fontSize:"15px",fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>
            {loading ? "Searching…" : "Track →"}
          </button>
        </form>

        {error && (
          <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:"12px",padding:"16px",color:"#fca5a5",marginBottom:"24px"}}>
            {error}
          </div>
        )}

        {job && (
          <div>
            {/* Job card */}
            <div style={{background:"rgba(249,115,22,0.08)",border:"1px solid rgba(249,115,22,0.2)",borderRadius:"20px",padding:"24px",marginBottom:"24px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:"16px"}}>
                <div>
                  <p style={{fontFamily:"monospace",fontSize:"13px",color:"#f97316",marginBottom:"4px"}}>{job.jobRef}</p>
                  <p style={{fontWeight:700,fontSize:"20px"}}>{job.vehicle?.make} {job.vehicle?.model}</p>
                  <p style={{color:"#8888aa",fontSize:"14px"}}>{job.vehicle?.plate} · {job.customerName}</p>
                </div>
                <div style={{textAlign:"center"}}>
                  <p style={{fontSize:"36px"}}>{STATUS_ICONS[job.status]||"🔧"}</p>
                </div>
              </div>
              <div style={{background:"rgba(249,115,22,0.1)",borderRadius:"12px",padding:"14px 18px"}}>
                <p style={{fontSize:"13px",color:"#f97316",fontWeight:600,marginBottom:"2px"}}>Current status</p>
                <p style={{fontSize:"18px",fontWeight:700}}>{STATUS_LABELS[job.status]||job.status}</p>
              </div>
            </div>

            {/* Progress */}
            {job.status !== "CANCELLED" && (
              <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"20px",padding:"24px",marginBottom:"24px"}}>
                <p style={{fontSize:"13px",color:"#8888aa",marginBottom:"20px",fontWeight:600,textTransform:"uppercase",letterSpacing:"2px"}}>Progress</p>
                {STATUS_STEPS.map((s, i) => (
                  <div key={s} style={{display:"flex",alignItems:"center",gap:"14px",marginBottom:"14px"}}>
                    <div style={{width:"32px",height:"32px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"14px",flexShrink:0,
                      background: i < stepIdx ? "rgba(34,197,94,0.2)" : i === stepIdx ? "rgba(249,115,22,0.2)" : "rgba(255,255,255,0.05)",
                      border: i < stepIdx ? "1px solid rgba(34,197,94,0.4)" : i === stepIdx ? "1px solid rgba(249,115,22,0.5)" : "1px solid rgba(255,255,255,0.1)"}}>
                      {i < stepIdx ? "✓" : STATUS_ICONS[s]}
                    </div>
                    <p style={{fontSize:"14px",color: i <= stepIdx ? "#f0f0f8" : "#555577",fontWeight: i === stepIdx ? 600 : 400}}>
                      {STATUS_LABELS[s]}
                    </p>
                    {i === stepIdx && <span style={{marginLeft:"auto",fontSize:"11px",background:"rgba(249,115,22,0.2)",color:"#f97316",padding:"2px 10px",borderRadius:"99px",fontWeight:600}}>NOW</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Workshop */}
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"16px",padding:"18px 20px"}}>
              <p style={{fontSize:"12px",color:"#8888aa",marginBottom:"4px"}}>Workshop</p>
              <p style={{fontWeight:600}}>{job.workshop?.name}</p>
              <p style={{fontSize:"13px",color:"#8888aa"}}>📍 {job.workshop?.location}</p>
              {job.workshop?.phone && <p style={{fontSize:"13px",color:"#8888aa"}}>📞 {job.workshop?.phone}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
