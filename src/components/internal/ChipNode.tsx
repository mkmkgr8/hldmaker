import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { LucideProps } from 'lucide-react'

type LucideIcon = React.ComponentType<LucideProps>

interface ChipNodeProps {
  id: string
  label: string
  drillable: boolean
  tooltip?: string
  active?: boolean
  crossHighlighted?: boolean
  colorScheme?: 'blue' | 'purple' | 'teal'
  icon?: LucideIcon
  expanded?: boolean
  onClick?: (id: string) => void
  onExpand?: (id: string) => void  // if provided, chevron click is separate from body click
}

const scheme = {
  blue:   { bg: 'rgba(124,196,255,0.07)', border: 'rgba(124,196,255,0.2)',  text: 'var(--electric-400)',  activeBg: 'rgba(124,196,255,0.13)', activeBorder: 'var(--electric)',  activeShadow: '0 0 0 2px rgba(124,196,255,0.18)' },
  purple: { bg: 'rgba(179,136,255,0.07)', border: 'rgba(179,136,255,0.2)',  text: '#c4a8ff',              activeBg: 'rgba(179,136,255,0.13)', activeBorder: '#b388ff',          activeShadow: '0 0 0 2px rgba(179,136,255,0.18)' },
  teal:   { bg: 'rgba(124,226,157,0.07)', border: 'rgba(124,226,157,0.2)',  text: 'var(--ok)',            activeBg: 'rgba(124,226,157,0.13)', activeBorder: 'var(--ok)',        activeShadow: '0 0 0 2px rgba(124,226,157,0.18)' },
}

export default function ChipNode({
  id, label, drillable, tooltip,
  active = false, crossHighlighted = false,
  colorScheme = 'blue', icon: Icon,
  expanded = false, onClick, onExpand,
}: ChipNodeProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const s = scheme[colorScheme]

  const bg     = crossHighlighted ? 'rgba(244,162,89,0.1)'  : active ? s.activeBg     : s.bg
  const border = crossHighlighted ? 'rgba(244,162,89,0.65)' : active ? s.activeBorder  : s.border
  const color  = crossHighlighted ? 'var(--warn)'           : active ? s.activeBorder  : s.text
  const shadow = crossHighlighted
    ? '0 0 0 2px rgba(244,162,89,0.2), 0 0 12px rgba(244,162,89,0.1)'
    : active ? s.activeShadow : 'none'

  // When onExpand is provided, body click = cross-links, chevron click = expand.
  // When onExpand is absent, single click handles everything (A2 chips, D3 chips).
  const hasSplitBehavior = drillable && !!onExpand

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        role="button"
        tabIndex={0}
        onMouseEnter={() => tooltip && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => !hasSplitBehavior && onClick?.(id)}
        onKeyDown={e => e.key === 'Enter' && !hasSplitBehavior && onClick?.(id)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 0,
          fontFamily: 'var(--font-mono)', fontSize: 11,
          borderRadius: 'var(--r-sm)',
          background: bg, border: `1px solid ${border}`,
          color, boxShadow: shadow,
          cursor: 'pointer',
          transition: 'all 140ms var(--ease)',
          fontWeight: active ? 500 : 400,
          userSelect: 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
      >
        {/* Chip body — click = cross-links */}
        <div
          onClick={hasSplitBehavior ? e => { e.stopPropagation(); onClick?.(id) } : undefined}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 7px' }}
        >
          {Icon && <Icon size={10} style={{ flexShrink: 0, opacity: 0.75 }} />}
          {label}
        </div>

        {/* Chevron — click = expand/collapse D2 or D3 */}
        {drillable && (
          <div
            role="button"
            tabIndex={-1}
            onClick={e => {
              e.stopPropagation()
              if (hasSplitBehavior) onExpand(id)
              else onClick?.(id)
            }}
            style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '3px 6px 3px 2px',
              borderLeft: hasSplitBehavior ? `1px solid ${border}` : 'none',
              opacity: 0.7,
              transition: 'opacity 120ms',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0.7'}
          >
            <ChevronDown
              size={9}
              style={{
                transform: (hasSplitBehavior ? expanded : active) ? 'rotate(180deg)' : 'none',
                transition: 'transform 120ms var(--ease)',
              }}
            />
          </div>
        )}
      </div>

      {showTooltip && tooltip && (
        <div style={{
          position: 'absolute', zIndex: 50, bottom: '100%', left: 0, marginBottom: 6,
          width: 240, background: 'var(--ink-800)', border: '1px solid var(--ink-600)',
          borderRadius: 'var(--r-md)', padding: '10px 12px',
          boxShadow: 'var(--shadow-pop)', pointerEvents: 'none',
          fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-200)',
          lineHeight: 1.55,
        }}>
          {tooltip}
        </div>
      )}
    </div>
  )
}
