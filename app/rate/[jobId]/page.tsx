"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function RatePage({ params }: { params: { jobId: string } }) {
  const [score,    setScore]    = useState(0);
  const [comment,  setComment]  = useState("");
  const [submitted,setSubmitted]= useState(false);
  const [loading,  setLoading]  = useState(false);
  const [job,      setJob]      = useState<any>(null);

  useEffect(() => {
    fetch(`${API}/api/jobs/track/${params.jobId}`)
      .then(r=>r.ok?r.json():null).then(setJob);
  }, [params.jobId]);

  async function submit() {
    if (!score) return;
    setLoading(true);
    const res = await fetch(`${API}/api/jobs/${params.jobId}/rate`, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ score, comment }),
    });
    if (res.ok) setSubmitted(true);
    setLoading(false);
  }

  const label = score >= 9 ? "Excellent! 🎉" : score >= 7 ? "Good 👍" : score >= 5 ? "Average 😐" : score > 0 ? "Poor 😞" : "";

  return (
    <div style={{minHeight:"100vh",background:"#07070d",fontFamily:"sans-serif",color:"#f0f0f8",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px"}}>
      <div style={{maxWidth:"480px",width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <p style={{fontSize:"48px",marginBottom:"12px"}}>⭐</p>
          <h1 style={{fontSize:"28px",fontWeight:800,marginBottom:"8px"}}>How was your experience?</h1>
          {job && <p style={{color:"#8888aa"}}>Rate your service at <strong style={{color:"#f97316"}}>{job.workshop?.name}</strong></p>}
        </div>
        {submitted ? (
          <div style={{textAlign:"center",background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:"20px",padding:"40px"}}>
            <p style={{fontSize:"48px",marginBottom:"16px"}}>🙏</p>
            <h2 style={{fontSize:"24px",fontWeight:700,marginBottom:"8px"}}>Thank you!</h2>
            <p style={{color:"#8888aa"}}>Your feedback helps us improve our service.</p>
          </div>
        ) : (
          <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"20px",padding:"32px"}}>
            <p style={{fontSize:"12px",color:"#8888aa",marginBottom:"16px",textAlign:"center",fontWeight:600,letterSpacing:"2px",textTransform:"uppercase"}}>Rate from 1 to 10</p>
            <div style={{display:"flex",gap:"8px",justifyContent:"center",marginBottom:"16px",flexWrap:"wrap"}}>
              {[1,2,3,4,5,6,7,8,9,10].map(s=>(
                <button key={s} onClick={()=>setScore(s)}
                  style={{width:"44px",height:"44px",borderRadius:"12px",border:`2px solid ${s<=score?"#f97316":"rgba(255,255,255,0.1)"}`,background:s<=score?"rgba(249,115,22,0.2)":"transparent",color:s<=score?"#f97316":"#888",fontSize:"16px",fontWeight:700,cursor:"pointer"}}>
                  {s}
                </button>
              ))}
            </div>
            {score > 0 && <p style={{textAlign:"center",color:"#f97316",fontWeight:700,marginBottom:"20px",fontSize:"18px"}}>{label}</p>}
            <div style={{marginBottom:"20px"}}>
              <label style={{display:"block",fontSize:"12px",color:"#8888aa",marginBottom:"8px"}}>Comments (optional)</label>
              <textarea value={comment} onChange={e=>setComment(e.target.value)} rows={3} placeholder="Tell us about your experience…"
                style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"12px",padding:"12px 16px",color:"#f0f0f8",fontSize:"14px",outline:"none",fontFamily:"sans-serif",resize:"none"}} />
            </div>
            <button onClick={submit} disabled={!score||loading}
              style={{width:"100%",background:score?"linear-gradient(135deg,#f97316,#ea6c0a)":"rgba(255,255,255,0.1)",color:"white",border:"none",borderRadius:"12px",padding:"16px",fontSize:"16px",fontWeight:700,cursor:score?"pointer":"not-allowed",fontFamily:"sans-serif"}}>
              {loading?"Submitting…":"Submit rating →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
