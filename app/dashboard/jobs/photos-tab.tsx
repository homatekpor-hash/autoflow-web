// This is the photos tab component to add to the job detail page
// Usage: import PhotosTab from "./photos-tab"
"use client";
import { useEffect, useState, useRef } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");
const af = (url: string, opts: RequestInit = {}) =>
  fetch(`${API}${url}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok()}`, ...(opts.headers||{}) } });

export default function PhotosTab({ jobId, canEdit }: { jobId: string; canEdit: boolean }) {
  const [photos,   setPhotos]   = useState<any[]>([]);
  const [uploading,setUploading]= useState(false);
  const [type,     setType]     = useState("BEFORE");
  const [caption,  setCaption]  = useState("");
  const [preview,  setPreview]  = useState<string|null>(null);
  const [selected, setSelected] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const res = await af(`/api/jobs/${jobId}/photos`);
    if (res.ok) setPhotos(await res.json());
  }

  useEffect(() => { load(); }, [jobId]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function upload() {
    if (!preview) return;
    setUploading(true);
    await af(`/api/jobs/${jobId}/photos`, { method:"POST", body: JSON.stringify({ url: preview, type, caption }) });
    setPreview(null); setCaption(""); if(fileRef.current) fileRef.current.value="";
    await load();
    setUploading(false);
  }

  const before = photos.filter(p=>p.type==="BEFORE");
  const after  = photos.filter(p=>p.type==="AFTER");
  const other  = photos.filter(p=>!["BEFORE","AFTER"].includes(p.type));

  return (
    <div className="space-y-5">
      {canEdit && (
        <div className="rounded-xl border border-ink-ghost bg-white p-5">
          <p className="text-sm font-semibold text-ink mb-4">Upload photo</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="label">Photo type</label>
              <select className="input" value={type} onChange={e=>setType(e.target.value)}>
                <option value="BEFORE">Before repair</option>
                <option value="AFTER">After repair</option>
                <option value="DAMAGE">Damage</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Caption (optional)</label>
              <input className="input" value={caption} onChange={e=>setCaption(e.target.value)} placeholder="e.g. Front bumper damage" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="mb-3 text-sm text-ink-subtle" />
          {preview && (
            <div className="mb-3">
              <img src={preview} alt="Preview" className="w-full max-h-48 object-cover rounded-xl border border-ink-ghost" />
            </div>
          )}
          <button onClick={upload} disabled={!preview||uploading}
            className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition">
            {uploading?"Uploading…":"Upload photo"}
          </button>
        </div>
      )}

      {[["Before", before], ["After", after], ["Other", other]].map(([label, list]: any) => list.length > 0 && (
        <div key={String(label)}>
          <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-2">{label} ({list.length})</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {list.map((p:any) => (
              <div key={p.id} className="relative group cursor-pointer" onClick={()=>setSelected(p)}>
                <img src={p.url} alt={p.caption||""} className="w-full h-32 object-cover rounded-xl border border-ink-ghost group-hover:opacity-90 transition" />
                {p.caption && <p className="text-xs text-ink-faint mt-1 truncate">{p.caption}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}

      {photos.length===0 && !canEdit && <div className="text-center py-10 text-ink-faint text-sm">No photos yet</div>}

      {/* Lightbox */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={()=>setSelected(null)}>
          <img src={selected.url} alt={selected.caption||""} className="max-w-full max-h-full rounded-xl" onClick={e=>e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
