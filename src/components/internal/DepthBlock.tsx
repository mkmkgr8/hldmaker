import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import ChipNode from './ChipNode'
import type { TemplateChipNode } from '../../types/schema'
import type { LucideProps } from 'lucide-react'

type LucideIcon = React.ComponentType<LucideProps>

interface DepthBlockProps {
  depthNum: 1 | 2 | 3
  label: string
  nodes: TemplateChipNode[]
  colorScheme?: 'blue' | 'purple' | 'teal'
  activeNodeId?: string | null
  highlightedIds?: string[]
  onChipClick?: (id: string, drillable: boolean) => void
  defaultExpanded?: boolean
  iconMap?: Partial<Record<string, LucideIcon>>
}

const depthBg: Record<number, string> = {
  1: 'var(--ink-800)',
  2: 'var(--ink-900)',
  3: 'var(--ink-800)',
}

export default function DepthBlock({
  depthNum, label, nodes, colorScheme = 'blue',
  activeNodeId, highlightedIds = [], onChipClick,
  defaultExpanded = true, iconMap = {},
}: DepthBlockProps) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <div style={{
      borderRadius: 'var(--r-md)',
      border: '1px solid var(--ink-700)',
      background: depthBg[depthNum],
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setExpanded(e => !e)}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', background: 'transparent', border: 'none', cursor: 'pointer',
          transition: 'background 120ms var(--ease)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 9.5, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--ink-500)',
          }}>
            D{depthNum}
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-100)' }}>{label}</span>
        </div>
        <ChevronRight
          size={13}
          style={{
            color: 'var(--ink-500)',
            transform: expanded ? 'rotate(90deg)' : 'none',
            transition: 'transform 120ms var(--ease)',
          }}
        />
      </button>

      {expanded && (
        <div style={{ padding: '4px 12px 12px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {nodes.map(chip => (
              <ChipNode
                key={chip.id}
                id={chip.id}
                label={chip.label}
                drillable={chip.drillable}
                tooltip={chip.tooltip}
                colorScheme={colorScheme}
                active={activeNodeId === chip.id}
                crossHighlighted={highlightedIds.includes(chip.id)}
                icon={iconMap[chip.id]}
                onClick={id => onChipClick?.(id, chip.drillable)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
