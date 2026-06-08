import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { WysiwygEditor } from '../components/WysiwygEditor'
import { useCollaborativeEditor } from '../hooks/useCollaborativeEditor'
import { webSocketService } from '../services/websocket'
import type { ConnectionStatus } from '../services/websocket'
import type { SyncStatus } from '../types/sync'
import { getUserName } from '../utils/user'
import './SessionPopoutPage.css'

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

export function SessionPopoutPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const userName = getUserName()

  if (!sessionId) {
    return <Navigate to="/" replace />
  }

  if (!userName) {
    return <Navigate to={`/join/${sessionId}`} replace />
  }

  return <SessionPopoutEditor sessionId={sessionId} userName={userName} />
}

function SessionPopoutEditor({
  sessionId,
  userName,
}: {
  sessionId: string
  userName: string
}) {
  const [wsStatus, setWsStatus] = useState<ConnectionStatus>('idle')
  const { html, handleChange, handleSelectionChange, syncStatus, remoteCursors } =
    useCollaborativeEditor({ sessionId, userName })

  useEffect(() => webSocketService.subscribeStatus(setWsStatus), [])

  useEffect(() => {
    document.title = `Редактор · ${userName}`
    return () => {
      document.title = 'Сяки Мяки чат'
    }
  }, [userName])

  const syncLabel = SYNC_LABELS[syncStatus]

  return (
    <div className="popout-page">
      <header className="popout-header">
        <div>
          <h1 className="popout-title">Сяки Мяки чат</h1>
          <p className="popout-subtitle">{userName}</p>
        </div>
        <div className="popout-status">
          <span className="popout-ws" data-status={wsStatus}>
            {CONNECTION_LABELS[wsStatus]}
          </span>
          {syncLabel && (
            <span className="popout-sync" data-sync={syncStatus}>
              {syncLabel}
            </span>
          )}
          <button type="button" className="popout-close-btn" onClick={() => window.close()}>
            Закрыть окно
          </button>
        </div>
      </header>
      <div className="popout-editor">
        <WysiwygEditor
          content={html}
          onChange={handleChange}
          onSelectionChange={handleSelectionChange}
          remoteCursors={remoteCursors}
          placeholder="Введите текст…"
        />
      </div>
    </div>
  )
}
