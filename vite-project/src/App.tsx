import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { JoinPage } from './pages/JoinPage'
import { SessionPage } from './pages/SessionPage'
import { SessionPopoutPage } from './pages/SessionPopoutPage'
import { WelcomePage } from './pages/WelcomePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/join/:sessionId" element={<JoinPage />} />
        <Route path="/session/:sessionId" element={<SessionPage />} />
        <Route path="/session/:sessionId/popout" element={<SessionPopoutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

