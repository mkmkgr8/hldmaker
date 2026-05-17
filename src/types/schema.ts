export type ComponentType = 'postgres' | 'redis' | 'kafka' | 'mysql'
// Adding a new service: add its name here, create src/data/templates/<name>.ts, export from index.ts

export type Topology =
  | 'standalone'
  | 'primary_replicas'
  | 'ha'
  | 'cluster'
  | 'containerized'
  | 'kubernetes'

export type Severity = 'info' | 'warning' | 'error'
export type Protocol = 'TCP' | 'HTTP' | 'gRPC' | 'async' | 'websocket'

// ── Canvas / design types (unchanged) ─────────────────────────────────────

export interface NodeConfig {
  [key: string]: string | number | boolean | string[]
}

export interface InternalState {
  axis1_expanded_d1_node: string | null
  axis1_expanded_d2_node: string | null
  annotations: Record<string, string>
}

export interface DesignNode {
  id: string
  type: ComponentType
  label: string
  position: { x: number; y: number }
  topology: Topology
  config: NodeConfig
  internal_state: InternalState
  notes: string
}

export interface DesignEdge {
  id: string
  source: string
  target: string
  label: string
  config: {
    protocol: Protocol
    sync: boolean
    data_format: string
    estimated_rps: number | null
    has_pooler?: boolean
  }
  internal: boolean
  auto_generated: boolean
  notes: string
}

export interface EvalResult {
  severity: Severity
  scope: string
  text: string
  tier: 1 | 2 | 3
}

export interface Design {
  schema_version: string
  id: string
  meta: {
    name: string
    description: string
    author: string
    created_at: string
    updated_at: string
    tags: string[]
  }
  canvas: {
    viewport: { x: number; y: number; zoom: number }
    nodes: DesignNode[]
    edges: DesignEdge[]
  }
  evaluation: {
    last_run_at: string | null
    results: EvalResult[]
  }
}

// ── Template chip — appears in both axes ──────────────────────────────────

export interface TemplateChipNode {
  id: string
  label: string
  drillable: boolean
  tooltip?: string
  sub_chips?: TemplateChipNode[]   // A2 hardware: inline sub-chip expansion
  d2?: Axis1Depth                  // A1 D1 node: its own D2 content (context-sensitive)
  d3?: Axis1Depth                  // A1 D2 node: its own D3 content (DAG — same id can appear under multiple parents)
}

// ── Axis 1 — Service internals ─────────────────────────────────────────────
// D1: API surface (tables, topics, keys)
// D2: Internal implementation — per D1 node (node.d2)
// D3: Language-level constructs — per D2 node (node.d3), forming a DAG not a tree

export interface Axis1Depth {
  label: string
  nodes: TemplateChipNode[]
}

export interface Axis1 {
  d1: Axis1Depth
  // D2 and D3 are now defined inline on each drillable TemplateChipNode
}

// ── Axis 2 — Execution stack ───────────────────────────────────────────────
// layers[] ordered bottom → top: index 0 = hardware (floor), last = app_modules (ceiling)
// Rendered top → bottom on screen (reversed).

export interface Axis2Layer {
  id: string                       // 'hardware' | 'os' | 'process' | 'runtime' |
                                   // 'threads' | 'app_modules' | 'container' | 'container_runtime'
  name: string                     // display label
  topology_condition?: Topology[]  // absent = always shown; present = only when topology matches
  nested_in?: string               // render as sub-section inside another layer (e.g. 'threads' inside 'process')
  components: TemplateChipNode[]
}

export interface Axis2 {
  layers: Axis2Layer[]
}

// ── Cross-links ─────────────────────────────────────────────────────────────
// Lives inside the template — one map per service.
// Key   = chip id clicked (from A1 or A2)
// Value = chip ids to highlight (can be in any layer)
//
// A1 → A2 forward links: defined explicitly.
// A2 → A1 reverse links: derived at runtime by scanning A1 chip keys.
// A2 → A2 internal links: defined explicitly (e.g. jvm_heap → memory).
export type CrossLinkMap = Record<string, string[]>

// ── Config schema ─────────────────────────────────────────────────────────

export interface ConfigFieldSchema {
  type: 'number' | 'string' | 'boolean' | 'select' | 'multiselect'
  label: string
  min?: number
  max?: number
  options?: string[]
  unit?: string
}

// ── Insights ─────────────────────────────────────────────────────────────

export interface Tier1Insight {
  severity: Severity
  text: string
}

// ── Topology mutations ────────────────────────────────────────────────────

export interface TopologyMutation {
  // Canvas-level: add nodes / edges to the ReactFlow graph
  add_nodes?: Array<{
    id: string
    label: string
    count_from?: string            // e.g. 'config.replica_count'
    axis: 'axis1' | 'axis2'
    depth?: number                 // kept for canvas rendering compat
  }>
  add_edges?: Array<{
    source: string
    target: string
    label: string
    protocol: Protocol | string
  }>
  // Axis 2 structural: inject layers or chips (e.g. Container when topology = containerized)
  add_layers?: Axis2Layer[]
  add_to_layer?: Array<{ layer_id: string; components: TemplateChipNode[] }>
}

// ── Component template — one file per service ─────────────────────────────

export interface ComponentTemplate {
  type: ComponentType
  display_name: string
  flavor: string
  color: string
  icon: string
  topologies: Topology[]
  default_config: NodeConfig
  config_schema: Record<string, ConfigFieldSchema>
  axis1: Axis1
  axis2: Axis2
  cross_links: CrossLinkMap
  topology_mutations: Partial<Record<Topology, TopologyMutation>>
  tier1_insights: Tier1Insight[]
}

// ── Tier 2 rule engine ────────────────────────────────────────────────────

export interface Tier2Rule {
  id: string
  severity: Severity
  condition: RuleCondition
  message: string
  calc?: Record<string, string>
}

export type RuleCondition =
  | { all: RuleCondition[] }
  | { any: RuleCondition[] }
  | { field: string; op: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'includes' | 'not_includes'; value: unknown }
