// ─── Enums ────────────────────────────────────────────────────────────────────

export type Role = "OWNER" | "MANAGER" | "TECHNICIAN" | "RECEPTION";
export type UserStatus = "ACTIVE" | "INVITED" | "INACTIVE";
export type JobStatus = "INTAKE" | "DIAGNOSING" | "IN_PROGRESS" | "QUALITY_CHECK" | "COMPLETED" | "CANCELLED";
export type EstimateStatus = "DRAFT" | "SENT" | "APPROVED" | "REJECTED";
export type InvoiceStatus = "PENDING" | "PAID" | "VOID";
export type ItemType = "LABOUR" | "PARTS";

// ─── Core models ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  workshopId: string | null;
  workshop?: { id: string; name: string };
  createdAt: string;
}

export interface Workshop {
  id: string;
  name: string;
  location: string;
  phone?: string;
  managerId?: string;
  manager?: { id: string; name: string; email: string };
  qrToken: string;
  active: boolean;
  stats?: {
    active: number;
    completed: number;
    revenueToday: number;
  };
  members?: User[];
  _count?: { jobs: number; members: number };
}

export interface Vehicle {
  id: string;
  plate: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
}

export interface Job {
  id: string;
  jobRef: string;
  workshopId: string;
  workshop: { id: string; name: string; location: string };
  vehicleId: string;
  vehicle: Vehicle;
  mileage: number;
  customerName: string;
  customerPhone?: string;
  complaint: string;
  advisorNotes?: string;
  status: JobStatus;
  technicianId?: string;
  technician?: { id: string; name: string } | null;
  trackingToken: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  estimate?: EstimateSummary | null;
  invoice?: { id: string; status: InvoiceStatus; total: number } | null;
  statusHistory?: StatusHistoryEntry[];
}

export interface StatusHistoryEntry {
  id: string;
  status: JobStatus;
  note?: string;
  changedBy?: { id: string; name: string } | null;
  createdAt: string;
}

export interface EstimateItem {
  id?: string;
  type: ItemType;
  description: string;
  quantity: number;
  rate: number;
  total?: number;
}

export interface EstimateSummary {
  id: string;
  status: EstimateStatus;
  subtotal: number;
  tax: number;
  total: number;
  token?: string;
}

export interface Estimate extends EstimateSummary {
  jobId: string;
  taxRate: number;
  items: EstimateItem[];
  createdBy?: { name: string };
  createdAt: string;
  updatedAt: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  workshopId: string | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export interface RevenueReport {
  totalRevenue: number;
  totalInvoices: number;
  avgInvoice: number;
  byWorkshop: { id: string; name: string; total: number; count: number }[];
}

export interface JobsReport {
  total: number;
  byStatus: Record<string, number>;
  byWorkshop: { id: string; name: string; total: number; completed: number }[];
}

export interface PerformanceReport {
  completedJobs: number;
  avgCompletionMinutes: number;
  avgCompletionDisplay: string;
  topTechnicians: { id: string; name: string; count: number }[];
}

// ─── Check-in ─────────────────────────────────────────────────────────────────

export interface CheckinPayload {
  qrToken: string;
  plate: string;
  make?: string;
  model?: string;
  year?: number;
  mileage: number;
  customerName: string;
  customerPhone?: string;
  complaint: string;
}

export interface CheckinResponse {
  jobRef: string;
  trackingToken: string;
  workshop: { name: string; location: string };
  vehicle: { plate: string; make?: string; model?: string };
  message: string;
}

export interface TrackingJob {
  jobRef: string;
  vehicle: Vehicle;
  workshop: { name: string; location: string; phone?: string };
  customerName: string;
  complaint: string;
  status: JobStatus;
  technician: string | null;
  estimate: {
    status: EstimateStatus;
    subtotal: number;
    tax: number;
    total: number;
    approvalToken: string;
  } | null;
  timeline: { status: JobStatus; note?: string; createdAt: string }[];
  createdAt: string;
  completedAt?: string;
}
