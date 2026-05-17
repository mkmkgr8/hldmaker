import type { ComponentTemplate } from '../../types/schema'

export const mysqlTemplate: ComponentTemplate = {
  type: 'mysql',
  display_name: 'MySQL',
  flavor: 'C++ · InnoDB engine · multi-threaded · B+ tree clustered index · redo + undo + binlog',
  color: 'amber',
  icon: 'Database',
  topologies: ['standalone', 'primary_replicas', 'ha'],
  default_config: {
    version: '8.0',
    innodb_buffer_pool_size: '128MB',
    max_connections: 150,
    binlog_enabled: true,
    sync_binlog: 1,
    innodb_flush_log_at_trx_commit: 1,
    replica_count: 0,
  },
  config_schema: {
    version:                          { type: 'select', label: 'Version', options: ['5.7', '8.0', '8.4'] },
    innodb_buffer_pool_size:          { type: 'string', label: 'innodb_buffer_pool_size', unit: 'e.g. 4GB (target 70–80% RAM)' },
    max_connections:                  { type: 'number', label: 'max_connections', min: 1, max: 100000 },
    binlog_enabled:                   { type: 'boolean', label: 'Binary log enabled' },
    sync_binlog:                      { type: 'select', label: 'sync_binlog', options: ['0', '1', '1000'] },
    innodb_flush_log_at_trx_commit:   { type: 'select', label: 'innodb_flush_log_at_trx_commit', options: ['0', '1', '2'] },
    replica_count:                    { type: 'number', label: 'Replica count', min: 0, max: 10 },
  },

  // ── Axis 1 — Service internals ──────────────────────────────────────────
  axis1: {
    d1: {
      label: 'Schema objects',
      nodes: [
        { id: 'database',   label: 'Database',          drillable: false },
        { id: 'table',      label: 'Table',             drillable: true },
        { id: 'view',       label: 'View',              drillable: false },
        { id: 'stored_proc',label: 'Stored procedure',  drillable: false },
        { id: 'trigger',    label: 'Trigger',           drillable: false },
        { id: 'partition',  label: 'Partition',         drillable: false },
      ],
    },
    d2: {
      label: 'Row-level model',
      parent: 'table',
      nodes: [
        { id: 'row',           label: 'Row',                  drillable: true },
        { id: 'column',        label: 'Column',               drillable: false },
        { id: 'clustered_idx', label: 'Clustered index (PK)', drillable: true, tooltip: 'PK IS the physical row order. UUID PKs cause random 16KB page writes — severe fragmentation.' },
        { id: 'secondary_idx', label: 'Secondary index',      drillable: false, tooltip: 'Stores PK value at leaves. Secondary lookup = 2 B-tree traversals.' },
        { id: 'fk',            label: 'Foreign key',          drillable: false },
        { id: 'mvcc_view',     label: 'MVCC read view',       drillable: false, tooltip: 'InnoDB MVCC via undo log — old versions stored in system tablespace, not in-place like Postgres.' },
      ],
    },
    d3: {
      label: 'C++ internals',
      parent: 'clustered_idx',
      nodes: [
        { id: 'buf_page_t',    label: 'buf_page_t',    drillable: false, tooltip: '16KB InnoDB page descriptor. page_id (space_id + page_no), oldest_modification LSN, state, zip_size.' },
        { id: 'trx_t',         label: 'trx_t',         drillable: false, tooltip: 'Transaction struct. trx_id, state (ACTIVE/COMMITTED/ABORTED), undo_no, lock_list, read_view pointer.' },
        { id: 'dict_index_t',  label: 'dict_index_t',  drillable: false, tooltip: 'Index metadata: name, space_id, root page no, n_fields, type (clustered/secondary). Lives in data dictionary.' },
        { id: 'rec_t',         label: 'rec_t',         drillable: false, tooltip: 'Physical record within a page. Variable-length fields at end. rec_get_offsets() decodes field positions.' },
        { id: 'undo_rec_t',    label: 'undo_rec_t',    drillable: false, tooltip: 'Undo log record: old column values for MVCC and ROLLBACK. Stored in rollback segments in undo tablespace.' },
        { id: 'mtr_t',         label: 'mtr_t',         drillable: false, tooltip: 'Mini-transaction: atomic unit for InnoDB page modifications. Holds page latches and generates redo log.' },
        { id: 'log_block_t',   label: 'log_block_t',   drillable: false, tooltip: '512-byte redo log block. hdr_no, data_len, first_rec_group, checksum. Written to ib_logfile.' },
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
          { id: 'memory', label: 'Memory (buffer pool!)', drillable: true, tooltip: 'InnoDB buffer pool should be 70–80% of RAM. Most important tuning knob.', sub_chips: [
            { id: 'dram',      label: 'DRAM',           drillable: false },
            { id: 'ram_pages', label: 'RAM pages (4KB)', drillable: false },
            { id: 'tlb',       label: 'TLB',            drillable: false },
          ]},
          { id: 'disk',   label: 'Disk (data + redo + binlog)', drillable: true, sub_chips: [
            { id: 'block_dev',  label: 'Block device',          drillable: false },
            { id: 'fs_layer',   label: 'Filesystem (ext4/xfs)', drillable: false },
            { id: 'ibd_files',  label: '.ibd tablespace files', drillable: false },
            { id: 'ib_logfile', label: 'ib_logfile (redo)',     drillable: false },
            { id: 'binlog_file',label: 'mysql-bin (binlog)',    drillable: false },
            { id: 'sectors',    label: 'Disk sectors (512B)',   drillable: false },
          ]},
          { id: 'network',label: 'Network', drillable: true, sub_chips: [
            { id: 'nic',            label: 'NIC',            drillable: false },
            { id: 'tcp_stack',      label: 'TCP stack',      drillable: false },
            { id: 'socket_buffers', label: 'Socket buffers', drillable: false },
          ]},
        ],
      },
      {
        id: 'os', name: 'Host OS',
        components: [
          { id: 'page_cache', label: 'OS page cache',      drillable: false, tooltip: 'Secondary cache. Less critical than in Postgres because InnoDB buffer pool handles caching itself.' },
          { id: 'fsync_os',   label: 'fsync()',            drillable: false, tooltip: 'innodb_flush_log_at_trx_commit=0: no fsync. =1: fsync per commit. =2: fsync per second. 0 = up to 1s data loss.' },
          { id: 'epoll',      label: 'epoll / poll',       drillable: false },
          { id: 'fds',        label: 'File descriptors',   drillable: false },
          { id: 'direct_io',  label: 'Direct I/O (opt.)',  drillable: false, tooltip: 'innodb_flush_method=O_DIRECT bypasses OS page cache for data files — avoids double caching.' },
          { id: 'scheduler',  label: 'OS scheduler',       drillable: false },
        ],
      },
      {
        id: 'process', name: 'Process',
        components: [
          { id: 'mysqld', label: 'mysqld',drillable: false, tooltip: 'Single process, multi-threaded. Unlike Postgres, threads share memory — a crash in one thread can kill the whole server.' },
        ],
      },
      {
        id: 'runtime', name: 'C++ Runtime + InnoDB',
        components: [
          { id: 'innodb_bp',   label: 'InnoDB buffer pool', drillable: false, tooltip: 'Application-managed page cache. Target 70–80% RAM. Replaces most need for OS page cache.' },
          { id: 'undo_tbs',    label: 'Undo tablespace',    drillable: false, tooltip: 'Stores old row versions for MVCC and ROLLBACK. Grows under long-running transactions.' },
          { id: 'change_buf',  label: 'Change buffer',      drillable: false, tooltip: 'Buffers secondary index inserts when the index page is not in buffer pool. Merged lazily on page read.' },
          { id: 'libc',        label: 'libc / libstdc++',   drillable: false },
        ],
      },
      {
        id: 'threads', name: 'Threads',
        components: [
          { id: 'conn_thread',  label: 'connection thread × N', drillable: false, tooltip: 'One thread per client connection. Cheaper than Postgres processes — but all threads share crash domain.' },
          { id: 'purge_thread', label: 'purge thread',          drillable: false, tooltip: 'Cleans undo log records from committed transactions. Like Postgres autovacuum — critical for long txn cleanup.' },
          { id: 'page_cleaner', label: 'page cleaner thread',   drillable: false, tooltip: 'Flushes dirty buffer pool pages to disk. innodb_page_cleaners controls thread count.' },
          { id: 'redo_writer',  label: 'redo log writer',       drillable: false, tooltip: 'Writes redo (InnoDB) log. Separate from binlog writer — both must commit for durability.' },
          { id: 'binlog_writer',label: 'binlog writer',         drillable: false, tooltip: 'Writes MySQL binary log. Used for replication and point-in-time recovery.' },
          { id: 'io_threads',   label: 'I/O threads',           drillable: false, tooltip: 'innodb_read_io_threads + innodb_write_io_threads. Async disk I/O for buffer pool pages.' },
        ],
      },
      {
        id: 'app_modules', name: 'App modules',
        components: [
          { id: 'innodb_engine', label: 'InnoDB engine',    drillable: false, tooltip: 'Storage engine layer. Handles page read/write, MVCC, locking, transactions, crash recovery.' },
          { id: 'query_opt',     label: 'Query optimizer',  drillable: false, tooltip: 'Cost-based optimizer. Chooses index, join order, join algorithm. EXPLAIN shows its choices.' },
          { id: 'lock_mgr',      label: 'Lock manager',     drillable: false, tooltip: 'Row-level locks (shared/exclusive) + gap locks + next-key locks for serializable isolation.' },
          { id: 'txn_mgr',       label: 'Txn manager',      drillable: false, tooltip: 'Coordinates 2PC: InnoDB redo + binlog. Both must commit for durability with replication.' },
          { id: 'binlog_mgr',    label: 'Binlog manager',   drillable: false },
        ],
      },
    ],
  },

  // ── Cross-links ─────────────────────────────────────────────────────────
  cross_links: {
    // A1 D1 → A2
    'table':        ['conn_thread', 'innodb_bp', 'innodb_engine', 'memory', 'disk'],
    'database':     ['conn_thread', 'lock_mgr'],
    'stored_proc':  ['conn_thread', 'query_opt', 'cpu'],
    'trigger':      ['conn_thread', 'lock_mgr', 'cpu'],
    // A1 D2 → A2
    'row':          ['conn_thread', 'innodb_bp', 'memory', 'ram_pages'],
    'clustered_idx':['innodb_bp', 'innodb_engine', 'disk', 'ibd_files'],
    'secondary_idx':['innodb_bp', 'change_buf', 'memory'],
    'mvcc_view':    ['purge_thread', 'txn_mgr', 'undo_tbs', 'memory'],
    'fk':           ['conn_thread', 'lock_mgr', 'query_opt'],
    // A1 D3 → A2 (C++ structs → runtime + hardware)
    'buf_page_t':   ['innodb_bp', 'memory', 'ram_pages', 'dram'],
    'trx_t':        ['txn_mgr', 'lock_mgr', 'undo_tbs', 'memory'],
    'dict_index_t': ['innodb_bp', 'innodb_engine', 'memory', 'disk'],
    'rec_t':        ['innodb_bp', 'memory', 'ram_pages'],
    'undo_rec_t':   ['purge_thread', 'undo_tbs', 'disk', 'sectors'],
    'mtr_t':        ['redo_writer', 'innodb_engine', 'disk'],
    'log_block_t':  ['redo_writer', 'disk', 'ib_logfile', 'sectors', 'fsync_os'],
    // A2 internal → hardware
    'innodb_bp':    ['memory', 'dram', 'ram_pages'],
    'undo_tbs':     ['disk', 'memory'],
    'conn_thread':  ['cpu', 'memory', 'socket_buffers'],
    'purge_thread': ['cpu', 'disk', 'memory'],
    'redo_writer':  ['disk', 'ib_logfile', 'sectors', 'fsync_os'],
    'page_cleaner': ['disk', 'memory', 'cpu'],
    'binlog_writer':['disk', 'binlog_file', 'fsync_os'],
    'io_threads':   ['disk', 'memory', 'cpu'],
    'page_cache':   ['memory', 'disk'],
    'epoll':        ['cpu', 'fds'],
    'libc':         ['memory'],
  },

  topology_mutations: {
    primary_replicas: {
      add_nodes: [{ id: '__replica', label: 'Replica', count_from: 'config.replica_count', axis: 'axis2' }],
      add_edges: [{ source: '__primary', target: '__replica', label: 'binlog replication', protocol: 'async' }],
    },
    ha: {
      add_nodes: [
        { id: '__replica',  label: 'Standby',  count_from: 'config.replica_count', axis: 'axis2' },
        { id: '__proxysql', label: 'ProxySQL', axis: 'axis2' },
      ],
      add_edges: [{ source: '__primary', target: '__replica', label: 'semi-sync repl', protocol: 'TCP' }],
    },
  },

  tier1_insights: [
    { severity: 'info',    text: 'InnoDB buffer pool is the single most important tuning knob — target 70–80% of RAM. Unlike Postgres, this replaces most need for OS page cache.' },
    { severity: 'warning', text: 'Clustered index = PK IS the physical row order on disk. UUID PKs cause random 16KB page writes → severe I/O amplification and fragmentation.' },
    { severity: 'info',    text: 'MySQL uses threads per connection (vs Postgres OS processes) — cheaper to spin up, but threads share a crash domain. One bad thread can kill mysqld.' },
  ],
}
