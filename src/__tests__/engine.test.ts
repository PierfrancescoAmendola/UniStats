import { computeAverage, examImpact } from '../engine/average';
import { computeGraduation } from '../engine/graduation';
import { roundWith } from '../engine/math';
import { deltaFor, neededAverage } from '../engine/needed';
import { Exam, Rule } from '../engine/types';
import { NATIONAL_DEFAULTS, PRESETS, findRule } from '../data/presets';

let n = 0;
const ex = (grade: number | null, cfu: number, lode = false): Exam => ({
    id: `e${++n}`, name: `Exam ${n}`, grade, cfu, lode, date: '2025-01-01', year: 1,
});
const rule = (id: string): Rule => {
    const r = findRule(id);
    if (!r) throw new Error(`missing rule ${id}`);
    return r;
};

// The transcript used in the design mockups: weighted 27.36 over 66 CFU.
const mock = (): Exam[] => [
    ex(27, 9), ex(30, 12, true), ex(24, 9), ex(28, 6), ex(30, 9), ex(26, 6), ex(29, 9), ex(22, 6), ex(null, 3),
];

describe('average', () => {
    it('weights by CFU and leaves pass/fail exams out', () => {
        const a = computeAverage(mock(), NATIONAL_DEFAULTS.L);
        expect(a.sum).toBe(1806);
        expect(a.gradedCfu).toBe(66);
        expect(a.totalCfu).toBe(69);
        expect(a.weighted).toBeCloseTo(27.3636, 3);
        expect(a.arithmetic).toBeCloseTo(27, 6);
        expect(a.lodeCount).toBe(1);
    });

    it('counts honours as 33 when the rule says so (Statale SIE)', () => {
        const a = computeAverage([ex(30, 6, true), ex(24, 6)], rule('unimi-sie-L'));
        expect(a.avg30).toBeCloseTo(28.5, 6);
    });

    it('drops the worst CFU with fractions (Poliba 12 CFU)', () => {
        const a = computeAverage([ex(18, 9), ex(20, 9), ex(30, 9)], rule('poliba-dei-L'));
        // 9 CFU of 18 dropped entirely, 3 of the 20 cut: (20*6 + 30*9) / 15
        expect(a.gradedCfu).toBe(15);
        expect(a.avg30).toBeCloseTo((120 + 270) / 15, 6);
    });

    it('drops the single lowest exam (Trento DEM)', () => {
        const a = computeAverage([ex(18, 6), ex(28, 6), ex(30, 6)], rule('unitn-dem-L'));
        expect(a.avg30).toBeCloseTo(29, 6);
    });

    it('measures the impact of one exam', () => {
        const exams = mock();
        const db = exams[6];
        expect(examImpact(exams, db.id, NATIONAL_DEFAULTS.L)).toBeCloseTo(27.3636 - 1545 / 57, 3);
    });
});

describe('rounding', () => {
    it('handles half-up, half-down and truncation at .5', () => {
        expect(roundWith(105.5, 'halfUp')).toBe(106);
        expect(roundWith(105.5, 'halfDown')).toBe(105);
        expect(roundWith(105.51, 'halfDown')).toBe(106);
        expect(roundWith(105.99, 'truncate')).toBe(105);
    });

    it('is not fooled by floating point just below a threshold', () => {
        expect(roundWith(0.1 + 0.2 + 110.2, 'halfUp')).toBe(111);
    });
});

describe('graduation', () => {
    it('adds base, thesis and bonuses with the national default', () => {
        const a = computeAverage(mock(), NATIONAL_DEFAULTS.L);
        const g = computeGraduation(a, NATIONAL_DEFAULTS.L, 5);
        expect(g.base).toBeCloseTo(100.33, 2);
        expect(g.final).toBe(105);
    });

    it('clamps the thesis to the allowed range', () => {
        const a = computeAverage(mock(), NATIONAL_DEFAULTS.L);
        expect(computeGraduation(a, NATIONAL_DEFAULTS.L, 99).thesis).toBe(5);
    });

    it('adds speed and average incentives (Federico II, Informatica)', () => {
        const r = rule('unina-inf-L');
        // Weighted 25.3 over 30 CFU: base 92.77, incentive 92.77 * 3/22 - 11 = 1.65.
        const a = computeAverage([ex(25, 21), ex(26, 9)], r);
        expect(a.avg30).toBeCloseTo(25.3, 6);
        const g = computeGraduation(a, r, 6, { speed: 0 });
        expect(g.bonusTotal).toBeCloseTo(5 + (25.3 * 110) / 30 * (3 / 22) - 11, 6);
        expect(g.raw).toBeCloseTo(105.42, 2);
        expect(g.final).toBe(105);
        // One year late: 2 points instead of 5.
        expect(computeGraduation(a, r, 6, { speed: 1 }).final).toBe(102);
    });

    it('gives no average incentive under 81/110 (Federico II, Informatica)', () => {
        const r = rule('unina-inf-L');
        const a = computeAverage([ex(22, 6)], r);
        expect(computeGraduation(a, r, 1).bonuses.find((b) => b.id === 'avg')?.points).toBe(0);
    });

    it('allows honours only with an average of 28 (Federico II, Informatica)', () => {
        const r = rule('unina-inf-L');
        const hi = computeAverage([ex(28, 6)], r);
        expect(computeGraduation(hi, r, 6, { speed: 0 }).lodePossible).toBe(true);
        const lo = computeAverage([ex(27, 6)], r);
        const g = computeGraduation(lo, r, 6, { speed: 0 });
        expect(g.final).toBe(110);
        expect(g.lodePossible).toBe(false);
    });

    it('uses factor 3.86 (Trento)', () => {
        const a = computeAverage([ex(27, 6), ex(27, 6)], rule('unitn-dem-L'));
        expect(computeGraduation(a, rule('unitn-dem-L'), 0).base).toBeCloseTo(27 * 3.86, 6);
    });

    it('applies the multiplicative formula (Poliba)', () => {
        const r = rule('poliba-dei-L');
        const a = computeAverage([ex(30, 12), ex(30, 12, true), ex(30, 12, true)], r);
        // alpha at thesis 7 = 1.07, beta = 2 lodi * 0.01, gamma on time = 0.02
        const g = computeGraduation(a, r, 7, { gamma: 0 });
        expect(g.raw).toBeCloseTo(110 * 1.11, 6);
        expect(g.final).toBe(110);
        expect(g.lodePossible).toBe(true);
    });

    it('requires a raw total above 111 before rounding for honours (PoliMi)', () => {
        const r = rule('polimi-L-LM');
        const a = computeAverage([ex(28, 30)], r); // base 102.67
        expect(computeGraduation(a, r, 8).lodePossible).toBe(false); // 110.67
        const a2 = computeAverage([ex(29, 30)], r); // base 106.33
        expect(computeGraduation(a2, r, 5).lodePossible).toBe(true); // 111.33
    });

    it('caps thesis plus bonuses at the commission maximum (PoliMi 8)', () => {
        const r = rule('polimi-L-LM');
        const a = computeAverage([ex(24, 30)], r);
        expect(computeGraduation(a, r, 8).raw).toBeCloseTo(88 + 8, 6);
    });

    it('truncates the final grade (Roma Tre)', () => {
        const r = rule('roma3-ing-LM');
        const a = computeAverage([ex(27, 30)], r); // base 99
        expect(computeGraduation(a, r, 6.9).final).toBe(105);
    });

    it('computes the linear bonus on the base (Brescia)', () => {
        const r = rule('unibs-mecc-L');
        const a = computeAverage([ex(25, 30)], r); // base 91.67
        const g = computeGraduation(a, r, 0);
        expect(g.bonuses.find((b) => b.id === 'avg')!.points).toBeCloseTo(((91.6667 - 84) / 15) * 5, 3);
    });

    it('reads the career table by base band and session (Padova)', () => {
        const r = rule('unipd-econ-L');
        const a = computeAverage([ex(27, 30)], r); // base 99 > 95
        const g = computeGraduation(a, r, 2, { career: 2 });
        expect(g.bonuses.find((b) => b.id === 'career')!.points).toBe(7);
    });

    it('gives the on-time bonus only above the minimum average (Sapienza Ing. Ambientale)', () => {
        const r = rule('sapienza-ingamb-L');
        const low = computeGraduation(computeAverage([ex(26, 30)], r), r, 0, { onTime: 0 });
        const high = computeGraduation(computeAverage([ex(27, 30)], r), r, 0, { onTime: 0 });
        expect(low.bonuses.find((b) => b.id === 'onTime')!.points).toBe(0);
        expect(high.bonuses.find((b) => b.id === 'onTime')!.points).toBe(2);
    });

    it('keeps only the best bonus in an exclusive group (Ca’ Foscari)', () => {
        const r = rule('unive-L');
        const a = computeAverage([ex(27, 30)], r);
        const g = computeGraduation(a, r, 0, { mobility: 30, doubleDegree: true });
        expect(g.bonusTotal).toBe(2);
    });
});

describe('needed', () => {
    it('finds the average needed on the next credits', () => {
        const r = neededAverage(1806, 66, 28, 30);
        expect(r.value).toBeCloseTo(29.4, 6);
        expect(r.verdict).toBe('reachable');
    });

    it('flags unreachable and guaranteed targets', () => {
        expect(neededAverage(1806, 66, 30, 6).verdict).toBe('impossible');
        expect(neededAverage(1806, 66, 25, 6).verdict).toBe('guaranteed');
        expect(neededAverage(1806, 66, 27.6, 3, 33).verdict).toBe('needsLode');
    });

    it('gives the delta of a new grade', () => {
        expect(deltaFor(1806, 66, 28, 9)).toBeCloseTo(2058 / 75 - 1806 / 66, 6);
    });
});

describe('presets', () => {
    it('have unique ids and valid thesis ranges', () => {
        const ids = PRESETS.map((p) => p.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const p of PRESETS) expect(p.finalExam.max).toBeGreaterThan(p.finalExam.min);
    });
});
