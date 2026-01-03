// src/App.tsx
import type { ReactNode } from "react";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Like you're 10:
 * - This is a "Political Pressure Index" chart from 1950 to now.
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

// Demo dataset: sparse but “feels” historically plausible.
// You can add more points (e.g., every year) later.
// Recharts will draw lines between points.
const DATA: PpiPoint[] = [
  { year: 1950, ppi: 38 },
  { year: 1960, ppi: 35 },
  { year: 1970, ppi: 42 },
  { year: 1975, ppi: 55 },
  { year: 1980, ppi: 58 },
  { year: 1990, ppi: 45 },
  { year: 2000, ppi: 43 },
  { year: 2008, ppi: 60 },
  { year: 2012, ppi: 57 },
  { year: 2016, ppi: 62 },
  { year: 2020, ppi: 75 },
  { year: 2022, ppi: 72, aiLow: 68, aiHigh: 78 },
  { year: 2024, ppi: 74, aiLow: 66, aiHigh: 86 },
  { year: 2026, ppi: 73, aiLow: 63, aiHigh: 90 },
];

// “Spark events” = vertical markers.
// Like you're 10: these are “things that happened” that can trigger visible conflict
// when pressure is already high.
const EVENTS: Array<{ year: number; label: string }> = [
  { year: 1968, label: "1968 protests" },
  { year: 1973, label: "Oil shock" },
  { year: 2008, label: "2008 crash" },
  { year: 2020, label: "COVID shock" },
  { year: 2022, label: "Inflation spike" },
  { year: 2023, label: "AI mainstream" },
];

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

export default function App() {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.h1}>Political Pressure Index (PPI)</h1>
            <p style={styles.sub}>
              1950 → today • Zones + spark events + AI wildcard cone (demo data)
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
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />

                {/* X axis = year */}
                <XAxis
                  dataKey="year"
                  type="number"
                  domain={[1950, 2026]}
                  tickCount={9}
                  stroke="rgba(255,255,255,0.7)"
                />

                {/* Y axis = PPI score */}
                <YAxis
                  domain={[0, 100]}
                  tickCount={6}
                  stroke="rgba(255,255,255,0.7)"
                />

                {/* Tooltip: shows values when you hover */}
                <Tooltip
                  formatter={(value) => formatNumber(value)}
                  contentStyle={{
                    background: "rgba(20,20,24,0.95)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    color: "rgba(255,255,255,0.9)",
                  }}
                  labelStyle={{ color: "rgba(255,255,255,0.8)" }}
                />

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
                  fill="rgba(52, 211, 153, 0.08)" // a soft green-ish tint
                  ifOverflow="extendDomain"
                />

                {/* Reform/Populism zone: 55–70 */}
                <ReferenceArea
                  y1={55}
                  y2={70}
                  fill="rgba(250, 204, 21, 0.08)" // soft yellow-ish tint
                  ifOverflow="extendDomain"
                />

                {/* Protest zone: 70–85 */}
                <ReferenceArea
                  y1={70}
                  y2={85}
                  fill="rgba(251, 146, 60, 0.09)" // soft orange-ish tint
                  ifOverflow="extendDomain"
                />

                {/* Pre-revolution zone: 85–100 */}
                <ReferenceArea
                  y1={85}
                  y2={100}
                  fill="rgba(239, 68, 68, 0.09)" // soft red-ish tint
                  ifOverflow="extendDomain"
                />

                {/* Horizontal threshold lines */}
                <ReferenceLine y={55} stroke="rgba(255,255,255,0.18)" />
                <ReferenceLine y={70} stroke="rgba(255,255,255,0.18)" />
                <ReferenceLine y={85} stroke="rgba(255,255,255,0.18)" />

                {/* Event markers (spark events) */}
                {EVENTS.map((e) => (
                  <ReferenceLine
                    key={e.year}
                    x={e.year}
                    stroke="rgba(255,255,255,0.16)"
                    strokeDasharray="4 6"
                    label={{
                      value: e.label,
                      position: "insideTopLeft",
                      fill: "rgba(255,255,255,0.55)",
                      fontSize: 11,
                      angle: -90,
                      offset: 10,
                    }}
                  />
                ))}

                {/* ===== Main PPI line ===== */}
                <Line
                  type="monotone"
                  dataKey="ppi"
                  name="Base PPI"
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
                  strokeWidth={2}
                  strokeDasharray="6 6"
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="aiHigh"
                  name="AI raises pressure (cone)"
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
                  background: "rgba(52, 211, 153, 0.22)",
                }}
              />
              <span>Stable</span>
            </div>
            <div style={styles.legendItem}>
              <span
                style={{
                  ...styles.swatch,
                  background: "rgba(250, 204, 21, 0.22)",
                }}
              />
              <span>Reform pressure</span>
            </div>
            <div style={styles.legendItem}>
              <span
                style={{
                  ...styles.swatch,
                  background: "rgba(251, 146, 60, 0.22)",
                }}
              />
              <span>Protest zone</span>
            </div>
            <div style={styles.legendItem}>
              <span
                style={{
                  ...styles.swatch,
                  background: "rgba(239, 68, 68, 0.22)",
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
    background: "#0b0b10",
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
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
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
};
