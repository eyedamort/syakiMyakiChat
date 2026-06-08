import type { ReactNode } from 'react'
import { LavaBackground } from './LavaBackground'
import './PageShell.css'

interface PageShellProps {
  children: ReactNode
  variant?: 'centered' | 'app'
}

export function PageShell({ children, variant = 'centered' }: PageShellProps) {
  return (
    <div className={`page-shell page-shell--${variant}`}>
      <LavaBackground />
      {children}
    </div>
  )
}
