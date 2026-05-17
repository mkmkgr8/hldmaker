import { memo } from 'react'
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from 'reactflow'

interface EdgeData {
  protocol?: string
  label?: string
  sync?: boolean
  flagged?: boolean
}

function EdgeLabel({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data, markerEnd,
}: EdgeProps<EdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition })
  const label = data?.label || data?.protocol || ''
  const isAsync = data?.sync === false || data?.protocol === 'async'
  const isFlagged = data?.flagged

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isFlagged ? 'var(--danger)' : 'var(--ink-500)',
          strokeWidth: isFlagged ? 2 : 1.5,
          strokeDasharray: isAsync ? '5,4' : undefined,
          opacity: isFlagged ? 1 : 0.7,
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
            }}
          >
            <span style={{
              display: 'inline-block',
              fontFamily: 'var(--font-mono)', fontSize: 9.5,
              color: 'var(--ink-300)',
              background: 'var(--ink-900)',
              border: '1px solid var(--ink-700)',
              borderRadius: 3, padding: '1px 5px',
              whiteSpace: 'nowrap',
            }}>
              {label}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

export default memo(EdgeLabel)
