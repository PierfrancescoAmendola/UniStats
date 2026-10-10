import { Level, Rule } from '../engine/types';

// Calculation rules read from official regulations (research of 2026-10-07, see
// ricerca-voti-universita.md). The app ships only rules valid for a whole university:
// most universities set the rule per course and cohort, and covering a few courses
// would give some students a rule and leave the others with nothing. Everyone else
// starts from the national defaults and adapts them to their regulation in the editor.
// Labels inside tiers and flags are i18n keys (bonus.*).

const F = 110 / 30;

type Partial2<T> = { [K in keyof T]?: T[K] extends object ? Partial<T[K]> : T[K] };

export const makeRule = (r: Omit<Partial2<Rule>, 'id'> & { id: string; levels: Level[]; finalExam: Rule['finalExam'] }): Rule => ({
    universityId: null,
    scopeLabel: '',
    bonuses: [],
    model: 'additive',
    finalRounding: 'halfUp',
    ...r,
    average: { type: 'weighted', lodeValue: 30, excludePassFail: true, dropWorst: { mode: 'none', amount: 0, allowPartial: false }, ...r.average },
    conversion: { factor: F, baseRounding: 'none', ...r.conversion },
    caps: { commissionMin: null, commissionMax: null, ...r.caps },
    lode: { rawThreshold: null, strict: false, evaluatedOn: 'preRounding', minBase: null, minFinalExamPoints: null, automatic: false, ...r.lode },
    provenance: { confidence: 'verified', sources: [], ...r.provenance },
} as Rule);

/** National defaults: used when no preset exists for the student's course. */
export const NATIONAL_DEFAULTS: Record<Level, Rule> = {
    L: makeRule({ id: 'default-L', scopeLabel: 'default', levels: ['L'], finalExam: { min: 0, max: 5 }, provenance: { confidence: 'default', sources: [] } }),
    LM: makeRule({ id: 'default-LM', scopeLabel: 'default', levels: ['LM'], finalExam: { min: 0, max: 8 }, provenance: { confidence: 'default', sources: [] } }),
    LMCU: makeRule({ id: 'default-LMCU', scopeLabel: 'default', levels: ['LMCU'], finalExam: { min: 0, max: 10 }, provenance: { confidence: 'default', sources: [] } }),
};

export const src = (title: string, url: string) => ({ title, url });

export const PRESETS: Rule[] = [
    // Politecnico di Milano: one rule for the whole university.
    makeRule({
        id: 'polimi-L-LM', universityId: 'polimi', scopeLabel: 'Ateneo', levels: ['L', 'LM'],
        finalExam: { min: -1, max: 8 }, caps: { commissionMin: -1, commissionMax: 8 },
        lode: { rawThreshold: 111, evaluatedOn: 'preRounding' },
        provenance: { sources: [src('Regolamento esami di laurea', 'https://www.normativa.polimi.it/fileadmin/user_upload/regolamenti/studenti/Regolamento_esami_di_laurea_triennale_e_magistrale_-_Revisione.pdf')] },
    }),
    makeRule({
        id: 'polimi-LMCU', universityId: 'polimi', scopeLabel: 'Ateneo', levels: ['LMCU'],
        finalExam: { min: -1, max: 10 }, caps: { commissionMin: -1, commissionMax: 10 },
        lode: { rawThreshold: 111, evaluatedOn: 'preRounding' },
        provenance: { sources: [src('Regolamento esami di laurea', 'https://www.normativa.polimi.it/fileadmin/user_upload/regolamenti/studenti/Regolamento_esami_di_laurea_triennale_e_magistrale_-_Revisione.pdf')] },
    }),
    // Politecnico di Torino, bachelor: the worst 16 CFU are left out of the average.
    makeRule({
        id: 'polito-L', universityId: 'polito', scopeLabel: 'Ateneo', levels: ['L'],
        average: { dropWorst: { mode: 'cfu', amount: 16, allowPartial: false } },
        finalExam: { min: 0, max: 5 },
        provenance: { confidence: 'partial', sources: [src('Guida voto finale triennale', 'https://didattica.polito.it/guida/2026/it/determinazione_del_voto_finale_triennale?cds=477&sdu=32')] },
    }),
    makeRule({
        id: 'polito-LM', universityId: 'polito', scopeLabel: 'Ateneo', levels: ['LM'],
        finalExam: { min: 0, max: 8 }, caps: { commissionMin: null, commissionMax: 8 },
        provenance: { confidence: 'partial', sources: [src('Valutazione prova finale LM', 'https://www.polito.it/sites/default/files/2023-02/valutazione%20prova%20finale%20lm.pdf')] },
    }),
    // Bocconi: honours count 31 everywhere.
    makeRule({
        id: 'bocconi-L', universityId: 'bocconi', scopeLabel: 'Ateneo', levels: ['L'],
        average: { lodeValue: 31 }, finalExam: { min: 0, max: 4 },
        bonuses: [{ id: 'experience', kind: 'flag', label: 'stageExchange', points: 1 }],
        lode: { rawThreshold: 111, minFinalExamPoints: 3 },
        provenance: { sources: [src('Regolamento trienni 2024/25', 'https://www.unibocconi.it/sites/default/files/media/attachments/Regolamento%20trienni%202024-25.pdf')] },
    }),
    makeRule({
        id: 'bocconi-LM', universityId: 'bocconi', scopeLabel: 'Ateneo', levels: ['LM'],
        average: { lodeValue: 31 }, finalExam: { min: 0, max: 8 }, caps: { commissionMin: null, commissionMax: 8 },
        bonuses: [{ id: 'onTime', kind: 'flag', label: 'onTime', points: 1 }],
        lode: { rawThreshold: 111 },
        provenance: { sources: [src('Regolamento LM', 'https://www.unibocconi.it/sites/default/files/media/attachments/Regolamento-Corsi-di-Laurea-Magistrale-22-23.pdf')] },
    }),
    // LUISS: thesis range from the university guidelines; honours value not confirmed.
    makeRule({
        id: 'luiss-L-LM', universityId: 'luiss', scopeLabel: 'Ateneo', levels: ['L', 'LM'],
        finalExam: { min: 0, max: 6 }, lode: { minBase: 105 },
        provenance: { confidence: 'partial', sources: [src('Linee guida tesi 2023', 'https://www.luiss.it')], note: 'lodeUnverified' },
    }),
    makeRule({
        id: 'luiss-LMCU', universityId: 'luiss', scopeLabel: 'Ateneo', levels: ['LMCU'],
        finalExam: { min: 0, max: 7 }, lode: { minBase: 105 },
        provenance: { confidence: 'partial', sources: [src('Linee guida tesi 2023', 'https://www.luiss.it')], note: 'lodeUnverified' },
    }),
    // Ca' Foscari: university-wide bonus table.
    makeRule({
        id: 'unive-L', universityId: 'unive', scopeLabel: 'Ateneo', levels: ['L'],
        finalExam: { min: 0, max: 6 },
        bonuses: [
            { id: 'speed', kind: 'onTime', tiers: [{ label: 'summer3', points: 2 }, { label: 'autumn3', points: 1 }] },
            { id: 'mobility', kind: 'mobility', tiers: [{ cfuGte: 24, points: 2 }, { cfuGte: 12, points: 1 }], group: 'intl' },
            { id: 'doubleDegree', kind: 'flag', label: 'doubleDegree', points: 2, group: 'intl' },
            { id: 'summerSchool', kind: 'flag', label: 'summerSchool', points: 1 },
            { id: 'internshipAbroad', kind: 'flag', label: 'internshipAbroad', points: 2 },
        ],
        provenance: { sources: [src('Bonus triennali dal 2024/25', 'https://www.unive.it/pag/8329/')] },
    }),
    makeRule({
        id: 'unive-LM', universityId: 'unive', scopeLabel: 'Ateneo', levels: ['LM'],
        finalExam: { min: 1, max: 8 },
        bonuses: [
            { id: 'mobility', kind: 'mobility', tiers: [{ cfuGte: 24, points: 2 }, { cfuGte: 12, points: 1 }], group: 'intl' },
            { id: 'doubleDegree', kind: 'flag', label: 'doubleDegree', points: 2, group: 'intl' },
            { id: 'internshipAbroad', kind: 'flag', label: 'internshipAbroad', points: 2 },
        ],
        provenance: { sources: [src('Bonus magistrali dal 2024/25', 'https://www.unive.it/pag/8329/')] },
    }),
];

export const presetsFor = (universityId: string | null, level: Level): Rule[] =>
    universityId ? PRESETS.filter((r) => r.universityId === universityId && r.levels.includes(level)) : [];

/**
 * The rule picked by default when the student chooses a university: only a rule valid for the whole
 * university. A course rule (e.g. Federico II Informatica) is never picked for the student, since
 * other courses of the same university use other formulas; they choose it themselves.
 */
export const universityWideRule = (universityId: string | null, level: Level): Rule | undefined =>
    presetsFor(universityId, level).find((r) => r.scopeLabel === 'Ateneo');

export const findRule = (id: string): Rule | undefined =>
    PRESETS.find((r) => r.id === id) ?? Object.values(NATIONAL_DEFAULTS).find((r) => r.id === id);
