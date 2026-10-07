import { Exam, Rule } from './types';

export interface CountedExam {
    exam: Exam;
    value: number;
    /** CFU that count toward the average (less than exam.cfu when partially dropped). */
    cfu: number;
}

export interface AverageResult {
    counted: CountedExam[];
    /** Weighted or arithmetic average out of 30; null when no graded exam exists. */
    avg30: number | null;
    weighted: number | null;
    arithmetic: number | null;
    sum: number;
    gradedCfu: number;
    totalCfu: number;
    lodeCount: number;
    lodeCfu: number;
}

export const gradeValue = (e: Exam, lodeValue: number) => (e.grade === null ? 0 : e.lode && e.grade === 30 ? lodeValue : e.grade);

/** Drops the lowest grades as the rule says (PoliTo: 16 CFU, Poliba: 12 CFU with fractions). */
const applyDropWorst = (items: CountedExam[], rule: Rule): CountedExam[] => {
    const { mode, amount, allowPartial } = rule.average.dropWorst;
    if (mode === 'none' || amount <= 0) return items;
    const sorted = [...items].sort((a, b) => a.value - b.value || a.cfu - b.cfu);
    if (mode === 'exams') return sorted.slice(Math.min(amount, Math.max(0, sorted.length - 1)));
    let left = amount;
    const out: CountedExam[] = [];
    for (const it of sorted) {
        if (left <= 0) {
            out.push(it);
        } else if (it.cfu <= left) {
            left -= it.cfu;
        } else if (allowPartial) {
            out.push({ ...it, cfu: it.cfu - left });
            left = 0;
        } else {
            out.push(it);
            left = 0;
        }
    }
    return out.length ? out : sorted.slice(-1);
};

export const computeAverage = (exams: Exam[], rule: Rule): AverageResult => {
    const lv = rule.average.lodeValue;
    const graded = exams.filter((e) => e.grade !== null);
    const all = graded.map((exam) => ({ exam, value: gradeValue(exam, lv), cfu: exam.cfu }));
    const counted = applyDropWorst(all, rule);
    const sum = counted.reduce((s, c) => s + c.value * c.cfu, 0);
    const gradedCfu = counted.reduce((s, c) => s + c.cfu, 0);
    const weighted = gradedCfu > 0 ? sum / gradedCfu : null;
    const arithmetic = counted.length ? counted.reduce((s, c) => s + c.value, 0) / counted.length : null;
    const lodes = graded.filter((e) => e.lode && e.grade === 30);
    return {
        counted,
        avg30: rule.average.type === 'arithmetic' ? arithmetic : weighted,
        weighted,
        arithmetic,
        sum,
        gradedCfu,
        totalCfu: exams.reduce((s, e) => s + e.cfu, 0),
        lodeCount: lodes.length,
        lodeCfu: lodes.reduce((s, e) => s + e.cfu, 0),
    };
};

/** How much one exam moved the average: average with it minus average without it. */
export const examImpact = (exams: Exam[], examId: string, rule: Rule): number | null => {
    const withIt = computeAverage(exams, rule).avg30;
    const without = computeAverage(exams.filter((e) => e.id !== examId), rule).avg30;
    if (withIt === null || without === null) return null;
    return withIt - without;
};
