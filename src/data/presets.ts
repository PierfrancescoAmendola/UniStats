import { Level, Rule } from '../engine/types';

// Calculation rules read from official regulations (research of 2026-10-07, see
// ricerca-voti-universita.md). Rules belong to a course and cohort; a university-wide
// rule exists only for a few universities. Labels inside tiers and flags are i18n keys
// (bonus.*) so the same rule reads well in every language.

const F = 110 / 30;

type Partial2<T> = { [K in keyof T]?: T[K] extends object ? Partial<T[K]> : T[K] };

const make = (r: Omit<Partial2<Rule>, 'id'> & { id: string; levels: Level[]; finalExam: Rule['finalExam'] }): Rule => ({
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
    L: make({ id: 'default-L', scopeLabel: 'default', levels: ['L'], finalExam: { min: 0, max: 5 }, provenance: { confidence: 'default', sources: [] } }),
    LM: make({ id: 'default-LM', scopeLabel: 'default', levels: ['LM'], finalExam: { min: 0, max: 8 }, provenance: { confidence: 'default', sources: [] } }),
    LMCU: make({ id: 'default-LMCU', scopeLabel: 'default', levels: ['LMCU'], finalExam: { min: 0, max: 10 }, provenance: { confidence: 'default', sources: [] } }),
};

const src = (title: string, url: string) => ({ title, url });

export const PRESETS: Rule[] = [
    // Politecnico di Milano: one rule for the whole university.
    make({
        id: 'polimi-L-LM', universityId: 'polimi', scopeLabel: 'Ateneo', levels: ['L', 'LM'],
        finalExam: { min: -1, max: 8 }, caps: { commissionMin: -1, commissionMax: 8 },
        lode: { rawThreshold: 111, evaluatedOn: 'preRounding' },
        provenance: { sources: [src('Regolamento esami di laurea', 'https://www.normativa.polimi.it/fileadmin/user_upload/regolamenti/studenti/Regolamento_esami_di_laurea_triennale_e_magistrale_-_Revisione.pdf')] },
    }),
    make({
        id: 'polimi-LMCU', universityId: 'polimi', scopeLabel: 'Ateneo', levels: ['LMCU'],
        finalExam: { min: -1, max: 10 }, caps: { commissionMin: -1, commissionMax: 10 },
        lode: { rawThreshold: 111, evaluatedOn: 'preRounding' },
        provenance: { sources: [src('Regolamento esami di laurea', 'https://www.normativa.polimi.it/fileadmin/user_upload/regolamenti/studenti/Regolamento_esami_di_laurea_triennale_e_magistrale_-_Revisione.pdf')] },
    }),
    // Politecnico di Torino, bachelor: the worst 16 CFU are left out of the average.
    make({
        id: 'polito-L', universityId: 'polito', scopeLabel: 'Ateneo', levels: ['L'],
        average: { dropWorst: { mode: 'cfu', amount: 16, allowPartial: false } },
        finalExam: { min: 0, max: 5 },
        provenance: { confidence: 'partial', sources: [src('Guida voto finale triennale', 'https://didattica.polito.it/guida/2026/it/determinazione_del_voto_finale_triennale?cds=477&sdu=32')] },
    }),
    make({
        id: 'polito-LM', universityId: 'polito', scopeLabel: 'Ateneo', levels: ['LM'],
        finalExam: { min: 0, max: 8 }, caps: { commissionMin: null, commissionMax: 8 },
        provenance: { confidence: 'partial', sources: [src('Valutazione prova finale LM', 'https://www.polito.it/sites/default/files/2023-02/valutazione%20prova%20finale%20lm.pdf')] },
    }),
    // Statale di Milano, SPES/SIE faculty: honours count 33.
    make({
        id: 'unimi-sie-L', universityId: 'unimi', scopeLabel: 'Facoltà SPES/SIE', levels: ['L'],
        average: { lodeValue: 33 }, finalExam: { min: 0, max: 6 },
        bonuses: [
            { id: 'onTime', kind: 'onTime', tiers: [{ label: 'summerAutumn3', points: 3 }, { label: 'winter3', points: 1 }] },
            { id: 'erasmus', kind: 'flag', label: 'erasmus', points: 1 },
        ],
        lode: { rawThreshold: 110, strict: true },
        provenance: { sources: [src('Attribuzione punteggi prove finali', 'https://sie.cdl.unimi.it/sites/lb20/files/2025-03/Attribuzione_punteggi_prove_finali_%28v._dic%202024%29_1.pdf')] },
    }),
    make({
        id: 'unimi-sie-LM', universityId: 'unimi', scopeLabel: 'Facoltà SPES/SIE', levels: ['LM'],
        average: { lodeValue: 33 }, finalExam: { min: 0, max: 8 },
        bonuses: [{ id: 'erasmus', kind: 'flag', label: 'erasmus', points: 1 }],
        provenance: { sources: [src('Attribuzione punteggi prove finali', 'https://sie.cdl.unimi.it/sites/lb20/files/2025-03/Attribuzione_punteggi_prove_finali_%28v._dic%202024%29_1.pdf')] },
    }),
    // Milano-Bicocca, School of Economics and Statistics.
    make({
        id: 'unimib-econ-L', universityId: 'unimib', scopeLabel: 'Scuola di Economia e Statistica', levels: ['L'],
        average: { lodeValue: 33 }, finalExam: { min: 0, max: 5 },
        bonuses: [{ id: 'onTime', kind: 'onTime', tiers: [{ label: 'onTime', points: 4 }, { label: 'oneYearLate', points: 2 }] }],
        lode: { rawThreshold: 111 },
        provenance: { sources: [src('Attribuzione punteggio lauree', 'https://www.scuola-economia-statistica.unimib.it/sites/sc01/files/attribuzione_punteggio_lauree.pdf')] },
    }),
    make({
        id: 'unimib-econ-LM', universityId: 'unimib', scopeLabel: 'Scuola di Economia e Statistica', levels: ['LM'],
        average: { lodeValue: 33 }, finalExam: { min: 0, max: 7 },
        provenance: { sources: [src('Attribuzione punteggio lauree', 'https://www.scuola-economia-statistica.unimib.it/sites/sc01/files/attribuzione_punteggio_lauree.pdf')] },
    }),
    // Bocconi: honours count 31 everywhere.
    make({
        id: 'bocconi-L', universityId: 'bocconi', scopeLabel: 'Ateneo', levels: ['L'],
        average: { lodeValue: 31 }, finalExam: { min: 0, max: 4 },
        bonuses: [{ id: 'experience', kind: 'flag', label: 'stageExchange', points: 1 }],
        lode: { rawThreshold: 111, minFinalExamPoints: 3 },
        provenance: { sources: [src('Regolamento trienni 2024/25', 'https://www.unibocconi.it/sites/default/files/media/attachments/Regolamento%20trienni%202024-25.pdf')] },
    }),
    make({
        id: 'bocconi-LM', universityId: 'bocconi', scopeLabel: 'Ateneo', levels: ['LM'],
        average: { lodeValue: 31 }, finalExam: { min: 0, max: 8 }, caps: { commissionMin: null, commissionMax: 8 },
        bonuses: [{ id: 'onTime', kind: 'flag', label: 'onTime', points: 1 }],
        lode: { rawThreshold: 111 },
        provenance: { sources: [src('Regolamento LM', 'https://www.unibocconi.it/sites/default/files/media/attachments/Regolamento-Corsi-di-Laurea-Magistrale-22-23.pdf')] },
    }),
    // LUISS: thesis range from the university guidelines; honours value not confirmed.
    make({
        id: 'luiss-L-LM', universityId: 'luiss', scopeLabel: 'Ateneo', levels: ['L', 'LM'],
        finalExam: { min: 0, max: 6 }, lode: { minBase: 105 },
        provenance: { confidence: 'partial', sources: [src('Linee guida tesi 2023', 'https://www.luiss.it')], note: 'lodeUnverified' },
    }),
    make({
        id: 'luiss-LMCU', universityId: 'luiss', scopeLabel: 'Ateneo', levels: ['LMCU'],
        finalExam: { min: 0, max: 7 }, lode: { minBase: 105 },
        provenance: { confidence: 'partial', sources: [src('Linee guida tesi 2023', 'https://www.luiss.it')], note: 'lodeUnverified' },
    }),
    // Sapienza: rules differ per course.
    make({
        id: 'sapienza-ingamb-L', universityId: 'sapienza', scopeLabel: 'Ingegneria per l’Ambiente e il Territorio', levels: ['L'],
        conversion: { baseRounding: 'halfUp' }, finalExam: { min: 0, max: 6 },
        bonuses: [
            { id: 'lodi', kind: 'lodeCount', perLode: 1, everyN: 3 },
            { id: 'onTime', kind: 'onTime', tiers: [{ label: 'onTime', points: 2 }], minAvg30: 27 },
        ],
        lode: { minBase: 104 },
        provenance: { sources: [src('Regolamento punteggi laurea', 'https://cdaingambientale.web.uniroma1.it/sites/default/files/allegati/2025-10/REGOLAMENTO_PUNTEGGI_LAUREA.pdf')] },
    }),
    make({
        id: 'sapienza-econ-L', universityId: 'sapienza', scopeLabel: 'Economia', levels: ['L'],
        finalExam: { min: 0, max: 2 },
        bonuses: [
            { id: 'avg', kind: 'averageBand', on: 'avg30', bands: [{ gte: 28, points: 5 }, { gte: 26, points: 3 }] },
            { id: 'onTime', kind: 'flag', label: 'onTime', points: 1 },
        ],
        provenance: { sources: [src('Normativa prova finale', 'https://economia.web.uniroma1.it/sites/default/files/normativa_prova_finale_L_270.pdf')] },
    }),
    // Roma Tre engineering master's: honours 31, final grade truncated.
    make({
        id: 'roma3-ing-LM', universityId: 'roma3', scopeLabel: 'Ingegneria civile e informatica', levels: ['LM'],
        average: { lodeValue: 31 }, finalExam: { min: 0, max: 8 }, finalRounding: 'truncate',
        lode: { rawThreshold: 112 },
        provenance: { sources: [src('Regolamento tesi LM', 'https://ingegneriacivileinformaticatecnologieaeronautiche.uniroma3.it/wp-content/uploads/sites/13/file_locked/2020/06/Regolamento-Tesi-LM.pdf')] },
    }),
    // Tor Vergata economics: points by base band, base rounded first.
    make({
        id: 'torvergata-econ-L', universityId: 'torvergata', scopeLabel: 'Economia', levels: ['L'],
        conversion: { baseRounding: 'halfUp' }, finalExam: { min: 0, max: 4 },
        bonuses: [
            { id: 'career', kind: 'averageBand', on: 'base110', bands: [{ gte: 102, points: 4 }, { gte: 99, points: 3 }, { gte: 95, points: 2 }, { gte: 91, points: 1 }] },
            { id: 'onTime', kind: 'flag', label: 'onTime', points: 1 },
        ],
        provenance: { sources: [src('Prova finale e laurea', 'https://economia.uniroma2.it/public/ba/files/PROVA_FINALE_E_LAUREA_Giunta_03-09-19.pdf')] },
    }),
    // Bologna, law (single cycle).
    make({
        id: 'unibo-giur-LMCU', universityId: 'unibo', scopeLabel: 'Giurisprudenza', levels: ['LMCU'],
        finalExam: { min: 0, max: 5 },
        bonuses: [
            { id: 'lodi', kind: 'lodeCount', perLode: 0.25, max: 1 },
            { id: 'onTime', kind: 'flag', label: 'onTime', points: 1 },
            { id: 'mobility', kind: 'flag', label: 'erasmus', points: 1 },
            { id: 'internship', kind: 'flag', label: 'internship', points: 1 },
        ],
        lode: { minBase: 104 },
        provenance: { sources: [src('Criteri voto di laurea', 'https://corsi.unibo.it/magistralecu/Giurisprudenza-Bologna')] },
    }),
    // Padova economics (cohort 2022+, from July 2026): career table by base and session.
    make({
        id: 'unipd-econ-L', universityId: 'unipd', scopeLabel: 'Economia L-33 (coorte 2022+)', levels: ['L'],
        finalExam: { min: 1, max: 3 },
        bonuses: [
            { id: 'lodi', kind: 'lodeCount', perLode: 0.4, max: 2 },
            {
                id: 'career', kind: 'careerTable',
                sessions: ['jul3', 'sepOct3', 'dec3', 'mar3', 'jul4', 'sepOct4', 'dec4'],
                rows: [
                    { baseGt: 95, points: [8, 8, 7, 6, 5, 4, 3] },
                    { baseGt: 90, points: [6, 6, 5, 4, 3, 2, 1] },
                    { baseGt: 85, points: [4, 4, 3, 2, 1, 1, 0] },
                ],
            },
        ],
        lode: { rawThreshold: 112, minBase: 100, minFinalExamPoints: 2, automatic: true },
        provenance: { sources: [src('Regolamento TREC coorte 2022', 'https://www.economia.unipd.it')] },
    }),
    // Trento economics: honours 31, lowest grade dropped, ×3.86.
    make({
        id: 'unitn-dem-L', universityId: 'unitn', scopeLabel: 'Economia e Management (DEM)', levels: ['L'],
        average: { lodeValue: 31, dropWorst: { mode: 'exams', amount: 1, allowPartial: false } },
        conversion: { factor: 3.86 }, finalExam: { min: 0, max: 2 },
        bonuses: [
            { id: 'onTime', kind: 'flag', label: 'onTime', points: 1 },
            { id: 'mobility', kind: 'flag', label: 'erasmus', points: 1 },
            { id: 'language', kind: 'flag', label: 'languages', points: 1 },
            { id: 'internship', kind: 'flag', label: 'internship', points: 1 },
        ],
        lode: { rawThreshold: 111 },
        provenance: { sources: [src('Regolamento prova finale DEM 2025', 'https://corsi.unitn.it/sites/cds/files/2025-11/regolamento-prova-finale-lauree-dem-2025.pdf')] },
    }),
    // Politecnico di Bari, DEI bachelor: multiplicative formula.
    make({
        id: 'poliba-dei-L', universityId: 'poliba', scopeLabel: 'Dipartimento DEI', levels: ['L'],
        average: { dropWorst: { mode: 'cfu', amount: 12, allowPartial: true } },
        finalExam: { min: 0, max: 7 }, model: 'multiplicative',
        multiplier: { alphaMin: 1, alphaMax: 1.07, betaPerLode: 0.01, betaMax: 0.02, gammaTiers: [{ label: 'onTime', value: 0.02 }, { label: 'oneYearLate', value: 0.01 }] },
        lode: { rawThreshold: 111.5, strict: true },
        provenance: { sources: [src('Regolamento voto laurea triennale', 'https://dei.poliba.it/regolamento-voto-laurea-triennale/')] },
    }),
    // Ca' Foscari: university-wide bonus table.
    make({
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
    make({
        id: 'unive-LM', universityId: 'unive', scopeLabel: 'Ateneo', levels: ['LM'],
        finalExam: { min: 1, max: 8 },
        bonuses: [
            { id: 'mobility', kind: 'mobility', tiers: [{ cfuGte: 24, points: 2 }, { cfuGte: 12, points: 1 }], group: 'intl' },
            { id: 'doubleDegree', kind: 'flag', label: 'doubleDegree', points: 2, group: 'intl' },
            { id: 'internshipAbroad', kind: 'flag', label: 'internshipAbroad', points: 2 },
        ],
        provenance: { sources: [src('Bonus magistrali dal 2024/25', 'https://www.unive.it/pag/8329/')] },
    }),
    // Pavia economics CLEC.
    make({
        id: 'unipv-clec-L', universityId: 'unipv', scopeLabel: 'Economia (CLEC)', levels: ['L'],
        finalExam: { min: 0, max: 5 },
        bonuses: [
            { id: 'lodi', kind: 'lodeCount', perLode: 0.2 },
            { id: 'speed', kind: 'flag', label: 'speed', points: 2 },
        ],
        lode: { rawThreshold: 112 },
        provenance: { sources: [src('Regolamento CLEC 2026/27', 'https://economiaemanagement.dip.unipv.it')] },
    }),
    // Modena-Reggio economics.
    make({
        id: 'unimore-dce-L', universityId: 'unimore', scopeLabel: 'Economia (DCE)', levels: ['L'],
        finalExam: { min: 0, max: 3 },
        bonuses: [
            { id: 'lodi', kind: 'lodeCount', perLode: 0.2, max: 1 },
            { id: 'avg', kind: 'averageBand', on: 'base110', bands: [{ gte: 103, points: 3 }, { gte: 99, points: 2 }, { gte: 95, points: 1 }] },
            { id: 'onTime', kind: 'flag', label: 'onTime', points: 2 },
            { id: 'erasmus', kind: 'flag', label: 'erasmus', points: 2 },
        ],
        lode: { rawThreshold: 110, strict: true, automatic: true },
        provenance: { sources: [src('Regolamento punteggi tesi', 'https://dce.unimore.it')] },
    }),
    // Siena, School of Economics master's.
    make({
        id: 'unisi-sem-LM', universityId: 'unisi', scopeLabel: 'Economia e Management (SEM)', levels: ['LM'],
        average: { lodeValue: 31 }, finalExam: { min: 0, max: 8 },
        bonuses: [{ id: 'onTime', kind: 'flag', label: 'onTime', points: 1 }],
        lode: { rawThreshold: 111 },
        provenance: { sources: [src('Regolamento prova finale LM 2022', 'https://www.sem.unisi.it')] },
    }),
    // Firenze, law.
    make({
        id: 'unifi-giur', universityId: 'unifi', scopeLabel: 'Giurisprudenza', levels: ['L', 'LMCU'],
        finalExam: { min: 0, max: 7 },
        bonuses: [
            { id: 'onTime', kind: 'flag', label: 'onTime', points: 1 },
            { id: 'mobility', kind: 'flag', label: 'erasmus', points: 1 },
            { id: 'lodi', kind: 'lodeTiers', tiers: [{ gte: 5, points: 1 }] },
        ],
        provenance: { sources: [src('Voto di laurea Giurisprudenza', 'https://www.giurisprudenza.unifi.it')] },
    }),
    // Federico II, computer science bachelor (N86, DIETI): career average in /110, plus 1–6 from the
    // commission, 5 points for graduating within 3 academic years (2 within 4), and an average incentive
    // X*3/22 − 11 when X >= 81 (0 to 4 points). Honours need an average >= 28/30 and 110.
    make({
        id: 'unina-inf-L', universityId: 'unina', scopeLabel: 'Informatica (N86)', levels: ['L'],
        finalExam: { min: 1, max: 6 },
        bonuses: [
            { id: 'speed', kind: 'onTime', tiers: [{ label: 'onTime', points: 5 }, { label: 'oneYearLate', points: 2 }] },
            { id: 'avg', kind: 'averageLinear', from: 242 / 3, to: 110, maxPoints: 4, minBase: 81 },
        ],
        lode: { minBase: 28 * F },
        provenance: { sources: [src('Guida dello studente 2025/26, esame finale', 'https://informatica.dieti.unina.it/images/guide-studenti/GuidaTriennaleInformatica-25-26_v11.pdf')] },
    }),
    // Federico II, law: half-down rounding (from .51).
    make({
        id: 'unina-giur-LMCU', universityId: 'unina', scopeLabel: 'Giurisprudenza', levels: ['LMCU'],
        finalExam: { min: 0, max: 8 }, finalRounding: 'halfDown',
        bonuses: [
            { id: 'onTime', kind: 'flag', label: 'onTime', points: 2 },
            { id: 'abroad', kind: 'flag', label: 'erasmus', points: 1 },
        ],
        provenance: { sources: [src('Regolamento prova finale LMG01', 'https://www.giurisprudenza.unina.it')] },
    }),
    // Bari, DEMDI.
    make({
        id: 'uniba-demdi-L', universityId: 'uniba', scopeLabel: 'Economia (DEMDI)', levels: ['L'],
        finalExam: { min: 0, max: 4 },
        bonuses: [
            { id: 'onTime', kind: 'flag', label: 'onTime', points: 3 },
            { id: 'lodi', kind: 'lodeCount', perLode: 1, everyN: 3 },
            { id: 'erasmus', kind: 'flag', label: 'erasmus', points: 1 },
        ],
        provenance: { sources: [src('Prova finale DEMDI', 'https://www.uniba.it/it/ricerca/dipartimenti/demdi')] },
    }),
    // Brescia mechanical engineering: linear bonus on the base.
    make({
        id: 'unibs-mecc-L', universityId: 'unibs', scopeLabel: 'Ingegneria Meccanica', levels: ['L'],
        finalExam: { min: 0, max: 3 }, caps: { commissionMin: null, commissionMax: 10 },
        bonuses: [
            { id: 'avg', kind: 'averageLinear', from: 84, to: 99, maxPoints: 5 },
            { id: 'onTime', kind: 'flag', label: 'onTime', points: 1 },
            { id: 'lodi', kind: 'lodeTiers', tiers: [{ gte: 5, points: 2 }, { gte: 3, points: 1 }] },
            { id: 'abroad', kind: 'flag', label: 'erasmus', points: 1 },
        ],
        provenance: { sources: [src('Regolamento prove finali TIPP', 'https://corsi.unibs.it')] },
    }),
    // Bergamo management engineering.
    make({
        id: 'unibg-gest-L', universityId: 'unibg', scopeLabel: 'Ingegneria Gestionale', levels: ['L'],
        finalExam: { min: 0, max: 8 }, lode: { rawThreshold: 111 },
        provenance: { sources: [src('Modalità esame finale', 'https://www.unibg.it/sites/default/files/21033.pdf')] },
    }),
    // Insubria economics.
    make({
        id: 'uninsubria-dieco-L', universityId: 'uninsubria', scopeLabel: 'Economia (DiECO)', levels: ['L'],
        finalExam: { min: 0, max: 4 },
        bonuses: [
            { id: 'lodi', kind: 'lodeCount', perLode: 0.33 },
            { id: 'speed', kind: 'flag', label: 'speed', points: 3 },
        ],
        lode: { minBase: 103 },
        provenance: { confidence: 'partial', sources: [src('Esame di laurea DiECO', 'https://www.uninsubria.it')] },
    }),
    // Genova, bachelor course 8758: worst 30 CFU dropped.
    make({
        id: 'unige-8758-L', universityId: 'unige', scopeLabel: 'Corso 8758', levels: ['L'],
        average: { dropWorst: { mode: 'cfu', amount: 30, allowPartial: false } }, finalExam: { min: 0, max: 6 },
        bonuses: [{ id: 'speed', kind: 'onTime', tiers: [{ label: 'onTime', points: 4 }, { label: 'oneYearLate', points: 2 }] }],
        lode: { rawThreshold: 111 },
        provenance: { sources: [src('Laureandi prova finale', 'https://corsi.unige.it/corsi/8758/laureandi-prova-finale')] },
    }),
    // Pisa political science.
    make({
        id: 'unipi-scpol-L', universityId: 'unipi', scopeLabel: 'Scienze Politiche', levels: ['L'],
        finalExam: { min: 1, max: 5 },
        bonuses: [
            { id: 'lodi', kind: 'lodeCount', perLode: 0.33 },
            { id: 'onTime', kind: 'onTime', tiers: [{ label: 'onTime', points: 2 }, { label: 'oneYearLate', points: 1 }] },
        ],
        provenance: { sources: [src('Criteri voto di laurea', 'https://www.sp.unipi.it')] },
    }),
    // Perugia political science (cohort 2023+): base rounded first.
    make({
        id: 'unipg-scpol-L', universityId: 'unipg', scopeLabel: 'Scienze Politiche (coorte 2023+)', levels: ['L'],
        conversion: { baseRounding: 'halfUp' }, finalExam: { min: 0, max: 4 },
        bonuses: [
            { id: 'base', kind: 'averageBand', on: 'base110', bands: [{ gte: 101, points: 1 }] },
            { id: 'onTime', kind: 'flag', label: 'onTime', points: 2 },
            { id: 'erasmus', kind: 'flag', label: 'erasmus', points: 2 },
            { id: 'lodi', kind: 'lodeTiers', tiers: [{ gte: 3, points: 1 }] },
        ],
        provenance: { sources: [src('Info laurea triennale', 'https://scipol.unipg.it')] },
    }),
    // Calabria (one course's guidelines).
    make({
        id: 'unical-L', universityId: 'unical', scopeLabel: 'Linee guida CdS', levels: ['L', 'LM'],
        finalExam: { min: 0, max: 10 },
        bonuses: [
            { id: 'lodi', kind: 'lodeCount', perLode: 0.33 },
            { id: 'onTime', kind: 'flag', label: 'onTime', points: 1 },
        ],
        lode: { rawThreshold: 111 },
        provenance: { confidence: 'partial', sources: [src('Linee guida prova finale', 'https://corsi.unical.it')] },
    }),
    // Chieti-Pescara economics.
    make({
        id: 'unich-clem-L', universityId: 'unich', scopeLabel: 'Economia (CLEM)', levels: ['L'],
        finalExam: { min: 0, max: 5 },
        bonuses: [
            { id: 'lodi', kind: 'lodeCount', perLode: 0.4, max: 2 },
            { id: 'erasmus', kind: 'flag', label: 'erasmus', points: 2 },
        ],
        provenance: { sources: [src('Regolamento prova finale CLEM', 'https://clem.unich.it')] },
    }),
    // Catania medicine: arithmetic average, thesis 7 + reward 7, honours from 113.
    make({
        id: 'unict-med-LMCU', universityId: 'unict', scopeLabel: 'Medicina e Chirurgia', levels: ['LMCU'],
        average: { type: 'arithmetic' }, finalExam: { min: 0, max: 14 },
        lode: { rawThreshold: 113 },
        provenance: { sources: [src('Regolamento laurea Medicina', 'https://www.chirmed.unict.it')] },
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
