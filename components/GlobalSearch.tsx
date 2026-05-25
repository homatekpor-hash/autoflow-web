"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");

export default function GlobalSearch() {
  const router = useRouter();
  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<any>({ jobs:[], vehicles:[], parts:[] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setOpen(true); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults({ jobs:[], vehicles:[], parts:[] }); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      const headers = { Authorization: `Bearer ${tok()}` };
      const [jobs, vehicles, parts] = await Promise.all([
        fetch(`${API}/api/jobs?search=${query}`, { headers }).then(r=>r.ok?r.json():[]),
        fetch(`${API}/api/vehicles`, { headers }).then(r=>r.ok?r.json():[]),
        fetch(`${API}/api/inventory/parts`, { headers }).then(r=>r.ok?r.json():[]),
      ]);
      setResults({
        jobs: (Array.isArray(jobs)?jobs:[]).filter((j:any)=>
          j.jobRef?.toLowerCase().includes(query.toLowerCase())||
          j.customerName?.toLowerCase().includes(query.toLowerCase())||
          j.vehicle?.plate?.toLowerCase().includes(query.toLowerCase())
        ).slice(0,5),
        vehicles: (Array.isArray(vehicles)?vehicles:[]).filter((v:any)=>
          v.plate?.toLowerCase().includes(query.toLowerCase())||
          v.make?.toLowerCase().includes(query.toLowerCase())||
          v.model?.toLowerCase().includes(query.toLowerCase())
        ).slice(0,3),
        parts: (Array.isArray(parts)?parts:[]).filter((p:any)=>
          p.name?.toLowerCase().includes(query.toLowerCase())||
          p.sku?.toLowerCase().includes(query.toLowerCase())
        ).slice(0,3),
      });
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function go(href: string) { router.push(href); setOpen(false); setQuery(""); }

  const total = results.jobs.length + results.vehicles.length + results.parts.length;

  if (!open) return (
    <button onClick={()=>setOpen(true)} className="flex items-center gap-2 rounded-xl border border-ink-ghost bg-ink-paper px-3 py-2 text-sm text-ink-faint hover:border-orange-300 hover:text-ink transition">
      <span>🔍</span><span className="hidden sm:block">Search…</span>
      <kbd className="hidden sm:block rounded border border-ink-ghost px-1.5 text-[10px] font-mono">⌘K</kbd>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4" onClick={()=>setOpen(false)}>
      <div className="w-full max-w-xl rounded-2xl border border-ink-ghost bg-white shadow-2xl overflow-hidden" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-ink-ghost">
          <span className="text-ink-faint">🔍</span>
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)}
            placeholder="Search jobs, vehicles, parts…" className="flex-1 outline-none text-sm text-ink" />
          {loading && <span className="text-xs text-ink-faint">Searching…</span>}
          <kbd onClick={()=>setOpen(false)} className="cursor-pointer rounded border border-ink-ghost px-1.5 text-[10px] font-mono text-ink-faint">ESC</kbd>
        </div>

        {query && (
          <div className="max-h-96 overflow-y-auto">
            {total === 0 && !loading && <div className="p-8 text-center text-sm text-ink-faint">No results for "{query}"</div>}

            {results.jobs.length > 0 && (
              <div>
                <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-ink-faint bg-ink-paper">Jobs</p>
                {results.jobs.map((j:any)=>(
                  <button key={j.id} onClick={()=>go(`/dashboard/jobs/${j.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-ink-paper transition text-left border-b border-ink-ghost last:border-0">
                    <span className="font-mono text-xs text-orange-500">{j.jobRef}</span>
                    <div className="flex-1">
                      <p className="text-sm text-ink">{j.vehicle?.make} {j.vehicle?.model} · {j.vehicle?.plate}</p>
                      <p className="text-xs text-ink-faint">{j.customerName}</p>
                    </div>
                    <span className="text-xs text-ink-subtle">{j.status?.replace(/_/g," ")}</span>
                  </button>
                ))}
              </div>
            )}

            {results.vehicles.length > 0 && (
              <div>
                <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-ink-faint bg-ink-paper">Vehicles</p>
                {results.vehicles.map((v:any)=>(
                  <button key={v.id} onClick={()=>go(`/dashboard/vehicles`)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-ink-paper transition text-left border-b border-ink-ghost last:border-0">
                    <span className="text-lg">🚗</span>
                    <div>
                      <p className="text-sm text-ink">{v.make} {v.model} · {v.plate}</p>
                      <p className="text-xs text-ink-faint">{v.ownerName||"No owner"}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {results.parts.length > 0 && (
              <div>
                <p className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-ink-faint bg-ink-paper">Parts</p>
                {results.parts.map((p:any)=>(
                  <button key={p.id} onClick={()=>go(`/dashboard/inventory`)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-ink-paper transition text-left border-b border-ink-ghost last:border-0">
                    <span className="text-lg">📦</span>
                    <div>
                      <p className="text-sm text-ink">{p.name}</p>
                      <p className="text-xs text-ink-faint">{p.sku} · Stock: {p.qty}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!query && (
          <div className="p-4 text-center text-sm text-ink-faint">
            Type to search jobs, vehicles or parts
          </div>
        )}
      </div>
    </div>
  );
}
