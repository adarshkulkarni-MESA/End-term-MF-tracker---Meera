'use client';

interface Props { verdict: string }

export default function VerdictBadge({ verdict }: Props) {
  let cls = 'badge-green';
  if (verdict === 'One fund worth watching')        cls = 'badge-amber';
  if (verdict === 'Consider reviewing your allocation') cls = 'badge-red';
  return (
    <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${cls}`}>
      {verdict}
    </span>
  );
}
