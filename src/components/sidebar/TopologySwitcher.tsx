import type { Topology } from '../../types/schema'

const labels: Partial<Record<Topology, string>> = {
  standalone: 'Standalone',
  primary_replicas: 'Primary + replicas',
  ha: 'HA',
  cluster: 'Cluster',
  containerized: 'Containerized',
  kubernetes: 'Kubernetes',
}

interface TopologySwitcherProps {
  available: Topology[]
  current: Topology
  onChange: (t: Topology) => void
}

export default function TopologySwitcher({ available, current, onChange }: TopologySwitcherProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {available.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 500,
            padding: '4px 8px', borderRadius: 'var(--r-xs)', border: '1px solid',
            cursor: 'pointer',
            background: current === t ? 'var(--electric)' : 'var(--ink-800)',
            borderColor: current === t ? 'var(--electric)' : 'var(--ink-700)',
            color: current === t ? '#08111d' : 'var(--ink-200)',
            transition: 'all 120ms var(--ease)',
          }}
        >
          {labels[t]}
        </button>
      ))}
    </div>
  )
}
