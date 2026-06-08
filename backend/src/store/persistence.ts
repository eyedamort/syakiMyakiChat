import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DATA_FILE = join(dirname(fileURLToPath(import.meta.url)), '../../data/sessions.json')

export interface DocumentSnapshot {
  html: string
  text: string
  updatedAt: string
}

export interface SessionSnapshot {
  id: string
  hostName: string
  createdAt: string
  document: DocumentSnapshot
}

interface StoreFile {
  sessions: SessionSnapshot[]
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

function ensureDataDir() {
  mkdirSync(dirname(DATA_FILE), { recursive: true })
}

export function loadSessions(): SessionSnapshot[] {
  try {
    const raw = readFileSync(DATA_FILE, 'utf8')
    const data = JSON.parse(raw) as StoreFile
    return Array.isArray(data.sessions) ? data.sessions : []
  } catch {
    return []
  }
}

export function saveSessions(sessions: SessionSnapshot[]) {
  ensureDataDir()
  const data: StoreFile = { sessions }
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
}

export function scheduleSaveSessions(sessions: SessionSnapshot[]) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveTimer = null
    saveSessions(sessions)
  }, 500)
}
