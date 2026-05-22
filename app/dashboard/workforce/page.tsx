"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Spinner, PageHeader } from "@/components/ui";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
function authFetch(url: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("sl_token");
  return fetch(url, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
}

const TABS = [
  { id: "roster",      label: "Roster" },
  { id: "schedule",    label: "Shifts" },
  { id: "performance", label: "Performance" },
  { id: "commissions", label: "Commissions" },
  { id: "leaderboard", label: "Leaderboard" },
  { id: "training",    label: "Training" },
];

const AVATAR_COLORS = [
  { bg: "#dbeafe", tc: "#1d4ed8" }, { bg: "#dcfce7", tc: "#15803d" },
  { bg: "#fef3c7", tc: "#92400e" }, { bg: "#fce7f3", tc: "#9d174d" },
];
const MEDALS = ["🥇","🥈","🥉","4️⃣","5️⃣"];
const SHIFTS = ["Morning","Afternoon","Night","Off"];
const DAYS   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export default function WorkforcePage() {
  const [tab,         setTab]         = useState("roster");
  const [techs,       setTechs]       = useState<any[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [training,    setTraining]    = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [selected,    setSelected]    = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  const loadTechs = useCallback(async () => {
    const res = await authFetch(`${API}/api/workforce/technicians`);
    if (res.ok) setTechs(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { loadTechs(); }, [loadTechs]);

  useEffect(() => {
    if (tab === "performance") authFetch(`${API}/api/workforce/performance`).then(r => r.json()).then(d => setPerformance(Array.isArray(d) ? d : [])).catch(() => {});
    if (tab === "commissions") authFetch(`${API}/api/workforce/commissions`).then(r => r.json()).then(setCommissions).catch(() => {});
   if (tab === "commissions") authFetch(`${API}/api/workforce/commissions`).then(r => r.json()).then(d => setCommissions(Array.isArray(d) ? d : [])).catch(() => {});
if (tab === "leaderboard") authFetch(`${API}/api/workforce/leaderboard`).then(r => r.json()).then(d => setLeaderboard(Array.isArray(d) ? d : [])).catch(() => {});
if (tab === "training")    authFetch(`${API}/api/workforce/training`).then(r => r.json()).then(d => setTraining(Array.isArray(d) ? d : [])).catch(() => {});
    if (tab === "leaderboard") authFetch(`${API}/api/workforce/leaderboard`).then(r => r.json()).then(setLeaderboard).catch(() => {});
    if (tab === "training")    authFetch(`${API}/api/workforce/training`).then(r => r.json()).then(setTraining).catch(() => {});
  }, [tab]);

  async function openTech(id: string) {
    const res = await authFetch(`${API}/api/workforce/technicians/${id}`);
    if (res.ok) setSelected(await res.json());
  }

  async function calcCommissions() {
    setCalculating(true);
    await authFetch(`${API}/api/workforce/commissions/calculate`, { method: "POST" });
    const res = await authFetch(`${API}/api/workforce/commissions`);
    if (res.ok) setCommissions(await res.json());
    setCalculating(false);
  }

  async function completeTrain(id: string) {
    await authFetch(`${API}/api/workforce/training/${id}/complete`, { method: "POST" });
    const res = await authFetch(`${API}/api/workforce/training`);
    if (res.ok) setTraining(await res.json());
  }

  const totalHours = techs.reduce((s: number, t: any) => s + (t.hoursToday || 0), 0);
  const clockedIn  = techs.filter((t: any) => t.isRunning).length;

  function avatar(t: any, i: number, size = 36) {
    const c = AVATAR_COLORS[i % 4];
    const initials = t.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2);
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", background: c.bg, color: c.tc, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35, fontWeight: 500, flexShrink: 0 }}>
        {initials}
      </div>
    );
  }

  return (
    <div className="fade-up">
      <PageHeader title="Technician management" subtitle={`${techs.length} technicians · ${clockedIn} active · ${totalHours}h logged today`}
        action={<button className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-medium text-white hover:bg-brand-800">+ Add technician</button>}
      />

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["Active now", `${clockedIn}/${techs.length}`], ["Avg efficiency", techs.length ? Math.round(techs.reduce((s: number, t: any) => s + (t.profile?.commissionRate || 5), 0) / techs.length) + "%" : "—"],
          ["Hours today", totalHours + "h"], ["Jobs this month", techs.reduce((s: number, t: any) => s + (t.jobsThisMonth || 0), 0)]].map(([l, v]) => (
          <div key={String(l)} className="rounded-xl border border-ink-ghost bg-white p-4">
            <p className="text-xs text-ink-faint">{l}</p>
            <p className="mt-1 text-xl font-semibold text-ink">{v}</p>
          </div>
        ))}
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

      <div className="flex gap-4">
        <div className="flex-1 min-w-0">

          {/* ── Roster ── */}
          {tab === "roster" && (
            loading ? <div className="flex justify-center py-16"><Spinner className="h-6 w-6" /></div> : (
              <div className="space-y-3">
                {(Array.isArray(techs) ? techs : []).map((t: any, i: number) => (
                  <button key={t.id} onClick={() => openTech(t.id)} className="w-full text-left">
                    <Card className={clsx("p-4 hover:shadow-lift transition-shadow", selected?.id === t.id && "border-brand-400")}>
                      <div className="flex items-center gap-3">
                        {avatar(t, i, 44)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="font-medium text-ink">{t.name}</p>
                            <span className={clsx("rounded-md px-2 py-0.5 text-[10px] font-medium", t.isRunning ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500")}>
                              {t.isRunning ? "🟢 Active" : "⚪ Offline"}
                            </span>
                            {t.profile?.shift && <span className="rounded-md border border-ink-ghost px-2 py-0.5 text-[10px] text-ink-subtle">{t.profile.shift}</span>}
                          </div>
                          <p className="text-xs text-ink-subtle">
                            {t.activeJobs} active jobs · {t.jobsThisMonth} completed this month · {t.attendancePct}% attendance
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-ink">{t.hoursToday}h</p>
                          <p className="text-[10px] text-ink-faint">today</p>
                        </div>
                      </div>
                      {/* Skills */}
                      {t.profile?.skills?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {(Array.isArray(t.profile.skills) ? t.profile.skills : []).slice(0, 4).map((s: string) => (
                            <span key={s} className="rounded-md border border-ink-ghost px-2 py-0.5 text-[10px] text-ink-subtle">{s}</span>
                          ))}
                        </div>
                      )}
                    </Card>
                  </button>
                ))}
                {techs.length === 0 && (
                  <Card className="p-10 text-center">
                    <p className="text-2xl mb-2">👨‍🔧</p>
                    <p className="text-sm text-ink-muted">No technicians found</p>
                    <p className="text-xs text-ink-faint mt-1">Add technicians via Team Management</p>
                  </Card>
                )}
              </div>
            )
          )}

          {/* ── Schedule ── */}
          {tab === "schedule" && (
            <div className="space-y-4">
              <Card className="p-5 overflow-x-auto">
                <p className="mb-4 text-sm font-medium text-ink">Weekly shift schedule</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-ink-ghost">
                      <th className="pb-2 text-left font-medium text-ink-faint w-32">Technician</th>
                      {DAYS.map(d => <th key={d} className="pb-2 text-center font-medium text-ink-faint w-14">{d}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-ghost">
                    {(Array.isArray(techs) ? techs : []).map((t: any, i: number) => {
                      const shift = t.profile?.shift || "Morning";
                      return (
                        <tr key={t.id}>
                          <td className="py-2 pr-3">
                            <div className="flex items-center gap-2">
                              {avatar(t, i, 24)}
                              <span className="text-ink">{t.name.split(" ")[0]}</span>
                            </div>
                          </td>
                          {DAYS.map((d, di) => {
                            const isOff = shift === "Off" || (di >= 5);
                            const label = isOff ? "Off" : shift;
                            return (
                              <td key={d} className="py-2 text-center">
                                <span className={clsx("inline-block rounded px-1.5 py-0.5 text-[10px] font-medium",
                                  isOff ? "bg-gray-100 text-gray-400" :
                                  shift === "Morning" ? "bg-blue-50 text-blue-700" :
                                  shift === "Afternoon" ? "bg-amber-50 text-amber-700" :
                                  "bg-purple-50 text-purple-700")}>
                                  {isOff ? "–" : label.slice(0, 3)}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
              <Card className="p-5">
                <p className="mb-3 text-sm font-medium text-ink">Attendance this month</p>
                {(Array.isArray(techs) ? techs : []).map((t: any, i: number) => (
                  <div key={t.id} className="mb-3 flex items-center gap-3">
                    {avatar(t, i, 28)}
                    <span className="w-24 flex-shrink-0 text-sm text-ink">{t.name.split(" ")[0]}</span>
                    <div className="flex-1 h-2 rounded-full bg-ink-paper overflow-hidden">
                      <div className={clsx("h-full rounded-full", (t.attendancePct || 90) >= 90 ? "bg-green-400" : (t.attendancePct || 90) >= 80 ? "bg-amber-400" : "bg-red-400")}
                        style={{ width: `${t.attendancePct || 90}%` }} />
                    </div>
                    <span className={clsx("text-sm font-medium w-10 text-right", (t.attendancePct || 90) >= 90 ? "text-green-600" : "text-amber-600")}>{t.attendancePct || 90}%</span>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* ── Performance ── */}
          {tab === "performance" && (
            <div className="space-y-3">
              {performance.length === 0 ? <div className="flex justify-center py-10"><Spinner /></div> : (
                performance.map((p: any, i: number) => (
                  <Card key={p.techId} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-9 w-9 rounded-full bg-brand-100 flex items-center justify-center text-sm font-semibold text-brand-600">
                        {p.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                      </div>
                      <p className="font-medium text-ink flex-1">{p.name}</p>
                      <span className="text-lg font-bold text-brand-600">{p.efficiency}%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      {[["Jobs completed", p.jobsCompleted], ["Hours worked", p.totalHours + "h"], ["Commission", "₵" + (p.commission || 0).toLocaleString()]].map(([l, v]) => (
                        <div key={String(l)} className="rounded-lg bg-ink-paper p-2">
                          <p className="text-[10px] text-ink-faint">{l}</p>
                          <p className="text-sm font-semibold text-ink">{v}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* ── Commissions ── */}
          {tab === "commissions" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                  <p className="text-xs text-green-600">Total commissions this month</p>
                  <p className="text-2xl font-semibold text-green-800">₵{(Array.isArray(commissions) ? commissions : []).reduce((s: number, c: any) => s + c.total, 0).toLocaleString()}</p>
                </div>
                <button onClick={calcCommissions} disabled={calculating} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-800 disabled:opacity-60">
                  {calculating ? "Calculating…" : "↻ Recalculate"}
                </button>
              </div>
              <Card className="overflow-hidden p-0">
                <div className="grid grid-cols-[1fr_60px_60px_80px_80px] gap-2 bg-ink-paper px-4 py-2.5 text-[10px] font-medium text-ink-faint">
                  <span>Technician</span><span>Jobs</span><span>Rate</span><span>Commission</span><span>Status</span>
                </div>
                {(Array.isArray(commissions) ? commissions : []).map((c: any) => (
                  <div key={c.userId} className="grid grid-cols-[1fr_60px_60px_80px_80px] gap-2 border-t border-ink-ghost px-4 py-3 items-center text-sm">
                    <span className="font-medium text-ink">{c.name}</span>
                    <span className="text-ink-subtle">{c.entries?.length || 0}</span>
                    <span className="text-ink-subtle">{c.entries?.[0]?.rate || 5}%</span>
                    <span className="font-semibold text-green-700">₵{c.total.toLocaleString()}</span>
                    <span className={clsx("rounded-md px-2 py-0.5 text-[10px] font-medium", c.isPaid ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700")}>{c.isPaid ? "Paid" : "Pending"}</span>
                  </div>
                ))}
                {commissions.length === 0 && <div className="py-10 text-center text-sm text-ink-faint">No commissions yet — click Recalculate</div>}
              </Card>
            </div>
          )}

          {/* ── Leaderboard ── */}
          {tab === "leaderboard" && (
            <div className="space-y-3">
              <Card className="p-4 border-amber-200 bg-amber-50">
                <p className="font-semibold text-amber-800">🏆 {new Date().toLocaleString("en-GH", { month: "long", year: "numeric" })} leaderboard</p>
                <p className="text-xs text-amber-700 mt-0.5">Rankings based on jobs completed, attendance, and efficiency</p>
              </Card>
              {(Array.isArray(leaderboard) ? leaderboard : []).map((t: any, i: number) => (
                <Card key={t.userId} className={clsx("p-4", i === 0 && "border-amber-200 bg-amber-50")}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{MEDALS[i] || `${i + 1}.`}</span>
                    <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-sm font-bold text-brand-600">
                      {t.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-ink">{t.name}</p>
                      <div className="flex gap-4 mt-0.5">
                        {[["Jobs", t.jobs], ["Attendance", t.attendance + "d"], ["Streak", (t.streak || 0) + "d 🔥"]].map(([l, v]) => (
                          <span key={String(l)} className="text-xs text-ink-subtle">{l}: <strong className="text-ink">{v}</strong></span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-brand-600">{t.score}</p>
                      <p className="text-[10px] text-ink-faint">points</p>
                    </div>
                  </div>
                </Card>
              ))}
              {leaderboard.length === 0 && <Card className="p-10 text-center"><p className="text-ink-faint">No data yet</p></Card>}
            </div>
          )}

          {/* ── Training ── */}
          {tab === "training" && (
            <div className="space-y-3">
              {(Array.isArray(training) ? training : []).filter((t: any) => !t.isDone && t.dueDate && new Date(t.dueDate) < new Date()).length > 0 && (
                <Card className="p-4 border-red-200 bg-red-50">
                  <p className="font-medium text-red-800 mb-1">⚠️ Overdue training</p>
                  {(Array.isArray(training) ? training : []).filter((t: any) => !t.isDone && t.dueDate && new Date(t.dueDate) < new Date()).map((t: any) => (
                    <p key={t.id} className="text-xs text-red-700">• {t.name} — due {new Date(t.dueDate).toLocaleDateString("en-GH")}</p>
                  ))}
                </Card>
              )}
              {(Array.isArray(training) ? training : []).map((t: any) => {
                const isOverdue = !t.isDone && t.dueDate && new Date(t.dueDate) < new Date();
                return (
                  <Card key={t.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-0.5">{t.isDone ? "✅" : isOverdue ? "🔴" : "🕐"}</span>
                      <div className="flex-1">
                        <p className="font-medium text-ink">{t.name}</p>
                        <p className="text-xs text-ink-subtle mt-0.5">{t.profile?.user?.name} {t.provider && `· ${t.provider}`}</p>
                        {t.dueDate && <p className={clsx("text-xs mt-0.5", isOverdue ? "text-red-600 font-medium" : "text-ink-faint")}>
                          Due: {new Date(t.dueDate).toLocaleDateString("en-GH")}{isOverdue ? " — OVERDUE" : ""}
                        </p>}
                      </div>
                      {!t.isDone && (
                        <button onClick={() => completeTrain(t.id)} className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs text-green-700 hover:bg-green-100">
                          Mark done
                        </button>
                      )}
                      {t.isDone && <span className="text-xs text-green-600 font-medium">Completed</span>}
                    </div>
                  </Card>
                );
              })}
              {training.length === 0 && <Card className="p-10 text-center"><p className="text-ink-faint">No training items</p></Card>}
            </div>
          )}
        </div>

        {/* ── Tech detail panel ── */}
        {selected && (
          <div className="w-72 flex-shrink-0">
            <div className="sticky top-0 max-h-screen overflow-y-auto rounded-2xl border border-ink-ghost bg-white shadow-lift p-4">
              <div className="mb-3 flex justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-sm font-bold text-brand-600">
                    {selected.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold text-ink">{selected.name}</p>
                    <p className="text-xs text-ink-subtle">{selected.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="text-ink-faint hover:text-ink text-xl leading-none">×</button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {[["Jobs/month", selected.jobsThisMonth || 0], ["Commission", "₵" + (selected.totalCommission || 0).toLocaleString()], ["Shift", selected.profile?.shift || "—"], ["Rate", (selected.profile?.commissionRate || 5) + "%"]].map(([l, v]) => (
                  <div key={String(l)} className="rounded-lg bg-ink-paper p-2.5">
                    <p className="text-[10px] text-ink-faint">{l}</p>
                    <p className="text-sm font-semibold text-ink">{v}</p>
                  </div>
                ))}
              </div>

              {selected.profile?.skills?.length > 0 && (
                <>
                  <p className="text-[10px] text-ink-faint mb-2 uppercase tracking-wide">Skills</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {(Array.isArray(selected.profile.skills) ? selected.profile.skills : []).map((s: string) => (
                      <span key={s} className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] text-blue-700">{s}</span>
                    ))}
                  </div>
                </>
              )}

              {selected.profile?.certifications?.length > 0 && (
                <>
                  <p className="text-[10px] text-ink-faint mb-2 uppercase tracking-wide">Certifications</p>
                  <div className="space-y-1.5 mb-4">
                    {(Array.isArray(selected.profile.certifications) ? selected.profile.certifications : []).map((c: any) => (
                      <div key={typeof c === "string" ? c : c.name} className="flex items-center gap-2 rounded-lg border border-ink-ghost p-2">
                        <span>🏅</span>
                        <span className="text-xs text-ink">{typeof c === "string" ? c : c.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {selected.assignedJobs?.length > 0 && (
                <>
                  <p className="text-[10px] text-ink-faint mb-2 uppercase tracking-wide">Active jobs</p>
                  <div className="space-y-1">
                    {selected.assignedJobs.slice(0, 5).map((j: any) => (
                      <div key={j.id} className="flex justify-between text-xs py-1 border-b border-ink-ghost last:border-0">
                        <span className="font-mono text-brand-600">{j.jobRef}</span>
                        <span className="text-ink-subtle">{j.vehicle?.plate}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="mt-4 flex gap-2">
                <button className="flex-1 rounded-lg border border-ink-ghost py-2 text-xs text-ink-subtle hover:bg-ink-paper">Edit profile</button>
                <button className="flex-1 rounded-lg bg-brand-600 py-2 text-xs text-white hover:bg-brand-800">Assign job</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
