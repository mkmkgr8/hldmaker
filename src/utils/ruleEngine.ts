import type { Tier2Rule, DesignNode, Design, EvalResult } from '../types/schema'

interface EvalContext {
  node: DesignNode
  graph: {
    inbound_node_types: string[]
    outbound_node_types: string[]
    sibling_node_types: string[]
  }
}

function buildContext(node: DesignNode, design: Design): EvalContext {
  const inboundEdges = design.canvas.edges.filter(e => e.target === node.id)
  const outboundEdges = design.canvas.edges.filter(e => e.source === node.id)
  const inboundIds = inboundEdges.map(e => e.source)
  const outboundIds = outboundEdges.map(e => e.target)
  const getType = (id: string) => design.canvas.nodes.find(n => n.id === id)?.type ?? ''
  return {
    node,
    graph: {
      inbound_node_types: inboundIds.map(getType),
      outbound_node_types: outboundIds.map(getType),
      sibling_node_types: design.canvas.nodes.filter(n => n.id !== node.id).map(n => n.type),
    },
  }
}

function getField(path: string, ctx: EvalContext): unknown {
  const parts = path.split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let obj: any = ctx
  for (const p of parts) obj = obj?.[p] ?? undefined
  return obj
}

function evalCondition(condition: Tier2Rule['condition'], ctx: EvalContext): boolean {
  if ('all' in condition) return condition.all.every(c => evalCondition(c, ctx))
  if ('any' in condition) return condition.any.some(c => evalCondition(c, ctx))
  const val = getField(condition.field, ctx)
  switch (condition.op) {
    case 'eq': return val === condition.value
    case 'gt': return Number(val) > Number(condition.value)
    case 'lt': return Number(val) < Number(condition.value)
    case 'gte': return Number(val) >= Number(condition.value)
    case 'lte': return Number(val) <= Number(condition.value)
    case 'includes': return Array.isArray(val) && val.includes(condition.value)
    case 'not_includes': return Array.isArray(val) && !val.includes(condition.value)
    default: return false
  }
}

function interpolate(msg: string, ctx: EvalContext, calc: Record<string, string> = {}): string {
  return msg.replace(/\{\{([^}]+)\}\}/g, (_, path) => {
    if (path.startsWith('calc.')) {
      const calcKey = path.slice(5)
      try {
        const expr = calc[calcKey]?.replace(/node\.config\.(\w+)/g, (_m: string, k: string) => String(ctx.node.config[k] ?? 0))
        // Safe arithmetic only: parse round(a*b/c, d) patterns
        const roundMatch = expr?.match(/^round\((.+),\s*(\d+)\)$/)
        if (roundMatch) {
          const num = Function('"use strict"; return (' + roundMatch[1] + ')')()
          const decimals = parseInt(roundMatch[2])
          return String(Math.round(num * 10 ** decimals) / 10 ** decimals)
        }
        return String(Function('"use strict"; return (' + expr + ')')())
      } catch { return '?' }
    }
    return String(getField(path, ctx) ?? '?')
  })
}

export function evaluateRules(node: DesignNode, rules: Tier2Rule[], design: Design): EvalResult[] {
  const ctx = buildContext(node, design)
  return rules
    .filter(rule => evalCondition(rule.condition, ctx))
    .map(rule => ({
      severity: rule.severity,
      scope: node.id,
      text: interpolate(rule.message, ctx, rule.calc),
      tier: 2 as const,
    }))
}
