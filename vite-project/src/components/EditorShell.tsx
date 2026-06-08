import type { ReactNode } from 'react'
import { useFullscreen } from '../hooks/useFullscreen'
import './EditorShell.css'

interface EditorShellProps {
  sessionId: string
  children: ReactNode
}

export function EditorShell({ sessionId, children }: EditorShellProps) {
  const { ref, isFullscreen, toggle } = useFullscreen<HTMLDivElement>()

  const openPopout = () => {
    const url = `${window.location.origin}/session/${sessionId}/popout`
    window.open(
      url,
      `vibe-editor-${sessionId}`,
      'noopener,noreferrer,width=1200,height=800',
    )
  }

  return (
    <div className={`editor-area${isFullscreen ? ' editor-area--fullscreen' : ''}`} ref={ref}>
      <div className="editor-area__toolbar">
        <button type="button" className="editor-area__btn" onClick={toggle}>
          {isFullscreen ? '⊟ Свернуть' : '⛶ На весь экран'}
        </button>
        <button type="button" className="editor-area__btn" onClick={openPopout}>
          ↗ Отдельное окно
        </button>
      </div>
      <div className="editor-area__content">{children}</div>
    </div>
  )
}
