import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useUIStore } from '../../store/useUIStore'
import { useDesignStore } from '../../store/useDesignStore'
import { templates } from '../../data/templates'
import { rulesByType } from '../../data/tier2Rules'
import { evaluateRules } from '../../utils/ruleEngine'
import TopologySwitcher from '../sidebar/TopologySwitcher'
import InsightsPanel from '../sidebar/InsightsPanel'
import AxisColumn from './AxisColumn'
import type { TemplateChipNode, Topology } from '../../types/schema'

export default function InternalView() {
  const { selectedNodeId, closeInternalView } = useUIStore()
  const { design, updateNodeTopology } = useDesignStore()

  const [axis1HighlightIds, setAxis1HighlightIds] = useState<string[]>([])
  const [axis2HighlightIds, setAxis2HighlightIds] = useState<string[]>([])

  const node = design.canvas.nodes.find(n => n.id === selectedNodeId)
  if (!node) return null

  const template = templates[node.type]
  if (!template) return null

  const rules = rulesByType[node.type] ?? []
  const tier2Results = evaluateRules(node, rules, design)

  const mutation = template.topology_mutations[node.topology]

  const mutationChips: TemplateChipNode[] = (mutation?.add_nodes ?? []).flatMap(mn => {
    if (mn.axis !== 'axis2') return []
    if (mn.count_from) {
      const path = mn.count_from.replace('config.', '')
      const count = Number(node.config[path] ?? 1)
      return Array.from({ length: Math.max(1, count) }, (_, i) => ({
        id: `${mn.id}_${i}`,
        label: count > 1 ? `${mn.label} ${i + 1}` : mn.label,
        drillable: false,
      }))
    }
    return [{ id: mn.id, label: mn.label, drillable: false }]
  })

  const mutationEdges = mutation?.add_edges ?? []

  const handleTopologyChange = (t: Topology) => updateNodeTopology(node.id, t)

  const allAxis1ChipIds = [...new Set(
    template.axis1.d1.nodes.flatMap(n1 => [
      n1.id,
      ...(n1.d2?.nodes ?? []).flatMap(n2 => [
        n2.id,
        ...(n2.d3?.nodes ?? []).map(n3 => n3.id),
      ]),
    ])
  )]

  const handleAxis1ChipSelect = (id: string | null) => {
    if (!id) { setAxis2HighlightIds([]); setAxis1HighlightIds([]); return }
    setAxis2HighlightIds(template.cross_links[id] ?? [])
    setAxis1HighlightIds([])
  }

  const handleAxis2ChipSelect = (id: string | null) => {
    if (!id) { setAxis1HighlightIds([]); setAxis2HighlightIds([]); return }
    // A2-internal highlights (e.g. jvm_heap → memory/dram)
    setAxis2HighlightIds(template.cross_links[id] ?? [])
    // Reverse: which A1 chips point to this A2 chip?
    const reverseA1 = allAxis1ChipIds.filter(a1Id =>
      (template.cross_links[a1Id] ?? []).includes(id)
    )
    setAxis1HighlightIds(reverseA1)
  }

  const hasAxis2Link = axis2HighlightIds.length > 0
  const hasAxis1Link = axis1HighlightIds.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--ink-900)' }}>
      {/* Header */}
      <div style={{
        background: 'var(--ink-800)', borderBottom: '1px solid var(--ink-700)',
        padding: '10px 16px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={closeInternalView}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--electric)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ink-400)' }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 12, fontFamily: 'var(--font-sans)',
              color: 'var(--ink-400)', background: 'none', border: 'none',
              cursor: 'pointer', transition: 'color 120ms var(--ease)',
            }}
          >
            <ArrowLeft size={13} />
            Back to canvas
          </button>
          <div style={{ width: 1, height: 16, background: 'var(--ink-700)' }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-50)', fontFamily: 'var(--font-mono)' }}>
              {node.label}
            </p>
            <p style={{ fontSize: 10, color: 'var(--ink-400)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>
              {template.flavor}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasAxis2Link && (
            <span style={{
              fontSize: 11, fontFamily: 'var(--font-mono)',
              color: 'var(--warn)', background: 'rgba(244,162,89,0.08)',
              border: '1px solid rgba(244,162,89,0.3)',
              padding: '2px 8px', borderRadius: 'var(--r-sm)',
            }}>
              Cross-link → Axis 2
            </span>
          )}
          {hasAxis1Link && (
            <span style={{
              fontSize: 11, fontFamily: 'var(--font-mono)',
              color: 'var(--warn)', background: 'rgba(244,162,89,0.08)',
              border: '1px solid rgba(244,162,89,0.3)',
              padding: '2px 8px', borderRadius: 'var(--r-sm)',
            }}>
              Cross-link → Axis 1
            </span>
          )}
          <TopologySwitcher
            available={template.topologies}
            current={node.topology}
            onChange={handleTopologyChange}
          />
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 900, margin: '0 auto' }}>
          <AxisColumn
            axis="axis1"
            template={template}
            componentType={node.type}
            currentTopology={node.topology}
            highlightedIds={axis1HighlightIds}
            onChipSelect={handleAxis1ChipSelect}
          />
          <AxisColumn
            axis="axis2"
            template={template}
            componentType={node.type}
            currentTopology={node.topology}
            mutationNodes={mutationChips}
            mutationEdges={mutationEdges}
            highlightedIds={axis2HighlightIds}
            onChipSelect={handleAxis2ChipSelect}
          />
        </div>

        <div style={{ maxWidth: 900, margin: '20px auto 0' }}>
          <InsightsPanel tier1={template.tier1_insights} tier2={tier2Results} />
        </div>
      </div>
    </div>
  )
}
