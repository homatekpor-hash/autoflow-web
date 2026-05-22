"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

const DEMO_ACCOUNTS = [
  { role: "Super Admin",      email: "admin@autoflow.gh",          password: "admin1234",   desc: "Full platform",                    color: "text-purple-600" },
  { role: "Owner",            email: "owner@autoflow.gh",          password: "owner1234",   desc: "All 3 workshops",                  color: "text-red-600" },
  { role: "Manager (AGL)",    email: "manager.agl@autoflow.gh",    password: "manager1234", desc: "Auto Ghana Limited",               color: "text-blue-600" },
  { role: "Manager (HB)",     email: "manager.hb@autoflow.gh",     password: "manager1234", desc: "Home Base",                        color: "text-blue-600" },
  { role: "Manager (ERICO)",  email: "manager.erico@autoflow.gh",  password: "manager1234", desc: "ERICO AUTO MECHANICALS",           color: "text-blue-600" },
  { role: "Service Advisor",  email: "advisor.agl@autoflow.gh",    password: "advisor1234", desc: "Auto Ghana Limited",               color: "text-cyan-600" },
  { role: "Technician",       email: "tech1.agl@autoflow.gh",      password: "tech1234",    desc: "Assigned jobs only",               color: "text-amber-600" },
  { role: "Cashier",          email: "cashier.agl@autoflow.gh",    password: "cash1234",    desc: "Invoices & payments",              color: "text-green-600" },
  { role: "Parts Manager",    email: "parts.agl@autoflow.gh",      password: "parts1234",   desc: "Inventory only",                   color: "text-violet-600" },
];

export default function LoginPage() {
  const { login }  = useAuth();
  const router     = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center bg-gray-950 relative overflow-hidden px-12">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/svg%3E")` }} />
        <div className="relative z-10 text-center w-full max-w-sm">
          <Image src="/autoflow-logo.jpg" alt="AutoFlow Ghana" width={260} height={95} className="object-contain mx-auto mb-6" />
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            The complete workshop management platform built for Ghana's automotive industry.
          </p>
          <div className="grid grid-cols-2 gap-3 text-left">
            {[["🔧","Job management","Full pipeline from intake to delivery"],
              ["📦","Parts inventory","Real-time stock with auto-reorder"],
              ["⭐","Customer delight","Photos, surveys & referral rewards"],
              ["📶","Works offline","Keeps running without internet"]].map(([icon, title, desc]) => (
              <div key={String(title)} className="rounded-xl border border-gray-800 bg-gray-900 p-3">
                <p className="text-lg mb-1">{icon}</p>
                <p className="text-white text-xs font-medium">{title}</p>
                <p className="text-gray-500 text-[10px] mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — login ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 overflow-y-auto py-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex justify-center mb-6">
            <Image src="/autoflow-logo.jpg" alt="AutoFlow Ghana" width={180} height={65} className="object-contain" />
          </div>

          <h1 className="text-2xl font-semibold text-ink mb-1">Welcome back</h1>
          <p className="text-sm text-ink-subtle mb-6">Sign in to your AutoFlow account</p>

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label className="label">Email address</label>
              <input className="input" type="email" placeholder="you@autoflow.gh"
                value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}
            <button type="submit" disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #f97316, #2563eb)" }}>
              {loading ? "Signing in…" : "Sign in →"}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="rounded-2xl border border-ink-ghost bg-ink-paper p-4">
            <p className="text-[11px] font-semibold text-ink-subtle mb-3 uppercase tracking-wide">Demo accounts — click to fill</p>
            <div className="space-y-1">
              {DEMO_ACCOUNTS.map(a => (
                <button key={a.email} onClick={() => { setEmail(a.email); setPassword(a.password); }}
                  className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white transition">
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs font-semibold ${a.color}`}>{a.role}</span>
                    <span className="ml-2 text-[10px] text-ink-faint">{a.desc}</span>
                  </div>
                  <span className="text-[10px] font-mono text-ink-faint truncate">{a.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-5 text-center text-[11px] text-ink-faint">
            AutoFlow Ghana © {new Date().getFullYear()} · Streamline Your Garage
          </p>
        </div>
      </div>
    </div>
  );
}
