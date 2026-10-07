import { snap } from './math';

export type NeededVerdict = 'guaranteed' | 'reachable' | 'needsLode' | 'impossible';

export interface NeededResult {
    /** Average needed on the next `cfu` credits, out of 30. */
    value: number;
    verdict: NeededVerdict;
}

/**
 * Average needed over the next `cfu` credits to reach `target` (out of 30).
 * `sum` and `gradedCfu` describe the exams already counted.
 */
export const neededAverage = (sum: number, gradedCfu: number, target: number, cfu: number, lodeValue = 30): NeededResult => {
    if (cfu <= 0) return { value: NaN, verdict: 'impossible' };
    const value = snap((target * (gradedCfu + cfu) - sum) / cfu);
    if (value <= 18) return { value, verdict: 'guaranteed' };
    if (value <= 30) return { value, verdict: 'reachable' };
    if (value <= lodeValue) return { value, verdict: 'needsLode' };
    return { value, verdict: 'impossible' };
};

/** How a new grade changes the average: positive when it raises it. */
export const deltaFor = (sum: number, gradedCfu: number, grade: number, cfu: number): number => {
    if (gradedCfu === 0) return 0;
    const before = sum / gradedCfu;
    return (sum + grade * cfu) / (gradedCfu + cfu) - before;
};
