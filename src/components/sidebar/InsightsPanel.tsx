import type { EvalResult, Severity, Tier1Insight } from '../../types/schema'

const severityColor: Record<Severity, string> = {
  info:    'var(--info)',
  warning: 'var(--warn)',
  error:   'var(--danger)',
}

const severityLabel: Record<Severity, string> = {
  info:    'info',
  warning: 'warn',
  error:   'bottleneck',
}

interface InsightCardProps {
  severity: Severity
  text: string
  tier: 1 | 2
}

function InsightCard({ severity, text, tier }: InsightCardProps) {
  const color = severityColor[severity]
  return (
    <div style={{
      background: 'var(--ink-800)', border: '1px solid var(--ink-700)',
      borderRadius: 'var(--r-md)', padding: 14,
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase',
          letterSpacing: '0.1em', color,
        }}>
          {severityLabel[severity]}
        </span>
        <span style={{
          marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--ink-500)', background: 'var(--ink-900)',
          border: '1px solid var(--ink-700)', padding: '1px 5px', borderRadius: 2,
        }}>
          T{tier}
        </span>
      </div>
      <p style={{
        fontFamily: 'var(--font-sans)', fontSize: 12.5, color: 'var(--ink-300)',
        lineHeight: 1.55,
      }}>{text}</p>
    </div>
  )
}

interface InsightsPanelProps {
  tier1: Tier1Insight[]
  tier2: EvalResult[]
}

export default function InsightsPanel({ tier1, tier2 }: InsightsPanelProps) {
  if (tier1.length === 0 && tier2.length === 0) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 500,
        textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-300)',
      }}>
        Insights
      </span>
      {tier2.map((r, i) => <InsightCard key={i} severity={r.severity} text={r.text} tier={2} />)}
      {tier1.map((r, i) => <InsightCard key={`t1-${i}`} severity={r.severity} text={r.text} tier={1} />)}
    </div>
  )
}
