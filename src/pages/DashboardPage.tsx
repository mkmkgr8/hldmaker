import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Cpu, LogOut } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'
import { useUIStore } from '../store/useUIStore'

interface DesignRow {
  id: string
  name: string
  updated_at: string
  node_count: number
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const { theme, setTheme } = useUIStore()
  const [designs, setDesigns] = useState<DesignRow[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const initial = user?.email?.[0].toUpperCase() ?? '?'

  useEffect(() => {
    fetchDesigns()
  }, [])

  const fetchDesigns = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('designs')
      .select('id, name, updated_at, canvas')
      .order('updated_at', { ascending: false })
    if (data) {
      setDesigns(data.map(d => ({
        id: d.id,
        name: d.name,
        updated_at: d.updated_at,
        node_count: (d.canvas?.nodes ?? []).length,
      })))
    }
    setLoading(false)
  }

  const createDesign = async () => {
    if (!user) return
    setCreating(true)
    const { data, error } = await supabase
      .from('designs')
      .insert({
        owner_id: user.id,
        name: 'Untitled design',
        canvas: { viewport: { x: 0, y: 0, zoom: 1 }, nodes: [], edges: [] },
        evaluation: { last_run_at: null, results: [] },
      })
      .select('id')
      .single()
    setCreating(false)
    if (!error && data) navigate(`/design/${data.id}`)
  }

  const deleteDesign = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Delete this design? This cannot be undone.')) return
    setDeletingId(id)
    await supabase.from('designs').delete().eq('id', id)
    setDesigns(prev => prev.filter(d => d.id !== id))
    setDeletingId(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink-900)' }}>
      {/* Header */}
      <header style={{
        height: 56, display: 'flex', alignItems: 'center', padding: '0 28px',
        borderBottom: '1px solid var(--ink-700)',
        background: 'var(--surface-overlay)',
        backdropFilter: 'blur(8px) saturate(140%)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 'var(--r-sm)',
            background: 'var(--electric)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Cpu size={14} color="#08111d" />
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--ink-50)', letterSpacing: '-0.01em' }}>
            Stratum
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
          style={{
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', border: '1px solid var(--ink-700)', borderRadius: 'var(--r-sm)',
            cursor: 'pointer', color: 'var(--ink-300)', marginRight: 10,
            transition: 'all 120ms var(--ease)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--ink-800)'; e.currentTarget.style.color = 'var(--ink-100)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-300)' }}
        >
          {theme === 'dark'
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          }
        </button>

        {/* User chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: 'var(--electric)', color: '#08111d',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, flexShrink: 0,
          }}>
            {initial}
          </div>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-300)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </span>
          <button
            onClick={signOut}
            title="Sign out"
            style={{
              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: '1px solid var(--ink-700)', borderRadius: 'var(--r-sm)',
              cursor: 'pointer', color: 'var(--ink-400)',
              transition: 'all 120ms var(--ease)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--ink-800)'; e.currentTarget.style.color = 'var(--danger)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-400)' }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 28px' }}>
        {/* Page heading */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 22, fontWeight: 600, color: 'var(--ink-50)', margin: 0 }}>
              Your designs
            </h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-400)', marginTop: 4 }}>
              {loading ? 'Loading…' : `${designs.length} design${designs.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={createDesign}
            disabled={creating}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 16px',
              background: 'var(--electric)', color: '#08111d',
              border: 'none', borderRadius: 'var(--r-sm)', cursor: creating ? 'wait' : 'pointer',
              fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
              opacity: creating ? 0.7 : 1,
              transition: 'opacity 120ms var(--ease)',
            }}
          >
            <Plus size={15} /> New design
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              border: '2px solid var(--ink-700)', borderTopColor: 'var(--electric)',
              animation: 'spin 0.7s linear infinite',
            }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : designs.length === 0 ? (
          <div style={{
            padding: '80px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 'var(--r-md)',
              background: 'var(--ink-800)', border: '1px solid var(--ink-700)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Cpu size={24} color="var(--ink-500)" />
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
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {designs.map(d => (
              <DesignCard
                key={d.id}
                design={d}
                deleting={deletingId === d.id}
                onClick={() => navigate(`/design/${d.id}`)}
                onDelete={(e) => deleteDesign(e, d.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function DesignCard({
  design, deleting, onClick, onDelete,
}: {
  design: DesignRow
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
        borderRadius: 'var(--r-md)',
        padding: '20px 20px 16px',
        cursor: 'pointer',
        transition: 'border 120ms var(--ease), box-shadow 120ms var(--ease)',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.2)' : 'none',
        display: 'flex', flexDirection: 'column', gap: 12,
        opacity: deleting ? 0.4 : 1,
        position: 'relative',
      }}
    >
      {/* Name */}
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 13.5, fontWeight: 600,
        color: 'var(--ink-50)', margin: 0,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        paddingRight: 28,
      }}>
        {design.name}
      </p>

      {/* Meta */}
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

      {/* Delete button */}
      {hovered && (
        <button
          onClick={onDelete}
          title="Delete"
          style={{
            position: 'absolute', top: 14, right: 14,
            width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'var(--ink-900)', border: '1px solid var(--ink-700)', borderRadius: 'var(--r-xs)',
            cursor: 'pointer', color: 'var(--ink-400)',
            transition: 'all 120ms var(--ease)',
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
