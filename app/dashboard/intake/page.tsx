"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { workshopApi, userApi } from "@/lib/api";
import type { Workshop, User } from "@/lib/types";
import { Spinner, Card } from "@/components/ui";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DamageSpot { id: number; x: number; y: number; label: string; }
interface VehicleForm {
  plate: string; make: string; model: string; year: string;
  color: string; vin: string; odometer: string; fuelLevel: number;
  insurancePolicyNo: string; isAccidentCase: boolean;
}
interface CustomerForm { name: string; phone: string; email: string; isReturning: boolean; }
interface LookupResult {
  found: boolean;
  vehicle?: VehicleForm;
  customer?: { name: string; phone: string };
  history?: { totalVisits: number; lastVisit: string; lastWorkshop: string; lastMileage: number; totalSpend: number; };
}

const STEPS = [
  { id: "vehicle",     label: "Vehicle",      icon: "🚗" },
  { id: "customer",    label: "Customer",     icon: "👤" },
  { id: "condition",   label: "Condition",    icon: "🔍" },
  { id: "complaint",   label: "Complaint",    icon: "💬" },
  { id: "accessories", label: "Accessories",  icon: "📦" },
  { id: "photos",      label: "Photos",       icon: "📷" },
  { id: "signature",   label: "Sign off",     icon: "✍️" },
  { id: "assignment",  label: "Assignment",   icon: "👨‍🔧" },
];

const ACCESSORIES_LIST = [
  { id: "spare",       label: "Spare tyre",       icon: "🔄" },
  { id: "jack",        label: "Jack",             icon: "🔧" },
  { id: "radio",       label: "Radio",            icon: "📻" },
  { id: "docs",        label: "Documents",        icon: "📄" },
  { id: "toolkit",     label: "Tool kit",         icon: "🧰" },
  { id: "umbrella",    label: "Umbrella",         icon: "☂️" },
  { id: "extinguisher",label: "Extinguisher",     icon: "🔥" },
  { id: "warning",     label: "Warning triangle", icon: "⚠️" },
];

const PHOTO_POSITIONS = ["Front","Rear","Driver side","Passenger side","Dashboard","Engine bay"];
const PRIORITIES = ["LOW","NORMAL","HIGH","URGENT"];
const PRIORITY_STYLES: Record<string, string> = {
  LOW:    "border-green-200 bg-green-50 text-green-700",
  NORMAL: "border-blue-200 bg-blue-50 text-blue-700",
  HIGH:   "border-amber-200 bg-amber-50 text-amber-700",
  URGENT: "border-red-200 bg-red-50 text-red-700",
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function IntakePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [techs,     setTechs]     = useState<User[]>([]);
  const [advisors,  setAdvisors]  = useState<User[]>([]);
  const [lookup,    setLookup]    = useState<LookupResult | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const sigCanvas = useRef<HTMLCanvasElement>(null);
  const sigDrawing = useRef(false);
  const sigLast    = useRef({ x: 0, y: 0 });

  // ── Form state ──────────────────────────────────────────────────────────────
  const [workshopId, setWorkshopId] = useState("");
  const [vehicle, setVehicle] = useState<VehicleForm>({
    plate:"", make:"", model:"", year:"", color:"", vin:"",
    odometer:"", fuelLevel:5, insurancePolicyNo:"", isAccidentCase:false,
  });
  const [customer, setCustomer] = useState<CustomerForm>({ name:"", phone:"", email:"", isReturning:false });
  const [damageSpots, setDamageSpots] = useState<DamageSpot[]>([]);
  const [complaint,   setComplaint]   = useState("");
  const [priority,    setPriority]    = useState("NORMAL");
  const [accessories, setAccessories] = useState<Record<string, string>>({});
  const [photos,      setPhotos]      = useState<string[]>([]);
  const [hasSig,      setHasSig]      = useState(false);
  const [advisor,     setAdvisor]     = useState("");
  const [techId,      setTechId]      = useState("");
  const [eta,         setEta]         = useState("");
  const [towing,      setTowing]      = useState(false);
  const [towFrom,     setTowFrom]     = useState("");

  useEffect(() => {
    workshopApi.list().then(ws => { setWorkshops(ws); if (ws.length === 1) setWorkshopId(ws[0].id); });
    userApi.list({ role: "TECHNICIAN" }).then(setTechs).catch(() => {});
    userApi.list({ role: "MANAGER" }).then(setAdvisors).catch(() => {});
  }, []);

  // ── Plate lookup ────────────────────────────────────────────────────────────
  async function handleLookup() {
    if (vehicle.plate.length < 3) return;
    setLookingUp(true);
    try {
      const token = localStorage.getItem("sl_token");
      const res   = await fetch(`${API}/api/intake/lookup?plate=${encodeURIComponent(vehicle.plate)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: LookupResult = await res.json();
      setLookup(data);
      if (data.found && data.vehicle) {
        setVehicle(prev => ({ ...prev, ...data.vehicle }));
      }
      if (data.found && data.customer) {
        setCustomer(prev => ({ ...prev, ...data.customer, isReturning: true }));
      }
    } finally { setLookingUp(false); }
  }

  // ── Damage diagram click ────────────────────────────────────────────────────
  function handleDiagramClick(e: React.MouseEvent<SVGSVGElement>) {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const vb   = svg.viewBox.baseVal;
    const x    = Math.round(((e.clientX - rect.left) / rect.width)  * vb.width);
    const y    = Math.round(((e.clientY - rect.top)  / rect.height) * vb.height);
    const labels = ["Bonnet","Boot","Front-L","Front-R","Rear-L","Rear-R","Roof","Panel","Corner","Side"];
    const id   = damageSpots.length + 1;
    setDamageSpots(prev => [...prev, { id, x, y, label: labels[Math.min(id - 1, labels.length - 1)] }]);
  }

  // ── Signature canvas ────────────────────────────────────────────────────────
  const getSigPos = (e: MouseEvent | TouchEvent) => {
    const canvas = sigCanvas.current!;
    const rect   = canvas.getBoundingClientRect();
    const scX    = canvas.width  / rect.width;
    const scY    = canvas.height / rect.height;
    const src    = "touches" in e ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * scX, y: (src.clientY - rect.top) * scY };
  };

  useEffect(() => {
    const canvas = sigCanvas.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.strokeStyle = "#0f1117";
    ctx.lineWidth   = 2;
    ctx.lineCap     = "round";

    const start = (e: MouseEvent | TouchEvent) => {
      sigDrawing.current = true;
      const p = getSigPos(e);
      sigLast.current = p;
    };
    const draw = (e: MouseEvent | TouchEvent) => {
      if (!sigDrawing.current) return;
      e.preventDefault();
      const p = getSigPos(e);
      ctx.beginPath();
      ctx.moveTo(sigLast.current.x, sigLast.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      sigLast.current = p;
      setHasSig(true);
    };
    const stop = () => { sigDrawing.current = false; };

    canvas.addEventListener("mousedown",  start);
    canvas.addEventListener("mousemove",  draw);
    canvas.addEventListener("mouseup",    stop);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove",  draw,  { passive: false });
    canvas.addEventListener("touchend",   stop);
    return () => {
      canvas.removeEventListener("mousedown",  start);
      canvas.removeEventListener("mousemove",  draw);
      canvas.removeEventListener("mouseup",    stop);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove",  draw);
      canvas.removeEventListener("touchend",   stop);
    };
  }, [step]);

  function clearSig() {
    const canvas = sigCanvas.current;
    if (!canvas) return;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function submit() {
    if (!workshopId) { alert("Please select a workshop"); return; }
    if (!vehicle.plate) { alert("Plate number is required"); return; }
    if (!customer.name || !complaint) { alert("Customer name and complaint are required"); return; }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("sl_token");
      const sig   = sigCanvas.current?.toDataURL() || null;

      const res = await fetch(`${API}/api/intake`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          workshopId,
          plate:             vehicle.plate,
          make:              vehicle.make   || undefined,
          model:             vehicle.model  || undefined,
          year:              vehicle.year   || undefined,
          color:             vehicle.color  || undefined,
          vin:               vehicle.vin    || undefined,
          mileage:           Number(vehicle.odometer) || 0,
          fuelLevel:         vehicle.fuelLevel,
          customerName:      customer.name,
          customerPhone:     customer.phone || undefined,
          complaint,
          priority,
          damageSpots,
          accessories,
          photos,
          customerSignature: hasSig ? sig : null,
          serviceAdvisorId:  advisor  || undefined,
          technicianId:      techId   || undefined,
          expectedCompletion: eta     || undefined,
          towingRequired:    towing,
          towingFrom:        towFrom  || undefined,
          insurancePolicyNo: vehicle.insurancePolicyNo || undefined,
          isAccidentCase:    vehicle.isAccidentCase,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create job");
      router.push(`/dashboard/jobs/${data.id}`);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Submission failed");
    } finally { setSubmitting(false); }
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  function next() { setDone(d => new Set([...d, step])); setStep(s => Math.min(s + 1, STEPS.length - 1)); }
  function prev() { setStep(s => Math.max(s - 1, 0)); }

  const vSet = (k: keyof VehicleForm, v: any) => setVehicle(prev => ({ ...prev, [k]: v }));
  const cSet = (k: keyof CustomerForm, v: any) => setCustomer(prev => ({ ...prev, [k]: v }));

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="fade-up max-w-3xl">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Vehicle intake</h1>
          <p className="text-sm text-ink-subtle mt-0.5">Step {step + 1} of {STEPS.length} — {STEPS[step].label}</p>
        </div>
        <button onClick={() => router.back()} className="btn-ghost rounded-lg border border-ink-ghost px-3 py-1.5 text-xs text-ink-subtle">← Back</button>
      </div>

      {/* Step nav */}
      <div className="mb-6 flex gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <button key={s.id} onClick={() => setStep(i)}
            className={clsx("flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-all border",
              step === i ? "border-brand-400 bg-brand-50 text-brand-600" :
              done.has(i) ? "border-green-200 bg-green-50 text-green-700" :
                            "border-ink-ghost bg-white text-ink-subtle hover:bg-ink-paper"
            )}>
            <span>{done.has(i) && step !== i ? "✓" : s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Step content */}
      {step === 0 && <VehicleStep vehicle={vehicle} vSet={vSet} lookup={lookup} lookingUp={lookingUp} onLookup={handleLookup}
        workshops={workshops} workshopId={workshopId} setWorkshopId={setWorkshopId} customer={customer} />}

      {step === 1 && <CustomerStep customer={customer} cSet={cSet} lookup={lookup} />}

      {step === 2 && <ConditionStep damageSpots={damageSpots} setDamageSpots={setDamageSpots} onClick={handleDiagramClick} />}

      {step === 3 && <ComplaintStep complaint={complaint} setComplaint={setComplaint} priority={priority} setPriority={setPriority} />}

      {step === 4 && <AccessoriesStep accessories={accessories} setAccessories={setAccessories} />}

      {step === 5 && <PhotosStep photos={photos} setPhotos={setPhotos} />}

      {step === 6 && <SignatureStep sigCanvas={sigCanvas} hasSig={hasSig} onClear={clearSig} />}

      {step === 7 && (
        <AssignmentStep
          advisors={advisors} techs={techs}
          advisor={advisor} setAdvisor={setAdvisor}
          techId={techId} setTechId={setTechId}
          eta={eta} setEta={setEta}
          towing={towing} setTowing={setTowing}
          towFrom={towFrom} setTowFrom={setTowFrom}
          vehicle={vehicle} customer={customer} complaint={complaint}
          priority={priority} photos={photos} damageSpots={damageSpots} accessories={accessories}
        />
      )}

      {/* Nav buttons */}
      <div className="mt-5 flex justify-between">
        <button onClick={prev} disabled={step === 0}
          className="rounded-lg border border-ink-ghost px-4 py-2 text-sm text-ink-subtle hover:bg-ink-paper transition disabled:opacity-40">
          ← Previous
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={next} className="rounded-lg bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-800 transition">
            Next →
          </button>
        ) : (
          <button onClick={submit} disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-60">
            {submitting ? <><Spinner /> Creating job…</> : "✓ Create job card"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Step components ──────────────────────────────────────────────────────────

function VehicleStep({ vehicle, vSet, lookup, lookingUp, onLookup, workshops, workshopId, setWorkshopId, customer }: any) {
  return (
    <div className="space-y-4">
      {/* Workshop selector */}
      <Card className="p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">Workshop</p>
        <select className="input" value={workshopId} onChange={e => setWorkshopId(e.target.value)}>
          <option value="">Select workshop…</option>
          {workshops.map((w: Workshop) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </Card>

      {/* Plate lookup */}
      <Card className="p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">Plate / VIN lookup</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Plate number *</label>
            <div className="flex gap-2">
              <input className="input flex-1 uppercase" placeholder="GR-1234-21"
                value={vehicle.plate} onChange={e => vSet("plate", e.target.value.toUpperCase())} />
              <button onClick={onLookup} disabled={lookingUp}
                className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-800 transition disabled:opacity-60">
                {lookingUp ? <Spinner /> : "🔍 Lookup"}
              </button>
            </div>
          </div>
          <div>
            <label className="label">VIN / Chassis</label>
            <input className="input" placeholder="1HGBH41JXMN109186" value={vehicle.vin} onChange={e => vSet("vin", e.target.value)} />
          </div>
        </div>

        {/* Returning customer banner */}
        {lookup?.found && (
          <div className="mt-3 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3">
            <span className="text-lg mt-0.5">🔄</span>
            <div>
              <p className="text-sm font-semibold text-blue-800">Returning customer found</p>
              <p className="text-xs text-blue-700 mt-0.5">
                {lookup.history?.totalVisits} previous visits · Last: {lookup.history?.lastWorkshop} ·
                Total spend: GHS {lookup.history?.totalSpend.toLocaleString()}
              </p>
              <p className="text-xs text-blue-600 mt-0.5">Vehicle details and customer info pre-filled ↓</p>
            </div>
          </div>
        )}
        {lookup?.found === false && (
          <div className="mt-3 rounded-xl border border-ink-ghost bg-ink-paper p-3 text-xs text-ink-subtle">
            No previous record found for this plate — new customer
          </div>
        )}
      </Card>

      {/* Vehicle details */}
      <Card className="p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">Vehicle details</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["Make","make","Toyota"],["Model","model","Camry"],["Year","year","2019"],["Colour","color","Silver"]].map(([l,k,ph]) => (
            <div key={k}>
              <label className="label">{l}</label>
              <input className="input" placeholder={ph} value={(vehicle as any)[k]}
                onChange={e => vSet(k as any, e.target.value)} />
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Odometer (km) *</label>
            <input className="input" type="number" placeholder="87420" value={vehicle.odometer}
              onChange={e => vSet("odometer", e.target.value)} />
          </div>
          <div>
            <label className="label">Fuel level</label>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-sm">⛽</span>
              <div className="flex gap-1">
                {[1,2,3,4,5,6,7,8].map(n => (
                  <button key={n} onClick={() => vSet("fuelLevel", n)}
                    className={clsx("h-7 w-7 rounded border text-[10px] font-medium transition",
                      n <= vehicle.fuelLevel ? "border-green-300 bg-green-100 text-green-700" : "border-ink-ghost bg-white text-ink-faint")}>
                    {n === 1 ? "E" : n === 8 ? "F" : ""}
                  </button>
                ))}
              </div>
              <span className="text-xs text-ink-faint">{Math.round(vehicle.fuelLevel / 8 * 100)}%</span>
            </div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Insurance policy #</label>
            <input className="input" placeholder="GHA-2026-00123" value={vehicle.insurancePolicyNo}
              onChange={e => vSet("insurancePolicyNo", e.target.value)} />
          </div>
          <div className="flex items-center gap-3 mt-5">
            <input type="checkbox" id="accident" className="h-4 w-4" checked={vehicle.isAccidentCase}
              onChange={e => vSet("isAccidentCase", e.target.checked)} />
            <label htmlFor="accident" className="text-sm text-ink-subtle cursor-pointer">Accident / insurance case</label>
          </div>
        </div>
      </Card>
    </div>
  );
}

function CustomerStep({ customer, cSet, lookup }: any) {
  return (
    <Card className="p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">Customer information</p>
      <div className="mb-4 flex gap-2">
        {["New customer","Returning customer"].map((l,i) => (
          <button key={l} onClick={() => cSet("isReturning", i === 1)}
            className={clsx("rounded-lg border px-3 py-1.5 text-xs font-medium transition",
              customer.isReturning === (i === 1)
                ? "border-brand-400 bg-brand-50 text-brand-600"
                : "border-ink-ghost bg-white text-ink-subtle")}>
            {l}
          </button>
        ))}
      </div>

      {lookup?.found && customer.isReturning && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-xs text-green-700">
          ✓ Customer details loaded from previous visit
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Full name *</label>
          <input className="input" placeholder="Emmanuel Ofori" value={customer.name}
            onChange={e => cSet("name", e.target.value)} />
        </div>
        <div>
          <label className="label">Phone number *</label>
          <input className="input" type="tel" placeholder="+233 24 000 0000" value={customer.phone}
            onChange={e => cSet("phone", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Email address</label>
          <input className="input" type="email" placeholder="customer@email.com" value={customer.email}
            onChange={e => cSet("email", e.target.value)} />
        </div>
      </div>

      {/* Previous visits */}
      {lookup?.history?.recentJobs && (
        <div className="mt-4">
          <p className="text-xs font-medium text-ink-faint mb-2">Previous visits</p>
          <div className="space-y-1.5">
            {lookup.history.recentJobs.slice(0, 3).map((j: any) => (
              <div key={j.jobRef} className="flex justify-between rounded-lg border border-ink-ghost p-2.5 text-xs">
                <span className="font-mono text-brand-600">{j.jobRef}</span>
                <span className="text-ink-subtle truncate mx-3 flex-1">{j.complaint}</span>
                <span className="text-ink-faint">{new Date(j.date).toLocaleDateString("en-GH")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function ConditionStep({ damageSpots, setDamageSpots, onClick }: any) {
  return (
    <Card className="p-5">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">Damage diagram</p>
      <p className="mb-3 text-xs text-ink-subtle">Click on the vehicle outline to mark damage points</p>

      <div className="mx-auto max-w-sm">
        <svg viewBox="0 0 200 120" className="w-full cursor-crosshair rounded-xl border border-ink-ghost bg-ink-paper"
          onClick={onClick}>
          <rect width="200" height="120" fill="transparent" />
          {/* Car body */}
          <rect x="60" y="15" width="80" height="90" rx="12" fill="white" stroke="#d1d5db" strokeWidth="1.5"/>
          <rect x="70" y="22" width="60" height="25" rx="6" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1"/>
          <rect x="70" y="73" width="60" height="20" rx="4" fill="#f9fafb" stroke="#e5e7eb" strokeWidth="1"/>
          <ellipse cx="70"  cy="108" rx="10" ry="8" fill="#d1d5db"/>
          <ellipse cx="130" cy="108" rx="10" ry="8" fill="#d1d5db"/>
          <ellipse cx="70"  cy="12"  rx="10" ry="8" fill="#d1d5db"/>
          <ellipse cx="130" cy="12"  rx="10" ry="8" fill="#d1d5db"/>
          <text x="100" y="55" textAnchor="middle" fontSize="7" fill="#9ca3af">TOP VIEW</text>
          {/* Damage spots */}
          {damageSpots.map((s: DamageSpot) => (
            <g key={s.id}>
              <circle cx={s.x} cy={s.y} r="7" fill="#fee2e2" stroke="#fca5a5" strokeWidth="1.5" opacity="0.9"/>
              <text x={s.x} y={s.y + 3} textAnchor="middle" fontSize="7" fill="#dc2626" fontWeight="500">{s.id}</text>
            </g>
          ))}
        </svg>
      </div>

      {damageSpots.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {damageSpots.map((s: DamageSpot) => (
            <span key={s.id} className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs text-red-700">
              {s.id}: {s.label}
              <button onClick={() => setDamageSpots((prev: DamageSpot[]) => prev.filter(d => d.id !== s.id).map((d, i) => ({...d, id: i+1})))}
                className="ml-0.5 text-red-400 hover:text-red-600">×</button>
            </span>
          ))}
        </div>
      )}

      {damageSpots.length === 0 && (
        <p className="mt-3 text-center text-xs text-ink-faint">No damage marked — click the diagram to add points</p>
      )}
    </Card>
  );
}

function ComplaintStep({ complaint, setComplaint, priority, setPriority }: any) {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">Customer complaint</p>
        <label className="label">Describe the issue or service needed *</label>
        <textarea className="input min-h-[120px]" rows={5}
          placeholder="e.g. Engine makes a knocking noise at startup. Worse in cold mornings. Oil warning light came on twice last week…"
          value={complaint} onChange={e => setComplaint(e.target.value)} />
        <p className="mt-1 text-right text-[10px] text-ink-faint">{complaint.length} characters</p>
      </Card>
      <Card className="p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">Priority level</p>
        <div className="grid grid-cols-4 gap-2">
          {PRIORITIES.map(p => (
            <button key={p} onClick={() => setPriority(p)}
              className={clsx("rounded-xl border py-3 text-xs font-semibold transition",
                priority === p ? PRIORITY_STYLES[p] : "border-ink-ghost bg-white text-ink-subtle hover:bg-ink-paper")}>
              {p === "LOW" ? "🟢" : p === "NORMAL" ? "🔵" : p === "HIGH" ? "🟡" : "🔴"} {p}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AccessoriesStep({ accessories, setAccessories }: any) {
  function toggle(id: string) {
    const cur = accessories[id] || "none";
    const next = cur === "none" ? "present" : cur === "present" ? "missing" : "none";
    setAccessories((prev: any) => ({ ...prev, [id]: next }));
  }
  return (
    <Card className="p-5">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">Accessories checklist</p>
      <p className="mb-4 text-xs text-ink-subtle">Tap once = present ✓, twice = missing ✗, three times = clear</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ACCESSORIES_LIST.map(a => {
          const st = accessories[a.id] || "none";
          return (
            <button key={a.id} onClick={() => toggle(a.id)}
              className={clsx("flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition",
                st === "present" ? "border-green-200 bg-green-50 text-green-700" :
                st === "missing" ? "border-red-200 bg-red-50 text-red-600" :
                                   "border-ink-ghost bg-white text-ink-subtle hover:bg-ink-paper")}>
              <span className="text-xl">{a.icon}</span>
              <span>{a.label}</span>
              <span className="text-lg">{st === "present" ? "✓" : st === "missing" ? "✗" : "—"}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex gap-4 text-xs text-ink-faint">
        <span>✓ Present: {Object.values(accessories).filter(v => v === "present").length}</span>
        <span>✗ Missing: {Object.values(accessories).filter(v => v === "missing").length}</span>
      </div>
    </Card>
  );
}

function PhotosStep({ photos, setPhotos }: any) {
  function toggle(pos: string) {
    setPhotos((prev: string[]) => prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]);
  }
  return (
    <Card className="p-5">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">Vehicle photos</p>
      <p className="mb-4 text-xs text-ink-subtle">Tap each position to mark as captured. Upload from your device below.</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PHOTO_POSITIONS.map(pos => (
          <button key={pos} onClick={() => toggle(pos)}
            className={clsx("flex flex-col items-center gap-2 rounded-xl border p-4 text-xs font-medium transition",
              photos.includes(pos)
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-dashed border-ink-ghost bg-white text-ink-subtle hover:bg-ink-paper")}>
            <span className="text-2xl">{photos.includes(pos) ? "✅" : "📷"}</span>
            <span>{pos}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-dashed border-ink-ghost p-5 text-center">
        <span className="text-2xl">📁</span>
        <p className="mt-2 text-sm font-medium text-ink-subtle">Upload additional photos or video</p>
        <p className="text-xs text-ink-faint mt-1">JPG, PNG, MP4 — max 50MB each</p>
        <p className="mt-3 text-xs text-ink-faint">(File upload integration — connect to cloud storage)</p>
      </div>
      <p className="mt-3 text-xs text-ink-faint">{photos.length} of {PHOTO_POSITIONS.length} standard positions captured</p>
    </Card>
  );
}

function SignatureStep({ sigCanvas, hasSig, onClear }: any) {
  return (
    <Card className="p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">Customer sign-off</p>
      <div className="mb-4 rounded-xl bg-ink-paper p-3 text-xs text-ink-subtle leading-relaxed">
        I confirm that the vehicle details, condition, and complaint described above are accurate.
        I authorise the workshop to inspect and provide an estimate for the work required.
        I understand that no repair work will begin without my approval of the estimate.
      </div>
      <label className="label">Customer signature</label>
      <canvas ref={sigCanvas} width={600} height={140}
        className="w-full cursor-crosshair rounded-xl border border-ink-ghost bg-white touch-none" />
      <div className="mt-2 flex items-center gap-3">
        <button onClick={onClear} className="rounded-lg border border-ink-ghost px-3 py-1.5 text-xs text-ink-subtle hover:bg-ink-paper">
          Clear
        </button>
        {hasSig && <span className="text-xs text-green-600 font-medium">✓ Signed</span>}
        {!hasSig && <span className="text-xs text-ink-faint">Draw signature above</span>}
      </div>
    </Card>
  );
}

function AssignmentStep({ advisors, techs, advisor, setAdvisor, techId, setTechId, eta, setEta,
  towing, setTowing, towFrom, setTowFrom, vehicle, customer, complaint, priority, photos, damageSpots, accessories }: any) {
  return (
    <div className="space-y-4">
      <Card className="p-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">Service assignment</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Service advisor</label>
            <select className="input" value={advisor} onChange={e => setAdvisor(e.target.value)}>
              <option value="">Select advisor…</option>
              {advisors.map((a: User) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Assign technician (optional)</label>
            <select className="input" value={techId} onChange={e => setTechId(e.target.value)}>
              <option value="">Assign later</option>
              {techs.map((t: User) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Expected completion</label>
            <input className="input" type="datetime-local" value={eta} onChange={e => setEta(e.target.value)} />
          </div>
        </div>
        <div className="mt-3">
          <label className="label">Towing required?</label>
          <div className="mt-1.5 flex gap-2">
            {[true, false].map(v => (
              <button key={String(v)} onClick={() => setTowing(v)}
                className={clsx("rounded-lg border px-4 py-2 text-xs font-medium transition",
                  towing === v ? "border-brand-400 bg-brand-50 text-brand-600" : "border-ink-ghost bg-white text-ink-subtle")}>
                {v ? "Yes" : "No"}
              </button>
            ))}
          </div>
          {towing && (
            <div className="mt-2">
              <label className="label">Tow from location</label>
              <input className="input" placeholder="Address or landmark" value={towFrom} onChange={e => setTowFrom(e.target.value)} />
            </div>
          )}
        </div>
      </Card>

      {/* Summary */}
      <Card className="p-5 border-green-200 bg-green-50">
        <p className="mb-3 text-sm font-semibold text-green-800">📋 Intake summary</p>
        <div className="space-y-1.5 text-xs">
          {[
            ["Vehicle", `${vehicle.make} ${vehicle.model} ${vehicle.year} — ${vehicle.plate}`],
            ["Customer", customer.name],
            ["Odometer", vehicle.odometer ? `${Number(vehicle.odometer).toLocaleString()} km` : "—"],
            ["Fuel", `${Math.round(vehicle.fuelLevel / 8 * 100)}%`],
            ["Priority", priority],
            ["Damage spots", `${damageSpots.length} marked`],
            ["Photos", `${photos.length} captured`],
            ["Accessories", `${Object.values(accessories).filter(v => v === "present").length} present`],
            ["Towing", towing ? "Required" : "Not required"],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between border-b border-green-200 py-1 last:border-0">
              <span className="text-green-700">{l}</span>
              <span className="font-medium text-green-800">{v}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
