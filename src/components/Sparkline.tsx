'use client';

interface Props { values: (number | null)[]; width?: number; height?: number }

export default function Sparkline({ values, width = 80, height = 30 }: Props) {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length < 2) return <span className="text-gray-700 text-xs">no data</span>;

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min || 1;

  const pts = valid.map((v, i) => {
    const x = (i / (valid.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const isPositive = valid[valid.length - 1] >= valid[0];
  const color = isPositive ? '#22c55e' : '#ef4444';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
