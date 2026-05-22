import type { ComponentTemplate } from '../../types/schema'

export const redisTemplate: ComponentTemplate = {
  type: 'redis',
  display_name: 'Redis',
  flavor: 'C · single-threaded event loop · in-memory primary store · jemalloc',
  color: 'red',
  icon: 'Zap',
  topologies: ['standalone', 'ha', 'cluster'],
  default_config: {
    version: '7',
    maxmemory: '',
    eviction_policy: 'noeviction',
    persistence: 'rdb',
    io_threads: 1,
    replica_count: 0,
  },
  config_schema: {
    version:         { type: 'select', label: 'Version', options: ['6', '7', '7.2'] },
    maxmemory:       { type: 'string', label: 'maxmemory', unit: 'e.g. 4GB — empty = unbounded' },
    eviction_policy: { type: 'select', label: 'Eviction policy', options: ['noeviction', 'allkeys-lru', 'volatile-lru', 'allkeys-lfu', 'allkeys-random', 'volatile-ttl'] },
    persistence:     { type: 'select', label: 'Persistence', options: ['none', 'rdb', 'aof', 'rdb+aof'] },
    io_threads:      { type: 'number', label: 'I/O threads (v6+)', min: 1, max: 64 },
    replica_count:   { type: 'number', label: 'Replica count', min: 0, max: 10 },
  },

  // ── Axis 1 — Service internals ──────────────────────────────────────────
  axis1: {
    d1: {
      label: 'Keyspace & keys',
      nodes: [
        { id: 'keyspace', label: 'Keyspace (db0–db15)', drillable: false },
        {
          id: 'key', label: 'Key (string)', drillable: true,
          tooltip: 'Click body to cross-link. Click ↓ to drill into data structures.',
          d2: {
            label: 'Data structures',
            nodes: [
              {
                id: 'string', label: 'String', drillable: true,
                d3: {
                  label: 'C internals — string',
                  nodes: [
                    { id: 'robj', label: 'robj (redisObject)', drillable: false, tooltip: '16-byte value wrapper: type (4b) + encoding (4b) + lru (24b) + refcount (int) + ptr (void*). Every value is an robj.' },
                    { id: 'sds',  label: 'sds',                drillable: false, tooltip: 'Simple Dynamic String. Header: len(uint32) + alloc(uint32) + flags(uint8). buf[] follows. O(1) length, binary-safe.' },
                  ],
                },
              },
              {
                id: 'hash', label: 'Hash', drillable: true,
                d3: {
                  label: 'C internals — hash',
                  nodes: [
                    { id: 'robj',       label: 'robj (redisObject)', drillable: false, tooltip: '16-byte value wrapper: type (4b) + encoding (4b) + lru (24b) + refcount (int) + ptr (void*).' },
                    { id: 'dict_t',     label: 'dict',               drillable: false, tooltip: 'Hash table with incremental rehashing. ht[2]: old + new table. rehashidx tracks progress. Load factor triggers resize.' },
                    { id: 'listpack_t', label: 'listpack',           drillable: false, tooltip: 'Compact sequential encoding: total-bytes (uint32) + num-elements (uint16) + entries + 0xFF end. Used for small hashes.' },
                  ],
                },
              },
              {
                id: 'list', label: 'List', drillable: true,
                d3: {
                  label: 'C internals — list',
                  nodes: [
                    { id: 'robj',        label: 'robj (redisObject)', drillable: false, tooltip: '16-byte value wrapper: type (4b) + encoding (4b) + lru (24b) + refcount (int) + ptr (void*).' },
                    { id: 'quicklist_t', label: 'quicklist',          drillable: false, tooltip: 'Doubly-linked list of listpack nodes. Balances memory (compact listpack) vs speed (O(1) head/tail).' },
                    { id: 'listpack_t',  label: 'listpack',           drillable: false, tooltip: 'Compact sequential encoding used as quicklist nodes. No pointers — cache friendly.' },
                  ],
                },
              },
              {
                id: 'set', label: 'Set', drillable: true,
                d3: {
                  label: 'C internals — set',
                  nodes: [
                    { id: 'robj',     label: 'robj (redisObject)', drillable: false, tooltip: '16-byte value wrapper: type (4b) + encoding (4b) + lru (24b) + refcount (int) + ptr (void*).' },
                    { id: 'dict_t',   label: 'dict',               drillable: false, tooltip: 'Hash table encoding for large sets. Same incremental rehashing as hash dict.' },
                    { id: 'intset_t', label: 'intset',             drillable: false, tooltip: 'Sorted array of integers: encoding(uint32) + length(uint32) + contents[]. Used for small integer sets.' },
                  ],
                },
              },
              {
                id: 'sorted_set', label: 'Sorted set', drillable: true,
                tooltip: 'skiplist + dict maintained in sync. O(log N) range queries, O(1) by-score lookup.',
                d3: {
                  label: 'C internals — sorted set',
                  nodes: [
                    { id: 'robj',        label: 'robj (redisObject)', drillable: false, tooltip: '16-byte value wrapper: type (4b) + encoding (4b) + lru (24b) + refcount (int) + ptr (void*).' },
                    { id: 'zskiplist_t', label: 'zskiplist',          drillable: false, tooltip: 'Sorted set large encoding: probabilistic skip list. Each node: ele(sds*) + score(double) + backward + level[32].' },
                    { id: 'dict_t',      label: 'dict',               drillable: false, tooltip: 'Parallel dict for O(1) score lookup by member. Both zskiplist and dict share the same sds* ele pointers.' },
                  ],
                },
              },
              { id: 'stream', label: 'Stream',      drillable: false },
              { id: 'hll',    label: 'HyperLogLog', drillable: false },
              { id: 'bitmap', label: 'Bitmap',      drillable: false },
            ],
          },
        },
        { id: 'ttl',      label: 'TTL / expiry',    drillable: false, tooltip: 'Lazy expiry on access + active sweep every 100ms. Expired keys stay in memory until accessed or swept.' },
        { id: 'eviction', label: 'Eviction policy', drillable: false, tooltip: 'maxmemory not set = unbounded growth = OOM kill under load.' },
      ],
    },
  },

  // ── Axis 2 — Execution stack (bottom → top) ────────────────────────────
  axis2: {
    layers: [
      {
        id: 'hardware', name: 'Hardware',
        components: [
          { id: 'cpu',    label: 'CPU (1 core primary)', drillable: true, sub_chips: [
            { id: 'cpu_cores', label: 'CPU core (1 primary)', drillable: false },
            { id: 'l3_cache',  label: 'L3 cache',             drillable: false },
            { id: 'runqueue',  label: 'Scheduler runqueue',   drillable: false },
          ]},
          { id: 'memory', label: 'Memory (primary store)', drillable: true, tooltip: 'Redis data lives entirely in RAM. Disk is persistence only.', sub_chips: [
            { id: 'dram',      label: 'DRAM',           drillable: false },
            { id: 'ram_pages', label: 'RAM pages (4KB)', drillable: false },
            { id: 'tlb',       label: 'TLB',            drillable: false },
          ]},
          { id: 'disk',   label: 'Disk (persist only)', drillable: true, sub_chips: [
            { id: 'block_dev', label: 'Block device',        drillable: false },
            { id: 'rdb_file',  label: 'dump.rdb',            drillable: false },
            { id: 'aof_file',  label: 'appendonly.aof',      drillable: false },
            { id: 'sectors',   label: 'Disk sectors (512B)', drillable: false },
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
          { id: 'epoll',         label: 'epoll / kqueue',        drillable: false, tooltip: 'ae event loop sits on top of epoll (Linux) or kqueue (macOS/BSD). Single call multiplexes thousands of connections.' },
          { id: 'page_cache',    label: 'OS page cache',         drillable: false, tooltip: 'Only relevant during RDB load on startup (mmap) and persistence writes.' },
          { id: 'fds',           label: 'File descriptors',      drillable: false, tooltip: 'One fd per client connection. Set ulimit -n high (65535+) in production.' },
          { id: 'mmap_os',       label: 'mmap (RDB load)',       drillable: false },
          { id: 'scheduler',     label: 'OS scheduler',          drillable: false },
          { id: 'copy_on_write', label: 'Copy-on-write (fork)',  drillable: false, tooltip: 'RDB snapshot: fork() copies page table, not data. Writes during snapshot cause CoW page copies — memory spikes.' },
        ],
      },
      {
        id: 'process', name: 'Process',
        components: [
          { id: 'redis_server', label: 'redis-server', drillable: false, tooltip: 'Single OS process. All data, command execution, and I/O handled here.' },
        ],
      },
      {
        id: 'threads', name: 'Threads',
        nested_in: 'process',
        components: [
          { id: 'main_thread',   label: 'main thread (event loop)', drillable: false, tooltip: 'Runs ae event loop. Handles ALL command execution sequentially. One slow command blocks all clients.' },
          { id: 'io_threads',    label: 'I/O threads × N (v6+)',    drillable: false, tooltip: 'Read/write client buffers in parallel. Command execution still happens on main thread.' },
          { id: 'bgsave_thread', label: 'BG save (fork child)',      drillable: false, tooltip: 'Fork creates a child process for RDB snapshot. Copy-on-write keeps parent alive but memory doubles in worst case.' },
          { id: 'lazyfree',      label: 'lazy free thread',          drillable: false, tooltip: 'Async deletion of large objects. DEL on a 10M-member sorted set would block main thread without this.' },
          { id: 'aof_fsync',     label: 'AOF fsync thread',          drillable: false },
        ],
      },
      {
        id: 'runtime', name: 'C Runtime',
        components: [
          { id: 'jemalloc',      label: 'jemalloc',           drillable: false, tooltip: 'Redis uses jemalloc (not libc malloc). Reduces fragmentation. OBJECT ENCODING shows actual memory layout.' },
          { id: 'ae_event_loop', label: 'ae (event loop lib)', drillable: false, tooltip: 'Redis\'s own event loop abstraction. Wraps epoll/kqueue.' },
          { id: 'libc',          label: 'libc',               drillable: false },
        ],
      },
      {
        id: 'app_modules', name: 'App modules',
        components: [
          { id: 'cmd_dispatcher',  label: 'Command dispatcher',    drillable: false, tooltip: 'Looks up command in commandTable by name. Validates arity, permissions, then calls command->proc().' },
          { id: 'keyspace_mgr',    label: 'Keyspace manager',      drillable: false, tooltip: 'Manages db->dict (main keyspace) and db->expires (TTL dict) per database.' },
          { id: 'persistence_mgr', label: 'Persistence manager',   drillable: false, tooltip: 'Decides when to fork for RDB, fsync AOF, and rewrite AOF. Controlled by save/appendfsync config.' },
          { id: 'expiry_mgr',      label: 'Expiry / eviction mgr', drillable: false, tooltip: 'Active expiry: checks 20 random volatile keys every 100ms. Lazy expiry on access.' },
          { id: 'repl_mgr',        label: 'Replication manager',   drillable: false },
          { id: 'pub_sub',         label: 'Pub/Sub',               drillable: false },
        ],
      },
    ],
  },

  // ── Cross-links ─────────────────────────────────────────────────────────
  cross_links: {
    // A1 D1 → A2
    'key':       ['cmd_dispatcher', 'main_thread', 'keyspace_mgr', 'memory', 'jemalloc'],
    'keyspace':  ['keyspace_mgr', 'memory', 'dram'],
    'ttl':       ['expiry_mgr', 'main_thread', 'cpu'],
    'eviction':  ['keyspace_mgr', 'expiry_mgr', 'memory', 'jemalloc'],
    // A1 D2 → A2
    'string':     ['cmd_dispatcher', 'main_thread', 'jemalloc', 'memory'],
    'hash':       ['cmd_dispatcher', 'main_thread', 'jemalloc', 'memory'],
    'list':       ['cmd_dispatcher', 'main_thread', 'jemalloc', 'memory'],
    'set':        ['cmd_dispatcher', 'main_thread', 'jemalloc', 'memory'],
    'sorted_set': ['cmd_dispatcher', 'main_thread', 'jemalloc', 'memory', 'cpu'],
    'stream':     ['cmd_dispatcher', 'main_thread', 'memory'],
    // A1 D3 → A2
    'robj':        ['jemalloc', 'memory', 'ram_pages'],
    'sds':         ['jemalloc', 'memory', 'ram_pages'],
    'dict_t':      ['jemalloc', 'memory', 'cpu', 'cpu_cores'],
    'quicklist_t': ['jemalloc', 'memory'],
    'listpack_t':  ['jemalloc', 'memory', 'ram_pages'],
    'zskiplist_t': ['jemalloc', 'memory', 'cpu'],
    'intset_t':    ['memory', 'ram_pages'],
    // A2 internal → hardware
    'main_thread':    ['cpu', 'cpu_cores', 'epoll'],
    'io_threads':     ['cpu', 'socket_buffers', 'epoll'],
    'bgsave_thread':  ['disk', 'memory', 'cpu', 'copy_on_write'],
    'jemalloc':       ['memory', 'dram', 'ram_pages'],
    'ae_event_loop':  ['cpu', 'epoll', 'fds'],
    'page_cache':     ['memory', 'disk'],
    'epoll':          ['cpu', 'fds'],
    'copy_on_write':  ['memory', 'dram'],
    'redis_server':   ['main_thread', 'jemalloc', 'ae_event_loop'],
  },

  topology_mutations: {
    ha: {
      add_nodes: [
        { id: '__replica',  label: 'Replica',   count_from: 'config.replica_count', axis: 'axis2' },
        { id: '__sentinel1', label: 'Sentinel 1', axis: 'axis2' },
        { id: '__sentinel2', label: 'Sentinel 2', axis: 'axis2' },
        { id: '__sentinel3', label: 'Sentinel 3', axis: 'axis2' },
      ],
      add_edges: [
        { source: '__primary',  target: '__replica',  label: 'async repl', protocol: 'async' },
        { source: '__sentinel1', target: '__primary', label: 'monitor',    protocol: 'TCP' },
      ],
    },
    cluster: {
      add_nodes: [
        { id: '__shard',         label: 'Shard (master)', axis: 'axis2' },
        { id: '__shard_replica', label: 'Shard replica',  axis: 'axis2' },
      ],
      add_edges: [
        { source: '__shard', target: '__shard_replica', label: 'async repl', protocol: 'async' },
      ],
    },
  },

  chip_emphasis: {
    jemalloc:    { config_key: 'maxmemory' },
    io_threads:  { config_key: 'io_threads', unit: 'threads', warn_above: 4 },
    main_thread: { config_key: 'eviction_policy' },
  },

  tier1_insights: [
    { severity: 'warning', text: 'Single-threaded event loop — one KEYS *, LRANGE 0 -1 on a huge list, or slow Lua script blocks every client globally for the duration.' },
    { severity: 'info',    text: 'In-memory first. Disk is for persistence only. RDB fork uses copy-on-write — memory can temporarily double during snapshot under heavy write load.' },
    { severity: 'warning', text: 'I/O threads (Redis 6+) parallelise reading/writing client buffers — but ALL command execution still runs on the main thread.' },
  ],
}
