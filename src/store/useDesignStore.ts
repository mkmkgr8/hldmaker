import { create } from 'zustand'
import type { Design, DesignNode, DesignEdge, NodeConfig, Topology } from '../types/schema'
import { nanoid } from 'nanoid'

const emptyDesign = (): Design => ({
  schema_version: '1.0.0',
  id: `des_${nanoid()}`,
  meta: { name: 'Untitled design', description: '', author: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), tags: [] },
  canvas: { viewport: { x: 0, y: 0, zoom: 1 }, nodes: [], edges: [] },
  evaluation: { last_run_at: null, results: [] },
})

type Canvas = Design['canvas']

interface DesignStore {
  design: Design
  currentDesignId: string | null
  setDesignName: (name: string) => void
  addNode: (node: DesignNode) => void
  updateNodeConfig: (nodeId: string, config: Partial<NodeConfig>) => void
  updateNodeTopology: (nodeId: string, topology: Topology) => void
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void
  updateNodeLabel: (nodeId: string, label: string) => void
  updateNodeAnnotation: (nodeId: string, key: string, value: string) => void
  removeNode: (nodeId: string) => void
  addEdge: (edge: DesignEdge) => void
  removeEdge: (edgeId: string) => void
  setEvaluationResults: (results: Design['evaluation']['results']) => void
  exportDesign: () => string
  importDesign: (json: string) => void
  resetDesign: () => void
  loadDesignFromDB: (id: string, canvas: Canvas, name: string) => void
  applyRemoteCanvas: (canvas: Canvas) => void
}

export const useDesignStore = create<DesignStore>((set, get) => ({
  design: emptyDesign(),
  currentDesignId: null,

  setDesignName: (name) => set(s => ({ design: { ...s.design, meta: { ...s.design.meta, name } } })),
  addNode: (node) => set(s => ({ design: { ...s.design, canvas: { ...s.design.canvas, nodes: [...s.design.canvas.nodes, node] } } })),
  updateNodeConfig: (nodeId, config) => set(s => ({
    design: { ...s.design, canvas: { ...s.design.canvas, nodes: s.design.canvas.nodes.map(n => n.id === nodeId ? { ...n, config: { ...n.config, ...config } as NodeConfig } : n) } }
  })),
  updateNodeTopology: (nodeId, topology) => set(s => ({
    design: { ...s.design, canvas: { ...s.design.canvas, nodes: s.design.canvas.nodes.map(n => n.id === nodeId ? { ...n, topology } : n) } }
  })),
  updateNodePosition: (nodeId, position) => set(s => ({
    design: { ...s.design, canvas: { ...s.design.canvas, nodes: s.design.canvas.nodes.map(n => n.id === nodeId ? { ...n, position } : n) } }
  })),
  updateNodeLabel: (nodeId, label) => set(s => ({
    design: { ...s.design, canvas: { ...s.design.canvas, nodes: s.design.canvas.nodes.map(n => n.id === nodeId ? { ...n, label } : n) } }
  })),
  updateNodeAnnotation: (nodeId, key, value) => set(s => ({
    design: { ...s.design, canvas: { ...s.design.canvas, nodes: s.design.canvas.nodes.map(n => n.id === nodeId ? { ...n, internal_state: { ...n.internal_state, annotations: { ...n.internal_state.annotations, [key]: value } } } : n) } }
  })),
  removeNode: (nodeId) => set(s => ({
    design: { ...s.design, canvas: { ...s.design.canvas, nodes: s.design.canvas.nodes.filter(n => n.id !== nodeId), edges: s.design.canvas.edges.filter(e => e.source !== nodeId && e.target !== nodeId) } }
  })),
  addEdge: (edge) => set(s => ({ design: { ...s.design, canvas: { ...s.design.canvas, edges: [...s.design.canvas.edges, edge] } } })),
  removeEdge: (edgeId) => set(s => ({ design: { ...s.design, canvas: { ...s.design.canvas, edges: s.design.canvas.edges.filter(e => e.id !== edgeId) } } })),
  setEvaluationResults: (results) => set(s => ({ design: { ...s.design, evaluation: { last_run_at: new Date().toISOString(), results } } })),
  exportDesign: () => JSON.stringify(get().design, null, 2),
  importDesign: (json) => { try { set({ design: JSON.parse(json) }) } catch { alert('Invalid .hld.json file') } },
  resetDesign: () => set({ design: emptyDesign(), currentDesignId: null }),

  loadDesignFromDB: (id, canvas, name) => set({
    currentDesignId: id,
    design: {
      ...emptyDesign(),
      id,
      meta: { ...emptyDesign().meta, name },
      canvas,
    },
  }),

  applyRemoteCanvas: (canvas) => set(s => ({
    design: { ...s.design, canvas },
  })),
}))
