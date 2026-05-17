import type { Design } from '../types/schema'

export function exportDesign(design: Design) {
  const blob = new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${design.meta.name.replace(/\s+/g, '-').toLowerCase()}.hld.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function importDesign(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}
