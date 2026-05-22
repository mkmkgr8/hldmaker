import type { ComponentTemplate } from '../../types/schema'

export const nginxTemplate: ComponentTemplate = {
  type: 'nginx',
  display_name: 'Nginx',
  flavor: 'C · event-driven master/worker · epoll/kqueue · zero-copy sendfile · upstream proxy',
  color: 'green',
  icon: 'Globe',
  topologies: ['standalone', 'ha', 'cluster'],
  default_config: {
    version: '1.26',
    worker_processes: 'auto',
    worker_connections: 1024,
    keepalive_timeout: 65,
    ssl_enabled: true,
    upstream_algo: 'round_robin',
  },
  config_schema: {
    version:            { type: 'select', label: 'Version', options: ['1.24', '1.25', '1.26'] },
    worker_processes:   { type: 'string', label: 'worker_processes', unit: 'auto = one per CPU core' },
    worker_connections: { type: 'number', label: 'worker_connections', min: 256, max: 65535 },
    keepalive_timeout:  { type: 'number', label: 'keepalive_timeout (s)', min: 0, max: 3600 },
    ssl_enabled:        { type: 'boolean', label: 'SSL/TLS enabled' },
    upstream_algo:      { type: 'select', label: 'Upstream algorithm', options: ['round_robin', 'least_conn', 'ip_hash', 'hash'] },
  },

  // ── Axis 1 — Configuration objects ─────────────────────────────────────
  axis1: {
    d1: {
      label: 'Config objects',
      nodes: [
        {
          id: 'server_block', label: 'Server block', drillable: true,
          tooltip: 'Virtual server. Nginx selects which server{} block handles a request via server_name and listen port.',
          d2: {
            label: 'Server directives',
            nodes: [
              { id: 'listen',       label: 'listen',         drillable: false, tooltip: 'Bind address + port. listen 443 ssl; or listen [::]:80; for IPv6.' },
              { id: 'server_name',  label: 'server_name',    drillable: false, tooltip: 'Virtual host matching. Wildcard and regex patterns supported. Default server catches unmatched SNI.' },
              { id: 'root',         label: 'root / alias',   drillable: false, tooltip: 'Document root for static files. alias strips the location prefix; root appends it.' },
              { id: 'error_page',   label: 'error_page',     drillable: false },
              { id: 'access_log',   label: 'access_log',     drillable: false, tooltip: 'Per-server log. Can be turned off (access_log off) to save I/O on high-traffic static servers.' },
            ],
          },
        },
        {
          id: 'location', label: 'Location block', drillable: true,
          tooltip: 'Request routing rule. Exact (=), prefix, case-insensitive (~*), or regex (~) matching.',
          d2: {
            label: 'Location directives',
            nodes: [
              { id: 'proxy_pass',      label: 'proxy_pass',       drillable: false, tooltip: 'Forward request to upstream. URL rewriting depends on trailing slash. Core of reverse-proxy config.' },
              { id: 'try_files',       label: 'try_files',        drillable: false, tooltip: 'Static file serving with fallback. try_files $uri $uri/ =404 is idiomatic SPA config.' },
              { id: 'rewrite',         label: 'rewrite',          drillable: false, tooltip: 'URI rewriting with PCRE regex. last flag re-evaluates; break stops; redirect/permanent send HTTP 3xx.' },
              { id: 'rate_limit',      label: 'limit_req',        drillable: false, tooltip: 'Token bucket rate limiting per zone. burst= allows queuing; nodelay skips the queue delay.' },
              { id: 'cache_directive', label: 'proxy_cache',      drillable: false, tooltip: 'Caches upstream responses. proxy_cache_key controls cache keying. X-Cache header for hit/miss debugging.' },
              { id: 'gzip',            label: 'gzip',             drillable: false },
            ],
          },
        },
        {
          id: 'upstream', label: 'Upstream group', drillable: true,
          tooltip: 'Named pool of backend servers. Load balancing algorithm applies across the pool.',
          d2: {
            label: 'Upstream directives',
            nodes: [
              { id: 'upstream_server', label: 'server (backend)',   drillable: false, tooltip: 'Individual backend. weight=, max_fails=, fail_timeout=, backup, down flags.' },
              { id: 'keepalive',       label: 'keepalive',          drillable: false, tooltip: 'Cached keepalive connections to upstream. Dramatically cuts TCP handshake overhead for HTTP/1.1 backends.' },
              { id: 'health_check',    label: 'health_check',       drillable: false, tooltip: 'Active health probes (Nginx Plus). Open-source uses passive: max_fails threshold marks server as unhealthy.' },
              { id: 'zone',            label: 'zone (shared mem)',   drillable: false, tooltip: 'Shared memory zone for upstream state — peer weights, fail counters, health status shared across workers.' },
            ],
          },
        },
        { id: 'ssl_ctx',    label: 'SSL/TLS context',   drillable: false, tooltip: 'ssl_certificate, ssl_certificate_key, ssl_protocols, ssl_ciphers. TLS 1.3 preferred.' },
        { id: 'map_block',  label: 'map block',          drillable: false, tooltip: 'Build variables from other variables with O(1) hash lookup. Avoids if blocks in location context.' },
        { id: 'geo_block',  label: 'geo / geoip2',       drillable: false },
      ],
    },
  },

  // ── Axis 2 — Execution stack (bottom → top) ────────────────────────────
  axis2: {
    layers: [
      {
        id: 'hardware', name: 'Hardware',
        components: [
          { id: 'cpu',    label: 'CPU (multi-core)', drillable: true, sub_chips: [
            { id: 'cpu_cores', label: 'CPU cores (1 per worker)', drillable: false },
            { id: 'l3_cache',  label: 'L3 cache',                 drillable: false },
            { id: 'runqueue',  label: 'Scheduler runqueue',       drillable: false },
          ]},
          { id: 'memory', label: 'Memory', drillable: true, sub_chips: [
            { id: 'dram',      label: 'DRAM',            drillable: false },
            { id: 'ram_pages', label: 'RAM pages (4KB)',  drillable: false },
          ]},
          { id: 'disk',   label: 'Disk (static + logs)', drillable: true, sub_chips: [
            { id: 'block_dev', label: 'Block device',     drillable: false },
            { id: 'fs_layer',  label: 'Filesystem',       drillable: false },
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
          { id: 'epoll',      label: 'epoll / kqueue',   drillable: false, tooltip: 'Each worker runs one epoll loop. All connections for that worker are multiplexed on one OS thread.' },
          { id: 'sendfile',   label: 'sendfile()',        drillable: false, tooltip: 'Zero-copy static file serving: kernel reads file from page cache and writes to socket without entering userspace.' },
          { id: 'page_cache', label: 'OS page cache',    drillable: false, tooltip: 'Static files served via page cache — hot files never touch disk after first read.' },
          { id: 'so_reuseport', label: 'SO_REUSEPORT',   drillable: false, tooltip: 'Each worker binds independently to the same port. Kernel distributes accepts without a shared accept lock.' },
          { id: 'tcp_offload', label: 'TCP offload',     drillable: false, tooltip: 'tcp_nopush + tcp_nodelay: batch headers + immediate flush. Reduces small-packet overhead.' },
        ],
      },
      {
        id: 'process', name: 'Processes',
        components: [
          { id: 'master_proc',  label: 'master process',         drillable: false, tooltip: 'Reads config, forks workers, handles signals (reload, upgrade). Never touches connections directly.' },
          { id: 'worker_proc',  label: 'worker process × N',     drillable: false, tooltip: 'One per CPU core (worker_processes auto). Each runs a self-contained event loop — no shared state between workers.' },
          { id: 'cache_mgr',    label: 'cache manager',          drillable: false, tooltip: 'Walks the proxy_cache on disk, evicts expired entries. Separate process from workers.' },
          { id: 'cache_loader', label: 'cache loader',           drillable: false, tooltip: 'Loads disk cache index into shared memory on startup.' },
        ],
      },
      {
        id: 'threads', name: 'Worker internals',
        nested_in: 'process',
        components: [
          { id: 'event_loop',   label: 'event loop (epoll)',     drillable: false, tooltip: 'Core of each worker. Registers interest in socket events; dispatches handlers when events arrive.' },
          { id: 'conn_pool',    label: 'connection pool',        drillable: false, tooltip: 'Pre-allocated connection structs. worker_connections sets the pool size per worker.' },
          { id: 'upstream_kp',  label: 'upstream keepalive',     drillable: false, tooltip: 'Cached idle connections to upstream servers. Reused across requests — saves TCP handshake + TLS round trips.' },
          { id: 'ssl_ctx_rt',   label: 'SSL context (per-worker)', drillable: false, tooltip: 'TLS state machine, session cache. Each worker maintains its own OpenSSL context.' },
        ],
      },
      {
        id: 'runtime', name: 'C Runtime',
        components: [
          { id: 'ngx_pool',   label: 'ngx_pool_t',          drillable: false, tooltip: 'Per-request memory pool. Freed in bulk at request end — no per-object free needed. Avoids fragmentation.' },
          { id: 'ngx_chain',  label: 'ngx_chain_t buffers', drillable: false, tooltip: 'Linked list of output buffers. Written to socket via writev() or sendfile() in a single pass.' },
          { id: 'openssl',    label: 'OpenSSL / BoringSSL',  drillable: false },
          { id: 'pcre',       label: 'PCRE (regex)',         drillable: false },
          { id: 'libc',       label: 'libc',                 drillable: false },
        ],
      },
      {
        id: 'app_modules', name: 'App modules',
        components: [
          { id: 'http_core',   label: 'ngx_http_core',       drillable: false, tooltip: 'Orchestrates the 11-phase HTTP request pipeline: post_read → rewrite → access → content → log.' },
          { id: 'proxy_mod',   label: 'ngx_http_proxy',      drillable: false, tooltip: 'Reverse proxy: buffers upstream response, adds proxy headers, handles X-Accel-Redirect.' },
          { id: 'ssl_mod',     label: 'ngx_http_ssl',        drillable: false, tooltip: 'TLS termination. ssl_session_cache shared: allows TLS session resumption across worker processes.' },
          { id: 'upstream_mod',label: 'ngx_http_upstream',   drillable: false, tooltip: 'Balances across server pool. Passive health: marks backend down after max_fails within fail_timeout.' },
          { id: 'cache_mod',   label: 'ngx_http_cache',      drillable: false, tooltip: 'Disk-backed response cache. Cache key hashed to file path. Stale-while-revalidate via proxy_cache_use_stale.' },
          { id: 'limit_req',   label: 'ngx_limit_req',       drillable: false, tooltip: 'Token-bucket rate limiter. State stored in shared memory zone — consistent across all workers.' },
          { id: 'rewrite_mod', label: 'ngx_http_rewrite',    drillable: false },
        ],
      },
    ],
  },

  cross_links: {
    // A1 D1 → A2
    'server_block': ['master_proc', 'worker_proc', 'http_core'],
    'location':     ['event_loop', 'http_core', 'proxy_mod', 'rewrite_mod'],
    'upstream':     ['upstream_mod', 'upstream_kp', 'conn_pool', 'network'],
    'ssl_ctx':      ['ssl_mod', 'ssl_ctx_rt', 'openssl', 'cpu'],
    // A1 D2 → A2
    'proxy_pass':      ['proxy_mod', 'upstream_mod', 'conn_pool', 'upstream_kp'],
    'try_files':       ['http_core', 'sendfile', 'page_cache', 'disk'],
    'rate_limit':      ['limit_req', 'memory', 'cpu'],
    'cache_directive': ['cache_mod', 'cache_mgr', 'disk', 'page_cache'],
    'upstream_server': ['upstream_mod', 'conn_pool', 'network', 'tcp_stack'],
    'keepalive':       ['upstream_kp', 'conn_pool', 'socket_buffers'],
    'health_check':    ['upstream_mod', 'event_loop', 'network'],
    // A2 internal → hardware
    'worker_proc':  ['cpu', 'cpu_cores', 'epoll'],
    'event_loop':   ['cpu', 'epoll', 'socket_buffers'],
    'conn_pool':    ['memory', 'dram'],
    'upstream_kp':  ['memory', 'network', 'tcp_stack'],
    'ssl_ctx_rt':   ['cpu', 'memory', 'openssl'],
    'proxy_mod':    ['memory', 'network', 'conn_pool'],
    'sendfile':     ['disk', 'nic', 'page_cache'],
    'page_cache':   ['memory', 'disk'],
    'limit_req':    ['memory', 'cpu'],
    'ngx_pool':     ['memory', 'dram'],
  },

  topology_mutations: {
    ha: {
      add_nodes: [
        { id: '__nginx_standby', label: 'Nginx standby', axis: 'axis2' },
        { id: '__keepalived',    label: 'keepalived VIP', axis: 'axis2' },
      ],
      add_edges: [{ source: '__nginx_active', target: '__nginx_standby', label: 'VIP failover', protocol: 'TCP' }],
    },
    cluster: {
      add_nodes: [{ id: '__nginx_node', label: 'Nginx node', axis: 'axis2' }],
      add_edges: [{ source: '__lb', target: '__nginx_node', label: 'distribute', protocol: 'HTTP' }],
    },
  },

  chip_emphasis: {
    worker_proc: { config_key: 'worker_processes' },
    conn_pool:   { config_key: 'worker_connections', unit: 'conns/worker' },
    upstream_kp: { config_key: 'keepalive_timeout', unit: 's' },
  },

  tier1_insights: [
    { severity: 'info',    text: 'Event-driven, not threaded. One worker per CPU core, each handling thousands of connections with a single epoll loop. No context-switch overhead per connection.' },
    { severity: 'info',    text: 'Static files: sendfile() copies directly from OS page cache to NIC — zero userspace copies. Hot static assets cost almost no CPU.' },
    { severity: 'warning', text: 'Blocking operations stall the whole worker: blocking DNS resolvers, synchronous Lua code, slow upstream connects. Use resolver directive with async DNS and set proxy_connect_timeout.' },
  ],
}
