"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");

const STEPS = ["Welcome","Workshop","Your profile","Done"];

export default function OnboardingPage() {
  const { user } = useAuth();
  const router   = useRouter();
  const [step,   setStep]   = useState(0);
  const [saving, setSaving] = useState(false);
  const [ws,     setWs]     = useState({ name:"", location:"", phone:"" });
  const [profile,setProfile]= useState({ name: user?.name||"" });

  async function saveWorkshop() {
    setSaving(true);
    await fetch(`${API}/api/workshops`, {
      method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${tok()}` },
      body: JSON.stringify(ws),
    });
    setSaving(false);
    setStep(2);
  }

  async function saveProfile() {
    setSaving(true);
    await fetch(`${API}/api/users/${user?.id}`, {
      method:"PUT",
      headers:{ "Content-Type":"application/json", Authorization:`Bearer ${tok()}` },
      body: JSON.stringify({ name: profile.name }),
    });
    setSaving(false);
    setStep(3);
  }

  return (
    <div className="min-h-screen bg-[#07070d] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-between mb-10">
          {STEPS.map((s,i) => (
            <div key={s} className="flex items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${i<=step?"bg-orange-500 text-white":"bg-white/10 text-white/30"}`}>
                {i < step ? "✓" : i+1}
              </div>
              {i < STEPS.length-1 && <div className={`h-0.5 w-12 mx-1 transition-all ${i<step?"bg-orange-500":"bg-white/10"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {step===0 && (
            <div className="text-center">
              <p className="text-5xl mb-4">🚗</p>
              <h1 className="text-2xl font-bold text-white mb-3">Welcome to AutoFlow Ghana!</h1>
              <p className="text-gray-400 mb-8">Let's set up your workshop in just 2 minutes. We'll walk you through everything.</p>
              <button onClick={()=>setStep(1)} className="w-full rounded-xl bg-orange-500 py-3 text-white font-semibold hover:bg-orange-600 transition">
                Get started →
              </button>
            </div>
          )}

          {step===1 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Your workshop</h2>
              <p className="text-gray-400 text-sm mb-6">Tell us about your workshop</p>
              <div className="space-y-4">
                <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Workshop name *</label>
                  <input className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" placeholder="e.g. Accra Auto Works" value={ws.name} onChange={e=>setWs(p=>({...p,name:e.target.value}))} /></div>
                <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Location *</label>
                  <input className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" placeholder="e.g. Spintex, Accra" value={ws.location} onChange={e=>setWs(p=>({...p,location:e.target.value}))} /></div>
                <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Phone number</label>
                  <input className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" placeholder="+233 30 000 0000" value={ws.phone} onChange={e=>setWs(p=>({...p,phone:e.target.value}))} /></div>
              </div>
              <button onClick={saveWorkshop} disabled={saving||!ws.name||!ws.location} className="mt-6 w-full rounded-xl bg-orange-500 py-3 text-white font-semibold hover:bg-orange-600 transition disabled:opacity-50">
                {saving?"Saving…":"Continue →"}
              </button>
            </div>
          )}

          {step===2 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Your profile</h2>
              <p className="text-gray-400 text-sm mb-6">How should we address you?</p>
              <div><label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Your full name</label>
                <input className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500" placeholder="e.g. Kofi Mensah" value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))} /></div>
              <button onClick={saveProfile} disabled={saving} className="mt-6 w-full rounded-xl bg-orange-500 py-3 text-white font-semibold hover:bg-orange-600 transition disabled:opacity-50">
                {saving?"Saving…":"Continue →"}
              </button>
            </div>
          )}

          {step===3 && (
            <div className="text-center">
              <p className="text-5xl mb-4">🎉</p>
              <h2 className="text-2xl font-bold text-white mb-3">You're all set!</h2>
              <p className="text-gray-400 mb-8">Your workshop is ready. Start by doing your first vehicle intake.</p>
              <div className="flex gap-3">
                <button onClick={()=>router.push("/dashboard")} className="flex-1 rounded-xl border border-white/10 py-3 text-white text-sm hover:bg-white/5 transition">Dashboard</button>
                <button onClick={()=>router.push("/dashboard/intake")} className="flex-1 rounded-xl bg-orange-500 py-3 text-white font-semibold text-sm hover:bg-orange-600 transition">New intake →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
