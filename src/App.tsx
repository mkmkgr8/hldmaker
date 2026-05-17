import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LocalEditorPage from './pages/LocalEditorPage'
import AuthGuard from './components/auth/AuthGuard'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import EditorPage from './pages/EditorPage'

// Resolved at build time by Vite — tree-shakes the unused branch in the bundle.
// Local dev:  .env           → VITE_AUTH_ENABLED=false  (default, no login needed)
// Production: .env.production → VITE_AUTH_ENABLED=true   (full auth + dashboard)
const AUTH = import.meta.env.VITE_AUTH_ENABLED === 'true'

export default function App() {
  if (!AUTH) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<LocalEditorPage />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<AuthGuard><DashboardPage /></AuthGuard>} />
        <Route path="/design/:id" element={<AuthGuard><EditorPage /></AuthGuard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
