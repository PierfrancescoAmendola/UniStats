import { initialState, reducer, State } from '../store/AppStore';
import { Exam } from '../engine/types';

const T0 = Date.UTC(2026, 9, 1);
const exam = (id: string, grade: number | null = 28): Exam => ({ id, name: id, grade, lode: false, cfu: 6, date: '2026-01-01', year: 1 });
const hydrated = (saved: Partial<State> = {}, now = T0) => reducer(initialState(now), { type: 'hydrate', state: saved, now });

describe('launch counting and first open', () => {
    it('a fresh install starts at one launch, dated now', () => {
        const s = hydrated({}, T0 + 5);
        expect(s.hydrated).toBe(true);
        expect(s.nudges.launches).toBe(1);
        expect(s.nudges.firstOpen).toBe(T0 + 5);
    });

    it('later launches add one and keep the first-open date', () => {
        let saved: Partial<State> = {};
        for (let i = 1; i <= 5; i++) {
            const s = hydrated(saved, T0 + i * 1000);
            expect(s.nudges.launches).toBe(i);
            expect(s.nudges.firstOpen).toBe(T0 + 1000);
            const { hydrated: _h, ...rest } = s;
            saved = JSON.parse(JSON.stringify(rest));
        }
    });

    it('data saved by version 2.0 build 1 (no nudges yet) still loads', () => {
        const s = hydrated({ onboarded: true, exams: [exam('a')] } as Partial<State>, T0);
        expect(s.onboarded).toBe(true);
        expect(s.exams).toHaveLength(1);
        expect(s.nudges).toMatchObject({ launches: 1, reviewDone: false, tipDone: false });
    });
});

describe('pop-up answers', () => {
    it('records later and done for both kinds', () => {
        let s = hydrated();
        s = reducer(s, { type: 'nudge', kind: 'review', outcome: 'later', now: T0 + 1 });
        expect(s.nudges).toMatchObject({ reviewLater: 1, lastShown: T0 + 1 });
        s = reducer(s, { type: 'nudge', kind: 'review', outcome: 'done', now: T0 + 2 });
        expect(s.nudges).toMatchObject({ reviewDone: true, lastShown: T0 + 2 });
        s = reducer(s, { type: 'nudge', kind: 'tip', outcome: 'later', now: T0 + 3 });
        expect(s.nudges).toMatchObject({ tipLater: 1, lastShown: T0 + 3 });
    });

    it('reviewing or donating from Profile stops that pop-up without touching the timer', () => {
        let s = hydrated();
        s = reducer(s, { type: 'nudgeDone', kind: 'tip' });
        expect(s.nudges).toMatchObject({ tipDone: true, lastShown: 0 });
        s = reducer(s, { type: 'nudgeDone', kind: 'review' });
        expect(s.nudges).toMatchObject({ reviewDone: true, lastShown: 0 });
    });

    it('a reset of the data keeps language, theme and pop-up history', () => {
        let s = hydrated({ language: 'de', theme: 'dark' } as Partial<State>);
        s = reducer(s, { type: 'nudge', kind: 'review', outcome: 'done', now: T0 });
        s = reducer(s, { type: 'addExams', exams: [exam('a'), exam('b')] });
        s = reducer(s, { type: 'onboarded', value: true });
        s = reducer(s, { type: 'reset' });
        expect(s.exams).toEqual([]);
        expect(s.onboarded).toBe(false);
        expect(s.language).toBe('de');
        expect(s.theme).toBe('dark');
        expect(s.nudges.reviewDone).toBe(true);
        expect(s.hydrated).toBe(true);
    });
});

describe('exams', () => {
    it('add, edit in place, delete', () => {
        let s = hydrated();
        s = reducer(s, { type: 'upsertExam', exam: exam('a', 24) });
        s = reducer(s, { type: 'upsertExam', exam: exam('b', 30) });
        s = reducer(s, { type: 'upsertExam', exam: { ...exam('a', 27), name: 'Edited' } });
        expect(s.exams.map((e) => [e.id, e.grade, e.name])).toEqual([['a', 27, 'Edited'], ['b', 30, 'b']]);
        s = reducer(s, { type: 'deleteExam', id: 'a' });
        expect(s.exams.map((e) => e.id)).toEqual(['b']);
        s = reducer(s, { type: 'deleteExam', id: 'missing' });
        expect(s.exams.map((e) => e.id)).toEqual(['b']);
    });

    it('profile patches merge, theme and language switch', () => {
        let s = hydrated();
        s = reducer(s, { type: 'profile', patch: { name: 'Giulia', thesisPoints: 5 } });
        s = reducer(s, { type: 'profile', patch: { course: 'Economia' } });
        expect(s.profile).toMatchObject({ name: 'Giulia', thesisPoints: 5, course: 'Economia', level: 'L' });
        s = reducer(s, { type: 'theme', value: 'dark' });
        s = reducer(s, { type: 'language', value: null });
        expect(s.theme).toBe('dark');
        expect(s.language).toBeNull();
    });
});
