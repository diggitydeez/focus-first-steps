import { CURRENCY_SYMBOL, formatDay, periodEnd, type Engagement } from "@/lib/focus/extract";

const W = 620;
const H = 200;
const PAD_L = 46;
const PAD_R = 22;
const PAD_T = 16;
const PAD_B = 28;

const DAY = 86400000;

export function BurnForecast({ engagement, tracked }: { engagement: Engagement; tracked: number }) {
  const included = Number(engagement.includedHours) || 0;
  const fee = Number(engagement.amount) || 0;
  const symbol = CURRENCY_SYMBOL[engagement.currency] ?? "";
  const start = new Date(engagement.startDate || new Date().toISOString().slice(0, 10));
  const end = periodEnd(engagement);
  const totalDays = Math.max(7, Math.round((end.getTime() - start.getTime()) / DAY));
  const trackedDays = Math.min(5, totalDays);
  const perDay = tracked / Math.max(trackedDays, 1);
  // Forecast uses a weekly cadence (five tracked days inside a seven-day week).
  const forecastPerDay = tracked / 7;
  const at = (d: number) => (d <= trackedDays ? perDay * d : tracked + forecastPerDay * (d - trackedDays));

  const forecastEndHours = at(totalDays);
  const maximumY = Math.max(10, Math.ceil(Math.max(included, forecastEndHours) / 10) * 10 + 10);
  const ticks = Array.from({ length: maximumY / 10 + 1 }, (_, i) => i * 10);

  const x = (d: number) => PAD_L + (d / totalDays) * (W - PAD_L - PAD_R);
  const y = (h: number) => H - PAD_B - (h / maximumY) * (H - PAD_T - PAD_B);

  const actual = Array.from({ length: trackedDays + 1 }, (_, i) => `${x(i)},${y(perDay * i)}`).join(" ");
  const forecast = [`${x(trackedDays)},${y(tracked)}`, `${x(totalDays)},${y(forecastEndHours)}`].join(" ");

  const crossDay =
    included > 0 && forecastPerDay > 0
      ? included <= tracked
        ? included / Math.max(perDay, 0.01)
        : trackedDays + (included - tracked) / forecastPerDay
      : null;
  const crossInRange = crossDay !== null && crossDay <= totalDays;
  const crossDate = crossDay !== null ? new Date(start.getTime() + crossDay * DAY) : null;
  const daysEarly = crossDate ? Math.round((end.getTime() - crossDate.getTime()) / DAY) : 0;

  const rate = included > 0 && fee > 0 ? fee / included : 0;
  const differenceHours = forecastEndHours - included;
  const effortValue = Math.abs(differenceHours) * rate;
  const periodWord = engagement.period === "month" ? "monthly" : "weekly";
  const money = (n: number) => `${symbol}${Math.round(n).toLocaleString("en-GB")}`;
  const showSummary =
    included > 0 && rate > 0 && (engagement.billingModel === "retainer" || engagement.billingModel === "fixed");

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
        aria-label={`Cumulative hours against ${included} included hours. Tracked ${tracked.toFixed(
          1,
        )} hours through Friday, forecast ${forecastEndHours.toFixed(1)} hours by period end.`}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={PAD_L}
              y1={y(t)}
              x2={W - PAD_R}
              y2={y(t)}
              stroke="currentColor"
              className="text-border/50"
              strokeWidth={t === 0 ? 1 : 0.6}
            />
            <text x={PAD_L - 6} y={y(t) + 3.5} textAnchor="end" className="fill-muted-foreground text-[9.5px]">
              {t}h
            </text>
          </g>
        ))}
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} stroke="currentColor" className="text-border" />

        {included > 0 && (
          <>
            <line
              x1={PAD_L}
              y1={y(included)}
              x2={W - PAD_R}
              y2={y(included)}
              stroke="currentColor"
              className="text-muted-foreground/70"
              strokeWidth={1.2}
            />
            <text x={W - PAD_R} y={y(included) - 5} textAnchor="end" className="fill-muted-foreground text-[10px]">
              {included}h included
            </text>
          </>
        )}

        <polyline points={actual} fill="none" stroke="currentColor" className="text-primary" strokeWidth={2.2} />
        <polyline
          points={forecast}
          fill="none"
          stroke="currentColor"
          className="text-primary"
          strokeWidth={2.2}
          strokeDasharray="4 4"
        />
        <circle cx={x(totalDays)} cy={y(forecastEndHours)} r={4} className="fill-primary" />
        <text
          x={x(totalDays) - 6}
          y={y(forecastEndHours) - 8}
          textAnchor="end"
          className="fill-primary text-[10px] font-medium"
        >
          Forecast {forecastEndHours.toFixed(1)}h
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

      {showSummary && (
        <div className="mt-3 rounded-[10px] border border-border px-3.5 py-3">
          <p className="text-[13.5px] font-medium text-foreground">
            Forecast: {forecastEndHours.toFixed(1)}h against {included}h included
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {differenceHours >= 0
              ? `${differenceHours.toFixed(1)}h above the ${periodWord} allowance. At the ${
                  engagement.billingModel === "fixed" ? "fee" : "retainer"
                }’s effective rate of ${money(rate)}/h, this represents approximately ${money(
                  effortValue,
                )} of additional effort to review.`
              : `${Math.abs(differenceHours).toFixed(1)}h below the ${periodWord} allowance, leaving approximately ${money(
                  effortValue,
                )} of contracted capacity.`}
          </p>
          <p className="mt-1.5 text-[12px] text-muted-foreground">
            Directional estimate based on tracked time—not an invoice or confirmation of billable overage.
          </p>
        </div>
      )}

      <p className="mt-2 text-[12px] text-muted-foreground">
        Dotted line is a forecast from week-one pace, not a commitment or an invoice.
      </p>
    </section>
  );
}
