import type { Tier2Rule } from '../../types/schema'

export const redisRules: Tier2Rule[] = [
  {
    id: 'no_maxmemory',
    severity: 'warning',
    condition: { field: 'node.config.maxmemory', op: 'eq', value: '' },
    message: 'maxmemory not set — Redis will grow unbounded and OOM-kill the host under load. Set maxmemory + eviction policy.',
  },
  {
    id: 'noeviction_with_cache_pattern',
    severity: 'warning',
    condition: {
      all: [
        { field: 'node.config.eviction_policy', op: 'eq', value: 'noeviction' },
        { field: 'graph.outbound_node_types', op: 'includes', value: 'postgres' },
      ],
    },
    message: 'noeviction policy + cache-aside pattern = Redis returns OOM errors when full instead of evicting old keys. Use allkeys-lru for a cache.',
  },
  {
    id: 'no_persistence_primary_store',
    severity: 'info',
    condition: { field: 'node.config.persistence', op: 'eq', value: 'none' },
    message: 'Persistence disabled — all data lost on restart. Acceptable for a pure cache; not for a primary store.',
  },
  {
    id: 'standalone_no_ha',
    severity: 'warning',
    condition: { field: 'node.topology', op: 'eq', value: 'standalone' },
    message: 'Standalone Redis = single point of failure. Use ha (Sentinel) for auto-failover or cluster for sharding + HA.',
  },
]
