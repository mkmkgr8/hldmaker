import type { Tier2Rule } from '../../types/schema'

export const kafkaRules: Tier2Rule[] = [
  {
    id: 'partitions_lt_consumers',
    severity: 'warning',
    condition: {
      all: [
        { field: 'node.config.partition_count', op: 'lt', value: 8 },
        { field: 'graph.consumer_count_estimate', op: 'gt', value: 'node.config.partition_count' },
      ],
    },
    message: 'Consumer count exceeds partition count — idle consumers will sit unused. Partition count is the parallelism ceiling.',
  },
  {
    id: 'replication_factor_lt_3',
    severity: 'warning',
    condition: { field: 'node.config.replication_factor', op: 'lt', value: 3 },
    message: 'Replication factor {{node.config.replication_factor}} — losing one broker may cause data loss. Recommended minimum is 3.',
    calc: {},
  },
  {
    id: 'single_broker',
    severity: 'error',
    condition: { field: 'node.config.broker_count', op: 'lt', value: 3 },
    message: '{{node.config.broker_count}} broker(s) — Kafka requires ≥3 brokers for replication_factor=3. Fewer brokers = no fault tolerance.',
    calc: {},
  },
  {
    id: 'zookeeper_deprecated',
    severity: 'info',
    condition: { field: 'node.config.coordinator', op: 'eq', value: 'zookeeper' },
    message: 'ZooKeeper mode is deprecated in Kafka 3.x. Migrate to KRaft (built-in consensus) to remove the ZooKeeper dependency.',
  },
]
