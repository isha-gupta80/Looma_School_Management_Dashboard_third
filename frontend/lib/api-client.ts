// API client for frontend to communicate with backend
import type { School, User, AccessLog, ScanRecord } from "./types"

const API_BASE = "http://localhost:8000"

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // ✅ read token if present
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: "include", // keep cookies if backend uses them
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })

  // ✅ read body ONCE
  const text = await res.text()
  let data: any = null

  try {
    data = text ? JSON.parse(text) : null
  } catch {
    // non-JSON response
  }

  // ✅ surface real backend error
  if (!res.ok) {
    const message =
      data?.detail ||
      data?.error ||
      data?.message ||
      `Request failed (${res.status})`
    throw new Error(message)
  }

  return data as T
}

// ==================== AUTH API ====================
export const authAPI = {
  login: async (username: string, password: string) => {
    const res = await fetchAPI<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    })

    // ✅ persist token for protected routes
    if (res.token) {
      localStorage.setItem("access_token", res.token)
    }

    return res
  },

  logout: async () => {
    localStorage.removeItem("access_token")
    return fetchAPI<{ success: boolean }>("/auth/logout", { method: "POST" })
  },

  me: () => fetchAPI<{ user: User }>("/auth/me"),
}

// ==================== SCHOOLS API ====================
export const schoolsAPI = {
  getAll: (params?: { search?: string; status?: string; province?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.set("search", params.search)
    if (params?.status && params.status !== "all") searchParams.set("status", params.status)
    if (params?.province && params.province !== "all") searchParams.set("province", params.province)
    const query = searchParams.toString()
    return fetchAPI<{ schools: School[]; total: number }>(
      `/schools${query ? `?${query}` : ""}`
    )
  },

  getById: (id: string) => fetchAPI<{ school: School }>(`/schools/${id}`),

  create: (data: Partial<School>) =>
    fetchAPI<{ school: School }>("/schools", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<School>) =>
    fetchAPI<{ school: School }>(`/schools/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchAPI<{ success: boolean }>(`/schools/${id}`, {
      method: "DELETE",
    }),
}

// ==================== SCANS API ====================
export const scansAPI = {
  list: (params?: { serial?: string; school?: string; limit?: number; skip?: number }) => {
    const searchParams = new URLSearchParams()
    if (params?.serial) searchParams.set("serial", params.serial)
    if (params?.school) searchParams.set("school", params.school)
    if (typeof params?.limit === "number") searchParams.set("limit", String(params.limit))
    if (typeof params?.skip === "number") searchParams.set("skip", String(params.skip))
    const query = searchParams.toString()
    return fetchAPI<{ scans: ScanRecord[]; total: number }>(
      `/scans${query ? `?${query}` : ""}`
    )
  },

  delete: (id: string) =>
    fetchAPI<{ success: boolean }>(`/scans/${id}`, {
      method: "DELETE",
    }),
}

// ==================== ACCESS LOGS API ====================
export const accessLogsAPI = {
  getBySchool: (schoolId: string) =>
    fetchAPI<{ logs: AccessLog[] }>(`/schools/${schoolId}/access-logs`),

  create: (schoolId: string, data: Partial<AccessLog>) =>
    fetchAPI<{ log: AccessLog }>(`/schools/${schoolId}/access-logs`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
}

// ==================== USERS API ====================
export const usersAPI = {
  getAll: () => fetchAPI<{ users: User[] }>("/users"),

  add: (data: { username: string; email: string; password: string; role: string }) =>
    fetchAPI<User>("/users/add", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: { username?: string; email?: string; role?: string }) =>
    fetchAPI<User>(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateMe: (data: { username?: string; email?: string }) =>
    fetchAPI<User>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updatePassword: (data: { old_password: string; new_password: string }) =>
    fetchAPI<{ message: string }>("/users/me/password", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchAPI<void>(`/users/${id}`, {
      method: "DELETE",
    }),
}