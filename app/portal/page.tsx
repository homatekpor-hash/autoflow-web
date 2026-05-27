"use client";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const STATUS_COLOR: Record<string,string> = {
  RECEIVED:"bg-gray-100 text-gray-600", DIAGNOSING:"bg-amber-50 text-amber-700",
  WAITING_APPROVAL:"bg-blue-50 text-blue-700", WAITING_PARTS:"bg-orange-50 text-orange-700",
  IN_PROGRESS:"bg-blue-100 text-blue-700", QC:"bg-purple-50 text-purple-700",
  READY:"bg-green-100 text-green-700", DELIVERED:"bg-gray-50 text-gray-500",
};

export default function CustomerPortalPage() {
  const [phone,   setPhone]   = useState("");
  const [jobs,    setJobs]    = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched,setSearched]= useState(false);
  const [error,   setError]   = useState("");

  async function search() {
    if (!phone.trim()) return;
    setLoading(true); setError(""); setSearched(false);
    try {
      const res = await fetch(`${API}/api/jobs/customer?phone=${encodeURIComponent(phone)}`);
      if (res.ok) { setJobs(await res.json()); setSearched(true); }
      else setError("No jobs found for this number.");
    } catch { setError("Network error. Please try again."); }
    setLoading(false);
  }

  return (
    <div style={{minHeight:"100vh",background:"#07070d",fontFamily:"sans-serif",color:"#f0f0f8"}}>
      {/* Header */}
      <div style={{background:"rgba(15,15,24,0.9)",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"16px 24px",display:"flex",alignItems:"center",gap:"12px"}}>
        <span style={{fontSize:"24px"}}>🚗</span>
        <div><p style={{fontWeight:800,fontSize:"18px",margin:0}}>AutoFlow Ghana</p><p style={{color:"#8888aa",fontSize:"12px",margin:0}}>Customer Portal</p></div>
      </div>

      <div style={{maxWidth:"640px",margin:"0 auto",padding:"40px 24px"}}>
        <h1 style={{fontSize:"28px",fontWeight:800,marginBottom:"8px"}}>Your Vehicle History</h1>
        <p style={{color:"#8888aa",marginBottom:"32px"}}>Enter your phone number to see all your past and current jobs.</p>

        {/* Search */}
        <div style={{display:"flex",gap:"12px",marginBottom:"32px"}}>
          <input value={phone} onChange={e=>setPhone(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&search()}
            placeholder="e.g. 0244000000"
            style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"12px",padding:"14px 16px",color:"#f0f0f8",fontSize:"16px",outline:"none"}} />
          <button onClick={search} disabled={loading}
            style={{background:"linear-gradient(135deg,#f97316,#ea6c0a)",color:"white",border:"none",borderRadius:"12px",padding:"14px 24px",fontSize:"15px",fontWeight:700,cursor:"pointer"}}>
            {loading?"…":"Search"}
          </button>
        </div>

        {error && <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:"12px",padding:"14px",color:"#fca5a5",marginBottom:"24px"}}>{error}</div>}

        {/* Results */}
        {searched && jobs.length === 0 && (
          <div style={{textAlign:"center",padding:"40px",color:"#8888aa"}}>
            <p style={{fontSize:"48px",marginBottom:"12px"}}>🔍</p>
            <p style={{fontSize:"18px",fontWeight:600,marginBottom:"8px"}}>No jobs found</p>
            <p>No jobs were found for {phone}. Check your number and try again.</p>
          </div>
        )}

        {jobs.map(job=>(
          <div key={job.id} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"16px",padding:"20px",marginBottom:"16px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"start",marginBottom:"12px"}}>
              <div>
                <p style={{fontFamily:"monospace",color:"#f97316",fontWeight:700,fontSize:"16px",margin:"0 0 4px"}}>{job.jobRef}</p>
                <p style={{color:"#8888aa",fontSize:"13px",margin:0}}>{job.workshop?.name}</p>
              </div>
              <span style={{background:"rgba(255,255,255,0.08)",borderRadius:"99px",padding:"4px 12px",fontSize:"11px",fontWeight:700}}>
                {job.status?.replace(/_/g," ")}
              </span>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"12px"}}>
              <div style={{background:"rgba(255,255,255,0.04)",borderRadius:"10px",padding:"12px"}}>
                <p style={{color:"#8888aa",fontSize:"11px",margin:"0 0 4px"}}>VEHICLE</p>
                <p style={{fontWeight:700,margin:"0 0 2px"}}>{job.vehicle?.make} {job.vehicle?.model}</p>
                <p style={{color:"#8888aa",fontSize:"12px",margin:0}}>{job.vehicle?.plate}</p>
              </div>
              <div style={{background:"rgba(255,255,255,0.04)",borderRadius:"10px",padding:"12px"}}>
                <p style={{color:"#8888aa",fontSize:"11px",margin:"0 0 4px"}}>DATE</p>
                <p style={{fontWeight:700,margin:"0 0 2px"}}>{new Date(job.createdAt).toLocaleDateString("en-GH",{day:"numeric",month:"short",year:"numeric"})}</p>
                <p style={{color:"#8888aa",fontSize:"12px",margin:0}}>{job.priority} priority</p>
              </div>
            </div>
            {job.complaint && (
              <div style={{background:"rgba(255,255,255,0.04)",borderRadius:"10px",padding:"12px",marginBottom:"12px"}}>
                <p style={{color:"#8888aa",fontSize:"11px",margin:"0 0 4px"}}>COMPLAINT</p>
                <p style={{margin:0,fontSize:"14px"}}>{job.complaint}</p>
              </div>
            )}
            {job.invoice && (
              <div style={{background:job.invoice.status==="PAID"?"rgba(34,197,94,0.1)":"rgba(249,115,22,0.1)",border:`1px solid ${job.invoice.status==="PAID"?"rgba(34,197,94,0.2)":"rgba(249,115,22,0.2)"}`,borderRadius:"10px",padding:"12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{color:job.invoice.status==="PAID"?"#86efac":"#fdba74",fontWeight:700,fontSize:"13px"}}>{job.invoice.status==="PAID"?"✅ Paid":"⏳ Payment pending"}</span>
                <span style={{fontWeight:800,fontSize:"16px"}}>GHS {Number(job.invoice.total).toLocaleString()}</span>
              </div>
            )}
            <div style={{marginTop:"12px",display:"flex",gap:"8px"}}>
              <a href={`/track?ref=${job.jobRef}`}
                style={{flex:1,textAlign:"center",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",padding:"10px",color:"#f0f0f8",textDecoration:"none",fontSize:"13px",fontWeight:600}}>
                📍 Track job
              </a>
              <a href={`/rate/${job.id}`}
                style={{flex:1,textAlign:"center",background:"rgba(249,115,22,0.1)",border:"1px solid rgba(249,115,22,0.2)",borderRadius:"10px",padding:"10px",color:"#f97316",textDecoration:"none",fontSize:"13px",fontWeight:600}}>
                ⭐ Rate service
              </a>
            </div>
          </div>
        ))}

        <p style={{textAlign:"center",color:"#555",fontSize:"12px",marginTop:"40px"}}>
          <a href="/track" style={{color:"#f97316"}}>Track a specific job →</a>
        </p>
      </div>
    </div>
  );
}
