import type { ComponentTemplate } from '../../types/schema'

export const postgresTemplate: ComponentTemplate = {
  type: 'postgres',
  display_name: 'PostgreSQL',
  flavor: 'C · multi-process (1 OS process/conn) · MVCC · WAL',
  color: 'blue',
  icon: 'Database',
  topologies: ['standalone', 'primary_replicas', 'ha'],
  default_config: {
    version: '16',
    max_connections: 100,
    shared_buffers: '128MB',
    wal_mode: 'fsync',
    replica_count: 0,
    autovacuum: true,
  },
  config_schema: {
    version:         { type: 'select', label: 'Version', options: ['14', '15', '16', '17'] },
    max_connections: { type: 'number', label: 'max_connections', min: 1, max: 10000 },
    shared_buffers:  { type: 'string', label: 'shared_buffers', unit: 'e.g. 4GB (target ~25% RAM)' },
    wal_mode:        { type: 'select', label: 'WAL mode', options: ['fsync', 'async', 'remote_write'] },
    replica_count:   { type: 'number', label: 'Replica count', min: 0, max: 10 },
    autovacuum:      { type: 'boolean', label: 'Autovacuum enabled' },
  },

  // ── Axis 1 — Service internals ──────────────────────────────────────────
  axis1: {
    d1: {
      label: 'Schema objects',
      nodes: [
        { id: 'database',  label: 'Database',       drillable: false },
        { id: 'schema',    label: 'Schema',         drillable: false },
        { id: 'table',     label: 'Table',          drillable: true, tooltip: 'Click to see row-level model' },
        { id: 'view',      label: 'View',           drillable: false },
        { id: 'sequence',  label: 'Sequence',       drillable: false },
        { id: 'function',  label: 'Function / Proc',drillable: false },
        { id: 'role',      label: 'Role',           drillable: false },
      ],
    },
    d2: {
      label: 'Row-level model',
      parent: 'table',
      nodes: [
        { id: 'row',        label: 'Row (tuple)',    drillable: true },
        { id: 'column',     label: 'Column',        drillable: false },
        { id: 'btree_index',label: 'B-tree index',  drillable: true },
        { id: 'hash_index', label: 'Hash index',    drillable: false },
        { id: 'gin_index',  label: 'GIN index',     drillable: false },
        { id: 'gist_index', label: 'GiST index',    drillable: false },
        { id: 'constraint', label: 'Constraint',    drillable: false },
        { id: 'fk',         label: 'Foreign key',   drillable: false },
        { id: 'mvcc_view',  label: 'MVCC read view',drillable: false, tooltip: 'Each transaction sees a consistent snapshot via xmin/xmax' },
      ],
    },
    d3: {
      label: 'C internals',
      parent: 'row',
      nodes: [
        { id: 'HeapTupleData',    label: 'HeapTupleData',     drillable: false, tooltip: 'C struct for a row. Contains t_data pointer + t_len + t_tableOid. Core of heap storage.' },
        { id: 'PageHeaderData',   label: 'PageHeaderData',    drillable: false, tooltip: '24-byte header of every 8KB page. pd_lsn, pd_lower (free start), pd_upper (free end), pd_special.' },
        { id: 'XLogRecord',       label: 'XLogRecord',        drillable: false, tooltip: 'WAL record header. xl_tot_len, xl_xid, xl_prev LSN, xl_rmid (resource manager). Written before page change.' },
        { id: 'BTPageOpaqueData', label: 'BTPageOpaqueData',  drillable: false, tooltip: 'B-tree page trailer: btpo_prev/next (sibling pointers), btpo_level, btpo_flags.' },
        { id: 'ItemIdData',       label: 'ItemIdData (lp)',   drillable: false, tooltip: '4-byte line pointer in a page. lp_off (offset), lp_flags, lp_len. Maps slot → tuple.' },
        { id: 'TransactionId',    label: 'TransactionId (xid)',drillable: false, tooltip: 'uint32 wrapping counter. Every tuple stores xmin (created-by) and xmax (deleted-by). The famous wraparound problem at 2^32.' },
        { id: 'BufferDesc',       label: 'BufferDesc',        drillable: false, tooltip: 'shared_buffers slot descriptor. tag (reln+block), usage_count, refcount, content_lock.' },
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
          { id: 'memory', label: 'Memory', drillable: true, sub_chips: [
            { id: 'dram',      label: 'DRAM',               drillable: false },
            { id: 'ram_pages', label: 'RAM pages (4KB)',     drillable: false },
            { id: 'tlb',       label: 'TLB',                drillable: false },
          ]},
          { id: 'disk',   label: 'Disk',   drillable: true, sub_chips: [
            { id: 'block_dev', label: 'Block device',           drillable: false },
            { id: 'fs_layer',  label: 'Filesystem (ext4/xfs)',  drillable: false },
            { id: 'sectors',   label: 'Disk sectors (512B)',    drillable: false },
          ]},
          { id: 'network',label: 'Network',drillable: true, sub_chips: [
            { id: 'nic',            label: 'NIC',            drillable: false },
            { id: 'tcp_stack',      label: 'TCP stack',      drillable: false },
            { id: 'socket_buffers', label: 'Socket buffers', drillable: false },
          ]},
        ],
      },
      {
        id: 'os', name: 'Host OS',
        components: [
          { id: 'page_cache', label: 'OS page cache', drillable: false, tooltip: 'Second cache layer — data written by bgwriter lands here after leaving shared_buffers' },
          { id: 'epoll',      label: 'epoll',         drillable: false },
          { id: 'vfs',        label: 'VFS',           drillable: false },
          { id: 'fsync_os',   label: 'fsync()',       drillable: false, tooltip: 'WAL durability. wal_mode=async skips this — single crash can lose committed transactions.' },
          { id: 'scheduler',  label: 'OS scheduler',  drillable: false },
          { id: 'shm',        label: 'POSIX shm',     drillable: false, tooltip: 'shared_buffers lives in POSIX shared memory — all backends map the same region.' },
        ],
      },
      {
        id: 'process', name: 'Processes',
        components: [
          { id: 'postmaster',     label: 'postmaster',         drillable: false, tooltip: 'Parent daemon. Forks one backend per client connection. Also spawns background workers.' },
          { id: 'backend',        label: 'backend × N',        drillable: false, tooltip: 'One OS process per client connection. RAM grows linearly — 300 conns ≈ 100MB+ overhead.' },
          { id: 'bgwriter',       label: 'bgwriter',           drillable: false, tooltip: 'Writes dirty shared_buffers pages to OS in the background, ahead of checkpoint.' },
          { id: 'autovacuum',     label: 'autovacuum worker',  drillable: false, tooltip: 'Reclaims dead MVCC tuples. Disable this and tables bloat to infinity.' },
          { id: 'wal_writer',     label: 'WAL writer',         drillable: false, tooltip: 'Flushes WAL buffers to disk on wal_writer_delay interval.' },
          { id: 'checkpointer',   label: 'checkpointer',       drillable: false, tooltip: 'Flushes all dirty pages every checkpoint_timeout. Creates a crash-recovery anchor.' },
          { id: 'stats_collector',label: 'stats collector',    drillable: false },
        ],
      },
      {
        id: 'runtime', name: 'C Runtime',
        components: [
          { id: 'shared_buffers', label: 'shared_buffers',   drillable: false, tooltip: 'PG-managed page cache in POSIX shm. First cache layer — target ~25% RAM.' },
          { id: 'wal_buffers',    label: 'WAL buffers',      drillable: false, tooltip: 'In-memory WAL ring buffer. Flushed by WAL writer or on commit.' },
          { id: 'lwlock',         label: 'LWLock / spinlock',drillable: false, tooltip: 'Protects shared_buffers slots, relation extensions, and other shared state.' },
          { id: 'libc',           label: 'libc',             drillable: false },
        ],
      },
      {
        id: 'app_modules', name: 'App modules',
        components: [
          { id: 'query_planner', label: 'Query planner',   drillable: false, tooltip: 'Cost-based optimizer. Picks seq scan vs index scan vs nested loop vs hash join.' },
          { id: 'executor',      label: 'Executor',        drillable: false },
          { id: 'storage_mgr',   label: 'Storage manager', drillable: false, tooltip: 'Heap access methods: reads/writes 8KB pages via shared_buffers.' },
          { id: 'wal_subsystem', label: 'WAL subsystem',   drillable: false, tooltip: 'Emits XLogRecord before every page modification. Drives crash recovery.' },
          { id: 'mvcc_mgr',      label: 'MVCC manager',    drillable: false, tooltip: 'Visibility via xmin/xmax. Old versions accumulate — autovacuum is the GC.' },
          { id: 'lock_mgr',      label: 'Lock manager',    drillable: false },
        ],
      },
    ],
  },

  // ── Cross-links ─────────────────────────────────────────────────────────
  cross_links: {
    // A1 D1 → A2
    'table':        ['backend', 'storage_mgr', 'shared_buffers', 'page_cache', 'memory', 'disk'],
    'view':         ['backend', 'query_planner', 'executor'],
    'function':     ['backend', 'executor', 'cpu'],
    'role':         ['backend', 'postmaster'],
    // A1 D2 → A2
    'row':          ['backend', 'executor', 'shared_buffers', 'memory', 'ram_pages'],
    'btree_index':  ['shared_buffers', 'bgwriter', 'storage_mgr', 'memory', 'disk'],
    'hash_index':   ['shared_buffers', 'memory'],
    'gin_index':    ['shared_buffers', 'memory'],
    'mvcc_view':    ['autovacuum', 'mvcc_mgr', 'memory'],
    'constraint':   ['backend', 'lock_mgr'],
    'fk':           ['backend', 'lock_mgr', 'executor'],
    // A1 D3 → A2 (C structs → runtime + hardware)
    'HeapTupleData':    ['shared_buffers', 'memory', 'ram_pages'],
    'PageHeaderData':   ['bgwriter', 'shared_buffers', 'disk', 'sectors'],
    'XLogRecord':       ['wal_writer', 'wal_subsystem', 'wal_buffers', 'disk', 'sectors'],
    'BTPageOpaqueData': ['shared_buffers', 'memory'],
    'ItemIdData':       ['shared_buffers', 'memory', 'ram_pages'],
    'TransactionId':    ['mvcc_mgr', 'autovacuum'],
    'BufferDesc':       ['shared_buffers', 'lwlock', 'memory'],
    // A2 internal → hardware
    'shared_buffers':   ['memory', 'dram', 'ram_pages'],
    'wal_buffers':      ['memory', 'disk'],
    'backend':          ['cpu', 'memory', 'shm'],
    'bgwriter':         ['disk', 'page_cache', 'memory'],
    'autovacuum':       ['cpu', 'memory', 'disk'],
    'wal_writer':       ['disk', 'sectors', 'fsync_os'],
    'checkpointer':     ['disk', 'memory', 'fsync_os'],
    'page_cache':       ['memory', 'disk'],
    'epoll':            ['cpu', 'socket_buffers'],
    'lwlock':           ['memory', 'cpu'],
    'libc':             ['memory'],
    'shm':              ['memory', 'dram'],
  },

  topology_mutations: {
    primary_replicas: {
      add_nodes: [{ id: '__replica', label: 'Replica', count_from: 'config.replica_count', axis: 'axis2' }],
      add_edges: [{ source: '__primary', target: '__replica', label: 'WAL stream', protocol: 'async' }],
    },
    ha: {
      add_nodes: [
        { id: '__replica', label: 'Standby', count_from: 'config.replica_count', axis: 'axis2' },
        { id: '__patroni', label: 'Patroni / HAProxy', axis: 'axis2' },
      ],
      add_edges: [{ source: '__primary', target: '__replica', label: 'WAL sync', protocol: 'TCP' }],
    },
  },

  tier1_insights: [
    { severity: 'info',    text: 'One OS process per connection — RAM and context-switch cost grows linearly. 300+ connections is serious overhead.' },
    { severity: 'info',    text: 'Two cache layers: shared_buffers (PG-managed, ~25% RAM) then OS page cache. Tuning shared_buffers too high starves the OS.' },
    { severity: 'warning', text: 'MVCC means dead tuples accumulate on every UPDATE/DELETE. Autovacuum is not optional — disabling it causes table bloat and eventually table-level lock escalation.' },
  ],
}
