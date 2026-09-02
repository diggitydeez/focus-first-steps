import { formatDay, periodEnd, type Engagement } from "@/lib/focus/extract";

const W = 620;
const H = 170;
const PAD_L = 40;
const PAD_R = 16;
const PAD_T = 14;
const PAD_B = 26;

const DAY = 86400000;

export function BurnForecast({ engagement, tracked }: { engagement: Engagement; tracked: number }) {
  const included = Number(engagement.includedHours) || 0;
  const start = new Date(engagement.startDate || new Date().toISOString().slice(0, 10));
  const end = periodEnd(engagement);
  const totalDays = Math.max(7, Math.round((end.getTime() - start.getTime()) / DAY));
  const trackedDays = Math.min(5, totalDays);
  const perDay = tracked / Math.max(trackedDays, 1);
  // Forecast uses a weekly cadence (five tracked days inside a seven-day week).
  const forecastPerDay = tracked / 7;
  const at = (d: number) => (d <= trackedDays ? perDay * d : tracked + forecastPerDay * (d - trackedDays));

  const maxY = Math.max(included || 1, at(totalDays), tracked) * 1.15;
  const x = (d: number) => PAD_L + (d / totalDays) * (W - PAD_L - PAD_R);
  const y = (h: number) => H - PAD_B - (h / maxY) * (H - PAD_T - PAD_B);

  const actual = Array.from({ length: trackedDays + 1 }, (_, i) => `${x(i)},${y(perDay * i)}`).join(" ");
  const forecast = [`${x(trackedDays)},${y(tracked)}`, `${x(totalDays)},${y(at(totalDays))}`].join(" ");

  const crossDay =
    included > 0 && forecastPerDay > 0
      ? included <= tracked
        ? included / Math.max(perDay, 0.01)
        : trackedDays + (included - tracked) / forecastPerDay
      : null;
  const crossInRange = crossDay !== null && crossDay <= totalDays;
  const crossDate = crossDay !== null ? new Date(start.getTime() + crossDay * DAY) : null;
  const daysEarly = crossDate ? Math.round((end.getTime() - crossDate.getTime()) / DAY) : 0;

  return (
    <section className="rounded-[12px] border border-border px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-[16px] font-semibold text-foreground">Cumulative burn forecast</h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            {engagement.clientName} · {formatDay(start)} – {formatDay(end)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-5 rounded-full bg-primary" aria-hidden /> Tracked
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-0.5 w-5 rounded-full"
              style={{ backgroundImage: "repeating-linear-gradient(90deg,currentColor 0 3px,transparent 3px 6px)" }}
              aria-hidden
            />
            Forecast
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-5 rounded-full bg-border" aria-hidden /> Included hours
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full"
        role="img"
        aria-label={`Cumulative hours against ${included} included hours. Tracked ${tracked.toFixed(1)} hours through Friday.`}
      >
        <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} stroke="currentColor" className="text-border" />
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} stroke="currentColor" className="text-border" />

        {included > 0 && (
          <>
            <line
              x1={PAD_L}
              y1={y(included)}
              x2={W - PAD_R}
              y2={y(included)}
              stroke="currentColor"
              className="text-muted-foreground/60"
              strokeWidth={1}
            />
            <text x={4} y={y(included) + 4} className="fill-muted-foreground text-[10px]">
              {included}h
            </text>
          </>
        )}
        <text x={4} y={H - PAD_B + 4} className="fill-muted-foreground text-[10px]">
          0h
        </text>

        <polyline points={actual} fill="none" stroke="currentColor" className="text-primary" strokeWidth={2.2} />
        <polyline
          points={forecast}
          fill="none"
          stroke="currentColor"
          className="text-primary"
          strokeWidth={2.2}
          strokeDasharray="4 4"
        />
        <text
          x={x(totalDays) - 4}
          y={y(at(totalDays)) - 8}
          textAnchor="end"
          className="fill-primary text-[10px] font-medium"
        >
          Forecast
        </text>

        {crossInRange && crossDay !== null && (
          <>
            <circle cx={x(crossDay)} cy={y(included)} r={4.5} className="fill-primary" />
            <line
              x1={x(crossDay)}
              y1={y(included)}
              x2={x(crossDay)}
              y2={H - PAD_B}
              stroke="currentColor"
              className="text-primary/40"
              strokeDasharray="3 3"
            />
          </>
        )}

        <text x={PAD_L} y={H - 8} className="fill-muted-foreground text-[10px]">
          {formatDay(start)}
        </text>
        <text x={W - PAD_R} y={H - 8} textAnchor="end" className="fill-muted-foreground text-[10px]">
          {formatDay(end)}
        </text>
      </svg>

      <p className="mt-2 text-[13.5px] text-foreground">
        {crossInRange && crossDate
          ? `Forecast to reach ${included}h on ${formatDay(crossDate)}${
              daysEarly > 0 ? ` — ${daysEarly} day${daysEarly === 1 ? "" : "s"} early` : " — right at the period end"
            }`
          : included > 0
            ? `Forecast to stay under ${included}h through ${formatDay(end)}`
            : "Add included hours to see a boundary for this engagement."}
      </p>
      <p className="mt-1 text-[12px] text-muted-foreground">
        Dotted line is a forecast from week-one pace, not a commitment or an invoice.
      </p>
    </section>
  );
}
