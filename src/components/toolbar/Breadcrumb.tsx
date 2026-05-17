import { useUIStore } from '../../store/useUIStore'

export default function Breadcrumb() {
  const { breadcrumb, closeInternalView, view } = useUIStore()
  if (view !== 'internal') return null

  return (
    <div style={{
      height: 32, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 6,
      background: 'var(--ink-900)', borderBottom: '1px solid var(--ink-700)',
      flexShrink: 0,
    }}>
      {breadcrumb.map((crumb, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-500)' }}>/</span>}
          {i === 0 ? (
            <button
              onClick={closeInternalView}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-300)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                transition: 'color 120ms var(--ease)',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--electric)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--ink-300)')}
            >
              {crumb}
            </button>
          ) : (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 12,
              color: i === breadcrumb.length - 1 ? 'var(--ink-100)' : 'var(--ink-300)',
              fontWeight: i === breadcrumb.length - 1 ? 500 : 400,
            }}>
              {crumb}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}
