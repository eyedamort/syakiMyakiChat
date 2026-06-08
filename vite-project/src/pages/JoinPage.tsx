import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { AppBrand } from '../components/AppBrand'
import { FeaturePills } from '../components/FeaturePills'
import { PageShell } from '../components/PageShell'
import { getSession, joinSession } from '../services/api'
import { setUserName, getUserName } from '../utils/user'
import './WelcomePage.css'

interface JoinLocationState {
  nameError?: string
}

export function JoinPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as JoinLocationState | null
  const [name, setName] = useState(getUserName() ?? '')
  const [error, setError] = useState(locationState?.nameError ?? '')
  const [checking, setChecking] = useState(true)
  const [sessionValid, setSessionValid] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      setChecking(false)
      return
    }

    let cancelled = false

    const verify = async (attempt = 0) => {
      try {
        await getSession(sessionId)
        if (!cancelled) {
          setSessionValid(true)
          setChecking(false)
        }
      } catch (err) {
        if (cancelled) return

        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)))
          return verify(attempt + 1)
        }

        setSessionValid(false)
        setChecking(false)
        setError(err instanceof Error ? err.message : 'Сессия недоступна')
      }
    }

    verify()

    return () => {
      cancelled = true
    }
  }, [sessionId])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const trimmed = name.trim()
    if (!trimmed) {
      setError('Введите ваше имя')
      return
    }

    if (!sessionId) return

    setError('')
    setUserName(trimmed)

    try {
      const session = await joinSession(sessionId, trimmed)
      navigate(`/session/${sessionId}`, { state: { session } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти в сессию')
    }
  }

  if (checking) {
    return (
      <PageShell variant="centered">
        <div className="welcome-card">
          <AppBrand size="lg" title="Вход в сессию" subtitle="Проверяем ссылку…" />
        </div>
      </PageShell>
    )
  }

  if (!sessionValid) {
    return (
      <PageShell variant="centered">
        <div className="welcome-card">
          <AppBrand size="lg" title="Сессия не найдена" />
          <p className="form-error join-error">{error}</p>
          <Link to="/" className="primary-btn session-error-link">
            Создать новую сессию
          </Link>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell variant="centered">
      <div className="welcome-card">
        <AppBrand
          size="lg"
          title="Вход в сессию"
          subtitle="Представьтесь, чтобы присоединиться к редактированию"
        />

        <FeaturePills />

        <form className="welcome-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="join-name">
            Как вас зовут?
          </label>
          <input
            id="join-name"
            type="text"
            className="text-input"
            placeholder="Ваше имя"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={64}
          />

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="primary-btn" disabled={!name.trim()}>
            Войти в сессию
          </button>
        </form>
      </div>
    </PageShell>
  )
}
