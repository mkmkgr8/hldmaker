import { useCallback, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Connection,
  type Node,
  type NodeChange,
  type EdgeChange,
  type OnConnect,
  type ReactFlowInstance,
  BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { nanoid } from 'nanoid'
import { useDesignStore } from '../../store/useDesignStore'
import { useUIStore } from '../../store/useUIStore'
import { templates } from '../../data/templates'
import type { DesignNode, DesignEdge, ComponentType } from '../../types/schema'
import ComponentNode from './ComponentNode'
import EdgeLabel from './EdgeLabel'

const nodeTypes = { component: ComponentNode }
const edgeTypes = { labeled: EdgeLabel }

export default function HLDCanvas() {
  const designNodes = useDesignStore(s => s.design.canvas.nodes)
  const designEdges = useDesignStore(s => s.design.canvas.edges)
  const { addNode, addEdge: storeAddEdge, updateNodePosition } = useDesignStore()
  const { selectedNodeId, setSelectedNode, theme } = useUIStore()
  const dotColor = theme === 'dark' ? '#1b2030' : '#c4cad6'
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null)
  const [dragPositions, setDragPositions] = useState<Record<string, { x: number; y: number }>>({})

  const rfNodes = designNodes.map(dn => ({
    id: dn.id,
    type: 'component' as const,
    position: dragPositions[dn.id] ?? dn.position,
    data: { designNode: dn },
    selected: dn.id === selectedNodeId,
  }))

  const rfEdges = designEdges.map(de => ({
    id: de.id,
    source: de.source,
    target: de.target,
    type: 'labeled' as const,
    data: { label: de.label, protocol: de.config.protocol, sync: de.config.sync },
  }))

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    changes.forEach(c => {
      if (c.type === 'position' && c.position) {
        if (c.dragging) {
          setDragPositions(prev => ({ ...prev, [c.id]: c.position! }))
        } else {
          updateNodePosition(c.id, c.position)
          setDragPositions(prev => {
            const next = { ...prev }
            delete next[c.id]
            return next
          })
        }
      }
    })
  }, [updateNodePosition])

  const onEdgesChange = useCallback((_changes: EdgeChange[]) => {
    // Edge removals handled via keyboard shortcut in App
  }, [])

  const onConnect: OnConnect = useCallback((connection: Connection) => {
    const newEdge: DesignEdge = {
      id: `edge_${nanoid(6)}`,
      source: connection.source!,
      target: connection.target!,
      label: '',
      config: { protocol: 'TCP', sync: true, data_format: 'json', estimated_rps: null },
      internal: false,
      auto_generated: false,
      notes: '',
    }
    storeAddEdge(newEdge)
  }, [storeAddEdge])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const type = event.dataTransfer.getData('application/hldmaker') as ComponentType
    if (!type || !rfInstance || !reactFlowWrapper.current) return

    const bounds = reactFlowWrapper.current.getBoundingClientRect()
    const position = rfInstance.project({
      x: event.clientX - bounds.left - 60,
      y: event.clientY - bounds.top - 30,
    })

    const template = templates[type]
    if (!template) return

    const newNode: DesignNode = {
      id: `node_${type}_${nanoid(6)}`,
      type,
      label: template.display_name,
      position,
      topology: 'standalone',
      config: { ...template.default_config },
      internal_state: {
        axis1_expanded_d1_node: null,
        axis1_expanded_d2_node: null,
        annotations: {},
      },
      notes: '',
    }

    addNode(newNode)
  }, [rfInstance, addNode])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id)
  }, [setSelectedNode])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [setSelectedNode])

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setRfInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        className="bg-slate-50"
        deleteKeyCode={null}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color={dotColor} />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            const dn = designNodes.find(d => d.id === n.id)
            const colorMap: Record<string, string> = { postgres: '#93c5fd', redis: '#fca5a5', kafka: '#fdba74', mysql: '#fcd34d' }
            return colorMap[dn?.type ?? ''] ?? '#e2e8f0'
          }}
          className="!bg-white !border !border-slate-200 !rounded-lg"
        />
      </ReactFlow>
      {designNodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-slate-400">
            <p className="text-lg font-medium">Drag components here</p>
            <p className="text-sm mt-1">Start by dropping a component from the left palette</p>
          </div>
        </div>
      )}
    </div>
  )
}
