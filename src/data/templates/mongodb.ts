import type { ComponentTemplate } from '../../types/schema'

export const mongodbTemplate: ComponentTemplate = {
  type: 'mongodb',
  display_name: 'MongoDB',
  flavor: 'C++ · WiredTiger storage · BSON documents · multi-granularity locking · oplog-based replication',
  color: 'green',
  icon: 'Layers',
  topologies: ['standalone', 'primary_replicas', 'ha', 'cluster'],
  default_config: {
    version: '7.0',
    wt_cache_gb: 2,
    replica_count: 2,
    read_concern: 'local',
    write_concern: 'majority',
    journal: true,
    oplog_size_mb: 2048,
  },
  config_schema: {
    version:       { type: 'select', label: 'Version', options: ['6.0', '7.0', '7.3'] },
    wt_cache_gb:   { type: 'number', label: 'WiredTiger cache (GB)', min: 1, max: 256 },
    replica_count: { type: 'number', label: 'Replica count', min: 0, max: 6 },
    read_concern:  { type: 'select', label: 'Read concern', options: ['local', 'available', 'majority', 'linearizable', 'snapshot'] },
    write_concern: { type: 'select', label: 'Write concern', options: ['0', '1', 'majority'] },
    journal:       { type: 'boolean', label: 'Journaling enabled' },
    oplog_size_mb: { type: 'number', label: 'Oplog size (MB)', min: 990, max: 51200 },
  },

  // ── Axis 1 — Document model ─────────────────────────────────────────────
  axis1: {
    d1: {
      label: 'Schema objects',
      nodes: [
        {
          id: 'collection', label: 'Collection', drillable: true,
          tooltip: 'Schema-free container of documents. Equivalent to a table but no column constraints.',
          d2: {
            label: 'Collection model',
            nodes: [
              {
                id: 'document', label: 'Document', drillable: true,
                tooltip: 'BSON object up to 16MB. Nested sub-documents and arrays are first-class.',
                d3: {
                  label: 'BSON internals',
                  nodes: [
                    { id: 'bson_header',   label: 'BSON doc header',   drillable: false, tooltip: 'int32 total byte length + sequence of (type, key, value) elements + 0x00 terminator.' },
                    { id: 'ObjectId',      label: 'ObjectId (12B)',     drillable: false, tooltip: '4B timestamp + 5B random machine+pid + 3B counter. Monotonic within a second — sortable. Default _id.' },
                    { id: 'BSONString',    label: 'String (UTF-8)',     drillable: false, tooltip: 'int32 length + UTF-8 bytes + 0x00. Length includes null. Always UTF-8 — no charset metadata.' },
                    { id: 'BSONDocument',  label: 'Embedded document',  drillable: false, tooltip: 'Nested BSON document inline in parent. Can be indexed and queried with dot-notation paths.' },
                    { id: 'BSONArray',     label: 'Array',              drillable: false, tooltip: 'BSON document with "0", "1", ... string keys. $elemMatch and multikey indexes operate on arrays.' },
                    { id: 'BSONDecimal',   label: 'Decimal128',         drillable: false, tooltip: '16-byte IEEE 754 decimal. Precise financial arithmetic. Slower than Double — use only when needed.' },
                  ],
                },
              },
              {
                id: 'index', label: 'Index', drillable: true,
                tooltip: 'B-tree by default (WiredTiger). Compound, sparse, partial, TTL, 2dsphere, text variants.',
                d3: {
                  label: 'Index internals',
                  nodes: [
                    { id: 'BTreePage',      label: 'WiredTiger B-tree page', drillable: false, tooltip: 'Variable-size disk page. Internal pages hold keys + page addresses; leaf pages hold key-value pairs.' },
                    { id: 'IndexEntry',     label: 'Index entry (key→RecordId)', drillable: false, tooltip: 'Key is BSON encoded field value. Value is RecordId (file:offset for heap collection).' },
                    { id: 'MultiKey',       label: 'Multikey flag',       drillable: false, tooltip: 'Set when an indexed field contains an array. MongoDB indexes each element — can cause index bloat.' },
                  ],
                },
              },
              { id: 'view',       label: 'View',              drillable: false, tooltip: 'Read-only aggregation pipeline stored as a view. No data storage — evaluated on every query.' },
              { id: 'capped',     label: 'Capped collection', drillable: false, tooltip: 'Fixed-size circular buffer. Oldest documents auto-deleted. No deletions or updates that grow document size.' },
              { id: 'ttl_index',  label: 'TTL index',         drillable: false, tooltip: 'expireAfterSeconds on a Date field. Background thread deletes expired documents every ~60s.' },
              { id: 'schema_val', label: 'Schema validation',  drillable: false, tooltip: 'JSON Schema or query operators as validators. Enforced on insert/update. validationAction: warn or error.' },
            ],
          },
        },
        {
          id: 'aggregation', label: 'Aggregation pipeline', drillable: true,
          tooltip: 'Multi-stage document transformation. Each stage produces a stream for the next.',
          d2: {
            label: 'Pipeline stages',
            nodes: [
              { id: 'match_stage',   label: '$match',    drillable: false, tooltip: 'Filter documents — uses indexes when possible. Place early to reduce pipeline data volume.' },
              { id: 'group_stage',   label: '$group',    drillable: false, tooltip: 'Accumulate across documents: $sum, $avg, $push, $addToSet. Spills to disk if > 100MB in-memory.' },
              { id: 'lookup_stage',  label: '$lookup',   drillable: false, tooltip: 'Left outer join to another collection. No foreign key constraints — denormalize when possible.' },
              { id: 'unwind_stage',  label: '$unwind',   drillable: false, tooltip: 'Flatten an array field into one document per element. Prerequisite for aggregating on array contents.' },
              { id: 'project_stage', label: '$project',  drillable: false },
              { id: 'sort_stage',    label: '$sort',     drillable: false, tooltip: 'Can use an index if it\'s the first stage after $match. Otherwise spills to disk at 100MB.' },
            ],
          },
        },
        { id: 'transaction', label: 'Transaction (ACID)', drillable: false, tooltip: 'Multi-document ACID since MongoDB 4.0. Uses snapshot isolation. Max 1000 documents / 16MB per transaction.' },
        { id: 'change_stream', label: 'Change stream',    drillable: false, tooltip: 'Real-time oplog tailing via a resumable cursor. Used for CDC and event-driven architectures.' },
      ],
    },
  },

  // ── Axis 2 — Execution stack (bottom → top) ────────────────────────────
  axis2: {
    layers: [
      {
        id: 'hardware', name: 'Hardware',
        components: [
          { id: 'cpu',    label: 'CPU', drillable: true, sub_chips: [
            { id: 'cpu_cores', label: 'CPU cores',          drillable: false },
            { id: 'l3_cache',  label: 'L3 cache',           drillable: false },
            { id: 'runqueue',  label: 'Scheduler runqueue', drillable: false },
          ]},
          { id: 'memory', label: 'Memory', drillable: true, tooltip: 'WiredTiger cache + OS page cache. Size WT cache to ~50% RAM, leave rest for OS.', sub_chips: [
            { id: 'dram',      label: 'DRAM',           drillable: false },
            { id: 'ram_pages', label: 'RAM pages (4KB)', drillable: false },
            { id: 'tlb',       label: 'TLB',            drillable: false },
          ]},
          { id: 'disk',   label: 'Disk', drillable: true, sub_chips: [
            { id: 'block_dev',  label: 'Block device',          drillable: false },
            { id: 'fs_layer',   label: 'Filesystem (ext4/xfs)', drillable: false },
            { id: 'wt_files',   label: 'WiredTiger data files', drillable: false },
            { id: 'oplog_file', label: 'Oplog (local.oplog.rs)', drillable: false },
          ]},
          { id: 'network', label: 'Network', drillable: true, sub_chips: [
            { id: 'nic',            label: 'NIC',            drillable: false },
            { id: 'tcp_stack',      label: 'TCP stack',      drillable: false },
            { id: 'socket_buffers', label: 'Socket buffers', drillable: false },
          ]},
        ],
      },
      {
        id: 'os', name: 'Host OS',
        components: [
          { id: 'page_cache', label: 'OS page cache',    drillable: false, tooltip: 'WiredTiger data files are mmap\'d — hot data from disk cached here. WT cache + OS cache = two layers.' },
          { id: 'mmap_wt',    label: 'mmap (WT files)',  drillable: false, tooltip: 'WiredTiger memory-maps its data files for zero-copy reads. The OS manages eviction from page cache.' },
          { id: 'epoll',      label: 'epoll',            drillable: false },
          { id: 'vfs',        label: 'VFS',              drillable: false },
          { id: 'fsync_os',   label: 'fsync()',          drillable: false, tooltip: 'Journal durability. journal:true means each write is flushed before acknowledgement.' },
          { id: 'numa',       label: 'NUMA topology',    drillable: false, tooltip: 'MongoDB performance is NUMA-sensitive. Run with numactl --interleave=all in production.' },
        ],
      },
      {
        id: 'process', name: 'Process',
        components: [
          { id: 'mongod',  label: 'mongod',  drillable: false, tooltip: 'Primary daemon. Handles all read/write operations, replication, and background tasks in one process.' },
          { id: 'mongos',  label: 'mongos',  drillable: false, tooltip: 'Query router for sharded clusters. Stateless — routes queries to correct shard(s) based on shard key ranges.' },
        ],
      },
      {
        id: 'threads', name: 'Threads',
        nested_in: 'process',
        components: [
          { id: 'conn_thread',    label: 'connection thread × N',    drillable: false, tooltip: 'One thread per client connection. Max controlled by maxIncomingConnections. Memory scales linearly.' },
          { id: 'repl_thread',    label: 'replication applier',      drillable: false, tooltip: 'On secondaries: replays oplog entries. Parallel on secondary since MongoDB 4.4.' },
          { id: 'checkpoint_wt',  label: 'WiredTiger checkpoint',    drillable: false, tooltip: 'Writes dirty pages to disk every 60s (default). Creates a consistent on-disk snapshot.' },
          { id: 'journal_thread', label: 'journal flush thread',     drillable: false, tooltip: 'Flushes journal writes to disk on commitInterval (default 100ms).' },
          { id: 'index_build',    label: 'index build thread',       drillable: false, tooltip: 'Background index builds since MongoDB 4.4. Uses a temporary side-write table.' },
          { id: 'ttl_monitor',    label: 'TTL monitor',              drillable: false },
        ],
      },
      {
        id: 'runtime', name: 'WiredTiger Storage',
        components: [
          { id: 'wt_cache',     label: 'WiredTiger cache',         drillable: false, tooltip: 'In-memory B-tree pages. Default: 50% RAM or 256MB min. Dirty eviction starts at 20% dirty.' },
          { id: 'wt_journal',   label: 'WiredTiger journal',       drillable: false, tooltip: 'Write-ahead log for crash recovery. Stored in journal/ subdirectory. Compressed by default.' },
          { id: 'wt_btree',     label: 'B-tree engine',            drillable: false, tooltip: 'Default collection storage. Variable-size pages, prefix compression, MVCC via update chains.' },
          { id: 'wt_mvcc',      label: 'MVCC (WT snapshot)',       drillable: false, tooltip: 'WiredTiger\'s MVCC: update chains per record. Snapshot transactions see consistent versions.' },
          { id: 'wt_compress',  label: 'Snappy compression',       drillable: false, tooltip: 'Default block compression. zstd available for higher ratio. Applied per storage block (~32KB).' },
        ],
      },
      {
        id: 'app_modules', name: 'App modules',
        components: [
          { id: 'query_engine',  label: 'Query engine',           drillable: false, tooltip: 'Parses BSON query, selects plan via queryPlanner (winning plan cached in plan cache).' },
          { id: 'repl_mgr',      label: 'Replication manager',    drillable: false, tooltip: 'Manages oplog, election protocol (Raft-like), read preference routing on replica set.' },
          { id: 'shard_mgr',     label: 'Shard manager',          drillable: false, tooltip: 'Chunk splitting and balancing. Config servers store chunk ranges. mongos routes by shard key.' },
          { id: 'lock_mgr',      label: 'Lock manager (MGL)',     drillable: false, tooltip: 'Multi-granularity locking: database → collection → document. WiredTiger handles document-level.' },
          { id: 'oplog_mgr',     label: 'Oplog manager',          drillable: false, tooltip: 'Change stream source. Capped collection in local.oplog.rs. Size determines replication lag window.' },
          { id: 'index_access',  label: 'Index access methods',   drillable: false },
        ],
      },
    ],
  },

  cross_links: {
    // A1 D1 → A2
    'collection':   ['wt_btree', 'wt_cache', 'query_engine', 'memory', 'disk'],
    'aggregation':  ['query_engine', 'conn_thread', 'memory', 'cpu'],
    'transaction':  ['wt_mvcc', 'lock_mgr', 'repl_mgr', 'wt_journal'],
    'change_stream':['oplog_mgr', 'repl_thread', 'repl_mgr', 'disk'],
    // A1 D2 → A2
    'document':     ['wt_btree', 'wt_cache', 'memory', 'wt_compress'],
    'index':        ['wt_btree', 'wt_cache', 'index_access', 'disk'],
    'capped':       ['wt_btree', 'disk', 'oplog_file'],
    'ttl_index':    ['ttl_monitor', 'index_access', 'query_engine'],
    // A1 D3 → A2
    'bson_header':  ['wt_cache', 'memory', 'ram_pages'],
    'ObjectId':     ['conn_thread', 'cpu'],
    'BSONDocument': ['wt_cache', 'memory', 'wt_compress'],
    'BSONArray':    ['wt_cache', 'wt_btree', 'memory'],
    'BTreePage':    ['wt_btree', 'wt_cache', 'disk', 'mmap_wt'],
    'IndexEntry':   ['wt_btree', 'index_access', 'disk'],
    // Agg stages
    'match_stage':  ['query_engine', 'index_access', 'wt_cache'],
    'group_stage':  ['query_engine', 'memory', 'disk', 'cpu'],
    'lookup_stage': ['query_engine', 'lock_mgr', 'wt_cache', 'disk'],
    // A2 internal → hardware
    'wt_cache':     ['memory', 'dram', 'ram_pages'],
    'wt_btree':     ['disk', 'memory', 'mmap_wt', 'page_cache'],
    'wt_journal':   ['disk', 'fsync_os', 'wt_files'],
    'wt_mvcc':      ['memory', 'cpu'],
    'conn_thread':  ['cpu', 'memory', 'socket_buffers'],
    'repl_thread':  ['cpu', 'disk', 'oplog_file', 'network'],
    'checkpoint_wt':['disk', 'memory', 'wt_files'],
    'oplog_mgr':    ['disk', 'oplog_file', 'memory'],
    'page_cache':   ['memory', 'disk'],
    'mmap_wt':      ['memory', 'dram', 'disk'],
    'lock_mgr':     ['memory', 'cpu'],
  },

  topology_mutations: {
    primary_replicas: {
      add_nodes: [{ id: '__secondary', label: 'Secondary', count_from: 'config.replica_count', axis: 'axis2' }],
      add_edges: [{ source: '__primary', target: '__secondary', label: 'oplog stream', protocol: 'async' }],
    },
    ha: {
      add_nodes: [
        { id: '__secondary', label: 'Secondary', count_from: 'config.replica_count', axis: 'axis2' },
        { id: '__arbiter',   label: 'Arbiter',   axis: 'axis2' },
      ],
      add_edges: [{ source: '__primary', target: '__secondary', label: 'oplog (sync)', protocol: 'TCP' }],
    },
    cluster: {
      add_nodes: [
        { id: '__shard',   label: 'Shard',   axis: 'axis2' },
        { id: '__mongos',  label: 'mongos',  axis: 'axis2' },
        { id: '__config',  label: 'Config server', axis: 'axis2' },
      ],
      add_edges: [{ source: '__mongos', target: '__shard', label: 'route by shard key', protocol: 'TCP' }],
    },
  },

  chip_emphasis: {
    wt_cache:  { config_key: 'wt_cache_gb', unit: 'GB', warn_below: 1 },
    repl_mgr:  { config_key: 'write_concern' },
    oplog_mgr: { config_key: 'oplog_size_mb', unit: 'MB' },
  },

  tier1_insights: [
    { severity: 'info',    text: 'Two cache layers: WiredTiger in-memory cache (~50% RAM) + OS page cache for mmap\'d data files. Set wiredTigerCacheSizeGB to ~50% RAM — leave the other half for OS.' },
    { severity: 'warning', text: 'One OS thread per connection — RAM grows linearly. Use a connection pool (Mongoose/Motor poolSize) and set maxPoolSize. 500+ direct connections is expensive.' },
    { severity: 'warning', text: 'MVCC via update chains: old versions accumulate in WiredTiger cache under heavy write load. High transaction concurrency → cache pressure → more evictions → latency spikes.' },
  ],
}
