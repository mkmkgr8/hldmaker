import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Upload, RotateCcw, Cpu, Sun, Moon, ArrowLeft, LogOut, Image } from 'lucide-react'
import { toPng } from 'html-to-image'
import { useDesignStore } from '../../store/useDesignStore'
import { useUIStore } from '../../store/useUIStore'
import { useAuthStore } from '../../store/useAuthStore'
import { exportDesign, importDesign } from '../../utils/exporter'
import Breadcrumb from './Breadcrumb'

const S: Record<string, React.CSSProperties> = {
  bar: {
    height: 48, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px',
    background: 'var(--surface-overlay)',
    borderBottom: '1px solid var(--ink-700)',
    backdropFilter: 'blur(8px) saturate(140%)',
    zIndex: 20, flexShrink: 0, position: 'relative',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 7 },
  logoMark: {
    width: 22, height: 22,
    background: 'var(--electric)',
    borderRadius: 'var(--r-sm)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: {
    fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 600, color: 'var(--ink-50)',
    letterSpacing: '-0.01em',
  },
  divider: { width: 1, height: 20, background: 'var(--ink-700)', margin: '0 2px', flexShrink: 0 },
  nameInput: {
    fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-100)',
    background: 'transparent', border: 'none', outline: 'none', width: 180,
  },
  spacer: { flex: 1 },
  iconBtn: {
    width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent', border: '1px solid var(--ink-700)', borderRadius: 'var(--r-sm)',
    cursor: 'pointer', color: 'var(--ink-300)', transition: 'all 120ms var(--ease)', flexShrink: 0,
  },
  btnGhost: {
    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
    borderRadius: 'var(--r-sm)', padding: '5px 9px',
    border: '1px solid transparent', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'transparent', color: 'var(--ink-200)',
    transition: 'all 120ms var(--ease)',
  },
  btnSecondary: {
    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
    borderRadius: 'var(--r-sm)', padding: '5px 10px',
    border: '1px solid var(--ink-700)', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'var(--ink-800)', color: 'var(--ink-100)',
    transition: 'all 120ms var(--ease)',
  },
  btnPrimary: {
    fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
    borderRadius: 'var(--r-sm)', padding: '5px 10px',
    border: '1px solid transparent', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: 'var(--electric)', color: '#08111d',
    transition: 'all 120ms var(--ease)',
  },
}

const hoverIn  = (bg: string, col: string) => (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = bg; e.currentTarget.style.color = col }
const hoverOut = (bg: string, col: string) => (e: React.MouseEvent<HTMLButtonElement>) => { e.currentTarget.style.background = bg; e.currentTarget.style.color = col }

export default function Toolbar() {
  const navigate = useNavigate()
  const { design, setDesignName, importDesign: storeImport, resetDesign } = useDesignStore()
  const { setEvalPanelOpen, evalPanelOpen, theme, setTheme } = useUIStore()
  const { user, signOut } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const initial = user?.email?.[0].toUpperCase() ?? '?'

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const json = await importDesign(file)
    storeImport(json)
    e.target.value = ''
  }

  const handleReset = () => {
    if (confirm('Reset canvas? All nodes and edges will be removed.')) resetDesign()
  }

  const handleExportPng = async () => {
    const el = document.querySelector('.react-flow') as HTMLElement | null
    if (!el) return
    const bg = theme === 'dark' ? '#0b0e14' : '#f4f6f9'
    try {
      const dataUrl = await toPng(el, { backgroundColor: bg, pixelRatio: 2 })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `${design.meta.name || 'diagram'}.png`
      a.click()
    } catch { /* canvas taint from external SVGs — ignore */ }
  }

  return (
    <>
      <div style={S.bar}>
        {/* Back to dashboard — only when authenticated */}
        {user && (
          <>
            <button
              onClick={() => navigate('/')}
              title="Back to designs"
              style={S.iconBtn}
              onMouseEnter={hoverIn('var(--ink-800)', 'var(--ink-100)')}
              onMouseLeave={hoverOut('transparent', 'var(--ink-300)')}
            >
              <ArrowLeft size={14} />
            </button>
            <div style={S.divider} />
          </>
        )}

        {/* Logo */}
        <div style={S.logo}>
          <div style={S.logoMark}><Cpu size={13} color="#08111d" /></div>
          <span style={S.logoText}>Stratum</span>
        </div>

        <div style={S.divider} />

        {/* Design name */}
        <input
          style={S.nameInput}
          value={design.meta.name}
          onChange={e => setDesignName(e.target.value)}
          spellCheck={false}
        />

        <div style={S.spacer} />

        {/* Actions */}
        <button
          style={S.btnGhost}
          onClick={() => exportDesign(design)}
          onMouseEnter={hoverIn('var(--ink-800)', 'var(--ink-100)')}
          onMouseLeave={hoverOut('transparent', 'var(--ink-200)')}
        >
          <Download size={13} /> Export
        </button>
        <button
          style={S.btnGhost}
          onClick={handleExportPng}
          title="Export canvas as PNG"
          onMouseEnter={hoverIn('var(--ink-800)', 'var(--ink-100)')}
          onMouseLeave={hoverOut('transparent', 'var(--ink-200)')}
        >
          <Image size={13} /> PNG
        </button>
        <button
          style={S.btnGhost}
          onClick={() => fileInputRef.current?.click()}
          onMouseEnter={hoverIn('var(--ink-800)', 'var(--ink-100)')}
          onMouseLeave={hoverOut('transparent', 'var(--ink-200)')}
        >
          <Upload size={13} /> Import
        </button>
        <input ref={fileInputRef} type="file" accept=".hld.json" style={{ display: 'none' }} onChange={handleImport} />
        <button
          style={S.btnGhost}
          onClick={handleReset}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--ink-800)'; e.currentTarget.style.color = 'var(--danger)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-200)' }}
        >
          <RotateCcw size={13} /> Reset
        </button>

        <div style={S.divider} />

        {/* Theme toggle */}
        <button
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          style={S.iconBtn}
          onMouseEnter={hoverIn('var(--ink-800)', 'var(--ink-100)')}
          onMouseLeave={hoverOut('transparent', 'var(--ink-300)')}
        >
          {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
        </button>

        {/* User avatar + sign out — only when authenticated */}
        {user && (
          <>
            <div
              title={user.email ?? ''}
              style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'var(--electric)', color: '#08111d',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}
            >
              {initial}
            </div>
            <button
              title="Sign out"
              onClick={() => { signOut(); navigate('/auth') }}
              style={S.iconBtn}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--ink-800)'; e.currentTarget.style.color = 'var(--danger)' }}
              onMouseLeave={hoverOut('transparent', 'var(--ink-300)')}
            >
              <LogOut size={13} />
            </button>
            <div style={S.divider} />
          </>
        )}

        {/* Run review */}
        <button
          style={evalPanelOpen ? S.btnPrimary : S.btnSecondary}
          onClick={() => setEvalPanelOpen(!evalPanelOpen)}
          onMouseEnter={e => { if (!evalPanelOpen) e.currentTarget.style.borderColor = 'var(--ink-600)' }}
          onMouseLeave={e => { if (!evalPanelOpen) e.currentTarget.style.borderColor = 'var(--ink-700)' }}
        >
          Run review
        </button>
      </div>
      <Breadcrumb />
    </>
  )
}
