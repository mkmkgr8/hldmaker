import { useState } from 'react'
import { ArrowDown, Cpu, MemoryStick, HardDrive, Network, CircleDot, Activity, Server } from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import DepthBlock from './DepthBlock'
import ChipNode from './ChipNode'
import type { ComponentTemplate, ComponentType, TemplateChipNode, Topology } from '../../types/schema'

type LucideIcon = React.ComponentType<LucideProps>

interface AxisColumnProps {
  axis: 'axis1' | 'axis2'
  template: ComponentTemplate
  componentType: ComponentType
  currentTopology: Topology
  mutationNodes?: TemplateChipNode[]
  mutationEdges?: Array<{ source: string; target: string; label: string; protocol: string }>
  highlightedIds?: string[]
  onChipSelect?: (id: string | null) => void
}

// Icons for well-known resource chip ids
const resourceIconMap: Partial<Record<string, LucideIcon>> = {
  cpu: Cpu, memory: MemoryStick, disk: HardDrive, network: Network,
}
const processIconMap: Partial<Record<string, LucideIcon>> = {
  postmaster: CircleDot, backend: Activity,
  redis_server: Server, kafka_server: Server, mysqld: Server,
  main_thread: Activity,
}

// Left-border accent per layer type
const layerAccent: Record<string, string> = {
  app_modules:       'var(--electric)',
  threads:           'var(--electric-400)',
  runtime:           '#c4a8ff',
  process:           '#9bb1c9',
  container:         'var(--warn)',
  container_runtime: 'var(--warn)',
  os:                'var(--ink-500)',
  hardware:          'var(--ok)',
}

const AxisHeader = ({ label, accent }: { label: string; accent: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
    <div style={{ width: 2, height: 12, background: accent, borderRadius: 2, flexShrink: 0 }} />
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: accent }}>
      {label}
    </span>
  </div>
)

// ── Axis 1 ─────────────────────────────────────────────────────────────────

function Axis1Column({ template, highlightedIds = [], onChipSelect }: AxisColumnProps) {
  const { d1, d2, d3 } = template.axis1
  const [expandedD1, setExpandedD1] = useState<string | null>(null)
  const [expandedD2, setExpandedD2] = useState<string | null>(null)
  const [activeD1, setActiveD1] = useState<string | null>(null)
  const [activeD2, setActiveD2] = useState<string | null>(null)
  const [activeD3, setActiveD3] = useState<string | null>(null)

  const handleD1Click = (id: string, drillable: boolean) => {
    const next = activeD1 === id ? null : id
    setActiveD1(next)
    if (drillable) { setExpandedD1(next); setExpandedD2(null); setActiveD2(null) }
    onChipSelect?.(next)
  }
  const handleD2Click = (id: string, drillable: boolean) => {
    const next = activeD2 === id ? null : id
    setActiveD2(next)
    if (drillable) { setExpandedD2(next); setActiveD3(null) }
    onChipSelect?.(next)
  }
  const handleD3Click = (id: string) => {
    const next = activeD3 === id ? null : id
    setActiveD3(next)
    onChipSelect?.(next)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <AxisHeader label="Axis 1 — Logical" accent="var(--electric-400)" />
      <DepthBlock depthNum={1} label={d1.label} nodes={d1.nodes} colorScheme="blue"
        activeNodeId={activeD1} highlightedIds={highlightedIds} onChipClick={handleD1Click} />
      {expandedD1 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ArrowDown size={14} style={{ color: 'var(--ink-600)' }} />
          </div>
          <DepthBlock depthNum={2} label={d2.label} nodes={d2.nodes} colorScheme="blue"
            activeNodeId={activeD2} highlightedIds={highlightedIds} onChipClick={handleD2Click} />
        </>
      )}
      {expandedD1 && expandedD2 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ArrowDown size={14} style={{ color: 'var(--ink-600)' }} />
          </div>
          <DepthBlock depthNum={3} label={d3.label} nodes={d3.nodes} colorScheme="blue"
            activeNodeId={activeD3} highlightedIds={highlightedIds}
            onChipClick={(id) => handleD3Click(id)} />
        </>
      )}
    </div>
  )
}

// ── Axis 2 ─────────────────────────────────────────────────────────────────

function Axis2Column({ template, currentTopology, mutationNodes = [], mutationEdges = [], highlightedIds = [], onChipSelect }: AxisColumnProps) {
  const [activeChipId, setActiveChipId] = useState<string | null>(null)
  // expandedSubChip: layerId → expanded chip id (only one drillable chip open per layer)
  const [expandedSubChip, setExpandedSubChip] = useState<Record<string, string | null>>({})

  const handleChipClick = (chipId: string) => {
    const next = activeChipId === chipId ? null : chipId
    setActiveChipId(next)
    onChipSelect?.(next)
  }

  const handleDrillableClick = (layerId: string, chipId: string) => {
    setExpandedSubChip(prev => ({ ...prev, [layerId]: prev[layerId] === chipId ? null : chipId }))
    handleChipClick(chipId)
  }

  // Filter layers by topology condition, then reverse for top→bottom display
  const visibleLayers = [...template.axis2.layers]
    .filter(l => !l.topology_condition || l.topology_condition.includes(currentTopology))
    .reverse()

  const accent = (id: string) => layerAccent[id] ?? 'var(--ink-400)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <AxisHeader label="Axis 2 — Physical" accent="#c4a8ff" />
      {visibleLayers.map((layer, idx) => {
        const isHardware = layer.id === 'hardware'
        const isProcess  = layer.id === 'process'
        const acc = accent(layer.id)

        return (
          <div key={layer.id}>
            {/* connector arrow between layers */}
            {idx > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0' }}>
                <ArrowDown size={12} style={{ color: 'var(--ink-700)' }} />
              </div>
            )}

            <div style={{
              borderRadius: 'var(--r-md)', border: '1px solid var(--ink-700)',
              background: isHardware ? 'var(--ink-900)' : 'var(--ink-800)',
              overflow: 'hidden',
              borderLeft: `2px solid ${acc}`,
            }}>
              {/* Layer header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderBottom: '1px solid var(--ink-700)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: acc }}>
                  {layer.name}
                </span>
                {layer.topology_condition && (
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--warn)', background: 'rgba(244,162,89,0.08)', border: '1px solid rgba(244,162,89,0.25)', padding: '1px 5px', borderRadius: 'var(--r-xs)' }}>
                    topology
                  </span>
                )}
              </div>

              {/* Chips */}
              <div style={{ padding: '8px 12px 10px' }}>
                {/* For process layer: split Resources-like layout for hardware, flat for others */}
                {isHardware ? (
                  // Hardware: 2×2 grid, each chip drillable into sub_chips
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {layer.components.map(chip => {
                      const expanded = expandedSubChip[layer.id] === chip.id
                      const Icon = resourceIconMap[chip.id]
                      return (
                        <div key={chip.id}>
                          <ChipNode
                            id={chip.id} label={chip.label}
                            drillable={!!chip.sub_chips?.length} tooltip={chip.tooltip}
                            colorScheme="teal"
                            active={activeChipId === chip.id}
                            crossHighlighted={highlightedIds.includes(chip.id)}
                            icon={Icon}
                            onClick={() => chip.sub_chips?.length ? handleDrillableClick(layer.id, chip.id) : handleChipClick(chip.id)}
                          />
                          {expanded && chip.sub_chips && (
                            <div style={{ marginTop: 5, paddingLeft: 8, display: 'flex', flexDirection: 'column', gap: 4, borderLeft: `1px solid ${acc}30` }}>
                              {chip.sub_chips.map(sub => (
                                <ChipNode
                                  key={sub.id} id={sub.id} label={sub.label}
                                  drillable={false} tooltip={sub.tooltip}
                                  colorScheme="teal"
                                  active={activeChipId === sub.id}
                                  crossHighlighted={highlightedIds.includes(sub.id)}
                                  onClick={() => handleChipClick(sub.id)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : isProcess ? (
                  // Process: show mutations (replica nodes) alongside template chips
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {layer.components.map(chip => {
                      const Icon = processIconMap[chip.id] ?? CircleDot
                      return (
                        <ChipNode key={chip.id} id={chip.id} label={chip.label}
                          drillable={false} tooltip={chip.tooltip}
                          colorScheme="purple"
                          active={activeChipId === chip.id}
                          crossHighlighted={highlightedIds.includes(chip.id)}
                          icon={Icon}
                          onClick={() => handleChipClick(chip.id)}
                        />
                      )
                    })}
                    {mutationNodes.map(chip => (
                      <ChipNode key={chip.id} id={chip.id} label={chip.label}
                        drillable={false} colorScheme="teal" icon={Server}
                      />
                    ))}
                    {mutationEdges.length > 0 && (
                      <div style={{ width: '100%', marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {mutationEdges.map((e, i) => (
                          <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '2px 6px', borderRadius: 'var(--r-xs)', background: 'rgba(124,226,157,0.06)', border: '1px dashed rgba(124,226,157,0.25)', color: 'var(--ink-400)' }}>
                            {e.label} <span style={{ opacity: 0.6 }}>({e.protocol})</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // All other layers: flat chip list with optional sub_chips
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {layer.components.map(chip => {
                        const expanded = chip.sub_chips?.length && expandedSubChip[layer.id] === chip.id
                        return (
                          <div key={chip.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <ChipNode
                              id={chip.id} label={chip.label}
                              drillable={!!chip.sub_chips?.length} tooltip={chip.tooltip}
                              colorScheme={layer.id === 'os' || layer.id === 'container' || layer.id === 'container_runtime' ? 'teal' : 'purple'}
                              active={activeChipId === chip.id}
                              crossHighlighted={highlightedIds.includes(chip.id)}
                              onClick={() => chip.sub_chips?.length ? handleDrillableClick(layer.id, chip.id) : handleChipClick(chip.id)}
                            />
                            {expanded && chip.sub_chips && (
                              <div style={{ paddingLeft: 8, display: 'flex', flexWrap: 'wrap', gap: 4, borderLeft: `1px solid ${acc}30` }}>
                                {chip.sub_chips.map(sub => (
                                  <ChipNode key={sub.id} id={sub.id} label={sub.label}
                                    drillable={false} tooltip={sub.tooltip}
                                    colorScheme="teal"
                                    active={activeChipId === sub.id}
                                    crossHighlighted={highlightedIds.includes(sub.id)}
                                    onClick={() => handleChipClick(sub.id)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Wrapper ─────────────────────────────────────────────────────────────────

export default function AxisColumn(props: AxisColumnProps) {
  if (props.axis === 'axis1') return <Axis1Column {...props} />
  return <Axis2Column {...props} />
}

