import type { EditorStateMessage, EditorSyncMessage, EditorUpdateMessage } from '../types/sync.js'
import type { DocumentSnapshot } from './persistence.js'

const DEFAULT_HTML = '<p></p>'

export class DocumentStore {
  private html = DEFAULT_HTML
  private text = ''
  private updatedAt = new Date().toISOString()

  loadSnapshot(snapshot: DocumentSnapshot) {
    this.html = snapshot.html || DEFAULT_HTML
    this.text = snapshot.text ?? ''
    this.updatedAt = snapshot.updatedAt || new Date().toISOString()
  }

  toSnapshot(): DocumentSnapshot {
    return {
      html: this.html,
      text: this.text,
      updatedAt: this.updatedAt,
    }
  }

  getState(): EditorStateMessage {
    return {
      type: 'editor.state',
      html: this.html,
      text: this.text,
      updatedAt: this.updatedAt,
    }
  }

  applyUpdate(message: EditorUpdateMessage): EditorSyncMessage | null {
    if (message.type !== 'editor.update') return null
    if (!message.clientId || typeof message.html !== 'string') return null

    const incomingTime = Date.parse(message.updatedAt)
    const currentTime = Date.parse(this.updatedAt)
    if (!Number.isNaN(incomingTime) && !Number.isNaN(currentTime) && incomingTime < currentTime) {
      return null
    }

    this.html = message.html
    this.text = message.text ?? ''
    this.updatedAt = message.updatedAt || new Date().toISOString()

    return {
      type: 'editor.sync',
      clientId: message.clientId,
      html: this.html,
      text: this.text,
      updatedAt: this.updatedAt,
    }
  }
}
