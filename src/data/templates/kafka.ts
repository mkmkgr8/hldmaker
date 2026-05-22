import type { ComponentTemplate } from '../../types/schema'

export const kafkaTemplate: ComponentTemplate = {
  type: 'kafka',
  display_name: 'Kafka',
  flavor: 'JVM (Scala/Java) · distributed commit log · zero-copy sendfile · OS page cache as buffer',
  color: 'orange',
  icon: 'GitBranch',
  topologies: ['standalone', 'cluster'],
  default_config: {
    version: '3.7',
    broker_count: 3,
    partition_count: 6,
    replication_factor: 3,
    retention_hours: 168,
    jvm_heap_gb: 6,
    coordinator: 'kraft',
  },
  config_schema: {
    version:            { type: 'select', label: 'Version', options: ['3.5', '3.6', '3.7'] },
    broker_count:       { type: 'number', label: 'Broker count', min: 1, max: 100 },
    partition_count:    { type: 'number', label: 'Default partition count', min: 1, max: 1000 },
    replication_factor: { type: 'number', label: 'Replication factor', min: 1, max: 10 },
    retention_hours:    { type: 'number', label: 'Retention (hours)', min: 1 },
    jvm_heap_gb:        { type: 'number', label: 'JVM heap (GB)', min: 1, max: 64 },
    coordinator:        { type: 'select', label: 'Coordinator', options: ['zookeeper', 'kraft'] },
  },

  // ── Axis 1 — Service internals ──────────────────────────────────────────
  axis1: {
    d1: {
      label: 'Streaming objects',
      nodes: [
        {
          id: 'topic', label: 'Topic', drillable: true,
          tooltip: 'Click body to cross-link. Click ↓ to drill into distribution & storage model.',
          d2: {
            label: 'Distribution & storage model',
            nodes: [
              {
                id: 'partition', label: 'Partition', drillable: true,
                count_from: 'config.partition_count',
                tooltip: 'Unit of parallelism and ordering. One active consumer per partition per group.',
                d3: {
                  label: 'Java internals — partition',
                  nodes: [
                    { id: 'LogSegment',     label: 'LogSegment',     drillable: false, tooltip: 'Represents one .log + .index + .timeindex triplet. Manages append, read, and truncation.' },
                    { id: 'AbstractIndex',  label: 'AbstractIndex',  drillable: false, tooltip: 'Base class for OffsetIndex and TimeIndex. Uses MappedByteBuffer (mmap) for zero-copy access.' },
                    { id: 'RecordBatch',    label: 'RecordBatch',    drillable: false, tooltip: 'Wire format unit: magic byte, attributes, first/last offsets, timestamps, records[].' },
                    { id: 'MemoryRecords',  label: 'MemoryRecords',  drillable: false, tooltip: 'Immutable wrapper around a ByteBuffer of serialised batches. Producer and broker share this type.' },
                    { id: 'KafkaChannel',   label: 'KafkaChannel',   drillable: false, tooltip: 'Wraps a NIO SocketChannel. Holds inbound TransportLayer + send queue of NetworkSend objects.' },
                    { id: 'ByteBufferSend', label: 'ByteBufferSend', drillable: false, tooltip: 'Send implementation backed by a ByteBuffer. Written to the NIC via channel.write() / sendfile().' },
                    { id: 'ProducerBatch',  label: 'ProducerBatch',  drillable: false, tooltip: 'Client-side accumulator: batches records in a MemoryRecords buffer before sending.' },
                  ],
                },
              },
              { id: 'offset',      label: 'Offset',                  drillable: false },
              { id: 'replica',     label: 'Replica',                  drillable: false },
              { id: 'isr',         label: 'ISR (in-sync reps)',       drillable: false, tooltip: 'Replicas caught up to leader. acks=all waits for all ISR members — losing ISR members raises tail latency.' },
              { id: 'leader',      label: 'Leader / follower',        drillable: false },
              {
                id: 'log_segment', label: 'Log segment (.log)', drillable: true,
                tooltip: 'Sequential binary file of messages. Active segment is append-only; closed segments are immutable.',
                d3: {
                  label: 'Java internals — log segment',
                  nodes: [
                    { id: 'LogSegment',    label: 'LogSegment',    drillable: false, tooltip: 'Represents one .log + .index + .timeindex triplet. Manages append, read, and truncation.' },
                    { id: 'AbstractIndex', label: 'AbstractIndex', drillable: false, tooltip: 'Base class for OffsetIndex and TimeIndex. Uses MappedByteBuffer (mmap) for zero-copy access.' },
                  ],
                },
              },
              { id: 'offset_index', label: 'Offset index (.index)',      drillable: false, tooltip: 'Sparse index: offset → byte position in .log. Allows O(log n) seek without reading the whole log.' },
              { id: 'time_index',   label: 'Time index (.timeindex)',     drillable: false },
              { id: 'retention',    label: 'Retention policy',           drillable: false },
            ],
          },
        },
        {
          id: 'consumer_group', label: 'Consumer group', drillable: true,
          tooltip: 'Click body to cross-link. Click ↓ to drill into group internals.',
          d2: {
            label: 'Consumer group internals',
            nodes: [
              { id: 'cg_member',           label: 'Member (consumer)',    drillable: false, tooltip: 'One consumer instance in the group. Gets assigned N partitions. Sends heartbeats every heartbeat.interval.ms.' },
              { id: 'partition_assignment', label: 'Partition assignment', drillable: false, tooltip: 'Range or RoundRobin assignor splits partitions across members. Sticky assignor minimises reassignment on rebalance.' },
              { id: 'committed_offset',     label: 'Committed offset',     drillable: false, tooltip: 'Stored in __consumer_offsets topic. This is where the group resumes after restart or rebalance.' },
              { id: 'heartbeat',            label: 'Heartbeat',            drillable: false, tooltip: 'session.timeout.ms: if no heartbeat in this window, member is declared dead and rebalance triggers.' },
              { id: 'rebalance',            label: 'Rebalance',            drillable: false, tooltip: 'Triggered by member join/leave/timeout. ALL consumption stops during classic rebalance — major latency spike.' },
            ],
          },
        },
        { id: 'producer',        label: 'Producer',             drillable: false },
        { id: 'connector',       label: 'Connector',            drillable: false },
        { id: 'schema_registry', label: 'Schema (Registry)',    drillable: false },
      ],
    },
  },

  // ── Axis 2 — Execution stack (bottom → top) ────────────────────────────
  axis2: {
    layers: [
      {
        id: 'hardware', name: 'Hardware',
        components: [
          { id: 'cpu',    label: 'CPU',    drillable: true, sub_chips: [
            { id: 'cpu_cores', label: 'CPU cores',          drillable: false },
            { id: 'l3_cache',  label: 'L3 cache',           drillable: false },
            { id: 'runqueue',  label: 'Scheduler runqueue', drillable: false },
          ]},
          { id: 'memory', label: 'Memory (page cache!)', drillable: true, tooltip: 'Most of RAM should go to OS page cache — not JVM heap', sub_chips: [
            { id: 'dram',      label: 'DRAM',           drillable: false },
            { id: 'ram_pages', label: 'RAM pages (4KB)', drillable: false },
            { id: 'tlb',       label: 'TLB',            drillable: false },
          ]},
          { id: 'disk',   label: 'Disk (sequential)', drillable: true, tooltip: 'Sequential writes only — spinning HDD is acceptable for Kafka', sub_chips: [
            { id: 'block_dev', label: 'Block device',          drillable: false },
            { id: 'fs_layer',  label: 'Filesystem (ext4/xfs)', drillable: false },
            { id: 'sectors',   label: 'Disk sectors (512B)',   drillable: false },
          ]},
          { id: 'network', label: 'Network (replication)', drillable: true, sub_chips: [
            { id: 'nic',            label: 'NIC',            drillable: false },
            { id: 'tcp_stack',      label: 'TCP stack',      drillable: false },
            { id: 'socket_buffers', label: 'Socket buffers', drillable: false },
          ]},
        ],
      },
      {
        id: 'os', name: 'Host OS',
        components: [
          { id: 'page_cache',  label: 'OS page cache',      drillable: false, tooltip: 'Kafka data lives here — not in JVM heap. Producer writes land here; consumer reads come from here.' },
          { id: 'sendfile',    label: 'sendfile()',          drillable: false, tooltip: 'Zero-copy consumer path: page cache → NIC. No data ever enters userspace. This is why Kafka is fast.' },
          { id: 'epoll',       label: 'epoll',              drillable: false },
          { id: 'vfs',         label: 'VFS',                drillable: false },
          { id: 'scheduler',   label: 'OS scheduler',       drillable: false },
          { id: 'tcp_buffers', label: 'Kernel TCP buffers', drillable: false },
        ],
      },
      {
        id: 'process', name: 'Process',
        components: [
          { id: 'kafka_server', label: 'kafka-server',       drillable: false, tooltip: 'Single JVM process. All broker logic — LogManager, ReplicaManager, controller — runs in this one process.' },
          { id: 'zk_kraft',     label: 'ZooKeeper / KRaft',  drillable: false, tooltip: 'Coordination: leader election, topic config, ISR updates. KRaft removes the ZooKeeper dependency in 3.3+.' },
        ],
      },
      {
        id: 'threads', name: 'Threads',
        nested_in: 'process',
        components: [
          { id: 'net_handler',    label: 'network-handler-thread × N', drillable: false, tooltip: 'Accepts client connections and reads inbound request bytes via NIO selectors.' },
          { id: 'req_handler',    label: 'request-handler-thread × N', drillable: false, tooltip: 'num.io.threads (default 8). Processes requests off the network queue — produce, fetch, metadata.' },
          { id: 'io_thread',      label: 'I/O thread × N',             drillable: false, tooltip: 'Reads/writes log segment files on disk. Separate pool from network threads.' },
          { id: 'ctrl_thread',    label: 'controller thread',          drillable: false, tooltip: 'Manages partition leadership and ISR changes across the cluster.' },
          { id: 'fetcher_thread', label: 'replica-fetcher-thread',     drillable: false, tooltip: 'Follower brokers run one fetcher thread per leader they replicate from.' },
          { id: 'log_cleaner',    label: 'log-cleaner-thread',         drillable: false },
        ],
      },
      {
        id: 'runtime', name: 'JVM Runtime',
        components: [
          { id: 'jvm_heap',       label: 'JVM heap (~6GB)',  drillable: false, tooltip: 'Intentionally small. Kafka data (messages) never lives in JVM heap — it flows through OS page cache.' },
          { id: 'g1gc',           label: 'G1GC / ZGC',       drillable: false, tooltip: 'GC pauses = latency spikes. Tune heap carefully. ZGC recommended for <10ms pause targets.' },
          { id: 'jit',            label: 'JIT compiler',     drillable: false },
          { id: 'direct_buffers', label: 'Direct buffers',   drillable: false, tooltip: 'Off-heap NIO ByteBuffers. All network I/O goes through these — they map to OS socket buffers.' },
          { id: 'thread_stacks',  label: 'Thread stacks',    drillable: false, tooltip: 'Each JVM thread gets a stack in native memory (not heap). Default 512KB–1MB per thread.' },
          { id: 'metaspace',      label: 'Metaspace',        drillable: false },
        ],
      },
      {
        id: 'app_modules', name: 'App modules',
        components: [
          { id: 'log_manager',  label: 'LogManager',       drillable: false, tooltip: 'Owns all LogSegment objects for all partitions hosted on this broker.' },
          { id: 'replica_mgr',  label: 'ReplicaManager',   drillable: false, tooltip: 'Manages leader/follower state per partition. Handles produce/fetch on behalf of replicas.' },
          { id: 'kafka_ctrl',   label: 'KafkaController',  drillable: false, tooltip: 'One elected controller per cluster. Manages ISR shrink/expand, leader elections, topic changes.' },
          { id: 'group_coord',  label: 'GroupCoordinator', drillable: false, tooltip: 'Manages consumer group membership, heartbeats, rebalancing, and offset commits.' },
          { id: 'fetcher_mgr',  label: 'FetcherManager',   drillable: false },
        ],
      },
    ],
  },

  // ── Cross-links ─────────────────────────────────────────────────────────
  cross_links: {
    // A1 D1 → A2
    'topic':          ['log_manager', 'replica_mgr', 'page_cache', 'memory', 'disk'],
    'consumer_group': ['group_coord', 'net_handler', 'req_handler'],
    'producer':       ['net_handler', 'req_handler', 'direct_buffers', 'socket_buffers'],
    // A1 topic D2 → A2
    'partition':      ['log_manager', 'io_thread', 'page_cache', 'sendfile', 'memory', 'disk'],
    'offset':         ['group_coord', 'req_handler'],
    'replica':        ['replica_mgr', 'fetcher_thread', 'network', 'tcp_stack'],
    'isr':            ['replica_mgr', 'kafka_ctrl', 'net_handler'],
    'log_segment':    ['io_thread', 'page_cache', 'sendfile', 'disk', 'sectors'],
    'offset_index':   ['io_thread', 'memory', 'ram_pages'],
    'time_index':     ['io_thread', 'memory'],
    // A1 consumer_group D2 → A2
    'cg_member':            ['group_coord', 'net_handler', 'cpu'],
    'partition_assignment': ['group_coord', 'kafka_ctrl', 'req_handler'],
    'committed_offset':     ['group_coord', 'disk', 'req_handler'],
    'heartbeat':            ['group_coord', 'net_handler', 'cpu'],
    'rebalance':            ['group_coord', 'kafka_ctrl', 'net_handler', 'cpu'],
    // A1 D3 partition → A2
    'LogSegment':     ['log_manager', 'io_thread', 'jvm_heap', 'disk', 'page_cache'],
    'AbstractIndex':  ['io_thread', 'jvm_heap', 'memory', 'ram_pages'],
    'RecordBatch':    ['direct_buffers', 'page_cache', 'memory'],
    'MemoryRecords':  ['direct_buffers', 'jvm_heap', 'memory'],
    'KafkaChannel':   ['net_handler', 'direct_buffers', 'socket_buffers', 'nic'],
    'ByteBufferSend': ['net_handler', 'direct_buffers', 'sendfile', 'nic'],
    'ProducerBatch':  ['direct_buffers', 'memory', 'jvm_heap'],
    // A2 internal → hardware
    'jvm_heap':       ['memory', 'dram'],
    'g1gc':           ['memory', 'cpu', 'cpu_cores'],
    'jit':            ['cpu', 'cpu_cores'],
    'direct_buffers': ['memory', 'dram'],
    'thread_stacks':  ['memory'],
    'net_handler':    ['cpu', 'epoll', 'socket_buffers'],
    'req_handler':    ['cpu', 'cpu_cores'],
    'io_thread':      ['disk', 'page_cache', 'sectors'],
    'fetcher_thread': ['network', 'tcp_stack', 'cpu'],
    'page_cache':     ['memory', 'disk', 'dram'],
    'sendfile':       ['disk', 'nic', 'network'],
    'epoll':          ['cpu', 'socket_buffers'],
    'kafka_server':   ['jvm_heap', 'g1gc', 'net_handler', 'req_handler'],
  },

  topology_mutations: {
    cluster: {
      add_nodes: [{ id: '__broker', label: 'Broker', count_from: 'config.broker_count', axis: 'axis2' }],
      add_edges: [{ source: '__broker', target: '__broker', label: 'replication', protocol: 'TCP' }],
    },
  },

  chip_emphasis: {
    jvm_heap:    { config_key: 'jvm_heap_gb',        unit: 'GB',      warn_above: 12 },
    replica_mgr: { config_key: 'replication_factor', unit: 'RF' },
    net_handler: { config_key: 'broker_count',        unit: 'brokers' },
  },

  tier1_insights: [
    { severity: 'info',    text: 'JVM heap is intentionally small (~6GB). Kafka data never touches JVM heap. Flow: producer → OS page cache → disk → page cache → consumer via sendfile(). The OS is the buffer, not Kafka.' },
    { severity: 'info',    text: 'Sequential disk writes only. This is why spinning HDD is acceptable — Kafka never seeks. SSD adds headroom for burst but is not required.' },
    { severity: 'warning', text: 'Partition count is the parallelism ceiling. You cannot have more active consumers (in a group) than partitions. Repartitioning after the fact requires a migration.' },
  ],
}
