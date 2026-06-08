import type { SyncStatus } from '../types/sync'
import './SessionLounge.css'

const TIPS = [
  {
    icon: '📋',
    title: 'Вставка',
    text: 'Картинки — перетащите в редактор или Ctrl+V из буфера.',
  },
  {
    icon: '🤙',
    title: 'Друзья',
    text: 'Скопируйте ссылку сверху и позовите друзей в сессию.',
  },
  {
    icon: '🐱',
    title: 'Картинки',
    text: 'Клик по изображению виден всем — рамка с именем появится у других.',
  },
  {
    icon: '✨',
    title: 'Курсоры',
    text: 'Наведите на цветной курсор — увидите, кто где пишет.',
  },
]

interface SessionLoungeProps {
  othersCount: number
  syncStatus: SyncStatus
}

export function SessionLounge({ othersCount, syncStatus }: SessionLoungeProps) {
  return (
    <aside className="session-lounge" aria-label="Подсказки">
      <div className="session-lounge__header">
        <h2 className="session-lounge__title">Уютная зона котика 🤙</h2>
        <p className="session-lounge__meta">
          {othersCount > 0
            ? `С вами ещё ${othersCount} ${pluralize(othersCount, 'человек', 'человека', 'человек')}`
            : 'Пока только вы — отправьте ссылку друзьям'}
          {syncStatus === 'synced' && ' · всё синхронизировано'}
        </p>
      </div>

      <div className="session-lounge__grid">
        {TIPS.map((tip) => (
          <article key={tip.title} className="lounge-card">
            <span className="lounge-card__icon" aria-hidden>
              {tip.icon}
            </span>
            <h3 className="lounge-card__title">{tip.title}</h3>
            <p className="lounge-card__text">{tip.text}</p>
          </article>
        ))}
      </div>
    </aside>
  )
}

function pluralize(count: number, one: string, few: string, many: string) {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few
  return many
}
