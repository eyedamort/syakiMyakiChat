import type { ReactNode } from 'react'
import './PageShell.css'

interface PageShellProps {
  children: ReactNode
  variant?: 'centered' | 'app'
}

export function PageShell({ children, variant = 'centered' }: PageShellProps) {
  return (
    <div className={`page-shell page-shell--${variant}`}>
      <div className="page-shell__decor" aria-hidden>
        <div className="page-shell__blob page-shell__blob--1" />
        <div className="page-shell__blob page-shell__blob--2" />
        <div className="page-shell__blob page-shell__blob--3" />
        <div className="page-shell__paws">🐾 🐾 🐾 🐾 🐾 🐾</div>
      </div>
      {children}
    </div>
  )
}
