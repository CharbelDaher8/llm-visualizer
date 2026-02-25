import { type GraphEdge as GraphEdgeType, type GraphNode } from '../../core/types';

interface GraphEdgeProps {
  edge: GraphEdgeType;
  fromNode: GraphNode;
  toNode: GraphNode;
}

const ARROW_SIZE = 5;

export function GraphEdgeComponent({ edge, fromNode, toNode }: GraphEdgeProps) {
  // Compute connection points
  const fromBottom = getBottomPort(fromNode);
  const toTop = getTopPort(toNode);

  // Simple straight or slightly curved line
  const dx = toTop.x - fromBottom.x;
  const dy = toTop.y - fromBottom.y;
  const needsCurve = Math.abs(dx) > 5;

  let path: string;
  if (needsCurve) {
    const midY = fromBottom.y + dy * 0.5;
    path = `M ${fromBottom.x} ${fromBottom.y} C ${fromBottom.x} ${midY}, ${toTop.x} ${midY}, ${toTop.x} ${toTop.y}`;
  } else {
    path = `M ${fromBottom.x} ${fromBottom.y} L ${toTop.x} ${toTop.y}`;
  }

  // Arrowhead angle
  const angle = Math.atan2(toTop.y - fromBottom.y, toTop.x - fromBottom.x);

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke="var(--edge-stroke)"
        strokeWidth={1.2}
        strokeDasharray={edge.dashed ? '4 3' : undefined}
      />
      {!edge.dashed && (
        <polygon
          points={arrowheadPoints(toTop.x, toTop.y, angle)}
          fill="var(--edge-stroke)"
        />
      )}
      {edge.label && (
        <text
          x={(fromBottom.x + toTop.x) / 2 + (dx > 0 ? 8 : -8)}
          y={(fromBottom.y + toTop.y) / 2}
          fontSize={9}
          fill="var(--edge-label-color)"
          textAnchor="middle"
          dominantBaseline="central"
          fontStyle="italic"
        >
          {edge.label}
        </text>
      )}
    </g>
  );
}

function getBottomPort(node: GraphNode): { x: number; y: number } {
  if (node.type === 'residual') {
    return { x: node.x, y: node.y + 16 };
  }
  return { x: node.x, y: node.y + node.height / 2 };
}

function getTopPort(node: GraphNode): { x: number; y: number } {
  if (node.type === 'residual') {
    return { x: node.x, y: node.y - 16 };
  }
  return { x: node.x, y: node.y - node.height / 2 };
}

function arrowheadPoints(tipX: number, tipY: number, angle: number): string {
  const p1x = tipX - ARROW_SIZE * Math.cos(angle - Math.PI / 7);
  const p1y = tipY - ARROW_SIZE * Math.sin(angle - Math.PI / 7);
  const p2x = tipX - ARROW_SIZE * Math.cos(angle + Math.PI / 7);
  const p2y = tipY - ARROW_SIZE * Math.sin(angle + Math.PI / 7);
  return `${tipX},${tipY} ${p1x},${p1y} ${p2x},${p2y}`;
}
