import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppBrand } from '../components/AppBrand'
import { EditorShell } from '../components/EditorShell'
import { WysiwygEditor } from '../components/WysiwygEditor'
import { InvitePanel } from '../components/InvitePanel'
import { PageShell } from '../components/PageShell'
import { SessionLounge } from '../components/SessionLounge'
import { useCollaborativeEditor } from '../hooks/useCollaborativeEditor'
import { getSession } from '../services/api'
import { webSocketService } from '../services/websocket'
import type { ConnectionStatus } from '../services/websocket'
import type { SessionInfo, SyncStatus } from '../types/sync'
import { getUserName } from '../utils/user'
import '../App.css'
import './WelcomePage.css'

const CONNECTION_LABELS: Record<ConnectionStatus, string> = {
  idle: 'Соединение: Ожидание',
  connecting: 'Соединение: Подключение…',
  connected: 'Соединение: Подключено',
  disconnected: 'Соединение: Отключено',
  error: 'Соединение: Ошибка',
}

const SYNC_LABELS: Record<SyncStatus, string> = {
  idle: '',
  pending: 'Сохранение…',
  synced: 'Синхронизировано',
  offline: 'Нет соединения',
  disabled: 'Локально',
}

interface LocationState {
  session?: SessionInfo
}

export function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const userName = getUserName()

  if (!sessionId) {
    return <Navigate to="/" replace />
  }

  if (!userName) {
    return <Navigate to={`/join/${sessionId}`} replace />
  }

  return <SessionEditor sessionId={sessionId} userName={userName} />
}

function SessionEditor({ sessionId, userName }: { sessionId: string; userName: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as LocationState | null
  const cachedSessionRef = useRef(
    locationState?.session?.sessionId === sessionId ? locationState.session : null,
  )
  const hasCachedSession = cachedSessionRef.current !== null

  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(cachedSessionRef.current)
  const [loadError, setLoadError] = useState('')
  const [wsStatus, setWsStatus] = useState<ConnectionStatus>('idle')
  const {
    html,
    handleChange,
    handleSelectionChange,
    syncStatus,
    participants,
    remoteCursors,
  } = useCollaborativeEditor({
    sessionId,
    userName,
  })

  useEffect(() => {
    let cancelled = false

    const load = async (attempt = 0) => {
      try {
        const info = await getSession(sessionId)
        if (!cancelled) {
          setSessionInfo(info)
          setLoadError('')
        }
      } catch (err) {
        if (cancelled) return

        if (attempt < 4) {
          await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)))
          return load(attempt + 1)
        }

        if (!hasCachedSession) {
          setLoadError(err instanceof Error ? err.message : 'Ошибка')
        }
      }
    }

    setLoadError('')
    if (cachedSessionRef.current) {
      setSessionInfo(cachedSessionRef.current)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [sessionId, hasCachedSession])

  useEffect(() => webSocketService.subscribeStatus(setWsStatus), [])

  useEffect(() => {
    const unsubscribe = webSocketService.subscribeNameTaken(() => {
      webSocketService.disconnect()
      navigate(`/join/${sessionId}`, {
        replace: true,
        state: { nameError: 'Это имя уже занято в сессии. Выберите другое.' },
      })
    })

    return unsubscribe
  }, [sessionId, navigate])

  const syncLabel = SYNC_LABELS[syncStatus]

  const handleLeaveSession = () => {
    webSocketService.disconnect()
    navigate('/')
  }

  if (loadError && !hasCachedSession) {
    return (
      <PageShell variant="centered">
        <div className="welcome-card">
          <AppBrand size="lg" title="Ошибка" />
          <p className="form-error join-error">{loadError}</p>
          <Link to="/" className="primary-btn session-error-link">
            Создать новую сессию
          </Link>
        </div>
      </PageShell>
    )
  }

  const othersCount = participants.filter((p) => p.userName !== userName).length

  return (
    <PageShell variant="app">
      <div className="app">
      <header className="app-header">
        <AppBrand
          size="sm"
          subtitle={`${userName}${sessionInfo ? ` · сессия ${sessionInfo.hostName}` : ''}`}
        />
        <div className="status-group">
          <div className="ws-status" data-status={wsStatus}>
            <span className="ws-dot" />
            <span>{CONNECTION_LABELS[wsStatus]}</span>
          </div>
          {syncLabel && (
            <div className="sync-status" data-sync={syncStatus}>
              {syncLabel}
            </div>
          )}
          <button type="button" className="exit-session-btn" onClick={handleLeaveSession}>
            Выйти из сессии
          </button>
        </div>
      </header>

      <InvitePanel sessionId={sessionId} />

      {participants.length > 0 && (
        <div className="participants">
          <span className="participants-label">В сессии:</span>
          {participants.map((user) => (
            <span
              key={user.clientId}
              className={`participant-badge${user.userName === userName ? ' is-you' : ''}`}
            >
              {user.userName}
              {user.userName === userName ? ' (вы)' : ''}
            </span>
          ))}
        </div>
      )}

      <div className="editor-form">
        <EditorShell sessionId={sessionId}>
          <WysiwygEditor
            content={html}
            onChange={handleChange}
            onSelectionChange={handleSelectionChange}
            remoteCursors={remoteCursors}
            placeholder="Введите текст…"
          />
        </EditorShell>
        <SessionLounge othersCount={othersCount} syncStatus={syncStatus} />
      </div>
      </div>
    </PageShell>
  )
}
