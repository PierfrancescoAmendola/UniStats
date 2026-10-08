import { applyNudge, initialNudges, NUDGE, NudgeKind, NudgeState, pickNudge } from '../store/nudges';

const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.UTC(2026, 9, 1);
const yes = () => 0; // the coin flip says "show"
const no = () => 0.99; // the coin flip says "not now"

const ready = (over: Partial<NudgeState> = {}): NudgeState => ({ ...initialNudges(T0), launches: NUDGE.minLaunches, ...over });
const ctx = (over: Partial<{ now: number; exams: number; shownThisSession: boolean }> = {}) => ({
    now: T0 + NUDGE.minDays * DAY,
    exams: NUDGE.minExams,
    shownThisSession: false,
    ...over,
});

/** The rules written independently of the implementation, used as an oracle. */
const expected = (s: NudgeState, c: ReturnType<typeof ctx>, coin: boolean): NudgeKind | null => {
    const gates =
        !c.shownThisSession &&
        s.launches >= 4 &&
        c.exams >= 3 &&
        c.now - s.firstOpen >= 3 * DAY &&
        (s.lastShown === 0 || c.now - s.lastShown >= 7 * DAY);
    if (!gates || !coin) return null;
    if (!s.reviewDone && s.reviewLater < 2) return 'review';
    if (!s.tipDone && s.tipLater < 2 && (s.reviewDone || s.reviewLater > 0)) return 'tip';
    return null;
};

describe('pickNudge: every combination', () => {
    it('matches the written rules on the whole grid', () => {
        let checked = 0;
        let shown = 0;
        for (const launches of [0, 1, 3, 4, 5, 20])
            for (const days of [0, 1, 2, 2.99, 3, 4, 10, 400])
                for (const exams of [0, 2, 3, 4, 50])
                    for (const sinceLast of [null, 0, 1, 6.99, 7, 30])
                        for (const reviewDone of [false, true])
                            for (const tipDone of [false, true])
                                for (const reviewLater of [0, 1, 2, 3])
                                    for (const tipLater of [0, 1, 2, 3])
                                        for (const session of [false, true])
                                            for (const coin of [true, false]) {
                                                const now = T0 + days * DAY;
                                                const s = ready({ launches, reviewDone, tipDone, reviewLater, tipLater, lastShown: sinceLast === null ? 0 : now - sinceLast * DAY });
                                                const c = ctx({ now, exams, shownThisSession: session });
                                                const got = pickNudge(s, c, coin ? yes : no);
                                                expect(got).toBe(expected(s, c, coin));
                                                checked++;
                                                if (got) shown++;
                                            }
        // Sanity: the grid covers both outcomes in large numbers.
        expect(checked).toBe(6 * 8 * 5 * 6 * 2 * 2 * 4 * 4 * 2 * 2);
        expect(shown).toBeGreaterThan(100);
    });

    it('asks for the review before any donation', () => {
        expect(pickNudge(ready(), ctx(), yes)).toBe('review');
        expect(pickNudge(ready({ reviewLater: 1 }), ctx(), yes)).toBe('review');
        expect(pickNudge(ready({ reviewDone: true }), ctx(), yes)).toBe('tip');
        expect(pickNudge(ready({ reviewLater: 2 }), ctx(), yes)).toBe('tip');
    });

    it('never asks again once both are done or dismissed twice', () => {
        for (const s of [
            ready({ reviewDone: true, tipDone: true }),
            ready({ reviewLater: 2, tipLater: 2 }),
            ready({ reviewDone: true, tipLater: 2 }),
            ready({ reviewLater: 2, tipDone: true }),
        ])
            expect(pickNudge(s, ctx({ now: T0 + 1000 * DAY }), yes)).toBeNull();
    });

    it('the coin flip boundary is exactly NUDGE.chance', () => {
        expect(pickNudge(ready(), ctx(), () => NUDGE.chance - 1e-9)).toBe('review');
        expect(pickNudge(ready(), ctx(), () => NUDGE.chance)).toBeNull();
    });
});

describe('applyNudge', () => {
    it('records the outcome and the time', () => {
        const s = ready();
        expect(applyNudge(s, 'review', 'done', 123)).toMatchObject({ reviewDone: true, reviewLater: 0, lastShown: 123 });
        expect(applyNudge(s, 'review', 'later', 5)).toMatchObject({ reviewDone: false, reviewLater: 1, lastShown: 5 });
        expect(applyNudge(s, 'tip', 'done', 7)).toMatchObject({ tipDone: true, tipLater: 0, lastShown: 7 });
        expect(applyNudge(s, 'tip', 'later', 9)).toMatchObject({ tipDone: false, tipLater: 1, lastShown: 9 });
    });

    it('does not mutate its input', () => {
        const s = ready();
        const copy = { ...s };
        applyNudge(s, 'tip', 'done', 1);
        expect(s).toEqual(copy);
    });
});

describe('a year of use, simulated', () => {
    // Deterministic pseudo-random numbers (mulberry32).
    const rng = (seed: number) => () => {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    it.each([1, 2, 3, 4, 5, 6, 7, 8])('seed %i: never pushy, never out of order', (seed) => {
        const r = rng(seed);
        let s = initialNudges(T0);
        const shownAt: number[] = [];
        const kinds: NudgeKind[] = [];
        for (let day = 0; day < 365; day++) {
            // 0 to 3 launches a day, each one a session.
            const launches = Math.floor(r() * 4);
            for (let l = 0; l < launches; l++) {
                s = { ...s, launches: s.launches + 1 };
                const now = T0 + day * DAY + l * 3600_000;
                const kind = pickNudge(s, { now, exams: Math.min(40, Math.floor(day / 3)), shownThisSession: false }, r);
                if (!kind) continue;
                shownAt.push(now);
                kinds.push(kind);
                s = applyNudge(s, kind, r() < 0.3 ? 'done' : 'later', now);
            }
        }
        // Regular use over a year does see the pop-ups.
        expect(shownAt.length).toBeGreaterThan(0);
        // At least a week between pop-ups.
        for (let i = 1; i < shownAt.length; i++) expect(shownAt[i] - shownAt[i - 1]).toBeGreaterThanOrEqual(7 * DAY);
        // Never before 3 days of use.
        if (shownAt.length) expect(shownAt[0] - T0).toBeGreaterThanOrEqual(3 * DAY);
        // The first one is always the review; at most 2 of each kind.
        if (kinds.length) expect(kinds[0]).toBe('review');
        expect(kinds.filter((k) => k === 'review').length).toBeLessThanOrEqual(2);
        expect(kinds.filter((k) => k === 'tip').length).toBeLessThanOrEqual(2);
        // A donation pop-up never comes before the review was asked.
        const firstTip = kinds.indexOf('tip');
        if (firstTip >= 0) expect(kinds.slice(0, firstTip)).toContain('review');
    });
});
