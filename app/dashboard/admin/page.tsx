"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { PageHeader, Card, Spinner } from "@/components/ui";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");
const af = (url: string, opts: RequestInit = {}) =>
  fetch(`${API}${url}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${tok()}`, ...(opts.headers||{}) } });

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [users,     setUsers]     = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState("overview");

  useEffect(() => {
    if (user && user.role !== "SUPER_ADMIN") { router.push("/dashboard"); return; }
    Promise.all([
      af("/api/workshops").then(r=>r.json()),
      af("/api/users").then(r=>r.json()),
    ]).then(([ws, us]) => {
      setWorkshops(Array.isArray(ws)?ws:[]);
      setUsers(Array.isArray(us)?us:[]);
      setLoading(false);
    });
  }, [user]);

  if (user?.role !== "SUPER_ADMIN") return null;

  const totalUsers = users.length;
  const owners     = users.filter(u=>u.role==="OWNER").length;
  const activeWs   = workshops.filter(w=>w.active).length;

  const ROLE_C: Record<string,string> = {
    SUPER_ADMIN:"bg-purple-100 text-purple-700", OWNER:"bg-red-100 text-red-700",
    BRANCH_MANAGER:"bg-blue-100 text-blue-700", SERVICE_ADVISOR:"bg-cyan-100 text-cyan-700",
    TECHNICIAN:"bg-amber-100 text-amber-700", CASHIER:"bg-green-100 text-green-700",
    PARTS_MANAGER:"bg-violet-100 text-violet-700",
  };

  return (
    <div className="fade-up">
      <PageHeader title="Super Admin Panel" subtitle="Platform-wide management" />

      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        {[["Workshops",activeWs,"🏭","text-orange-500"],["Users",totalUsers,"👥","text-blue-600"],["Owners",owners,"👑","text-red-600"],["Platform","Live 🟢","⚡","text-green-600"]].map(([l,v,icon,c])=>(
          <Card key={String(l)} className="p-4 text-center">
            <p className="text-2xl mb-1">{icon}</p>
            <p className={`text-2xl font-bold ${c}`}>{v}</p>
            <p className="text-xs text-ink-faint mt-1">{l}</p>
          </Card>
        ))}
      </div>

      <div className="flex border-b border-ink-ghost mb-5">
        {["overview","workshops","users"].map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px capitalize transition ${tab===t?"border-orange-500 text-orange-600":"border-transparent text-ink-subtle hover:text-ink"}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-10"><Spinner className="h-6 w-6"/></div> : (
        <>
          {tab==="overview" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="p-5">
                <p className="text-sm font-semibold text-ink mb-3">Workshops by owner</p>
                {workshops.map(ws=>(
                  <div key={ws.id} className="flex items-center justify-between py-2 border-b border-ink-ghost last:border-0">
                    <div><p className="text-sm font-medium text-ink">{ws.name}</p><p className="text-xs text-ink-faint">{ws.location}</p></div>
                    <span className={`text-xs rounded-full px-2 py-0.5 ${ws.active?"bg-green-50 text-green-700":"bg-gray-100 text-gray-500"}`}>{ws.active?"Active":"Inactive"}</span>
                  </div>
                ))}
              </Card>
              <Card className="p-5">
                <p className="text-sm font-semibold text-ink mb-3">Users by role</p>
                {Object.entries(users.reduce((acc:any,u:any)=>{acc[u.role]=(acc[u.role]||0)+1;return acc;},{})).map(([role,count])=>(
                  <div key={role} className="flex items-center justify-between py-2 border-b border-ink-ghost last:border-0">
                    <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${ROLE_C[role]||"bg-gray-100 text-gray-600"}`}>{role.replace(/_/g," ")}</span>
                    <span className="text-sm font-semibold text-ink">{count as number}</span>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {tab==="workshops" && (
            <Card className="p-0 overflow-hidden">
              <div className="grid grid-cols-[1fr_120px_100px_80px] gap-2 bg-ink-paper px-4 py-2.5 text-[10px] font-semibold text-ink-faint uppercase tracking-wide">
                <span>Workshop</span><span>Owner</span><span>Staff</span><span>Status</span>
              </div>
              {workshops.map(ws=>(
                <div key={ws.id} className="grid grid-cols-[1fr_120px_100px_80px] gap-2 border-t border-ink-ghost px-4 py-3 items-center">
                  <div><p className="text-sm font-medium text-ink">{ws.name}</p><p className="text-xs text-ink-faint">{ws.location}</p></div>
                  <span className="text-xs text-ink-subtle truncate">{ws.manager?.name||"—"}</span>
                  <span className="text-sm text-ink">{ws._count?.members||0}</span>
                  <span className={`text-xs rounded-full px-2 py-0.5 w-fit ${ws.active?"bg-green-50 text-green-700":"bg-gray-100 text-gray-500"}`}>{ws.active?"Active":"Off"}</span>
                </div>
              ))}
            </Card>
          )}

          {tab==="users" && (
            <Card className="p-0 overflow-hidden">
              <div className="grid grid-cols-[1fr_120px_100px] gap-2 bg-ink-paper px-4 py-2.5 text-[10px] font-semibold text-ink-faint uppercase tracking-wide">
                <span>User</span><span>Role</span><span>Workshop</span>
              </div>
              {users.map(u=>(
                <div key={u.id} className="grid grid-cols-[1fr_120px_100px] gap-2 border-t border-ink-ghost px-4 py-3 items-center">
                  <div><p className="text-sm font-medium text-ink">{u.name}</p><p className="text-xs text-ink-faint">{u.email}</p></div>
                  <span className={`text-[10px] rounded-full px-2 py-0.5 font-semibold w-fit ${ROLE_C[u.role]||"bg-gray-100"}`}>{u.role?.replace(/_/g," ")}</span>
                  <span className="text-xs text-ink-subtle truncate">{u.workshop?.name||"—"}</span>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
