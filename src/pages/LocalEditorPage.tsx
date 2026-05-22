import { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDesignStore } from '../store/useDesignStore'
import { useUIStore } from '../store/useUIStore'
import { localDesigns } from '../lib/localDesigns'
import Toolbar from '../components/toolbar/Toolbar'
import ComponentPalette from '../components/toolbar/ComponentPalette'
import HLDCanvas from '../components/canvas/HLDCanvas'
import NodeSidebar from '../components/sidebar/NodeSidebar'
import InternalView from '../components/internal/InternalView'
import EvalPanel from '../components/evaluation/EvalPanel'

export default function LocalEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { design, loadFullDesign, removeNode } = useDesignStore()
  const { view, evalPanelOpen, selectedNodeId, setSelectedNode } = useUIStore()
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadedId = useRef<string | null>(null)

  // Load design from localStorage on mount
  useEffect(() => {
    if (!id) { navigate('/', { replace: true }); return }
    const saved = localDesigns.get(id)
    if (!saved) { navigate('/', { replace: true }); return }
    loadFullDesign(saved)
    loadedId.current = id
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Auto-save on design changes (debounced 800ms)
  useEffect(() => {
    if (!loadedId.current || design.id !== loadedId.current) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      localDesigns.save(design)
    }, 800)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [design])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedNode(null)
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        const tag = (document.activeElement as HTMLElement)?.tagName
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
          removeNode(selectedNodeId)
          setSelectedNode(null)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedNodeId, setSelectedNode, removeNode])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--ink-900)' }}>
      <Toolbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <ComponentPalette />
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {view === 'canvas' ? <HLDCanvas /> : <InternalView />}
        </div>
        {view === 'canvas' && selectedNodeId && <NodeSidebar />}
        {evalPanelOpen && <EvalPanel />}
      </div>
    </div>
  )
}
