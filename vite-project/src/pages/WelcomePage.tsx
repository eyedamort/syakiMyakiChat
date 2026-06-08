import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppBrand } from '../components/AppBrand'
import { FeaturePills } from '../components/FeaturePills'
import { PageShell } from '../components/PageShell'
import { createSession } from '../services/api'
import { setUserName, getUserName } from '../utils/user'
import './WelcomePage.css'

export function WelcomePage() {
  const navigate = useNavigate()
  const [name, setName] = useState(getUserName() ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const trimmed = name.trim()
    if (!trimmed) {
      setError('Введите ваше имя')
      return
    }

    setLoading(true)
    setError('')

    try {
      setUserName(trimmed)
      const session = await createSession(trimmed)
      navigate(`/session/${session.sessionId}`, { state: { session } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания сессии')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShell variant="centered">
      <div className="welcome-card">
        <AppBrand
          size="lg"
          subtitle="Совместное редактирование в реальном времени"
        />

        <FeaturePills />

        <form className="welcome-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="user-name">
            Как вас зовут?
          </label>
          <input
            id="user-name"
            type="text"
            className="text-input"
            placeholder="Ваше имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={64}
          />

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="primary-btn" disabled={loading || !name.trim()}>
            {loading ? 'Создание…' : 'Создать сессию'}
          </button>
        </form>
      </div>
    </PageShell>
  )
}
