import type {
  LoginResponse, AuthUser, Workshop, Job, User,
  Estimate, EstimateItem, RevenueReport, JobsReport,
  PerformanceReport, CheckinPayload, CheckinResponse, TrackingJob,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error ${res.status}`);
  }
  return res.json() as T;
}

function getToken(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem("sl_token") ?? undefined;
}

function auth<T>(path: string, options: RequestInit = {}): Promise<T> {
  return request<T>(path, options, getToken());
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => auth<AuthUser>("/api/auth/me"),
  changePassword: (currentPassword: string, newPassword: string) =>
    auth<{ message: string }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};

// ─── Workshops ────────────────────────────────────────────────────────────────

export const workshopApi = {
  list:      () => auth<Workshop[]>("/api/workshops"),
  get:       (id: string) => auth<Workshop>(`/api/workshops/${id}`),
  create:    (data: { name: string; location: string; phone?: string }) =>
    auth<Workshop>("/api/workshops", { method: "POST", body: JSON.stringify(data) }),
  update:    (id: string, data: Partial<Workshop>) =>
    auth<Workshop>(`/api/workshops/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  getQRCode: (id: string) =>
    auth<{ dataUrl: string; url: string }>(`/api/workshops/${id}/qrcode`),
};

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export const jobApi = {
  list: (params?: { workshopId?: string; status?: string; search?: string; date?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params || {}).filter(([, v]) => v) as [string, string][]
    ).toString();
    return auth<Job[]>(`/api/jobs${qs ? `?${qs}` : ""}`);
  },
  listForWorkshop: (workshopId: string) =>
    auth<Job[]>(`/api/workshops/${workshopId}/jobs`),
  get: (id: string) => auth<Job>(`/api/jobs/${id}`),
  updateStatus: (id: string, status: string, note?: string) =>
    auth<Job>(`/api/jobs/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status, note }),
    }),
  assign: (id: string, technicianId: string) =>
    auth<Job>(`/api/jobs/${id}/assign`, {
      method: "PUT",
      body: JSON.stringify({ technicianId }),
    }),
};

// ─── Estimates ────────────────────────────────────────────────────────────────

export const estimateApi = {
  get:    (jobId: string) => auth<Estimate>(`/api/jobs/${jobId}/estimate`),
  create: (jobId: string, items: EstimateItem[]) =>
    auth<Estimate>(`/api/jobs/${jobId}/estimate`, {
      method: "POST",
      body: JSON.stringify({ items }),
    }),
  update: (id: string, items: EstimateItem[]) =>
    auth<Estimate>(`/api/estimates/${id}`, {
      method: "PUT",
      body: JSON.stringify({ items }),
    }),
  send:    (id: string) =>
    auth<Estimate>(`/api/estimates/${id}/send`, { method: "POST" }),
  approve: (token: string) =>
    request<{ message: string }>(`/api/estimates/approve/${token}`, { method: "POST" }),
  reject:  (token: string, reason?: string) =>
    request<{ message: string }>(`/api/estimates/reject/${token}`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const userApi = {
  list:       (params?: { role?: string; workshopId?: string }) => {
    const qs = new URLSearchParams(
      Object.entries(params || {}).filter(([, v]) => v) as [string, string][]
    ).toString();
    return auth<User[]>(`/api/users${qs ? `?${qs}` : ""}`);
  },
  invite: (data: { name: string; email: string; role: string; workshopId?: string }) =>
    auth<{ user: User; tempPassword: string }>("/api/users/invite", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<User>) =>
    auth<User>(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deactivate: (id: string) =>
    auth<{ message: string }>(`/api/users/${id}`, { method: "DELETE" }),
};

// ─── Reports ──────────────────────────────────────────────────────────────────

export const reportApi = {
  revenue:     (params?: { from?: string; to?: string }) =>
    auth<RevenueReport>(`/api/reports/revenue?${new URLSearchParams(params as Record<string,string> || {})}`),
  jobs:        (params?: { from?: string; to?: string }) =>
    auth<JobsReport>(`/api/reports/jobs?${new URLSearchParams(params as Record<string,string> || {})}`),
  performance: (params?: { from?: string; to?: string }) =>
    auth<PerformanceReport>(`/api/reports/performance?${new URLSearchParams(params as Record<string,string> || {})}`),
};

// ─── Public check-in / tracking ───────────────────────────────────────────────

export const publicApi = {
  getWorkshop: (qrToken: string) =>
    request<{ id: string; name: string; location: string; phone?: string }>(
      `/api/checkin/workshop/${qrToken}`
    ),
  checkin: (data: CheckinPayload) =>
    request<CheckinResponse>("/api/checkin", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  track: (trackingToken: string) =>
    request<TrackingJob>(`/api/checkin/track/${trackingToken}`),
};
