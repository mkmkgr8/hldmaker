import { memo, useCallback } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { useUIStore } from '../../store/useUIStore'
import type { DesignNode } from '../../types/schema'

const catColor: Record<string, string> = {
  postgres: 'var(--cat-db)',
  mysql:    'var(--cat-db)',
  kafka:    'var(--cat-queue)',
  redis:    'var(--cat-cache)',
}

const svgSrc: Record<string, string> = {
  postgres: '/services/postgresql.svg',
  mysql:    '/services/mysql.svg',
  kafka:    '/services/apachekafka.svg',
  redis:    '/services/redis.svg',
}

const topoLabel: Record<string, string> = {
  standalone: 'standalone',
  primary_replicas: 'primary + replicas',
  ha: 'HA',
  cluster: 'cluster',
}

interface NodeData { designNode: DesignNode }

function ComponentNode({ data, selected }: NodeProps<NodeData>) {
  const { designNode } = data
  const openInternalView = useUIStore(s => s.openInternalView)
  const cat = catColor[designNode.type] ?? 'var(--cat-db)'

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    openInternalView(designNode.id, designNode.label)
  }, [designNode.id, designNode.label, openInternalView])

  return (
    <div
      onDoubleClick={handleDoubleClick}
      title="Double-click to open internals"
      style={{
        background: 'var(--ink-800)',
        border: `1px solid ${selected ? 'var(--electric)' : 'var(--ink-700)'}`,
        borderRadius: 'var(--r-md)',
        boxShadow: selected ? '0 0 0 3px rgba(124,196,255,0.18)' : 'none',
        minWidth: 170,
        position: 'relative',
        cursor: 'pointer',
        transition: 'border 120ms var(--ease), box-shadow 120ms var(--ease)',
        overflow: 'visible',
        userSelect: 'none',
      }}
    >
      {/* Category stripe */}
      <span style={{
        position: 'absolute', left: 0, top: 8, bottom: 8, width: 3,
        background: cat,
        borderRadius: '0 2px 2px 0',
      }} />

      {/* Connection anchors */}
      <Handle type="target" position={Position.Left} style={{
        width: 8, height: 8, borderRadius: '50%',
        background: selected ? 'var(--electric)' : 'var(--ink-600)',
        border: 'none', left: -4,
      }} />
      <Handle type="source" position={Position.Right} style={{
        width: 8, height: 8, borderRadius: '50%',
        background: selected ? 'var(--electric)' : 'var(--ink-600)',
        border: 'none', right: -4,
      }} />

      {/* Body */}
      <div style={{ padding: '9px 12px 9px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img
            src={svgSrc[designNode.type]}
            alt={designNode.type}
            style={{ width: 16, height: 16, filter: 'var(--logo-filter)', opacity: 0.9, flexShrink: 0 }}
          />
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 12.5, fontWeight: 500,
            color: 'var(--ink-50)', flex: 1, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {designNode.label}
          </span>
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-400)',
          marginTop: 6, display: 'flex', gap: 10,
        }}>
          <span>{topoLabel[designNode.topology]}</span>
        </div>
      </div>

      {/* Inline CTA shown when selected */}
      {selected && (
        <div
          onClick={(e) => { e.stopPropagation(); openInternalView(designNode.id, designNode.label) }}
          style={{
            position: 'absolute', right: 0, bottom: -28,
            background: 'var(--ink-800)', border: '1px solid var(--ink-700)',
            borderRadius: 'var(--r-sm)', padding: '4px 8px',
            fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--ink-100)',
            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
            whiteSpace: 'nowrap', zIndex: 10,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--electric)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--electric)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--ink-700)'
            ;(e.currentTarget as HTMLElement).style.color = 'var(--ink-100)'
          }}
        >
          Internals →
        </div>
      )}
    </div>
  )
}

export default memo(ComponentNode)
