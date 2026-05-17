import type { Design } from '../types/schema'

export function serializeDesignForLLM(design: Design): string {
  const nodes = design.canvas.nodes.map(n =>
    `- ${n.label} (${n.type}, topology: ${n.topology})\n  Config: ${JSON.stringify(n.config)}`
  ).join('\n')

  const edges = design.canvas.edges
    .filter(e => !e.auto_generated)
    .map(e => {
      const src = design.canvas.nodes.find(n => n.id === e.source)?.label ?? e.source
      const tgt = design.canvas.nodes.find(n => n.id === e.target)?.label ?? e.target
      return `- ${src} → ${tgt} (${e.config.protocol}, ${e.config.sync ? 'sync' : 'async'}, ~${e.config.estimated_rps ?? '?'} RPS)`
    }).join('\n')

  return `System design: "${design.meta.name}"\n\nComponents:\n${nodes}\n\nConnections:\n${edges}`
}
