import { useEffect, useCallback } from 'react'
import { X, Trash2 } from 'lucide-react'
import { useDesignStore } from '../../store/useDesignStore'
import { useUIStore } from '../../store/useUIStore'
import { templates } from '../../data/templates'
import { rulesByType } from '../../data/tier2Rules'
import { evaluateRules } from '../../utils/ruleEngine'
import ConfigField from './ConfigField'
import TopologySwitcher from './TopologySwitcher'
import InsightsPanel from './InsightsPanel'

const svgSrc: Record<string, string> = {
  postgres: '/services/postgresql.svg',
  mysql:    '/services/mysql.svg',
  kafka:    '/services/apachekafka.svg',
  redis:    '/services/redis.svg',
}

export default function NodeSidebar() {
  const { selectedNodeId, setSelectedNode, openInternalView } = useUIStore()
  const { design, updateNodeConfig, updateNodeTopology, updateNodeLabel, removeNode } = useDesignStore()
  const node = design.canvas.nodes.find(n => n.id === selectedNodeId)

  const handleClose = useCallback(() => setSelectedNode(null), [setSelectedNode])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose])

  if (!node) return null
  const template = templates[node.type]
  if (!template) return null

  const tier2Results = evaluateRules(node, rulesByType[node.type] ?? [], design)

  const handleDelete = () => { removeNode(node.id); setSelectedNode(null) }

  return (
    <div style={{
      width: 360, display: 'flex', flexDirection: 'column', height: '100%',
      background: 'var(--ink-900)', borderLeft: '1px solid var(--ink-700)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 14px', borderBottom: '1px solid var(--ink-700)',
      }}>
        <img src={svgSrc[node.type]} alt="" style={{ width: 28, height: 28, filter: 'var(--logo-filter)', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <input
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 600,
              color: 'var(--ink-50)', background: 'transparent',
              border: 'none', outline: 'none', width: '100%',
            }}
            value={node.label}
            onChange={e => updateNodeLabel(node.id, e.target.value)}
          />
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-400)', marginTop: 2 }}>
            {template.flavor.split('·')[0].trim()}
          </p>
        </div>
        <button
          onClick={handleDelete}
          style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 'var(--r-sm)', color: 'var(--ink-400)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--ink-800)'; e.currentTarget.style.color = 'var(--danger)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-400)' }}
        >
          <Trash2 size={14} />
        </button>
        <button
          onClick={handleClose}
          style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 'var(--r-sm)', color: 'var(--ink-400)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--ink-800)'; e.currentTarget.style.color = 'var(--ink-100)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ink-400)' }}
        >
          <X size={14} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Topology */}
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-300)', display: 'block', marginBottom: 8 }}>Topology</span>
          <TopologySwitcher available={template.topologies} current={node.topology} onChange={t => updateNodeTopology(node.id, t)} />
        </div>

        {/* Open internals */}
        <button
          onClick={() => openInternalView(node.id, node.label)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px',
            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
            background: 'var(--ink-800)', border: '1px solid var(--ink-700)',
            borderRadius: 'var(--r-sm)', color: 'var(--ink-100)', cursor: 'pointer',
            transition: 'all 120ms var(--ease)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--electric)'; e.currentTarget.style.color = 'var(--electric)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--ink-700)'; e.currentTarget.style.color = 'var(--ink-100)' }}
        >
          Open internals <span>→</span>
        </button>

        {/* Config */}
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-300)', display: 'block', marginBottom: 10 }}>Configuration</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {Object.entries(template.config_schema).map(([key, schema]) => (
              <ConfigField
                key={key}
                fieldKey={key}
                schema={schema}
                value={node.config[key] ?? schema.options?.[0] ?? ''}
                onChange={(k, v) => updateNodeConfig(node.id, { [k]: v })}
              />
            ))}
          </div>
        </div>

        {/* Insights */}
        <InsightsPanel tier1={template.tier1_insights} tier2={tier2Results} />
      </div>
    </div>
  )
}
