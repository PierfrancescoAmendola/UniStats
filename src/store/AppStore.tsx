import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { AverageResult, computeAverage } from '../engine/average';
import { computeGraduation, GraduationResult } from '../engine/graduation';
import { BonusInput, Exam, Level, Rule } from '../engine/types';
import { findRule, NATIONAL_DEFAULTS } from '../data/presets';
import { detectLanguage, Language, Params, translate, TKey } from '../i18n';
import { applyNudge, initialNudges, NudgeKind, NudgeOutcome, NudgeState } from './nudges';

export interface Profile {
    name: string;
    level: Level;
    /** Course length in years (3, 2, 5 or 6). */
    years: number;
    totalCfu: number;
    universityId: string | null;
    course: string;
    cohort: number;
    /** Preset id, or null when the student edited the rule (customRule). */
    ruleId: string | null;
    customRule: Rule | null;
    thesisPoints: number;
    bonusInput: BonusInput;
    targetAverage: number;
}

export type ThemePref = 'system' | 'light' | 'dark';

export interface State {
    hydrated: boolean;
    theme: ThemePref;
    onboarded: boolean;
    language: Language | null;
    profile: Profile;
    exams: Exam[];
    /** Review and donation pop-ups (see nudges.ts). Survives a reset: it is about the person, not the data. */
    nudges: NudgeState;
}

export const LEVEL_DEFAULTS: Record<Level, { years: number; totalCfu: number }> = {
    L: { years: 3, totalCfu: 180 },
    LM: { years: 2, totalCfu: 120 },
    LMCU: { years: 5, totalCfu: 300 },
};

const thisYear = new Date().getFullYear();

export const initialProfile: Profile = {
    name: '',
    level: 'L',
    years: 3,
    totalCfu: 180,
    universityId: null,
    course: '',
    cohort: new Date().getMonth() >= 8 ? thisYear : thisYear - 1,
    ruleId: 'default-L',
    customRule: null,
    thesisPoints: 3,
    bonusInput: {},
    targetAverage: 28,
};

export const initialState = (now = Date.now()): State => ({
    hydrated: false, theme: 'system', onboarded: false, language: null, profile: initialProfile, exams: [], nudges: initialNudges(now),
});
const initial = initialState();

type Action =
    | { type: 'hydrate'; state: Partial<State>; now: number }
    | { type: 'profile'; patch: Partial<Profile> }
    | { type: 'onboarded'; value: boolean }
    | { type: 'language'; value: Language | null }
    | { type: 'theme'; value: ThemePref }
    | { type: 'upsertExam'; exam: Exam }
    | { type: 'addExams'; exams: Exam[] }
    | { type: 'deleteExam'; id: string }
    | { type: 'reset' }
    | { type: 'nudge'; kind: NudgeKind; outcome: NudgeOutcome; now: number }
    | { type: 'nudgeDone'; kind: NudgeKind };

export type AppAction = Action;

export const reducer = (s: State, a: Action): State => {
    switch (a.type) {
        case 'hydrate': {
            // Every hydration is one launch; the first one also dates the first open.
            const saved = a.state.nudges;
            const nudges = { ...initialNudges(a.now), ...saved };
            let profile: Profile = { ...initialProfile, ...a.state.profile };
            // Course rules are no longer shipped: a profile that used one goes back to the national
            // defaults (an edited copy, customRule, is the student's own and stays).
            if (profile.ruleId && !findRule(profile.ruleId)) profile = { ...profile, ruleId: `default-${profile.level}`, bonusInput: {} };
            return { ...s, ...a.state, profile, nudges: { ...nudges, launches: nudges.launches + 1 }, hydrated: true };
        }
        case 'profile':
            return { ...s, profile: { ...s.profile, ...a.patch } };
        case 'onboarded':
            return { ...s, onboarded: a.value };
        case 'language':
            return { ...s, language: a.value };
        case 'theme':
            return { ...s, theme: a.value };
        case 'upsertExam': {
            const exists = s.exams.some((e) => e.id === a.exam.id);
            return { ...s, exams: exists ? s.exams.map((e) => (e.id === a.exam.id ? a.exam : e)) : [...s.exams, a.exam] };
        }
        case 'addExams':
            return { ...s, exams: [...s.exams, ...a.exams] };
        case 'deleteExam':
            return { ...s, exams: s.exams.filter((e) => e.id !== a.id) };
        case 'reset':
            return { ...initial, hydrated: true, language: s.language, theme: s.theme, nudges: s.nudges };
        case 'nudge':
            return { ...s, nudges: applyNudge(s.nudges, a.kind, a.outcome, a.now) };
        case 'nudgeDone':
            return { ...s, nudges: { ...s.nudges, [a.kind === 'review' ? 'reviewDone' : 'tipDone']: true } };
    }
};

const KEY = 'unistats.v1';

export const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** The rule in force: the student's edited copy, else the chosen preset, else the national default. */
export const resolveRule = (p: Profile): Rule => p.customRule ?? (p.ruleId ? findRule(p.ruleId) : undefined) ?? NATIONAL_DEFAULTS[p.level];

export const sortByDateDesc = (exams: Exam[]) => [...exams].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

interface Ctx {
    state: State;
    lang: Language;
    t: (key: TKey, params?: Params) => string;
    rule: Rule;
    avg: AverageResult;
    grad: GraduationResult;
    setProfile: (patch: Partial<Profile>) => void;
    setOnboarded: (v: boolean) => void;
    setLanguage: (l: Language | null) => void;
    setTheme: (v: ThemePref) => void;
    upsertExam: (e: Exam) => void;
    addExams: (e: Exam[]) => void;
    deleteExam: (id: string) => void;
    reset: () => void;
    /** A pop-up was answered. */
    answerNudge: (kind: NudgeKind, outcome: NudgeOutcome) => void;
    /** Reviewed or donated from Profile: never ask for that again. */
    markNudgeDone: (kind: NudgeKind) => void;
}

const AppCtx = createContext<Ctx | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
    const [state, dispatch] = useReducer(reducer, initial);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        AsyncStorage.getItem(KEY)
            .then((raw) => dispatch({ type: 'hydrate', state: raw ? JSON.parse(raw) : {}, now: Date.now() }))
            .catch(() => dispatch({ type: 'hydrate', state: {}, now: Date.now() }));
    }, []);

    useEffect(() => {
        if (!state.hydrated) return;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            const { hydrated, ...rest } = state;
            AsyncStorage.setItem(KEY, JSON.stringify(rest)).catch(() => undefined);
        }, 250);
    }, [state]);

    const lang = state.language ?? detectLanguage();
    const t = useCallback((key: TKey, params?: Params) => translate(lang, key, params), [lang]);
    const rule = useMemo(() => resolveRule(state.profile), [state.profile]);
    const avg = useMemo(() => computeAverage(state.exams, rule), [state.exams, rule]);
    const grad = useMemo(
        () => computeGraduation(avg, rule, state.profile.thesisPoints, state.profile.bonusInput),
        [avg, rule, state.profile.thesisPoints, state.profile.bonusInput],
    );

    const value = useMemo<Ctx>(
        () => ({
            state, lang, t, rule, avg, grad,
            setProfile: (patch) => dispatch({ type: 'profile', patch }),
            setOnboarded: (v) => dispatch({ type: 'onboarded', value: v }),
            setLanguage: (l) => dispatch({ type: 'language', value: l }),
            setTheme: (v) => dispatch({ type: 'theme', value: v }),
            upsertExam: (exam) => dispatch({ type: 'upsertExam', exam }),
            addExams: (exams) => dispatch({ type: 'addExams', exams }),
            deleteExam: (id) => dispatch({ type: 'deleteExam', id }),
            reset: () => dispatch({ type: 'reset' }),
            answerNudge: (kind, outcome) => dispatch({ type: 'nudge', kind, outcome, now: Date.now() }),
            markNudgeDone: (kind) => dispatch({ type: 'nudgeDone', kind }),
        }),
        [state, lang, t, rule, avg, grad],
    );

    return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
};

export const useApp = () => {
    const c = useContext(AppCtx);
    if (!c) throw new Error('useApp outside AppProvider');
    return c;
};
