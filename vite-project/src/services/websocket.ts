import { SYNC_DEBOUNCE_MS, WS_ENABLED, buildWsUrl } from '../config'
import type {
  EditorCursorMessage,
  EditorUpdateMessage,
  SendUpdateResult,
  SessionUser,
  WsIncomingMessage,
} from '../types/sync'

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'

type StatusListener = (status: ConnectionStatus) => void
type MessageListener = (message: WsIncomingMessage) => void
type UsersListener = (users: SessionUser[]) => void
type CursorListener = (cursor: EditorCursorMessage) => void
type NameTakenListener = () => void

const WS_CLOSE_NAME_TAKEN = 4409

const RECONNECT_BASE_MS = 1000
const RECONNECT_MAX_MS = 10000

class WebSocketService {
  private socket: WebSocket | null = null
  private status: ConnectionStatus = 'idle'
  private readonly clientId = crypto.randomUUID()
  private sessionId: string | null = null
  private userName: string | null = null
  private wsUrl: string | null = null
  private statusListeners = new Set<StatusListener>()
  private messageListeners = new Set<MessageListener>()
  private usersListeners = new Set<UsersListener>()
  private cursorListeners = new Set<CursorListener>()
  private nameTakenListeners = new Set<NameTakenListener>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempt = 0
  private intentionalClose = false
  private pendingPayload: EditorUpdateMessage | null = null

  getClientId(): string {
    return this.clientId
  }

  getStatus(): ConnectionStatus {
    return this.status
  }

  isEnabled(): boolean {
    return WS_ENABLED
  }

  getDebounceMs(): number {
    return SYNC_DEBOUNCE_MS
  }

  configure(sessionId: string, userName: string) {
    const changed =
      this.sessionId !== sessionId ||
      this.userName !== userName

    this.sessionId = sessionId
    this.userName = userName
    this.wsUrl = buildWsUrl(sessionId, userName, this.clientId)

    if (changed && this.socket) {
      this.intentionalClose = true
      this.socket.close()
      this.socket = null
      this.intentionalClose = false
    }
  }

  subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener)
    listener(this.status)
    return () => this.statusListeners.delete(listener)
  }

  subscribeMessages(listener: MessageListener): () => void {
    this.messageListeners.add(listener)
    return () => this.messageListeners.delete(listener)
  }

  subscribeUsers(listener: UsersListener): () => void {
    this.usersListeners.add(listener)
    return () => this.usersListeners.delete(listener)
  }

  subscribeCursors(listener: CursorListener): () => void {
    this.cursorListeners.add(listener)
    return () => this.cursorListeners.delete(listener)
  }

  subscribeNameTaken(listener: NameTakenListener): () => void {
    this.nameTakenListeners.add(listener)
    return () => this.nameTakenListeners.delete(listener)
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status
    this.statusListeners.forEach((listener) => listener(status))
  }

  private dispatchMessage(raw: string) {
    try {
      const data = JSON.parse(raw) as WsIncomingMessage

      if (data.type === 'session.users') {
        this.usersListeners.forEach((listener) => listener(data.users))
        return
      }

      if (data.type === 'editor.cursor') {
        this.cursorListeners.forEach((listener) => listener(data))
        return
      }

      if (data.type === 'editor.sync' || data.type === 'editor.state') {
        this.messageListeners.forEach((listener) => listener(data))
      }
    } catch {
      // ignore
    }
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private scheduleReconnect() {
    if (!WS_ENABLED || this.intentionalClose || !this.wsUrl) return

    this.clearReconnectTimer()

    const delay = Math.min(
      RECONNECT_BASE_MS * 2 ** this.reconnectAttempt,
      RECONNECT_MAX_MS,
    )
    this.reconnectAttempt++

    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, delay)
  }

  private flushPending() {
    if (!this.pendingPayload || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return
    }

    this.socket.send(JSON.stringify(this.pendingPayload))
    this.pendingPayload = null
  }

  connect(): void {
    if (!WS_ENABLED || !this.wsUrl) {
      this.setStatus('idle')
      return
    }

    if (this.socket?.readyState === WebSocket.OPEN) return
    if (this.socket?.readyState === WebSocket.CONNECTING) return

    this.intentionalClose = false
    this.clearReconnectTimer()
    this.setStatus('connecting')

    const socket = new WebSocket(this.wsUrl)
    this.socket = socket

    socket.addEventListener('open', () => {
      this.reconnectAttempt = 0
      this.setStatus('connected')
      this.flushPending()
    })

    socket.addEventListener('message', (event) => {
      if (typeof event.data === 'string') {
        this.dispatchMessage(event.data)
      }
    })

    socket.addEventListener('close', (event) => {
      this.socket = null

      if (event.code === WS_CLOSE_NAME_TAKEN) {
        this.intentionalClose = true
        this.clearReconnectTimer()
        this.setStatus('error')
        this.nameTakenListeners.forEach((listener) => listener())
        return
      }

      this.setStatus('disconnected')
      this.scheduleReconnect()
    })

    socket.addEventListener('error', () => {
      this.setStatus('error')
    })
  }

  disconnect(): void {
    this.intentionalClose = true
    this.clearReconnectTimer()
    this.pendingPayload = null
    this.socket?.close()
    this.socket = null
    this.setStatus('disconnected')
  }

  sendCursor(from: number, to: number, imagePos = -1): void {
    if (!WS_ENABLED || !this.userName) return
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return

    const payload: EditorCursorMessage = {
      type: 'editor.cursor',
      clientId: this.clientId,
      userName: this.userName,
      from,
      to,
      imagePos,
      updatedAt: new Date().toISOString(),
    }

    this.socket.send(JSON.stringify(payload))
  }

  sendUpdate(html: string, text: string): SendUpdateResult {
    const payload: EditorUpdateMessage = {
      type: 'editor.update',
      clientId: this.clientId,
      html,
      text,
      updatedAt: new Date().toISOString(),
    }

    if (!WS_ENABLED) {
      return { sent: false, payload, reason: 'disabled' }
    }

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.pendingPayload = payload
      if (this.status === 'disconnected' || this.status === 'error') {
        this.connect()
      }
      return { sent: false, payload, reason: 'offline' }
    }

    this.socket.send(JSON.stringify(payload))
    this.pendingPayload = null
    return { sent: true, payload }
  }
}

export const webSocketService = new WebSocketService()
