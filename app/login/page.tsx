"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";

const DEMO_ACCOUNTS = [
  { label: "Super Admin",    role: "Full platform",         email: "admin@autoflow.gh",        password: "admin1234",   color: "text-purple-600" },
  { label: "Owner (AGL)",    role: "Auto Ghana Limited",    email: "owner@autoghanaltd.gh",    password: "owner1234",   color: "text-red-600"    },
  { label: "Owner (HB)",     role: "Home Base",             email: "owner@homebase.gh",        password: "owner1234",   color: "text-red-600"    },
  { label: "Owner (ERICO)",  role: "ERICO AUTO",            email: "owner@erico.gh",           password: "owner1234",   color: "text-red-600"    },
  { label: "Manager (AGL)",  role: "Auto Ghana Limited",    email: "manager@autoghanaltd.gh",  password: "manager1234", color: "text-blue-600"   },
  { label: "Manager (HB)",   role: "Home Base",             email: "manager@homebase.gh",      password: "manager1234", color: "text-blue-600"   },
  { label: "Manager (ERICO)",role: "ERICO AUTO",            email: "manager@erico.gh",         password: "manager1234", color: "text-blue-600"   },
  { label: "Technician",     role: "Auto Ghana Limited",    email: "tech@autoghanaltd.gh",     password: "tech1234",    color: "text-amber-600"  },
  { label: "Cashier",        role: "Auto Ghana Limited",    email: "cashier@autoghanaltd.gh",  password: "cash1234",    color: "text-green-600"  },
  { label: "Parts Manager",  role: "Auto Ghana Limited",    email: "parts@autoghanaltd.gh",    password: "parts1234",   color: "text-violet-600" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router    = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    }
    setLoading(false);
  }

  function fillDemo(email: string, password: string) {
    setEmail(email); setPassword(password); setError("");
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#07070d] flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent" />
        <div className="relative z-10 text-center">
          <Image src="/autoflow-logo.jpg" alt="AutoFlow Ghana" width={120} height={120} className="mx-auto mb-8 rounded-2xl shadow-2xl" style={{filter:"drop-shadow(0 0 40px rgba(249,115,22,0.4))"}} />
          <h1 className="text-4xl font-bold text-white mb-4" style={{fontFamily:"'Bricolage Grotesque',sans-serif"}}>AutoFlow Ghana</h1>
          <p className="text-gray-400 text-lg max-w-sm">The complete workshop management platform for Ghana's automotive industry.</p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-left">
            {[["📋","Digital intake"],["🔧","Job tracking"],["📦","Inventory"],["🧾","Invoicing"],["👥","Team management"],["📈","Analytics"]].map(([icon,label])=>(
              <div key={label} className="flex items-center gap-2 text-gray-300 text-sm">
                <span>{icon}</span><span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 bg-white overflow-y-auto">
        <div className="max-w-md w-full mx-auto">
          <div className="lg:hidden flex justify-center mb-8">
            <Image src="/autoflow-logo.jpg" alt="AutoFlow Ghana" width={64} height={64} className="rounded-xl" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-sm text-gray-500 mb-8">Sign in to your AutoFlow account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email address</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required autoFocus
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                placeholder="you@workshop.gh" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition"
                placeholder="••••••••" />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-60"
              style={{background:"linear-gradient(135deg,#f97316,#3b82f6)"}}>
              {loading ? "Signing in…" : "Sign in →"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Demo accounts — click to fill</p>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {DEMO_ACCOUNTS.map(a => (
                <button key={a.email} onClick={() => fillDemo(a.email, a.password)}
                  className="w-full flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50 transition text-left">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${a.color}`}>{a.label}</span>
                    <span className="text-[10px] text-gray-400">{a.role}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">{a.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            <a href="/track" className="text-orange-500 hover:underline">Track your vehicle →</a>
          </p>
        </div>
      </div>
    </div>
  );
}
