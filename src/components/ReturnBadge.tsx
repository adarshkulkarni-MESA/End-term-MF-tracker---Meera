'use client';

interface Props { value: number | null; decimals?: number }

export default function ReturnBadge({ value, decimals = 2 }: Props) {
  if (value === null) return <span className="text-gray-600">—</span>;
  const pos = value >= 0;
  return (
    <span className={pos ? 'text-green-400' : 'text-red-400'}>
      {pos ? '+' : ''}{value.toFixed(decimals)}%
    </span>
  );
}
