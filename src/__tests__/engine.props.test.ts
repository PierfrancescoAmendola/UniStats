// Property tests: every rule preset against thousands of random transcripts and inputs.
// Each test states something that must hold for ANY input, so a regression anywhere in the
// engine shows up here even when no hand-written example covers it.
import { computeAverage } from '../engine/average';
import { computeGraduation, MAX_GRADE } from '../engine/graduation';
import { deltaFor, neededAverage } from '../engine/needed';
import { BonusInput, Exam, Rule } from '../engine/types';
import { NATIONAL_DEFAULTS, PRESETS } from '../data/presets';
import { COURSE_RULES } from './fixtures/courseRules';

const RULES: Rule[] = [...PRESETS, ...COURSE_RULES, ...Object.values(NATIONAL_DEFAULTS)];
const RUNS = 250;

const rng = (seed: number) => () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
type R = () => number;
const int = (r: R, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));
const pick = <T,>(r: R, xs: readonly T[]) => xs[Math.floor(r() * xs.length)];

const transcript = (r: R): Exam[] => {
    const n = int(r, 0, 25);
    return Array.from({ length: n }, (_, i) => {
        const passFail = r() < 0.12;
        const grade = passFail ? null : int(r, 18, 30);
        return {
            id: `x${i}`,
            name: `Exam ${i}`,
            grade,
            lode: grade === 30 && r() < 0.4,
            cfu: pick(r, [1, 2, 3, 4.5, 5, 6, 6, 8, 9, 9, 10, 12, 15]),
            date: `2026-0${int(r, 1, 9)}-1${int(r, 0, 9)}`,
            year: int(r, 1, 3),
        };
    });
};

// Includes nonsense on purpose: negative and out-of-range indices, wrong types.
const inputs = (r: R, rule: Rule): BonusInput => {
    const out: BonusInput = {};
    for (const b of rule.bonuses) {
        const roll = r();
        if (roll < 0.2) continue;
        if (b.kind === 'flag') out[b.id] = r() < 0.6;
        else if (b.kind === 'mobility') out[b.id] = pick(r, [0, 6, 12, 18, 24, 60, -6]);
        else out[b.id] = pick(r, [0, 1, 2, 3, -1, 99]);
        if (roll > 0.95) out[b.id] = true; // wrong type
    }
    if (rule.multiplier) out.gamma = pick(r, [0, 1, 2, 7, -1]);
    return out;
};

const groupOf = (rule: Rule, id: string) => {
    const b = rule.bonuses.find((x) => x.id === id);
    return b && 'group' in b ? b.group : undefined;
};

describe.each(RULES.map((r) => [r.id, r] as const))('rule %s', (_id, rule) => {
    it('holds every invariant on random transcripts', () => {
        const r = rng(rule.id.split('').reduce((h, c) => h * 31 + c.charCodeAt(0), 7));
        for (let k = 0; k < RUNS; k++) {
            const exams = transcript(r);
            const avg = computeAverage(exams, rule);
            const graded = exams.filter((e) => e.grade !== null);

            // Totals
            expect(avg.totalCfu).toBeCloseTo(exams.reduce((s, e) => s + e.cfu, 0), 9);
            expect(avg.gradedCfu).toBeLessThanOrEqual(graded.reduce((s, e) => s + e.cfu, 0) + 1e-9);
            expect(avg.lodeCount).toBe(graded.filter((e) => e.lode && e.grade === 30).length);

            // Average: present iff something is graded, always within the grade range.
            if (!graded.length) {
                expect(avg.avg30).toBeNull();
            } else {
                expect(avg.avg30).not.toBeNull();
                expect(avg.avg30!).toBeGreaterThanOrEqual(18 - 1e-9);
                expect(avg.avg30!).toBeLessThanOrEqual(rule.average.lodeValue + 1e-9);
                const values = avg.counted.map((c) => c.value);
                expect(avg.weighted!).toBeGreaterThanOrEqual(Math.min(...values) - 1e-9);
                expect(avg.weighted!).toBeLessThanOrEqual(Math.max(...values) + 1e-9);
            }

            // Order of the exams never matters.
            const shuffled = [...exams].sort(() => r() - 0.5);
            const again = computeAverage(shuffled, rule);
            if (avg.avg30 === null) expect(again.avg30).toBeNull();
            else expect(again.avg30!).toBeCloseTo(avg.avg30, 9);

            // A better grade never lowers the average. Not true for rules that drop the worst grades:
            // raising a dropped grade can change which exams are dropped (PoliTo, Trento, Genova).
            const target = graded.find((e) => e.grade! < 30);
            if (target && rule.average.dropWorst.mode === 'none') {
                const better = exams.map((e) => (e.id === target.id ? { ...e, grade: e.grade! + 1 } : e));
                expect(computeAverage(better, rule).avg30!).toBeGreaterThanOrEqual(avg.avg30! - 1e-9);
            }
            // Pass/fail exams never change the average.
            const withPassFail = [...exams, { id: 'pf', name: 'PF', grade: null, lode: false, cfu: 6, date: '2026-01-01', year: 1 }];
            const pf = computeAverage(withPassFail, rule);
            expect(pf.avg30 === null ? null : pf.avg30.toFixed(9)).toBe(avg.avg30 === null ? null : avg.avg30.toFixed(9));
            expect(pf.totalCfu).toBeCloseTo(avg.totalCfu + 6, 9);

            // Graduation
            const thesisIn = pick(r, [-5, rule.finalExam.min, 0, 1.5, 3, rule.finalExam.max, 99]);
            const g = computeGraduation(avg, rule, thesisIn, inputs(r, rule));
            expect(Number.isFinite(g.final)).toBe(true);
            expect(g.final).toBeLessThanOrEqual(MAX_GRADE);
            expect(g.final).toBeGreaterThanOrEqual(0);
            if (rule.finalRounding !== 'none') expect(Number.isInteger(g.final)).toBe(true);
            expect(g.thesis).toBeGreaterThanOrEqual(rule.finalExam.min);
            expect(g.thesis).toBeLessThanOrEqual(rule.finalExam.max);
            for (const line of g.bonuses) expect(line.points).toBeGreaterThanOrEqual(0);
            expect(g.bonusTotal).toBeCloseTo(g.bonuses.reduce((s, l) => s + l.points, 0), 9);
            // Bonuses of the same group never add up.
            const groups = new Map<string, number>();
            for (const line of g.bonuses) {
                const grp = groupOf(rule, line.id);
                if (grp && line.points > 0) groups.set(grp, (groups.get(grp) ?? 0) + 1);
            }
            for (const count of groups.values()) expect(count).toBeLessThanOrEqual(1);
            // Commission caps
            if (rule.model === 'additive') {
                const extra = g.raw - g.base;
                if (rule.caps.commissionMax != null) expect(extra).toBeLessThanOrEqual(rule.caps.commissionMax + 1e-9);
                if (rule.caps.commissionMin != null) expect(extra).toBeGreaterThanOrEqual(rule.caps.commissionMin - 1e-9);
            }
            // Honours only at 110, automatic honours only when possible.
            if (g.lodePossible) expect(g.final).toBe(MAX_GRADE);
            if (g.lodeAutomatic) expect(g.lodePossible).toBe(true);
            // More thesis points never lower the final grade.
            const more = computeGraduation(avg, rule, rule.finalExam.max, {});
            const less = computeGraduation(avg, rule, rule.finalExam.min, {});
            expect(more.final).toBeGreaterThanOrEqual(less.final);
        }
    });
});

describe('needed average and deltas', () => {
    it('reaching the needed average lands exactly on the target', () => {
        const r = rng(42);
        for (let k = 0; k < 2000; k++) {
            const gradedCfu = int(r, 6, 170);
            const avg = 18 + r() * 12;
            const sum = avg * gradedCfu;
            const target = 18 + r() * 12;
            const cfu = int(r, 1, 120);
            const res = neededAverage(sum, gradedCfu, target, cfu, 30);
            expect((sum + res.value * cfu) / (gradedCfu + cfu)).toBeCloseTo(target, 6);
            if (res.verdict === 'guaranteed') expect(res.value).toBeLessThanOrEqual(18);
            if (res.verdict === 'reachable') expect(res.value).toBeLessThanOrEqual(30);
            if (res.verdict === 'impossible') expect(res.value).toBeGreaterThan(30);
        }
        expect(neededAverage(100, 4, 28, 0).verdict).toBe('impossible');
    });

    it('a grade above the average raises it, below lowers it, equal leaves it', () => {
        const r = rng(7);
        for (let k = 0; k < 2000; k++) {
            const gradedCfu = int(r, 6, 170);
            const avg = 18 + r() * 12;
            const grade = int(r, 18, 30);
            const d = deltaFor(avg * gradedCfu, gradedCfu, grade, int(r, 1, 15));
            if (grade > avg + 1e-9) expect(d).toBeGreaterThan(0);
            else if (grade < avg - 1e-9) expect(d).toBeLessThan(0);
        }
        expect(deltaFor(0, 0, 30, 6)).toBe(0);
        expect(deltaFor(270, 10, 27, 6)).toBeCloseTo(0, 12);
    });
});
