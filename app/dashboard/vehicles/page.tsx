"use client";
import { useEffect, useState } from "react";
import { PageHeader, Card, Spinner } from "@/components/ui";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");
const af = (url: string) => fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${tok()}` } }).then(r => r.ok ? r.json() : []);

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [history,  setHistory]  = useState<any[]>([]);

  useEffect(() => {
    af("/api/vehicles").then(d => { setVehicles(Array.isArray(d)?d:[]); setLoading(false); });
  }, []);

  async function loadHistory(vehicle: any) {
    setSelected(vehicle);
    const jobs = await af(`/api/jobs?plate=${vehicle.plate}`);
    setHistory(Array.isArray(jobs) ? jobs : []);
  }

  const filtered = vehicles.filter(v =>
    v.plate?.toLowerCase().includes(search.toLowerCase()) ||
    v.make?.toLowerCase().includes(search.toLowerCase()) ||
    v.model?.toLowerCase().includes(search.toLowerCase()) ||
    v.ownerName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fade-up">
      <PageHeader title="Vehicles" subtitle={`${vehicles.length} vehicles in database`} />
      <input className="input mb-5" placeholder="Search by plate, make, model or owner…" value={search} onChange={e=>setSearch(e.target.value)} />

      {loading ? <div className="flex justify-center py-20"><Spinner className="h-6 w-6"/></div> : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <Card className="p-0 overflow-hidden">
              <div className="grid grid-cols-[90px_1fr_80px_60px] gap-2 bg-ink-paper px-4 py-2.5 text-[10px] font-semibold text-ink-faint uppercase tracking-wide">
                <span>Plate</span><span>Vehicle</span><span>Owner</span><span>Jobs</span>
              </div>
              {filtered.map(v => (
                <button key={v.id} onClick={() => loadHistory(v)}
                  className={`w-full grid grid-cols-[90px_1fr_80px_60px] gap-2 border-t border-ink-ghost px-4 py-3 items-center text-left hover:bg-ink-paper transition ${selected?.id===v.id?"bg-orange-50":""}`}>
                  <span className="font-mono text-xs font-semibold text-orange-500">{v.plate}</span>
                  <div>
                    <p className="text-sm font-medium text-ink">{v.make} {v.model}</p>
                    <p className="text-xs text-ink-faint">{v.year||"—"} · {v.color||"—"}</p>
                  </div>
                  <span className="text-xs text-ink-subtle truncate">{v.ownerName||"—"}</span>
                  <span className="text-xs font-semibold text-ink">{v._count?.jobs||0}</span>
                </button>
              ))}
              {filtered.length===0 && <div className="py-12 text-center text-ink-faint text-sm">No vehicles found</div>}
            </Card>
          </div>

          {selected && (
            <div>
              <Card className="p-5 mb-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-orange-50 flex items-center justify-center text-2xl flex-shrink-0">🚗</div>
                  <div>
                    <p className="font-bold text-ink text-lg">{selected.plate}</p>
                    <p className="text-sm text-ink-subtle">{selected.make} {selected.model} {selected.year}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[["Owner",selected.ownerName||"—"],["Phone",selected.ownerPhone||"—"],["Color",selected.color||"—"],["Total services",history.length]].map(([l,v])=>(
                    <div key={String(l)} className="rounded-lg bg-ink-paper p-2.5">
                      <p className="text-[10px] text-ink-faint">{l}</p>
                      <p className="text-sm font-medium text-ink">{v}</p>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-0 overflow-hidden">
                <div className="px-4 py-2.5 bg-ink-paper text-[10px] font-semibold text-ink-faint uppercase tracking-wide">Service history</div>
                {history.length===0 ? <div className="py-8 text-center text-xs text-ink-faint">No service history</div> :
                  history.map((j:any)=>(
                    <div key={j.id} className="flex items-center gap-3 px-4 py-3 border-t border-ink-ghost">
                      <span className="font-mono text-xs text-orange-500">{j.jobRef}</span>
                      <div className="flex-1">
                        <p className="text-sm text-ink">{j.complaint?.slice(0,50)}{j.complaint?.length>50?"…":""}</p>
                        <p className="text-xs text-ink-faint">{new Date(j.createdAt).toLocaleDateString("en-GH")}</p>
                      </div>
                      <span className="text-xs rounded-md bg-ink-paper px-2 py-0.5 text-ink-subtle">{j.status?.replace(/_/g," ")}</span>
                    </div>
                  ))}
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
