import WebSocket from 'ws'
import type { ServerMessage } from '../types/sync.js'

export class ConnectionManager {
  private clients = new Set<WebSocket>()

  add(socket: WebSocket) {
    this.clients.add(socket)
  }

  remove(socket: WebSocket) {
    this.clients.delete(socket)
  }

  get size() {
    return this.clients.size
  }

  send(socket: WebSocket, message: ServerMessage) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message))
    }
  }

  broadcast(message: ServerMessage, except?: WebSocket) {
    const payload = JSON.stringify(message)

    for (const client of this.clients) {
      if (client === except) continue
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload)
      }
    }
  }
}
