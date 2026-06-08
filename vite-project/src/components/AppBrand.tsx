import { CatLogo } from './CatLogo'
import './AppBrand.css'

interface AppBrandProps {
  title?: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function AppBrand({
  title = 'Сяки Мяки чат',
  subtitle,
  size = 'md',
  className = '',
}: AppBrandProps) {
  const logoSize = size === 'lg' ? 96 : size === 'sm' ? 44 : 56

  return (
    <div className={`app-brand app-brand--${size} ${className}`.trim()}>
      <CatLogo size={logoSize} animated={size !== 'sm'} />
      <div className="app-brand__text">
        <h1 className="app-brand__title">{title}</h1>
        {subtitle && <p className="app-brand__subtitle">{subtitle}</p>}
      </div>
    </div>
  )
}
