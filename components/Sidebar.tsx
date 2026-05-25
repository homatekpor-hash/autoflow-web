"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import clsx from "clsx";

// Streamlined nav — merged duplicates, grouped logically
const ROLE_NAV: Record<string, { group: string|null; href: string; label: string; icon: string }[]> = {
  SUPER_ADMIN: [
    { group:null,        href:"/dashboard",              label:"Overview",     icon:"📊" },
    { group:"Workshop",  href:"/dashboard/intake",        label:"New intake",   icon:"📋" },
    { group:"Workshop",  href:"/dashboard/jobs",          label:"Jobs & WIP",   icon:"🔧" },
    { group:"Workshop",  href:"/dashboard/vehicles",      label:"Vehicles",     icon:"🚗" },
    { group:"Business",  href:"/dashboard/inventory",     label:"Inventory",    icon:"📦" },
    { group:"Business",  href:"/dashboard/invoices",      label:"Invoices",     icon:"🧾" },
    { group:"Business",  href:"/dashboard/reports",       label:"Reports",      icon:"📈" },
    { group:"Manage",    href:"/dashboard/workshops",     label:"Workshops",    icon:"🏭" },
    { group:"Manage",    href:"/dashboard/team",          label:"Team",         icon:"👥" },
    { group:"Manage",    href:"/dashboard/schedule",      label:"Schedule",     icon:"📅" },
    { group:"Manage",    href:"/dashboard/cx",            label:"Customer XP",  icon:"⭐" },
    { group:"Manage",    href:"/dashboard/admin",          label:"Admin Panel",  icon:"🛡️" },
  ],
  OWNER: [
    { group:null,        href:"/dashboard",              label:"Overview",     icon:"📊" },
    { group:"Workshop",  href:"/dashboard/intake",        label:"New intake",   icon:"📋" },
    { group:"Workshop",  href:"/dashboard/jobs",          label:"Jobs & WIP",   icon:"🔧" },
    { group:"Workshop",  href:"/dashboard/vehicles",      label:"Vehicles",     icon:"🚗" },
    { group:"Business",  href:"/dashboard/inventory",     label:"Inventory",    icon:"📦" },
    { group:"Business",  href:"/dashboard/invoices",      label:"Invoices",     icon:"🧾" },
    { group:"Business",  href:"/dashboard/reports",       label:"Reports",      icon:"📈" },
    { group:"Manage",    href:"/dashboard/workshops",     label:"Workshops",    icon:"🏭" },
    { group:"Manage",    href:"/dashboard/team",          label:"Team",         icon:"👥" },
    { group:"Manage",    href:"/dashboard/schedule",      label:"Schedule",     icon:"📅" },
    { group:"Manage",    href:"/dashboard/cx",            label:"Customer XP",  icon:"⭐" },
    { group:"Manage",    href:"/dashboard/billing",        label:"Billing",      icon:"💳" },
  ],
  BRANCH_MANAGER: [
    { group:null,        href:"/dashboard",              label:"Overview",     icon:"📊" },
    { group:"Workshop",  href:"/dashboard/intake",        label:"New intake",   icon:"📋" },
    { group:"Workshop",  href:"/dashboard/jobs",          label:"Jobs & WIP",   icon:"🔧" },
    { group:"Workshop",  href:"/dashboard/vehicles",      label:"Vehicles",     icon:"🚗" },
    { group:"Business",  href:"/dashboard/inventory",     label:"Inventory",    icon:"📦" },
    { group:"Business",  href:"/dashboard/invoices",      label:"Invoices",     icon:"🧾" },
    { group:"Business",  href:"/dashboard/reports",       label:"Reports",      icon:"📈" },
    { group:"Manage",    href:"/dashboard/team",          label:"Team",         icon:"👥" },
    { group:"Manage",    href:"/dashboard/schedule",      label:"Schedule",     icon:"📅" },
    { group:"Manage",    href:"/dashboard/cx",            label:"Customer XP",  icon:"⭐" },
  ],
  SERVICE_ADVISOR: [
    { group:null,        href:"/dashboard",              label:"Overview",     icon:"📊" },
    { group:"Workshop",  href:"/dashboard/intake",        label:"New intake",   icon:"📋" },
    { group:"Workshop",  href:"/dashboard/jobs",          label:"Jobs & WIP",   icon:"🔧" },
    { group:"Workshop",  href:"/dashboard/vehicles",      label:"Vehicles",     icon:"🚗" },
    { group:"Business",  href:"/dashboard/cx",            label:"Customer XP",  icon:"⭐" },
  ],
  TECHNICIAN: [
    { group:null,        href:"/dashboard",              label:"Overview",     icon:"📊" },
    { group:"Workshop",  href:"/dashboard/jobs",          label:"My jobs",      icon:"🔧" },
    { group:"Workshop",  href:"/dashboard/wip",           label:"WIP board",    icon:"⚡" },
  ],
  CASHIER: [
    { group:null,        href:"/dashboard",              label:"Overview",     icon:"📊" },
    { group:"Workshop",  href:"/dashboard/jobs",          label:"Jobs",         icon:"🔧" },
    { group:"Business",  href:"/dashboard/invoices",      label:"Invoices",     icon:"🧾" },
  ],
  PARTS_MANAGER: [
    { group:null,        href:"/dashboard",              label:"Overview",     icon:"📊" },
    { group:"Workshop",  href:"/dashboard/inventory",     label:"Inventory",    icon:"📦" },
  ],
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const role     = user?.role || "TECHNICIAN";
  const navItems = ROLE_NAV[role] || ROLE_NAV.TECHNICIAN;

  const groups: { label: string|null; items: typeof navItems }[] = [];
  navItems.forEach(item => {
    const last = groups[groups.length-1];
    if (!last || last.label !== item.group) groups.push({ label: item.group, items: [item] });
    else last.items.push(item);
  });

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === href;
    if (href === "/dashboard/jobs") return pathname.startsWith("/dashboard/jobs") || pathname.startsWith("/dashboard/wip");
    if (href === "/dashboard/workshops") return pathname.startsWith("/dashboard/workshops") || pathname.startsWith("/dashboard/settings");
    return pathname.startsWith(href);
  }

  const initials = user?.name?.split(" ").map((w:string)=>w[0]).join("").slice(0,2);

  return (
    <aside className={clsx("flex flex-col border-r border-ink-ghost bg-white transition-all duration-200 flex-shrink-0", collapsed?"w-14":"w-48")}>
      {/* Logo */}
      <div className={clsx("flex items-center border-b border-ink-ghost", collapsed?"px-2 py-3 justify-center":"px-3 py-3 gap-2")}>
        {collapsed ? (
          <button onClick={()=>setCollapsed(false)} title="Expand">
            <Image src="/autoflow-logo.jpg" alt="AutoFlow" width={30} height={30} className="rounded-md object-contain" />
          </button>
        ) : (
          <>
            <Image src="/autoflow-logo.jpg" alt="AutoFlow Ghana" width={100} height={36} className="object-contain" style={{maxHeight:36}} />
            <button onClick={()=>setCollapsed(true)} className="ml-auto text-ink-faint hover:text-ink text-xs flex-shrink-0">←</button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {groups.map((group,gi)=>(
          <div key={gi} className="mb-2">
            {group.label && !collapsed && (
              <p className="mb-0.5 px-2 text-[9px] font-bold uppercase tracking-widest text-ink-faint">{group.label}</p>
            )}
            {group.items.map(item=>(
              <Link key={item.href} href={item.href}
                className={clsx("flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors mb-0.5",
                  isActive(item.href) ? "bg-orange-50 text-orange-600 font-medium" : "text-ink-subtle hover:bg-ink-paper hover:text-ink")}
                title={collapsed?item.label:undefined}>
                <span className="text-sm flex-shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate text-[13px]">{item.label}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom — notifications, settings, profile, signout */}
      <div className="border-t border-ink-ghost p-2 space-y-0.5">
        {!collapsed ? (
          <>
            <Link href="/dashboard/notifications" className={clsx("flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors", pathname.startsWith("/dashboard/notifications")?"bg-orange-50 text-orange-600 font-medium":"text-ink-subtle hover:bg-ink-paper hover:text-ink")}>
              <span className="text-sm">🔔</span><span>Alerts</span>
            </Link>
            <Link href="/dashboard/settings" className={clsx("flex items-center gap-2 rounded-lg px-2 py-1.5 text-[13px] transition-colors", pathname.startsWith("/dashboard/settings")?"bg-orange-50 text-orange-600 font-medium":"text-ink-subtle hover:bg-ink-paper hover:text-ink")}>
              <span className="text-sm">⚙️</span><span>Settings</span>
            </Link>
            <Link href="/dashboard/profile" className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-ink-paper transition mt-1">
              <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-bold text-orange-600 flex-shrink-0">{initials}</div>
              <div className="overflow-hidden flex-1">
                <p className="text-[12px] font-medium text-ink truncate leading-tight">{user?.name}</p>
                <p className="text-[10px] text-ink-faint leading-tight">{role?.replace(/_/g," ")}</p>
              </div>
            </Link>
            <button onClick={logout} className="w-full rounded-lg py-1.5 text-[12px] text-ink-faint hover:bg-ink-paper hover:text-ink transition text-left px-2">
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link href="/dashboard/notifications" title="Alerts" className="flex justify-center rounded-lg py-1.5 text-ink-faint hover:bg-ink-paper transition text-sm">🔔</Link>
            <Link href="/dashboard/settings" title="Settings" className="flex justify-center rounded-lg py-1.5 text-ink-faint hover:bg-ink-paper transition text-sm">⚙️</Link>
            <Link href="/dashboard/profile" title={user?.name} className="flex justify-center rounded-lg py-1.5 hover:bg-ink-paper transition">
              <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center text-[10px] font-bold text-orange-600">{initials}</div>
            </Link>
            <button onClick={logout} title="Sign out" className="w-full flex justify-center rounded-lg py-1.5 text-ink-faint hover:bg-ink-paper transition text-sm">↩</button>
          </>
        )}
      </div>
    </aside>
  );
}
