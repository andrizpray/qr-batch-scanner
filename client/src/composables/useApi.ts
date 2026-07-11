import axios from 'axios'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Batch {
  id: number
  name: string
  created_at: string
  scan_count: number
}

export interface Scan {
  id: number
  batch_id: number
  lot_id: string
  scanned_at: string
}

// ─── API Instance ────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: '/api',
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Auth Helpers ───────────────────────────────────────────────────────────

/** Set the X-PIN header for mobile/device authentication */
export function setMobilePin(pin: string): void {
  api.defaults.headers.common['X-PIN'] = pin
}

/** Set Basic Auth header for admin authentication */
export function setAdminAuth(username: string, password: string): void {
  const credentials = btoa(`${username}:${password}`)
  api.defaults.headers.common['Authorization'] = `Basic ${credentials}`
}

/** Remove both X-PIN and Basic Auth headers */
export function clearAuth(): void {
  delete api.defaults.headers.common['X-PIN']
  delete api.defaults.headers.common['Authorization']
}

export default api
