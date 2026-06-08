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

export interface SessionUsersMessage {
  type: 'session.users'
  users: SessionUser[]
}

export interface SessionUser {
  clientId: string
  userName: string
}

export type ClientMessage = EditorUpdateMessage | EditorCursorMessage

export type ServerMessage =
  | EditorSyncMessage
  | EditorStateMessage
  | SessionUsersMessage
  | EditorCursorMessage
