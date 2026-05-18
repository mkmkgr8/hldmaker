import type { ComponentTemplate } from '../../types/schema'

export const javaTemplate: ComponentTemplate = {
  type: 'java',
  display_name: 'Java Service',
  flavor: 'JVM (Java) · Spring Boot · multi-threaded · G1GC · HikariCP · Tomcat NIO',
  color: 'indigo',
  icon: 'Coffee',
  topologies: ['standalone', 'primary_replicas', 'containerized', 'kubernetes'],
  default_config: {
    java_version: '21',
    spring_boot_version: '3.3',
    jvm_heap_mb: 512,
    thread_pool_size: 200,
    db_pool_size: 10,
    gc_algorithm: 'G1GC',
    replica_count: 1,
  },
  config_schema: {
    java_version:        { type: 'select', label: 'Java version', options: ['17', '21', '24'] },
    spring_boot_version: { type: 'select', label: 'Spring Boot', options: ['3.2', '3.3'] },
    jvm_heap_mb:         { type: 'number', label: 'JVM heap (MB)', min: 128, max: 65536 },
    thread_pool_size:    { type: 'number', label: 'Tomcat thread pool size', min: 1, max: 1000 },
    db_pool_size:        { type: 'number', label: 'HikariCP pool size', min: 1, max: 200 },
    gc_algorithm:        { type: 'select', label: 'GC algorithm', options: ['G1GC', 'ZGC', 'Shenandoah'] },
    replica_count:       { type: 'number', label: 'Replica count', min: 1, max: 50 },
  },

  // ── Axis 1 — Service internals ──────────────────────────────────────────
  axis1: {
    d1: {
      label: 'Service surface',
      nodes: [
        {
          id: 'http_endpoint', label: 'HTTP endpoint', drillable: true,
          tooltip: 'Click body to cross-link. Click ↓ to see the Spring MVC request pipeline.',
          d2: {
            label: 'Spring MVC request pipeline',
            nodes: [
              { id: 'filter_chain',   label: 'Filter chain',     drillable: false, tooltip: 'Ordered chain of OncePerRequestFilter — security, CORS, logging, tracing. Runs before servlet dispatch.' },
              {
                id: 'handler_mapping', label: 'Handler mapping', drillable: true,
                tooltip: 'DispatcherServlet matches URL + method to @RequestMapping. Resolves method arguments (path vars, body, params).',
                d3: {
                  label: 'JVM internals — method dispatch',
                  nodes: [
                    { id: 'Method',        label: 'Method (JVM)',   drillable: false, tooltip: 'JVM method descriptor: bytecode pointer, compiled code pointer (set by JIT), method signature, access flags.' },
                    { id: 'InstanceKlass', label: 'InstanceKlass',  drillable: false, tooltip: 'JVM representation of a loaded class. Lives in Metaspace. Holds vtable, itable, field layout, constant pool.' },
                    { id: 'vtable',        label: 'vtable',         drillable: false, tooltip: 'Virtual dispatch table — array of method pointers per class. Enables polymorphism without runtime type checks.' },
                    { id: 'ReflectMethod', label: 'ReflectMethod',  drillable: false, tooltip: 'java.lang.reflect.Method — Spring uses reflection to invoke @RequestMapping handlers. Cached after first call.' },
                  ],
                },
              },
              {
                id: 'controller_method', label: 'Controller method', drillable: true,
                tooltip: '@RestController @RequestMapping — the user-written handler. Arguments already resolved by HandlerMethodArgumentResolver.',
                d3: {
                  label: 'JVM internals — execution frame',
                  nodes: [
                    { id: 'JavaThread',   label: 'JavaThread',    drillable: false, tooltip: 'JVM thread struct. Contains: stack pointer, thread-local allocation buffer (TLAB), JNI refs, safepoint state.' },
                    { id: 'StackFrame',   label: 'StackFrame',    drillable: false, tooltip: 'Activation record on JVM stack: local variable array, operand stack, return address, method ref.' },
                    { id: 'TLAB',         label: 'TLAB',          drillable: false, tooltip: 'Thread-Local Allocation Buffer — private slice of Eden. Object allocation is a pointer bump, no locking needed.' },
                    { id: 'ObjectHeader', label: 'Object header',  drillable: false, tooltip: '96-bit (12 byte) prefix on every Java object: mark word (lock state, GC age, hash) + compressed klass* pointer.' },
                  ],
                },
              },
              { id: 'service_call',  label: '@Service call',     drillable: false, tooltip: '@Transactional proxy wraps the call — begins a transaction, proxies the bean, commits or rolls back on exit.' },
              { id: 'response_body', label: 'Response / DTO',    drillable: false, tooltip: 'Jackson serializes the return value to JSON. @JsonView, custom serializers, and content negotiation apply here.' },
            ],
          },
        },
        {
          id: 'jpa_entity', label: 'JPA entity', drillable: true,
          tooltip: 'Click body to cross-link. Click ↓ to see the Hibernate persistence model.',
          d2: {
            label: 'Hibernate persistence model',
            nodes: [
              {
                id: 'persistence_context', label: 'Persistence context', drillable: true,
                tooltip: 'EntityManager 1st-level cache. Tracks all MANAGED entities for the duration of the transaction. Flushes on commit.',
                d3: {
                  label: 'Hibernate internals',
                  nodes: [
                    { id: 'EntityEntry',               label: 'EntityEntry',               drillable: false, tooltip: 'Tracks one entity\'s state machine: TRANSIENT → MANAGED → DETACHED → REMOVED. Also stores snapshot for dirty checking.' },
                    { id: 'ActionQueue',               label: 'ActionQueue',               drillable: false, tooltip: 'Ordered list of pending INSERT/UPDATE/DELETE actions. Executed in dependency order on flush(). Batching happens here.' },
                    { id: 'StatefulPersistenceContext', label: 'StatefulPersistenceContext', drillable: false, tooltip: 'Map<EntityKey, Object> of all managed entities + Map<EntityKey, Object[]> snapshots for dirty detection.' },
                    { id: 'ByteBuddyProxy',            label: 'ByteBuddy proxy',           drillable: false, tooltip: 'Runtime-generated subclass for lazy associations. Intercepts first field access, triggers SELECT, replaces itself.' },
                  ],
                },
              },
              { id: 'lazy_proxy',     label: 'Lazy proxy',      drillable: false, tooltip: 'ByteBuddy/CGLIB subclass generated at startup. First access fires a SELECT — N+1 problem lives here.' },
              { id: 'dirty_checking', label: 'Dirty checking',   drillable: false, tooltip: 'On flush, Hibernate compares each managed entity to its snapshot. Changed fields produce an UPDATE. Happens per entity.' },
              { id: 'generated_sql',  label: 'Generated SQL',    drillable: false, tooltip: 'Hibernate translates JPQL / Criteria to SQL. Parameterised PreparedStatements prevent SQL injection. Logged via p6spy.' },
              { id: 'hikari_conn',    label: 'HikariCP connection', drillable: false, tooltip: 'Acquired from pool at transaction start, returned at commit/rollback. Pool exhaustion = request thread stall.' },
            ],
          },
        },
        {
          id: 'kafka_consumer', label: 'Kafka consumer', drillable: true,
          tooltip: 'Click body to cross-link. Click ↓ to see the listener container internals.',
          d2: {
            label: 'Kafka listener internals',
            nodes: [
              { id: 'consumer_record',    label: 'ConsumerRecord',     drillable: false, tooltip: 'Single Kafka message: topic, partition, offset, timestamp, key, value, headers. Deserialized before listener call.' },
              { id: 'listener_container', label: 'Listener container',  drillable: false, tooltip: 'ConcurrentMessageListenerContainer — one thread per assigned partition. Calls poll() in a loop.' },
              { id: 'error_handler',      label: 'Error handler',       drillable: false, tooltip: 'DefaultErrorHandler: retry N times with backoff, then send to dead-letter topic (DLT) or log and skip.' },
              { id: 'offset_commit',      label: 'Offset commit',       drillable: false, tooltip: 'BATCH mode: commit after listener returns. MANUAL: app calls Acknowledgment.acknowledge(). No commit = redelivery on restart.' },
              { id: 'deserialization',    label: 'Deserializer',        drillable: false, tooltip: 'JsonDeserializer reconstructs Java objects from bytes. Schema mismatch here = poison-pill message causing endless retries.' },
            ],
          },
        },
        { id: 'scheduled_task', label: 'Scheduled task',  drillable: false, tooltip: '@Scheduled — runs on a thread from the task scheduler pool. Missed fires on a single-threaded executor queue up silently.' },
        { id: 'grpc_service',   label: 'gRPC service',    drillable: false, tooltip: 'Protobuf over HTTP/2. grpc-java uses Netty with a fixed thread pool. Streaming RPCs hold a thread for the stream duration.' },
        { id: 'cache_entry',    label: '@Cacheable',       drillable: false, tooltip: 'Spring Cache abstraction — Caffeine (in-process) or Redis (distributed). Key is SpEL expression over method args.' },
      ],
    },
  },

  // ── Axis 2 — Execution stack (bottom → top) ────────────────────────────
  axis2: {
    layers: [
      {
        id: 'hardware', name: 'Hardware',
        components: [
          { id: 'cpu',     label: 'CPU',     drillable: true, sub_chips: [
            { id: 'cpu_cores', label: 'CPU cores',          drillable: false },
            { id: 'l3_cache',  label: 'L3 cache',           drillable: false },
            { id: 'runqueue',  label: 'Scheduler runqueue', drillable: false },
          ]},
          { id: 'memory',  label: 'Memory',  drillable: true, tooltip: 'JVM heap + Metaspace + thread stacks + direct buffers all compete for this. Set -Xmx well below total RAM.', sub_chips: [
            { id: 'dram',      label: 'DRAM',           drillable: false },
            { id: 'ram_pages', label: 'RAM pages (4KB)', drillable: false },
            { id: 'tlb',       label: 'TLB',            drillable: false },
          ]},
          { id: 'disk',    label: 'Disk',    drillable: true, sub_chips: [
            { id: 'block_dev', label: 'Block device',          drillable: false },
            { id: 'fs_layer',  label: 'Filesystem (ext4/xfs)', drillable: false },
            { id: 'sectors',   label: 'Disk sectors (512B)',   drillable: false },
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
          { id: 'epoll',          label: 'epoll (NIO)',       drillable: false, tooltip: 'Tomcat NIO connector uses Java NIO Selectors backed by epoll. Allows one thread to accept many connections.' },
          { id: 'virtual_memory', label: 'Virtual memory',   drillable: false, tooltip: 'JVM heap, Metaspace, thread stacks, and memory-mapped files all live in the process virtual address space.' },
          { id: 'page_cache',     label: 'OS page cache',    drillable: false, tooltip: 'JAR files are mmap\'d — class loading reads from page cache. Log file writes also go through here.' },
          { id: 'os_scheduler',   label: 'OS scheduler',     drillable: false, tooltip: 'JVM threads are OS threads (NPTL on Linux). The OS schedules them. GC threads contend with request threads for CPU.' },
          { id: 'socket_layer',   label: 'Socket layer',     drillable: false, tooltip: 'All outbound connections (HTTP client, JDBC, Kafka) go through OS sockets. tcp_keepalive matters for HikariCP.' },
        ],
      },
      {
        id: 'container', name: 'Container',
        topology_condition: ['containerized', 'kubernetes'],
        components: [
          { id: 'docker_ctr',  label: 'Docker container',   drillable: false, tooltip: 'Linux namespaces (pid, net, mnt) + cgroups (CPU shares, memory limit). OOMKiller targets the JVM process first.' },
          { id: 'cgroup_mem',  label: 'cgroup mem limit',   drillable: false, tooltip: 'If JVM heap + Metaspace + stacks exceed cgroup limit, OOMKiller kills the process — not a graceful JVM OOM.' },
          { id: 'cgroup_cpu',  label: 'cgroup CPU quota',   drillable: false, tooltip: 'CPU throttling. JVM sees all host cores via Runtime.availableProcessors() — set ActiveProcessorCount to match quota.' },
        ],
      },
      {
        id: 'container_runtime', name: 'Container runtime',
        topology_condition: ['containerized', 'kubernetes'],
        components: [
          { id: 'containerd',  label: 'containerd / CRI-O',  drillable: false, tooltip: 'OCI-compliant runtime. Pulls images, manages container lifecycle, sets up namespaces and cgroups.' },
          { id: 'overlay_fs',  label: 'OverlayFS',           drillable: false, tooltip: 'Union filesystem for container layers. JAR reads from image layer; writes go to writable container layer.' },
        ],
      },
      {
        id: 'process', name: 'Process',
        components: [
          { id: 'jvm_process', label: 'JVM process (java)', drillable: false, tooltip: 'Single OS process running the HotSpot JVM. All threads, heap, and Metaspace live inside this process boundary.' },
        ],
      },
      {
        id: 'threads', name: 'Threads',
        nested_in: 'process',
        components: [
          { id: 'request_thread',       label: 'request thread × N',     drillable: false, tooltip: 'Tomcat thread pool (default 200). One thread per active HTTP request. Blocked on JDBC = exhausted pool = 503.' },
          { id: 'gc_thread',            label: 'GC threads (G1/ZGC)',     drillable: false, tooltip: 'G1GC: concurrent marking + parallel evacuation threads. ZGC: fully concurrent — pause < 1ms at any heap size.' },
          { id: 'jit_thread',           label: 'JIT compiler thread',     drillable: false, tooltip: 'C1 (client) and C2 (server) compilers run in background threads. Startup cold — peak throughput after warm-up.' },
          { id: 'scheduled_thread',     label: 'scheduled task thread',   drillable: false, tooltip: '@Scheduled default: single-threaded ThreadPoolTaskScheduler. Slow tasks block subsequent scheduled executions.' },
          { id: 'kafka_listener_thread', label: 'kafka listener thread',  drillable: false, tooltip: 'ConcurrentMessageListenerContainer: one thread per assigned partition. Blocked listener = partition lag growth.' },
        ],
      },
      {
        id: 'runtime', name: 'JVM Runtime',
        components: [
          { id: 'eden_space',    label: 'Eden space (young gen)',  drillable: false, tooltip: 'New objects allocate here via TLAB — fast pointer bump. Minor GC evacuates survivors to S0/S1. Short-lived objects die here.' },
          { id: 'survivor_space',label: 'Survivor (S0/S1)',        drillable: false, tooltip: 'Objects surviving minor GC. Tenuring threshold (default 15 GC cycles) before promotion to old gen.' },
          { id: 'old_gen',       label: 'Old gen (tenured)',       drillable: false, tooltip: 'Long-lived objects: Spring beans, caches, connection pools, class statics. Major GC here is expensive.' },
          { id: 'metaspace',     label: 'Metaspace',              drillable: false, tooltip: 'Class metadata, bytecode, constant pools — native memory, not heap. Grows with class loading. Spring AOP proxies add many classes.' },
          { id: 'jit_code_cache',label: 'JIT code cache',         drillable: false, tooltip: 'Compiled native code from C1/C2. Default 240MB. Full cache = deoptimisation, interpreter fallback, severe throughput drop.' },
          { id: 'stack_memory',  label: 'Thread stacks',          drillable: false, tooltip: 'Each thread gets a native stack (-Xss, default 512KB–1MB). 200 threads = 100–200MB native memory — not counted in -Xmx.' },
        ],
      },
      {
        id: 'app_modules', name: 'App modules',
        components: [
          { id: 'spring_context',   label: 'Spring ApplicationContext', drillable: false, tooltip: 'IoC container — holds all singleton beans, manages lifecycle (init/destroy), drives @Autowired injection.' },
          { id: 'dispatcher_servlet',label: 'DispatcherServlet',        drillable: false, tooltip: 'Front controller: matches request → HandlerMapping → HandlerAdapter → MessageConverter → response.' },
          { id: 'hikaricp',         label: 'HikariCP',                  drillable: false, tooltip: 'JDBC connection pool. getConnection() blocks if pool exhausted. maximumPoolSize * (avg query time) = max throughput.' },
          { id: 'transaction_mgr',  label: 'Transaction manager',       drillable: false, tooltip: 'JpaTransactionManager / DataSourceTransactionManager. @Transactional on same-class calls bypasses the proxy — no transaction.' },
          { id: 'security_filter',  label: 'Spring Security',           drillable: false, tooltip: 'FilterChainProxy — 15+ filters by default. SecurityContext stored in ThreadLocal. Propagation across async threads requires explicit config.' },
          { id: 'actuator',         label: 'Actuator',                  drillable: false, tooltip: '/health, /metrics (Micrometer), /env, /threaddump. Exposes JVM internals — critical for prod observability.' },
        ],
      },
    ],
  },

  // ── Cross-links ─────────────────────────────────────────────────────────
  cross_links: {
    // A1 D1 → A2
    'http_endpoint':  ['dispatcher_servlet', 'request_thread', 'spring_context', 'network', 'socket_buffers'],
    'jpa_entity':     ['hikaricp', 'transaction_mgr', 'eden_space', 'old_gen', 'network'],
    'kafka_consumer': ['kafka_listener_thread', 'spring_context', 'network', 'socket_buffers', 'eden_space'],
    'scheduled_task': ['scheduled_thread', 'spring_context', 'cpu', 'cpu_cores'],
    'grpc_service':   ['request_thread', 'network', 'tcp_stack', 'cpu'],
    'cache_entry':    ['eden_space', 'old_gen', 'memory', 'spring_context'],
    // A1 http_endpoint D2 → A2
    'filter_chain':      ['security_filter', 'request_thread', 'stack_memory'],
    'handler_mapping':   ['dispatcher_servlet', 'request_thread', 'jit_code_cache', 'cpu'],
    'controller_method': ['request_thread', 'stack_memory', 'cpu', 'eden_space'],
    'service_call':      ['transaction_mgr', 'request_thread', 'eden_space', 'cpu', 'hikaricp'],
    'response_body':     ['request_thread', 'eden_space', 'socket_buffers', 'nic'],
    // A1 jpa_entity D2 → A2
    'persistence_context': ['transaction_mgr', 'hikaricp', 'eden_space', 'old_gen'],
    'lazy_proxy':          ['metaspace', 'eden_space', 'jit_code_cache'],
    'dirty_checking':      ['transaction_mgr', 'eden_space', 'cpu', 'hikaricp'],
    'generated_sql':       ['hikaricp', 'network', 'tcp_stack'],
    'hikari_conn':         ['hikaricp', 'network', 'tcp_stack', 'socket_buffers'],
    // A1 kafka_consumer D2 → A2
    'consumer_record':     ['kafka_listener_thread', 'eden_space', 'socket_buffers'],
    'listener_container':  ['kafka_listener_thread', 'spring_context', 'cpu'],
    'error_handler':       ['kafka_listener_thread', 'network', 'disk'],
    'offset_commit':       ['kafka_listener_thread', 'network', 'hikaricp'],
    'deserialization':     ['kafka_listener_thread', 'eden_space', 'cpu'],
    // A1 D3 handler_mapping → A2
    'Method':        ['jit_code_cache', 'metaspace', 'cpu', 'cpu_cores'],
    'InstanceKlass': ['metaspace', 'memory', 'l3_cache'],
    'vtable':        ['metaspace', 'cpu', 'l3_cache'],
    'ReflectMethod': ['metaspace', 'eden_space', 'cpu'],
    // A1 D3 controller_method → A2
    'JavaThread':   ['stack_memory', 'cpu', 'cpu_cores', 'os_scheduler'],
    'StackFrame':   ['stack_memory', 'cpu', 'l3_cache'],
    'TLAB':         ['eden_space', 'memory', 'ram_pages'],
    'ObjectHeader': ['eden_space', 'memory', 'ram_pages'],
    // A1 D3 persistence_context → A2
    'EntityEntry':                 ['eden_space', 'old_gen', 'memory'],
    'ActionQueue':                 ['transaction_mgr', 'eden_space', 'hikaricp'],
    'StatefulPersistenceContext':  ['old_gen', 'memory', 'transaction_mgr'],
    'ByteBuddyProxy':              ['metaspace', 'jit_code_cache', 'eden_space'],
    // A2 internal → hardware
    'request_thread':        ['cpu', 'cpu_cores', 'stack_memory', 'socket_buffers'],
    'gc_thread':             ['cpu', 'cpu_cores', 'memory', 'old_gen', 'eden_space'],
    'jit_thread':            ['cpu', 'cpu_cores', 'jit_code_cache', 'metaspace'],
    'scheduled_thread':      ['cpu', 'cpu_cores'],
    'kafka_listener_thread': ['cpu', 'socket_buffers', 'eden_space'],
    'eden_space':            ['memory', 'dram', 'ram_pages'],
    'survivor_space':        ['memory', 'dram', 'ram_pages'],
    'old_gen':               ['memory', 'dram', 'ram_pages'],
    'metaspace':             ['memory', 'dram'],
    'jit_code_cache':        ['memory', 'cpu', 'l3_cache'],
    'stack_memory':          ['memory', 'dram'],
    'hikaricp':              ['network', 'tcp_stack', 'cpu', 'socket_buffers'],
    'dispatcher_servlet':    ['request_thread', 'cpu', 'stack_memory'],
    'spring_context':        ['metaspace', 'old_gen', 'memory'],
    'transaction_mgr':       ['hikaricp', 'cpu', 'network'],
    'security_filter':       ['request_thread', 'stack_memory', 'cpu'],
    'epoll':                 ['cpu', 'socket_buffers'],
    'page_cache':            ['memory', 'disk'],
    'jvm_process':           ['memory', 'cpu', 'request_thread', 'gc_thread'],
    'docker_ctr':            ['memory', 'cpu', 'virtual_memory'],
    'cgroup_mem':            ['memory', 'dram', 'old_gen'],
    'cgroup_cpu':            ['cpu', 'cpu_cores', 'runqueue'],
  },

  topology_mutations: {
    primary_replicas: {
      add_nodes: [{ id: '__replica', label: 'Instance', count_from: 'config.replica_count', axis: 'axis2' }],
      add_edges: [{ source: '__lb', target: '__replica', label: 'round-robin', protocol: 'HTTP' }],
    },
    containerized: {
      add_nodes: [{ id: '__lb', label: 'Load balancer', axis: 'axis2' }],
      add_edges: [{ source: '__lb', target: '__primary', label: 'proxy', protocol: 'HTTP' }],
    },
    kubernetes: {
      add_nodes: [
        { id: '__pod',     label: 'Pod',          count_from: 'config.replica_count', axis: 'axis2' },
        { id: '__hpa',     label: 'HPA',          axis: 'axis2' },
        { id: '__service', label: 'K8s Service',  axis: 'axis2' },
      ],
      add_edges: [
        { source: '__service', target: '__pod',  label: 'iptables / IPVS', protocol: 'TCP' },
        { source: '__hpa',     target: '__pod',  label: 'scale',           protocol: 'async' },
      ],
    },
  },

  tier1_insights: [
    { severity: 'warning', text: 'Thread-per-request (Tomcat default): one blocked JDBC call holds a thread. With a pool of 200 threads and 10 DB connections, 11 concurrent slow queries starve all other requests.' },
    { severity: 'info',    text: 'JVM memory has four distinct regions competing for RAM: heap (-Xmx), Metaspace (class metadata), thread stacks (N × Xss), and JIT code cache. Set container memory limit to account for all four.' },
    { severity: 'warning', text: '@Transactional on a method called from within the same class bypasses the Spring proxy — the transaction never opens. The annotation only works through the proxy (i.e. called from another bean).' },
  ],
}
