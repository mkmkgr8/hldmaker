import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Cpu, Layers } from 'lucide-react'
import { localDesigns, type LocalDesignMeta } from '../lib/localDesigns'
import { useUIStore } from '../store/useUIStore'

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function LocalDashboardPage() {
  const navigate = useNavigate()
  const { theme, setTheme } = useUIStore()
  const [designs, setDesigns] = useState<LocalDesignMeta[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    setDesigns(localDesigns.list())
  }, [])

  const createDesign = () => {
    const d = localDesigns.create()
    navigate(`/edit/${d.id}`)
  }

  const deleteDesign = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this design? This cannot be undone.')) return
    setDeletingId(id)
    localDesigns.delete(id)
    setDesigns(prev => prev.filter(d => d.id !== id))
    setDeletingId(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink-900)' }}>
      {/* Header */}
      <header style={{
        height: 56, display: 'flex', alignItems: 'center', padding: '0 28px',
        borderBottom: '1px solid var(--ink-700)',
        background: 'var(--ink-800)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 'var(--r-sm)',
            background: 'var(--electric)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Cpu size={14} color="#08111d" />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--ink-50)', letterSpacing: '-0.01em' }}>
            Stratum
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-500)',
            background: 'var(--ink-900)', border: '1px solid var(--ink-700)',
            padding: '1px 6px', borderRadius: 'var(--r-xs)', marginLeft: 4,
          }}>
            local
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          style={{
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: '1px solid var(--ink-700)', borderRadius: 'var(--r-sm)',
            cursor: 'pointer', color: 'var(--ink-300)',
            transition: 'all 120ms var(--ease)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--ink-700)'; e.currentTarget.style.color = 'var(--ink-100)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-300)' }}
        >
          {theme === 'dark'
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          }
        </button>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 600, color: 'var(--ink-50)', margin: 0 }}>
              Your designs
            </h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-400)', marginTop: 4 }}>
              {designs.length} design{designs.length !== 1 ? 's' : ''} · saved locally
            </p>
          </div>
          <button
            onClick={createDesign}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 16px',
              background: 'var(--electric)', color: '#08111d',
              border: 'none', borderRadius: 'var(--r-sm)', cursor: 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
              transition: 'opacity 120ms var(--ease)',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            <Plus size={15} /> New design
          </button>
        </div>

        {designs.length === 0 ? (
          <div style={{ padding: '80px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--r-md)',
              background: 'var(--ink-800)', border: '1px solid var(--ink-700)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Layers size={24} color="var(--ink-500)" />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 600, color: 'var(--ink-100)' }}>No designs yet</p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-400)', marginTop: 6 }}>
                Create your first design to get started.
              </p>
            </div>
            <button
              onClick={createDesign}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '8px 16px',
                background: 'var(--electric)', color: '#08111d',
                border: 'none', borderRadius: 'var(--r-sm)', cursor: 'pointer',
                fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
              }}
            >
              <Plus size={14} /> Create design
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {designs.map(d => (
              <DesignCard
                key={d.id}
                design={d}
                deleting={deletingId === d.id}
                onClick={() => navigate(`/edit/${d.id}`)}
                onDelete={e => deleteDesign(e, d.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function DesignCard({ design, deleting, onClick, onDelete }: {
  design: LocalDesignMeta
  deleting: boolean
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--ink-800)',
        border: `1px solid ${hovered ? 'var(--ink-600)' : 'var(--ink-700)'}`,
        borderRadius: 'var(--r-md)', padding: '20px 20px 16px',
        cursor: 'pointer', position: 'relative',
        transition: 'border 120ms var(--ease), box-shadow 120ms var(--ease)',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.2)' : 'none',
        display: 'flex', flexDirection: 'column', gap: 12,
        opacity: deleting ? 0.4 : 1,
      }}
    >
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 13.5, fontWeight: 600,
        color: 'var(--ink-50)', margin: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 28,
      }}>
        {design.name}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-400)',
          background: 'var(--ink-900)', border: '1px solid var(--ink-700)',
          padding: '2px 7px', borderRadius: 'var(--r-xs)',
        }}>
          {design.node_count} {design.node_count === 1 ? 'node' : 'nodes'}
        </span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-500)' }}>
          {timeAgo(design.updated_at)}
        </span>
      </div>
      {hovered && (
        <button
          onClick={onDelete}
          style={{
            position: 'absolute', top: 14, right: 14,
            width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--ink-900)', border: '1px solid var(--ink-700)', borderRadius: 'var(--r-xs)',
            cursor: 'pointer', color: 'var(--ink-400)', transition: 'all 120ms var(--ease)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--danger)'; e.currentTarget.style.color = 'var(--danger)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--ink-700)'; e.currentTarget.style.color = 'var(--ink-400)' }}
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}
