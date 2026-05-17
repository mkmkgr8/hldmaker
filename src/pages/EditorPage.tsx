import { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useDesignStore } from '../store/useDesignStore'
import { useUIStore } from '../store/useUIStore'
import Toolbar from '../components/toolbar/Toolbar'
import ComponentPalette from '../components/toolbar/ComponentPalette'
import HLDCanvas from '../components/canvas/HLDCanvas'
import NodeSidebar from '../components/sidebar/NodeSidebar'
import InternalView from '../components/internal/InternalView'
import EvalPanel from '../components/evaluation/EvalPanel'
import type { Design } from '../types/schema'

// Stable per-tab ID to filter out our own Realtime echoes
const clientId = (() => {
  const k = 'stratum-client-id'
  let id = sessionStorage.getItem(k)
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem(k, id) }
  return id
})()

export default function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { loadDesignFromDB, applyRemoteCanvas, resetDesign, currentDesignId, design } = useDesignStore()
  const { view, evalPanelOpen, selectedNodeId, setSelectedNode } = useUIStore()
  const { removeNode } = useDesignStore()

  const loadedRef = useRef(false)

  // ── Load design on mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!id) { navigate('/'); return }
    loadedRef.current = false

    const load = async () => {
      const { data, error } = await supabase
        .from('designs')
        .select('id, name, canvas')
        .eq('id', id)
        .single()

      if (error || !data) { navigate('/'); return }

      loadDesignFromDB(data.id, data.canvas, data.name)
      loadedRef.current = true
    }

    load()

    return () => { resetDesign() }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Realtime subscription ───────────────────────────────────────────────
  useEffect(() => {
    if (!id) return

    const channel = supabase
      .channel(`design:${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'designs', filter: `id=eq.${id}` },
        (payload) => {
          const row = payload.new as { canvas: Design['canvas']; last_editor_id: string }
          if (row.last_editor_id === clientId) return // our own save, ignore
          applyRemoteCanvas(row.canvas)
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounced auto-save ─────────────────────────────────────────────────
  useEffect(() => {
    if (!currentDesignId || !loadedRef.current) return

    const timer = setTimeout(async () => {
      await supabase
        .from('designs')
        .update({
          name: design.meta.name,
          canvas: design.canvas,
          last_editor_id: clientId,
        })
        .eq('id', currentDesignId)
    }, 600)

    return () => clearTimeout(timer)
  }, [design.canvas, design.meta.name, currentDesignId])

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
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
