import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuthStore()

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--ink-900)',
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          border: '2px solid var(--ink-700)',
          borderTopColor: 'var(--electric)',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!session) return <Navigate to="/auth" replace />
  return <>{children}</>
}
