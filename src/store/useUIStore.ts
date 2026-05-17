import { create } from 'zustand'

type Theme = 'dark' | 'light'

const initTheme = (localStorage.getItem('stratum-theme') as Theme) ?? 'dark'
document.documentElement.setAttribute('data-theme', initTheme)

interface UIStore {
  selectedNodeId: string | null
  view: 'canvas' | 'internal'
  breadcrumb: string[]
  evalPanelOpen: boolean
  theme: Theme
  setSelectedNode: (id: string | null) => void
  openInternalView: (nodeId: string, nodeLabel: string) => void
  drillInto: (label: string) => void
  goBack: () => void
  closeInternalView: () => void
  setEvalPanelOpen: (open: boolean) => void
  setTheme: (t: Theme) => void
}

export const useUIStore = create<UIStore>((set) => ({
  selectedNodeId: null,
  view: 'canvas',
  breadcrumb: ['HLD Canvas'],
  evalPanelOpen: false,
  theme: initTheme,
  setSelectedNode: (id) => set({ selectedNodeId: id }),
  openInternalView: (nodeId, nodeLabel) => set({ view: 'internal', selectedNodeId: nodeId, breadcrumb: ['HLD Canvas', nodeLabel] }),
  drillInto: (label) => set(s => ({ breadcrumb: [...s.breadcrumb, label] })),
  goBack: () => set(s => ({
    breadcrumb: s.breadcrumb.length > 1 ? s.breadcrumb.slice(0, -1) : s.breadcrumb,
    view: s.breadcrumb.length <= 2 ? 'canvas' : 'internal',
  })),
  closeInternalView: () => set({ view: 'canvas', breadcrumb: ['HLD Canvas'] }),
  setEvalPanelOpen: (open) => set({ evalPanelOpen: open }),
  setTheme: (theme) => {
    localStorage.setItem('stratum-theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
    set({ theme })
  },
}))
