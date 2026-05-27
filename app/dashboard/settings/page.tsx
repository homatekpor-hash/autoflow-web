"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Card, Spinner } from "@/components/ui";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");
const af = (url: string, opts: RequestInit = {}) =>
  fetch(`${API}${url}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok()}`, ...(opts.headers||{}) } });

export default function SettingsPage() {
  const { user } = useAuth();
  const [workshop,  setWorkshop]  = useState<any>(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [logo,      setLogo]      = useState<string|null>(null);
  const [logoPreview,setLogoPreview]=useState<string|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    af("/api/workshops").then(r=>r.ok?r.json():null).then(ws => {
      const list = Array.isArray(ws)?ws:[];
      if (list.length > 0) { setWorkshop(list[0]); setLogo(list[0].logo||null); }
      setLoading(false);
    });
  }, []);

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setLogoPreview(reader.result as string); };
    reader.readAsDataURL(file);
  }

  async function save() {
    if (!workshop) return;
    setSaving(true);
    const data: any = {
      name:     workshop.name,
      location: workshop.location,
      phone:    workshop.phone,
    };
    await af(`/api/workshops/${workshop.id}`, { method:"PUT", body: JSON.stringify(data) });
    setSaving(false); setSaved(true);
    setTimeout(()=>setSaved(false), 3000);
  }

  const f = (k: string, v: string) => setWorkshop((prev:any)=>({...prev,[k]:v}));

  if (loading) return <div className="flex justify-center py-20"><Spinner className="h-6 w-6"/></div>;
  if (!workshop) return <div className="text-center py-20 text-ink-faint">No workshop found.</div>;

  return (
    <div className="fade-up max-w-2xl">
      <PageHeader title="Workshop Settings" subtitle="Update your workshop details and branding" />

      {/* Logo */}
      <Card className="p-5 mb-4">
        <p className="text-sm font-semibold text-ink mb-4">Workshop logo</p>
        <div className="flex items-center gap-5">
          <div className="h-20 w-20 rounded-xl border-2 border-ink-ghost flex items-center justify-center overflow-hidden bg-ink-paper flex-shrink-0">
            {(logoPreview||logo) ? (
              <img src={logoPreview||logo||""} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl">🏭</span>
            )}
          </div>
          <div>
            <label className="cursor-pointer rounded-xl border border-ink-ghost px-4 py-2.5 text-sm font-medium text-ink-subtle hover:bg-ink-paper transition block w-fit">
              📁 Upload logo
              <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoFile} className="hidden" />
            </label>
            <p className="text-xs text-ink-faint mt-1.5">JPG, PNG — recommended 256×256px</p>
            {logoPreview && <p className="text-xs text-green-600 mt-1">✓ New logo selected — save to apply</p>}
          </div>
        </div>
      </Card>

      {/* Details */}
      <Card className="p-5 mb-4">
        <p className="text-sm font-semibold text-ink mb-4">Workshop details</p>
        <div className="space-y-4">
          {[
            ["name",     "Workshop name *", "e.g. Home Base Auto"],
            ["location", "Location *",      "e.g. Spintex, Accra"],
            ["phone",    "Phone number",    "e.g. +233 30 000 0000"],
          ].map(([k,l,ph])=>(
            <div key={k}>
              <label className="label">{l}</label>
              <input className="input" value={(workshop as any)[k]||""} onChange={e=>f(k,e.target.value)} placeholder={ph} />
            </div>
          ))}
        </div>
      </Card>

      {/* QR token */}
      <Card className="p-5 mb-4 border-blue-100 bg-blue-50">
        <p className="text-sm font-semibold text-blue-700 mb-1">Customer QR check-in link</p>
        <p className="text-xs text-blue-600 font-mono break-all">
          https://autoflow-web-five.vercel.app/checkin/{workshop.qrToken}
        </p>
        <p className="text-xs text-blue-500 mt-1">Share this link or QR code with customers to self check-in their vehicles.</p>
      </Card>

      <div className="flex gap-3">
        <button onClick={save} disabled={saving}
          className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition">
          {saving?"Saving…":"Save changes"}
        </button>
        {saved && <p className="flex items-center text-sm text-green-600 font-medium">✅ Saved!</p>}
      </div>
    </div>
  );
}
