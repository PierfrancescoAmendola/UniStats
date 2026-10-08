// When to show the "leave a review" and "support the project" pop-ups.
//
// The pop-ups appear by chance, only to people who already use the app, and never insist:
// - not before NUDGE.minLaunches launches, NUDGE.minDays days since the first open and
//   NUDGE.minExams exams in the transcript;
// - at most one per session and at least NUDGE.gapDays days after the previous one;
// - the review comes first; the donation only after the review was asked at least once;
// - each kind stops for good once done, or after NUDGE.maxDismiss "later" taps;
// - when everything allows it, a coin flip (NUDGE.chance) decides, so it feels random.

export type NudgeKind = 'review' | 'tip';
export type NudgeOutcome = 'done' | 'later';

export interface NudgeState {
    /** First time the app was opened (ms). */
    firstOpen: number;
    launches: number;
    /** Last time a pop-up was shown (ms), 0 if never. */
    lastShown: number;
    reviewDone: boolean;
    tipDone: boolean;
    reviewLater: number;
    tipLater: number;
}

export const NUDGE = {
    minLaunches: 4,
    minDays: 3,
    minExams: 3,
    gapDays: 7,
    maxDismiss: 2,
    chance: 0.5,
};

const DAY = 24 * 60 * 60 * 1000;

export const initialNudges = (now: number): NudgeState => ({
    firstOpen: now,
    launches: 0,
    lastShown: 0,
    reviewDone: false,
    tipDone: false,
    reviewLater: 0,
    tipLater: 0,
});

/** The pop-up to show now, or null. `random` is injectable for tests (defaults to Math.random). */
export const pickNudge = (
    s: NudgeState,
    ctx: { now: number; exams: number; shownThisSession: boolean },
    random: () => number = Math.random,
): NudgeKind | null => {
    if (ctx.shownThisSession) return null;
    if (s.launches < NUDGE.minLaunches || ctx.exams < NUDGE.minExams) return null;
    if (ctx.now - s.firstOpen < NUDGE.minDays * DAY) return null;
    if (s.lastShown && ctx.now - s.lastShown < NUDGE.gapDays * DAY) return null;

    const reviewOpen = !s.reviewDone && s.reviewLater < NUDGE.maxDismiss;
    const reviewAsked = s.reviewDone || s.reviewLater > 0;
    const tipOpen = !s.tipDone && s.tipLater < NUDGE.maxDismiss && reviewAsked;
    const kind: NudgeKind | null = reviewOpen ? 'review' : tipOpen ? 'tip' : null;
    if (!kind) return null;
    return random() < NUDGE.chance ? kind : null;
};

/** State after a pop-up was shown and the person chose what to do. */
export const applyNudge = (s: NudgeState, kind: NudgeKind, outcome: NudgeOutcome, now: number): NudgeState => {
    const next = { ...s, lastShown: now };
    if (kind === 'review') {
        if (outcome === 'done') next.reviewDone = true;
        else next.reviewLater = s.reviewLater + 1;
    } else if (outcome === 'done') next.tipDone = true;
    else next.tipLater = s.tipLater + 1;
    return next;
};
