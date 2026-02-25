import { type GraphGroup as GraphGroupType } from '../../core/types';

interface GraphGroupProps {
  group: GraphGroupType;
}

export function GraphGroupComponent({ group }: GraphGroupProps) {
  const { x, y, width, height, label, repeatCount } = group;
  const left = x - width / 2;
  const top = y;

  return (
    <g>
      {/* Dashed border rectangle */}
      <rect
        x={left}
        y={top}
        width={width}
        height={height}
        rx={8}
        ry={8}
        fill="none"
        stroke="#bbb"
        strokeWidth={1.5}
        strokeDasharray="6 4"
      />
      {/* Label with repeat count */}
      <rect
        x={left + 10}
        y={top - 10}
        width={labelWidth(label, repeatCount)}
        height={20}
        rx={3}
        fill="white"
      />
      <text
        x={left + 14}
        y={top + 1}
        fontSize={11}
        fill="#888"
        fontWeight={500}
        dominantBaseline="central"
      >
        {label}
        {repeatCount > 1 && (
          <tspan fill="#4a90d9" fontWeight={600}> ×{repeatCount}</tspan>
        )}
      </text>
    </g>
  );
}

function labelWidth(label: string, count: number): number {
  const base = label.length * 6.5 + 16;
  if (count > 1) return base + String(count).length * 7 + 18;
  return base;
}
