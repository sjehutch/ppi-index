export type Confidence = "low" | "medium" | "high";

export type EventCategory =
  | "economic"
  | "war"
  | "social"
  | "institutional"
  | "technology"
  | "ai";

export type PpiEvent = {
  year: number;
  label: string;
  category: EventCategory;
  description: string;
  confidence: Confidence;
};

type PpiInputs = {
  income: number;
  labor: number;
  housing: number;
  inequality: number;
  trust: number;
};

type PpiAnchor = {
  year: number;
  inputs: PpiInputs;
  aiSignal?: number;
  confidence: Confidence;
};

export type PpiDataPoint = {
  year: number;
  ppi: number;
  aiAdjusted: number;
  aiModifier: number;
  confidence: Confidence;
  oilInfluence: "up" | "down" | "flat" | "unknown";
};

export const START_YEAR = 1850;
export const END_YEAR = 2024;

const clamp = (value: number) => Math.max(0, Math.min(100, value));

// Like you're 10: add up the stress scores and take the average.
// This keeps the demo formula simple and reusable for any country later.
const computePpi = (inputs: PpiInputs) => {
  const total =
    inputs.income +
    inputs.labor +
    inputs.housing +
    inputs.inequality +
    inputs.trust;
  return Math.round(total / 5);
};

// AI Wildcard: near zero before 2010, then a small +/- adjustment.
const computeAiModifier = (year: number, aiSignal = 0) => {
  if (year < 2010) {
    return 0;
  }
  return Math.round(aiSignal * 8);
};

const computeOilInfluence = (
  year: number
): "up" | "down" | "flat" | "unknown" => {
  if (year >= 1850 && year <= 1910) {
    return "flat";
  }
  if (year >= 1911 && year <= 1945) {
    return "up";
  }
  if (year >= 1946 && year <= 1970) {
    return "up";
  }
  if (year >= 1971 && year <= 1985) {
    return "down";
  }
  if (year >= 1986 && year <= 2007) {
    return "flat";
  }
  if (year >= 2008 && year <= 2013) {
    return "down";
  }
  if (year >= 2014 && year <= 2019) {
    return "up";
  }
  if (year === 2020) {
    return "down";
  }
  if (year >= 2021 && year <= 2023) {
    return "flat";
  }
  return "unknown";
};

const ANCHORS: PpiAnchor[] = [
  {
    year: 1850,
    inputs: { income: 55, labor: 50, housing: 35, inequality: 60, trust: 40 },
    confidence: "low",
  },
  {
    year: 1860,
    inputs: { income: 62, labor: 58, housing: 38, inequality: 65, trust: 35 },
    confidence: "low",
  },
  {
    year: 1870,
    inputs: { income: 50, labor: 52, housing: 40, inequality: 58, trust: 45 },
    confidence: "low",
  },
  {
    year: 1890,
    inputs: { income: 54, labor: 56, housing: 42, inequality: 60, trust: 42 },
    confidence: "low",
  },
  {
    year: 1900,
    inputs: { income: 48, labor: 50, housing: 40, inequality: 55, trust: 46 },
    confidence: "low",
  },
  {
    year: 1914,
    inputs: { income: 58, labor: 62, housing: 46, inequality: 60, trust: 40 },
    confidence: "low",
  },
  {
    year: 1929,
    inputs: { income: 70, labor: 68, housing: 55, inequality: 72, trust: 38 },
    confidence: "low",
  },
  {
    year: 1939,
    inputs: { income: 60, labor: 64, housing: 52, inequality: 64, trust: 45 },
    confidence: "low",
  },
  {
    year: 1945,
    inputs: { income: 48, labor: 50, housing: 44, inequality: 52, trust: 52 },
    confidence: "low",
  },
  {
    year: 1950,
    inputs: { income: 40, labor: 42, housing: 38, inequality: 45, trust: 58 },
    confidence: "medium",
  },
  {
    year: 1960,
    inputs: { income: 38, labor: 40, housing: 42, inequality: 44, trust: 55 },
    confidence: "medium",
  },
  {
    year: 1970,
    inputs: { income: 45, labor: 48, housing: 50, inequality: 50, trust: 50 },
    confidence: "medium",
  },
  {
    year: 1980,
    inputs: { income: 52, labor: 50, housing: 54, inequality: 58, trust: 46 },
    confidence: "medium",
  },
  {
    year: 1990,
    inputs: { income: 45, labor: 44, housing: 48, inequality: 52, trust: 52 },
    confidence: "medium",
  },
  {
    year: 2000,
    inputs: { income: 46, labor: 44, housing: 52, inequality: 56, trust: 48 },
    confidence: "medium",
  },
  {
    year: 2008,
    inputs: { income: 58, labor: 56, housing: 60, inequality: 62, trust: 42 },
    confidence: "medium",
  },
  {
    year: 2012,
    inputs: { income: 52, labor: 54, housing: 58, inequality: 60, trust: 44 },
    aiSignal: 0.1,
    confidence: "high",
  },
  {
    year: 2016,
    inputs: { income: 55, labor: 56, housing: 60, inequality: 62, trust: 42 },
    aiSignal: 0.2,
    confidence: "high",
  },
  {
    year: 2020,
    inputs: { income: 62, labor: 60, housing: 66, inequality: 66, trust: 38 },
    aiSignal: 0.35,
    confidence: "high",
  },
  {
    year: 2022,
    inputs: { income: 60, labor: 58, housing: 68, inequality: 66, trust: 36 },
    aiSignal: 0.45,
    confidence: "high",
  },
  {
    year: 2024,
    inputs: { income: 58, labor: 56, housing: 64, inequality: 64, trust: 40 },
    aiSignal: 0.55,
    confidence: "high",
  },
];

export const ppiData: PpiDataPoint[] = ANCHORS.map((anchor) => {
  const ppi = computePpi(anchor.inputs);
  const aiModifier = computeAiModifier(anchor.year, anchor.aiSignal);
  const aiAdjusted = clamp(ppi + aiModifier);
  return {
    year: anchor.year,
    ppi,
    aiAdjusted,
    aiModifier,
    confidence: anchor.confidence,
    oilInfluence: computeOilInfluence(anchor.year),
  };
});

export const ppiEvents: PpiEvent[] = [
  {
    year: 1850,
    label: "Slavery-based economy",
    category: "institutional",
    description:
      "An extractive labor system embedded long-term social and political pressure.",
    confidence: "low",
  },
  {
    year: 1861,
    label: "Civil War begins",
    category: "war",
    description:
      "National conflict reflected deep institutional strain and social division with lasting effects.",
    confidence: "low",
  },
  {
    year: 1865,
    label: "Reconstruction era",
    category: "institutional",
    description:
      "Post-war rebuilding reshaped governance and social order over many years.",
    confidence: "low",
  },
  {
    year: 1877,
    label: "Rail strike wave",
    category: "economic",
    description:
      "Early industrial labor unrest signaled long-term tensions in work and fairness.",
    confidence: "low",
  },
  {
    year: 1893,
    label: "Financial panic",
    category: "economic",
    description:
      "A sharp downturn increased unemployment anxiety and distrust in finance.",
    confidence: "low",
  },
  {
    year: 1917,
    label: "World War I mobilization",
    category: "war",
    description:
      "Wartime mobilization raised social stress even as institutions tightened.",
    confidence: "low",
  },
  {
    year: 1918,
    label: "World War I ends",
    category: "war",
    description:
      "Post-war adjustment reshaped labor, trust, and political expectations.",
    confidence: "low",
  },
  {
    year: 1929,
    label: "Market crash",
    category: "economic",
    description:
      "A sudden collapse amplified economic stress and political uncertainty.",
    confidence: "low",
  },
  {
    year: 1933,
    label: "New Deal reforms",
    category: "institutional",
    description:
      "Policy responses aimed to restore confidence and reduce household strain.",
    confidence: "low",
  },
  {
    year: 1941,
    label: "World War II escalation",
    category: "war",
    description:
      "Large-scale conflict shifted resources and intensified social pressure.",
    confidence: "low",
  },
  {
    year: 1945,
    label: "World War II ends",
    category: "war",
    description:
      "Post-war rebuilding redirected institutions and long-term social priorities.",
    confidence: "low",
  },
  {
    year: 1956,
    label: "Automation accelerates",
    category: "technology",
    description:
      "Productivity gains came with localized job displacement concerns.",
    confidence: "medium",
  },
  {
    year: 1968,
    label: "Civil rights unrest",
    category: "social",
    description:
      "Protests highlighted fairness, trust, and institutional legitimacy pressures.",
    confidence: "medium",
  },
  {
    year: 1968,
    label: "Vietnam War strain",
    category: "war",
    description:
      "Prolonged conflict fed polarization and raised questions of trust.",
    confidence: "medium",
  },
  {
    year: 1973,
    label: "Oil shock",
    category: "economic",
    description:
      "Energy price spikes squeezed household budgets and business costs.",
    confidence: "medium",
  },
  {
    year: 1979,
    label: "Second oil shock",
    category: "economic",
    description:
      "A renewed energy crisis prolonged cost-of-living pressure.",
    confidence: "medium",
  },
  {
    year: 1979,
    label: "Stagflation peak",
    category: "economic",
    description:
      "High inflation and weak growth increased real income stress.",
    confidence: "medium",
  },
  {
    year: 1989,
    label: "Cold War ends",
    category: "institutional",
    description:
      "Geopolitical shifts altered trust and expectations of stability.",
    confidence: "medium",
  },
  {
    year: 2001,
    label: "Security shock",
    category: "institutional",
    description:
      "Security concerns affected trust and social cohesion in the short term.",
    confidence: "medium",
  },
  {
    year: 2001,
    label: "9/11 attacks",
    category: "institutional",
    description:
      "A major security rupture intensified fear, trust concerns, and policy shifts.",
    confidence: "high",
  },
  {
    year: 2003,
    label: "Iraq War",
    category: "war",
    description:
      "Extended conflict influenced trust and perceptions of institutional legitimacy.",
    confidence: "high",
  },
  {
    year: 2001,
    label: "Afghanistan War",
    category: "war",
    description:
      "Prolonged military engagement affected public trust and social cohesion.",
    confidence: "high",
  },
  {
    year: 2008,
    label: "Global financial crisis",
    category: "economic",
    description:
      "Financial instability drove unemployment fears and distrust in institutions.",
    confidence: "high",
  },
  {
    year: 2011,
    label: "Protest wave",
    category: "social",
    description:
      "Public demonstrations reflected inequality and representation concerns.",
    confidence: "high",
  },
  {
    year: 2016,
    label: "Polarization surge",
    category: "social",
    description:
      "Rising polarization signaled growing trust and fairness stress.",
    confidence: "high",
  },
  {
    year: 2020,
    label: "Pandemic disruption",
    category: "economic",
    description:
      "Health and labor shocks raised cost-of-living and trust pressures.",
    confidence: "high",
  },
  {
    year: 2022,
    label: "Inflation spike",
    category: "economic",
    description:
      "Rapid price increases strained real incomes and housing affordability.",
    confidence: "high",
  },
  {
    year: 2022,
    label: "Ukraine war escalation",
    category: "war",
    description:
      "Conflict heightened energy, security, and trust pressures over time.",
    confidence: "high",
  },
  {
    year: 2023,
    label: "Gaza war escalation",
    category: "war",
    description:
      "Renewed conflict increased geopolitical stress and public polarization.",
    confidence: "high",
  },
  {
    year: 2023,
    label: "Generative AI boom",
    category: "ai",
    description:
      "Rapid adoption increased uncertainty about jobs, trust, and policy.",
    confidence: "high",
  },
];
