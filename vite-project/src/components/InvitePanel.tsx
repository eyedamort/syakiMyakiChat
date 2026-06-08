import { useState } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'
import './InvitePanel.css'

interface InvitePanelProps {
  sessionId: string
}

export function InvitePanel({ sessionId }: InvitePanelProps) {
  const isMobile = useMediaQuery('(max-width: 640px)')
  const inviteUrl = `${window.location.origin}/join/${sessionId}`
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select input
    }
  }

  const body = (
    <>
      {!isMobile && <span className="invite-label">🔗 Пригласить по ссылке</span>}
      <div className="invite-row">
        <input
          className="invite-input"
          type="text"
          readOnly
          value={inviteUrl}
          onFocus={(e) => e.target.select()}
        />
        <button type="button" className="invite-copy-btn" onClick={handleCopy}>
          {copied ? 'Скопировано' : 'Копировать'}
        </button>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <details className="invite-panel invite-panel--collapsible">
        <summary className="invite-panel__summary">🔗 Пригласить друзей</summary>
        <div className="invite-panel__body">{body}</div>
      </details>
    )
  }

  return <div className="invite-panel">{body}</div>
}
