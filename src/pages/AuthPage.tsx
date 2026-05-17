import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Cpu } from 'lucide-react'
import { useAuthStore } from '../store/useAuthStore'

export default function AuthPage() {
  const { session, loading, signInWithGoogle } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && session) navigate('/', { replace: true })
  }, [session, loading, navigate])

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--ink-900)',
      backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,196,255,0.06), transparent)',
    }}>
      <div style={{
        width: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32,
        padding: '48px 40px',
        background: 'var(--ink-800)',
        border: '1px solid var(--ink-700)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-pop)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--r-md)',
            background: 'var(--electric)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Cpu size={22} color="#08111d" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 600, color: 'var(--ink-50)', letterSpacing: '-0.02em' }}>
              Stratum
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-400)', marginTop: 4 }}>
              System design, made explorable.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: '100%', height: 1, background: 'var(--ink-700)' }} />

        {/* Sign in */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={signInWithGoogle}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '11px 16px',
              background: 'var(--ink-900)',
              border: '1px solid var(--ink-700)',
              borderRadius: 'var(--r-sm)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--ink-100)',
              transition: 'all 120ms var(--ease)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink-600)'; e.currentTarget.style.background = 'var(--ink-800)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--ink-700)'; e.currentTarget.style.background = 'var(--ink-900)' }}
          >
            {/* Google "G" mark */}
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Continue with Google
          </button>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11.5, color: 'var(--ink-500)', textAlign: 'center', lineHeight: 1.5 }}>
            Your designs are stored in your account and synced in real time.
          </p>
        </div>
      </div>
    </div>
  )
}
