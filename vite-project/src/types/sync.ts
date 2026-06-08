export interface EditorUpdateMessage {
  type: 'editor.update'
  clientId: string
  html: string
  text: string
  updatedAt: string
}

export interface EditorCursorMessage {
  type: 'editor.cursor'
  clientId: string
  userName: string
  from: number
  to: number
  imagePos: number
  updatedAt: string
}

export interface EditorSyncMessage {
  type: 'editor.sync'
  clientId: string
  html: string
  text: string
  updatedAt: string
}

export interface EditorStateMessage {
  type: 'editor.state'
  html: string
  text: string
  updatedAt: string
}

export interface SessionUser {
  clientId: string
  userName: string
}

export interface SessionUsersMessage {
  type: 'session.users'
  users: SessionUser[]
}

export type WsIncomingMessage =
  | EditorSyncMessage
  | EditorStateMessage
  | SessionUsersMessage
  | EditorCursorMessage

export type WsOutgoingMessage = EditorUpdateMessage | EditorCursorMessage

export interface RemoteCursor {
  clientId: string
  userName: string
  from: number
  to: number
  imagePos: number
}

export type SyncStatus =
  | 'idle'
  | 'pending'
  | 'synced'
  | 'offline'
  | 'disabled'

export interface SendUpdateResult {
  sent: boolean
  payload: EditorUpdateMessage
  reason?: 'disabled' | 'offline'
}

export interface SessionInfo {
  sessionId: string
  hostName: string
  createdAt: string
}
