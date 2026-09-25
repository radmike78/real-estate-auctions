import { useState } from 'react';
import { fmtDate } from '../lib/status';

// Single-series daily column chart (one per metric, shown as small multiples, never a dual axis).
// Marks: columns capped at 24px, 4px rounded top and square base, 2px surface gap, recessive
// baseline. Hover or focus any day's full-height band to see its value in the readout row; the
// table view on the dashboard carries the same numbers.

export default function DailyColumns({ title, data }: { title: string; data: { day: string; value: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 560;
  const H = 120;
  const padTop = 18;
  const max = Math.max(1, ...data.map((d) => d.value));
  const band = W / Math.max(1, data.length);
  const bar = Math.max(2, Math.min(24, band - 2));
  const total = data.reduce((t, d) => t + d.value, 0);
  const h = hover === null ? null : data[hover];

  return (
    <figure className="viz">
      <figcaption>
        <span className="viz-title">{title}</span>
        <span className="viz-total">{total.toLocaleString()} total</span>
      </figcaption>
      <div className="viz-plot">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={`${title}: ${total} total over ${data.length} days`}>
          {data.map((d, i) => {
            const bh = d.value === 0 ? 0 : Math.max(3, ((H - padTop) * d.value) / max);
            const x = i * band + (band - bar) / 2;
            const y = H - bh;
            const r = Math.min(4, bar / 2, bh);
            return (
              <g key={d.day} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} tabIndex={0} aria-label={`${fmtDate(d.day)}: ${d.value}`}>
                <rect x={i * band} y={0} width={band} height={H} fill="transparent" />
                {bh > 0 && (
                  <path
                    className={`viz-bar${hover === i ? ' on' : ''}`}
                    d={`M${x},${H} V${y + r} Q${x},${y} ${x + r},${y} H${x + bar - r} Q${x + bar},${y} ${x + bar},${y + r} V${H} Z`}
                  />
                )}
              </g>
            );
          })}
          <line x1={0} x2={W} y1={H - 0.5} y2={H - 0.5} className="viz-axis" />
        </svg>
      </div>
      {/* The hovered day's value replaces the date range row, so the readout never covers a mark or a neighboring chart. */}
      <div className="viz-x small" aria-live="polite">
        {h ? (
          <span className="viz-readout"><strong>{h.value.toLocaleString()}</strong> on {fmtDate(h.day)}</span>
        ) : (
          <>
            <span className="muted">{data[0] && fmtDate(data[0].day)}</span>
            <span className="muted">{data.length > 0 && fmtDate(data[data.length - 1].day)}</span>
          </>
        )}
      </div>
    </figure>
  );
}
