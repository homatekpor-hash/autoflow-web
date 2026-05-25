"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const tok = () => localStorage.getItem("sl_token");

export default function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const [jobs, parts] = await Promise.all([
          fetch(`${API}/api/jobs`, { headers: { Authorization: `Bearer ${tok()}` } }).then(r=>r.ok?r.json():[]),
          fetch(`${API}/api/inventory/parts`, { headers: { Authorization: `Bearer ${tok()}` } }).then(r=>r.ok?r.json():[]),
        ]);
        const readyJobs  = (Array.isArray(jobs)?jobs:[]).filter((j:any)=>j.status==="READY").length;
        const urgentJobs = (Array.isArray(jobs)?jobs:[]).filter((j:any)=>j.priority==="URGENT"&&!["DELIVERED","CANCELLED"].includes(j.status)).length;
        const lowStock   = (Array.isArray(parts)?parts:[]).filter((p:any)=>p.qty<=p.minQty).length;
        setCount(readyJobs + urgentJobs + lowStock);
      } catch {}
    }
    load();
    const interval = setInterval(load, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <Link href="/dashboard/notifications" className="relative flex items-center justify-center w-9 h-9 rounded-lg border border-ink-ghost hover:bg-ink-paper transition">
      <span className="text-lg">🔔</span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
