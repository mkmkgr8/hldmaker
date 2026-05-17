import { useState } from 'react'
import { Search } from 'lucide-react'
import type { ComponentType } from '../../types/schema'

const groups: {
  cat: string
  color: string
  items: { type: ComponentType; name: string; svg: string }[]
}[] = [
  {
    cat: 'Databases', color: 'var(--cat-db)',
    items: [
      { type: 'postgres', name: 'PostgreSQL', svg: '/services/postgresql.svg' },
      { type: 'mysql',    name: 'MySQL',      svg: '/services/mysql.svg' },
    ],
  },
  {
    cat: 'Queues', color: 'var(--cat-queue)',
    items: [
      { type: 'kafka', name: 'Apache Kafka', svg: '/services/apachekafka.svg' },
    ],
  },
  {
    cat: 'Caches', color: 'var(--cat-cache)',
    items: [
      { type: 'redis', name: 'Redis', svg: '/services/redis.svg' },
    ],
  },
]

export default function ComponentPalette() {
  const [q, setQ] = useState('')
  const [openCats, setOpenCats] = useState(new Set(groups.map(g => g.cat)))

  const toggle = (cat: string) => {
    const next = new Set(openCats)
    next.has(cat) ? next.delete(cat) : next.add(cat)
    setOpenCats(next)
  }

  const onDragStart = (e: React.DragEvent, type: ComponentType) => {
    e.dataTransfer.setData('application/hldmaker', type)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <aside style={{
      width: 240, display: 'flex', flexDirection: 'column',
      background: 'var(--ink-900)', borderRight: '1px solid var(--ink-700)',
      minHeight: 0,
    }}>
      <div style={{ padding: '14px 14px 4px' }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10.5, fontWeight: 500,
          textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--ink-300)',
        }}>
          Services
        </span>
      </div>

      {/* Search */}
      <div style={{
        margin: '8px 12px 12px', padding: '7px 10px', gap: 8,
        display: 'flex', alignItems: 'center',
        background: 'var(--ink-900)', border: '1px solid var(--ink-700)',
        borderRadius: 'var(--r-sm)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
      }}>
        <Search size={13} color="var(--ink-400)" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Add a service…"
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-100)',
          }}
        />
      </div>

      {/* Groups */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 14px' }}>
        {groups.map(group => {
          const items = group.items.filter(i => i.name.toLowerCase().includes(q.toLowerCase()))
          if (items.length === 0) return null
          const isOpen = openCats.has(group.cat)
          return (
            <div key={group.cat} style={{ marginTop: 8 }}>
              <button
                onClick={() => toggle(group.cat)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 8px', background: 'transparent', border: 'none',
                  cursor: 'pointer', color: 'var(--ink-300)',
                  fontFamily: 'var(--font-mono)', fontSize: 10.5,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: group.color }} />
                <span style={{ flex: 1, textAlign: 'left' }}>{group.cat}</span>
                <span style={{ color: 'var(--ink-500)' }}>{items.length}</span>
              </button>
              {isOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '2px 0 6px' }}>
                  {items.map(it => (
                    <div
                      key={it.type}
                      draggable
                      onDragStart={e => onDragStart(e, it.type)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 10px',
                        borderRadius: 'var(--r-sm)',
                        background: 'var(--ink-800)', border: '1px solid var(--ink-700)',
                        cursor: 'grab', position: 'relative', overflow: 'hidden',
                        transition: 'border 120ms var(--ease)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--ink-600)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--ink-700)')}
                    >
                      {/* category stripe */}
                      <span style={{
                        position: 'absolute', left: 0, top: 4, bottom: 4, width: 2,
                        background: group.color, borderRadius: '0 2px 2px 0',
                      }} />
                      <img src={it.svg} alt="" style={{ width: 16, height: 16, filter: 'var(--logo-filter)', opacity: 0.92 }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-100)' }}>
                        {it.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
