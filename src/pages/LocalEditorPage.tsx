/**
 * Local testing editor — no auth, no Supabase, pure in-memory Zustand.
 * Used on the local-testing branch only.
 * LLM eval still works via VITE_ANTHROPIC_API_KEY in .env.local.
 */
import { useEffect } from 'react'
import { useDesignStore } from '../store/useDesignStore'
import { useUIStore } from '../store/useUIStore'
import Toolbar from '../components/toolbar/Toolbar'
import ComponentPalette from '../components/toolbar/ComponentPalette'
import HLDCanvas from '../components/canvas/HLDCanvas'
import NodeSidebar from '../components/sidebar/NodeSidebar'
import InternalView from '../components/internal/InternalView'
import EvalPanel from '../components/evaluation/EvalPanel'

export default function LocalEditorPage() {
  const { removeNode } = useDesignStore()
  const { view, evalPanelOpen, selectedNodeId, setSelectedNode } = useUIStore()

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
