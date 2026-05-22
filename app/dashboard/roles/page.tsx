"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { userApi } from "@/lib/api";
import { Card, PageHeader, Spinner } from "@/components/ui";
import clsx from "clsx";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
function authFetch(url: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("sl_token");
  return fetch(url, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
}

const HIERARCHY = [
  { id: "SUPER_ADMIN",    label: "Platform Super Admin", icon: "🛡️", color: "#7c3aed", bg: "#f3e8ff", level: 1, desc: "Full platform control. Manages all owners, billing, system config." },
  { id: "OWNER",          label: "Workshop Owner",        icon: "👑", color: "#dc2626", bg: "#fee2e2", level: 2, desc: "Full control over their network. All branches, staff, revenue." },
  { id: "BRANCH_MANAGER", label: "Branch Manager",        icon: "🏭", color: "#2563eb", bg: "#dbeafe", level: 3, desc: "Manages one branch. Jobs, staff, estimates, reports." },
  { id: "SERVICE_ADVISOR",label: "Service Advisor",       icon: "📋", color: "#0891b2", bg: "#cffafe", level: 4, desc: "Customer intake, job creation, estimates, customer comms." },
  { id: "TECHNICIAN",     label: "Technician",            icon: "🔧", color: "#d97706", bg: "#fef3c7", level: 5, desc: "Assigned jobs only. Status updates, notes, time logging." },
  { id: "CASHIER",        label: "Cashier",               icon: "💳", color: "#059669", bg: "#d1fae5", level: 6, desc: "Payments, invoices, receipts. No job/estimate editing." },
  { id: "PARTS_MANAGER",  label: "Parts Manager",         icon: "📦", color: "#7c3aed", bg: "#ede9fe", level: 7, desc: "Full inventory. Purchase orders, stock, suppliers." },
  { id: "CUSTOMER",       label: "Customer",              icon: "🚗", color: "#6b7280", bg: "#f3f4f6", level: 8, desc: "Public portal only. Track job, approve estimates, pay." },
];

const PERMISSIONS_TABLE = [
  { label: "Platform admin",           access: { SUPER_ADMIN:"yes", OWNER:"no",  BRANCH_MANAGER:"no",  SERVICE_ADVISOR:"no",  TECHNICIAN:"no",  CASHIER:"no",  PARTS_MANAGER:"no",  CUSTOMER:"no"  }},
  { label: "View all workshops",       access: { SUPER_ADMIN:"yes", OWNER:"yes", BRANCH_MANAGER:"no",  SERVICE_ADVISOR:"no",  TECHNICIAN:"no",  CASHIER:"no",  PARTS_MANAGER:"no",  CUSTOMER:"no"  }},
  { label: "Manage staff",             access: { SUPER_ADMIN:"yes", OWNER:"yes", BRANCH_MANAGER:"yes", SERVICE_ADVISOR:"no",  TECHNICIAN:"no",  CASHIER:"no",  PARTS_MANAGER:"no",  CUSTOMER:"no"  }},
  { label: "View reports & analytics", access: { SUPER_ADMIN:"yes", OWNER:"yes", BRANCH_MANAGER:"yes", SERVICE_ADVISOR:"no",  TECHNICIAN:"no",  CASHIER:"no",  PARTS_MANAGER:"no",  CUSTOMER:"no"  }},
  { label: "Create & manage jobs",     access: { SUPER_ADMIN:"yes", OWNER:"yes", BRANCH_MANAGER:"yes", SERVICE_ADVISOR:"yes", TECHNICIAN:"no",  CASHIER:"no",  PARTS_MANAGER:"no",  CUSTOMER:"no"  }},
  { label: "Create estimates",         access: { SUPER_ADMIN:"yes", OWNER:"yes", BRANCH_MANAGER:"yes", SERVICE_ADVISOR:"yes", TECHNICIAN:"part",CASHIER:"no",  PARTS_MANAGER:"no",  CUSTOMER:"no"  }},
  { label: "Approve estimates",        access: { SUPER_ADMIN:"yes", OWNER:"yes", BRANCH_MANAGER:"yes", SERVICE_ADVISOR:"no",  TECHNICIAN:"no",  CASHIER:"no",  PARTS_MANAGER:"no",  CUSTOMER:"yes" }},
  { label: "Update job status",        access: { SUPER_ADMIN:"yes", OWNER:"yes", BRANCH_MANAGER:"yes", SERVICE_ADVISOR:"yes", TECHNICIAN:"yes", CASHIER:"no",  PARTS_MANAGER:"no",  CUSTOMER:"no"  }},
  { label: "Time tracking",            access: { SUPER_ADMIN:"no",  OWNER:"no",  BRANCH_MANAGER:"no",  SERVICE_ADVISOR:"no",  TECHNICIAN:"yes", CASHIER:"no",  PARTS_MANAGER:"no",  CUSTOMER:"no"  }},
  { label: "Manage invoices",          access: { SUPER_ADMIN:"yes", OWNER:"yes", BRANCH_MANAGER:"yes", SERVICE_ADVISOR:"no",  TECHNICIAN:"no",  CASHIER:"yes", PARTS_MANAGER:"no",  CUSTOMER:"no"  }},
  { label: "Process payments",         access: { SUPER_ADMIN:"yes", OWNER:"yes", BRANCH_MANAGER:"yes", SERVICE_ADVISOR:"no",  TECHNICIAN:"no",  CASHIER:"yes", PARTS_MANAGER:"no",  CUSTOMER:"yes" }},
  { label: "Manage inventory",         access: { SUPER_ADMIN:"yes", OWNER:"yes", BRANCH_MANAGER:"yes", SERVICE_ADVISOR:"no",  TECHNICIAN:"no",  CASHIER:"no",  PARTS_MANAGER:"yes", CUSTOMER:"no"  }},
  { label: "View inventory",           access: { SUPER_ADMIN:"yes", OWNER:"yes", BRANCH_MANAGER:"yes", SERVICE_ADVISOR:"part",TECHNICIAN:"part",CASHIER:"no",  PARTS_MANAGER:"yes", CUSTOMER:"no"  }},
  { label: "Commissions",              access: { SUPER_ADMIN:"yes", OWNER:"yes", BRANCH_MANAGER:"yes", SERVICE_ADVISOR:"no",  TECHNICIAN:"no",  CASHIER:"yes", PARTS_MANAGER:"no",  CUSTOMER:"no"  }},
  { label: "Customer portal & QR",     access: { SUPER_ADMIN:"no",  OWNER:"no",  BRANCH_MANAGER:"no",  SERVICE_ADVISOR:"no",  TECHNICIAN:"no",  CASHIER:"no",  PARTS_MANAGER:"no",  CUSTOMER:"yes" }},
];

function Check({ access }: { access: string }) {
  return (
    <div className={clsx("mx-auto h-5 w-5 rounded flex items-center justify-center text-[10px] font-bold",
      access === "yes"  ? "bg-green-100 text-green-700" :
      access === "part" ? "bg-amber-100 text-amber-700" :
                          "bg-gray-100 text-gray-400")}>
      {access === "yes" ? "✓" : access === "part" ? "~" : "·"}
    </div>
  );
}

export default function RolesPage() {
  const { user } = useAuth();
  const [tab,       setTab]       = useState<"matrix"|"hierarchy"|"users">("matrix");
  const [selected,  setSelected]  = useState("OWNER");
  const [users,     setUsers]     = useState<any[]>([]);
  const [myPerms,   setMyPerms]   = useState<any>(null);
  const [loading,   setLoading]   = useState(false);
  const [assignable,setAssignable]= useState<any[]>([]);

  useEffect(() => {
    authFetch(`${API}/api/roles/my-permissions`).then(r => r.json()).then(setMyPerms).catch(() => {});
    authFetch(`${API}/api/roles/assignable`).then(r => r.json()).then(d => setAssignable(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === "users") {
      setLoading(true);
      userApi.list().then(setUsers).finally(() => setLoading(false));
    }
  }, [tab]);

  async function changeRole(userId: string, role: string) {
    await authFetch(`${API}/api/roles/users/${userId}/role`, { method: "PUT", body: JSON.stringify({ role }) });
    const updated = await userApi.list();
    setUsers(updated);
  }

  const selRole = HIERARCHY.find(r => r.id === selected)!;
  const selPerms = PERMISSIONS_TABLE.filter(p => (p.access as any)[selected] !== "no");

  const TABS = [
    { id: "matrix",    label: "Permission matrix" },
    { id: "hierarchy", label: "Role hierarchy" },
    { id: "users",     label: "User roles" },
  ];

  return (
    <div className="fade-up">
      <PageHeader title="Roles & permissions" subtitle="8-level role hierarchy across the platform" />

      {/* My permissions banner */}
      {myPerms && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-ink-ghost bg-white p-3">
          <span className="text-xl">{HIERARCHY.find(r => r.id === myPerms.role)?.icon}</span>
          <div>
            <p className="text-sm font-medium text-ink">Signed in as: {HIERARCHY.find(r => r.id === myPerms.role)?.label}</p>
            <p className="text-xs text-ink-subtle">{myPerms.permissions?.length || 0} permissions granted · Level {myPerms.level}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-5 flex border-b border-ink-ghost">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={clsx("px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition",
              tab === t.id ? "border-brand-600 text-brand-600" : "border-transparent text-ink-subtle hover:text-ink")}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Permission matrix ── */}
      {tab === "matrix" && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-ink-ghost">
                <th className="py-3 pr-4 text-left text-[11px] font-medium text-ink-faint w-48">Permission</th>
                {HIERARCHY.map(r => (
                  <th key={r.id} className="py-2 px-1 text-center w-20">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-base">{r.icon}</span>
                      <span className="text-[9px] text-ink-subtle leading-tight max-w-[60px] text-center">{r.label.split(" ").slice(-1)[0]}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS_TABLE.map((p, i) => (
                <tr key={p.label} className={clsx(i % 2 === 0 ? "bg-white" : "bg-ink-paper")}>
                  <td className="py-2 pr-4 text-[11px] text-ink">{p.label}</td>
                  {HIERARCHY.map(r => (
                    <td key={r.id} className="py-2 px-1 text-center">
                      <Check access={(p.access as any)[r.id] || "no"} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex gap-4 text-xs text-ink-subtle">
            <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-green-100 text-green-700 flex items-center justify-center text-[10px]">✓</span> Full access</span>
            <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-amber-100 text-amber-700 flex items-center justify-center text-[10px]">~</span> Partial / own only</span>
            <span className="flex items-center gap-1.5"><span className="h-4 w-4 rounded bg-gray-100 text-gray-400 flex items-center justify-center text-[10px]">·</span> No access</span>
          </div>
        </div>
      )}

      {/* ── Hierarchy ── */}
      {tab === "hierarchy" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Hierarchy list */}
          <div className="space-y-2">
            {HIERARCHY.map((role, i) => (
              <div key={role.id}>
                <button onClick={() => setSelected(role.id)} className="w-full text-left">
                  <div className={clsx("rounded-xl border p-3 transition-all", selected === role.id ? "shadow-lift" : "hover:shadow-card")}
                    style={{ borderColor: selected === role.id ? role.color : undefined, background: selected === role.id ? role.bg : "white" }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{role.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium" style={{ color: selected === role.id ? role.color : undefined }}>{role.label}</p>
                        <p className="text-[11px] text-ink-subtle">{role.desc}</p>
                      </div>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: role.bg, color: role.color }}>L{role.level}</span>
                    </div>
                  </div>
                </button>
                {i < HIERARCHY.length - 1 && (
                  <div className="flex justify-center py-1">
                    <div className="w-px h-4 border-l-2 border-dashed border-ink-ghost" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Role detail */}
          <div className="sticky top-4">
            <Card className="p-5" style={{ borderColor: selRole.color }}>
              <div className="mb-4 flex items-center gap-3 rounded-xl p-3" style={{ background: selRole.bg }}>
                <span className="text-3xl">{selRole.icon}</span>
                <div>
                  <p className="font-semibold" style={{ color: selRole.color }}>{selRole.label}</p>
                  <p className="text-xs text-ink-subtle mt-0.5">{selRole.desc}</p>
                </div>
              </div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">Permissions ({selPerms.length})</p>
              <div className="space-y-1.5">
                {selPerms.map(p => (
                  <div key={p.label} className="flex items-center gap-2">
                    <Check access={(p.access as any)[selected]} />
                    <span className="text-xs text-ink">{p.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── User roles ── */}
      {tab === "users" && (
        loading ? <div className="flex justify-center py-16"><Spinner className="h-6 w-6" /></div> : (
          <Card className="overflow-hidden p-0">
            <div className="grid grid-cols-[1fr_140px_180px_100px] gap-2 bg-ink-paper px-4 py-2.5 text-[10px] font-medium text-ink-faint">
              <span>Member</span><span>Current role</span><span>Change role</span><span>Status</span>
            </div>
            {users.map((u: any) => {
              const roleDef = HIERARCHY.find(r => r.id === u.role);
              return (
                <div key={u.id} className="grid grid-cols-[1fr_140px_180px_100px] gap-2 border-t border-ink-ghost px-4 py-3 items-center">
                  <div>
                    <p className="text-sm font-medium text-ink">{u.name}</p>
                    <p className="text-[10px] text-ink-faint">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>{roleDef?.icon}</span>
                    <span className="text-xs font-medium" style={{ color: roleDef?.color }}>{roleDef?.label || u.role}</span>
                  </div>
                  <select
                    className="input text-xs"
                    value={u.role}
                    onChange={e => changeRole(u.id, e.target.value)}
                    disabled={u.id === user?.id}
                  >
                    {(assignable.length > 0 ? assignable : HIERARCHY).map(r => (
                      <option key={r.id} value={r.id}>{r.icon} {r.label}</option>
                    ))}
                  </select>
                  <span className={clsx("rounded-md border px-2 py-0.5 text-[10px] font-medium",
                    u.status === "ACTIVE" ? "border-green-200 bg-green-50 text-green-700" :
                    u.status === "INVITED" ? "border-amber-200 bg-amber-50 text-amber-700" :
                    "border-red-200 bg-red-50 text-red-600")}>{u.status}</span>
                </div>
              );
            })}
          </Card>
        )
      )}
    </div>
  );
}
