import { nanoid } from 'nanoid'
import type { Design } from '../types/schema'

const STORAGE_KEY = 'stratum-local-designs'

export interface LocalDesignMeta {
  id: string
  name: string
  updated_at: string
  node_count: number
}

function emptyDesign(name = 'Untitled design'): Design {
  const now = new Date().toISOString()
  return {
    schema_version: '1.0.0',
    id: `des_${nanoid()}`,
    meta: { name, description: '', author: '', created_at: now, updated_at: now, tags: [] },
    canvas: { viewport: { x: 0, y: 0, zoom: 1 }, nodes: [], edges: [] },
    evaluation: { last_run_at: null, results: [] },
  }
}

function readAll(): Record<string, Design> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function writeAll(map: Record<string, Design>) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)) } catch {}
}

export const localDesigns = {
  list(): LocalDesignMeta[] {
    return Object.values(readAll())
      .map(d => ({ id: d.id, name: d.meta.name, updated_at: d.meta.updated_at, node_count: d.canvas.nodes.length }))
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  },

  get(id: string): Design | null {
    return readAll()[id] ?? null
  },

  create(name?: string): Design {
    const d = emptyDesign(name)
    const map = readAll()
    map[d.id] = d
    writeAll(map)
    return d
  },

  save(design: Design) {
    const map = readAll()
    map[design.id] = { ...design, meta: { ...design.meta, updated_at: new Date().toISOString() } }
    writeAll(map)
  },

  delete(id: string) {
    const map = readAll()
    delete map[id]
    writeAll(map)
  },
}
