"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import clsx from "clsx";

const NAV = [
  {
    group: null,
    items: [
      { href: "/dashboard",           label: "Overview",      icon: "📊", exact: true },
    ],
  },
  {
    group: "Operations",
    items: [
      { href: "/dashboard/intake",    label: "New intake",    icon: "📋" },
      { href: "/dashboard/jobs",      label: "Jobs & WIP",    icon: "🔧" },
      { href: "/dashboard/vehicles",  label: "Vehicles",      icon: "🚗" },
    ],
  },
  {
    group: "Business",
    items: [
      { href: "/dashboard/inventory", label: "Inventory",     icon: "📦" },
      { href: "/dashboard/cx",        label: "Customer XP",   icon: "⭐" },
      { href: "/dashboard/reports",   label: "Reports",       icon: "📈" },
    ],
  },
  {
    group: "Management",
    items: [
      { href: "/dashboard/workshops", label: "Workshops",     icon: "🏭" },
      { href: "/dashboard/team",      label: "Team & Staff",  icon: "👥" },
    ],
  },
  {
    group: "System",
    items: [
      { href: "/dashboard/offline",   label: "Offline sync",  icon: "📶" },
    ],
  },
];

const ROLE_HIDE: Record<string, string[]> = {
  TECHNICIAN:      ["/dashboard/reports", "/dashboard/workshops", "/dashboard/team", "/dashboard/cx"],
  CASHIER:         ["/dashboard/team", "/dashboard/workshops"],
  PARTS_MANAGER:   ["/dashboard/reports", "/dashboard/team"],
  SERVICE_ADVISOR: ["/dashboard/team"],
  CUSTOMER:        ["/dashboard/intake", "/dashboard/inventory", "/dashboard/reports", "/dashboard/team", "/dashboard/workshops"],
};

export default function Sidebar() {
  const pathname  = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const hidden = ROLE_HIDE[user?.role || ""] || [];

  function isActive(href: string, exact = false) {
    if (exact) return pathname === href;
    // Jobs & WIP should also match /dashboard/wip
    if (href === "/dashboard/jobs") return pathname.startsWith("/dashboard/jobs") || pathname.startsWith("/dashboard/wip");
    // Team & Staff should also match /dashboard/workforce and /dashboard/roles
    if (href === "/dashboard/team") return pathname.startsWith("/dashboard/team") || pathname.startsWith("/dashboard/workforce") || pathname.startsWith("/dashboard/roles");
    return pathname.startsWith(href);
  }

  return (
    <aside className={clsx(
      "flex flex-col border-r border-ink-ghost bg-white transition-all duration-200 flex-shrink-0",
      collapsed ? "w-14" : "w-52"
    )}>
      {/* Logo */}
      <div className={clsx("flex items-center border-b border-ink-ghost", collapsed ? "px-2 py-3 justify-center" : "px-3 py-3 gap-2")}>
        {collapsed ? (
          <button onClick={() => setCollapsed(false)} title="Expand">
            <Image src="/autoflow-logo.jpg" alt="AutoFlow" width={32} height={32} className="rounded-lg object-contain" />
          </button>
        ) : (
          <>
            <Image src="/autoflow-logo.jpg" alt="AutoFlow Ghana" width={110} height={40} className="object-contain" style={{ maxHeight: 40 }} />
            <button onClick={() => setCollapsed(true)} className="ml-auto text-ink-faint hover:text-ink text-xs flex-shrink-0">←</button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV.map((section, si) => {
          const visibleItems = section.items.filter(item => !hidden.includes(item.href));
          if (visibleItems.length === 0) return null;
          return (
            <div key={si} className="mb-3">
              {section.group && !collapsed && (
                <p className="mb-1 px-2 text-[9px] font-semibold uppercase tracking-widest text-ink-faint">{section.group}</p>
              )}
              {visibleItems.map(item => (
                <Link key={item.href} href={item.href}
                  className={clsx(
                    "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors mb-0.5",
                    isActive(item.href, item.exact)
                      ? "bg-orange-50 text-orange-600 font-medium"
                      : "text-ink-subtle hover:bg-ink-paper hover:text-ink"
                  )}
                  title={collapsed ? item.label : undefined}>
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              ))}
            </div>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-ink-ghost p-3">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-full bg-orange-100 flex items-center justify-center text-xs font-semibold text-orange-600 flex-shrink-0">
                {user?.name?.split(" ").map((w: string) => w[0]).join("").slice(0, 2)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-medium text-ink truncate">{user?.name}</p>
                <p className="text-[10px] text-ink-faint">{user?.role?.replace(/_/g, " ")}</p>
              </div>
            </div>
            <button onClick={logout} className="w-full rounded-lg border border-ink-ghost py-1.5 text-xs text-ink-subtle hover:bg-ink-paper transition">
              Sign out
            </button>
          </>
        ) : (
          <button onClick={logout} title="Sign out" className="w-full flex justify-center rounded-lg py-1.5 text-ink-faint hover:bg-ink-paper transition text-base">↩</button>
        )}
      </div>
    </aside>
  );
}
