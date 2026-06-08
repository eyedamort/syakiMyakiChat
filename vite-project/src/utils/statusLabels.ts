import type { ConnectionStatus } from '../services/websocket'
import type { SyncStatus } from '../types/sync'

const CONNECTION_FULL: Record<ConnectionStatus, string> = {
  idle: 'Соединение: Ожидание',
  connecting: 'Соединение: Подключение…',
  connected: 'Соединение: Подключено',
  disconnected: 'Соединение: Отключено',
  error: 'Соединение: Ошибка',
}

const CONNECTION_COMPACT: Record<ConnectionStatus, string> = {
  idle: 'Ожидание',
  connecting: 'Подключение…',
  connected: 'Онлайн',
  disconnected: 'Офлайн',
  error: 'Ошибка',
}

const SYNC_FULL: Record<SyncStatus, string> = {
  idle: '',
  pending: 'Сохранение…',
  synced: 'Синхронизировано',
  offline: 'Нет соединения',
  disabled: 'Локально',
}

const SYNC_COMPACT: Record<SyncStatus, string> = {
  idle: '',
  pending: 'Сохранение…',
  synced: 'Синхр.',
  offline: 'Офлайн',
  disabled: 'Локально',
}

export function connectionLabel(status: ConnectionStatus, compact: boolean): string {
  return compact ? CONNECTION_COMPACT[status] : CONNECTION_FULL[status]
}

export function syncLabel(status: SyncStatus, compact: boolean): string {
  return compact ? SYNC_COMPACT[status] : SYNC_FULL[status]
}
