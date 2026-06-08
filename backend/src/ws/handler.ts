import type { WebSocket } from 'ws'
import { sessionStore } from '../store/sessionStore.js'
import type { ClientMessage, EditorCursorMessage } from '../types/sync.js'

function parseClientMessage(raw: unknown): ClientMessage | null {
  try {
    const data = JSON.parse(String(raw)) as ClientMessage
    if (data?.type === 'editor.update' || data?.type === 'editor.cursor') {
      return data
    }
  } catch {
    // ignore
  }
  return null
}

function broadcastUsers(sessionId: string) {
  const session = sessionStore.get(sessionId)
  if (!session) return

  session.connections.broadcast({
    type: 'session.users',
    users: session.getUsers(),
  })
}

function broadcastCursorLeave(sessionId: string, clientId: string, userName: string) {
  const session = sessionStore.get(sessionId)
  if (!session) return

  const message: EditorCursorMessage = {
    type: 'editor.cursor',
    clientId,
    userName,
    from: -1,
    to: -1,
    imagePos: -1,
    updatedAt: new Date().toISOString(),
  }

  session.connections.broadcast(message)
}

export function handleConnection(
  socket: WebSocket,
  sessionId: string,
  userName: string,
  clientId: string,
) {
  const session = sessionStore.get(sessionId)
  if (!session) {
    socket.close(4004, 'Session not found')
    return
  }

  if (session.isNameTaken(userName)) {
    socket.close(4409, 'Name already in use')
    return
  }

  session.connections.add(socket)
  session.participants.set(clientId, userName)

  session.connections.send(socket, session.document.getState())
  session.connections.send(socket, {
    type: 'session.users',
    users: session.getUsers(),
  })
  session.connections.broadcast(
    { type: 'session.users', users: session.getUsers() },
    socket,
  )

  socket.on('message', (raw) => {
    const message = parseClientMessage(raw)
    if (!message) return

    if (message.type === 'editor.cursor') {
      const cursorMessage: EditorCursorMessage = {
        ...message,
        userName: session.participants.get(message.clientId) ?? userName,
        imagePos: message.imagePos ?? -1,
      }
      session.connections.broadcast(cursorMessage, socket)
      return
    }

    const sync = session.document.applyUpdate(message)
    if (!sync) return

    sessionStore.persistDocument(sessionId)
    session.connections.broadcast(sync, socket)
  })

  const cleanup = () => {
    session.connections.remove(socket)
    session.participants.delete(clientId)
    broadcastUsers(sessionId)
    broadcastCursorLeave(sessionId, clientId, userName)
  }

  socket.on('close', cleanup)
  socket.on('error', cleanup)
}
