// Domain types shared by the calculation engine, the store and the UI.

export type Level = 'L' | 'LM' | 'LMCU';

export interface Exam {
    id: string;
    name: string;
    /** 18–30, or null for a pass/fail exam (idoneità). */
    grade: number | null;
    lode: boolean;
    cfu: number;
    /** ISO date (yyyy-mm-dd). */
    date: string;
    /** Course year the exam belongs to (1-based). */
    year: number;
    note?: string;
}

export type RoundingMode = 'halfUp' | 'halfDown' | 'truncate' | 'none';

export interface Tier {
    label: string;
    points: number;
}

/** Bonus rules. Kinds marked "auto" are computed from the transcript; the others are declared by the student. */
export type Bonus =
    | { id: string; kind: 'lodeCount'; perLode: number; max?: number; everyN?: number }
    | { id: string; kind: 'lodeCfu'; pointsPerCfu: number; max?: number }
    | { id: string; kind: 'lodeTiers'; tiers: { gte: number; points: number }[] }
    | { id: string; kind: 'averageBand'; on: 'avg30' | 'base110'; bands: { gte: number; points: number }[] }
    /** Linear on the base: 0 at `from`, `maxPoints` at `to`. Below `minBase` (when set) it is 0. */
    | { id: string; kind: 'averageLinear'; from: number; to: number; maxPoints: number; minBase?: number }
    | { id: string; kind: 'onTime'; tiers: Tier[]; minAvg30?: number }
    | { id: string; kind: 'onTimePercent'; tiers: { label: string; pct: number }[] }
    | { id: string; kind: 'mobility'; tiers: { cfuGte: number; points: number }[]; group?: string }
    | { id: string; kind: 'flag'; label: string; points: number; group?: string }
    /** Padova-style table: points depend on the base band and on the graduation session the student picks. */
    | { id: string; kind: 'careerTable'; sessions: string[]; rows: { baseGt: number; points: number[] }[] };

export interface Rule {
    id: string;
    universityId: string | null;
    /** Short human label, e.g. "Ateneo" or "Economia L-33 (coorte 2022+)". */
    scopeLabel: string;
    levels: Level[];
    average: {
        type: 'weighted' | 'arithmetic';
        lodeValue: number;
        excludePassFail: boolean;
        dropWorst: { mode: 'none' | 'cfu' | 'exams'; amount: number; allowPartial: boolean };
    };
    conversion: { factor: number; baseRounding: RoundingMode };
    finalExam: { min: number; max: number };
    bonuses: Bonus[];
    caps: { commissionMin: number | null; commissionMax: number | null };
    model: 'additive' | 'multiplicative';
    /** Multiplicative model only (Poliba): thesis maps to alpha, lodi to beta, on-time to gamma. */
    multiplier?: { alphaMin: number; alphaMax: number; betaPerLode: number; betaMax: number; gammaTiers: { label: string; value: number }[] };
    finalRounding: RoundingMode;
    lode: {
        /** Raw total needed; null means reaching 110 is enough. */
        rawThreshold: number | null;
        strict: boolean;
        evaluatedOn: 'preRounding' | 'postRounding';
        minBase: number | null;
        minFinalExamPoints: number | null;
        automatic: boolean;
    };
    provenance: { confidence: 'verified' | 'partial' | 'uncertain' | 'default' | 'custom'; sources: { title: string; url: string }[]; note?: string };
}

/** What the student declared for the bonuses that cannot be read from the transcript. */
export type BonusInput = Record<string, number | boolean | undefined>;
