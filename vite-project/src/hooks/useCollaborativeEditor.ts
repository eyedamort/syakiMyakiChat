import { useCallback, useEffect, useRef, useState } from 'react'
import { SYNC_DEBOUNCE_MS } from '../config'
import { webSocketService } from '../services/websocket'
import { colorForClient } from '../utils/cursorColor'
import type { RemoteCursor, SessionUser, SyncStatus } from '../types/sync'

const CURSOR_THROTTLE_MS = 50

interface UseCollaborativeEditorOptions {
  sessionId: string
  userName: string
}

export function useCollaborativeEditor({ sessionId, userName }: UseCollaborativeEditorOptions) {
  const [html, setHtml] = useState('<p></p>')
  const [text, setText] = useState('')
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [participants, setParticipants] = useState<SessionUser[]>([])
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cursorThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingCursorRef = useRef<{ from: number; to: number; imagePos: number } | null>(null)
  const htmlRef = useRef(html)
  const textRef = useRef(text)

  htmlRef.current = html
  textRef.current = text

  useEffect(() => {
    webSocketService.configure(sessionId, userName)
    webSocketService.connect()

    const unsubscribeMessages = webSocketService.subscribeMessages((message) => {
      if (message.type === 'editor.sync' && message.clientId === webSocketService.getClientId()) {
        return
      }

      if (message.type === 'editor.sync' || message.type === 'editor.state') {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
          debounceRef.current = null
        }

        htmlRef.current = message.html
        textRef.current = message.text
        setHtml(message.html)
        setText(message.text)
        setSyncStatus('synced')
      }
    })

    const unsubscribeUsers = webSocketService.subscribeUsers(setParticipants)

    const unsubscribeCursors = webSocketService.subscribeCursors((message) => {
      if (message.clientId === webSocketService.getClientId()) return

      setRemoteCursors((prev) => {
        const next = prev.filter((c) => c.clientId !== message.clientId)

        if (message.from >= 0 || message.imagePos >= 0) {
          next.push({
            clientId: message.clientId,
            userName: message.userName,
            from: message.from,
            to: message.to,
            imagePos: message.imagePos ?? -1,
          })
        }

        return next
      })
    })

    return () => {
      unsubscribeMessages()
      unsubscribeUsers()
      unsubscribeCursors()
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (cursorThrottleRef.current) clearTimeout(cursorThrottleRef.current)
      setRemoteCursors([])
    }
  }, [sessionId, userName])

  const sendContent = useCallback((nextHtml: string, nextText: string) => {
    const result = webSocketService.sendUpdate(nextHtml, nextText)

    if (result.sent) {
      setSyncStatus('synced')
    } else if (result.reason === 'disabled') {
      setSyncStatus('disabled')
    } else if (webSocketService.getStatus() === 'connecting') {
      setSyncStatus('pending')
    } else {
      setSyncStatus('offline')
    }
  }, [])

  const handleChange = useCallback((nextHtml: string, nextText: string, immediate = false) => {
    htmlRef.current = nextHtml
    textRef.current = nextText
    setHtml(nextHtml)
    setText(nextText)

    if (immediate) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      setSyncStatus('pending')
      sendContent(nextHtml, nextText)
      return
    }

    setSyncStatus('pending')

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      sendContent(nextHtml, nextText)
    }, SYNC_DEBOUNCE_MS)
  }, [sendContent])

  const handleSelectionChange = useCallback((from: number, to: number, imagePos: number) => {
    pendingCursorRef.current = { from, to, imagePos }

    if (cursorThrottleRef.current) return

    webSocketService.sendCursor(from, to, imagePos)

    cursorThrottleRef.current = setTimeout(() => {
      cursorThrottleRef.current = null
      if (pendingCursorRef.current) {
        const pending = pendingCursorRef.current
        webSocketService.sendCursor(pending.from, pending.to, pending.imagePos)
      }
    }, CURSOR_THROTTLE_MS)
  }, [])

  const remoteCursorsWithColor = remoteCursors.map((cursor) => ({
    ...cursor,
    color: colorForClient(cursor.clientId),
  }))

  return {
    html,
    text,
    handleChange,
    handleSelectionChange,
    syncStatus,
    participants,
    remoteCursors: remoteCursorsWithColor,
  }
}
