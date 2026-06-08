import './CatLogo.css'

interface CatLogoProps {
  size?: number
  className?: string
  animated?: boolean
}

export function CatLogo({ size = 56, className = '', animated = true }: CatLogoProps) {
  return (
    <img
      src="/logo-cat.png"
      alt=""
      width={size}
      height={size}
      className={`cat-logo${animated ? ' cat-logo--animated' : ''} ${className}`.trim()}
      draggable={false}
    />
  )
}
