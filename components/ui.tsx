import clsx from "clsx";
import type { JobStatus } from "@/lib/types";

// ─── Button ───────────────────────────────────────────────────────────────────
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "danger" | "success";
  size?: "sm" | "md";
}
export function Btn({ variant = "ghost", size = "md", className, children, ...props }: BtnProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-lg border font-medium transition-all active:scale-[0.98] disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
        variant === "primary" && "border-brand-600 bg-brand-600 text-white hover:bg-brand-800",
        variant === "ghost"   && "border-ink-ghost bg-white text-ink-muted hover:bg-ink-paper",
        variant === "danger"  && "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
        variant === "success" && "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx("rounded-2xl border border-ink-ghost bg-white shadow-card", className)} {...props}>
      {children}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return (
    <div className={clsx("inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink-ghost border-t-brand-600", className)} />
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<JobStatus, string> = {
  INTAKE:        "bg-gray-100 text-gray-600 border-gray-200",
  DIAGNOSING:    "bg-yellow-50 text-yellow-700 border-yellow-200",
  IN_PROGRESS:   "bg-blue-50 text-blue-700 border-blue-200",
  QUALITY_CHECK: "bg-green-50 text-green-700 border-green-200",
  COMPLETED:     "bg-green-100 text-green-800 border-green-300",
  CANCELLED:     "bg-red-50 text-red-600 border-red-200",
};
const STATUS_LABELS: Record<JobStatus, string> = {
  INTAKE: "Intake", DIAGNOSING: "Diagnosing", IN_PROGRESS: "In Progress",
  QUALITY_CHECK: "Quality Check", COMPLETED: "Completed", CANCELLED: "Cancelled",
};
export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={clsx("inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium", STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── Role badge ───────────────────────────────────────────────────────────────
export function RoleBadge({ role }: { role: string }) {
  const s = {
    OWNER:       "bg-red-50 text-red-700 border-red-200",
    MANAGER:     "bg-blue-50 text-blue-700 border-blue-200",
    TECHNICIAN:  "bg-amber-50 text-amber-700 border-amber-200",
    RECEPTION:   "bg-gray-100 text-gray-600 border-gray-200",
  }[role] || "bg-gray-100 text-gray-500 border-gray-200";
  return <span className={clsx("rounded-md border px-2 py-0.5 text-xs font-medium", s)}>{role}</span>;
}

// ─── Empty state ──────────────────────────────────────────────────────────────
export function Empty({ icon, title, subtitle }: { icon?: string; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && <div className="mb-3 text-3xl text-ink-faint">{icon}</div>}
      <p className="text-sm font-medium text-ink-muted">{title}</p>
      {subtitle && <p className="mt-1 text-xs text-ink-faint">{subtitle}</p>}
    </div>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────
export function Metric({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-ink-ghost bg-ink-paper p-4">
      <p className="text-xs text-ink-faint">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-subtle">{sub}</p>}
    </div>
  );
}

// ─── Page header ─────────────────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-subtle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
