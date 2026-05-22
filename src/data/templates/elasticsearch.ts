import type { ComponentTemplate } from '../../types/schema'

export const elasticsearchTemplate: ComponentTemplate = {
  type: 'elasticsearch',
  display_name: 'Elasticsearch',
  flavor: 'JVM (Java) · Lucene · distributed inverted index · REST API · shard-based replication',
  color: 'yellow',
  icon: 'Search',
  topologies: ['standalone', 'cluster', 'ha'],
  default_config: {
    version: '8.13',
    jvm_heap_gb: 4,
    shard_count: 1,
    replica_count: 1,
    refresh_interval: '1s',
    codec: 'default',
  },
  config_schema: {
    version:          { type: 'select', label: 'Version', options: ['7.17', '8.11', '8.13'] },
    jvm_heap_gb:      { type: 'number', label: 'JVM heap per node (GB)', min: 1, max: 32 },
    shard_count:      { type: 'number', label: 'Primary shards', min: 1, max: 1000 },
    replica_count:    { type: 'number', label: 'Replicas per shard', min: 0, max: 5 },
    refresh_interval: { type: 'select', label: 'Refresh interval', options: ['1s', '5s', '30s', '-1'] },
    codec:            { type: 'select', label: 'Codec', options: ['default', 'best_compression'] },
  },

  // ── Axis 1 — Index / document model ────────────────────────────────────
  axis1: {
    d1: {
      label: 'Index objects',
      nodes: [
        {
          id: 'index', label: 'Index', drillable: true,
          tooltip: 'Logical namespace for a collection of documents. Sharded across primary shards.',
          d2: {
            label: 'Index structure',
            nodes: [
              {
                id: 'shard', label: 'Shard', drillable: true,
                count_from: 'config.shard_count',
                tooltip: 'A Lucene index. Unit of distribution and parallelism. Cannot be split after creation.',
                d3: {
                  label: 'Lucene internals',
                  nodes: [
                    { id: 'segment',      label: 'Segment',              drillable: false, tooltip: 'Immutable Lucene index unit. Merged in background. More segments = slower search; fewer = slower indexing.' },
                    { id: 'inverted_idx', label: 'Inverted index',       drillable: false, tooltip: 'term → sorted list of docIDs (posting list). The core structure enabling full-text search.' },
                    { id: 'posting_list', label: 'Posting list',         drillable: false, tooltip: 'Sorted array of document IDs that contain a term. Delta-encoded + Roaring Bitmap for dense sets.' },
                    { id: 'doc_values',   label: 'Doc values (columnar)', drillable: false, tooltip: 'Column-store alongside the inverted index. Used for sorting, aggregations, scripting. Off-heap via mmap.' },
                    { id: 'stored_fields',label: 'Stored fields',        drillable: false, tooltip: 'Original field values stored for _source retrieval. Compressed with LZ4 per block.' },
                    { id: 'norms',        label: 'Norms (TF-IDF)',       drillable: false, tooltip: 'Per-field per-document length normalization factor for relevance scoring. Disable if not scoring.' },
                  ],
                },
              },
              { id: 'replica_shard', label: 'Replica shard', count_from: 'config.replica_count', drillable: false, tooltip: 'Exact copy of a primary shard. Serves reads. Promoted on primary failure.' },
              { id: 'mapping',       label: 'Mapping (schema)',      drillable: false, tooltip: 'Field type definitions. dynamic:true auto-creates mappings — can cause mapping explosion on uncontrolled ingestion.' },
              { id: 'alias',         label: 'Alias',                  drillable: false, tooltip: 'Virtual index name. Zero-downtime reindex: build new index, atomically swap alias.' },
            ],
          },
        },
        {
          id: 'document', label: 'Document', drillable: true,
          tooltip: 'JSON object stored in an index. Immutable once indexed — updates are delete + re-index.',
          d2: {
            label: 'Document internals',
            nodes: [
              { id: 'source_field',  label: '_source (JSON)',         drillable: false, tooltip: 'Original JSON stored verbatim (LZ4 compressed). Returned in hits. Can be disabled to save disk.' },
              { id: 'id_field',      label: '_id',                   drillable: false, tooltip: 'Document ID. Auto-generated UUID or custom. Routes to shard via hash(_id) % num_primary_shards.' },
              { id: 'seq_no',        label: '_seq_no / _primary_term', drillable: false, tooltip: 'Optimistic concurrency control. Use if_seq_no + if_primary_term for compare-and-swap semantics.' },
              { id: 'field_text',    label: 'text field',            drillable: false, tooltip: 'Analyzed: tokenized → lowercased → stemmed → indexed to inverted index. Not sortable without keyword sub-field.' },
              { id: 'field_keyword', label: 'keyword field',         drillable: false, tooltip: 'Not analyzed. Exact match, sort, aggregation, scripting. Stored in doc values.' },
              { id: 'field_numeric', label: 'numeric / date',        drillable: false, tooltip: 'Stored in BKD-tree (block k-d tree) for fast range queries. Not in inverted index.' },
            ],
          },
        },
        {
          id: 'query_dsl', label: 'Query DSL', drillable: true,
          tooltip: 'JSON query language. leaf queries + compound queries + aggregations.',
          d2: {
            label: 'Query types',
            nodes: [
              { id: 'match_query',   label: 'match',          drillable: false, tooltip: 'Full-text query. Text analyzed before search. Standard choice for user-facing search.' },
              { id: 'term_query',    label: 'term / terms',   drillable: false, tooltip: 'Exact match on keyword/numeric fields. Uses inverted index for text, doc values for aggs.' },
              { id: 'range_query',   label: 'range',          drillable: false, tooltip: 'Numeric and date ranges. Served from BKD-tree. Very fast for bounded date ranges.' },
              { id: 'bool_query',    label: 'bool',           drillable: false, tooltip: 'must (score) + filter (no score, cached) + should + must_not. Put selective filters first.' },
              { id: 'knn_query',     label: 'knn (vector)',   drillable: false, tooltip: 'Approximate nearest-neighbor on dense_vector fields using HNSW graph. ES 8.0+.' },
              { id: 'aggregation',   label: 'aggregation',    drillable: false, tooltip: 'Bucket + metric + pipeline aggs. Run alongside search. doc_values must be enabled for agg fields.' },
            ],
          },
        },
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
          { id: 'memory', label: 'Memory', drillable: true, tooltip: 'JVM heap (heap_max=31GB for compressed OOPs) + off-heap Lucene mmap. Split ~50/50.', sub_chips: [
            { id: 'dram',      label: 'DRAM',           drillable: false },
            { id: 'ram_pages', label: 'RAM pages (4KB)', drillable: false },
            { id: 'tlb',       label: 'TLB',            drillable: false },
          ]},
          { id: 'disk',   label: 'Disk (SSD strongly recommended)', drillable: true, sub_chips: [
            { id: 'block_dev',  label: 'Block device',                 drillable: false },
            { id: 'fs_layer',   label: 'Filesystem (ext4/xfs/tmpfs)',  drillable: false },
            { id: 'lucene_dir', label: 'Lucene segment files',         drillable: false },
            { id: 'tlog_file',  label: 'Translog file',                drillable: false },
          ]},
          { id: 'network', label: 'Network (inter-shard)', drillable: true, sub_chips: [
            { id: 'nic',            label: 'NIC',            drillable: false },
            { id: 'tcp_stack',      label: 'TCP stack',      drillable: false },
            { id: 'socket_buffers', label: 'Socket buffers', drillable: false },
          ]},
        ],
      },
      {
        id: 'os', name: 'Host OS',
        components: [
          { id: 'page_cache', label: 'OS page cache',      drillable: false, tooltip: 'Lucene segment files are mmap\'d — hot segments live here. This is off-heap ES memory. Keep heap ≤ 50% RAM.' },
          { id: 'mmap_lucene',label: 'mmap (Lucene segs)', drillable: false, tooltip: 'doc_values, stored fields, and term dictionaries are memory-mapped. Page cache is the buffer.' },
          { id: 'epoll',      label: 'epoll',              drillable: false },
          { id: 'vfs',        label: 'VFS',                drillable: false },
          { id: 'scheduler',  label: 'OS scheduler',       drillable: false },
          { id: 'vm_swappiness', label: 'vm.swappiness=1', drillable: false, tooltip: 'ES docs: set to 1, not 0. Prevents OOM killer while discouraging swap. Critical for heap stability.' },
        ],
      },
      {
        id: 'process', name: 'Process',
        components: [
          { id: 'es_process', label: 'elasticsearch',    drillable: false, tooltip: 'Single JVM process per node. All shard operations, REST API, cluster coordination run here.' },
        ],
      },
      {
        id: 'threads', name: 'Thread pools',
        nested_in: 'process',
        components: [
          { id: 'search_pool',    label: 'search pool',         drillable: false, tooltip: 'Handles query phase. Size: (vCPUs * 3/2) + 1. Saturation → queue → rejected search requests.' },
          { id: 'write_pool',     label: 'write pool',          drillable: false, tooltip: 'Handles index/delete/bulk. Fixed at vCPU count. Backpressure via queue depth.' },
          { id: 'transport_pool', label: 'transport pool',      drillable: false, tooltip: 'Handles inter-node requests: shard operations, cluster state, cross-shard searches.' },
          { id: 'flush_pool',     label: 'flush / merge pool',  drillable: false, tooltip: 'Segment merges (Lucene). Merges run in background — uncapped merges can spike I/O and CPU.' },
          { id: 'refresh_pool',   label: 'refresh pool',        drillable: false, tooltip: 'Calls IndexWriter.commit() on refresh_interval. Makes new docs visible to search.' },
        ],
      },
      {
        id: 'runtime', name: 'JVM Runtime',
        components: [
          { id: 'jvm_heap',    label: 'JVM heap',       drillable: false, tooltip: 'Heap holds query results, field data cache, filter cache, fielddata. Keep ≤ 31GB (compressed OOPs threshold).' },
          { id: 'g1gc',        label: 'G1GC / ZGC',     drillable: false, tooltip: 'G1GC default. ZGC available for sub-10ms pauses. GC pauses are cluster instability risk — node goes unresponsive.' },
          { id: 'off_heap',    label: 'Off-heap (mmap)', drillable: false, tooltip: 'Lucene segment data (doc_values, stored fields, postings) lives here via mmap. This is OS page cache from JVM perspective.' },
          { id: 'jit',         label: 'JIT compiler',   drillable: false },
          { id: 'metaspace',   label: 'Metaspace',      drillable: false },
        ],
      },
      {
        id: 'app_modules', name: 'App modules',
        components: [
          { id: 'lucene_engine',   label: 'Lucene engine',        drillable: false, tooltip: 'Core search: IndexWriter (indexing), IndexReader (search), per-segment scoring, merge policy.' },
          { id: 'query_executor',  label: 'Query executor',       drillable: false, tooltip: 'Parses DSL, creates Lucene Query objects, scores, collects top-N across all shard segments.' },
          { id: 'shard_alloc',     label: 'Shard allocator',      drillable: false, tooltip: 'Master assigns shards to nodes based on disk usage, tag filters, and allocation settings.' },
          { id: 'cluster_state',   label: 'Cluster state mgr',    drillable: false, tooltip: 'Published by elected master. All nodes apply state updates atomically. Gossip-free coordination.' },
          { id: 'translog',        label: 'Translog',             drillable: false, tooltip: 'Write-ahead log per shard. Durability before Lucene commit. Recovered on node restart.' },
          { id: 'agg_framework',   label: 'Aggregation framework', drillable: false, tooltip: 'Runs against doc_values in columnar scan. Far more efficient than script/stored field access.' },
          { id: 'snapshot_mgr',    label: 'Snapshot / restore',   drillable: false },
        ],
      },
    ],
  },

  cross_links: {
    // A1 D1 → A2
    'index':      ['lucene_engine', 'shard_alloc', 'jvm_heap', 'disk', 'memory'],
    'document':   ['lucene_engine', 'translog', 'write_pool', 'jvm_heap'],
    'query_dsl':  ['query_executor', 'search_pool', 'jvm_heap', 'cpu'],
    // A1 D2 → A2
    'shard':        ['lucene_engine', 'translog', 'disk', 'lucene_dir', 'mmap_lucene'],
    'replica_shard':['shard_alloc', 'transport_pool', 'network'],
    'mapping':      ['lucene_engine', 'jvm_heap', 'cluster_state'],
    // A1 D3 shard → A2
    'segment':      ['lucene_engine', 'mmap_lucene', 'page_cache', 'disk'],
    'inverted_idx': ['lucene_engine', 'off_heap', 'disk', 'lucene_dir'],
    'posting_list': ['lucene_engine', 'off_heap', 'memory', 'ram_pages'],
    'doc_values':   ['agg_framework', 'off_heap', 'mmap_lucene', 'disk'],
    'stored_fields':['jvm_heap', 'off_heap', 'disk'],
    // A1 D2 document → A2
    'source_field':  ['jvm_heap', 'disk', 'stored_fields'],
    'field_text':    ['lucene_engine', 'inverted_idx', 'jvm_heap'],
    'field_keyword': ['doc_values', 'off_heap', 'agg_framework'],
    'field_numeric': ['lucene_engine', 'off_heap', 'disk'],
    // A1 D2 query → A2
    'match_query':  ['query_executor', 'lucene_engine', 'jvm_heap', 'search_pool'],
    'bool_query':   ['query_executor', 'jvm_heap', 'search_pool', 'cpu'],
    'aggregation':  ['agg_framework', 'doc_values', 'off_heap', 'jvm_heap'],
    'knn_query':    ['query_executor', 'memory', 'cpu', 'off_heap'],
    // A2 internal → hardware
    'jvm_heap':     ['memory', 'dram'],
    'g1gc':         ['memory', 'cpu', 'cpu_cores'],
    'off_heap':     ['memory', 'dram', 'page_cache', 'mmap_lucene'],
    'search_pool':  ['cpu', 'cpu_cores'],
    'write_pool':   ['cpu', 'disk', 'tlog_file'],
    'flush_pool':   ['disk', 'cpu', 'lucene_dir'],
    'translog':     ['disk', 'tlog_file', 'memory'],
    'lucene_engine':['cpu', 'disk', 'jvm_heap', 'off_heap'],
    'agg_framework':['off_heap', 'cpu', 'memory'],
    'page_cache':   ['memory', 'disk'],
    'mmap_lucene':  ['memory', 'dram', 'disk', 'lucene_dir'],
    'cluster_state':['memory', 'network', 'cpu'],
  },

  topology_mutations: {
    cluster: {
      add_nodes: [
        { id: '__data_node',   label: 'Data node',   axis: 'axis2' },
        { id: '__master_node', label: 'Master node', axis: 'axis2' },
      ],
      add_edges: [{ source: '__master_node', target: '__data_node', label: 'shard allocation', protocol: 'HTTP' }],
    },
    ha: {
      add_nodes: [
        { id: '__data_node',   label: 'Data node',     axis: 'axis2' },
        { id: '__master_node', label: 'Master node ×3', axis: 'axis2' },
        { id: '__coord_node',  label: 'Coordinating',  axis: 'axis2' },
      ],
      add_edges: [{ source: '__coord_node', target: '__data_node', label: 'scatter/gather', protocol: 'HTTP' }],
    },
  },

  chip_emphasis: {
    jvm_heap:    { config_key: 'jvm_heap_gb', unit: 'GB', warn_above: 31 },
    translog:    { config_key: 'refresh_interval' },
    lucene_engine: { config_key: 'codec' },
  },

  tier1_insights: [
    { severity: 'warning', text: 'Heap must stay ≤ 31 GB (compressed OOPs boundary). Above 31 GB, pointer encoding changes and you actually get less usable heap. Set Xms = Xmx = 31g maximum.' },
    { severity: 'info',    text: 'Lucene data (doc_values, stored fields, inverted index) lives off-heap via mmap — it\'s OS page cache from the JVM\'s perspective. Keep heap ≤ 50% RAM so Lucene can use the rest.' },
    { severity: 'warning', text: 'Shard count is set at index creation and cannot change. Too few shards = poor parallelism. Too many = overhead and hot-threads. Rule of thumb: each shard ≤ 50GB.' },
  ],
}
