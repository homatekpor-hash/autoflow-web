"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, Spinner, Btn } from "@/components/ui";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const CURRENCIES = [
  { code: "GHS", symbol: "₵", rate: 1 },
  { code: "USD", symbol: "$", rate: 0.065 },
  { code: "EUR", symbol: "€", rate: 0.060 },
  { code: "GBP", symbol: "£", rate: 0.051 },
];

const VAT_RATES = [
  { label: "Ghana VAT 12.5%", rate: 0.125 },
  { label: "Exempt (0%)",     rate: 0 },
  { label: "NHIL 2.5%",       rate: 0.025 },
];

const CHANNELS = [
  { id: "sms",       icon: "📱", label: "SMS" },
  { id: "whatsapp",  icon: "💬", label: "WhatsApp" },
  { id: "email",     icon: "📧", label: "Email" },
  { id: "link",      icon: "🔗", label: "In-app link" },
];

interface LineItem {
  id?: string;
  type: "LABOUR" | "PARTS";
  description: string;
  quantity: number;
  rate: number;
  total?: number;
  approved?: boolean;
}

function authFetch(url: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("sl_token");
  return fetch(url, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
}

function calcTotals(items: LineItem[], taxRate: number, discountType: string, discountValue: number) {
  const subtotal    = items.reduce((s, i) => s + i.quantity * i.rate, 0);
  const discountAmt = discountType === "pct" ? subtotal * (discountValue / 100) : discountValue;
  const afterDiscount = Math.max(0, subtotal - discountAmt);
  const tax   = Math.round(afterDiscount * taxRate * 100) / 100;
  const total = Math.round((afterDiscount + tax) * 100) / 100;
  return { subtotal, discountAmt, afterDiscount, tax, total };
}

export default function EstimateBuilderPage({ params }: { params: { jobId: string } }) {
  const router = useRouter();
  const [tab,           setTab]           = useState("builder");
  const [job,           setJob]           = useState<any>(null);
  const [estimate,      setEstimate]      = useState<any>(null);
  const [items,         setItems]         = useState<LineItem[]>([]);
  const [templates,     setTemplates]     = useState<any[]>([]);
  const [history,       setHistory]       = useState<any>(null);
  const [currency,      setCurrency]      = useState("GHS");
  const [taxRate,       setTaxRate]       = useState(0.125);
  const [discountType,  setDiscountType]  = useState("pct");
  const [discountValue, setDiscountValue] = useState(0);
  const [insuranceMode, setInsuranceMode] = useState(false);
  const [channels,      setChannels]      = useState<Record<string, boolean>>({ whatsapp: true, link: true });
  const [newItem,       setNewItem]       = useState<Partial<LineItem>>({ type: "LABOUR", quantity: 1 });
  const [saving,        setSaving]        = useState(false);
  const [sending,       setSending]       = useState(false);
  const [sent,          setSent]          = useState(false);

  const cur = CURRENCIES.find(c => c.code === currency)!;
  const fmtC = (ghsAmt: number) => cur.symbol + (ghsAmt * cur.rate).toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const T = calcTotals(items, taxRate, discountType, discountValue);

  useEffect(() => {
    // Load job
    authFetch(`${API}/api/jobs/${params.jobId}`)
      .then(r => r.json()).then(setJob);

    // Try to load existing estimate
    authFetch(`${API}/api/estimates/job/${params.jobId}`)
      .then(r => r.ok ? r.json() : null)
      .then(est => {
        if (est) {
          setEstimate(est);
          setItems(est.items.map((i: any) => ({ ...i, approved: true })));
          setCurrency(est.currency || "GHS");
          setTaxRate(est.taxRate || 0.125);
          setDiscountType(est.discountType || "pct");
          setDiscountValue(est.discountValue || 0);
        }
      });

    // Load templates
    authFetch(`${API}/api/estimates/templates`).then(r => r.json()).then(setTemplates).catch(() => {});

    // Load history
    authFetch(`${API}/api/estimates/history`).then(r => r.json()).then(setHistory).catch(() => {});
  }, [params.jobId]);

  async function save() {
    setSaving(true);
    try {
      const body = { items, taxRate, discountType, discountValue, currency, partialApproval: insuranceMode };
      if (estimate) {
        const res = await authFetch(`${API}/api/estimates/${estimate.id}`, { method: "PUT", body: JSON.stringify(body) });
        setEstimate(await res.json());
      } else {
        const res = await authFetch(`${API}/api/estimates/job/${params.jobId}`, { method: "POST", body: JSON.stringify(body) });
        const est = await res.json();
        setEstimate(est);
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Save failed");
    } finally { setSaving(false); }
  }

  async function sendEstimate() {
    if (!estimate) { await save(); }
    setSending(true);
    try {
      const activeChannels = Object.entries(channels).filter(([,v]) => v).map(([k]) => k);
      await authFetch(`${API}/api/estimates/${estimate.id}/send`, { method: "POST", body: JSON.stringify({ channels: activeChannels }) });
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } finally { setSending(false); }
  }

  function applyTemplate(tpl: any) {
    const newItems: LineItem[] = tpl.items.map((i: any) => ({ ...i, approved: false }));
    setItems(prev => [...prev, ...newItems]);
  }

  function addItem() {
    if (!newItem.description || !newItem.rate) return;
    setItems(prev => [...prev, {
      type: newItem.type as "LABOUR" | "PARTS",
      description: newItem.description!,
      quantity: newItem.quantity || 1,
      rate: Number(newItem.rate),
      approved: false,
    }]);
    setNewItem({ type: "LABOUR", quantity: 1 });
  }

  function removeItem(i: number) { setItems(prev => prev.filter((_, idx) => idx !== i)); }
  function toggleApproved(i: number) { setItems(prev => prev.map((item, idx) => idx === i ? { ...item, approved: !item.approved } : item)); }

  const TABS = [
    { id: "builder",  label: "Builder" },
    { id: "history",  label: "Cost history" },
    { id: "versions", label: `Versions${estimate ? ` (${estimate.currentVersion || 1})` : ""}` },
    { id: "approval", label: "Send for approval" },
    { id: "partial",  label: "Partial approval" },
  ];

  return (
    <div className="fade-up max-w-4xl">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Estimate builder</h1>
          {job && <p className="text-sm text-ink-subtle mt-0.5">{job.jobRef} · {job.vehicle?.make} {job.vehicle?.model} · {job.customerName}</p>}
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs text-ink-subtle cursor-pointer">
            <input type="checkbox" checked={insuranceMode} onChange={e => setInsuranceMode(e.target.checked)} className="h-3.5 w-3.5" />
            Insurance format
          </label>
          <select className="input w-20 text-xs" value={currency} onChange={e => setCurrency(e.target.value)}>
            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
          </select>
          <button onClick={() => router.back()} className="rounded-lg border border-ink-ghost px-3 py-1.5 text-xs text-ink-subtle hover:bg-ink-paper">← Back</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex border-b border-ink-ghost overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={clsx("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap",
              tab === t.id ? "border-brand-600 text-brand-600" : "border-transparent text-ink-subtle hover:text-ink")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Builder ── */}
      {tab === "builder" && (
        <div className="space-y-4">
          {/* Templates */}
          {templates.length > 0 && (
            <Card className="p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-ink-faint">Quick templates:</span>
                {templates.map(tpl => (
                  <button key={tpl.id} onClick={() => applyTemplate(tpl)}
                    className="rounded-lg border border-ink-ghost px-3 py-1 text-xs text-ink-subtle hover:bg-ink-paper hover:text-ink transition">
                    {tpl.name}
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* Line items */}
          <Card className="overflow-hidden p-0">
            <div className="grid grid-cols-[1fr_80px_60px_90px_80px_28px] gap-2 bg-ink-paper px-4 py-2.5 text-[10px] font-medium text-ink-faint">
              <span>Description</span><span>Type</span><span>Qty</span><span>Rate ({currency})</span><span>Total</span><span></span>
            </div>
            {items.map((item, i) => (
              <div key={i} className={clsx("grid grid-cols-[1fr_80px_60px_90px_80px_28px] gap-2 border-t border-ink-ghost px-4 py-2.5 items-center", insuranceMode && !item.approved && "opacity-40")}>
                <span className="text-sm text-ink">{item.description}</span>
                <span className={clsx("rounded px-2 py-0.5 text-[10px] font-medium w-fit", item.type === "PARTS" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700")}>{item.type}</span>
                <span className="text-sm">{item.quantity}</span>
                <span className="text-sm">{fmtC(item.rate)}</span>
                <span className="text-sm font-medium">{fmtC(item.quantity * item.rate)}</span>
                <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600 text-sm">×</button>
              </div>
            ))}
            {/* Add row */}
            <div className="grid grid-cols-[1fr_80px_60px_90px_80px_60px] gap-2 border-t border-ink-ghost bg-ink-paper px-4 py-2.5 items-center">
              <input className="input text-xs" placeholder="Description" value={newItem.description || ""}
                onChange={e => setNewItem(p => ({ ...p, description: e.target.value }))} />
              <select className="input text-xs" value={newItem.type} onChange={e => setNewItem(p => ({ ...p, type: e.target.value as any }))}>
                <option value="LABOUR">Labour</option>
                <option value="PARTS">Parts</option>
              </select>
              <input className="input text-xs" type="number" value={newItem.quantity || ""} min={1}
                onChange={e => setNewItem(p => ({ ...p, quantity: Number(e.target.value) }))} />
              <input className="input text-xs" type="number" placeholder="Rate" value={newItem.rate || ""}
                onChange={e => setNewItem(p => ({ ...p, rate: Number(e.target.value) }))} />
              <span className="text-xs text-ink-faint">{newItem.rate && newItem.quantity ? fmtC(Number(newItem.rate) * (newItem.quantity || 1)) : "—"}</span>
              <button onClick={addItem} className="rounded-lg border border-green-200 bg-green-50 px-2 py-1 text-xs text-green-700 hover:bg-green-100">+ Add</button>
            </div>
          </Card>

          {/* Discount + totals */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">Discount & tax</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                  <label className="label">Discount type</label>
                  <select className="input text-xs" value={discountType} onChange={e => setDiscountType(e.target.value)}>
                    <option value="pct">Percentage (%)</option>
                    <option value="fixed">Fixed amount</option>
                  </select>
                </div>
                <div>
                  <label className="label">Discount value</label>
                  <input className="input text-xs" type="number" min={0} value={discountValue}
                    onChange={e => setDiscountValue(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <label className="label">VAT / Tax rate</label>
                <select className="input text-xs" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))}>
                  {VAT_RATES.map(v => <option key={v.rate} value={v.rate}>{v.label}</option>)}
                </select>
              </div>
            </Card>

            <Card className="p-4">
              <div className="space-y-1.5">
                {[["Subtotal", fmtC(T.subtotal)],
                  discountValue > 0 ? ["Discount", `- ${fmtC(T.discountAmt)}`] : null,
                  discountValue > 0 ? ["After discount", fmtC(T.afterDiscount)] : null,
                  [`VAT (${Math.round(taxRate * 100)}%)`, fmtC(T.tax)],
                ].filter((x: any): x is [string, string] => x !== null && Array.isArray(x)).map(([l, v]: [string, string]) => (
                  <div key={String(l)} className="flex justify-between text-sm">
                    <span className="text-ink-faint">{l}</span><span>{v}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-ink-ghost pt-2 text-base font-semibold">
                  <span>Total</span><span className="text-brand-600">{fmtC(T.total)}</span>
                </div>
                {currency !== "GHS" && <p className="text-[10px] text-ink-faint">≈ ₵{T.total.toLocaleString()} GHS</p>}
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={save} disabled={saving || items.length === 0}
                  className="flex-1 rounded-lg border border-ink-ghost py-2 text-xs font-medium text-ink-subtle hover:bg-ink-paper transition disabled:opacity-50">
                  {saving ? "Saving…" : "Save draft"}
                </button>
                <button onClick={() => setTab("approval")} disabled={items.length === 0}
                  className="flex-1 rounded-lg bg-brand-600 py-2 text-xs font-medium text-white hover:bg-brand-800 transition disabled:opacity-50">
                  Send →
                </button>
              </div>
            </Card>
          </div>

          {/* Insurance mode banner */}
          {insuranceMode && (
            <Card className="p-4 border-blue-200 bg-blue-50">
              <p className="text-sm font-semibold text-blue-800 mb-2">🛡️ Insurance format</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  ["Approved items", items.filter(i => i.approved).length],
                  ["Excluded items",  items.filter(i => !i.approved).length],
                  ["Claimable",       fmtC(items.filter(i => i.approved).reduce((s, i) => s + i.quantity * i.rate, 0))],
                ].map(([l, v]) => (
                  <div key={String(l)} className="rounded-lg bg-white p-2">
                    <p className="text-[10px] text-blue-600">{l}</p>
                    <p className="text-base font-semibold text-blue-800">{v}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Cost history ── */}
      {tab === "history" && (
        <div className="space-y-4">
          {!history ? <div className="flex justify-center py-10"><Spinner /></div> : (
            <>
              <Card className="p-5">
                <p className="mb-4 text-sm font-medium text-ink">Cost comparison</p>
                {[
                  ["This workshop avg", history.workshopAvg, history.workshopCount],
                  ["Network avg",       history.networkAvg,  history.networkCount],
                  ["Your estimate",     T.total,             null],
                ].map(([l, v, c]: any) => {
                  const max = Math.max(history.workshopAvg || 0, history.networkAvg || 0, T.total) * 1.15;
                  const pct = v ? Math.round((v / max) * 100) : 0;
                  return (
                    <div key={String(l)} className="mb-3 flex items-center gap-3">
                      <span className="w-36 flex-shrink-0 text-xs text-ink-subtle">{l}</span>
                      <div className="flex-1 h-6 rounded-full bg-ink-paper overflow-hidden">
                        <div className={clsx("h-full rounded-full flex items-center justify-end pr-2", l === "Your estimate" ? "bg-brand-100" : "bg-ink-ghost")}
                          style={{ width: `${pct}%` }}>
                          {v && <span className={clsx("text-[10px] font-medium", l === "Your estimate" ? "text-brand-600" : "text-ink-subtle")}>₵{v.toLocaleString("en", { maximumFractionDigits: 0 })}</span>}
                        </div>
                      </div>
                      {c && <span className="w-16 text-[10px] text-ink-faint text-right">{c} jobs</span>}
                    </div>
                  );
                })}
              </Card>
              {history.topRepairs?.length > 0 && (
                <Card className="p-5">
                  <p className="mb-3 text-sm font-medium text-ink">Most common repairs</p>
                  {history.topRepairs.slice(0, 8).map((r: any) => (
                    <div key={r.complaint} className="flex justify-between py-1.5 border-b border-ink-ghost text-xs last:border-0">
                      <span className="text-ink truncate flex-1 mr-3">{r.complaint}</span>
                      <span className="text-ink-faint">{r.count} jobs</span>
                    </div>
                  ))}
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Versions ── */}
      {tab === "versions" && (
        <div>
          {!estimate ? (
            <Card className="p-8 text-center"><p className="text-ink-faint text-sm">Save an estimate first to see versions</p></Card>
          ) : (
            <div className="space-y-3">
              {estimate.versions?.map((v: any) => (
                <Card key={v.id} className={clsx("p-4", v.version === estimate.currentVersion && "border-brand-400")}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink">Version {v.version}</span>
                      {v.version === estimate.currentVersion && <span className="rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-[10px] text-brand-600">Current</span>}
                      <span className={clsx("rounded-md px-2 py-0.5 text-[10px] font-medium",
                        v.status === "APPROVED" ? "bg-green-50 text-green-700" :
                        v.status === "REJECTED" ? "bg-red-50 text-red-600" :
                        v.status === "SENT"     ? "bg-blue-50 text-blue-700" :
                                                  "bg-gray-100 text-gray-500")}>{v.status}</span>
                    </div>
                    <span className="text-xs text-ink-faint">{new Date(v.createdAt).toLocaleString("en-GH")} · ₵{v.total.toLocaleString()}</span>
                  </div>
                  {v.note && <p className="mt-2 text-xs text-ink-subtle bg-ink-paper p-2 rounded-lg">"{v.note}"</p>}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Approval ── */}
      {tab === "approval" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <p className="text-xs text-ink-faint mb-1">Amount</p>
              <p className="text-2xl font-semibold text-ink">{fmtC(T.total)}</p>
              <p className="text-[10px] text-ink-faint mt-1">VAT inclusive · {currency}</p>
            </Card>
            {job && (
              <Card className="p-4">
                <p className="text-xs text-ink-faint mb-1">Send to</p>
                <p className="font-semibold text-ink">{job.customerName}</p>
                <p className="text-xs text-ink-subtle">{job.customerPhone || "—"}</p>
              </Card>
            )}
          </div>

          <Card className="p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">Send via</p>
            <div className="grid grid-cols-4 gap-2">
              {CHANNELS.map(ch => (
                <button key={ch.id} onClick={() => setChannels(p => ({ ...p, [ch.id]: !p[ch.id] }))}
                  className={clsx("flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition",
                    channels[ch.id] ? "border-green-200 bg-green-50 text-green-700" : "border-ink-ghost bg-white text-ink-subtle hover:bg-ink-paper")}>
                  <span className="text-xl">{ch.icon}</span>
                  {ch.label}
                  {channels[ch.id] && <span className="text-[9px]">✓ On</span>}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <p className="mb-2 text-xs text-ink-faint">Message preview</p>
            <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-xs text-green-900 leading-relaxed">
              Hi {job?.customerName}, your estimate for {job?.vehicle?.plate} is ready.<br /><br />
              Total: <strong>{fmtC(T.total)}</strong><br /><br />
              Review and approve: <span className="text-blue-600 underline">shoplink.gh/estimate/abc123</span><br /><br />
              — {job?.workshop?.name}
            </div>
          </Card>

          <div className="flex gap-2">
            <button onClick={save} disabled={saving}
              className="flex-1 rounded-xl border border-ink-ghost py-2.5 text-sm text-ink-subtle hover:bg-ink-paper transition">
              Save draft
            </button>
            <button onClick={sendEstimate} disabled={sending || items.length === 0}
              className="flex-2 flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition disabled:opacity-60">
              {sending ? "Sending…" : sent ? "✓ Sent!" : "Send approval request →"}
            </button>
          </div>
        </div>
      )}

      {/* ── Partial approval ── */}
      {tab === "partial" && (
        <div className="space-y-4">
          <Card className="p-4 border-blue-200 bg-blue-50">
            <p className="font-medium text-blue-800 text-sm mb-1">Partial approval</p>
            <p className="text-xs text-blue-700">Check the items the customer has approved. Work will only begin on approved items.</p>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            {[
              ["Approved", items.filter(i => i.approved).length, items.filter(i => i.approved).reduce((s, i) => s + i.quantity * i.rate, 0), "green"],
              ["Pending",  items.filter(i => !i.approved).length, items.filter(i => !i.approved).reduce((s, i) => s + i.quantity * i.rate, 0), "amber"],
            ].map(([l, count, amt, color]: any) => (
              <Card key={l} className={clsx("p-4 text-center", color === "green" ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50")}>
                <p className={clsx("text-xs font-medium", color === "green" ? "text-green-700" : "text-amber-700")}>{l}</p>
                <p className={clsx("text-xl font-semibold", color === "green" ? "text-green-800" : "text-amber-800")}>{count} items</p>
                <p className={clsx("text-sm", color === "green" ? "text-green-700" : "text-amber-700")}>₵{(amt as number).toLocaleString()}</p>
              </Card>
            ))}
          </div>

          <Card className="overflow-hidden p-0">
            {items.map((item, i) => (
              <div key={i} className={clsx("flex items-center gap-3 px-4 py-3 border-b border-ink-ghost last:border-0", item.approved && "bg-green-50")}>
                <input type="checkbox" checked={item.approved} onChange={() => toggleApproved(i)} className="h-4 w-4 cursor-pointer" style={{ accentColor: "#16a34a" }} />
                <span className={clsx("rounded px-2 py-0.5 text-[10px] font-medium", item.type === "PARTS" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700")}>{item.type}</span>
                <span className="flex-1 text-sm text-ink">{item.description}</span>
                <span className={clsx("text-sm font-medium", item.approved ? "text-green-700" : "text-ink-subtle")}>₵{(item.quantity * item.rate).toFixed(2)}</span>
              </div>
            ))}
          </Card>

          <div className="flex gap-2">
            <button onClick={() => setItems(prev => prev.map(i => ({ ...i, approved: true })))}
              className="flex-1 rounded-xl border border-green-200 bg-green-50 py-2.5 text-sm font-medium text-green-700 hover:bg-green-100 transition">
              Approve all
            </button>
            <button onClick={save} disabled={saving}
              className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 transition">
              {saving ? "Saving…" : "Save partial approval"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
