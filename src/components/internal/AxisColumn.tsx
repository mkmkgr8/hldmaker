import { useState, useEffect } from 'react'
import { ArrowDown, Cpu, MemoryStick, HardDrive, Network, CircleDot, Activity, Server } from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import DepthBlock from './DepthBlock'
import ChipNode from './ChipNode'
import type { ComponentTemplate, ComponentType, TemplateChipNode, Topology, Axis2Layer, NodeConfig } from '../../types/schema'

type LucideIcon = React.ComponentType<LucideProps>

interface AxisColumnProps {
  axis: 'axis1' | 'axis2'
  template: ComponentTemplate
  componentType: ComponentType
  currentTopology: Topology
  nodeConfig?: NodeConfig
  mutationNodes?: TemplateChipNode[]
  mutationEdges?: Array<{ source: string; target: string; label: string; protocol: string }>
  highlightedIds?: string[]
  onChipSelect?: (id: string | null) => void
}

const resourceIconMap: Partial<Record<string, LucideIcon>> = {
  cpu: Cpu, memory: MemoryStick, disk: HardDrive, network: Network,
}
const processIconMap: Partial<Record<string, LucideIcon>> = {
  postmaster: CircleDot, backend: Activity,
  redis_server: Server, kafka_server: Server, mysqld: Server,
  main_thread: Activity,
}

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

// Resolve count_from → number from nodeConfig
function resolveCount(countFrom: string | undefined, config: NodeConfig | undefined): number | undefined {
  if (!countFrom || !config) return undefined
  const key = countFrom.replace('config.', '')
  const val = Number(config[key])
  return isNaN(val) ? undefined : Math.max(1, val)
}

// ── Axis 1 ─────────────────────────────────────────────────────────────────

function Axis1Column({ template, nodeConfig, highlightedIds = [], onChipSelect }: AxisColumnProps) {
  const { d1 } = template.axis1

  const [activeD1Id, setActiveD1Id]     = useState<string | null>(null)
  const [activeD2Id, setActiveD2Id]     = useState<string | null>(null)
  const [activeD3Id, setActiveD3Id]     = useState<string | null>(null)
  const [expandedD1Id, setExpandedD1Id] = useState<string | null>(null)
  const [expandedD2Id, setExpandedD2Id] = useState<string | null>(null)

  const expandedD1Node = d1.nodes.find(n => n.id === expandedD1Id)
  const d2Nodes        = expandedD1Node?.d2?.nodes ?? []
  const expandedD2Node = d2Nodes.find(n => n.id === expandedD2Id)
  const d3Nodes        = expandedD2Node?.d3?.nodes ?? []

  // Build countMap for each depth level from count_from on chip nodes
  const buildCountMap = (nodes: typeof d1.nodes) => {
    const map: Record<string, number> = {}
    for (const n of nodes) {
      if (n.count_from) {
        const count = resolveCount(n.count_from, nodeConfig)
        if (count !== undefined) map[n.id] = count
      }
    }
    return map
  }
  const d1CountMap = buildCountMap(d1.nodes)
  const d2CountMap = buildCountMap(d2Nodes)
  const d3CountMap = buildCountMap(d3Nodes)

  const handleD1Click = (id: string) => {
    const next = activeD1Id === id ? null : id
    setActiveD1Id(next)
    if (!next) { setExpandedD1Id(null); setExpandedD2Id(null); setActiveD2Id(null); setActiveD3Id(null) }
    onChipSelect?.(next)
  }
  const handleD1Expand = (id: string) => {
    const next = expandedD1Id === id ? null : id
    setExpandedD1Id(next)
    setExpandedD2Id(null); setActiveD2Id(null); setActiveD3Id(null)
  }

  const handleD2Click = (id: string) => {
    const next = activeD2Id === id ? null : id
    setActiveD2Id(next)
    if (!next) { setExpandedD2Id(null); setActiveD3Id(null) }
    onChipSelect?.(next)
  }
  const handleD2Expand = (id: string) => {
    const next = expandedD2Id === id ? null : id
    setExpandedD2Id(next)
    setActiveD3Id(null)
  }

  const handleD3Click = (id: string) => {
    const next = activeD3Id === id ? null : id
    setActiveD3Id(next)
    onChipSelect?.(next)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <AxisHeader label="Axis 1 — Logical" accent="var(--electric-400)" />

      <DepthBlock
        depthNum={1} label={d1.label} nodes={d1.nodes} colorScheme="blue"
        activeNodeId={activeD1Id} expandedNodeId={expandedD1Id}
        highlightedIds={highlightedIds}
        countMap={d1CountMap}
        onChipClick={handleD1Click}
        onChipExpand={handleD1Expand}
      />

      {expandedD1Id && expandedD1Node?.d2 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ArrowDown size={14} style={{ color: 'var(--ink-600)' }} />
          </div>
          <DepthBlock
            depthNum={2} label={expandedD1Node.d2.label} nodes={d2Nodes} colorScheme="blue"
            activeNodeId={activeD2Id} expandedNodeId={expandedD2Id}
            highlightedIds={highlightedIds}
            countMap={d2CountMap}
            onChipClick={handleD2Click}
            onChipExpand={handleD2Expand}
          />
        </>
      )}

      {expandedD2Id && expandedD2Node?.d3 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ArrowDown size={14} style={{ color: 'var(--ink-600)' }} />
          </div>
          <DepthBlock
            depthNum={3} label={expandedD2Node.d3.label} nodes={d3Nodes} colorScheme="blue"
            activeNodeId={activeD3Id}
            highlightedIds={highlightedIds}
            countMap={d3CountMap}
            onChipClick={handleD3Click}
          />
        </>
      )}
    </div>
  )
}

// ── Axis 2 ─────────────────────────────────────────────────────────────────

function computeEmphasis(_chipId: string, def: { config_key: string; unit?: string; warn_above?: number; warn_below?: number }, config: NodeConfig | undefined): { badge: string; warn: boolean } | null {
  if (!config) return null
  const raw = config[def.config_key]
  if (raw === undefined || raw === '') return null
  const badge = def.unit ? `${raw} ${def.unit}` : String(raw)
  const num = Number(raw)
  const warn = (!isNaN(num) && def.warn_above !== undefined && num > def.warn_above) ||
               (!isNaN(num) && def.warn_below !== undefined && num < def.warn_below)
  return { badge, warn }
}

function Axis2Column({ template, nodeConfig, currentTopology, mutationNodes = [], mutationEdges = [], highlightedIds = [], onChipSelect }: AxisColumnProps) {
  const [activeChipId, setActiveChipId] = useState<string | null>(null)
  const [expandedSubChip, setExpandedSubChip] = useState<Record<string, string | null>>({})

  const visibleLayers = [...template.axis2.layers]
    .filter(l => !l.topology_condition || l.topology_condition.includes(currentTopology))
    .reverse()

  // Split nested layers (e.g. threads → nested inside process) from top-level
  const nestedLayerMap: Record<string, Axis2Layer> = {}
  for (const layer of visibleLayers) {
    if (layer.nested_in) nestedLayerMap[layer.nested_in] = layer
  }
  const topLevelLayers = visibleLayers.filter(l => !l.nested_in)

  // Auto-expand hardware chip when its sub_chips appear in highlightedIds
  useEffect(() => {
    const hw = template.axis2.layers.find(l => l.id === 'hardware')
    if (!hw) return
    for (const chip of hw.components) {
      if (chip.sub_chips?.some(sub => highlightedIds.includes(sub.id))) {
        setExpandedSubChip(prev =>
          prev['hardware'] === chip.id ? prev : { ...prev, hardware: chip.id }
        )
        return
      }
    }
  }, [highlightedIds, template])

  const handleChipClick = (chipId: string) => {
    const next = activeChipId === chipId ? null : chipId
    setActiveChipId(next)
    onChipSelect?.(next)
  }
  const handleDrillableClick = (layerId: string, chipId: string) => {
    setExpandedSubChip(prev => ({ ...prev, [layerId]: prev[layerId] === chipId ? null : chipId }))
    handleChipClick(chipId)
  }

  const accent = (id: string) => layerAccent[id] ?? 'var(--ink-400)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <AxisHeader label="Axis 2 — Physical" accent="#c4a8ff" />

      {topLevelLayers.map((layer, idx) => {
        const isHardware = layer.id === 'hardware'
        const isProcess  = layer.id === 'process'
        const acc = accent(layer.id)
        const nestedLayer = nestedLayerMap[layer.id]

        return (
          <div key={layer.id}>
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

              <div style={{ padding: '8px 12px 10px' }}>
                {isHardware ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {layer.components.map(chip => {
                      const expanded = expandedSubChip[layer.id] === chip.id
                      const Icon = resourceIconMap[chip.id]
                      const emp = template.chip_emphasis?.[chip.id]
                      const empResult = emp ? computeEmphasis(chip.id, emp, nodeConfig) : null
                      return (
                        <div key={chip.id}>
                          <ChipNode
                            id={chip.id} label={chip.label}
                            drillable={!!chip.sub_chips?.length} tooltip={chip.tooltip}
                            colorScheme="teal"
                            active={activeChipId === chip.id}
                            crossHighlighted={highlightedIds.includes(chip.id)}
                            icon={Icon}
                            configBadge={empResult?.badge}
                            configWarn={empResult?.warn}
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
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {layer.components.map(chip => {
                      const expanded = !!chip.sub_chips?.length && expandedSubChip[layer.id] === chip.id
                      const Icon = isProcess ? (processIconMap[chip.id] ?? CircleDot) : undefined
                      const colorScheme = (layer.id === 'os' || layer.id === 'container' || layer.id === 'container_runtime' || layer.id === 'process') ? 'teal' : 'purple'
                      const emp2 = template.chip_emphasis?.[chip.id]
                      const emp2Result = emp2 ? computeEmphasis(chip.id, emp2, nodeConfig) : null
                      return (
                        <div key={chip.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <ChipNode
                            id={chip.id} label={chip.label}
                            drillable={!!chip.sub_chips?.length} tooltip={chip.tooltip}
                            colorScheme={colorScheme as 'teal' | 'purple'}
                            active={activeChipId === chip.id}
                            crossHighlighted={highlightedIds.includes(chip.id)}
                            icon={Icon}
                            configBadge={emp2Result?.badge}
                            configWarn={emp2Result?.warn}
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
                )}

                {/* Threads nested inside the process card */}
                {isProcess && nestedLayer && (
                  <div style={{
                    marginTop: 10, paddingTop: 10,
                    borderTop: `1px solid ${layerAccent.threads}28`,
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.12em',
                      color: layerAccent.threads, marginBottom: 7,
                    }}>
                      {nestedLayer.name}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {nestedLayer.components.map(chip => {
                        const empN = template.chip_emphasis?.[chip.id]
                        const empNResult = empN ? computeEmphasis(chip.id, empN, nodeConfig) : null
                        return (
                          <ChipNode
                            key={chip.id} id={chip.id} label={chip.label}
                            drillable={false} tooltip={chip.tooltip}
                            colorScheme="purple"
                            active={activeChipId === chip.id}
                            crossHighlighted={highlightedIds.includes(chip.id)}
                            icon={processIconMap[chip.id]}
                            configBadge={empNResult?.badge}
                            configWarn={empNResult?.warn}
                            onClick={() => handleChipClick(chip.id)}
                          />
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

      {/* Cluster panel for non-standalone topologies */}
      {mutationNodes.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '2px 0' }}>
            <ArrowDown size={12} style={{ color: 'var(--ink-700)' }} />
          </div>
          <div style={{
            borderRadius: 'var(--r-md)', border: '1px dashed var(--ink-600)',
            background: 'rgba(100,100,130,0.04)', overflow: 'hidden',
            borderLeft: '2px solid var(--ink-600)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderBottom: '1px solid var(--ink-700)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-400)' }}>
                Cluster — {currentTopology}
              </span>
            </div>
            <div style={{ padding: '8px 12px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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
          </div>
        </div>
      )}
    </div>
  )
}

// ── Wrapper ─────────────────────────────────────────────────────────────────

export default function AxisColumn(props: AxisColumnProps) {
  if (props.axis === 'axis1') return <Axis1Column {...props} />
  return <Axis2Column {...props} />
}
