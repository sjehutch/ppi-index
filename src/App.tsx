import type { CSSProperties, ReactNode } from "react";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  NameType,
  Payload,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import type { TooltipContentProps } from "recharts";

import { END_YEAR, START_YEAR, ppiData, ppiEvents } from "./ppiData";

type TooltipPayload = Payload<ValueType, NameType> & {
  payload?: {
    confidence?: "low" | "medium" | "high";
    aiModifier?: number;
  };
};

function PpiTooltip({
  active,
  label,
  payload,
}: TooltipContentProps<ValueType, NameType>): ReactNode {
  if (!active || !payload?.length) {
    return null;
  }
  const primary = payload[0] as TooltipPayload;
  const confidence = primary.payload?.confidence ?? "unknown";
  const aiModifier = primary.payload?.aiModifier ?? 0;
  const year = typeof label === "number" ? label : Number(label);
  const decadeStart = Number.isFinite(year) ? Math.floor(year / 10) * 10 : null;
  const eventsForYear =
    decadeStart !== null
      ? ppiEvents.filter(
          (event) => event.year >= decadeStart && event.year < decadeStart + 10
        )
      : [];

  return (
    <div style={styles.tooltip}>
      <div style={styles.tooltipTitle}>Year {label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey?.toString()} style={styles.tooltipRow}>
          <span>{entry.name}</span>
          <span>{Math.round(Number(entry.value))}</span>
        </div>
      ))}
      <div style={styles.tooltipMeta}>
        Confidence: {confidence} | AI modifier: {aiModifier >= 0 ? "+" : ""}
        {aiModifier}
      </div>
      {eventsForYear.length > 0 && (
        <div style={styles.tooltipSection}>
          <div style={styles.tooltipLabel}>
            Events ({decadeStart}s)
          </div>
          {eventsForYear.map((event) => (
            <div key={`${event.year}-${event.label}`} style={styles.tooltipEvent}>
              <div style={styles.tooltipEventTitle}>
                {event.year} · {event.label} · {event.category}
              </div>
              <div style={styles.tooltipEventDesc}>{event.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <h1 style={styles.h1}>Political Pressure Index (PPI)</h1>
          <p style={styles.sub}>
            Demo timeline from 1850 to today. Values are illustrative and not
            historical data.
          </p>
        </header>

        <section style={styles.card}>
          <div
            style={styles.chartWrap}
            role="img"
            aria-label="Line chart showing PPI scores and a PPI plus AI modifier line from 1850 to present."
          >
            <ResponsiveContainer>
              <LineChart data={ppiData} margin={styles.chartMargin}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.12} />
                <XAxis
                  dataKey="year"
                  type="number"
                  domain={[START_YEAR, END_YEAR]}
                  tickCount={9}
                  stroke="rgba(255,255,255,0.7)"
                />
                <YAxis
                  domain={[0, 100]}
                  tickCount={6}
                  stroke="rgba(255,255,255,0.7)"
                />
                <Tooltip content={PpiTooltip} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ppi"
                  name="PPI score"
                  stroke="#f8fafc"
                  strokeWidth={3}
                  dot={{ r: 2.5 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="aiAdjusted"
                  name="PPI with AI modifier"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="6 6"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={styles.note}>
            The AI Wildcard is a small adjustment that stays near zero before
            2010 and gradually varies after, reflecting potential AI-driven
            shifts in pressure.
          </div>
        </section>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 45%), #0b0c0f",
    color: "rgba(255,255,255,0.92)",
    display: "flex",
    justifyContent: "center",
    padding: "clamp(16px, 3vw, 32px)",
    boxSizing: "border-box",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
  },
  shell: {
    width: "100%",
    maxWidth: 980,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  h1: {
    margin: 0,
    fontSize: 22,
    letterSpacing: 0.2,
  },
  sub: {
    margin: 0,
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    maxWidth: 560,
  },
  card: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.05)",
    padding: 16,
    boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
  },
  chartWrap: {
    width: "100%",
    height: 420,
  },
  chartMargin: { top: 12, right: 16, left: 8, bottom: 8 },
  note: {
    marginTop: 12,
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    lineHeight: 1.5,
    maxWidth: 680,
  },
  tooltip: {
    background: "rgba(20,20,24,0.95)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    color: "rgba(255,255,255,0.9)",
    padding: "10px 12px",
    fontSize: 12,
    minWidth: 160,
  },
  tooltipTitle: {
    fontWeight: 700,
    marginBottom: 6,
  },
  tooltipRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
  },
  tooltipMeta: {
    marginTop: 6,
    paddingTop: 6,
    borderTop: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.65)",
  },
  tooltipSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  tooltipLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 6,
  },
  tooltipEvent: {
    marginBottom: 6,
  },
  tooltipEventTitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
  },
  tooltipEventDesc: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
  },
};
