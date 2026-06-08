import { API_URL } from '../config'
import type { SessionInfo } from '../types/sync'

async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init)
  } catch {
    throw new Error(
      'Сервер недоступен. Запустите backend: cd backend && npm run dev',
    )
  }
}

async function parseError(response: Response, fallback: string): Promise<never> {
  const data = await response.json().catch(() => ({}))
  throw new Error(typeof data.error === 'string' ? data.error : fallback)
}

export async function createSession(userName: string): Promise<SessionInfo> {
  const response = await apiFetch(`${API_URL}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userName }),
  })

  if (!response.ok) {
    await parseError(response, 'Не удалось создать сессию')
  }

  const session = (await response.json()) as SessionInfo

  if (!session.sessionId) {
    throw new Error('Сервер не вернул ID сессии')
  }

  return session
}

export async function getSession(sessionId: string): Promise<SessionInfo> {
  const response = await apiFetch(`${API_URL}/api/sessions/${encodeURIComponent(sessionId)}`)

  if (response.status === 404) {
    throw new Error('Сессия не найдена. Возможно, ссылка устарела — попросите новую.')
  }

  if (!response.ok) {
    await parseError(response, 'Не удалось загрузить сессию')
  }

  return response.json()
}

export async function joinSession(sessionId: string, userName: string): Promise<SessionInfo> {
  const response = await apiFetch(
    `${API_URL}/api/sessions/${encodeURIComponent(sessionId)}/join`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName }),
    },
  )

  if (response.status === 404) {
    throw new Error('Сессия не найдена. Возможно, ссылка устарела — попросите новую.')
  }

  if (response.status === 409) {
    throw new Error('Это имя уже занято в сессии. Выберите другое.')
  }

  if (!response.ok) {
    await parseError(response, 'Не удалось войти в сессию')
  }

  return response.json()
}
