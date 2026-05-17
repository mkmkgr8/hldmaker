import type { Tier2Rule } from '../../types/schema'

export const postgresRules: Tier2Rule[] = [
  {
    id: 'high_conn_no_pooler',
    severity: 'warning',
    condition: {
      all: [
        { field: 'node.config.max_connections', op: 'gt', value: 200 },
        { field: 'graph.inbound_node_types', op: 'not_includes', value: 'pgbouncer' },
      ],
    },
    message: '{{node.config.max_connections}} direct connections = ~{{calc.conn_ram_gb}}GB RAM overhead before any queries run. Add PgBouncer.',
    calc: { conn_ram_gb: 'round(node.config.max_connections * 8 / 1024, 1)' },
  },
  {
    id: 'async_repl_with_cache',
    severity: 'warning',
    condition: {
      all: [
        { field: 'node.topology', op: 'eq', value: 'primary_replicas' },
        { field: 'node.config.wal_mode', op: 'eq', value: 'async' },
        { field: 'graph.sibling_node_types', op: 'includes', value: 'redis' },
      ],
    },
    message: 'Async WAL replication + Redis cache-aside = stale read risk. Replica lag means Redis and replica may disagree.',
  },
  {
    id: 'no_ha_single_node',
    severity: 'warning',
    condition: { field: 'node.topology', op: 'eq', value: 'standalone' },
    message: 'Standalone Postgres = single point of failure. Consider primary_replicas for read scaling or ha for automatic failover.',
  },
  {
    id: 'maxconn_very_high',
    severity: 'error',
    condition: { field: 'node.config.max_connections', op: 'gt', value: 500 },
    message: '{{node.config.max_connections}} connections will exhaust RAM. Each idle connection costs ~8MB. Use a connection pooler (PgBouncer) and set this to ≤200.',
    calc: {},
  },
]
