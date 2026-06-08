import { randomUUID } from 'node:crypto'
import { DocumentStore } from './documentStore.js'
import {
  loadSessions,
  saveSessions,
  scheduleSaveSessions,
  type SessionSnapshot,
} from './persistence.js'
import { ConnectionManager } from '../ws/connectionManager.js'

export class Session {
  readonly id: string
  readonly hostName: string
  readonly createdAt: string
  readonly document = new DocumentStore()
  readonly connections = new ConnectionManager()
  readonly participants = new Map<string, string>()

  constructor(hostName: string, id?: string, createdAt?: string) {
    this.id = id ?? randomUUID()
    this.hostName = hostName
    this.createdAt = createdAt ?? new Date().toISOString()
  }

  getUsers() {
    return [...this.participants.entries()].map(([clientId, userName]) => ({
      clientId,
      userName,
    }))
  }

  isNameTaken(userName: string, exceptClientId?: string): boolean {
    const normalized = userName.trim().toLowerCase()
    if (!normalized) return false

    for (const [clientId, participantName] of this.participants) {
      if (exceptClientId && clientId === exceptClientId) continue
      if (participantName.trim().toLowerCase() === normalized) return true
    }

    return false
  }

  toSnapshot(): SessionSnapshot {
    return {
      id: this.id,
      hostName: this.hostName,
      createdAt: this.createdAt,
      document: this.document.toSnapshot(),
    }
  }
}

class SessionStore {
  private sessions = new Map<string, Session>()

  constructor() {
    for (const snapshot of loadSessions()) {
      const session = new Session(snapshot.hostName, snapshot.id, snapshot.createdAt)
      session.document.loadSnapshot(snapshot.document)
      this.sessions.set(session.id, session)
    }
  }

  get count() {
    return this.sessions.size
  }

  private snapshots(): SessionSnapshot[] {
    return [...this.sessions.values()].map((session) => session.toSnapshot())
  }

  create(hostName: string): Session {
    const session = new Session(hostName)
    this.sessions.set(session.id, session)
    saveSessions(this.snapshots())
    return session
  }

  get(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId)
  }

  persistDocument(sessionId: string) {
    if (!this.sessions.has(sessionId)) return
    scheduleSaveSessions(this.snapshots())
  }
}

export const sessionStore = new SessionStore()
