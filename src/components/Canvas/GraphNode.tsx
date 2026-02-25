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
          fill="var(--node-io-bg)"
          stroke={selected ? 'var(--accent)' : 'var(--node-stroke)'}
          strokeWidth={selected ? 2 : 1}
        />
        <text
          x={x}
          y={y + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fontWeight={500}
          fill="var(--node-text-io)"
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
          fill="var(--node-residual-bg)"
          stroke={selected ? 'var(--accent)' : 'var(--node-stroke)'}
          strokeWidth={selected ? 2 : 1}
        />
        <text
          x={x}
          y={y + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={10}
          fontWeight={600}
          fill="var(--node-text-residual)"
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
        fill="var(--node-shadow-fill)"
      />
      {/* Background */}
      <rect
        x={left}
        y={top}
        width={width}
        height={height}
        rx={BORDER_RADIUS}
        ry={BORDER_RADIUS}
        fill="var(--node-body-bg)"
        stroke={selected ? 'var(--accent)' : 'var(--node-stroke)'}
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
          fill="var(--node-text-sublabel)"
        >
          {sublabel}
        </text>
      )}
    </g>
  );
}
