import type { Tier2Rule } from '../../types/schema'

export const mysqlRules: Tier2Rule[] = [
  {
    id: 'buffer_pool_too_small',
    severity: 'warning',
    condition: { field: 'node.config.innodb_buffer_pool_size', op: 'eq', value: '128MB' },
    message: 'innodb_buffer_pool_size is at the default 128MB. For production, set this to 70–80% of available RAM.',
  },
  {
    id: 'flush_log_unsafe',
    severity: 'warning',
    condition: { field: 'node.config.innodb_flush_log_at_trx_commit', op: 'eq', value: '0' },
    message: 'innodb_flush_log_at_trx_commit=0 — redo log only flushed every second. Up to 1 second of transactions lost on crash.',
  },
  {
    id: 'sync_binlog_off',
    severity: 'info',
    condition: { field: 'node.config.sync_binlog', op: 'eq', value: '0' },
    message: 'sync_binlog=0 — binlog not synced to disk on every write. May lose binlog events on crash (affects replication integrity).',
  },
  {
    id: 'standalone_spof',
    severity: 'warning',
    condition: { field: 'node.topology', op: 'eq', value: 'standalone' },
    message: 'Standalone MySQL = single point of failure. Use primary_replicas for read scaling or ha (ProxySQL + semi-sync) for failover.',
  },
]
