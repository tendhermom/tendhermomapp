// Citation map for the triage engine.
// Each pathway carries the clinical references behind its guidance, keyed by the
// reference numbers in src/lib/clinicalRefs.ts. Per-severity sets reflect the
// citations for the RED / AMBER (yellow) / GREEN guidance tiers; `all` is the
// pathway's full evidence set. Rendered in TriageScreen and the sources sheet.

interface PathwayRefs {
  all: number[];
  red?: number[];
  yellow?: number[];
  green?: number[];
}

export const TRIAGE_REFS: Record<string, PathwayRefs> = {
  reduced_movement: {
    all: [5, 13, 16, 21, 38, 41],
    red: [16, 21],
    yellow: [21],
    green: [5, 21],
  },
  bleeding: {
    all: [2, 6, 11, 17, 22, 51],
    red: [2, 6, 22],
    yellow: [17, 22],
    green: [17],
  },
  headache: {
    all: [1, 16, 18, 31, 33, 47, 51],
    red: [1, 16, 31],
    yellow: [16],
    green: [18, 33],
  },
  visual: {
    all: [1, 16, 18, 31, 40, 47],
    red: [1, 16, 31, 40],
    yellow: [16],
    green: [18],
  },
  swelling: {
    all: [1, 6, 16, 18, 26, 31],
    red: [16, 26],
    yellow: [16],
    green: [18],
  },
  abdominal_pain: {
    all: [4, 6, 15, 16, 18, 22, 46, 51],
    red: [6, 22, 46],
    yellow: [6, 15],
    green: [18],
  },
  contractions: {
    all: [6, 15, 18, 19, 22, 46, 51],
    red: [6, 15, 19, 46],
    yellow: [19],
    green: [18, 19],
  },
  waters_breaking: {
    all: [4, 6, 15, 19, 21, 22, 25],
    red: [4, 15, 19, 25],
    yellow: [15, 19],
    green: [19],
  },
  fever: {
    all: [4, 5, 6, 7, 12, 24, 33, 42],
    red: [4, 6, 7, 24],
    yellow: [6, 42],
    green: [33, 42],
  },
  sepsis: {
    all: [4, 7, 8, 24, 51],
    red: [7, 24],
    yellow: [24],
  },
  breathlessness: {
    all: [6, 18, 23, 26, 32, 36, 39, 43],
    red: [23, 26, 39],
    yellow: [32, 43],
    green: [18],
  },
  chest_pain: {
    all: [18, 26, 32, 43],
    red: [26, 32, 43],
    yellow: [18, 32],
    green: [18, 32],
  },
  vomiting: {
    all: [18, 29],
    red: [29],
    yellow: [18, 29],
    green: [18, 29],
  },
  dizziness: {
    all: [6, 17, 18, 32, 39, 51],
    red: [6, 17, 32],
    yellow: [18, 39],
    green: [18],
  },
  seizures: {
    all: [1, 6, 12, 16, 40, 41, 42, 47, 51],
    red: [1, 6, 16, 40, 41],
  },
  itching: {
    all: [18, 21, 28, 52],
    red: [28, 52],
    yellow: [28],
    green: [18],
  },
  jaundice: {
    all: [6, 12, 23, 31, 35, 42, 45],
    red: [6, 31, 35],
  },
  dvt: {
    all: [18, 23, 26, 30],
    red: [26, 30],
    yellow: [26],
    green: [18],
  },
  urinary: {
    all: [5, 6, 16, 18, 45],
    red: [6, 16],
    yellow: [5, 18, 45],
    green: [18],
  },
  anaemia: {
    all: [5, 6, 18, 23, 36, 39, 48, 49],
    red: [6, 23, 36, 39],
    yellow: [5],
    green: [5, 18],
  },
  early_pregnancy: {
    all: [6, 8, 17, 51],
    red: [6, 8, 17],
    yellow: [17],
    green: [17],
  },
  skin_rash: {
    all: [27, 28, 53],
    red: [27],
    yellow: [27, 53],
    green: [53],
  },
  back_pain: {
    all: [6, 15, 18, 33, 44, 46],
    red: [6, 15, 46],
    yellow: [18, 44],
    green: [18, 44, 33],
  },
  postpartum: {
    all: [1, 2, 3, 4, 7, 9, 16, 20, 51],
    red: [1, 2, 4, 7, 9, 16, 20],
    yellow: [3, 9, 20],
    green: [3, 9],
  },
  mental_health: {
    all: [10, 13, 14, 34, 37, 50],
    red: [10, 14],
    yellow: [10, 14, 34],
    green: [10, 14],
  },
};

export function refsForOutcome(pathwayId: string, severity: "green" | "yellow" | "red"): number[] {
  const entry = TRIAGE_REFS[pathwayId];
  if (!entry) return [];
  return entry[severity] ?? entry.all;
}
