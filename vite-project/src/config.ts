/** В dev — прокси Vite; в prod без VITE_API_URL — тот же origin (nginx /api) */
export const API_URL = import.meta.env.VITE_API_URL ?? ''

export const WS_ENABLED = import.meta.env.VITE_WS_ENABLED === 'true'

export const SYNC_DEBOUNCE_MS = Number(import.meta.env.VITE_SYNC_DEBOUNCE_MS) || 400

export function getWsBase(): string {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}`
  }

  return 'ws://localhost:8080'
}

export function buildWsUrl(sessionId: string, userName: string, clientId: string): string {
  const params = new URLSearchParams({ userName, clientId })
  return `${getWsBase()}/ws/${sessionId}?${params}`
}
