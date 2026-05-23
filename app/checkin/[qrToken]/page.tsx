"use client";
import { useEffect, useState, FormEvent } from "react";
import { Spinner } from "@/components/ui";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function CheckinPage({ params }: { params: { qrToken: string } }) {
  const [workshop, setWorkshop] = useState<any>(null);
  const [wsError,  setWsError]  = useState("");
  const [step,     setStep]     = useState<"form"|"success">("form");
  const [jobRef,   setJobRef]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [form, setForm] = useState({ plate:"", make:"", model:"", year:"", mileage:"", customerName:"", customerPhone:"", complaint:"" });

  useEffect(() => {
    fetch(`${API}/api/checkin/workshop/${params.qrToken}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setWorkshop)
      .catch(() => setWsError("Workshop not found. This QR code may be invalid or expired."));
  }, [params.qrToken]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!workshop) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/checkin/${params.qrToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, mileage: form.mileage ? parseInt(form.mileage) : undefined, year: form.year ? parseInt(form.year) : undefined }),
      });
      const data = await res.json();
      if (res.ok) { setJobRef(data.jobRef); setStep("success"); }
      else alert(data.error || "Failed to check in");
    } catch { alert("Network error. Please try again."); }
    setLoading(false);
  }

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  if (wsError) return (
    <div style={{minHeight:"100vh",background:"#07070d",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif"}}>
      <div style={{textAlign:"center",color:"#f0f0f8"}}>
        <p style={{fontSize:"48px",marginBottom:"16px"}}>🔍</p>
        <p style={{fontSize:"20px",fontWeight:700,marginBottom:"8px"}}>Workshop not found</p>
        <p style={{color:"#8888aa"}}>This QR code may be invalid or expired.</p>
      </div>
    </div>
  );

  if (!workshop) return (
    <div style={{minHeight:"100vh",background:"#07070d",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <Spinner className="h-8 w-8" />
    </div>
  );

  if (step === "success") return (
    <div style={{minHeight:"100vh",background:"#07070d",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif",padding:"24px"}}>
      <div style={{textAlign:"center",color:"#f0f0f8",maxWidth:"400px"}}>
        <p style={{fontSize:"64px",marginBottom:"16px"}}>✅</p>
        <h1 style={{fontSize:"28px",fontWeight:800,marginBottom:"8px"}}>You're checked in!</h1>
        <p style={{color:"#8888aa",marginBottom:"24px"}}>Your vehicle has been received at {workshop.name}.</p>
        <div style={{background:"rgba(249,115,22,0.1)",border:"1px solid rgba(249,115,22,0.3)",borderRadius:"16px",padding:"20px",marginBottom:"24px"}}>
          <p style={{color:"#8888aa",fontSize:"12px",marginBottom:"4px"}}>Your job reference</p>
          <p style={{fontSize:"28px",fontWeight:800,color:"#f97316",fontFamily:"monospace"}}>{jobRef}</p>
          <p style={{color:"#8888aa",fontSize:"12px",marginTop:"4px"}}>Save this to track your vehicle</p>
        </div>
        <p style={{color:"#8888aa",fontSize:"14px"}}>We'll keep you updated on your vehicle's progress.</p>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#07070d",fontFamily:"sans-serif",color:"#f0f0f8"}}>
      <div style={{background:"rgba(15,15,24,0.9)",borderBottom:"1px solid rgba(255,255,255,0.07)",padding:"16px 24px"}}>
        <p style={{fontWeight:800,fontSize:"18px"}}>🚗 {workshop.name}</p>
        <p style={{color:"#8888aa",fontSize:"13px"}}>📍 {workshop.location}</p>
      </div>

      <div style={{maxWidth:"480px",margin:"0 auto",padding:"32px 24px"}}>
        <h1 style={{fontSize:"28px",fontWeight:800,marginBottom:"8px"}}>Vehicle Check-in</h1>
        <p style={{color:"#8888aa",marginBottom:"32px",fontSize:"15px"}}>Fill in your details and we'll take care of the rest.</p>

        <form onSubmit={handleSubmit}>
          {/* Vehicle */}
          <p style={{fontSize:"11px",fontWeight:700,letterSpacing:"3px",textTransform:"uppercase",color:"#f97316",marginBottom:"16px"}}>Vehicle details</p>
          {[["plate","Plate number *","e.g. GR-1234-22",true],["make","Make *","e.g. Toyota",true],["model","Model *","e.g. Camry",true],["year","Year","e.g. 2018",false],["mileage","Mileage (km)","e.g. 45000",false]].map(([k,l,ph,req])=>(
            <div key={String(k)} style={{marginBottom:"16px"}}>
              <label style={{display:"block",fontSize:"12px",color:"#8888aa",marginBottom:"6px",fontWeight:600}}>{String(l)}</label>
              <input value={(form as any)[String(k)]} onChange={e=>f(String(k),e.target.value)} placeholder={String(ph)} required={Boolean(req)}
                style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",padding:"12px 16px",color:"#f0f0f8",fontSize:"15px",outline:"none",fontFamily:"sans-serif"}} />
            </div>
          ))}

          {/* Customer */}
          <p style={{fontSize:"11px",fontWeight:700,letterSpacing:"3px",textTransform:"uppercase",color:"#f97316",margin:"24px 0 16px"}}>Your details</p>
          {[["customerName","Full name *","e.g. Kofi Mensah",true],["customerPhone","Phone number *","e.g. 0244000000",true]].map(([k,l,ph,req])=>(
            <div key={String(k)} style={{marginBottom:"16px"}}>
              <label style={{display:"block",fontSize:"12px",color:"#8888aa",marginBottom:"6px",fontWeight:600}}>{String(l)}</label>
              <input value={(form as any)[String(k)]} onChange={e=>f(String(k),e.target.value)} placeholder={String(ph)} required={Boolean(req)}
                style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",padding:"12px 16px",color:"#f0f0f8",fontSize:"15px",outline:"none",fontFamily:"sans-serif"}} />
            </div>
          ))}

          {/* Complaint */}
          <p style={{fontSize:"11px",fontWeight:700,letterSpacing:"3px",textTransform:"uppercase",color:"#f97316",margin:"24px 0 16px"}}>Issue</p>
          <div style={{marginBottom:"24px"}}>
            <label style={{display:"block",fontSize:"12px",color:"#8888aa",marginBottom:"6px",fontWeight:600}}>Describe the problem *</label>
            <textarea value={form.complaint} onChange={e=>f("complaint",e.target.value)} placeholder="e.g. Engine making strange noise when starting..." required rows={4}
              style={{width:"100%",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",padding:"12px 16px",color:"#f0f0f8",fontSize:"15px",outline:"none",fontFamily:"sans-serif",resize:"none"}} />
          </div>

          <button type="submit" disabled={loading}
            style={{width:"100%",background:"linear-gradient(135deg,#f97316,#ea6c0a)",color:"white",border:"none",borderRadius:"12px",padding:"16px",fontSize:"16px",fontWeight:700,cursor:"pointer",fontFamily:"sans-serif"}}>
            {loading ? "Submitting…" : "Check in my vehicle →"}
          </button>
        </form>
      </div>
    </div>
  );
}
