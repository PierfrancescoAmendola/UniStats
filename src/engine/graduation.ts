import { AverageResult } from './average';
import { clamp, roundWith, snap } from './math';
import { Bonus, BonusInput, Rule } from './types';

export const MAX_GRADE = 110;

export interface BonusLine {
    id: string;
    kind: Bonus['kind'];
    points: number;
    /** True when the transcript decides it; false when the student declares it. */
    auto: boolean;
}

export interface GraduationResult {
    base: number;
    thesis: number;
    bonuses: BonusLine[];
    bonusTotal: number;
    raw: number;
    final: number;
    lodePossible: boolean;
    lodeAutomatic: boolean;
}

const firstBand = <T extends { gte: number }>(bands: T[], v: number): T | undefined =>
    [...bands].sort((a, b) => b.gte - a.gte).find((b) => snap(v) >= b.gte);

const bonusPoints = (b: Bonus, avg: AverageResult, base: number, input: BonusInput): { points: number; auto: boolean } => {
    const avg30 = avg.avg30 ?? 0;
    switch (b.kind) {
        case 'lodeCount': {
            const raw = b.everyN ? Math.floor(avg.lodeCount / b.everyN) * b.perLode : avg.lodeCount * b.perLode;
            return { points: b.max != null ? Math.min(raw, b.max) : raw, auto: true };
        }
        case 'lodeCfu': {
            const raw = avg.lodeCfu * b.pointsPerCfu;
            return { points: b.max != null ? Math.min(raw, b.max) : raw, auto: true };
        }
        case 'lodeTiers':
            return { points: firstBand(b.tiers, avg.lodeCount)?.points ?? 0, auto: true };
        case 'averageBand':
            return { points: firstBand(b.bands, b.on === 'avg30' ? avg30 : base)?.points ?? 0, auto: true };
        case 'averageLinear':
            if (b.minBase != null && snap(base) < b.minBase) return { points: 0, auto: true };
            return { points: clamp((base - b.from) / (b.to - b.from), 0, 1) * b.maxPoints, auto: true };
        case 'onTime': {
            const i = input[b.id];
            if (typeof i !== 'number' || i < 0 || i >= b.tiers.length) return { points: 0, auto: false };
            if (b.minAvg30 != null && snap(avg30) < b.minAvg30) return { points: 0, auto: false };
            return { points: b.tiers[i].points, auto: false };
        }
        case 'onTimePercent': {
            const i = input[b.id];
            if (typeof i !== 'number' || i < 0 || i >= b.tiers.length) return { points: 0, auto: false };
            return { points: b.tiers[i].pct * base, auto: false };
        }
        case 'mobility': {
            const cfu = input[b.id];
            if (typeof cfu !== 'number') return { points: 0, auto: false };
            return { points: firstBand(b.tiers.map((t) => ({ gte: t.cfuGte, points: t.points })), cfu)?.points ?? 0, auto: false };
        }
        case 'flag':
            return { points: input[b.id] === true ? b.points : 0, auto: false };
        case 'careerTable': {
            const i = input[b.id];
            if (typeof i !== 'number' || i < 0 || i >= b.sessions.length) return { points: 0, auto: false };
            const row = [...b.rows].sort((a, c) => c.baseGt - a.baseGt).find((r) => snap(base) > r.baseGt);
            return { points: row?.points[i] ?? 0, auto: false };
        }
    }
};

const groupOf = (b: Bonus) => ('group' in b ? b.group : undefined);

export const computeGraduation = (avg: AverageResult, rule: Rule, thesisInput: number, input: BonusInput = {}): GraduationResult => {
    const avg30 = avg.avg30 ?? 0;
    const base = roundWith(avg30 * rule.conversion.factor, rule.conversion.baseRounding);
    const thesis = clamp(thesisInput, rule.finalExam.min, rule.finalExam.max);

    let lines: BonusLine[] = rule.bonuses.map((b) => ({ id: b.id, kind: b.kind, ...bonusPoints(b, avg, base, input) }));
    // Bonuses in the same group do not add up: only the highest one counts.
    const best = new Map<string, number>();
    rule.bonuses.forEach((b, i) => {
        const g = groupOf(b);
        if (!g) return;
        const prev = best.get(g);
        if (prev === undefined || lines[i].points > lines[prev].points) best.set(g, i);
    });
    lines = lines.map((l, i) => {
        const g = groupOf(rule.bonuses[i]);
        return g && best.get(g) !== i ? { ...l, points: 0 } : l;
    });
    const bonusTotal = lines.reduce((s, l) => s + l.points, 0);

    let raw: number;
    if (rule.model === 'multiplicative' && rule.multiplier) {
        const m = rule.multiplier;
        const span = rule.finalExam.max - rule.finalExam.min || 1;
        const alpha = m.alphaMin + ((thesis - rule.finalExam.min) / span) * (m.alphaMax - m.alphaMin);
        const beta = Math.min(avg.lodeCount * m.betaPerLode, m.betaMax);
        const gi = input.gamma;
        const gamma = typeof gi === 'number' && m.gammaTiers[gi] ? m.gammaTiers[gi].value : 0;
        raw = base * (alpha + beta + gamma);
    } else {
        let extra = thesis + bonusTotal;
        if (rule.caps.commissionMax != null) extra = Math.min(extra, rule.caps.commissionMax);
        if (rule.caps.commissionMin != null) extra = Math.max(extra, rule.caps.commissionMin);
        raw = base + extra;
    }

    const rounded = rule.finalRounding === 'none' ? raw : roundWith(raw, rule.finalRounding);
    // Between 0 and 110: a negative commission (PoliMi, -1) on an empty transcript must not show -1.
    const final = clamp(rounded, 0, MAX_GRADE);

    const l = rule.lode;
    const evalOn = l.evaluatedOn === 'preRounding' ? snap(raw) : rounded;
    const passesRaw = l.rawThreshold == null ? true : l.strict ? evalOn > l.rawThreshold : evalOn >= l.rawThreshold;
    const lodePossible =
        final >= MAX_GRADE &&
        passesRaw &&
        (l.minBase == null || snap(base) >= l.minBase) &&
        (l.minFinalExamPoints == null || thesis >= l.minFinalExamPoints);

    return { base, thesis, bonuses: lines, bonusTotal, raw, final, lodePossible, lodeAutomatic: lodePossible && l.automatic };
};

/** Base out of 110 for a given average out of 30, before any bonus. */
export const baseFor = (avg30: number, rule: Rule) => roundWith(avg30 * rule.conversion.factor, rule.conversion.baseRounding);
