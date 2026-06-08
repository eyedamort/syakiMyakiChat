import { useState } from 'react'
import './InvitePanel.css'

interface InvitePanelProps {
  sessionId: string
}

export function InvitePanel({ sessionId }: InvitePanelProps) {
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

  return (
    <div className="invite-panel">
      <span className="invite-label">🔗 Пригласить по ссылке</span>
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
    </div>
  )
}
