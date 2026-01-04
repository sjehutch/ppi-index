// src/App.tsx
import type { ReactNode } from "react";

import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import type { ScatterCustomizedShape } from "recharts/types/cartesian/Scatter";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  Scatter,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";

/**
 * Like you're 10:
 * - This is a "Political Pressure Index" chart from 1900 to now.
 * - The colored horizontal bands are "zones" (stable → reform → protest → pre-revolution).
 * - The solid line is the main PPI score.
 * - Starting around 2022, we show 2 dashed lines = an "AI cone":
 *    - One line is "AI reduces pressure"
 *    - One line is "AI increases pressure"
 *
 * IMPORTANT:
 * - These numbers are example/demo numbers so you can see the framework visually.
 * - Later, you can replace them with real data from your scoring model.
 */
type PpiPoint = {
  year: number;

  // Base pressure score (0–100)
  ppi: number;

  // AI wildcard "cone" (only meaningful from ~2022 forward)
  aiLow?: number; // AI reduces pressure path
  aiHigh?: number; // AI increases pressure path
};

const COLORS = {
  stable: "rgba(34, 211, 238, 0.2)",
  reform: "rgba(129, 140, 248, 0.22)",
  protest: "rgba(251, 191, 36, 0.26)",
  risk: "rgba(248, 113, 113, 0.28)",
  threshold: "rgba(255, 255, 255, 0.35)",
  baseLine: "#f8fafc",
  aiLow: "#22d3ee",
  aiHigh: "#f59e0b",
  grid: "rgba(255, 255, 255, 0.22)",
  eventGlow: "rgba(255, 255, 255, 0.35)",
  eventDot: "#ffffff",
  eventStroke: "#0b0b10",
};

type PpiAnchor = {
  year: number;
  ppi: number;
  aiLow?: number;
  aiHigh?: number;
};

// Demo anchor points: sparse but “feels” historically plausible.
// We expand these to yearly points for a smoother line.
const ANCHORS: PpiAnchor[] = [
  { year: 1900, ppi: 32 },
  { year: 1910, ppi: 36 },
  { year: 1914, ppi: 48 },
  { year: 1918, ppi: 60 },
  { year: 1920, ppi: 50 },
  { year: 1929, ppi: 70 },
  { year: 1933, ppi: 78 },
  { year: 1939, ppi: 65 },
  { year: 1945, ppi: 52 },
  { year: 1950, ppi: 38 },
  { year: 1960, ppi: 35 },
  { year: 1970, ppi: 42 },
  { year: 1973, ppi: 52 },
  { year: 1975, ppi: 55 },
  { year: 1980, ppi: 58 },
  { year: 1990, ppi: 45 },
  { year: 2000, ppi: 43 },
  { year: 2001, ppi: 50 },
  { year: 2008, ppi: 60 },
  { year: 2012, ppi: 57 },
  { year: 2016, ppi: 62 },
  { year: 2020, ppi: 75 },
  { year: 2022, ppi: 72, aiLow: 68, aiHigh: 78 },
  { year: 2024, ppi: 74, aiLow: 66, aiHigh: 86 },
  { year: 2026, ppi: 73, aiLow: 63, aiHigh: 90 },
];

const START_YEAR = 1900;
const END_YEAR = 2026;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolateAnchors(anchors: PpiAnchor[]): PpiPoint[] {
  const sorted = [...anchors].sort((a, b) => a.year - b.year);
  const output: PpiPoint[] = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const left = sorted[i];
    const right = sorted[i + 1];
    const span = right.year - left.year;
    for (let year = left.year; year <= right.year; year += 1) {
      if (i > 0 && year === left.year) {
        continue;
      }
      const t = span === 0 ? 0 : (year - left.year) / span;
      const ppi = lerp(left.ppi, right.ppi, t);
      const aiLow =
        left.aiLow !== undefined && right.aiLow !== undefined
          ? lerp(left.aiLow, right.aiLow, t)
          : year >= 2022
          ? left.aiLow ?? right.aiLow
          : undefined;
      const aiHigh =
        left.aiHigh !== undefined && right.aiHigh !== undefined
          ? lerp(left.aiHigh, right.aiHigh, t)
          : year >= 2022
          ? left.aiHigh ?? right.aiHigh
          : undefined;
      output.push({ year, ppi, aiLow, aiHigh });
    }
  }
  return output;
}

const DATA = interpolateAnchors(ANCHORS).filter(
  (point) => point.year >= START_YEAR && point.year <= END_YEAR
);

// “Spark events” = vertical markers.
// Like you're 10: these are “things that happened” that can trigger visible conflict
// when pressure is already high.
const EVENTS: Array<{ year: number; label: string }> = [
  { year: 1907, label: "Panic of 1907" },
  { year: 1914, label: "WWI begins" },
  { year: 1918, label: "Influenza pandemic" },
  { year: 1929, label: "Wall St crash" },
  { year: 1933, label: "Great Depression" },
  { year: 1939, label: "WWII begins" },
  { year: 1947, label: "Cold War order" },
  { year: 1956, label: "Automation era" },
  { year: 1968, label: "1968 protests" },
  { year: 1973, label: "Oil shock" },
  { year: 1979, label: "Stagflation peak" },
  { year: 1989, label: "Cold War ends" },
  { year: 2001, label: "9/11 shock" },
  { year: 2008, label: "2008 crash" },
  { year: 2020, label: "COVID shock" },
  { year: 2022, label: "Inflation spike" },
  { year: 2023, label: "AI mainstream" },
];

const EVENT_COMPANIES: Record<string, string[]> = {
  "Panic of 1907": ["J.P. Morgan & Co."],
  "WWI begins": ["U.S. Steel", "DuPont"],
  "Influenza pandemic": ["Johnson & Johnson"],
  "Wall St crash": ["Goldman Sachs", "JPMorgan"],
  "Great Depression": ["Procter & Gamble"],
  "WWII begins": ["Boeing", "General Motors"],
  "Cold War order": ["Lockheed", "Raytheon"],
  "Automation era": ["IBM", "General Electric"],
  "1968 protests": ["Coca-Cola", "Unilever"],
  "Oil shock": ["Exxon", "Shell"],
  "Stagflation peak": ["Exxon", "Chevron"],
  "Cold War ends": ["Microsoft", "Intel"],
  "9/11 shock": ["Lockheed Martin", "Northrop Grumman"],
  "2008 crash": ["JPMorgan", "Wells Fargo"],
  "COVID shock": ["Pfizer", "Moderna"],
  "Inflation spike": ["Exxon", "Chevron"],
  "AI mainstream": ["NVIDIA", "Microsoft"],
};

const EVENT_LABELS: Record<number, string[]> = EVENTS.reduce(
  (acc, event) => {
    acc[event.year] = acc[event.year] ?? [];
    acc[event.year].push(event.label);
    return acc;
  },
  {} as Record<number, string[]>
);

const EVENT_POINTS = EVENTS.map((event) => {
  const point = DATA.find((p) => p.year === event.year);
  return {
    year: event.year,
    eventY: point?.ppi ?? 98,
    label: event.label,
  };
});

const DECADE_DRIVERS: Array<{ year: number; label: string }> = [
  { year: 1900, label: "Income↓, Labor↑ (industrial churn)" },
  { year: 1910, label: "Income↓, Trust↓ (pre-war strain)" },
  { year: 1920, label: "Housing↑, Inequality↑ (boom/bust)" },
  { year: 1930, label: "Income↓, Labor↑ (Depression)" },
  { year: 1940, label: "Trust↑, Labor↑ (war mobilization)" },
  { year: 1950, label: "Income↑, Housing↑ (postwar growth)" },
  { year: 1960, label: "Labor↑, Trust↓ (social unrest)" },
  { year: 1970, label: "Income↓, Housing↑ (oil shocks)" },
  { year: 1980, label: "Inequality↑, Trust↓ (restructuring)" },
  { year: 1990, label: "Income↑, Housing↑ (globalization)" },
  { year: 2000, label: "Trust↓, Inequality↑ (tech/finance)" },
  { year: 2010, label: "Income↓, Labor↑ (post-crisis)" },
  { year: 2020, label: "Housing↑, Trust↓ (pandemic/inflation)" },
];

const DECADE_DRIVER_LABELS: Record<number, string> = DECADE_DRIVERS.reduce(
  (acc, driver) => {
    acc[driver.year] = driver.label;
    return acc;
  },
  {} as Record<number, string>
);

/**
 * Little helper: round tooltip numbers nicely.
 */
function formatNumber(value: unknown): ReactNode {
  if (typeof value === "number") {
    return Math.round(value);
  }
  if (value === undefined || value === null) {
    return "";
  }
  return String(value);
}

function renderTooltip({
  active,
  label,
  payload,
}: TooltipContentProps<ValueType, NameType>): ReactNode {
  if (!active) {
    return null;
  }
  const year = typeof label === "number" ? label : Number(label);
  const eventsForYear = Number.isFinite(year) ? EVENT_LABELS[year] : undefined;
  const decade =
    Number.isFinite(year) ? Math.floor(Number(year) / 10) * 10 : undefined;
  const decadeDriver =
    decade !== undefined ? DECADE_DRIVER_LABELS[decade] : undefined;
  const series = (payload ?? []).filter((entry) => {
    const dataKey = entry.dataKey?.toString();
    return dataKey && dataKey !== "eventY" && dataKey !== "year";
  });

  return (
    <div style={styles.tooltip}>
      <div style={styles.tooltipTitle}>Year {label}</div>
      {series.length > 0 && (
        <div style={styles.tooltipSection}>
          {series.map((entry) => (
            <div key={entry.dataKey} style={styles.tooltipRow}>
              <span>{entry.name}</span>
              <span>{formatNumber(entry.value)}</span>
            </div>
          ))}
        </div>
      )}
      {eventsForYear?.length && (
        <div style={styles.tooltipSection}>
          <div style={styles.tooltipLabel}>Events</div>
          {eventsForYear.map((event) => {
            const companies = EVENT_COMPANIES[event];
            return (
              <div key={`${label}-${event}`} style={styles.tooltipEvent}>
                <div>{event}</div>
                {companies?.length ? (
                  <div style={styles.tooltipCompanies}>
                    Companies: {companies.join(", ")}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
      {decadeDriver && (
        <div style={styles.tooltipSection}>
          <div style={styles.tooltipLabel}>Decade drivers</div>
          <div style={styles.tooltipEvent}>{decadeDriver}</div>
        </div>
      )}
    </div>
  );
}

const EventDot: ScatterCustomizedShape = (props) => {
  const { cx, cy } = props as { cx?: number; cy?: number };
  if (cx === undefined || cy === undefined) {
    return null;
  }
  return (
    <>
      <circle
        cx={cx}
        cy={cy}
        r={9}
        fill={COLORS.eventGlow}
      />
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={COLORS.eventDot}
        stroke={COLORS.eventStroke}
        strokeWidth={2}
      />
    </>
  );
};

export default function App() {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.h1}>Political Pressure Index (PPI)</h1>
            <p style={styles.sub}>
              1900 → today • Zones + spark events + AI wildcard cone (demo data)
            </p>
          </div>

          <div style={styles.badgeRow}>
            <span style={styles.badge}>Dark mode only</span>
            <span style={styles.badge}>Recharts</span>
          </div>
        </header>

        <div style={styles.card}>
          <div style={styles.cardTopRow}>
            <div>
              <div style={styles.cardTitle}>Pressure timeline</div>
              <div style={styles.cardHint}>
                Solid = base PPI • Dashed = AI cone (post-2022)
              </div>
            </div>
          </div>

          <div style={{ width: "100%", height: 420 }}>
            <ResponsiveContainer>
              <LineChart
                data={DATA}
                margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={COLORS.grid}
                  strokeOpacity={0.5}
                />

                {/* X axis = year */}
                <XAxis
                  dataKey="year"
                  type="number"
                  domain={[START_YEAR, END_YEAR]}
                  tickCount={10}
                  stroke="rgba(255,255,255,0.7)"
                />

                {/* Y axis = PPI score */}
                <YAxis
                  domain={[0, 100]}
                  tickCount={6}
                  stroke="rgba(255,255,255,0.7)"
                />

                {/* Tooltip: shows values when you hover */}
                <Tooltip content={renderTooltip} />

                <Legend />

                {/* ===== Threshold bands (zones) =====
                    Like you're 10:
                    - These are “pressure zones” painted behind the chart.
                    - So your eyes can instantly see: stable vs reform vs protest vs pre-revolution.
                */}

                {/* Stable zone: 0–55 */}
                <ReferenceArea
                  y1={0}
                  y2={55}
                  fill={COLORS.stable}
                  ifOverflow="extendDomain"
                />

                {/* Reform/Populism zone: 55–70 */}
                <ReferenceArea
                  y1={55}
                  y2={70}
                  fill={COLORS.reform}
                  ifOverflow="extendDomain"
                />

                {/* Protest zone: 70–85 */}
                <ReferenceArea
                  y1={70}
                  y2={85}
                  fill={COLORS.protest}
                  ifOverflow="extendDomain"
                />

                {/* Pre-revolution zone: 85–100 */}
                <ReferenceArea
                  y1={85}
                  y2={100}
                  fill={COLORS.risk}
                  ifOverflow="extendDomain"
                />

                {/* Horizontal threshold lines */}
                <ReferenceLine y={55} stroke={COLORS.threshold} />
                <ReferenceLine y={70} stroke={COLORS.threshold} />
                <ReferenceLine y={85} stroke={COLORS.threshold} />

                <Scatter
                  data={EVENT_POINTS}
                  dataKey="eventY"
                  name="Events"
                  shape={EventDot}
                  isAnimationActive={false}
                />

                {/* ===== Main PPI line ===== */}
                <Line
                  type="monotone"
                  dataKey="ppi"
                  name="Base PPI"
                  stroke={COLORS.baseLine}
                  strokeWidth={3}
                  dot={{ r: 2.5 }}
                  activeDot={{ r: 5 }}
                />

                {/* ===== AI wildcard cone (two dashed lines) =====
                    Like you're 10:
                    - After 2022, the future can go 2 ways.
                    - We draw 2 dashed lines to show the range.
                */}
                <Line
                  type="monotone"
                  dataKey="aiLow"
                  name="AI lowers pressure (cone)"
                  stroke={COLORS.aiLow}
                  strokeWidth={2}
                  strokeDasharray="6 6"
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="aiHigh"
                  name="AI raises pressure (cone)"
                  stroke={COLORS.aiHigh}
                  strokeWidth={2}
                  strokeDasharray="6 6"
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={styles.legendHelp}>
            <div style={styles.legendItem}>
              <span
                style={{
                  ...styles.swatch,
                  background: COLORS.stable,
                }}
              />
              <span>Stable</span>
            </div>
            <div style={styles.legendItem}>
              <span
                style={{
                  ...styles.swatch,
                  background: COLORS.reform,
                }}
              />
              <span>Reform pressure</span>
            </div>
            <div style={styles.legendItem}>
              <span
                style={{
                  ...styles.swatch,
                  background: COLORS.protest,
                }}
              />
              <span>Protest zone</span>
            </div>
            <div style={styles.legendItem}>
              <span
                style={{
                  ...styles.swatch,
                  background: COLORS.risk,
                }}
              />
              <span>Pre-revolution risk</span>
            </div>
          </div>
        </div>

        <footer style={styles.footer}>
          <div style={styles.footerNote}>
            Tip: once you’re happy with the look, we can swap the demo data for
            a real scoring function and generate yearly values automatically.
          </div>
        </footer>
      </div>
    </div>
  );
}

/**
 * Dark mode only styles.
 * Like you're 10:
 * - We’re just setting background colors and spacing so it looks “app-like”.
 * - No fancy CSS framework needed.
 */
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    width: "100%",
    background:
      "radial-gradient(circle at top, rgba(255,255,255,0.12), transparent 45%), #06070a",
    color: "rgba(255,255,255,0.92)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "clamp(16px, 3vw, 32px)",
    boxSizing: "border-box",
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
  },
  shell: {
    width: "100%",
    maxWidth: 1100,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  h1: {
    margin: 0,
    fontSize: 22,
    letterSpacing: 0.2,
  },
  sub: {
    margin: "6px 0 0",
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    lineHeight: 1.4,
  },
  badgeRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  badge: {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.78)",
  },
  card: {
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.16)",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(16px)",
    padding: 16,
    boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
  },
  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 0.2,
  },
  cardHint: {
    marginTop: 4,
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
  },
  legendHelp: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
  },
  swatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
    border: "1px solid rgba(255,255,255,0.12)",
  },
  footer: {
    marginTop: 4,
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
  },
  footerNote: {
    padding: "6px 2px",
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
  tooltipSection: {
    marginTop: 6,
    paddingTop: 6,
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },
  tooltipRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
  },
  tooltipLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 4,
  },
  tooltipEvent: {
    color: "rgba(255,255,255,0.85)",
  },
  tooltipCompanies: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    marginTop: 2,
  },
};
