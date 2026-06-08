import './FeaturePills.css'

const FEATURES = [
  { icon: '⚡', label: 'Синхронизация в реальном времени' },
  { icon: '🖼', label: 'Картинки и вставка из буфера' },
  { icon: '👀', label: 'Курсоры и выделения друзей' },
]

export function FeaturePills() {
  return (
    <ul className="feature-pills">
      {FEATURES.map((feature) => (
        <li key={feature.label} className="feature-pill">
          <span className="feature-pill__icon" aria-hidden>
            {feature.icon}
          </span>
          {feature.label}
        </li>
      ))}
    </ul>
  )
}
