import { type GraphNode as GraphNodeType } from '../../core/types';
import { nodeColors } from '../../styles/theme';

interface GraphNodeProps {
  node: GraphNodeType;
  selected: boolean;
  onSelect: (id: string) => void;
}

const HEADER_HEIGHT = 22;
const BORDER_RADIUS = 6;

export function GraphNodeComponent({ node, selected, onSelect }: GraphNodeProps) {
  const { x, y, width, height, type, label, sublabel } = node;
  const left = x - width / 2;
  const top = y - height / 2;
  const color = nodeColors[type] || '#999';

  if (type === 'input' || type === 'output') {
    // Simple pill-shaped node
    return (
      <g
        onClick={e => { e.stopPropagation(); onSelect(node.id); }}
        style={{ cursor: 'pointer' }}
      >
        <rect
          x={left}
          y={top}
          width={width}
          height={height}
          rx={height / 2}
          ry={height / 2}
          fill="#f5f5f5"
          stroke={selected ? '#4a90d9' : '#ccc'}
          strokeWidth={selected ? 2 : 1}
        />
        <text
          x={x}
          y={y + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fontWeight={500}
          fill="#666"
        >
          {label}
        </text>
      </g>
    );
  }

  if (type === 'residual') {
    // Small circle node
    const r = 16;
    return (
      <g
        onClick={e => { e.stopPropagation(); onSelect(node.id); }}
        style={{ cursor: 'pointer' }}
      >
        <circle
          cx={x}
          cy={y}
          r={r}
          fill="#f9f9f9"
          stroke={selected ? '#4a90d9' : '#ccc'}
          strokeWidth={selected ? 2 : 1}
        />
        <text
          x={x}
          y={y + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={10}
          fontWeight={600}
          fill="#888"
        >
          +
        </text>
      </g>
    );
  }

  // Standard rounded rectangle with colored header
  return (
    <g
      onClick={e => { e.stopPropagation(); onSelect(node.id); }}
      style={{ cursor: 'pointer' }}
    >
      {/* Shadow */}
      <rect
        x={left + 1}
        y={top + 2}
        width={width}
        height={height}
        rx={BORDER_RADIUS}
        ry={BORDER_RADIUS}
        fill="rgba(0,0,0,0.04)"
      />
      {/* Background */}
      <rect
        x={left}
        y={top}
        width={width}
        height={height}
        rx={BORDER_RADIUS}
        ry={BORDER_RADIUS}
        fill="white"
        stroke={selected ? '#4a90d9' : '#d0d0d0'}
        strokeWidth={selected ? 2 : 1}
      />
      {/* Colored header bar */}
      <clipPath id={`clip-${node.id}`}>
        <rect x={left} y={top} width={width} height={HEADER_HEIGHT} rx={BORDER_RADIUS} ry={BORDER_RADIUS} />
        <rect x={left} y={top + BORDER_RADIUS} width={width} height={HEADER_HEIGHT - BORDER_RADIUS} />
      </clipPath>
      <rect
        x={left}
        y={top}
        width={width}
        height={HEADER_HEIGHT}
        clipPath={`url(#clip-${node.id})`}
        fill={color}
        opacity={0.85}
      />
      {/* Header separator */}
      <line
        x1={left}
        y1={top + HEADER_HEIGHT}
        x2={left + width}
        y2={top + HEADER_HEIGHT}
        stroke={color}
        strokeWidth={0.5}
        opacity={0.4}
      />
      {/* Label */}
      <text
        x={x}
        y={top + HEADER_HEIGHT / 2 + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={600}
        fill="white"
      >
        {label}
      </text>
      {/* Sublabel */}
      {sublabel && (
        <text
          x={x}
          y={top + HEADER_HEIGHT + (height - HEADER_HEIGHT) / 2 + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={10}
          fill="#888"
        >
          {sublabel}
        </text>
      )}
    </g>
  );
}
